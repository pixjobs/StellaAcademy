/* eslint-disable no-console */

/**
 * @file mission-computer.ts
 * @description
 * A thin router that delegates mission generation requests to modular mission
 * implementations. It includes centralized error handling and logging.
 */

import type { WorkerContext } from './context';
import type { Role, MissionType } from '@/types/llm';
import type { EnrichedMissionPlan } from '@/types/mission';

import { missionEarthObserver } from './mission-computer/missions/earthObserver';
import { missionRocketLab } from './mission-computer/missions/rocketLab';
import { missionSpacePoster } from './mission-computer/missions/spacePoster';
import { missionRoverCam } from './mission-computer/missions/roverCam';
import { missionCelestialInvestigator } from './mission-computer/missions/celestialInvestigator';
import type { GenerationOpts } from './mission-computer/shared/types';
// --- FIX APPLIED HERE: Corrected the relative path ---
import { logger } from './utils/logger';

/**
 * Creates a standard fallback mission plan when generation fails.
 * @param reason A brief description of the failure.
 * @returns An EnrichedMissionPlan object for the aborted mission.
 */
function fallback(reason?: string): EnrichedMissionPlan {
  const r = reason ?? 'An unexpected error occurred.';
  return {
    missionTitle: 'Mission Aborted',
    introduction: `We were unable to generate your mission. Reason: ${r.slice(0, 200)}`,
    topics: [],
  };
}

/**
 * Main entry point for the mission generation worker.
 * Delegates to specific mission modules based on missionType and always returns a valid plan.
 */
export async function computeMission(
  role: Role,
  missionType: MissionType,
  context: WorkerContext,
  options?: GenerationOpts,
): Promise<EnrichedMissionPlan> {
  try {
    switch (missionType) {
      case 'earth-observer':
        return missionEarthObserver(role, context, options);

      case 'rocket-lab':
        return missionRocketLab(role, context, options);

      case 'space-poster':
        return missionSpacePoster(role, context, options);

      case 'rover-cam':
        return missionRoverCam(role);

      case 'celestial-investigator':
        return missionCelestialInvestigator(role, context, options);

      default:
        logger.warn(`[mission] Unknown missionType '${missionType}'. Falling back to Rocket Lab.`);
        return missionRocketLab(role, context, options);
    }
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    logger.error(`[mission] FATAL computeMission for type='${missionType}' role='${role}':`, e);
    return fallback(e.message);
  }
}

export default computeMission;