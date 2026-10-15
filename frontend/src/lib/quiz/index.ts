import type { ConceptId } from '@/lib/study-modules';
import type { LessonQuiz } from '@/lib/quiz/core';
import { arithmeticQuiz } from '@/lib/quiz/arithmetic';
import { basicGeometryQuiz } from '@/lib/quiz/basic-geometry';
import { binaryQuiz } from '@/lib/quiz/binary';
import { decimalsPercentagesQuiz } from '@/lib/quiz/decimals-percentages';
import { exponentsRootsQuiz } from '@/lib/quiz/exponents-roots';
import { fractionOpsQuiz } from '@/lib/quiz/fraction-ops';
import { fractionsQuiz } from '@/lib/quiz/fractions';
import { measuresQuiz } from '@/lib/quiz/measures';
import { multiplicationQuiz } from '@/lib/quiz/multiplication';
import { negativeNumbersQuiz } from '@/lib/quiz/negative-numbers';
import { proportionsQuiz } from '@/lib/quiz/proportions';

/** Lessons with a step-by-step quiz (KAN-70). On these, the quiz takes the place of the printed practice questions. */
export const QUIZZES: Partial<Record<ConceptId, LessonQuiz>> = {
  measures: measuresQuiz as LessonQuiz,
  'decimals-percentages': decimalsPercentagesQuiz as LessonQuiz,
  fractions: fractionsQuiz as LessonQuiz,
  'fraction-ops': fractionOpsQuiz as LessonQuiz,
  arithmetic: arithmeticQuiz as LessonQuiz,
  multiplication: multiplicationQuiz as LessonQuiz,
  'basic-geometry': basicGeometryQuiz as LessonQuiz,
  'negative-numbers': negativeNumbersQuiz as LessonQuiz,
  proportions: proportionsQuiz as LessonQuiz,
  'exponents-roots': exponentsRootsQuiz as LessonQuiz,
  binary: binaryQuiz as LessonQuiz,
};

export const hasQuiz = (id: ConceptId) => id in QUIZZES;
