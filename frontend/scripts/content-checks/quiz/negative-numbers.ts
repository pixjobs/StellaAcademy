import type { Question } from '../../../src/lib/quiz/core';
import type { NegativeCheck } from '../../../src/lib/quiz/negative-numbers';
import type { Verifier } from './types';

/** Negative numbers: recomputed by walking a number line one unit at a time, and by the sign rules. */
export const negativeNumbersVerifier: Verifier = {
  verify: (question) => {
    const c = (question as Question<NegativeCheck>).check;
    if (c.kind === 'add') {
      // Walk: adding moves right b steps, taking away moves left; a negative b turns the move round.
      const steps = c.op === '+' ? c.b : -c.b;
      let at = c.a;
      for (let i = 0; i < Math.abs(steps); i++) at += Math.sign(steps);
      return at === c.answer ? null : `${c.a} ${c.op} ${c.b}: ${c.answer} vs walk ${at}`;
    }
    if (c.kind === 'zero') {
      let count = 0;
      for (let t = c.low; t < c.high; t++) count++;
      return count === c.answer ? null : `from ${c.low} to ${c.high}: ${c.answer} vs ${count}`;
    }
    const size = c.op === '×' ? Math.abs(c.a) * Math.abs(c.b) : Math.abs(c.a) / Math.abs(c.b);
    const sign = (c.a < 0) === (c.b < 0) ? 1 : -1;
    return Math.abs(size * sign - c.answer) < 1e-9 ? null : `${c.a} ${c.op} ${c.b}: ${c.answer} vs ${size * sign}`;
  },
  mistakes: (question) => {
    const q = question as Question<NegativeCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    const minus = (x: number) => (x < 0 ? `-${-x}` : String(x));
    if (c.kind === 'add' && c.op === '−' && c.b < 0) return [{ step: last, typed: minus(c.a + c.b), expect: 'makes the answer bigger' }];
    if (c.kind === 'add') {
      const wrong = c.a - (c.op === '+' ? c.b : -c.b);
      return wrong === c.answer ? [] : [{ step: last, typed: minus(wrong), expect: 'wrong way' }];
    }
    if (c.kind === 'zero') return c.high + c.low === c.answer ? [] : [{ step: last, typed: String(Math.abs(c.high + c.low)), expect: 'add the two distances' }];
    return [{ step: last, typed: minus(-c.answer), expect: (c.a < 0) === (c.b < 0) ? 'is positive' : 'is negative' }];
  },
};
