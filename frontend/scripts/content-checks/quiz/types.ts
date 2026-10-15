import type { Question } from '../../../src/lib/quiz/core';

/** A lesson's independent checks for its quiz generator. */
export type Verifier = {
  /** Recompute the question's answers by a different route (mathjs, exact fractions). A problem, or null. */
  verify: (q: Question) => string | null;
  /** Typed slips that must be rejected with feedback containing `expect`. */
  mistakes?: (q: Question) => { step: number; typed: string; expect: string }[];
  /** A check across all generated questions, such as answer positions being spread out. */
  aggregate?: (qs: Question[]) => string | null;
};
