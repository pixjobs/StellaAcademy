import type { Question } from '../../../src/lib/quiz/core';
import type { DiffeqCheck } from '../../../src/lib/quiz/diffeq';
import type { Verifier } from './types';

const near = (x: number, y: number) => Math.abs(x - y) <= Math.abs(y) * 1e-9 + 1e-12;

/**
 * Differential equations: solutions checked by stepping the equation forward numerically (Euler with tiny
 * steps) from the starting value, independently of the formula; scaling checked from the rate law.
 */
export const diffeqVerifier: Verifier = {
  verify: (question) => {
    const c = (question as Question<DiffeqCheck>).check;
    if (c.kind === 'build') return /^d\w\/dt = /.test(c.answer) ? null : `build: ${c.answer}`;
    if (c.kind === 'scale') return near(c.rate * c.m ** c.power, c.answer) ? null : `scale: ${c.answer}`;
    const steps = 200000;
    if (c.kind === 'exp') {
      // dy/dt = ky, y(0) = a.
      let y = c.a;
      const h = c.x / steps;
      for (let i = 0; i < steps; i++) y += h * c.k * y;
      return Math.abs(y - c.answer) / c.answer < 1e-3 ? null : `exp: ${c.answer} vs Euler ${y}`;
    }
    // dv/dt = −kv², v(0) = v0.
    let v = c.v0;
    const h = c.t / steps;
    for (let i = 0; i < steps; i++) v += h * -c.k * v * v;
    return Math.abs(v - c.answer) / c.answer < 1e-3 ? null : `drag: ${c.answer} vs Euler ${v}`;
  },
  mistakes: (question) => {
    const q = question as Question<DiffeqCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    if (c.kind === 'scale' && c.power === 2 && c.m !== 1) return [{ step: last, typed: String(c.rate * c.m), expect: 'square of the speed' }];
    if (c.kind === 'drag') {
      const noOne = c.v0 / (c.k * c.v0 * c.t);
      return [{ step: last, typed: String(Number(noOne.toPrecision(4))), expect: 'Remember the 1' }];
    }
    if (c.kind === 'exp' && c.k < 0) return [{ step: last, typed: String(Number((c.a * Math.exp(-c.k * c.x)).toPrecision(4))), expect: 'Keep the minus sign' }];
    return [];
  },
};
