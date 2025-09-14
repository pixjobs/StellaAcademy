/* eslint-disable no-console */
import {
  Timestamp,
  type Firestore,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type CollectionReference,
  type Query,
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

/* ─────────────────────────────────────────────────────────
   Tunables
────────────────────────────────────────────────────────── */

const DEV = process.env.NODE_ENV !== 'production';

// Pool sizing (can be per-mission tuned if you want)
const MIN_PER_ROLE: Record<MissionType, number> = {
  'rocket-lab': 2,
  'space-poster': 3,
  'rover-cam': 3,
  'earth-observer': 3,
  'celestial-investigator': 3,
};
const MAX_PER_ROLE: Record<MissionType, number> = {
  'rocket-lab': 12,
  'space-poster': 10,
  'rover-cam': 10,
  'earth-observer': 12,
  'celestial-investigator': 10,
};

// Freshness (ms)
const FRESH_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14d = “fresh”
const TARGET_FRESH_PER_ROLE = 2; // keep at least N fresh per role
const USER_SEEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30d

// Proactive maintenance
const MAINTENANCE_INTERVAL_MS = DEV ? 60_000 : 5 * 60_000;

// Generation attempts
const MAX_GENERATION_ATTEMPTS = 7;

// How many docs to sample when picking a variant
const SAMPLE_LIMIT = 30;

/* ─────────────────────────────────────────────────────────
   Firestore types
────────────────────────────────────────────────────────── */

type MissionVariantData = {
  generatedAt: Timestamp;
  role: Role;                 // 'explorer' is the generic pool
  plan: EnrichedMissionPlan;
  contentHash: string;        // dedupe across the whole mission type
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
    plan.introduction?.replace(/welcome.*?\./i, `Welcome, ${role}.`) ?? `Welcome, ${role}.`;
  return { ...plan, introduction: intro };
}

async function safeCount(q: Query<MissionVariantData>): Promise<number> {
  // New SDKs support aggregate count(); older ones don’t.
  try {
    const snap = await q.count().get();
    return snap?.data?.().count ?? 0;
  } catch {
    const s = await q.limit(1000).get();
    return s.size;
  }
}

function baseCollection(db: Firestore, missionType: MissionType): CollectionReference<MissionVariantData> {
  return db.collection('mission_plans').doc(missionType).collection('variants').withConverter(missionVariantConverter);
}

/* ─────────────────────────────────────────────────────────
   FAST PATH: Firestore only. Return null if nothing usable.
────────────────────────────────────────────────────────── */

export async function retrieveMissionFromLibraryFast(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
  opts?: {
    preferUnseen?: boolean;
    maxAgeMs?: number;     // use Infinity to allow any age
    sampleLimit?: number;
  }
): Promise<EnrichedMissionPlan | null> {
  assertDb(context.db);
  const db = context.db;
  const redis = context.redis;
  const preferUnseen = opts?.preferUnseen !== false;
  const maxAgeMs = opts?.maxAgeMs ?? FRESH_MAX_AGE_MS;
  const sampleLimit = Math.max(8, Math.min(60, opts?.sampleLimit ?? SAMPLE_LIMIT));

  const col = baseCollection(db, missionType);
  const userSeenKey = `user:${role}:seen-missions:${missionType}`;

  const [roleDocs, genericDocs, seenIds] = await Promise.all([
    col.where('role', '==', role).orderBy('generatedAt', 'desc').limit(sampleLimit).get(),
    col.where('role', '==', 'explorer').orderBy('generatedAt', 'desc').limit(sampleLimit).get(),
    preferUnseen ? redis.smembers(userSeenKey) : Promise.resolve<string[]>([]),
  ]);

  const now = Date.now();
  const withinAge = (ts?: Timestamp) => !ts || (now - ts.toMillis() <= maxAgeMs);

  const mapDocs = (docs: typeof roleDocs.docs): MissionVariant[] =>
    docs
      .map((doc: QueryDocumentSnapshot<MissionVariantData>) => ({ id: doc.id, ...doc.data() }))
      .filter((v) => withinAge(v.generatedAt));

  const rolePool = mapDocs(roleDocs.docs);
  const genericPool = mapDocs(genericDocs.docs);

  if (rolePool.length + genericPool.length === 0) return null;

  const choose = (pool: MissionVariant[]): MissionVariant | undefined => {
    if (pool.length === 0) return undefined;
    if (preferUnseen && seenIds.length > 0) {
      const unseen = pool.filter((v) => !seenIds.includes(v.id));
      if (unseen.length > 0) return randPick(unseen);
    }
    return randPick(pool);
  };

  let chosen = choose(rolePool) || choose(genericPool) || randPick([...rolePool, ...genericPool]);
  if (!chosen) return null;

  if (preferUnseen) {
    void redis
      .sadd(userSeenKey, chosen.id)
      .then(() => redis.expire(userSeenKey, USER_SEEN_TTL_SECONDS))
      .catch(() => {});
  }

  // Kick a best-effort freshness check (doesn’t block the response)
  void ensureFreshness(missionType, role, context).catch((e) =>
    console.warn('[library] ensureFreshness background failed:', e?.message || e)
  );

  return roleIntro(chosen.plan, role);
}

/* ─────────────────────────────────────────────────────────
   FRESHNESS ENGINE: assess + backfill + rotate
────────────────────────────────────────────────────────── */

type PoolMetrics = {
  totalRole: number;
  totalGeneric: number;
  freshRole: number;
  freshGeneric: number;
  oldestMsRole: number | null;
  oldestMsGeneric: number | null;
};
async function getPoolMetrics(
  missionType: MissionType,
  role: Role,
  context: WorkerContext
): Promise<PoolMetrics> {
  assertDb(context.db);
  const db = context.db;
  const col = baseCollection(db, missionType);

  const [roleSnap, explSnap] = await Promise.all([
    col.where('role', '==', role).orderBy('generatedAt', 'desc').limit(100).get(),
    col.where('role', '==', 'explorer').orderBy('generatedAt', 'desc').limit(100).get(),
  ]);

  const now = Date.now();
  const age = (ts?: Timestamp) => (ts ? now - ts.toMillis() : Infinity);

  const fresh = (docs: typeof roleSnap.docs) =>
    docs.filter((d) => age(d.data().generatedAt) <= FRESH_MAX_AGE_MS).length;

  const oldestMs = (docs: typeof roleSnap.docs) =>
    docs.length === 0 ? null : age(docs[docs.length - 1].data().generatedAt);

  return {
    totalRole: roleSnap.size,
    totalGeneric: explSnap.size,
    freshRole: fresh(roleSnap.docs),
    freshGeneric: fresh(explSnap.docs),
    oldestMsRole: oldestMs(roleSnap.docs),
    oldestMsGeneric: oldestMs(explSnap.docs),
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

  const victims = snap.docs.slice(-toDelete); // oldest first
  const batch = db.batch();
  victims.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return victims.length;
}

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
  const dup = await col.where('contentHash', '==', newHash).limit(1).get();
  if (!dup.empty) {
    console.warn(
      `[library] duplicate content for ${missionType}/${role} (attempt ${attempt}); retrying`
    );
    return generateUniqueMission(missionType, role, context, attempt + 1);
  }
  return newPlan;
}

async function backfillRole(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
  need: number
): Promise<number> {
  assertDb(context.db);
  const db = context.db;
  const col = baseCollection(db, missionType);

  const plans = (
    await Promise.all(
      Array.from({ length: need }, () => generateUniqueMission(missionType, role, context))
    )
  ).filter((p): p is EnrichedMissionPlan => p != null);

  if (plans.length === 0) return 0;

  const batch = db.batch();
  plans.forEach((plan) => {
    const docRef = col.doc();
    const payload: MissionVariantData = {
      generatedAt: Timestamp.now(),
      role,
      plan,
      contentHash: hashMissionPlan(plan),
    };
    batch.set(docRef, payload);
  });
  await batch.commit();
  return plans.length;
}

/** Ensure pool has enough *total* and *fresh* variants; rotate overflow. */
async function ensureFreshness(
  missionType: MissionType,
  role: Role,
  context: WorkerContext
): Promise<void> {
  const logPrefix = `[library][freshness][${missionType}/${role}]`;

  const min = MIN_PER_ROLE[missionType] ?? 3;
  const max = MAX_PER_ROLE[missionType] ?? (min + 6);

  try {
    const m = await getPoolMetrics(missionType, role, context);
    console.log(logPrefix, 'metrics', m);

    // 1) Floor on total (role + explorer for retrieval; but we keep per-role)
    const total = m.totalRole;
    if (total < min) {
      const added = await backfillRole(missionType, role, context, min - total);
      console.log(logPrefix, `added ${added} to reach min=${min}`);
    }

    // 2) Freshness target per role
    const fresh = m.freshRole;
    if (fresh < TARGET_FRESH_PER_ROLE) {
      const add = TARGET_FRESH_PER_ROLE - fresh;
      const added = await backfillRole(missionType, role, context, add);
      console.log(logPrefix, `added ${added} fresh to reach target=${TARGET_FRESH_PER_ROLE}`);
    }

    // 3) Rotate overflow
    const deleted = await deleteOverflow(missionType, role, context, max);
    if (deleted > 0) console.log(logPrefix, `rotated ${deleted} old variants (kept <= ${max})`);
  } catch (e) {
    console.warn(logPrefix, 'ensureFreshness failed:', (e as Error)?.message || e);
  }
}

/* ─────────────────────────────────────────────────────────
   Proactive maintenance (kept, but smarter logging)
────────────────────────────────────────────────────────── */

async function checkAndEnrichEntireLibrary(context: WorkerContext): Promise<void> {
  console.log('[library] maintenance start…');
  const tasks: Array<Promise<void>> = [];
  for (const missionType of ALL_MISSION_TYPES) {
    for (const role of ALL_ROLES) {
      tasks.push(ensureFreshness(missionType, role, context));
    }
  }
  await Promise.allSettled(tasks);
  console.log('[library] maintenance end.');
}

export function startLibraryMaintenance(context: WorkerContext): NodeJS.Timeout {
  console.log(`[library] maintenance loop every ${MAINTENANCE_INTERVAL_MS / 1000}s.`);
  // run immediately (fire-and-forget)
  void checkAndEnrichEntireLibrary(context);
  return setInterval(() => void checkAndEnrichEntireLibrary(context), MAINTENANCE_INTERVAL_MS);
}

/* ─────────────────────────────────────────────────────────
   Public API used by the worker handler
   (tries fast path first; generates as last resort)
────────────────────────────────────────────────────────── */

export async function retrieveMissionForUser(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
): Promise<EnrichedMissionPlan> {
  // 1) Try fresh first
  const fresh = await retrieveMissionFromLibraryFast(missionType, role, context, {
    preferUnseen: true,
    maxAgeMs: FRESH_MAX_AGE_MS,
    sampleLimit: SAMPLE_LIMIT,
  });
  if (fresh) return fresh;

  // 2) Try any-age
  const anyAge = await retrieveMissionFromLibraryFast(missionType, role, context, {
    preferUnseen: false,
    maxAgeMs: Number.POSITIVE_INFINITY,
    sampleLimit: SAMPLE_LIMIT,
  });
  if (anyAge) {
    // nudge freshness in background
    void ensureFreshness(missionType, role, context).catch(() => {});
    return anyAge;
  }

  // 3) Library empty → emergency generation (and store it)
  const plan = await generateUniqueMission(missionType, role, context);
  if (!plan) {
    // As a last, last resort, write a small deterministic seed so the pool is never empty again.
    console.warn('[library] emergency seed insert for', missionType, role);
    const seedPlan: EnrichedMissionPlan = {
      missionTitle: 'Mission Seed',
      introduction: `Welcome, ${role}. This is a seeded plan used to recover an empty library.`,
      topics: [],
    };

    assertDb(context.db);
    const col = baseCollection(context.db, missionType);
    const docRef = col.doc();
    const payload: MissionVariantData = {
      generatedAt: Timestamp.now(),
      role,
      plan: seedPlan,
      contentHash: hashMissionPlan(seedPlan),
    };
    await docRef.set(payload);
    return roleIntro(seedPlan, role);
  }

  // store it so subsequent requests are fast
  assertDb(context.db);
  const col = baseCollection(context.db, missionType);
  const docRef = col.doc();
  await docRef.set({
    generatedAt: Timestamp.now(),
    role,
    plan,
    contentHash: hashMissionPlan(plan),
  });

  // refresh in background (fill up to min/fresh targets)
  void ensureFreshness(missionType, role, context).catch(() => {});
  return roleIntro(plan, role);
}
