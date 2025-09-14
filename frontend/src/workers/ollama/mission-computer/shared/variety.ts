/* eslint-disable no-console */
import type { Role, MissionType } from '@/types/llm';

export type VarietyRecipe = {
  lens: string;        // angle to view topic (physics/history/systems/…)
  output: string;      // format (compare/contrast, explainer, lab, …)
  challenge: string;   // task type (predict/diagnose/optimize/…)
  noveltyKey: string;  // stable label for dedupe/debug/logs
};

function rng(seed: number) {
  // Mulberry32
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: readonly T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

const LENSES = [
  'physics-first',
  'systems-engineering',
  'history-to-modern',
  'mission-ops',
  'data-analysis',
  'design-build',
  'ethics-and-risk',
] as const;

const OUTPUTS = [
  'explainer-with-schematics',
  'compare-and-contrast',
  'step-by-step-lab',
  'simulation-thought-experiment',
  'case-study',
  'faq-brief',
  'debate-two-sides',
] as const;

const CHALLENGES = [
  'predict',
  'diagnose',
  'optimize',
  'classify',
  'rank',
  'generate-hypotheses',
] as const;

export function makeVariety(
  seed: number,
  role: Role,
  mission: MissionType,
  attempt = 1,
  extraSalts: Array<string | number> = []
): VarietyRecipe {
  // Combine ingredients so each attempt gets a different vector
  const mix = [seed, role, mission, attempt, ...extraSalts].join('|');
  let h = 0;
  for (let i = 0; i < mix.length; i++) h = (h * 31 + mix.charCodeAt(i)) | 0;
  const r = rng(h >>> 0);

  const lens = pick(LENSES, r);
  const output = pick(OUTPUTS, r);
  const challenge = pick(CHALLENGES, r);
  const noveltyKey = `${lens}/${output}/${challenge}`;
  return { lens, output, challenge, noveltyKey };
}
