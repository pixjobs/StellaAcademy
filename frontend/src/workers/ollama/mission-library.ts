/* eslint-disable no-console */
import {
  Timestamp,
  type Firestore,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
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
   Config
────────────────────────────────────────────────────────── */
// Make bootstrap fast; we can backfill later
const MIN_VARIANTS_PER_ROLE = Number(process.env.LIBRARY_MIN_PER_ROLE ?? 1);
// Give Earth Observer a few more shots since it depends on NASA lists
const MAX_GENERATION_ATTEMPTS = Number(process.env.LIBRARY_MAX_ATTEMPTS ?? 10);
const USER_SEEN_MISSIONS_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const MAINTENANCE_INTERVAL_MS = Number(process.env.LIBRARY_MAINTENANCE_MS ?? 5 * 60 * 1000);

const ROLE_AGNOSTIC_MISSIONS = new Set<MissionType>(['earth-observer']);

// Helper
function isRoleAgnostic(m: MissionType): boolean {
  return ROLE_AGNOSTIC_MISSIONS.has(m);
}

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

function randPick<T>(arr: T[]): T | undefined {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

function assertDb(db: unknown): asserts db is Firestore {
  if (!db || typeof (db as Firestore).collection !== 'function') {
    throw new Error('[library] Firestore DB missing from WorkerContext.');
  }
}

/** Minimal, deterministic plan used when uniqueness is impossible *right now*. */
function buildSeedPlan(missionType: MissionType, role: Role): EnrichedMissionPlan {
  const intro = (label: string) =>
    `Welcome, ${role}. This is a seed plan for "${label}" prepared while we populate the library.`;
  switch (missionType) {
    case 'earth-observer':
      return {
        missionTitle: 'Earth Observer (Seed)',
        introduction: intro('Earth Observer'),
        topics: [
          {
            title: 'Blue Marble',
            summary: 'Observe Earth as a full disc and note visible cloud patterns and continents.',
            images: [],
            keywords: ['Earth', 'EPIC', 'Clouds'],
          },
        ],
      };
    case 'rocket-lab':
      return {
        missionTitle: 'Rocket Lab (Seed)',
        introduction: intro('Rocket Lab'),
        topics: [
          {
            title: 'Stages & Engines',
            summary: 'Identify rocket stages and what engines do at each phase of flight.',
            images: [],
            keywords: ['rocket', 'engine', 'staging'],
          },
        ],
      };
    case 'space-poster':
      return {
        missionTitle: 'Space Poster (Seed)',
        introduction: intro('Space Poster'),
        topics: [
          {
            title: 'Nebula Focus',
            summary: 'Create a single-page poster featuring a nebula with a few key facts.',
            images: [],
            keywords: ['nebula', 'poster', 'stars'],
          },
        ],
      };
    case 'rover-cam':
      return {
        missionTitle: 'Rover Cam (Seed)',
        introduction: intro('Rover Cam'),
        topics: [
          {
            title: 'Navigation Cameras',
            summary: 'Explore what rover NavCams capture and how they aid in driving.',
            images: [],
            keywords: ['rover', 'camera', 'navcam'],
          },
        ],
      };
    case 'celestial-investigator':
    default:
      return {
        missionTitle: 'Celestial Investigator (Seed)',
        introduction: intro('Celestial Investigator'),
        topics: [
          {
            title: 'Orion Nebula (M42)',
            summary: 'Investigate the Orion Nebula and what it reveals about star formation.',
            images: [],
            keywords: ['orion', 'nebula', 'star formation'],
          },
        ],
      };
  }
}

/* ─────────────────────────────────────────────────────────
   Core generation
────────────────────────────────────────────────────────── */

async function generateUniqueMission(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
  attempt = 1,
): Promise<EnrichedMissionPlan | null> {
  if (attempt > MAX_GENERATION_ATTEMPTS) {
    console.error(
      `[library] Failed to generate unique mission for ${missionType}/${role} after ${MAX_GENERATION_ATTEMPTS} attempts.`,
    );
    return null;
  }

  // pass a changing seed to *every* mission type (Earth Observer must use it)
  const seedIndex = Date.now() + attempt;

  let newPlan: EnrichedMissionPlan;
  try {
    newPlan = await computeMission(role, missionType, context, { seedIndex });
  } catch (e) {
    console.warn(
      `[library] computeMission failed for ${missionType}/${role} (attempt ${attempt}).`,
      e instanceof Error ? e.message : String(e),
    );
    // try again with next attempt (this still increments the seed)
    return generateUniqueMission(missionType, role, context, attempt + 1);
  }

  assertDb(context.db);
  const baseRef = context.db.collection('mission_plans').doc(missionType).collection('variants');
  const variantsRef = baseRef.withConverter(missionVariantConverter);
  const newHash = hashMissionPlan(newPlan);

  // check for dup content (across all roles in this missionType)
  const duplicateCheck = await variantsRef.where('contentHash', '==', newHash).limit(1).get();
  if (!duplicateCheck.empty) {
    console.warn(
      `[library] Duplicate content detected for ${missionType}/${role} (attempt ${attempt}). Retrying...`,
    );
    return generateUniqueMission(missionType, role, context, attempt + 1);
  }

  return newPlan;
}

async function writePlans(
  variantsRef: FirebaseFirestore.CollectionReference<MissionVariantData>,
  role: Role,
  plans: EnrichedMissionPlan[],
): Promise<number> {
  if (plans.length === 0) return 0;
  const batch = variantsRef.firestore.batch();
  for (const plan of plans) {
    const docRef = variantsRef.doc();
    batch.set(docRef, {
      generatedAt: Timestamp.now(),
      role,
      plan,
      contentHash: hashMissionPlan(plan),
    });
  }
  await batch.commit();
  return plans.length;
}

async function ensureSeedIfEmpty(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
): Promise<void> {
  assertDb(context.db);
  const baseRef = context.db.collection('mission_plans').doc(missionType).collection('variants');
  const variantsRef = baseRef.withConverter(missionVariantConverter);

  // If absolutely empty for this missionType, write exactly one seed doc for the role
  const snapshot = await variantsRef.limit(1).get();
  if (!snapshot.empty) return;

  const seed = buildSeedPlan(missionType, role);
  // Tag the hash so we don’t trip future dup check (and so we can prune seeds later)
  const seedHash = `${hashMissionPlan(seed)}|seed`;

  try {
    await variantsRef.add({
      generatedAt: Timestamp.now(),
      role,
      plan: seed,
      contentHash: seedHash,
    });
    console.log(`[library][${missionType}][${role}] Seed variant inserted.`);
  } catch (e) {
    console.warn(`[library][${missionType}][${role}] Failed to insert seed (continuing):`, e);
  }
}

/* ─────────────────────────────────────────────────────────
   Enrichment (proactive seeding)
────────────────────────────────────────────────────────── */

async function enrichPool(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
): Promise<void> {
  assertDb(context.db);
  const db = context.db;
  const logPrefix = `[library][${missionType}][${role}]`;

  const baseRef = db.collection('mission_plans').doc(missionType).collection('variants');
  const variantsRef = baseRef.withConverter(missionVariantConverter);

  try {
    // Count existing docs for this role
    const countSnapshot = await variantsRef.where('role', '==', role).count().get();
    const existingCount = countSnapshot.data()?.count ?? 0;
    const deficit = Math.max(0, MIN_VARIANTS_PER_ROLE - existingCount);
    if (deficit <= 0) return;

    console.log(`${logPrefix} Underpopulated (${existingCount}/${MIN_VARIANTS_PER_ROLE}). Need ${deficit}.`);

    const generationPromises = Array.from({ length: deficit }, (_, i) =>
      generateUniqueMission(missionType, role, context, i + 1),
    );
    const newPlans = (await Promise.all(generationPromises)).filter(
      (p): p is EnrichedMissionPlan => p !== null,
    );

    if (newPlans.length === 0) {
      // As a last resort, make sure at least one variant exists for this mission type
      console.error(`${logPrefix} No unique variants after all attempts. Ensuring seed…`);
      await ensureSeedIfEmpty(missionType, role, context);
      return;
    }

    const added = await writePlans(variantsRef, role, newPlans);
    console.log(`${logPrefix} Added ${added} new unique variants.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${logPrefix} CRITICAL: Background enrichment failed.`, { error: message });
    // Even if enrichment fails, ensure the missionType has a seed so the app is non-blocking.
    await ensureSeedIfEmpty(missionType, role, context);
  }
}

/* ─────────────────────────────────────────────────────────
   Proactive maintenance
────────────────────────────────────────────────────────── */

async function checkAndEnrichEntireLibrary(context: WorkerContext): Promise<void> {
  console.log('[library] Starting proactive maintenance check of all mission pools…');
  const tasks: Array<Promise<void>> = [];
  for (const missionType of ALL_MISSION_TYPES) {
    for (const role of ALL_ROLES) {
      tasks.push(enrichPool(missionType, role, context));
    }
  }
  await Promise.allSettled(tasks);
  console.log('[library] Proactive maintenance check complete.');
}

export function startLibraryMaintenance(context: WorkerContext): NodeJS.Timeout {
  console.log(
    `[library] Proactive maintenance loop starting. Interval=${Math.round(MAINTENANCE_INTERVAL_MS / 1000)}s`,
  );
  // Kick off immediately
  void checkAndEnrichEntireLibrary(context);
  return setInterval(() => void checkAndEnrichEntireLibrary(context), MAINTENANCE_INTERVAL_MS);
}

/* ─────────────────────────────────────────────────────────
   Retrieval (called by the 'mission' job handler)
────────────────────────────────────────────────────────── */

export async function retrieveMissionForUser(
  missionType: MissionType,
  role: Role,
  context: WorkerContext,
): Promise<EnrichedMissionPlan> {
  assertDb(context.db);
  const db = context.db;
  const redis = context.redis;
  const logPrefix = `[library][${missionType}]`;

  const baseRef = db.collection('mission_plans').doc(missionType).collection('variants');
  const variantsRef = baseRef.withConverter(missionVariantConverter);

  const userSeenKey = `user:${role}:seen-missions:${missionType}`;

  const [roleDocs, explorerDocs, seenMissionIds] = await Promise.all([
    variantsRef.where('role', '==', role).get(),
    variantsRef.where('role', '==', 'explorer').get(), // generic fallback pool
    redis.smembers(userSeenKey),
  ]);

  const asVariant = (doc: QueryDocumentSnapshot<MissionVariantData>): MissionVariant => ({
    id: doc.id,
    ...doc.data(),
  });

  const rolePool: MissionVariant[] = roleDocs.docs.map(asVariant);
  const genericPool: MissionVariant[] = explorerDocs.docs.map(asVariant);

  let chosen: MissionVariant | undefined;

  // Prefer unseen role-specific
  const unseenRole = rolePool.filter((v) => !seenMissionIds.includes(v.id));
  if (unseenRole.length > 0) chosen = randPick(unseenRole);

  // Then unseen generic
  if (!chosen) {
    const unseenGeneric = genericPool.filter((v) => !seenMissionIds.includes(v.id));
    if (unseenGeneric.length > 0) chosen = randPick(unseenGeneric);
  }

  // If still nothing, try *any* variant in the missionType
  if (!chosen) {
    const anyDoc = await variantsRef.limit(1).get();
    if (!anyDoc.empty) {
      chosen = asVariant(anyDoc.docs[0]);
    }
  }

  // If the library is completely empty, compute a plan immediately and try to persist;
  // even if persistence fails, return the plan to keep UX unblocked.
  if (!chosen) {
    console.warn(`${logPrefix} Library empty for role '${role}'. Generating emergency plan…`);
    const emergency =
      (await generateUniqueMission(missionType, role, context, 1)) ??
      buildSeedPlan(missionType, role);

    // try to store (best effort)
    try {
      await variantsRef.add({
        generatedAt: Timestamp.now(),
        role,
        plan: emergency,
        contentHash: `${hashMissionPlan(emergency)}|emergency`,
      });
      console.log(`${logPrefix} Emergency plan stored for '${role}'.`);
    } catch (e) {
      console.warn(`${logPrefix} Emergency plan store failed (continuing):`, e);
    }

    // return regardless of store outcome
    const intro =
      emergency.introduction?.replace(/welcome.*?\./i, `Welcome, ${role}.`) ?? `Welcome, ${role}.`;
    return { ...emergency, introduction: intro };
  }

  // Mark as seen (best effort)
  void redis
    .sadd(userSeenKey, chosen.id)
    .then(() => redis.expire(userSeenKey, USER_SEEN_MISSIONS_TTL_SECONDS))
    .catch((e: unknown) => console.warn(`${logPrefix} Unable to persist seen mission id`, e));

  const intro =
    chosen.plan.introduction?.replace(/welcome.*?\./i, `Welcome, ${role}.`) ?? `Welcome, ${role}.`;
  return { ...chosen.plan, introduction: intro };
}
