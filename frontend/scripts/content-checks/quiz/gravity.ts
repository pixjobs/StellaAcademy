import { create, all, type Fraction } from 'mathjs';
import type { Question, Step } from '../../../src/lib/quiz/core';
import type { GravityCheck } from '../../../src/lib/quiz/gravity';
import type { Verifier } from './types';

const math = create(all);
const F = (x: string | number) => math.fraction(String(x)) as Fraction;
const G = 6.67e-11;
/** What a number step marks as right, as a number. */
const marked = (s: Step | undefined) => (s && s.type === 'number' ? (s.answer.neg ? -1 : 1) * Number(s.answer.digits) * 10 ** (s.answer.top - s.answer.digits.length + 1) : NaN);
/** Right to 3 significant figures. */
const ok3 = (s: Step | undefined, x: number) => Math.abs(marked(s) - x) <= 0.005 * Math.abs(x);
const chosen = (s: Step | undefined) => (s && s.type === 'choice' ? s.options[s.correct] : null);
const t3 = (x: number) => String(parseFloat(x.toPrecision(3)));

/**
 * Gravity, checked against what each step marks. Weight and the inverse square law with exact fractions;
 * Newton's law from G, M and r = R + h; the orbital period by Kepler's third law, T = 2π√(r³/GM), a different
 * route from 2πr ÷ v.
 */
export const gravityVerifier: Verifier = {
  verify: (question) => {
    const q = question as Question<GravityCheck>;
    const c = q.check;
    const st = q.steps;
    if (c.kind === 'weight') return math.equal(math.multiply(F(c.m), F(c.g)), F(c.W)) && ok3(st[1], Number(c.W)) && chosen(st[0]) === 'W = m × g' ? null : `weight ${c.m} × ${c.g}`;
    if (c.kind === 'weight2') {
      const m = math.divide(F(c.W1), F(c.g1)) as Fraction;
      return math.equal(m, F(c.m)) && math.equal(math.multiply(m, F(c.g2)), F(c.W2)) && chosen(st[0]) === 'It stays the same' && ok3(st[2], Number(c.W2)) ? null : `weight2 ${c.W1} N`;
    }
    if (c.kind === 'inverse') {
      const want = math.divide(math.multiply(F(c.F0), F(c.n)), math.pow(F(c.k), 2)) as Fraction;
      // The answer must never be the starting force, which could be typed back without working.
      if (c.F === c.F0) return `inverse: the answer is the starting force (${c.F0} N)`;
      return math.equal(want, F(c.F)) && ok3(st[st.length - 1], math.number(want)) ? null : `inverse ${c.F0} k=${c.k} n=${c.n}`;
    }
    const r = (c.Rkm + c.hkm) * 1000;
    if (!ok3(st[0], r)) return `r for ${c.body} at ${c.hkm} km`;
    if (c.kind === 'force' || c.kind === 'field') {
      const want = c.kind === 'field' ? (G * c.M) / r ** 2 : (G * c.M * c.m!) / r ** 2;
      return ok3(st[1], r * r) && ok3(st[2], want) ? null : `${c.kind} at ${c.hkm} km: ${c.answer}`;
    }
    const v = Math.sqrt(c.GM / r);
    if (!ok3(st[2], v)) return `orbit speed at ${c.hkm} km`;
    if (c.kind === 'orbit' && c.periodMin !== undefined) {
      const T = 2 * Math.PI * Math.sqrt(r ** 3 / c.GM);
      if (!ok3(st[3], T / 60)) return `period at ${c.hkm} km`;
    }
    return null;
  },
  mistakes: (question) => {
    const q = question as Question<GravityCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    const out: { step: number; typed: string; expect: string }[] = [];
    if (c.kind === 'weight') {
      out.push({ step: 1, typed: t3(Number(c.m) / Number(c.g)), expect: 'That divides' });
      out.push({ step: 1, typed: c.m, expect: 'That is the mass' });
    }
    if (c.kind === 'weight2') {
      out.push({ step: 1, typed: t3(Number(c.W1) * Number(c.g1)), expect: 'That multiplies' });
      out.push({ step: 2, typed: t3(Number(c.W1) * Number(c.g2)), expect: 'multiplies the weight' });
      out.push({ step: 2, typed: c.m, expect: 'That is the mass' });
      out.push({ step: 2, typed: t3(Number(c.m) / Number(c.g2)), expect: 'That divides' });
      out.push({ step: 0, typed: 'It gets smaller', expect: 'same everywhere' });
    }
    if (c.kind === 'inverse' && c.k !== 1) {
      out.push({ step: last, typed: t3((c.F0 * c.n) / c.k), expect: 'not its square' });
      if (c.n !== 1) out.push({ step: last, typed: t3(c.F0 / (c.k * c.k)), expect: 'change in mass' });
    }
    if (c.kind !== 'weight' && c.kind !== 'weight2' && c.kind !== 'inverse') {
      const r = (c.Rkm + c.hkm) * 1000;
      out.push({ step: 0, typed: t3(c.hkm * 1000), expect: 'height above the surface' });
      out.push({ step: 0, typed: t3(c.Rkm + c.hkm), expect: 'kilometres' });
      if (c.kind === 'orbit') {
        out.push({ step: 2, typed: t3(c.GM / r), expect: 'square root' });
        out.push({ step: 2, typed: t3(Math.sqrt(c.GM / (c.hkm * 1000))), expect: 'uses the height' });
        out.push({ step: 1, typed: t3(c.GM / (r * r)), expect: 'divides by r^{2}' });
        if (c.periodMin !== undefined) {
          out.push({ step: 3, typed: t3(c.periodMin * 60), expect: 'in seconds' });
          out.push({ step: 3, typed: t3(c.periodMin / (2 * Math.PI)), expect: 'circumference' });
        }
      } else {
        const top = c.kind === 'field' ? G * c.M : G * c.M * c.m!;
        out.push({ step: 1, typed: t3(2 * r), expect: 'doubles r' });
        out.push({ step: 2, typed: t3(top / r), expect: 'not r^{2}' });
        out.push({ step: 2, typed: t3(top / (c.hkm * 1000) ** 2), expect: 'uses the height' });
      }
    }
    return out;
  },
};
