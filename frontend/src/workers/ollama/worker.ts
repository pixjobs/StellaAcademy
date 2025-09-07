// --- STEP 1: BOOTSTRAP THE ENVIRONMENT ---
import { bootstrap } from './boot';

/* eslint-disable no-console */

// --- STEP 2: IMPORT APPLICATION MODULES ---
import type { Server } from 'http';
import { Worker, QueueEvents } from 'bullmq';
import { connection, LLM_QUEUE_NAME } from '@/lib/queue';
import { startHealthServer } from './health';
import {
  clampInt,
  isRole,
  isMissionType,
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

// cache between jobs so we don’t keep re-importing
let cachedSearchFn: GoogleSearchFn | null = null;
let triedResolve = false;

async function resolveGoogleSearch(): Promise<GoogleSearchFn | undefined> {
  if (cachedSearchFn) return cachedSearchFn;
  if (triedResolve) return undefined; // don’t spam logs every job

  triedResolve = true;

  // Allow disabling from env easily
  const disabled =
    process.env.ENABLE_WEB_ENRICH === '0' ||
    process.env.DISABLE_WEB_ENRICH === '1';
  if (disabled) {
    console.warn('[worker] web enrichment disabled by env');
    return undefined;
  }

  try {
    // NOTE: Path alias “@/lib/search” requires tsconfig-paths/register.
    // boot.ts should import 'tsconfig-paths/register' – verify that’s in place.
    const mod: any = await import('@/lib/search');

    // Support both named and default export shapes
    const fn: unknown =
      mod?.googleCustomSearch ??
      mod?.default?.googleCustomSearch ??
      mod?.default; // if the file did: export default function googleCustomSearch(){}

    if (typeof fn === 'function') {
      cachedSearchFn = fn as GoogleSearchFn;
      const keys = Object.keys(mod || {});
      console.log('[worker] search module resolved', {
        exportKeys: keys,
        used: fn === mod.googleCustomSearch
          ? 'named googleCustomSearch'
          : fn === mod?.default?.googleCustomSearch
            ? 'default.googleCustomSearch'
            : 'default function',
      });
      return cachedSearchFn;
    }

    console.warn('[worker] search module loaded but no callable export found', {
      exportKeys: Object.keys(mod || {}),
    });
    return undefined;
  } catch (e) {
    console.warn('[worker] search module import failed; skipping web enrichment', {
      message: (e as Error)?.message || String(e),
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

  (async () => {
    healthServer = startHealthServer();
    const ollamaOk = await pingOllama();

    console.log('[worker] boot', {
      queue: LLM_QUEUE_NAME,
      redisUrl: maskRedisUrl(process.env.REDIS_URL),
      ollama: { ...getOllamaInfo(), reachable: ollamaOk },
      concurrency: CONCURRENCY,
      pid: process.pid,
      webEnrich: process.env.ENABLE_WEB_ENRICH ?? '(unset)',
    });
  })().catch((err) => {
    console.error('[worker] FATAL BOOT ERROR:', err);
    process.exit(1);
  });

  const worker = new Worker<LlmJobData, LlmJobResult>(
    LLM_QUEUE_NAME,
    async (job) => {
      const { id, name, data } = job;
      const logPrefix = `[worker][${id}]`;

      console.log(`${logPrefix} picked up job.`, { name, type: data.type });

      try {
        /* ----------------------------- mission ----------------------------- */
        if (data.type === 'mission') {
          console.log(`${logPrefix} 🚀 Starting 'mission' job.`, { payload: data.payload });

          const receivedMissionType = data.payload?.missionType;
          if (!isMissionType(receivedMissionType)) {
            console.error(`${logPrefix} ❌ Invalid missionType received.`, { received: receivedMissionType });
            throw new Error(`Invalid or missing missionType: "${receivedMissionType}". Job cannot proceed.`);
          }
          const missionType = receivedMissionType;
          const role = isRole(data.payload?.role) ? data.payload.role : 'explorer';

          console.log(`${logPrefix} Parameters validated successfully.`, { missionType, role });
          await job.updateProgress(5);

          console.log(`${logPrefix} Calling mission computer for '${missionType}'...`);
          const mission = await computeMission(role, missionType);
          console.log(`${logPrefix} ✅ Mission computer finished successfully.`);

          await job.updateProgress(100);
          return { type: 'mission', result: mission };
        }

        /* -------------------------------- ask ------------------------------ */
        if (data.type === 'ask') {
          console.log(`${logPrefix} 🗣️ Starting 'ask' job.`);
          const { prompt, context, role, mission } = data.payload;
          if (typeof prompt !== 'string' || !prompt) {
            throw new Error('Job payload is missing a valid prompt.');
          }

          const hardenedPrompt = hardenAskPrompt(prompt, context);

          await job.updateProgress(5);
          const rawAnswer = await callOllama(hardenedPrompt, { temperature: 0.6 });

          // Post-process model output (existing cleanup)
          const cleanedAnswer = postProcessLlmResponse(rawAnswer, {});
          // Convert bare URLs to Markdown links for clickable rendering
          const answerWithLinks = markdownifyBareUrls(cleanedAnswer);

          // Build structured links: extract + optional GCS enrichment
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
            console.warn(`${logPrefix} link enrichment failed (continuing):`, (e as Error)?.message || e);
          }

          await job.updateProgress(100);
          return {
            type: 'ask',
            result: {
              answer: answerWithLinks,
              links,
            },
          };
        }

        /* ----------------------- tutor-preflight (NEW) ---------------------- */
        if (data.type === 'tutor-preflight') {
          console.log(`${logPrefix} 🎓 Starting 'tutor-preflight' job.`, { payload: data.payload });

          const { mission, topicTitle, topicSummary, imageTitle, role } = (data as any).payload ?? {};
          if (!mission || !topicTitle || !topicSummary || !role) {
            throw new Error('Invalid tutor-preflight payload: mission, topicTitle, topicSummary, and role are required.');
          }

          await job.updateProgress(5);

          const system = buildTutorSystem(role, mission, topicTitle, imageTitle);
          const user = buildTutorUser(topicSummary);

          const raw = await callOllama(
            `${system}\n\nUSER:\n${user}\n\nReturn JSON only.`,
            { temperature: 0.6 }
          );

          const parsed = extractJson<TutorPreflightOutput>(raw);

          if (
            typeof parsed?.systemPrompt !== 'string' ||
            !Array.isArray(parsed?.starterMessages) ||
            typeof parsed?.warmupQuestion !== 'string' ||
            !parsed?.difficultyHints
          ) {
            console.error(`${logPrefix} tutor-preflight parsed (invalid)`, parsed);
            throw new Error('Tutor-preflight: JSON missing required fields.');
          }

          await job.updateProgress(100);
          return { type: 'tutor-preflight', result: parsed };
        }

        throw new Error(`Unknown job type: ${String((data as any).type)}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`${logPrefix} ❌ job error`, { name, msg, stack: (err as Error)?.stack });
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

  events.on('failed', ({ jobId, failedReason }) =>
    console.error(`[worker] job failed`, { jobId, failedReason })
  );
  if (DEBUG) {
    events.on('active', ({ jobId }) => console.log(`[worker] active`, { jobId }));
    events.on('completed', ({ jobId }) => console.log(`[worker] completed`, { jobId }));
  }

  worker.on('ready', () => console.log(`[worker] ready on "${LLM_QUEUE_NAME}"`));
  worker.on('error', (e) => console.error('[worker] error', e));

  const shutdown = async () => {
    console.log('[worker] shutting down...');
    if (healthServer) {
      await new Promise((resolve) => healthServer.close(resolve));
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
bootstrap().then(startApp);
