// --- Core Imports from Node and BullMQ ---
import http from 'http';
import type { Server } from 'http';
import type { Redis } from 'ioredis';
import { Worker, QueueEvents, type Processor } from 'bullmq';

// --- Dual-queue architecture & bottleneck ---
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
  hashMissionPlan,
} from './utils';
import { getOllamaInfo, callOllama, pingOllama } from './ollama-client';
import { postProcessLlmResponse } from './llm-post-processing';
import { markdownifyBareUrls, extractLinksFromText } from '@/lib/llm/links';

// --- Types ---
import type {
  LlmJobData,
  LlmJobResult,
  TutorPreflightOutput,
  LinkPreview,
  Role,
  MissionType,
  EnrichedMissionPlan, // use from llm types to avoid mismatches
} from '@/types/llm';

// ===== FIRESTORE & REDIS INTEGRATION =====
import { Firestore, Timestamp } from '@google-cloud/firestore';
const db = new Firestore();
// =========================================

// --- Optional Web Search Enrichment ---
type GoogleSearchFn = (q: string, n?: number) => Promise<LinkPreview[]>;
interface SearchModule { googleCustomSearch?: GoogleSearchFn; default?: any; }
let cachedSearchFn: GoogleSearchFn | null = null;
let triedResolve = false;

async function resolveGoogleSearch(): Promise<GoogleSearchFn | undefined> {
  if (cachedSearchFn) return cachedSearchFn;
  if (triedResolve) return undefined;
  triedResolve = true;
  const disabled = process.env.ENABLE_WEB_ENRICH === '0' || process.env.DISABLE_WEB_ENRICH === '1';
  if (disabled) return undefined;
  try {
    const mod = (await import('@/lib/search')) as SearchModule;
    const fn =
      mod?.googleCustomSearch ??
      (typeof mod?.default === 'function' ? mod.default : mod?.default?.googleCustomSearch);
    if (typeof fn === 'function') {
      cachedSearchFn = fn as GoogleSearchFn;
      return cachedSearchFn;
    }
  } catch {
    // noop
  }
  return undefined;
}

// =================================================================================
// ETERNAL LIBRARY V2: Self-Populating, De-Duplicated Mission Pool
// =================================================================================

const MIN_VARIANTS_PER_ROLE = 25;
const MAX_VARIANTS_PER_ROLE = 50;
const MAX_GENERATION_ATTEMPTS = 5; // Max retries to find a unique mission
const USER_SEEN_MISSIONS_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

type MissionVariant = {
  id: string;
  generatedAt: Timestamp;
  role: Role;
  plan: EnrichedMissionPlan;
  contentHash: string;
};

/**
 * Generate a new, unique mission plan. LLM calls are bottlenecked.
 */
async function generateUniqueMission(
  missionType: MissionType,
  role: Role,
  attempt = 1,
): Promise<EnrichedMissionPlan | null> {
  if (attempt > MAX_GENERATION_ATTEMPTS) {
    console.error(
      `[library] Failed to generate a unique mission for ${missionType}/${role} after ${MAX_GENERATION_ATTEMPTS} attempts.`,
    );
    return null;
  }

  const seedIndex = Date.now() + attempt;
  // If computeMission internally calls LLM, protect it with the bottleneck.
  const newPlan = await llmBottleneck.submit(() =>
    // NOTE: computeMission(role, missionType, { seedIndex }) — ensure arg order is correct for your impl
    // If your signature is (role, missionType, opts), this is correct:
    import('./mission-computer').then((m) => m.computeMission(role, missionType, { seedIndex })),
  );

  const newHash = hashMissionPlan(newPlan);
  const variantsRef = db.collection('mission_plans').doc(missionType).collection('variants');
  const duplicateCheck = await variantsRef.where('contentHash', '==', newHash).limit(1).get();

  if (!duplicateCheck.empty) {
    console.warn(
      `[library] Duplicate content detected for ${missionType}/${role} (hash: ${newHash.substring(
        0,
        8,
      )}). Retrying...`,
    );
    return generateUniqueMission(missionType, role, attempt + 1);
  }

  return newPlan;
}

/**
 * Background enrichment to maintain a healthy pool size per role.
 */
async function enrichLibraryInBackground(
  missionType: MissionType,
  role: Role,
  existingCount: number,
): Promise<void> {
  const logPrefix = `[library][${missionType}][${role}]`;
  const deficit = MIN_VARIANTS_PER_ROLE - existingCount;

  if (deficit <= 0) {
    // Optional pruning if existingCount > MAX_VARIANTS_PER_ROLE
    return;
  }

  console.log(
    `${logPrefix} Pool is underpopulated (${existingCount}/${MIN_VARIANTS_PER_ROLE}). Generating ${deficit} new unique variants...`,
  );

  try {
    const generationPromises = Array.from({ length: deficit }, () =>
      generateUniqueMission(missionType, role),
    );
    const newPlans = (await Promise.all(generationPromises)).filter(
      (p): p is EnrichedMissionPlan => p !== null,
    );

    if (newPlans.length === 0) {
      console.error(
        `${logPrefix} Failed to generate any new unique variants after all attempts.`,
      );
      return;
    }

    const collectionRef = db.collection('mission_plans').doc(missionType).collection('variants');
    const batch = db.batch();
    for (const plan of newPlans) {
      const docRef = collectionRef.doc();
      const contentHash = hashMissionPlan(plan);
      batch.set(docRef, { generatedAt: Timestamp.now(), role, plan, contentHash });
    }
    await batch.commit();
    console.log(`${logPrefix} Successfully added ${newPlans.length} new unique variants.`);
  } catch (err) {
    console.error(`${logPrefix} CRITICAL: Background enrichment failed.`, {
      error: (err as Error).message,
    });
  }
}

/**
 * Retrieve a mission plan for a given role, preferring unseen variants.
 * Reuses the provided Redis connection (avoid creating new ones).
 */
async function retrieveAndRefreshMission(
  missionType: MissionType,
  role: Role,
  redis: Redis,
): Promise<EnrichedMissionPlan> {
  const logPrefix = `[library][${missionType}]`;
  const variantsRef = db.collection('mission_plans').doc(missionType).collection('variants');
  const userSeenKey = `user:${role}:seen-missions:${missionType}`;

  const [roleDocs, genericDocs, seenMissionIds] = await Promise.all([
    variantsRef.where('role', '==', role).get(),
    variantsRef.where('role', '==', 'explorer').get(),
    redis.smembers(userSeenKey),
  ]);

  const rolePool: MissionVariant[] = roleDocs.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as MissionVariant),
  );
  const genericPool: MissionVariant[] = genericDocs.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as MissionVariant),
  );

  let chosenVariant: MissionVariant | undefined;
  const unseenRole = rolePool.filter((v) => !seenMissionIds.includes(v.id));
  if (unseenRole.length > 0) {
    chosenVariant = unseenRole[Math.floor(Math.random() * unseenRole.length)];
  } else {
    const unseenGeneric = genericPool.filter((v) => !seenMissionIds.includes(v.id));
    if (unseenGeneric.length > 0) {
      chosenVariant = unseenGeneric[Math.floor(Math.random() * unseenGeneric.length)];
    } else {
      console.warn(
        `${logPrefix} User '${role}' has seen all available missions. Resetting history.`,
      );
      await redis.del(userSeenKey);
      const combinedPool = [...rolePool, ...genericPool];
      if (combinedPool.length > 0) {
        chosenVariant = combinedPool[Math.floor(Math.random() * combinedPool.length)];
      }
    }
  }

  // Backfill pools in the background if they're low.
  if (rolePool.length < MIN_VARIANTS_PER_ROLE) {
    void enrichLibraryInBackground(missionType, role, rolePool.length);
  }
  if (genericPool.length < MIN_VARIANTS_PER_ROLE) {
    void enrichLibraryInBackground(missionType, 'explorer', genericPool.length);
  }

  // If everything is empty, synchronously generate a fallback.
  if (!chosenVariant) {
    console.error(`${logPrefix} CRITICAL: Library is empty. Generating a unique mission now.`);
    const newPlan = await generateUniqueMission(missionType, role);
    if (!newPlan) {
      throw new Error(`Failed to generate a fallback mission for ${missionType}/${role}.`);
    }
    return {
      ...newPlan,
      introduction: newPlan.introduction.replace(/welcome.*?\./i, `Welcome, ${role}.`),
    };
  }

  // Mark this variant as seen for this role
  void redis.sadd(userSeenKey, chosenVariant.id).then(() =>
    redis.expire(userSeenKey, USER_SEEN_MISSIONS_TTL_SECONDS),
  );

  return {
    ...chosenVariant.plan,
    introduction: chosenVariant.plan.introduction.replace(/welcome.*?\./i, `Welcome, ${role}.`),
  };
}

// ------------------------------ Main Application Logic ------------------------------

let isShuttingDown = false;

async function startApp() {
  const INTERACTIVE_CONCURRENCY = clampInt(
    process.env.INTERACTIVE_WORKER_CONCURRENCY,
    1,
    32,
    16,
  );
  const BACKGROUND_CONCURRENCY = clampInt(
    process.env.BACKGROUND_WORKER_CONCURRENCY,
    1,
    4,
    2,
  );
  const DEBUG = process.env.DEBUG_WORKER === '1';

  let primaryConn: Redis;
  let isHealthy = false;

  const healthServer: Server = http.createServer((_req, res) => {
    res.writeHead(isHealthy ? 200 : 503, { 'Content-Type': 'text/plain' });
    res.end(isHealthy ? 'ok' : 'service unavailable');
  });

  const port = process.env.PORT || 8080;
  healthServer.listen(port, () =>
    console.log(`[WORKER] Health check server listening on port ${port}`),
  );

  try {
    primaryConn = await getConnection();
    isHealthy = primaryConn.status === 'ready';
    primaryConn.on('ready', () => {
      isHealthy = true;
    });
    primaryConn.on('close', () => {
      isHealthy = false;
    });
    primaryConn.on('end', () => {
      isHealthy = false;
    });

    console.log('[worker] boot', {
      redisUrl: maskRedisUrl(await resolveRedisUrl()),
      ollama: { ...getOllamaInfo(), reachable: await pingOllama() },
    });

    // ---------------------- INTERACTIVE PROCESSOR ----------------------
    const interactiveProcessor: Processor<LlmJobData, LlmJobResult, string> = async (job) => {
      const { id, name, data } = job;
      const logPrefix = `[worker][interactive][${id}]`;
      console.log(`${logPrefix} picked up job.`, { name, type: data.type });

      try {
        if (data.type === 'ask') {
          const { prompt, context } = data.payload;
          await job.updateProgress(5);

          const rawAnswer = await llmBottleneck.submit(() =>
            callOllama(hardenAskPrompt(prompt, context), { temperature: 0.6 }),
          );

          const cleanedAnswer = postProcessLlmResponse(rawAnswer, {});
          const answerWithLinks = markdownifyBareUrls(cleanedAnswer);

          let links: LinkPreview[] = [];
          try {
            const inline = extractLinksFromText(answerWithLinks, 8);
            const baseQuery = [ (context || '').slice(0, 240), (prompt || '').slice(0, 280) ]
              .filter(Boolean)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 360);
            const googleSearchFn = await resolveGoogleSearch();
            if (googleSearchFn) {
              const web = await googleSearchFn(baseQuery, 5);
              const seen = new Set(inline.map((l) => l.url));
              links = [...inline, ...web.filter((w) => !seen.has(w.url))].slice(0, 8);
            } else {
              links = inline;
            }
          } catch (e) {
            console.warn(`${logPrefix} link enrichment failed (continuing):`, (e as Error)?.message || e);
          }

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

        // No other types belong to the interactive worker
        return { type: 'failure', error: { message: `Unsupported job type: ${data.type}` } };
      } catch (err: unknown) {
        const error = err as Error;
        const msg = error.message || String(err);
        console.error(`${logPrefix} ❌ job error`, { name, msg, stack: error?.stack });
        throw err; // Let BullMQ handle retries/backoff
      }
    };

    const interactiveWorker = new Worker<LlmJobData, LlmJobResult, string>(
      INTERACTIVE_QUEUE_NAME,
      interactiveProcessor,
      {
        connection: primaryConn,
        concurrency: INTERACTIVE_CONCURRENCY,
        lockDuration: 90_000,
      },
    );

    // ---------------------- BACKGROUND PROCESSOR ----------------------
    const backgroundProcessor: Processor<LlmJobData, LlmJobResult, string> = async (job) => {
      const { id, name, data } = job;
      const logPrefix = `[worker][background][${id}]`;
      console.log(`${logPrefix} picked up job.`, { name, type: data.type });

      try {
        if (data.type === 'mission') {
          const { missionType, role } = data.payload;
          await job.updateProgress(10);
          const missionPlan = await retrieveAndRefreshMission(missionType, role, primaryConn);
          await job.updateProgress(100);
          return { type: 'mission', result: missionPlan };
        }

        return { type: 'failure', error: { message: `Unsupported job type: ${data.type}` } };
      } catch (err: unknown) {
        const error = err as Error;
        const msg = error.message || String(err);
        console.error(`${logPrefix} ❌ job error`, { name, msg, stack: error?.stack });
        throw err; // Let BullMQ handle retries/backoff
      }
    };

    const backgroundWorker = new Worker<LlmJobData, LlmJobResult, string>(
      BACKGROUND_QUEUE_NAME,
      backgroundProcessor,
      {
        connection: primaryConn,
        concurrency: BACKGROUND_CONCURRENCY,
        lockDuration: 300_000, // 5 minutes
      },
    );

    // --- Queue Events ---
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

    // --- Graceful shutdown (idempotent) ---
    const shutdown = async () => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log('[worker] shutting down...');
      isHealthy = false;

      await new Promise<void>((resolve) => healthServer.close(() => resolve()));
      await Promise.allSettled([
        interactiveWorker.close(),
        backgroundWorker.close(),
        interactiveEvents.close(),
        backgroundEvents.close(),
      ]);
      await primaryConn.quit().catch(() => {});
      console.log('[worker] shutdown complete.');
      process.exit(0);
    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  } catch (err) {
    isHealthy = false;
    console.error('[worker] FATAL BOOT ERROR:', err);
    process.exit(1);
  }
}

bootstrap().then(startApp);
