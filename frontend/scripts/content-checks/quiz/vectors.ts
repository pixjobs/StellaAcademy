import { create, all } from 'mathjs';
import type { Question } from '../../../src/lib/quiz/core';
import type { VectorsCheck } from '../../../src/lib/quiz/vectors';
import type { Verifier } from './types';

const math = create(all);
const near = (x: number, y: number) => Math.abs(x - y) <= Math.abs(y) * 1e-9 + 1e-12;

/** Vectors: recomputed with mathjs matrices (add, scale, norm) and atan2 for the direction. */
export const vectorsVerifier: Verifier = {
  verify: (question) => {
    const c = (question as Question<VectorsCheck>).check;
    if (c.kind === 'combine') {
      const v = math.add(math.multiply(c.ka, c.a), math.multiply(c.kb, c.b)) as number[];
      return v[0] === c.answer[0] && v[1] === c.answer[1] ? null : `combine: ${c.answer} vs ${v}`;
    }
    if (c.kind === 'magnitude') return near(math.norm(c.v) as number, c.answer) ? null : `norm ${c.v}: ${c.answer}`;
    if (c.kind === 'direction') return near((Math.atan2(c.v[1], c.v[0]) * 180) / Math.PI, c.answer) ? null : `angle ${c.v}: ${c.answer}`;
    // Parallel exactly when the cross product is zero.
    const cross = c.a[0] * c.b[1] - c.a[1] * c.b[0];
    return (cross === 0) === (c.k !== null) ? null : `parallel ${c.a} ${c.b}: said ${c.k}`;
  },
  mistakes: (question) => {
    const q = question as Question<VectorsCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    if (c.kind === 'magnitude') {
      const sum = Math.abs(c.v[0]) + Math.abs(c.v[1]);
      return Math.abs(sum - c.answer) > 0.01 ? [{ step: last, typed: String(sum), expect: 'adds the parts' }] : [];
    }
    if (c.kind === 'combine' && c.kb < 0 && c.b[0] < 0) {
      const slip = c.ka * c.a[0] + c.kb * Math.abs(c.b[0]);
      const at = q.steps.findIndex((s) => s.prompt.startsWith('What is the top'));
      return slip === c.answer[0] ? [] : [{ step: at, typed: slip < 0 ? `-${-slip}` : String(slip), expect: 'Taking away a negative' }];
    }
    if (c.kind === 'direction') {
      const flipped = (Math.atan(c.v[0] / c.v[1]) * 180) / Math.PI;
      return [{ step: last, typed: flipped.toPrecision(3), expect: 'across ÷ up' }];
    }
    return [];
  },
};
