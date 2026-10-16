import { markNumber, type NumberStep, type Question, type Step } from '../../../src/lib/quiz/core';
import type { TrajectoryCheck } from '../../../src/lib/quiz/trajectory';
import type { Verifier } from './types';

const GM = 3.986e5;
const R = 6370;
const chosen = (s: Step | undefined) => (s && s.type === 'choice' ? s.options[s.correct] : null);
const t3 = (x: number) => String(parseFloat(x.toPrecision(3)));
const r3 = (x: number) => Number(x.toPrecision(3));
/** As a pupil types it: exact when short, otherwise 3 s.f. as a calculator shows it (6.51e+3 included). */
const typed = (x: number) => {
  const clean = parseFloat(x.toPrecision(10));
  return String(clean).replace(/^-?0\.|\./, '').replace(/^0+/, '').length <= 6 && Number.isInteger(clean * 1000) ? String(clean) : clean.toPrecision(3);
};
const accepts = (s: Step | undefined, x: number) => !!s && s.type === 'number' && markNumber(s as NumberStep, typed(x)).ok;
/** A chained calculator answer, written to 3 s.f. as asked (5.50, not 5.5). */
const accepts3 = (s: Step | undefined, x: number) => !!s && s.type === 'number' && markNumber(s as NumberStep, x.toPrecision(3)).ok;

/**
 * Orbits, worked as a pupil would from the numbers shown, each answer marked by the quiz's own marking, both
 * exactly and with every step rounded to 3 s.f. The period factor is checked by Kepler's third law
 * (T² ∝ r³), and the coast against a whole orbit of the ellipse halved.
 */
export const trajectoryVerifier: Verifier = {
  verify: (question) => {
    const q = question as Question<TrajectoryCheck>;
    const c = q.check;
    const st = q.steps;
    const last = st[st.length - 1];
    if (c.kind === 'speed') {
      const h = c.asked === 'A' ? c.hA : c.hB;
      const r = h + R;
      if ((chosen(st[0]) === 'Satellite A') !== c.hA < c.hB) return 'faster satellite';
      const exact = Math.sqrt(GM / r);
      const chained = Math.sqrt(r3(GM / r));
      return accepts(st[1], r) && accepts(st[2], GM / r) && accepts(last, exact) && accepts3(last, chained) ? null : `speed at ${h} km`;
    }
    if (c.kind === 'transfer') {
      const a = (c.h1 + c.h2 + 2 * R) / 2;
      return accepts(st[0], c.h1 + R) && accepts(st[1], c.h2 + R) && accepts(last, a) ? null : `transfer ${c.h1}-${c.h2}`;
    }
    if (c.kind === 'period') {
      // Kepler: T² ∝ r³, so the new period squared is the old one squared times k³.
      const T = Math.sqrt(c.T0 ** 2 * c.k ** 3);
      if (Math.abs(T - c.T) > 1e-9 * T) return `period factor for k = ${c.k}`;
      if ((chosen(st[0]) === 'Longer') !== c.k > 1) return 'longer or shorter';
      return accepts(st[1], c.k ** 3) && accepts(st[2], c.k ** 1.5) && accepts(last, T) ? null : 'period answers refused';
    }
    const a = (c.h1 + c.h2 + 2 * R) / 2;
    const whole = 2 * Math.PI * Math.sqrt(a ** 3 / GM); // one full orbit of the ellipse
    if (Math.abs(whole / 2 - c.seconds) > 1e-6 * c.seconds) return 'coast is not half an orbit';
    const sChained = Math.PI * Math.sqrt(r3(a ** 3) / GM);
    const hChained = r3(sChained) / 3600;
    return accepts(st[0], a) && accepts(st[1], a ** 3) && accepts(st[2], c.seconds) && accepts3(st[2], sChained) && accepts(last, c.hours) && accepts3(last, hChained) ? null : `coast ${c.h1}-${c.h2}`;
  },
  mistakes: (question) => {
    const q = question as Question<TrajectoryCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    const out: { step: number; typed: string; expect: string }[] = [];
    if (c.kind === 'speed') {
      const h = c.asked === 'A' ? c.hA : c.hB;
      out.push({ step: 1, typed: String(h), expect: 'height above the ground' });
      out.push({ step: last, typed: t3(GM / (h + R)), expect: 'square root' });
      out.push({ step: last, typed: t3(Math.sqrt(GM / h)), expect: 'uses the height' });
      const s0 = q.steps[0];
      if (s0.type === 'choice') out.push({ step: 0, typed: s0.options[1 - s0.correct], expect: 'lower the orbit' });
    }
    if (c.kind === 'transfer' || c.kind === 'coast') {
      const [r1, r2] = [c.h1 + R, c.h2 + R];
      const at = c.kind === 'transfer' ? 2 : 0;
      out.push({ step: at, typed: String(r1 + r2), expect: 'full length' });
      out.push({ step: at, typed: String((r2 - r1) / 2), expect: 'halves the difference' });
      out.push({ step: at, typed: String((c.h1 + c.h2) / 2), expect: 'uses the heights' });
      if (c.kind === 'transfer') out.push({ step: 0, typed: String(c.h1), expect: 'height above the ground' });
    }
    if (c.kind === 'period') {
      out.push({ step: last, typed: t3(c.T0 * c.k), expect: 'same factor as the radius' });
      out.push({ step: last, typed: t3(c.T0 * c.k ** 3), expect: 'change in r^{3}' });
      out.push({ step: last, typed: t3(c.T0 * c.k ** 2), expect: 'squares the change' });
      out.push({ step: 1, typed: t3(c.k), expect: 'Cube it' });
    }
    if (c.kind === 'coast') {
      out.push({ step: 2, typed: t3(2 * c.seconds), expect: 'whole orbit' });
      out.push({ step: 3, typed: t3(c.seconds), expect: 'still in seconds' });
      out.push({ step: 3, typed: t3(c.seconds / 60), expect: 'in minutes' });
    }
    return out;
  },
};
