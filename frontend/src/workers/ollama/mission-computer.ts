/* eslint-disable no-console */
// workers/ollama/mission-computer.ts
// Thin router that delegates to modular mission implementations.
// Keep this file name to satisfy existing imports in your app.

import type { WorkerContext } from './context';
import type { Role, MissionType } from '@/types/llm';
import type { EnrichedMissionPlan } from '@/types/mission';

import { missionEarthObserver } from './mission-computer/missions/earthObserver';
import { missionRocketLab } from './mission-computer/missions/rocketLab';
import { missionSpacePoster } from './mission-computer/missions/spacePoster';
import { missionRoverCam } from './mission-computer/missions/roverCam';
import { missionCelestialInvestigator } from './mission-computer/missions/celestialInvestigator';
import type { GenerationOpts } from './mission-computer/shared/types';

function fallback(reason?: string): EnrichedMissionPlan {
  const r = reason ?? 'An unexpected error occurred.';
  return {
    missionTitle: 'Mission Aborted',
    introduction: `We were unable to generate your mission. Reason: ${r.slice(0, 200)}`,
    topics: [],
  };
}

/**
 * Main entry used by the worker / library code.
 * Delegates to mission modules; always returns a plan.
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
        // Role is intentionally ignored for this mission (it’s product/camera–driven).
        return missionEarthObserver(role, context);

      case 'rocket-lab':
        return missionRocketLab(role, context);

      case 'space-poster':
        return missionSpacePoster(role, context);

      case 'rover-cam':
        // Current rover mission does not need context.
        return missionRoverCam(role);

      case 'celestial-investigator':
        return missionCelestialInvestigator(role, context, options);

      default:
        console.warn(`[mission] Unknown missionType '${missionType}'. Falling back to Rocket Lab.`);
        return missionRocketLab(role, context);
    }
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error(`[mission] FATAL computeMission for type='${missionType}' role='${role}':`, e);
    return fallback(e.message);
  }
}

export default computeMission;
