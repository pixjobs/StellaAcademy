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

/* ─────────────────────────────────────────────────────────
   Tunables
────────────────────────────────────────────────────────── */

const FRESHNESS_BUDGET_MS = 25_000;
const DEV = process.env.NODE_ENV !== 'production';

const MIN_PER_ROLE: Record<MissionType, number> = {
  'rocket-lab': 2,
  'space-poster': 2,
  'rover-cam': 2,
  'earth-observer': 2,
  'celestial-investigator': 2,
};
const MAX_PER_ROLE: Record<MissionType, number> = {
  'rocket-lab': 3,
  'space-poster': 3,
  'rover-cam': 3,
  'earth-observer': 3,
  'celestial-investigator': 3,
};

const FRESH_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14d
const TARGET_FRESH_PER_ROLE = 2;

const MAINTENANCE_INTERVAL_MS = DEV ? 60_000 : 5 * 60_000;
const MAX_GENERATION_ATTEMPTS = 2;
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

  const topicsA = new Set(
    (a.topics ?? []).map((t) => norm(t.title || '')).filter(Boolean)
  );
  const topicsB = new Set(
    (b.topics ?? []).map((t) => norm(t.title || '')).filter(Boolean)
  );
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

// --- RESTORED FUNCTION ---
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

// --- RESTORED FUNCTION ---
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

// --- RESTORED FUNCTION ---
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

  const exactDup = await col.where('contentHash', '==', newHash).limit(1).get();
  if (!exactDup.empty) {
    logPlanPreview('DUP (hash)', missionType, role, attempt, seedIndex, newPlan, newHash, 'hash');
    return generateUniqueMission(missionType, role, context, attempt + 1);
  }

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

// --- RESTORED FUNCTION ---
async function backfillRole(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
  need: number
): Promise<number> {
  assertDb(context.db);
  const db = context.db;
  const col = baseCollection(db, missionType);

  const accepted: EnrichedMissionPlan[] = [];
  for (let i = 0; i < need; i++) {
    const plan = await generateUniqueMission(missionType, role, context);
    if (!plan) break;
    accepted.push(plan);
  }

  if (accepted.length === 0) return 0;

  const batch = db.batch();
  accepted.forEach((plan) => {
    const docRef = col.doc();
    batch.set(docRef, {
      generatedAt: Timestamp.now(),
      role,
      plan,
      contentHash: hashMissionPlan(plan),
    });
  });
  await batch.commit();

  logger.info(`[library][gen] committed ${accepted.length} new variant(s) for ${missionType}/${role}`);
  return accepted.length;
}

async function ensureFreshness(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
  isFirstBoot = false,
): Promise<void> {
  const logPrefix = `[library][freshness][${missionType}/${role}]`;
  const min = MIN_PER_ROLE[missionType] ?? 2;
  const max = MAX_PER_ROLE[missionType] ?? 3;
  const start = Date.now();
  const outOfBudget = () => Date.now() - start >= FRESHNESS_BUDGET_MS;

  try {
    const m = await getPoolMetrics(missionType, role, context);

    if (!outOfBudget() && m.totalRole < min) {
      const need = Math.min(min - m.totalRole, 2);
      await backfillRole(missionType, role, context, need);
    }

    if (outOfBudget()) return;
    const m2 = await getPoolMetrics(missionType, role, context);

    if (!outOfBudget() && m2.freshRole < TARGET_FRESH_PER_ROLE) {
      const need = Math.min(TARGET_FRESH_PER_ROLE - m2.freshRole, 2);
      await backfillRole(missionType, role, context, need);
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
   Proactive maintenance
────────────────────────────────────────────────────────── */

async function checkAndEnrichEntireLibrary(
  context: WorkerContext,
  isFirstBoot = false,
): Promise<void> {
  logger.info('[library] maintenance start…');
  const tasks = ALL_MISSION_TYPES.flatMap(missionType =>
    ALL_ROLES.map(role => ensureFreshness(missionType, role, context, isFirstBoot))
  );
  await Promise.allSettled(tasks);
  logger.info('[library] maintenance end.');
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
  const fresh = await retrieveMissionFromLibraryFast(missionType, role, context, {
    maxAgeMs: FRESH_MAX_AGE_MS,
  });
  if (fresh) return fresh;

  const anyAge = await retrieveMissionFromLibraryFast(missionType, role, context, {
    maxAgeMs: Number.POSITIVE_INFINITY,
  });
  if (anyAge) {
    void ensureFreshness(missionType, role, context).catch(() => {});
    return anyAge;
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