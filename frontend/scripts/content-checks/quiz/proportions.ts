import { create, all, type Fraction as MFraction } from 'mathjs';
import type { Question } from '../../../src/lib/quiz/core';
import type { ProportionCheck } from '../../../src/lib/quiz/proportions';
import type { Verifier } from './types';

const math = create(all);

/** Ratio and proportion: recomputed with mathjs fractions and the defining properties. */
export const proportionsVerifier: Verifier = {
  verify: (question) => {
    const c = (question as Question<ProportionCheck>).check;
    if (c.kind === 'simplify') {
      const g = Number(math.gcd(c.a, c.b));
      return c.answer === `${c.a / g} : ${c.b / g}` ? null : `${c.a}:${c.b} → ${c.answer}`;
    }
    if (c.kind === 'share') {
      const first = math.multiply(math.fraction(c.p, c.p + c.q), c.total) as MFraction;
      const second = c.total - Number(math.number(first));
      // The two shares are in the ratio p : q and add up to the total.
      if (Number(math.number(first)) * c.q !== second * c.p) return 'shares not in ratio';
      const ok = c.answer === `£${second}` || c.answer === `${second} kg` || c.answer === math.format(math.fraction(c.p, c.p + c.q), { fraction: 'ratio' });
      return ok ? null : `share ${c.total} ${c.p}:${c.q}: ${c.answer}`;
    }
    if (c.kind === 'direct') return c.answer * c.n1 === c.v1 * c.n2 ? null : `direct: ${c.answer}`;
    // Inverse: the product stays the same.
    return c.answer * c.n2 === c.v1 * c.n1 ? null : `inverse: ${c.answer}`;
  },
  mistakes: (question) => {
    const q = question as Question<ProportionCheck>;
    const c = q.check;
    if (c.kind === 'share') {
      const one = c.total / (c.p + c.q);
      return [c.total / c.p, c.total / c.q].filter((x) => Number.isInteger(x) && x !== one).map((x) => ({ step: 1, typed: String(x), expect: 'one part of the ratio' }));
    }
    if (c.kind === 'inverse') {
      const asDirect = (c.v1 * c.n2) / c.n1;
      return Number.isInteger(asDirect) && asDirect !== c.answer ? [{ step: 2, typed: String(asDirect), expect: 'direct proportion' }] : [];
    }
    if (c.kind === 'simplify') {
      // A common factor that is not the biggest is named as such.
      const g = Number(math.gcd(c.a, c.b));
      const smaller = [2, 3, 5, 7].find((p) => g % p === 0 && p !== g);
      return [{ step: 0, typed: '1', expect: 'every number' }, ...(smaller ? [{ step: 0, typed: String(smaller), expect: 'bigger number' }] : [])];
    }
    return [];
  },
};
