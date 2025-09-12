// workers/ollama/mission-library.ts
import { computeMission } from './mission-computer';
import type {
  EnrichedMissionPlan,
  Role,
  MissionType,
  MissionCacheEntry,
  MissionCacheKey,
} from '@/types/llm';

const memoryCache = new Map<MissionCacheKey, MissionCacheEntry>();

export function makeMissionKey(missionType: MissionType, role: Role): MissionCacheKey {
  return `${missionType}:${role}`;
}

export async function retrieveAndRefreshMission(
  missionType: MissionType,
  role: Role,
): Promise<EnrichedMissionPlan> {
  const key = makeMissionKey(missionType, role);

  const cached = memoryCache.get(key);
  if (cached) return cached.plan;

  // ✅ Correct argument order: (role, missionType)
  const plan = await computeMission(role, missionType);

  memoryCache.set(key, {
    key,
    plan,
    createdAt: new Date().toISOString(),
  });

  return plan;
}

export async function _seedInitialMissionLibrary(): Promise<void> {
  // Optional: pre-warm the cache with common combinations
  // e.g., await retrieveAndRefreshMission('rocket-lab', 'explorer');
}
