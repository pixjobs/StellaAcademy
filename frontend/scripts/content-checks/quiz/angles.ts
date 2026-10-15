import { create, all, type Fraction as MFraction } from 'mathjs';
import type { Question } from '../../../src/lib/quiz/core';
import type { AnglesCheck } from '../../../src/lib/quiz/angles';
import type { Verifier } from './types';

const math = create(all);
const near = (x: number, y: number) => Math.abs(x - y) <= Math.abs(y) * 1e-9 + 1e-12;

/** Radians: conversions with mathjs units; arcs and sectors as a fraction of the whole circle. */
export const anglesVerifier: Verifier = {
  verify: (question) => {
    const c = (question as Question<AnglesCheck>).check;
    if (c.kind === 'to-rad') {
      const k = math.fraction(c.answer) as MFraction;
      return near(math.unit(c.degrees, 'deg').toNumber('rad'), Number(math.number(k)) * Math.PI) ? null : `${c.degrees}°: ${c.answer}π`;
    }
    if (c.kind === 'to-deg') return near(math.unit((c.num / c.den) * Math.PI, 'rad').toNumber('deg'), c.answer) ? null : `${c.num}π/${c.den}: ${c.answer}`;
    // The fraction of a full turn, times the circumference or the area of the whole circle.
    const turn = c.radians ? c.theta / (2 * Math.PI) : c.theta / 360;
    const want = c.kind === 'arc' ? turn * 2 * Math.PI * c.r : turn * Math.PI * c.r * c.r;
    return near(want, c.answer) ? null : `${c.kind} r=${c.r} θ=${c.theta}: ${c.answer} vs ${want}`;
  },
  mistakes: (question) => {
    const q = question as Question<AnglesCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    if ((c.kind === 'arc' || c.kind === 'sector') && !c.radians) {
      const wrong = c.kind === 'arc' ? c.r * c.theta : 0.5 * c.r * c.r * c.theta;
      return [{ step: last, typed: String(Number(wrong.toPrecision(4))), expect: 'in degrees in a radians formula' }];
    }
    if (c.kind === 'sector' && c.radians) return [{ step: last, typed: String(Number((c.r * c.r * c.theta).toPrecision(4))), expect: 'half' }];
    return [];
  },
};
