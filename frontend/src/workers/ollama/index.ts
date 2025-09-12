// --- Core Imports from Node and BullMQ ---
import http from 'http';
import type { Server } from 'http';
import type { Redis } from 'ioredis';
import { Worker, QueueEvents, type Processor } from 'bullmq';

// --- Dual-queue architecture ---
import { getConnection, INTERACTIVE_QUEUE_NAME, BACKGROUND_QUEUE_NAME } from '@/lib/queue';
import { llmBottleneck } from './llm-bottleneck';

// --- Project libs ---
import { resolveRedisUrl } from '@/lib/secrets';
import { bootstrap } from './boot';
import {
  clampInt,
  maskRedisUrl,
  buildTutorSystem,
  buildTutorUser,
  hardenAskPrompt,
  extractJson,
} from './utils';
import { getOllamaInfo, callOllama, pingOllama } from './ollama-client';
import { postProcessLlmResponse } from './llm-post-processing';
import { markdownifyBareUrls } from '@/lib/llm/links';

// --- Mission library ---
import { retrieveAndRefreshMission, _seedInitialMissionLibrary } from './mission-library';

// --- Types ---
import type {
  LlmJobData,
  LlmJobResult,
  TutorPreflightOutput,
  LinkPreview,
  Role,
} from '@/types/llm';

// --- Module state ---
let isShuttingDown = false;

// --- Main Application Logic ---
async function startApp() {
  // Separate concurrency settings for each worker pool
  const INTERACTIVE_CONCURRENCY = clampInt(process.env.INTERACTIVE_WORKER_CONCURRENCY, 1, 32, 16);
  const BACKGROUND_CONCURRENCY = clampInt(process.env.BACKGROUND_WORKER_CONCURRENCY, 1, 4, 2);

  const DEBUG = process.env.DEBUG_WORKER === '1';
  let primaryConn: Redis;
  let isHealthy = false;

  const healthServer: Server = http.createServer((_req, res) => {
    res.writeHead(isHealthy ? 200 : 503, { 'Content-Type': 'text/plain' });
    res.end(isHealthy ? 'ok' : 'service unavailable');
  });

  const port = process.env.PORT || 8080;
  healthServer.listen(port, () => console.log(`[WORKER] Health check server listening on port ${port}`));

  try {
    primaryConn = await getConnection();
    isHealthy = primaryConn.status === 'ready';
    primaryConn.on('ready', () => { isHealthy = true; });
    primaryConn.on('close', () => { isHealthy = false; });
    primaryConn.on('end', () => { isHealthy = false; });

    console.log('[worker] boot', {
      redisUrl: maskRedisUrl(await resolveRedisUrl()),
      ollama: { ...getOllamaInfo(), reachable: await pingOllama() },
    });

    // Seed the mission library once on startup
    await _seedInitialMissionLibrary();

    // ===========================================================================
    // INTERACTIVE PROCESSOR (High Concurrency, user-facing tasks)
    // ===========================================================================
    const interactiveProcessor: Processor<LlmJobData, LlmJobResult, string> = async (job) => {
      const { id, name, data } = job;
      const logPrefix = `[worker][interactive][${id}]`;
      console.log(`${logPrefix} picked up job.`, { name, type: data.type });

      try {
        if (data.type === 'ask') {
          const { prompt, context } = data.payload;
          await job.updateProgress(5);

          // Protect Ollama from high concurrency
          const rawAnswer = await llmBottleneck.submit(() =>
            callOllama(hardenAskPrompt(prompt, context), { temperature: 0.6 }),
          );

          const cleanedAnswer = postProcessLlmResponse(rawAnswer, {});
          const answerWithLinks = markdownifyBareUrls(cleanedAnswer);
          const links: LinkPreview[] = [];
          // If you add enrichment here, keep it try/catch and non-fatal

          return { type: 'ask', result: { answer: answerWithLinks, links } };
        }

        if (data.type === 'tutor-preflight') {
          const { mission, topicTitle, topicSummary, imageTitle, role } = data.payload;
          await job.updateProgress(5);

          const tryPreflightWithRole = async (currentRole: Role): Promise<TutorPreflightOutput> => {
            const system = buildTutorSystem(currentRole, mission, topicTitle, imageTitle);
            const user = buildTutorUser(topicSummary);

            const raw = await llmBottleneck.submit(() =>
              callOllama(`${system}\n\nUSER:\n${user}\n\nReturn JSON only.`, { temperature: 0.6 }),
            );

            if (DEBUG || currentRole !== role) {
              console.log(`${logPrefix} RAW LLM OUTPUT FOR PREFLIGHT (Role: ${currentRole}):\n---\n${raw}\n---`);
            }

            const parsed = extractJson<TutorPreflightOutput>(raw);
            if (
              !parsed ||
              !parsed.systemPrompt ||
              !parsed.starterMessages ||
              !parsed.warmupQuestion ||
              !parsed.difficultyHints
            ) {
              throw new Error(`Tutor-preflight (role: ${currentRole}): LLM returned malformed JSON.`);
            }
            return parsed;
          };

          try {
            const result = await tryPreflightWithRole(role);
            return { type: 'tutor-preflight', result };
          } catch (err) {
            console.warn(
              `${logPrefix} Tailored preflight for '${role}' failed. Retrying with 'explorer'.`,
              { error: (err as Error).message },
            );
            const fallbackResult = await tryPreflightWithRole('explorer');
            return { type: 'tutor-preflight', result: fallbackResult };
          }
        }

        console.warn(`${logPrefix} received unhandled job type: ${data.type}`);
        return { type: 'failure', error: { message: `Unsupported job type: ${data.type}` } };
      } catch (err: unknown) {
        const error = err as Error;
        const msg = error.message || String(err);
        console.error(`${logPrefix} ❌ job error`, { name, msg, stack: error?.stack });
        // Rethrow to mark the job as failed in BullMQ (so retries/backoff apply)
        throw err;
      }
    };

    const interactiveWorker = new Worker<LlmJobData, LlmJobResult, string>(
      INTERACTIVE_QUEUE_NAME,
      interactiveProcessor,
      {
        connection: primaryConn,
        concurrency: INTERACTIVE_CONCURRENCY,
        lockDuration: 90_000,
      }
    );

    // ===========================================================================
    // BACKGROUND PROCESSOR (Low Concurrency, non-urgent tasks)
    // ===========================================================================
    const backgroundProcessor: Processor<LlmJobData, LlmJobResult, string> = async (job) => {
      const { id, name, data } = job;
      const logPrefix = `[worker][background][${id}]`;
      console.log(`${logPrefix} picked up job.`, { name, type: data.type });

      try {
        if (data.type === 'mission') {
          const { missionType, role } = data.payload;
          await job.updateProgress(10);

          // Ensure retrieveAndRefreshMission internally uses llmBottleneck for any LLM calls it makes
          const missionPlan = await retrieveAndRefreshMission(missionType, role);

          await job.updateProgress(100);
          return { type: 'mission', result: missionPlan };
        }

        console.warn(`${logPrefix} received unhandled job type: ${data.type}`);
        return { type: 'failure', error: { message: `Unsupported job type: ${data.type}` } };
      } catch (err: unknown) {
        const error = err as Error;
        const msg = error.message || String(err);
        console.error(`${logPrefix} ❌ job error`, { name, msg, stack: error?.stack });
        // Rethrow to mark the job as failed in BullMQ (so retries/backoff apply)
        throw err;
      }
    };

    const backgroundWorker = new Worker<LlmJobData, LlmJobResult, string>(
      BACKGROUND_QUEUE_NAME,
      backgroundProcessor,
      {
        connection: primaryConn,
        concurrency: BACKGROUND_CONCURRENCY,
        lockDuration: 300_000, // 5 minutes
      }
    );

    // --- Queue events ---
    const interactiveEvents = new QueueEvents(INTERACTIVE_QUEUE_NAME, { connection: primaryConn });
    const backgroundEvents = new QueueEvents(BACKGROUND_QUEUE_NAME, { connection: primaryConn });

    interactiveEvents.on('failed', ({ jobId, failedReason }) =>
      console.error(`[worker][interactive] job failed`, { jobId, failedReason }),
    );
    backgroundEvents.on('failed', ({ jobId, failedReason }) =>
      console.error(`[worker][background] job failed`, { jobId, failedReason }),
    );

    interactiveWorker.on('ready', () =>
      console.log(
        `[worker] Interactive worker ready on "${INTERACTIVE_QUEUE_NAME}" (Concurrency: ${INTERACTIVE_CONCURRENCY})`,
      ),
    );
    backgroundWorker.on('ready', () =>
      console.log(
        `[worker] Background worker ready on "${BACKGROUND_QUEUE_NAME}" (Concurrency: ${BACKGROUND_CONCURRENCY})`,
      ),
    );

    interactiveWorker.on('error', (e) => console.error('[worker][interactive] error', e));
    backgroundWorker.on('error', (e) => console.error('[worker][background] error', e));

    // --- Shutdown logic to close all resources ---
    const shutdown = async () => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.log('[worker] shutting down...');
      isHealthy = false;

      await new Promise<void>((resolve) => healthServer.close(() => resolve()));

      // Close all workers and event listeners in parallel
      await Promise.all([
        interactiveWorker.close(),
        backgroundWorker.close(),
        interactiveEvents.close(),
        backgroundEvents.close(),
      ]);

      await primaryConn.quit().catch(() => { /* ignore */ });
      console.log('[worker] shutdown complete.');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (err) {
    isHealthy = false;
    console.error('[worker] FATAL BOOT ERROR:', err);
    process.exit(1);
  }
}

bootstrap().then(startApp);
