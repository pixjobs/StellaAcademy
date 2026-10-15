import { create, all } from 'mathjs';
import type { Question } from '../../../src/lib/quiz/core';
import type { ExponentsCheck } from '../../../src/lib/quiz/exponents-roots';
import type { Verifier } from './types';

const math = create(all, { number: 'BigNumber', precision: 64 });
const big = (x: string | number) => math.bignumber(String(x).replace(/,/g, ''));

/** Powers and roots: recomputed with mathjs big numbers; standard form checked by rebuilding the number. */
export const exponentsRootsVerifier: Verifier = {
  verify: (question) => {
    const c = (question as Question<ExponentsCheck>).check;
    switch (c.kind) {
      case 'power':
        return math.equal(math.pow(big(c.base), big(c.index)), big(c.answer)) ? null : `${c.base}^${c.index}: ${c.answer}`;
      case 'root':
        return math.equal(math.pow(big(c.answer), big(c.which)), big(c.n)) ? null : `root ${c.which} of ${c.n}: ${c.answer}`;
      case 'law': {
        const lhs = c.op === 'mul' ? math.multiply(math.pow(big(c.base), big(c.m)), math.pow(big(c.base), big(c.n))) : c.op === 'div' ? math.divide(math.pow(big(c.base), big(c.m)), math.pow(big(c.base), big(c.n))) : math.pow(math.pow(big(c.base), big(c.m)), big(c.n));
        return math.equal(lhs, math.pow(big(c.base), big(c.answer))) ? null : `${c.op} ${c.base} ${c.m} ${c.n}: index ${c.answer}`;
      }
      case 'standard': {
        const a = Number(c.a);
        if (!(a >= 1 && a < 10)) return `A = ${c.a} is not from 1 up to 10`;
        return math.equal(math.multiply(big(c.a), math.pow(big(10), big(c.n))), big(c.value)) ? null : `${c.value} vs ${c.a} × 10^${c.n}`;
      }
      case 'compare': {
        const vx = math.multiply(big(c.x[0]), math.pow(big(10), big(c.x[1])));
        const vy = math.multiply(big(c.y[0]), math.pow(big(10), big(c.y[1])));
        const larger = math.larger(vx, vy) ? c.x : c.y;
        if (math.equal(vx, vy)) return 'compare: equal values';
        return c.larger.startsWith(`${larger[0]} ×`) ? null : `compare: said ${c.larger}`;
      }
    }
  },
  mistakes: (question) => {
    const q = question as Question<ExponentsCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    if (c.kind === 'power' && c.base * c.index !== c.answer) return [{ step: 1, typed: String(c.base * c.index), expect: 'A power multiplies' }];
    if (c.kind === 'root' && Number.isInteger(c.n / c.which)) return [{ step: 1, typed: String(c.n / c.which), expect: `÷ ${c.which}` }];
    if (c.kind === 'law' && c.op === 'mul' && c.m * c.n !== c.m + c.n) return [{ step: 1, typed: String(c.m * c.n), expect: 'add the indices' }];
    if (c.kind === 'standard') return [{ step: last, typed: String(-c.n), expect: c.n > 0 ? 'positive power' : 'negative power' }, { step: 0, typed: c.a.replace('.', ''), expect: 'at least 1 and less than 10' }].filter((m) => m.typed !== c.a);
    return [];
  },
};
