/* eslint-disable no-console */
import type { EnrichedMissionPlan } from '@/types/mission';
import type { MissionType, Role } from '@/types/llm';

import * as admin from 'firebase-admin';

function getAdmin(): admin.app.App {
  if (!admin.apps.length) {

    admin.initializeApp();
  }
  return admin.app();
}

const db = () => getAdmin().firestore();

// Tunables
const FRESH_MS = Number(process.env.MISSION_FRESH_MS ?? 6 * 60 * 60 * 1000); // 6h fresh
const HARD_TTL_MS = Number(process.env.MISSION_HARD_TTL_MS ?? 7 * 24 * 60 * 60 * 1000); // 7d expire

export interface MissionDoc {
  missionType: MissionType;
  role: Role;
  plan: EnrichedMissionPlan;
  updatedAt: number;      // ms epoch
  version?: number;       // optional schema versioning
}

export function missionDocId(missionType: MissionType, role: Role) {
  return `${missionType}:${role}`;
}

export async function getMissionPlan(
  missionType: MissionType,
  role: Role
): Promise<MissionDoc | null> {
  const doc = await db().collection('mission_plans').doc(missionDocId(missionType, role)).get();
  if (!doc.exists) return null;
  const data = doc.data() as MissionDoc | undefined;
  return data ?? null;
}

export async function saveMissionPlan(doc: MissionDoc): Promise<void> {
  await db().collection('mission_plans').doc(missionDocId(doc.missionType, doc.role)).set(
    { ...doc, updatedAt: Date.now() },
    { merge: true }
  );
}

export function isFresh(updatedAt: number): boolean {
  return Date.now() - updatedAt < FRESH_MS;
}

export function isExpired(updatedAt: number): boolean {
  return Date.now() - updatedAt > HARD_TTL_MS;
}
