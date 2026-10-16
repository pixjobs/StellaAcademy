import type { ConceptId } from '@/lib/study-modules';
import type { LessonQuiz } from '@/lib/quiz/core';
import { anglesQuiz } from '@/lib/quiz/angles';
import { arithmeticQuiz } from '@/lib/quiz/arithmetic';
import { basicGeometryQuiz } from '@/lib/quiz/basic-geometry';
import { binaryQuiz } from '@/lib/quiz/binary';
import { calculusQuiz } from '@/lib/quiz/calculus';
import { diffeqQuiz } from '@/lib/quiz/diffeq';
import { unitsQuiz } from '@/lib/quiz/units';
import { circuitQuiz } from '@/lib/quiz/circuit';
import { decimalsPercentagesQuiz } from '@/lib/quiz/decimals-percentages';
import { exponentsRootsQuiz } from '@/lib/quiz/exponents-roots';
import { fractionOpsQuiz } from '@/lib/quiz/fraction-ops';
import { fractionsQuiz } from '@/lib/quiz/fractions';
import { matricesQuiz } from '@/lib/quiz/matrices';
import { measuresQuiz } from '@/lib/quiz/measures';
import { multiplicationQuiz } from '@/lib/quiz/multiplication';
import { negativeNumbersQuiz } from '@/lib/quiz/negative-numbers';
import { probabilityQuiz } from '@/lib/quiz/probability';
import { proportionsQuiz } from '@/lib/quiz/proportions';
import { statisticsQuiz } from '@/lib/quiz/statistics';
import { trigonometryQuiz } from '@/lib/quiz/trigonometry';
import { vectorsQuiz } from '@/lib/quiz/vectors';

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
  trigonometry: trigonometryQuiz as LessonQuiz,
  vectors: vectorsQuiz as LessonQuiz,
  probability: probabilityQuiz as LessonQuiz,
  statistics: statisticsQuiz as LessonQuiz,
  angles: anglesQuiz as LessonQuiz,
  matrices: matricesQuiz as LessonQuiz,
  calculus: calculusQuiz as LessonQuiz,
  diffeq: diffeqQuiz as LessonQuiz,
  units: unitsQuiz as LessonQuiz,
  circuit: circuitQuiz as LessonQuiz,
};

export const hasQuiz = (id: ConceptId) => id in QUIZZES;
