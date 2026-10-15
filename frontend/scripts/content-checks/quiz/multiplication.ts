import type { Question } from '../../../src/lib/quiz/core';
import type { MultiplicationCheck } from '../../../src/lib/quiz/multiplication';
import type { Verifier } from './types';

/** Long multiplication: the product with BigInt, the estimate from its own rounding, and the partial products. */
export const multiplicationVerifier: Verifier = {
  verify: (question) => {
    const q = question as Question<MultiplicationCheck>;
    const { a, b, estimate, answer } = q.check;
    if (BigInt(answer) !== BigInt(a) * BigInt(b)) return `${a} × ${b}: ${answer}`;
    const round = (x: number, to: number) => Math.floor(x / to + 0.5) * to;
    if (estimate !== round(a, a >= 1000 ? 100 : 10) * round(b, 10)) return `estimate for ${a} × ${b}: ${estimate}`;
    // The estimate is close enough to check against: within 40% of the answer.
    if (Math.abs(estimate - answer) / answer > 0.4) return `estimate ${estimate} is far from ${answer}`;
    return null;
  },
  mistakes: (question) => {
    const q = question as Question<MultiplicationCheck>;
    const { a, b } = q.check;
    const tens = Math.floor(b / 10);
    const at = q.steps.findIndex((s) => s.type === 'number' && /tens digit/.test(s.prompt));
    const last = q.steps.length - 1;
    const choice = q.steps[0];
    const sum = choice.type === 'choice' ? choice.options.find((o) => o.includes('+')) : undefined;
    return [
      ...(sum ? [{ step: 0, typed: sum, expect: 'Multiply' }] : []),
      { step: at, typed: String(a * tens), expect: 'ten times bigger' },
      { step: last, typed: String(a * (b % 10) + a * tens), expect: 'estimate' },
    ];
  },
};
