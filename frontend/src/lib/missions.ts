import type { ConceptId } from '@/lib/study-modules';

export type MissionId = 'toolkit' | 'orbit' | 'navigate' | 'signal' | 'starlight';

export type Mission = {
  id: MissionId;
  title: string;
  /** One line on what this stretch of the journey is for. */
  goal: string;
  /** Lessons in the order they are taken. Every lesson belongs to exactly one mission. */
  lessons: ConceptId[];
};

/** Stella's journey: five missions, in order, from first number skills to reading starlight. */
export const MISSIONS: Mission[] = [
  {
    id: 'toolkit',
    title: 'Build your toolkit',
    goal: 'The number skills every other mission relies on.',
    lessons: ['arithmetic', 'negative-numbers', 'multiplication', 'fractions', 'fraction-ops', 'decimals-percentages', 'proportions', 'basic-geometry', 'exponents-roots', 'measures'],
  },
  {
    id: 'orbit',
    title: 'Get to orbit',
    goal: 'What it takes to leave the ground and stay up.',
    lessons: ['units', 'gears', 'momentum', 'thermodynamics', 'gravity', 'trajectory'],
  },
  {
    id: 'navigate',
    title: 'Navigate',
    goal: 'The maths of knowing where you are and where you are heading.',
    lessons: ['trigonometry', 'vectors', 'angles', 'matrices', 'calculus', 'diffeq'],
  },
  {
    id: 'signal',
    title: 'Talk to the spacecraft',
    goal: 'How a spacecraft is powered, and how it sends word home.',
    lessons: ['circuit', 'waves', 'binary', 'probability'],
  },
  {
    id: 'starlight',
    title: 'Read the starlight',
    goal: 'What light and data tell us about things too far away to visit.',
    lessons: ['prism', 'statistics', 'electromagnetism', 'quantum'],
  },
];

/** Where a lesson sits: its mission and its step within it (counting from 1). */
export function placeOf(id: ConceptId): { mission: Mission; missionNumber: number; step: number } | null {
  for (let m = 0; m < MISSIONS.length; m++) {
    const i = MISSIONS[m].lessons.indexOf(id);
    if (i !== -1) return { mission: MISSIONS[m], missionNumber: m + 1, step: i + 1 };
  }
  return null;
}

/** The step after this one: the next lesson in the mission, or the first lesson of the next mission. */
export function stepAfter(id: ConceptId): { lesson: ConceptId; newMission: Mission | null } | null {
  const place = placeOf(id);
  if (!place) return null;
  const within = place.mission.lessons[place.step];
  if (within) return { lesson: within, newMission: null };
  const nextMission = MISSIONS[place.missionNumber];
  return nextMission ? { lesson: nextMission.lessons[0], newMission: nextMission } : null;
}
