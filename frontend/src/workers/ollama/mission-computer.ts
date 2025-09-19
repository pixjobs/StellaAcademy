/* eslint-disable no-console */
/**
 * Mission dispatcher: routes (role, missionType) to the correct generator.
 * Keeps this module free of any imports from mission-library to avoid cycles.
 */

import type { WorkerContext } from './context';
import type { EnrichedMissionPlan } from '@/types/mission';
import type { Role, MissionType } from '@/types/llm';
import type { GenerationOpts } from './mission-computer/shared/types';

// Individual mission generators
import { missionRocketLab } from './mission-computer/missions/rocketLab';
import { missionSpacePoster } from './mission-computer/missions/spacePoster';
import { missionRoverCam } from './mission-computer/missions/roverCam';
import { missionEarthObserver } from './mission-computer/missions/earthObserver';
import { missionCelestialInvestigator } from './mission-computer/missions/celestialInvestigator';

export async function computeMission(
  role: Role,
  missionType: MissionType,
  context: WorkerContext,
  options?: GenerationOpts,
): Promise<EnrichedMissionPlan> {
  switch (missionType) {
    case 'rocket-lab':
      return missionRocketLab(role, context, options);

    case 'space-poster':
      return missionSpacePoster(role, context, options);

    case 'rover-cam':
      // roverCam doesn’t need context/options but accepts them being ignored
      return missionRoverCam(role);

    case 'earth-observer':
      return missionEarthObserver(role, context, options);

    case 'celestial-investigator':
      return missionCelestialInvestigator(role, context, options);

    default: {
      // Fallback: very small empty plan to keep callers resilient
      const title = `Mission: ${missionType}`;
      return {
        missionTitle: title,
        introduction: `Welcome, ${role}. This mission type is not recognized yet.`,
        topics: [],
      };
    }
  }
}
