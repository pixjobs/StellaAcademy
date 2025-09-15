/* eslint-disable no-console */

import {
  Timestamp,
  type Firestore,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type CollectionReference,
} from '@google-cloud/firestore';

import type { WorkerContext } from './context';
import { computeMission } from './mission-computer';
import { hashMissionPlan } from './utils';

import {
  ALL_MISSION_TYPES,
  ALL_ROLES,
  type Role,
  type MissionType,
} from '@/types/llm';
import type { EnrichedMissionPlan } from '@/types/mission';
import { logger } from './utils/logger';

// queue/bottleneck visibility (no extra deps)
import { requireBottleneck } from './mission-computer/shared/core';

/* ─────────────────────────────────────────────────────────
   Tunables (env overrides supported)
────────────────────────────────────────────────────────── */

const DEV = process.env.NODE_ENV !== 'production';

// Hard limit per maintenance pass (keep it snappy)
const MAINT_MAX_WALL_MS   = intEnv('MAINT_MAX_WALL_MS',   20_000);
const MAINT_MAX_TASKS     = intEnv('MAINT_MAX_TASKS',     6);     // total (mission,role) pairs per pass
const MAINT_MAX_DUPES     = intEnv('MAINT_MAX_DUPES',     2);     // streak breaker for dupes/failures
const MAINT_QUEUE_SKIP    = intEnv('MAINT_QUEUE_SKIP',    8);     // if queued+running >= skip LLM work
const MAINT_RESERVE_SLOTS = intEnv('MAINT_RESERVE_SLOTS', 1);     // keep slots free for preflight/ask

// treat these as LLM-heavy (earth-observer can hit LLM; make it smart/gated)
const LLM_HEAVY: Set<MissionType> = new Set([
  'rocket-lab',
  'space-poster',
  'earth-observer',
]);

// keep pool small and fresh: exactly 2 variants per role
const MIN_PER_ROLE: Record<MissionType, number> = {
  'rocket-lab': 2,
  'space-poster': 2,
  'rover-cam': 2,
  'earth-observer': 2,
  'celestial-investigator': 2,
};
const MAX_PER_ROLE: Record<MissionType, number> = {
  'rocket-lab': 2,
  'space-poster': 2,
  'rover-cam': 2,
  'earth-observer': 2,
  'celestial-investigator': 2,
};
const TARGET_FRESH_PER_ROLE = 2;
const FRESH_MAX_AGE_MS = intEnv('FRESH_MAX_AGE_MS', 14 * 24 * 60 * 60 * 1000); // 14d

const MAINTENANCE_INTERVAL_MS = DEV ? 60_000 : 5 * 60_000;
const MAX_GENERATION_ATTEMPTS = intEnv('MAX_GENERATION_ATTEMPTS', 2);
const SAMPLE_LIMIT = 30;

/* ─────────────────────────────────────────────────────────
   Firestore types
────────────────────────────────────────────────────────── */

type MissionVariantData = {
  generatedAt: Timestamp;
  role: Role;
  plan: EnrichedMissionPlan;
  contentHash: string;
};
type MissionVariant = MissionVariantData & { id: string };

const missionVariantConverter: FirestoreDataConverter<MissionVariantData> = {
  toFirestore: (data: MissionVariantData) => data,
  fromFirestore: (snap) => snap.data() as MissionVariantData,
};

/* ─────────────────────────────────────────────────────────
   Small helpers
────────────────────────────────────────────────────────── */

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function assertDb(db: unknown): asserts db is Firestore {
  if (!db || typeof (db as Firestore).collection !== 'function') {
    throw new Error('[library] Firestore DB missing from WorkerContext.');
  }
}
function randPick<T>(arr: T[]): T | undefined {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}
function roleIntro(plan: EnrichedMissionPlan, role: Role): EnrichedMissionPlan {
  const intro =
    plan.introduction?.replace(/welcome.*?\./i, `Welcome, ${role}.`) ??
    `Welcome, ${role}.`;
  return { ...plan, introduction: intro };
}

function baseCollection(
  db: Firestore,
  missionType: MissionType
): CollectionReference<MissionVariantData> {
  return db
    .collection('mission_plans')
    .doc(missionType)
    .collection('variants')
    .withConverter(missionVariantConverter);
}

function isLlmMission(id: MissionType): boolean {
  return LLM_HEAVY.has(id);
}

function getGate(context: WorkerContext) {
  return requireBottleneck(context) as {
    submit<T>(fn: () => Promise<T>): Promise<T>;
    readonly queued: number;
    readonly running: number;
    drainQueue(): number;
  };
}
function queueBusy(context: WorkerContext): boolean {
  const gate = getGate(context);
  return (gate.queued + gate.running) >= Math.max(MAINT_QUEUE_SKIP - MAINT_RESERVE_SLOTS, 1);
}

/* ─────────────────────────────────────────────────────────
   Near-duplicate detection helpers
────────────────────────────────────────────────────────── */

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}
function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = new Set([...a].filter((x) => b.has(x))).size;
  const uni = new Set([...a, ...b]).size || 1;
  return inter / uni;
}
function isNearDuplicate(a: EnrichedMissionPlan, b: EnrichedMissionPlan): boolean {
  const titleA = norm(a.missionTitle || '');
  const titleB = norm(b.missionTitle || '');
  if (titleA && titleA === titleB) return true;

  const topicsA = new Set((a.topics ?? []).map((t) => norm(t.title || '')).filter(Boolean));
  const topicsB = new Set((b.topics ?? []).map((t) => norm(t.title || '')).filter(Boolean));
  if (topicsA.size === 0 || topicsB.size === 0) return false;

  const overlap = jaccard(topicsA, topicsB);
  return overlap >= 0.6;
}

function logPlanPreview(
  prefix: string,
  missionType: MissionType,
  role: Role,
  attempt: number,
  seedIndex: number,
  plan: EnrichedMissionPlan,
  contentHash: string,
  dupe?: string
) {
  const topics = (plan.topics ?? []).slice(0, 3).map((t) => t.title || 'Untitled');
  const message =
    `${prefix} ${missionType}/${role} (attempt=${attempt}, seed=${seedIndex})\n` +
    `  title: ${plan.missionTitle}\n` +
    `  topics: ${topics.join(' | ')}` +
    (plan.topics && plan.topics.length > 3 ? ` (+${plan.topics.length - 3} more)` : '') +
    `\n  hash: ${contentHash}` +
    (dupe ? `  [DUPLICATE: ${dupe}]` : '');

  if (dupe) {
    logger.warn(message);
  } else {
    logger.info(message);
  }
}

/* ─────────────────────────────────────────────────────────
   FAST PATH: Firestore only. Return null if nothing usable.
────────────────────────────────────────────────────────── */

export async function retrieveMissionFromLibraryFast(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
  opts?: { maxAgeMs?: number; sampleLimit?: number }
): Promise<EnrichedMissionPlan | null> {
  assertDb(context.db);
  const db = context.db;
  const maxAgeMs = opts?.maxAgeMs ?? FRESH_MAX_AGE_MS;
  const sampleLimit = Math.max(8, Math.min(60, opts?.sampleLimit ?? SAMPLE_LIMIT));

  const col = baseCollection(db, missionType);

  const [roleDocs, genericDocs] = await Promise.all([
    col.where('role', '==', role).orderBy('generatedAt', 'desc').limit(sampleLimit).get(),
    col.where('role', '==', 'explorer').orderBy('generatedAt', 'desc').limit(sampleLimit).get(),
  ]);

  const now = Date.now();
  const withinAge = (ts?: Timestamp) => !ts || now - ts.toMillis() <= maxAgeMs;

  const mapDocs = (docs: typeof roleDocs.docs): MissionVariant[] =>
    docs
      .map((doc: QueryDocumentSnapshot<MissionVariantData>) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((v) => withinAge(v.generatedAt));

  const rolePool = mapDocs(roleDocs.docs);
  const genericPool = mapDocs(genericDocs.docs);
  const combinedPool = [...rolePool, ...genericPool];

  if (combinedPool.length === 0) return null;

  const chosen = randPick(combinedPool);
  if (!chosen) return null;

  // background refresh (polite: this function itself is fast-only)
  void ensureFreshness(missionType, role, context).catch((e) =>
    logger.warn('[library] ensureFreshness background failed:', e instanceof Error ? e.message : e)
  );

  return roleIntro(chosen.plan, role);
}

/* ─────────────────────────────────────────────────────────
   FRESHNESS ENGINE: assess + backfill + rotate
────────────────────────────────────────────────────────── */

type PoolMetrics = {
  totalRole: number;
  freshRole: number;
};

async function getPoolMetrics(
  missionType: MissionType,
  role: Role,
  context: WorkerContext
): Promise<PoolMetrics> {
  assertDb(context.db);
  const db = context.db;
  const col = baseCollection(db, missionType);

  const roleSnap = await col.where('role', '==', role).orderBy('generatedAt', 'desc').limit(100).get();

  const now = Date.now();
  const age = (ts?: Timestamp) => (ts ? now - ts.toMillis() : Infinity);

  const fresh = (docs: typeof roleSnap.docs) =>
    docs.filter((d) => age(d.data().generatedAt) <= FRESH_MAX_AGE_MS).length;

  return {
    totalRole: roleSnap.size,
    freshRole: fresh(roleSnap.docs),
  };
}

async function deleteOverflow(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
  keep: number
): Promise<number> {
  assertDb(context.db);
  const db = context.db;
  const col = baseCollection(db, missionType);

  const snap = await col.where('role', '==', role).orderBy('generatedAt', 'desc').get();
  const toDelete = Math.max(0, snap.size - keep);
  if (toDelete <= 0) return 0;

  const victims = snap.docs.slice(-toDelete);
  const batch = db.batch();
  victims.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return victims.length;
}

/** generateUniqueMission:
 * - tries up to MAX_GENERATION_ATTEMPTS
 * - returns null on failure/dupe exhaustion
 */
async function generateUniqueMission(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
  attempt = 1
): Promise<EnrichedMissionPlan | null> {
  if (attempt > MAX_GENERATION_ATTEMPTS) return null;

  const seedIndex = Date.now() + attempt;
  const newPlan = await computeMission(role, missionType, context, { seedIndex, attempt });

  assertDb(context.db);
  const col = baseCollection(context.db, missionType);
  const newHash = hashMissionPlan(newPlan);

  // exact dup?
  const exactDup = await col.where('contentHash', '==', newHash).limit(1).get();
  if (!exactDup.empty) {
    logPlanPreview('DUP (hash)', missionType, role, attempt, seedIndex, newPlan, newHash, 'hash');
    return generateUniqueMission(missionType, role, context, attempt + 1);
  }

  // near dup vs recent
  const recent = await col.orderBy('generatedAt', 'desc').limit(50).get();
  for (const d of recent.docs) {
    if (isNearDuplicate(newPlan, d.data().plan)) {
      logPlanPreview('DUP (near)', missionType, role, attempt, seedIndex, newPlan, newHash, 'near');
      return generateUniqueMission(missionType, role, context, attempt + 1);
    }
  }

  logPlanPreview('OK', missionType, role, attempt, seedIndex, newPlan, newHash);
  return newPlan;
}

/** backfillRole:
 * - only generates up to `need`
 * - breaks early on dupe/failed streak
 */
async function backfillRole(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
  need: number
): Promise<number> {
  assertDb(context.db);
  const db = context.db;
  const col = baseCollection(db, missionType);

  let accepted = 0;
  let failStreak = 0;

  const batch = db.batch();

  for (let i = 0; i < need; i++) {
    const plan = await generateUniqueMission(missionType, role, context);
    if (!plan) {
      failStreak++;
      if (failStreak >= MAINT_MAX_DUPES) {
        logger.warn('[library][gen] stopping backfill (dupe/failed streak)', { missionType, role, failStreak });
        break;
      }
      continue;
    }

    failStreak = 0;
    const docRef = col.doc();
    batch.set(docRef, {
      generatedAt: Timestamp.now(),
      role,
      plan,
      contentHash: hashMissionPlan(plan),
    });
    accepted++;
  }

  if (accepted > 0) {
    await batch.commit();
    logger.info(`[library][gen] committed ${accepted} new variant(s) for ${missionType}/${role}`);
  }

  return accepted;
}

/** ensureFreshness:
 * - respects a small per-call budget
 * - skips LLM-heavy missions if the queue is busy
 * - keeps pool exactly MIN..MAX (2..2) and ensures freshness target
 */
async function ensureFreshness(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
  isFirstBoot = false,
): Promise<void> {
  const logPrefix = `[library][freshness][${missionType}/${role}]`;
  const min = MIN_PER_ROLE[missionType] ?? 2;
  const max = MAX_PER_ROLE[missionType] ?? 2;
  const start = Date.now();
  const outOfBudget = () => Date.now() - start >= MAINT_MAX_WALL_MS / 2; // keep this very small per call

  try {
    // Skip LLM-heavy if queue busy
    if (isLlmMission(missionType) && queueBusy(context)) {
      logger.info(`${logPrefix} skip (queue busy, LLM-heavy)`);
      return;
    }

    const m = await getPoolMetrics(missionType, role, context);

    if (!outOfBudget() && m.totalRole < min) {
      const need = Math.max(0, Math.min(min - m.totalRole, 2));
      if (need > 0) await backfillRole(missionType, role, context, need);
    }

    if (outOfBudget()) return;

    const m2 = await getPoolMetrics(missionType, role, context);

    if (!outOfBudget() && m2.freshRole < TARGET_FRESH_PER_ROLE) {
      const need = Math.max(0, Math.min(TARGET_FRESH_PER_ROLE - m2.freshRole, 2));
      if (need > 0) await backfillRole(missionType, role, context, need);
    }

    if (!outOfBudget()) {
      await deleteOverflow(missionType, role, context, max);
    }
  } catch (e) {
    if (DEV && isFirstBoot) {
      logger.error(`${logPrefix} ensureFreshness failed during initial boot:`, e);
    } else {
      logger.warn(`${logPrefix} ensureFreshness failed:`, e instanceof Error ? e.message : e);
    }
  }
}

/* ─────────────────────────────────────────────────────────
   Smart, queue-aware proactive maintenance
────────────────────────────────────────────────────────── */

async function checkAndEnrichEntireLibrary(
  context: WorkerContext,
  isFirstBoot = false,
): Promise<void> {
  logger.info('[library] maintenance start…');

  const started = Date.now();
  const withinBudget = () => (Date.now() - started) < MAINT_MAX_WALL_MS;
  const gate = getGate(context);

  // prefer cheap missions first, per your request
  const missionOrder: MissionType[] = [
    'rover-cam',
    'celestial-investigator',
    'earth-observer',      // can hit LLM; gated below
    'rocket-lab',          // LLM
    'space-poster',        // LLM
  ];

  const roleOrder: Role[] = ['cadet', 'explorer', 'scholar'];

  let tasks = 0;
  let dupeStreak = 0;

  outer:
  for (const missionType of missionOrder) {
    const llm = isLlmMission(missionType);
    const skipForQueue = llm && queueBusy(context);
    if (skipForQueue) {
      logger.debug('[library] skip mission (LLM-heavy & queue busy)', {
        missionType, queued: gate.queued, running: gate.running
      });
      continue;
    }

    for (const role of roleOrder) {
      if (!withinBudget()) {
        logger.info('[library] maintenance stop (budget hit)', { tasks, dupeStreak });
        break outer;
      }
      if (tasks >= MAINT_MAX_TASKS) {
        logger.info('[library] maintenance stop (task cap)', { tasks, dupeStreak });
        break outer;
      }

      try {
        const before = Date.now();
        const pre = await getPoolMetrics(missionType, role, context);

        await ensureFreshness(missionType, role, context, isFirstBoot);

        const post = await getPoolMetrics(missionType, role, context);
        const grew = (post.totalRole > pre.totalRole) || (post.freshRole > pre.freshRole);

        tasks++;
        if (!grew) {
          dupeStreak++;
          logger.warn('[library] maintenance noop/dupe', { missionType, role, dupeStreak, tookMs: Date.now() - before });
          if (dupeStreak >= MAINT_MAX_DUPES) {
            logger.warn('[library] maintenance stop (dupe streak)');
            break outer;
          }
        } else {
          dupeStreak = 0;
        }
      } catch (e) {
        dupeStreak++;
        const code = (e as any)?.code || (e as Error)?.message;
        logger.warn('[library] maintenance error', { missionType, role, code, dupeStreak });
        if (dupeStreak >= MAINT_MAX_DUPES) break outer;
      }
    }
  }

  logger.info('[library] maintenance end.', {
    tasks,
    dupeStreak,
    elapsedMs: Date.now() - started,
    queued: gate.queued,
    running: gate.running,
  });
}

export function startLibraryMaintenance(
  context: WorkerContext
): NodeJS.Timeout {
  logger.info(`[library] maintenance loop every ${MAINTENANCE_INTERVAL_MS / 1000}s.`);
  void checkAndEnrichEntireLibrary(context, true);
  return setInterval(
    () => void checkAndEnrichEntireLibrary(context, false),
    MAINTENANCE_INTERVAL_MS
  );
}

/* ─────────────────────────────────────────────────────────
   Public API
────────────────────────────────────────────────────────── */

export async function retrieveMissionForUser(
  missionType: MissionType,
  role: Role,
  context: WorkerContext
): Promise<EnrichedMissionPlan> {
  // Try fresh first
  const fresh = await retrieveMissionFromLibraryFast(missionType, role, context, {
    maxAgeMs: FRESH_MAX_AGE_MS,
  });
  if (fresh) return fresh;

  // Then any age
  const anyAge = await retrieveMissionFromLibraryFast(missionType, role, context, {
    maxAgeMs: Number.POSITIVE_INFINITY,
  });
  if (anyAge) {
    void ensureFreshness(missionType, role, context).catch(() => {});
    return anyAge;
  }

  // Library truly empty for this (mission, role) – generate a single variant.
  // If LLM-heavy and queue is busy, don't block the user: insert a tiny seed and schedule refresh.
  if (isLlmMission(missionType) && queueBusy(context)) {
    logger.warn('[library] interactive path: queue busy; inserting seed plan', { missionType, role });
    const seedPlan: EnrichedMissionPlan = {
      missionTitle: 'Mission Seed',
      introduction: `Welcome, ${role}. This is a seeded plan to recover an empty library.`,
      topics: [],
    };
    assertDb(context.db);
    const col = baseCollection(context.db, missionType);
    await col.add({
      generatedAt: Timestamp.now(),
      role,
      plan: seedPlan,
      contentHash: hashMissionPlan(seedPlan),
    });
    // background refresh when the queue calms down
    void ensureFreshness(missionType, role, context).catch(() => {});
    return roleIntro(seedPlan, role);
  }

  const plan = await generateUniqueMission(missionType, role, context);
  if (!plan) {
    logger.warn('[library] emergency seed insert for', missionType, role);
    const seedPlan: EnrichedMissionPlan = {
      missionTitle: 'Mission Seed',
      introduction: `Welcome, ${role}. This is a seeded plan to recover an empty library.`,
      topics: [],
    };
    assertDb(context.db);
    const col = baseCollection(context.db, missionType);
    await col.add({
      generatedAt: Timestamp.now(),
      role,
      plan: seedPlan,
      contentHash: hashMissionPlan(seedPlan),
    });
    return roleIntro(seedPlan, role);
  }

  assertDb(context.db);
  const col = baseCollection(context.db, missionType);
  await col.add({
    generatedAt: Timestamp.now(),
    role,
    plan,
    contentHash: hashMissionPlan(plan),
  });

  void ensureFreshness(missionType, role, context).catch(() => {});
  return roleIntro(plan, role);
}
