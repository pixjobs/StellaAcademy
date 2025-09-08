// src/workers/ollama/worker.ts

// --- STEP 1: BOOTSTRAP THE ENVIRONMENT ---
import { bootstrap } from './boot';

// --- STEP 2: IMPORT APPLICATION MODULES ---
import type { Server } from 'http';
import type { Redis } from 'ioredis';
import { Worker, QueueEvents } from 'bullmq';

import { getConnection, getQueueName } from '@/lib/queue';
import { resolveRedisUrl } from '@/lib/secrets';
import { startHealthServer } from './health';

import {
  clampInt,
  maskRedisUrl,
  buildTutorSystem,
  buildTutorUser,
  hardenAskPrompt,
  extractJson,
} from './utils';
import { getOllamaInfo, callOllama, pingOllama } from './ollama-client';
import { computeMission } from './mission-computer';
import { postProcessLlmResponse } from './llm-post-processing';

// Link helpers (pure, local; safe on both server & worker)
import { markdownifyBareUrls, extractLinksFromText } from '@/lib/llm/links';

import type {
  LlmJobData,
  LlmJobResult,
  TutorPreflightOutput,
  LinkPreview,
} from '@/types/llm';

/* -------------------------------------------------------------------------- */
/*                  Dynamic, fail-soft Google search resolver                 */
/* -------------------------------------------------------------------------- */

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

  const disabled =
    process.env.ENABLE_WEB_ENRICH === '0' ||
    process.env.DISABLE_WEB_ENRICH === '1';
  if (disabled) {
    console.warn('[worker] web enrichment disabled by env');
    return undefined;
  }

  try {
    const mod = (await import('@/lib/search')) as SearchModule;

    const fn: unknown =
      mod?.googleCustomSearch ??
      (typeof mod?.default === 'function' ? mod.default : mod?.default?.googleCustomSearch);

    if (typeof fn === 'function') {
      cachedSearchFn = fn as GoogleSearchFn;
      console.log('[worker] search module resolved successfully.');
      return cachedSearchFn;
    }

    console.warn('[worker] search module loaded but no callable export found', {
      exportKeys: Object.keys(mod || {}),
    });
    return undefined;
  } catch (e) {
    const error = e as Error;
    console.warn('[worker] search module import failed; skipping web enrichment', {
      message: error?.message || String(e),
    });
    return undefined;
  }
}

/* -------------------------------------------------------------------------- */
/*                               Main start fn                                */
/* -------------------------------------------------------------------------- */

function startApp() {
  const CONCURRENCY = clampInt(process.env.OLLAMA_WORKER_CONCURRENCY, 1, 8, 1);
  const DEBUG = process.env.DEBUG_WORKER === '1';

  let healthServer: Server;
  let primaryConn: Redis | null = null;

  (async () => {
    healthServer = startHealthServer(() => primaryConn);

    const [ollamaOk, resolvedRedisUrl] = await Promise.all([
      pingOllama(),
      resolveRedisUrl(),
    ]);

    const queueName = getQueueName();
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

    primaryConn = await getConnection();

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
            await job.updateProgress(100);
            return { type: 'mission', result: mission };
          }
          
          else if (data.type === 'ask') {
            const { prompt, context, role, mission } = data.payload;
            await job.updateProgress(5);
            const rawAnswer = await callOllama(hardenAskPrompt(prompt, context), { temperature: 0.6 });
            const cleanedAnswer = postProcessLlmResponse(rawAnswer, {});
            const answerWithLinks = markdownifyBareUrls(cleanedAnswer);

            let links: LinkPreview[] = [];
            try {
              const inline = extractLinksFromText(answerWithLinks, 8);
              const baseQuery = [
                mission ? `[${mission}]` : '',
                role ? `[${role}]` : '',
                (context || '').slice(0, 240),
                (prompt || '').slice(0, 280),
              ]
                .filter(Boolean)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 360);

              const googleSearchFn = await resolveGoogleSearch();
              if (!googleSearchFn) {
                if (process.env.ENABLE_WEB_ENRICH !== '0' && process.env.DISABLE_WEB_ENRICH !== '1') {
                  console.warn(`${logPrefix} search module not available; skipping web enrichment`);
                }
              }

              const web = baseQuery && googleSearchFn ? await googleSearchFn(baseQuery, 5) : [];
              const seen = new Set(inline.map((l) => l.url));
              const merged = [...inline, ...web.filter((w) => !seen.has(w.url))];
              links = merged.slice(0, 8);
            } catch (e) {
              const error = e as Error;
              console.warn(`${logPrefix} link enrichment failed (continuing):`, error?.message || e);
            }

            await job.updateProgress(100);
            return { type: 'ask', result: { answer: answerWithLinks, links } };
          }
          
          else if (data.type === 'tutor-preflight') {
            const payload = data.payload;
            console.log(`${logPrefix} 🎓 Starting 'tutor-preflight' job.`, { payload });

            const { mission, topicTitle, topicSummary, imageTitle, role } = payload;
            if (!mission || !topicTitle || !topicSummary || !role) {
              throw new Error('Invalid tutor-preflight payload: mission, topicTitle, topicSummary, and role are required.');
            }

            await job.updateProgress(5);

            const system = buildTutorSystem(role, mission, topicTitle, imageTitle);
            const user = buildTutorUser(topicSummary);

            const raw = await callOllama(`${system}\n\nUSER:\n${user}\n\nReturn JSON only.`, { temperature: 0.6 });
            
            // ===== PATCH #1: Add critical diagnostic logging =====
            // This will print the raw LLM output to your worker's console,
            // allowing you to see exactly why it might be failing to parse.
            console.log(`${logPrefix} RAW LLM OUTPUT FOR PREFLIGHT:\n---\n${raw}\n---`);
            
            const parsed = extractJson<TutorPreflightOutput>(raw);

            // ===== PATCH #2: Improve validation and error messaging =====
            if (
              !parsed ||
              typeof parsed.systemPrompt !== 'string' ||
              !Array.isArray(parsed.starterMessages) ||
              typeof parsed.warmupQuestion !== 'string' ||
              !parsed.difficultyHints
            ) {
              // Log the raw response along with the failed parsed object for easy debugging.
              console.error(`${logPrefix} tutor-preflight validation failed.`, { parsedObject: parsed, rawResponse: raw });
              // Throw a more specific error that will be visible on the frontend.
              throw new Error('Tutor-preflight: LLM returned incomplete or malformed JSON. Check worker logs for the raw response.');
            }

            await job.updateProgress(100);
            return { type: 'tutor-preflight', result: parsed };
          }

          else {
            const _exhaustiveCheck: never = data;
            throw new Error(`Unhandled job type: ${(_exhaustiveCheck as LlmJobData).type}`);
          }
        } catch (err: unknown) {
          const error = err as Error;
          const msg = error.message || String(err);
          console.error(`${logPrefix} ❌ job error`, { name, msg, stack: error?.stack });
          throw err;
        }
      },
      {
        connection: primaryConn!,
        concurrency: CONCURRENCY,
        lockDuration: 90_000,
      }
    );

    const events = new QueueEvents(queueName, { connection: primaryConn! });

    events.on('failed', ({ jobId, failedReason }) => console.error(`[worker] job failed`, { jobId, failedReason }));
    if (DEBUG) {
      events.on('active', ({ jobId }) => console.log(`[worker] active`, { jobId }));
      events.on('completed', ({ jobId }) => console.log(`[worker] completed`, { jobId }));
    }

    worker.on('ready', () => console.log(`[worker] ready on "${queueName}"`));
    worker.on('error', (e) => console.error('[worker] error', e));

    const shutdown = async () => {
      console.log('[worker] shutting down...');
      if (healthServer) {
        await new Promise<void>((resolve) => healthServer.close(() => resolve()));
      }
      await worker.close();
      await events.close();
      if (primaryConn) {
        try { await primaryConn.quit(); } catch {}
      }
      console.log('[worker] shutdown complete.');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })().catch((err) => {
    console.error('[worker] FATAL BOOT ERROR:', err);
    process.exit(1);
  });
}

bootstrap().then(startApp);