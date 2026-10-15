import type { ConceptId } from '@/lib/study-modules';
import type { LessonQuiz } from '@/lib/quiz/core';
import { decimalsPercentagesQuiz } from '@/lib/quiz/decimals-percentages';
import { measuresQuiz } from '@/lib/quiz/measures';

/** Lessons with a step-by-step quiz (KAN-70). On these, the quiz takes the place of the printed practice questions. */
export const QUIZZES: Partial<Record<ConceptId, LessonQuiz>> = {
  measures: measuresQuiz as LessonQuiz,
  'decimals-percentages': decimalsPercentagesQuiz as LessonQuiz,
};

export const hasQuiz = (id: ConceptId) => id in QUIZZES;
