import { create, all, type Fraction } from 'mathjs';
import type { Question } from '../../../src/lib/quiz/core';
import type { CircuitCheck } from '../../../src/lib/quiz/circuit';
import type { Verifier } from './types';

const math = create(all);
const F = (x: string | number) => math.fraction(String(x)) as Fraction;
const eq = (a: Fraction, b: string) => math.equal(a, F(b)) as boolean;
/** A value as a pupil would type it: to 3 significant figures. */
const typed = (f: Fraction) => String(parseFloat(math.number(f).toPrecision(3)));

/** Ohm's Law: every answer recomputed with exact fractions from V = IR, R = R1 + R2, 1/R = 1/R1 + 1/R2, Q = It, P = VI = I²R. */
export const circuitVerifier: Verifier = {
  verify: (question) => {
    const c = (question as Question<CircuitCheck>).check;
    if (c.kind === 'ohm') return eq(math.multiply(F(c.I), F(c.R)) as Fraction, c.V) ? null : `V = IR fails: ${c.V} = ${c.I} × ${c.R}?`;
    if (c.kind === 'series') {
      const I = math.divide(F(c.V), math.add(F(c.R1), F(c.R2))) as Fraction;
      return eq(I, c.I) && eq(math.multiply(I, F(c.R2)) as Fraction, c.V2) ? null : `series ${c.V} V, ${c.R1} + ${c.R2}: I ${c.I}, V2 ${c.V2}`;
    }
    if (c.kind === 'parallel') {
      // By the total resistance, a different route from adding the branch currents.
      const Rt = math.divide(F(1), math.add(math.divide(F(1), F(c.R1)), math.divide(F(1), F(c.R2)))) as Fraction;
      return eq(math.divide(F(c.V), Rt) as Fraction, c.I) && eq(math.divide(F(c.V), F(c.R1)) as Fraction, c.I1) && eq(math.divide(F(c.V), F(c.R2)) as Fraction, c.I2) ? null : `parallel ${c.V} V, ${c.R1} ∥ ${c.R2}: I ${c.I}`;
    }
    if (c.kind === 'charge') return eq(math.multiply(F(c.I), F(c.seconds)) as Fraction, c.Q) ? null : `Q = It: ${c.Q}`;
    const P = c.V ? math.multiply(F(c.V), F(c.I)) : math.multiply(math.pow(F(c.I), 2), F(c.R!));
    return eq(P as Fraction, c.P) ? null : `power ${c.P}`;
  },
  mistakes: (question) => {
    const q = question as Question<CircuitCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    const out: { step: number; typed: string; expect: string }[] = [];
    if (c.kind === 'ohm') {
      const at = q.steps.findIndex((s) => s.prompt.startsWith('So what is'));
      if (c.find === 'I') out.push({ step: at, typed: typed(math.multiply(F(c.V), F(c.R)) as Fraction), expect: 'That multiplies' });
      if (c.find === 'R') {
        out.push({ step: at, typed: typed(math.divide(F(c.I), F(c.V)) as Fraction), expect: 'wrong way round' });
        out.push({ step: 0, typed: 'R = I ÷ V', expect: 'upside down' });
      }
      for (const conv of q.steps.filter((s) => s.prompt.startsWith('First change'))) {
        if (conv.prompt.includes('mA')) {
          const Ima = math.multiply(F(c.I), 1000) as Fraction;
          out.push({ step: at, typed: typed((c.find === 'V' ? math.multiply(Ima, F(c.R)) : math.divide(F(c.V), Ima)) as Fraction), expect: 'current in mA' });
        } else {
          const Rk = math.divide(F(c.R), 1000) as Fraction;
          out.push({ step: at, typed: typed((c.find === 'I' ? math.divide(F(c.V), Rk) : math.multiply(F(c.I), Rk)) as Fraction), expect: 'resistance in kΩ' });
        }
      }
    }
    if (c.kind === 'series') {
      out.push({ step: 0, typed: typed(math.multiply(F(c.R1), F(c.R2)) as Fraction), expect: 'In series the resistances add' });
      out.push({ step: 2, typed: c.V, expect: 'potential difference is shared' });
      const one = math.divide(F(c.V), F(c.R1)) as Fraction;
      if (!eq(one, c.I)) out.push({ step: 1, typed: typed(one), expect: 'uses one resistor' });
    }
    if (c.kind === 'parallel') {
      out.push({ step: 0, typed: typed(math.divide(F(c.V), 2) as Fraction), expect: 'not shared' });
      out.push({ step: 3, typed: typed(math.divide(F(c.V), math.add(F(c.R1), F(c.R2))) as Fraction), expect: 'as in series' });
    }
    if (c.kind === 'charge' && q.steps.length === 3) out.push({ step: last, typed: typed(math.divide(math.multiply(F(c.I), F(c.seconds)), 60) as Fraction), expect: 'time in minutes' });
    if (c.kind === 'power' && c.R) {
      out.push({ step: 1, typed: typed(math.multiply(F(c.I), 2) as Fraction), expect: 'doubles' });
      out.push({ step: last, typed: typed(math.multiply(F(c.I), F(c.R)) as Fraction), expect: 'Square the current first' });
    }
    return out;
  },
};
