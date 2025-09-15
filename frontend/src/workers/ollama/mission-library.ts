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
  type LibraryBackfillResult, // ← result shape for library-backfill jobs
} from '@/types/llm';
import type { EnrichedMissionPlan } from '@/types/mission';
import { logger } from './utils/logger';

// --- Tunables ---
const DEV = process.env.NODE_ENV !== 'production';
const MAINT_MAX_WALL_MS = intEnv('MAINT_MAX_WALL_MS', 20_000);
const MAINT_MAX_TASKS = intEnv('MAINT_MAX_TASKS', 6);
const MAINT_MAX_DUPES = intEnv('MAINT_MAX_DUPES', 2);
const MAINT_QUEUE_SKIP = intEnv('MAINT_QUEUE_SKIP', 8);
const MAINT_RESERVE_SLOTS = intEnv('MAINT_RESERVE_SLOTS', 1);
const FRESH_MAX_AGE_MS = intEnv('FRESH_MAX_AGE_MS', 14 * 24 * 60 * 60 * 1000); // 14 days
const MAX_GENERATION_ATTEMPTS = intEnv('MAX_GENERATION_ATTEMPTS', 2);
const SAMPLE_LIMIT = 30;

const LLM_HEAVY: Set<MissionType> = new Set([
  'rocket-lab',
  'space-poster',
  'earth-observer',
]);

const MISSION_CONFIG: Record<MissionType, { min: number; max: number; fresh: number }> = {
  'rocket-lab': { min: 2, max: 2, fresh: 2 },
  'space-poster': { min: 2, max: 2, fresh: 2 },
  'rover-cam': { min: 2, max: 2, fresh: 2 },
  'earth-observer': { min: 2, max: 2, fresh: 2 },
  'celestial-investigator': { min: 2, max: 2, fresh: 2 },
};

// --- Firestore Types ---
type MissionVariantData = {
  generatedAt: Timestamp;
  role: Role;
  plan: EnrichedMissionPlan;
  contentHash: string;
};
type MissionVariant = MissionVariantData & { id: string };

const missionVariantConverter: FirestoreDataConverter<MissionVariantData> = {
  toFirestore: (data) => data,
  fromFirestore: (snap) => snap.data() as MissionVariantData,
};

// --- Helpers ---
function intEnv(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? n : fallback;
}

function assertDb(db: unknown): asserts db is Firestore {
  if (!db || typeof (db as Firestore).collection !== 'function') {
    throw new Error('[library] Firestore DB missing from WorkerContext.');
  }
}
function randPick<T>(arr: T[]): T | undefined {
  return arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : undefined;
}

function roleIntro(plan: EnrichedMissionPlan, role: Role): EnrichedMissionPlan {
  const intro = plan.introduction?.replace(/welcome.*?\./i, `Welcome, ${role}.`) ?? `Welcome, ${role}.`;
  return { ...plan, introduction: intro };
}

function baseCollection(db: Firestore, missionType: MissionType) {
  return db
    .collection('mission_plans')
    .doc(missionType)
    .collection('variants')
    .withConverter(missionVariantConverter);
}

function isLlmMission(id: MissionType): boolean {
  return LLM_HEAVY.has(id);
}

type BottleneckInstance = {
  submit: <T>(fn: () => Promise<T>) => Promise<T>;
  running?: number | (() => number);
  queued?: number | (() => number);
};

function metric(v: number | (() => number) | undefined): number {
  if (typeof v === 'function') return v();
  return Number(v ?? 0);
}

function getGate(context: WorkerContext): { queued: number; running: number } {
  const b = (context as any).llmBottleneck as BottleneckInstance;
  if (!b || !('submit' in b)) {
    throw new Error('[library] llmBottleneck missing on WorkerContext.');
  }
  return { queued: metric(b.queued), running: metric(b.running) };
}

function queueBusy(context: WorkerContext): boolean {
  const g = getGate(context);
  return g.queued + g.running >= Math.max(MAINT_QUEUE_SKIP - MAINT_RESERVE_SLOTS, 1);
}

// --- Duplicate Detection ---
function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  const inter = new Set([...a].filter((x) => b.has(x))).size;
  const uni = a.size + b.size - inter;
  return inter / (uni || 1);
}
function isNearDuplicate(a: EnrichedMissionPlan, b: EnrichedMissionPlan): boolean {
  const titleA = norm(a.missionTitle || '');
  const titleB = norm(b.missionTitle || '');
  if (titleA && titleA === titleB) return true;

  const topicsA = new Set((a.topics ?? []).map((t) => norm(t.title || '')).filter(Boolean));
  const topicsB = new Set((b.topics ?? []).map((t) => norm(t.title || '')).filter(Boolean));
  return jaccard(topicsA, topicsB) >= 0.6;
}

// --- Fast Read Path ---
export async function retrieveMissionFromLibraryFast(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
  opts?: { maxAgeMs?: number },
): Promise<EnrichedMissionPlan | null> {
  assertDb(context.db);
  const maxAgeMs = opts?.maxAgeMs ?? FRESH_MAX_AGE_MS;
  const col = baseCollection(context.db, missionType);

  const [roleDocs, genericDocs] = await Promise.all([
    col.where('role', '==', role).orderBy('generatedAt', 'desc').limit(SAMPLE_LIMIT).get(),
    col.where('role', '==', 'explorer').orderBy('generatedAt', 'desc').limit(SAMPLE_LIMIT).get(),
  ]);

  const now = Date.now();
  const withinAge = (ts?: Timestamp) => !ts || now - ts.toMillis() <= maxAgeMs;

  const mapDocs = (docs: QueryDocumentSnapshot<MissionVariantData>[]) =>
    docs.map((doc) => ({ id: doc.id, ...doc.data() })).filter((v) => withinAge(v.generatedAt));

  const combinedPool = [...mapDocs(roleDocs.docs), ...mapDocs(genericDocs.docs)];
  const chosen = randPick(combinedPool);

  if (chosen) {
    void ensureFreshness(missionType, role, context).catch((e) =>
      logger.warn(
        `[library] Background refresh failed for ${missionType}/${role}:`,
        e instanceof Error ? e.message : e,
      ),
    );
    return roleIntro(chosen.plan, role);
  }
  return null;
}

// --- Freshness Engine (Write Path) ---
type PoolMetrics = { total: number; fresh: number };

// Generic Query-based metrics
async function getPoolMetrics(col: Query<MissionVariantData>): Promise<PoolMetrics> {
  const snap = await col.orderBy('generatedAt', 'desc').limit(100).get();
  const now = Date.now();
  let freshCount = 0;
  snap.docs.forEach((d) => {
    const age = now - d.data().generatedAt.toMillis();
    if (age <= FRESH_MAX_AGE_MS) freshCount++;
  });
  return { total: snap.size, fresh: freshCount };
}

async function deleteOverflow(col: Query<MissionVariantData>, keep: number): Promise<number> {
  const snap = await col.orderBy('generatedAt', 'desc').get();
  const toDeleteCount = Math.max(0, snap.size - keep);
  if (toDeleteCount <= 0) return 0;

  const victims = snap.docs.slice(-toDeleteCount);
  const batch = col.firestore.batch();
  victims.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return victims.length;
}

async function generateUniqueMission(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
): Promise<EnrichedMissionPlan | null> {
  assertDb(context.db);
  const col = baseCollection(context.db, missionType);
  const recentDocs = (await col.orderBy('generatedAt', 'desc').limit(50).get()).docs;

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const newPlan = await computeMission(role, missionType, context, {
      seedIndex: Date.now() + attempt,
      attempt,
    });
    const newHash = hashMissionPlan(newPlan);

    const isExactDupe = (await col.where('contentHash', '==', newHash).limit(1).get()).size > 0;
    if (isExactDupe) {
      logger.warn(`[library] DUP (hash) for ${missionType}/${role}, attempt ${attempt}`);
      continue;
    }

    const isNearDupe = recentDocs.some((doc) => isNearDuplicate(newPlan, doc.data().plan));
    if (isNearDupe) {
      logger.warn(`[library] DUP (near) for ${missionType}/${role}, attempt ${attempt}`);
      continue;
    }

    logger.info(`[library] OK generated for ${missionType}/${role}, attempt ${attempt}`);
    return newPlan;
  }

  logger.error(
    `[library] Failed to generate unique mission for ${missionType}/${role} after ${MAX_GENERATION_ATTEMPTS} attempts.`,
  );
  return null;
}

async function backfillRole(
  col: CollectionReference<MissionVariantData>,
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
  need: number,
) {
  const batch = col.firestore.batch();
  let accepted = 0;

  for (let i = 0; i < need; i++) {
    const plan = await generateUniqueMission(missionType, role, context);
    if (plan) {
      batch.set(col.doc(), {
        generatedAt: Timestamp.now(),
        role,
        plan,
        contentHash: hashMissionPlan(plan),
      });
      accepted++;
    } else {
      logger.warn(
        `[library] Stopping backfill early for ${missionType}/${role} due to generation failure/duplicates.`,
      );
      break;
    }
  }

  if (accepted > 0) {
    await batch.commit();
    logger.info(`[library] Committed ${accepted} new variant(s) for ${missionType}/${role}.`);
  }
  return accepted;
}

async function ensureFreshness(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
): Promise<void> {
  const config = MISSION_CONFIG[missionType];
  if (!config) return;

  if (isLlmMission(missionType) && queueBusy(context)) {
    logger.info(`[library] Skipping freshness check for LLM-heavy ${missionType}/${role} (queue busy).`);
    return;
  }

  assertDb(context.db);
  const col = baseCollection(context.db, missionType).where('role', '==', role);
  const metrics = await getPoolMetrics(col);

  if (metrics.total < config.min) {
    const need = config.min - metrics.total;
    await backfillRole(baseCollection(context.db, missionType), missionType, role, context, need);
  } else if (metrics.fresh < config.fresh) {
    const need = config.fresh - metrics.fresh;
    await backfillRole(baseCollection(context.db, missionType), missionType, role, context, need);
  }

  await deleteOverflow(col, config.max);
}

// --- NEW: explicit single backfill primitive (for 'library-backfill' jobs) ---
/**
 * Generate and persist a single fresh variant for a mission/role.
 * Respects the LLM queue-busy guard for heavy missions.
 */
export async function backfillOne(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
  reason: 'miss' | 'stale' | 'scheduled' = 'scheduled',
): Promise<LibraryBackfillResult> {
  try {
    if (isLlmMission(missionType) && queueBusy(context)) {
      logger.info(
        `[library] backfillOne skipped for ${missionType}/${role} (queue busy). reason=${reason}`,
      );
      return { ok: false, reason, missionType, role };
    }

    const plan = await generateUniqueMission(missionType, role, context);
    if (!plan) {
      logger.warn(`[library] backfillOne failed to produce a unique plan for ${missionType}/${role}`);
      return { ok: false, reason, missionType, role };
    }

    assertDb(context.db);
    await baseCollection(context.db, missionType).add({
      generatedAt: Timestamp.now(),
      role,
      plan,
      contentHash: hashMissionPlan(plan),
    });

    logger.info(`[library] backfillOne committed for ${missionType}/${role} (reason=${reason})`);
    return { ok: true, reason, missionType, role };
  } catch (e) {
    logger.error(`[library] backfillOne error for ${missionType}/${role}:`, e);
    return { ok: false, reason, missionType, role };
  }
}

// --- Maintenance Orchestrator ---
export async function runLibraryMaintenance(
  context: WorkerContext,
  isFirstBoot = false,
): Promise<void> {
  logger.info(`[library] Starting library maintenance (firstBoot=${isFirstBoot})...`);
  const started = Date.now();
  const gate = getGate(context);

  const tasksToRun = ALL_MISSION_TYPES.flatMap((missionType) =>
    ALL_ROLES.map((role) => ({ missionType, role })),
  );

  logger.info(`[library] Identified ${tasksToRun.length} mission/role pairs to check.`);

  const results = await Promise.allSettled(
    tasksToRun.map(({ missionType, role }) => ensureFreshness(missionType, role, context)),
  );

  const failedTasks = results.filter((r) => r.status === 'rejected').length;

  logger.info('[library] Maintenance finished.', {
    elapsedMs: Date.now() - started,
    checkedTasks: tasksToRun.length,
    failedTasks,
    llmQueue: { queued: gate.queued, running: gate.running },
  });
}

// --- Public API ---
export async function retrieveMissionForUser(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
): Promise<EnrichedMissionPlan> {
  const fresh = await retrieveMissionFromLibraryFast(missionType, role, context);
  if (fresh) return fresh;

  const anyAge = await retrieveMissionFromLibraryFast(missionType, role, context, { maxAgeMs: Infinity });
  if (anyAge) return anyAge;

  logger.warn(`[library] No pre-generated plan found for ${missionType}/${role}. Generating on-demand.`);

  if (isLlmMission(missionType) && queueBusy(context)) {
    logger.error(
      `[library] On-demand generation for LLM-heavy mission ${missionType} skipped (queue busy). Returning emergency seed.`,
    );
    return roleIntro(
      {
        missionTitle: 'Mission Unavailable',
        introduction: 'Our mission computers are currently busy. Please try again shortly.',
        topics: [],
      },
      role,
    );
    }

  const plan = await generateUniqueMission(missionType, role, context);
  if (!plan) {
    logger.error(
      `[library] On-demand generation failed for ${missionType}/${role}. Returning emergency seed.`,
    );
    return roleIntro(
      {
        missionTitle: 'Mission Generation Error',
        introduction: 'We were unable to generate a new mission plan. Please try again.',
        topics: [],
      },
      role,
    );
  }

  assertDb(context.db);
  await baseCollection(context.db, missionType).add({
    generatedAt: Timestamp.now(),
    role,
    plan,
    contentHash: hashMissionPlan(plan),
  });

  return roleIntro(plan, role);
}
