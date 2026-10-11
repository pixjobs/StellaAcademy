import { studyModules, type ConceptId, type StudyModule } from '@/lib/study-modules';
import { levelOf, subjectOf, type LessonSummary, type LevelId } from '@/lib/levels';

export function summarise(m: StudyModule): LessonSummary {
  return {
    id: m.id,
    category: m.category,
    title: m.title,
    subtitle: m.subtitle,
    minutes: m.estimatedMinutes,
    level: levelOf(m.id),
    subject: subjectOf(m.category),
  };
}

export const lessonSummaries: LessonSummary[] = studyModules.map(summarise);

export function lessonsAt(level: LevelId): LessonSummary[] {
  return lessonSummaries.filter((l) => l.level === level);
}

/** Next lesson at the same level, wrapping round; used for the end-of-lesson link. */
export function nextLesson(id: ConceptId): LessonSummary | null {
  const peers = lessonsAt(levelOf(id));
  const i = peers.findIndex((l) => l.id === id);
  if (i === -1 || peers.length < 2) return null;
  return peers[(i + 1) % peers.length];
}

export function summaryOf(id: ConceptId): LessonSummary {
  return lessonSummaries.find((l) => l.id === id)!;
}
