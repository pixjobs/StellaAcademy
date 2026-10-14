import type { CategoryId, ConceptId } from '@/lib/study-modules';

export type LevelId = 'ks2' | 'ks3' | 'gcse' | 'a-level';
export type SubjectId = 'physics' | 'maths';

/**
 * The stages of the curriculum for England, youngest first. Ages are the usual
 * ages for each stage, not a rule about who may use a lesson.
 */
export const LEVELS: { id: LevelId; label: string; ages: string; blurb: string }[] = [
  { id: 'ks2', label: 'Key stage 2', ages: 'ages 9 to 11', blurb: 'Number skills from Years 5 and 6 of primary school.' },
  { id: 'ks3', label: 'Key stage 3', ages: 'ages 11 to 14', blurb: 'The first years of secondary school.' },
  { id: 'gcse', label: 'GCSE', ages: 'ages 14 to 16', blurb: 'Key stage 4: the core ideas of school physics and maths.' },
  { id: 'a-level', label: 'A-level', ages: 'ages 16 to 18', blurb: 'Sixth-form topics, including further maths.' },
];

/**
 * Each lesson's stage follows the Department for Education's national
 * curriculum and subject content (see lib/curriculum.ts for the statements).
 * That is the content every exam board must cover; it is not a match to one
 * board's specification, and the site should keep saying so.
 */
const LEVEL_BY_ID: Record<ConceptId, LevelId> = {
  arithmetic: 'ks2',
  multiplication: 'ks2',
  fractions: 'ks2',
  'fraction-ops': 'ks2',
  'decimals-percentages': 'ks2',
  'basic-geometry': 'ks2',

  'negative-numbers': 'ks3',
  proportions: 'ks3',
  'exponents-roots': 'ks3',
  binary: 'ks3',

  gears: 'gcse',
  units: 'gcse',
  circuit: 'gcse',
  waves: 'gcse',
  prism: 'gcse',
  momentum: 'gcse',
  trigonometry: 'gcse',
  probability: 'gcse',
  vectors: 'gcse',

  statistics: 'a-level',
  angles: 'a-level',
  gravity: 'a-level',
  trajectory: 'a-level',
  calculus: 'a-level',
  thermodynamics: 'a-level',
  electromagnetism: 'a-level',
  quantum: 'a-level',
  matrices: 'a-level',
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
  if (level === 'ks2') return `KS2 ${subject} lesson`;
  if (level === 'ks3') return `KS3 ${subject} lesson`;
  return `${levelLabel(id)} ${subject} lesson`;
}
