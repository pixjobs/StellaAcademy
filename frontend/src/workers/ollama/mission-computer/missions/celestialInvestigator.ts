/* eslint-disable no-console */
import type { WorkerContext } from '../../context';
import type { Role } from '@/types/llm';
import type { EnrichedMissionPlan, Img } from '@/types/mission';
import { ensureMissionPlan, ensureTopic, hasNasaApiKey, retry, tryNivlQueries, logNasa } from '../shared/core';
import type { GenerationOpts } from '../shared/types';

export async function missionCelestialInvestigator(
  role: Role,
  context: WorkerContext,
  options?: GenerationOpts, // <-- broadened to include attempt
): Promise<EnrichedMissionPlan> {
  const targets = [
    'Orion Nebula','Andromeda Galaxy','Pillars of Creation','Crab Nebula','Hubble Deep Field',
    'Ring Nebula','Carina Nebula','Whirlpool Galaxy','Eagle Nebula','Horsehead Nebula',
  ];

  // Mix seedIndex + attempt to diversify selections across retries/runs
  const seed = (options?.seedIndex ?? Date.now()) >>> 0;
  const attempt = Math.max(1, options?.attempt ?? 1);
  // Knuth multiplicative hash to stir bits; keep deterministic
  const mixed = (seed ^ (attempt * 0x9E3779B1)) >>> 0;
  const idx = mixed % targets.length;
  const target = targets[idx];

  const seeds = [target, 'Hubble Space Telescope', 'James Webb Space Telescope'];
  let images: Img[] = [];
  if (hasNasaApiKey()) {
    try {
      images = await retry(() => tryNivlQueries(seeds, context.redis, 8), { attempts: 2 });
      logNasa('CelestialInvestigator NIVL', { seeds, images: images.length });
    } catch (e) {
      console.warn('[mission][nasa] NIVL failed (celestial-investigator).', e);
    }
  }

  const topic = ensureTopic({
    title: `Investigation: ${target}`,
    summary: `Images of ${target} from multiple observatories.`,
    images,
  });

  return ensureMissionPlan({
    missionTitle: `Celestial Investigator: ${target}`,
    introduction: `Welcome, ${role}. Analyze ${target} using multi-observatory imagery and guided questions.`,
    topics: [topic],
  });
}
