// src/workers/ollama/preflight-library.ts
/* eslint-disable no-console */

import { Timestamp, type Firestore, type FirestoreDataConverter } from '@google-cloud/firestore';
import { createHash } from 'crypto';
import type { WorkerContext } from './context';
import type { Role, TutorPreflightJobData, TutorPreflightOutput } from '@/types/llm';
import type { EnrichedMissionPlan } from '@/types/mission';
import { logger } from './utils/logger';

// --- Firestore Types ---
type PreflightVariantData = {
  generatedAt: Timestamp;
  role: Role;
  preflight: TutorPreflightOutput;
  missionId: string;
  topicTitle: string;
};

const preflightVariantConverter: FirestoreDataConverter<PreflightVariantData> = {
  toFirestore: (data) => data,
  fromFirestore: (snap) => snap.data() as PreflightVariantData,
};

// --- Helpers ---

function assertDb(db: unknown): asserts db is Firestore {
  if (!db || typeof (db as Firestore).collection !== 'function') {
    throw new Error('[preflight-library] Firestore DB missing from WorkerContext.');
  }
}

function baseCollection(db: Firestore) {
  return db.collection('tutor_preflights').withConverter(preflightVariantConverter);
}

// --- FIX: New helper to safely get a string ID from the flexible mission type ---
/**
 * Safely extracts a string identifier from the mission payload.
 * @param mission The mission payload, which can be a string or an object.
 * @returns A string identifier for the mission.
 */
function getMissionId(mission: string | EnrichedMissionPlan): string {
  if (typeof mission === 'string') {
    return mission;
  }
  // If it's an object, prefer the contentHash, fall back to title, then a default.
  return (mission as any).contentHash || mission.missionTitle || 'default_mission';
}

function createCacheKey(payload: TutorPreflightJobData['payload']): string {
  const { mission, topicTitle, role } = payload;
  const missionId = getMissionId(mission); // Use the safe helper

  return createHash('sha256')
    .update(`${missionId}:${topicTitle}:${role}`)
    .digest('hex');
}

// --- Public Read/Write API ---

export async function retrievePreflightFromLibrary(
  payload: TutorPreflightJobData['payload'],
  context: WorkerContext,
): Promise<TutorPreflightOutput | null> {
  try {
    assertDb(context.db);
    const cacheKey = createCacheKey(payload);
    const docRef = baseCollection(context.db).doc(cacheKey);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      if (data) {
        logger.info(`[preflight-library] CACHE HIT for key: ${cacheKey.slice(0, 12)}...`);
        return data.preflight;
      }
    }

    logger.info(`[preflight-library] Cache MISS for key: ${cacheKey.slice(0, 12)}...`);
    return null;
  } catch (e) {
    logger.error('[preflight-library] Cache retrieval failed:', e);
    return null;
  }
}

export async function savePreflightToLibrary(
  payload: TutorPreflightJobData['payload'],
  preflight: TutorPreflightOutput,
  context: WorkerContext,
): Promise<void> {
  try {
    assertDb(context.db);
    const cacheKey = createCacheKey(payload);
    const docRef = baseCollection(context.db).doc(cacheKey);
    const missionId = getMissionId(payload.mission); // Use the safe helper

    await docRef.set({
      generatedAt: Timestamp.now(),
      role: payload.role,
      missionId: missionId, // This is now guaranteed to be a string
      topicTitle: payload.topicTitle,
      preflight,
    });
    logger.info(`[preflight-library] SAVED to cache with key: ${cacheKey.slice(0, 12)}...`);
  } catch (e) {
    logger.error('[preflight-library] Cache save failed:', e);
  }
}