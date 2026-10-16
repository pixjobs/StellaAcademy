import { markNumber, type NumberStep, type Question, type Step } from '../../../src/lib/quiz/core';
import type { MomentumCheck } from '../../../src/lib/quiz/momentum';
import type { Verifier } from './types';

const chosen = (s: Step | undefined) => (s && s.type === 'choice' ? s.options[s.correct] : null);
const t3 = (x: number) => String(parseFloat(x.toPrecision(3)));
/** As a pupil would type a worked answer: exact when it is short, otherwise 3 s.f. as a calculator shows it. */
const typed = (x: number) => {
  const clean = parseFloat(x.toPrecision(10)); // 0.42500000000000004 is the 0.425 a pupil works out
  return String(clean).replace(/^-?0\.|\./, '').replace(/^0+/, '').length <= 3 ? String(clean) : clean.toPrecision(3);
};
const accepts = (s: Step | undefined, x: number) => !!s && s.type === 'number' && markNumber(s as NumberStep, typed(x)).ok;
const ke = (m: number, v: number) => 0.5 * m * v * v;
const N = Number;

/**
 * Momentum, recomputed with ordinary arithmetic from the masses and speeds the question gives, each answer typed
 * as a pupil would and marked by the quiz's own marking. Collisions are checked to be possible: no kinetic
 * energy created, and the object that was hit never left behind.
 */
export const momentumVerifier: Verifier = {
  verify: (question) => {
    const q = question as Question<MomentumCheck>;
    const c = q.check;
    const st = q.steps;
    const last = st[st.length - 1];
    if (c.kind === 'one') {
      if (Math.abs(N(c.m) * N(c.v) - N(c.p)) > 1e-9) return 'p = mv';
      const form = { p: 'p = m × v', v: 'v = p ÷ m', m: 'm = p ÷ v' }[c.find];
      return chosen(st[0]) === form && accepts(last, c.find === 'p' ? N(c.p) : c.find === 'v' ? N(c.v) : N(c.m)) ? null : `one ${c.find}`;
    }
    if (c.kind === 'two') {
      const [p1, p2] = [N(c.m1) * N(c.v1), N(c.m2) * N(c.v2)];
      const total = c.towards ? Math.abs(p1 - p2) : p1 + p2;
      const combine = chosen(st[2]) === (c.towards ? 'Take one from the other' : 'Add them');
      const dir = !c.towards || (chosen(st[4]) === 'In the first one’s direction') === p1 > p2;
      if (!c.towards && N(c.v1) === N(c.v2)) return 'same way at the same speed: nobody catches up';
      return accepts(st[0], p1) && accepts(st[1], p2) && accepts(st[3], total) && combine && dir ? null : 'two';
    }
    if (c.kind === 'stick') {
      const p = N(c.m1) * N(c.v1) + N(c.m2) * N(c.v2);
      const v = p / (N(c.m1) + N(c.m2));
      if (ke(N(c.m1) + N(c.m2), v) > ke(N(c.m1), N(c.v1)) + ke(N(c.m2), N(c.v2)) + 1e-9) return 'energy created';
      return accepts(st[0], p) && accepts(st[1], N(c.m1) + N(c.m2)) && accepts(last, v) ? null : 'stick';
    }
    if (c.kind === 'bounce') {
      const v2 = (N(c.m1) * N(c.v1) - N(c.m1) * N(c.u1)) / N(c.m2);
      if (v2 <= N(c.u1)) return 'the hit object is left behind, or moves off with the first (a stick, not a bounce)';
      if (ke(N(c.m1), N(c.u1)) + ke(N(c.m2), v2) > ke(N(c.m1), N(c.v1)) + 1e-9) return 'energy created';
      return accepts(st[0], N(c.m1) * N(c.v1)) && accepts(st[2], v2 * N(c.m2)) && accepts(last, v2) ? null : 'bounce';
    }
    const vB = (N(c.mA) * N(c.vA)) / N(c.mB);
    return accepts(st[0], 0) && accepts(st[1], N(c.mA) * N(c.vA)) && accepts(st[2], vB) ? null : 'apart';
  },
  mistakes: (question) => {
    const q = question as Question<MomentumCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    const out: { step: number; typed: string; expect: string }[] = [];
    if (c.kind === 'one') {
      if (c.find === 'p') out.push({ step: last, typed: t3(N(c.m) / N(c.v)), expect: 'That divides' });
      else out.push({ step: last, typed: t3(N(c.p) * (c.find === 'v' ? N(c.m) : N(c.v))), expect: 'That multiplies' });
    }
    if (c.kind === 'two') {
      const [p1, p2] = [N(c.m1) * N(c.v1), N(c.m2) * N(c.v2)];
      out.push(c.towards ? { step: 3, typed: t3(p1 + p2), expect: 'That adds them' } : { step: 3, typed: t3(Math.abs(p1 - p2)), expect: 'takes one from the other' });
      out.push({ step: 3, typed: `-${t3(c.towards ? Math.abs(p1 - p2) : p1 + p2)}`, expect: 'Right size' });
    }
    if (c.kind === 'stick') {
      out.push({ step: 1, typed: c.m1, expect: 'move as one object' });
      const p = N(c.m1) * N(c.v1) + N(c.m2) * N(c.v2);
      if (c.m1 !== c.m2) out.push({ step: 2, typed: t3(p / N(c.m1)), expect: 'divides by one mass' });
      if (N(c.v2) > 0) out.push({ step: 0, typed: t3(N(c.m1) * N(c.v1)), expect: 'leaves out the second' });
    }
    if (c.kind === 'bounce') {
      const p = N(c.m1) * N(c.v1);
      if (N(c.u1) > 0) out.push({ step: 2, typed: t3(p), expect: 'whole total' });
      const pB = p - N(c.m1) * N(c.u1);
      if (c.m1 !== c.m2) out.push({ step: 3, typed: t3(pB / N(c.m1)), expect: 'first one’s mass' });
    }
    if (c.kind === 'apart') {
      const pA = N(c.mA) * N(c.vA);
      out.push({ step: 0, typed: t3(pA), expect: 'nothing moves' });
      out.push({ step: 2, typed: c.vA, expect: 'same momentum but a different mass' });
      // Only where it is clearly different: for a tiny tool or burst of gas it is within a few per cent of the answer.
      const both = pA / (N(c.mA) + N(c.mB));
      if (Math.abs(both - c.vB) > 0.05 * c.vB) out.push({ step: 2, typed: t3(both), expect: 'both masses' });
      out.push({ step: 2, typed: `-${t3(c.vB)}`, expect: 'Right size' });
    }
    return out;
  },
};
