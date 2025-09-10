// src/workers/ollama/worker.ts

// --- Core Imports from Node and BullMQ ---
import http from 'http';
import type { Server } from 'http';
import type { Redis } from 'ioredis';
import { Worker, QueueEvents } from 'bullmq';

// --- Imports from your new, modular library files ---
// This is the key change: We use the centralized connection logic.
import { getConnection, getQueueName } from '@/lib/queue';
import { resolveRedisUrl } from '@/lib/secrets';

// --- Imports for your specific worker's business logic (KEEP ALL OF THESE) ---
import { bootstrap } from './boot'; // Assuming this file exists alongside your worker
import {
  clampInt,
  maskRedisUrl,
  buildTutorSystem,
  buildTutorUser,
  hardenAskPrompt,
  extractJson,
} from './utils'; // Assuming this file exists
import { getOllamaInfo, callOllama, pingOllama } from './ollama-client'; // Assuming this file exists
import { computeMission } from './mission-computer'; // Assuming this file exists
import { postProcessLlmResponse } from './llm-post-processing'; // Assuming this file exists
import { markdownifyBareUrls, extractLinksFromText } from '@/lib/llm/links';
import type {
  LlmJobData,
  LlmJobResult,
  TutorPreflightOutput,
  LinkPreview,
} from '@/types/llm';


// --- Web Search Enrichment Logic (from your working file) ---
type GoogleSearchFn = (q: string, n?: number) => Promise<LinkPreview[]>;
interface SearchModule {
  googleCustomSearch?: GoogleSearchFn;
  default?: GoogleSearchFn | { googleCustomSearch?: GoogleSearchFn };
}
let cachedSearchFn: GoogleSearchFn | null = null;
let triedResolve = false;

async function resolveGoogleSearch(): Promise<GoogleSearchFn | undefined> {
  if (cachedSearchFn) return cachedSearchFn;
  if (triedResolve) return undefined;
  triedResolve = true;

  const disabled = process.env.ENABLE_WEB_ENRICH === '0' || process.env.DISABLE_WEB_ENRICH === '1';
  if (disabled) {
    console.warn('[worker] web enrichment disabled by env');
    return undefined;
  }

  try {
    const mod = (await import('@/lib/search')) as SearchModule;
    const fn: unknown = mod?.googleCustomSearch ?? (typeof mod?.default === 'function' ? mod.default : mod?.default?.googleCustomSearch);
    if (typeof fn === 'function') {
      cachedSearchFn = fn as GoogleSearchFn;
      console.log('[worker] search module resolved successfully.');
      return cachedSearchFn;
    }
    return undefined;
  } catch (e) {
    console.warn('[worker] search module import failed', { message: (e as Error)?.message });
    return undefined;
  }
}

// --- Main Application Logic (from your working file) ---
async function startApp() {
  const CONCURRENCY = clampInt(process.env.OLLAMA_WORKER_CONCURRENCY, 1, 8, 1);
  const DEBUG = process.env.DEBUG_WORKER === '1';

  let primaryConn: Redis | null = null;

  // Your superior, state-aware health check server
  const healthServer: Server = http.createServer((_req, res) => {
    // This correctly checks the LIVE status of the Redis connection object.
    const isHealthy = primaryConn?.status === 'ready';
    res.writeHead(isHealthy ? 200 : 503, { 'Content-Type': 'text/plain' });
    res.end(isHealthy ? 'ok' : 'service unavailable');
  });

  const port = process.env.PORT || 8080;
  healthServer.listen(port, () => {
    console.log(`[WORKER] Health check server listening on port ${port}`);
  });

  try {
    const [ollamaOk, resolvedRedisUrl] = await Promise.all([
      pingOllama(),
      resolveRedisUrl(), // From secrets.ts
    ]);

    const queueName = getQueueName(); // From queue.ts
    if (!queueName || typeof queueName !== 'string') {
      throw new Error('Queue name resolved empty/invalid. Check getQueueName().');
    }

    console.log('[worker] boot', {
      queue: queueName,
      redisUrl: maskRedisUrl(resolvedRedisUrl),
      ollama: { ...getOllamaInfo(), reachable: ollamaOk },
      concurrency: CONCURRENCY,
      pid: process.pid,
      webEnrich: process.env.ENABLE_WEB_ENRICH ?? '(unset)',
    });

    // CRITICAL: Use getConnection() from queue.ts to get the shared, robust connection
    primaryConn = await getConnection();

    // Your complete, correct worker implementation
    const worker = new Worker<LlmJobData, LlmJobResult>(
      queueName,
      async (job) => {
        const { id, name, data } = job;
        const logPrefix = `[worker][${id}]`;
        console.log(`${logPrefix} picked up job.`, { name, type: data.type });

        try {
          if (data.type === 'mission') {
            const { missionType, role } = data.payload;
            await job.updateProgress(5);
            const mission = await computeMission(role, missionType);
            return { type: 'mission', result: mission };
          }

          if (data.type === 'ask') {
            const { prompt, context, role, mission } = data.payload;
            await job.updateProgress(5);
            const rawAnswer = await callOllama(hardenAskPrompt(prompt, context), { temperature: 0.6 });
            const cleanedAnswer = postProcessLlmResponse(rawAnswer, {});
            const answerWithLinks = markdownifyBareUrls(cleanedAnswer);
            let links: LinkPreview[] = [];
            try {
              const inline = extractLinksFromText(answerWithLinks, 8);
              const baseQuery = [ mission ? `[${mission}]` : '', role ? `[${role}]` : '', (context || '').slice(0, 240), (prompt || '').slice(0, 280), ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim().slice(0, 360);
              const googleSearchFn = await resolveGoogleSearch();
              if (!googleSearchFn && process.env.ENABLE_WEB_ENRICH !== '0' && process.env.DISABLE_WEB_ENRICH !== '1') {
                console.warn(`${logPrefix} search module not available; skipping web enrichment`);
              }
              const web = baseQuery && googleSearchFn ? await googleSearchFn(baseQuery, 5) : [];
              const seen = new Set(inline.map((l) => l.url));
              links = [...inline, ...web.filter((w) => !seen.has(w.url))].slice(0, 8);
            } catch (e) {
              console.warn(`${logPrefix} link enrichment failed (continuing):`, (e as Error)?.message || e);
            }
            return { type: 'ask', result: { answer: answerWithLinks, links } };
          }

          if (data.type === 'tutor-preflight') {
            const { mission, topicTitle, topicSummary, imageTitle, role } = data.payload;
            if (!mission || !topicTitle || !topicSummary || !role) {
              throw new Error('Invalid tutor-preflight payload: mission, topicTitle, topicSummary, and role are required.');
            }
            await job.updateProgress(5);
            const system = buildTutorSystem(role, mission, topicTitle, imageTitle);
            const user = buildTutorUser(topicSummary);
            const raw = await callOllama(`${system}\n\nUSER:\n${user}\n\nReturn JSON only.`, { temperature: 0.6 });
            console.log(`${logPrefix} RAW LLM OUTPUT FOR PREFLIGHT:\n---\n${raw}\n---`);
            const parsed = extractJson<TutorPreflightOutput>(raw);
            if (!parsed || typeof parsed.systemPrompt !== 'string' || !Array.isArray(parsed.starterMessages) || typeof parsed.warmupQuestion !== 'string' || !parsed.difficultyHints) {
              console.error(`${logPrefix} tutor-preflight validation failed.`, { parsedObject: parsed, rawResponse: raw });
              throw new Error('Tutor-preflight: LLM returned incomplete or malformed JSON. Check worker logs for the raw response.');
            }
            return { type: 'tutor-preflight', result: parsed };
          }

          const _exhaustiveCheck: never = data;
          throw new Error(`Unhandled job type: ${(_exhaustiveCheck as LlmJobData).type}`);

        } catch (err: unknown) {
          const error = err as Error;
          const msg = error.message || String(err);
          console.error(`${logPrefix} ❌ job error`, { name, msg, stack: error?.stack });
          throw err;
        }
      },
      {
        connection: primaryConn, // Use the connection from getConnection()
        concurrency: CONCURRENCY,
        lockDuration: 90_000,
        stalledInterval: 300_000,
      }
    );

    const events = new QueueEvents(queueName, { connection: primaryConn });
    events.on('failed', ({ jobId, failedReason }) => console.error(`[worker] job failed`, { jobId, failedReason }));
    if (DEBUG) {
      events.on('active', ({ jobId }) => console.log(`[worker] active`, { jobId }));
      events.on('completed', ({ jobId }) => console.log(`[worker] completed`, { jobId }));
    }
    worker.on('ready', () => console.log(`[worker] ready on "${queueName}"`));
    worker.on('error', (e) => console.error('[worker] error', e));

    // Your superior, state-aware shutdown function
    const shutdown = async () => {
      console.log('[worker] shutting down...');
      await new Promise<void>((resolve) => healthServer.close(() => resolve()));
      await worker.close();
      await events.close();
      await primaryConn?.quit().catch(() => { /* ignore errors on quit */ });
      console.log('[worker] shutdown complete.');
      process.exit(0);
    };

    // Use your shutdown function, NOT the generic one from queue.ts
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (err) {
    console.error('[worker] FATAL BOOT ERROR:', err);
    process.exit(1);
  }
}

// Keep your bootstrap logic
bootstrap().then(startApp);