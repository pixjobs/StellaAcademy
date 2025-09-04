// --- STEP 1: BOOTSTRAP THE ENVIRONMENT ---
// We import and call the bootstrapper first to load environment variables.
import { bootstrap } from './boot';

// --- STEP 2: IMPORT APPLICATION MODULES ---
// All other imports happen AFTER the bootstrap is defined.
/* eslint-disable no-console */
import type { Server } from 'http';
import { Worker, QueueEvents } from 'bullmq';
import { connection, LLM_QUEUE_NAME } from '@/lib/queue';
import { startHealthServer } from './health';
import { clampInt, isRole, isMissionType, maskRedisUrl } from './utils';
import { getOllamaInfo, callOllama, pingOllama } from './ollama-client';
import { computeMission } from './mission-computer';
import { postProcessLlmResponse } from './llm-post-processing';
import type { LlmJobData, LlmJobResult } from '@/types/llm';

/**
 * The main application function. This is ONLY called after the bootstrap
 * process has successfully completed.
 */
function startApp() {
  /* ─────────────────────────────────────────────────────────
     Config & Environment (Now safe to read from process.env)
  ────────────────────────────────────────────────────────── */
  const CONCURRENCY = clampInt(process.env.OLLAMA_WORKER_CONCURRENCY, 1, 8, 1);
  const DEBUG = process.env.DEBUG_WORKER === '1';

  /* ─────────────────────────────────────────────────────────
     Worker Boot & Logging
  ────────────────────────────────────────────────────────── */
  let healthServer: Server;

  (async () => {
    healthServer = startHealthServer();
    const ollamaOk = await pingOllama();
    
    console.log('[worker] boot', {
      queue: LLM_QUEUE_NAME,
      redisUrl: maskRedisUrl(process.env.REDIS_URL),
      ollama: { ...getOllamaInfo(), reachable: ollamaOk },
      concurrency: CONCURRENCY,
      pid: process.pid,
    });
  })().catch((err) => {
    console.error('[worker] FATAL BOOT ERROR:', err);
    process.exit(1);
  });

  /* ─────────────────────────────────────────────────────────
     Main Worker Process
  ────────────────────────────────────────────────────────── */
  const worker = new Worker<LlmJobData, LlmJobResult>(
    LLM_QUEUE_NAME,
    async (job) => {
      const { id, name, data } = job;
      const logPrefix = `[worker][${id}]`;

      console.log(`${logPrefix} picked up job.`, { name, type: data.type });

      try {
        if (data.type === 'mission') {
          console.log(`${logPrefix} 🚀 Starting 'mission' job.`, { payload: data.payload });
          
          // --- ROBUST VALIDATION ---
          // No more silent fallbacks. If the type is invalid, the job will fail.
          const receivedMissionType = data.payload?.missionType;
          if (!isMissionType(receivedMissionType)) {
            console.error(`${logPrefix} ❌ Invalid missionType received.`, { received: receivedMissionType });
            throw new Error(`Invalid or missing missionType: "${receivedMissionType}". Job cannot proceed.`);
          }
          // From here on, 'missionType' is guaranteed to be a valid MissionType.
          const missionType = receivedMissionType;
          
          // Validate the role with a safe fallback, as it's less critical.
          const role = isRole(data.payload?.role) ? data.payload.role : 'explorer';
          
          console.log(`${logPrefix} Parameters validated successfully.`, { missionType, role });
          await job.updateProgress(5);
          
          console.log(`${logPrefix} Calling mission computer for '${missionType}'...`);
          const mission = await computeMission(role, missionType);
          console.log(`${logPrefix} ✅ Mission computer finished successfully.`);
          
          await job.updateProgress(100);
          return { type: 'mission', result: mission };
        }

        if (data.type === 'ask') {
          console.log(`${logPrefix} 🗣️ Starting 'ask' job.`);
          const { prompt, context } = data.payload;
          if (typeof prompt !== 'string' || !prompt) {
            throw new Error('Job payload is missing a valid prompt.');
          }
          const hardenedPrompt = context ? `Use the following context...\n${context}\n...to answer:\n${prompt}` : prompt;
          
          await job.updateProgress(5);
          const rawAnswer = await callOllama(hardenedPrompt, { temperature: 0.6 });
          const fixedAnswer = postProcessLlmResponse(rawAnswer, {});
          
          await job.updateProgress(100);
          return { type: 'ask', result: { answer: fixedAnswer } };
        }

        // This will catch any job types that are not explicitly handled.
        throw new Error(`Unknown job type: ${String((data as any).type)}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`${logPrefix} ❌ job error`, { name, msg, stack: (err as Error)?.stack });
        // Re-throw the error to ensure BullMQ marks the job as failed.
        throw err;
      }
    },
    {
      connection,
      concurrency: CONCURRENCY,
      lockDuration: 90_000, // 90 seconds
    }
  );

  /* ─────────────────────────────────────────────────────────
     Event Listeners & Graceful Shutdown
  ────────────────────────────────────────────────────────── */
  const events = new QueueEvents(LLM_QUEUE_NAME, { connection });

  events.on('failed', ({ jobId, failedReason }) => console.error(`[worker] job failed`, { jobId, failedReason }));
  if (DEBUG) {
    events.on('active', ({ jobId }) => console.log(`[worker] active`, { jobId }));
    events.on('completed', ({ jobId }) => console.log(`[worker] completed`, { jobId }));
  }

  worker.on('ready', () => console.log(`[worker] ready on "${LLM_QUEUE_NAME}"`));
  worker.on('error', (e) => console.error('[worker] error', e));

  const shutdown = async () => {
    console.log('[worker] shutting down...');
    if (healthServer) {
      await new Promise(resolve => healthServer.close(resolve));
    }
    await worker.close();
    await events.close();
    console.log('[worker] shutdown complete.');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// --- STEP 3: EXECUTE ---
// First, bootstrap the environment. If it succeeds, then start the app.
bootstrap().then(startApp);