import { create, all, type Fraction } from 'mathjs';
import type { Question, Step } from '../../../src/lib/quiz/core';
import type { GearsCheck } from '../../../src/lib/quiz/gears';
import type { Verifier } from './types';

const math = create(all);
const F = (x: string | number) => math.fraction(String(x).replace(/,/g, '')) as Fraction;
const eq = (a: Fraction, b: string | number) => math.equal(a, F(b)) as boolean;
const typed = (f: Fraction, sf = 3) => String(parseFloat(math.number(f).toPrecision(sf)));
/** The marked answer of a number step, as a fraction. */
const answerOf = (s: Step): Fraction | null => {
  if (s.type !== 'number') return null;
  const v = math.multiply(F(s.answer.digits), math.pow(F(10), s.answer.top - s.answer.digits.length + 1)) as Fraction;
  return s.answer.neg ? (math.unaryMinus(v) as Fraction) : v;
};
const markedIs = (s: Step | undefined, x: Fraction) => !!s && s.type === 'number' && (math.equal(answerOf(s)!, x) as boolean);
const chosen = (s: Step | undefined) => (s && s.type === 'choice' ? s.options[s.correct] : null);

/**
 * Gears, recomputed with exact fractions and checked against what each step actually marks. Speeds come from
 * counting teeth (the teeth passing each minute are the same on meshing gears), moments from force × distance in
 * metres, and a gear train by passing the turning along each mesh in turn.
 */
export const gearsVerifier: Verifier = {
  verify: (question) => {
    const q = question as Question<GearsCheck>;
    const c = q.check;
    const st = q.steps;
    if (c.kind === 'ratio' || c.kind === 'trade') {
      const ratio = math.divide(F(c.driven), F(c.driver)) as Fraction;
      const out = math.divide(F(c.speed * c.driver), F(c.driven)) as Fraction;
      const r0 = c.kind === 'ratio' ? 1 : 0;
      if (c.kind === 'ratio' && chosen(st[0]) !== `The ${c.driven}-tooth gear`) return 'driven gear choice';
      if (!markedIs(st[r0], ratio) || !markedIs(st[r0 + 1], out)) return `ratio or speed marked wrongly: ${c.driver}→${c.driven}`;
      if (c.kind === 'trade') {
        if (!markedIs(st[2], math.multiply(F(c.moment), ratio) as Fraction)) return 'driven moment';
        const want = c.driven > c.driver ? 'more slowly, with a bigger moment' : 'faster, with a smaller moment';
        if (chosen(st[3]) !== want) return `trade choice: ${chosen(st[3])}`;
      }
      return null;
    }
    if (c.kind === 'moment') {
      const d = math.divide(F(c.cm), 100) as Fraction;
      const cmStep = st[0].prompt.includes('in metres?');
      if (cmStep && !markedIs(st[0], d)) return 'cm to m';
      const want = c.ask === 'moment' ? math.multiply(F(c.force), d) : F(c.force);
      if (c.ask === 'force' && !eq(math.multiply(F(c.force), d) as Fraction, c.moment)) return 'force question built wrongly';
      return markedIs(st[st.length - 1], want as Fraction) ? null : `moment: ${c.force} N at ${c.cm} cm`;
    }
    let speed = F(c.speed);
    let cw = c.clockwise;
    const dirs: string[] = [];
    for (let k = 1; k < c.teeth.length; k++) {
      speed = math.divide(math.multiply(speed, F(c.teeth[k - 1])), F(c.teeth[k])) as Fraction;
      cw = !cw;
      dirs.push(cw ? 'Clockwise' : 'Anticlockwise');
    }
    if (dirs.some((d, k) => chosen(st[k]) !== d)) return 'train directions';
    return markedIs(st[st.length - 1], speed) ? null : `train ${c.teeth.join(',')}: ${c.out}`;
  },
  mistakes: (question) => {
    const q = question as Question<GearsCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    const out: { step: number; typed: string; expect: string }[] = [];
    if (c.kind === 'ratio' || c.kind === 'trade') {
      const rs = c.kind === 'ratio' ? 1 : 0;
      const upside = math.divide(F(c.driver), F(c.driven)) as Fraction;
      out.push({ step: rs, typed: typed(upside), expect: 'upside down' });
      out.push({ step: rs, typed: typed(upside, 2).replace(/^0\./, '0.').slice(0, 4), expect: 'upside down' }); // 0.33 for 1/3
      out.push({ step: rs, typed: `${c.driver}:${c.driven}`, expect: 'upside down' });
      out.push({ step: rs + 1, typed: typed(math.multiply(F(c.speed), math.divide(F(c.driven), F(c.driver))) as Fraction), expect: 'multiplies by the ratio' });
      if (c.kind === 'trade') out.push({ step: 2, typed: typed(math.divide(F(c.moment), math.divide(F(c.driven), F(c.driver))) as Fraction), expect: 'divides by the ratio' });
    }
    if (c.kind === 'moment') {
      const cmStep = q.steps[0].prompt.includes('in metres?');
      const d = math.divide(F(c.cm), 100) as Fraction;
      if (c.ask === 'moment') {
        if (cmStep) out.push({ step: last, typed: String(Number(c.force) * c.cm), expect: 'centimetres' });
        out.push({ step: last, typed: typed(math.divide(F(c.force), d) as Fraction), expect: 'That divides' });
        if (!cmStep) out.push({ step: last - 1, typed: 'Divide the force by the distance', expect: 'force times its distance' });
      } else {
        out.push({ step: last - 1, typed: 'Force = moment × distance', expect: 'Undo the multiplying' });
        out.push({ step: last, typed: typed(math.multiply(F(c.moment), d) as Fraction), expect: 'That multiplies' });
        out.push({ step: last, typed: typed(math.divide(F(c.moment), F(c.cm)) as Fraction), expect: 'centimetres' });
      }
    }
    if (c.kind === 'train') {
      const [a, b, cc] = c.teeth;
      out.push({ step: last, typed: typed(math.divide(F(c.speed * a), F(b)) as Fraction), expect: 'speed of gear B' });
      out.push({ step: last, typed: typed(math.divide(F(c.speed * cc), F(a)) as Fraction), expect: 'upside down' });
      const s0 = q.steps[0];
      if (s0.type === 'choice') out.push({ step: 0, typed: s0.options[1 - s0.correct], expect: 'opposite directions' });
    }
    return out;
  },
  aggregate: (qs) => {
    // The right option's position must be spread out for every choice step with two options.
    const counts = [0, 0];
    for (const q of qs) for (const s of q.steps) if (s.type === 'choice' && s.options.length === 2) counts[s.correct]++;
    const total = counts[0] + counts[1];
    return total && Math.min(...counts) / total < 0.4 ? `two-option answers not spread out: ${counts.join(' / ')}` : null;
  },
};
