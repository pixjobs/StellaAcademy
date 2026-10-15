import { create, all, type Fraction as MFraction } from 'mathjs';
import type { Question } from '../../../src/lib/quiz/core';
import type { FractionsCheck } from '../../../src/lib/quiz/fractions';
import type { Verifier } from './types';

const math = create(all);
const frac = (n: number, d: number) => math.fraction(n, d) as MFraction;
const text = (f: MFraction) => (Number(f.d) === 1 ? String(f.n) : `${f.n}/${f.d}`);

/** Fractions: every answer recomputed with mathjs fractions. */
export const fractionsVerifier: Verifier = {
  verify: (question) => {
    const q = question as Question<FractionsCheck>;
    const c = q.check;
    switch (c.kind) {
      case 'scale-up':
      case 'scale-down': {
        // The missing number makes the two fractions equal.
        const missing = Number(c.answer);
        return math.equal(frac(c.n, c.d), frac(missing, c.to)) && Number.isInteger(missing) ? null : `${c.n}/${c.d} = ${missing}/${c.to} is not equal`;
      }
      case 'simplest':
        return text(frac(c.n, c.d)) === c.answer && c.answer !== `${c.n}/${c.d}` ? null : `simplest ${c.n}/${c.d}: ${c.answer} vs ${text(frac(c.n, c.d))}`;
      case 'of-amount': {
        const want = math.number(math.multiply(frac(c.n, c.d), c.a) as MFraction);
        return Number(c.answer) === want ? null : `${c.n}/${c.d} of ${c.a}: ${c.answer} vs ${want}`;
      }
      case 'part-whole':
        return text(frac(c.part, c.whole)) === c.answer ? null : `${c.part} of ${c.whole}: ${c.answer} vs ${text(frac(c.part, c.whole))}`;
    }
  },
  mistakes: (question) => {
    const q = question as Question<FractionsCheck>;
    const c = q.check;
    if (c.kind === 'scale-up') {
      const added = c.n + (c.to - c.d);
      return added === Number(c.answer) ? [] : [{ step: 1, typed: String(added), expect: 'added' }];
    }
    if (c.kind === 'scale-down') {
      const taken = c.n - (c.d - c.to);
      return taken <= 0 || taken === Number(c.answer) ? [] : [{ step: 1, typed: String(taken), expect: 'took' }];
    }
    if (c.kind === 'of-amount') {
      const byTop = c.a / c.n;
      return Number.isInteger(byTop) && byTop !== c.a / c.d ? [{ step: 0, typed: String(byTop), expect: 'top number' }] : [];
    }
    if (c.kind === 'part-whole') return [{ step: 0, typed: `${c.whole}/${c.part}`, expect: 'upside down' }];
    if (c.kind === 'simplest') {
      // A common factor that is not the biggest is named as such.
      const g = Number(math.gcd(c.n, c.d));
      const smaller = [2, 3, 5, 7].find((p) => g % p === 0 && p !== g);
      return smaller ? [{ step: 0, typed: String(smaller), expect: 'bigger number' }] : [];
    }
    return [];
  },
};
