import { create, all, type Fraction as MFraction } from 'mathjs';
import type { Question } from '../../../src/lib/quiz/core';
import type { ProbabilityCheck } from '../../../src/lib/quiz/probability';
import type { Verifier } from './types';

const math = create(all);
const fr = (x: string | number, y?: number) => (y === undefined ? math.fraction(String(x)) : math.fraction(Number(x), y)) as MFraction;
const same = (a: MFraction, b: MFraction) => math.equal(a, b) as boolean;

/** Probability: every answer recomputed with mathjs fractions, by counting outcomes where possible. */
export const probabilityVerifier: Verifier = {
  verify: (question) => {
    const c = (question as Question<ProbabilityCheck>).check;
    switch (c.kind) {
      case 'single':
        return same(fr(c.answer), fr(c.want, c.total)) ? null : `single ${c.want}/${c.total}: ${c.answer}`;
      case 'not-decimal':
        return same(fr(c.answer), math.subtract(1, fr(c.p)) as MFraction) ? null : `not ${c.p}: ${c.answer}`;
      case 'and':
        return same(fr(c.answer), math.multiply(fr(c.p), fr(c.q)) as MFraction) ? null : `and ${c.p} ${c.q}: ${c.answer}`;
      case 'or': {
        // Count the faces in the set.
        const faces = [...Array(c.sides).keys()].map((x) => x + 1).filter((x) => c.outcomes.includes(x)).length;
        return same(fr(c.answer), fr(faces, c.sides)) && new Set(c.outcomes).size === c.outcomes.length ? null : `or ${c.outcomes}: ${c.answer}`;
      }
      case 'without': {
        // Count ordered pairs of different counters that are both the colour.
        let good = 0;
        let all = 0;
        for (let i = 0; i < c.total; i++) for (let j = 0; j < c.total; j++) if (i !== j) { all++; if (i < c.want && j < c.want) good++; }
        return same(fr(c.answer), fr(good, all)) ? null : `without ${c.want}/${c.total}: ${c.answer}`;
      }
      case 'backups': {
        const fail = math.subtract(1, fr(c.p)) as MFraction;
        const works = math.subtract(1, math.pow(fail, c.n)) as MFraction;
        return same(fr(c.answer), works) ? null : `backups ${c.p}^${c.n}: ${c.answer}`;
      }
    }
  },
  mistakes: (question) => {
    const q = question as Question<ProbabilityCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    if (c.kind === 'and') return [{ step: last, typed: String(Number(math.add(fr(c.p), fr(c.q)))), expect: 'adds them' }];
    if (c.kind === 'single' && !c.not) return c.total - c.want > 0 ? [{ step: 1, typed: `${c.want}/${c.total - c.want}`, expect: 'counters that are not' }] : [];
    if (c.kind === 'without') {
      const kept = math.fraction(c.want * (c.want - 1), c.total * c.total) as MFraction;
      return [{ step: 1, typed: `${c.want - 1}/${c.total}`, expect: 'One counter has gone' }, { step: last, typed: `${kept.n}/${kept.d}`, expect: 'one less' }];
    }
    if (c.kind === 'backups') return [{ step: last, typed: String(Number((Number(c.p) * c.n).toFixed(2))), expect: 'can be more than 1' }];
    return [];
  },
};
