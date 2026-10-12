import type { CategoryId, ConceptId } from '@/lib/study-modules';

export type LevelId = 'foundations' | 'gcse' | 'a-level';
export type SubjectId = 'physics' | 'maths';

/** Youngest first. Ages are a guide to who each level suits, not a rule about who may use it. */
export const LEVELS: { id: LevelId; label: string; ages: string; blurb: string }[] = [
  { id: 'foundations', label: 'Foundations', ages: 'ages 9 to 13', blurb: 'Number skills and first ideas in physics.' },
  { id: 'gcse', label: 'GCSE', ages: 'ages 14 to 16', blurb: 'The core ideas of school physics and maths.' },
  { id: 'a-level', label: 'A-level', ages: 'ages 16 and up', blurb: 'Sixth-form topics, including further maths.' },
];

/**
 * Levels are an editorial guide to difficulty, not a mapping to any exam
 * board's specification. Keep that caveat visible wherever they are shown.
 */
const LEVEL_BY_ID: Record<ConceptId, LevelId> = {
  arithmetic: 'foundations',
  'basic-geometry': 'foundations',
  multiplication: 'foundations',
  'negative-numbers': 'foundations',
  'decimals-percentages': 'foundations',
  'fraction-ops': 'foundations',
  fractions: 'foundations',
  proportions: 'foundations',
  gears: 'foundations',

  circuit: 'gcse',
  waves: 'gcse',
  prism: 'gcse',
  momentum: 'gcse',
  trigonometry: 'gcse',
  probability: 'gcse',
  statistics: 'gcse',
  'exponents-roots': 'gcse',
  vectors: 'gcse',
  binary: 'gcse',
  units: 'gcse',

  angles: 'a-level',
  gravity: 'a-level',
  trajectory: 'a-level',
  calculus: 'a-level',
  thermodynamics: 'a-level',
  electromagnetism: 'a-level',
  matrices: 'a-level',
  quantum: 'a-level',
  diffeq: 'a-level',
};

const SUBJECT_BY_CATEGORY: Record<CategoryId, SubjectId> = {
  physics: 'physics',
  mechanics: 'physics',
  electronics: 'physics',
  mathematics: 'maths',
  'elementary-math': 'maths',
};

/** Tile colours for lesson diagrams, one per topic area. */
export const CATEGORY_TILE: Record<CategoryId, string> = {
  physics: 'bg-indigo-500/20 text-indigo-100 ring-indigo-400/30',
  mechanics: 'bg-amber-500/20 text-amber-50 ring-amber-400/30',
  electronics: 'bg-emerald-500/20 text-emerald-50 ring-emerald-400/30',
  mathematics: 'bg-rose-500/20 text-rose-50 ring-rose-400/30',
  'elementary-math': 'bg-violet-500/20 text-violet-50 ring-violet-400/30',
};

export const SUBJECT_LABEL: Record<SubjectId, string> = { physics: 'Physics', maths: 'Maths' };

export function levelOf(id: ConceptId): LevelId {
  return LEVEL_BY_ID[id];
}

export function levelLabel(id: ConceptId): string {
  return LEVELS.find((l) => l.id === LEVEL_BY_ID[id])!.label;
}

export function levelAges(id: ConceptId): string {
  return LEVELS.find((l) => l.id === LEVEL_BY_ID[id])!.ages;
}

export function subjectOf(category: CategoryId): SubjectId {
  return SUBJECT_BY_CATEGORY[category];
}

/** The small, serialisable shape lesson lists need (keeps full lesson data out of list bundles). */
export type LessonSummary = {
  id: ConceptId;
  category: CategoryId;
  title: string;
  subtitle: string;
  minutes: number;
  level: LevelId;
  subject: SubjectId;
};

/** How a lesson's level reads in a search result, e.g. "GCSE physics lesson". */
export function searchLabel(id: ConceptId, category: CategoryId): string {
  const subject = SUBJECT_LABEL[subjectOf(category)].toLowerCase();
  const level = LEVEL_BY_ID[id];
  if (level === 'foundations') return `${subject} lesson for ages 9 to 13`;
  return `${levelLabel(id)} ${subject} lesson`;
}
