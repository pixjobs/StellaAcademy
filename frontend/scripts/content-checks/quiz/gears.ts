import { create, all, type Fraction } from 'mathjs';
import type { Question } from '../../../src/lib/quiz/core';
import type { GearsCheck } from '../../../src/lib/quiz/gears';
import type { Verifier } from './types';

const math = create(all);
const F = (x: string | number) => math.fraction(String(x)) as Fraction;
const eq = (a: Fraction, b: string | number) => math.equal(a, F(b)) as boolean;
const typed = (f: Fraction) => String(parseFloat(math.number(f).toPrecision(3)));

/**
 * Gears: recomputed with exact fractions. Speeds by counting teeth (teeth passing a minute are the same on both
 * gears), moments by force × distance in metres, and a gear train by simulating each mesh in turn.
 */
export const gearsVerifier: Verifier = {
  verify: (question) => {
    const c = (question as Question<GearsCheck>).check;
    if (c.kind === 'ratio' || c.kind === 'trade') {
      const teethPerMinute = c.speed * c.driver;
      const ok = eq(math.divide(F(c.driven), F(c.driver)) as Fraction, c.kind === 'ratio' ? c.ratio : math.number(math.divide(F(c.driven), F(c.driver)) as Fraction)) && eq(math.divide(F(teethPerMinute), F(c.driven)) as Fraction, c.out);
      if (c.kind === 'trade') return ok && eq(math.multiply(F(c.moment), math.divide(F(c.driven), F(c.driver))) as Fraction, c.outMoment.replace(/,/g, '')) ? null : `trade ${c.driver}→${c.driven}`;
      return ok ? null : `ratio ${c.driver}→${c.driven} at ${c.speed}`;
    }
    if (c.kind === 'moment') return eq(math.multiply(F(c.force), math.divide(F(c.cm), 100)) as Fraction, c.moment) ? null : `moment ${c.force} N at ${c.cm} cm: ${c.moment}`;
    // A train: pass the turning along gear by gear.
    let speed = F(c.speed);
    let cw = c.clockwise;
    for (let k = 1; k < c.teeth.length; k++) {
      speed = math.divide(math.multiply(speed, F(c.teeth[k - 1])), F(c.teeth[k])) as Fraction;
      cw = !cw;
    }
    const steps = question.steps;
    const lastDir = steps[steps.length - 2];
    const dirOk = lastDir.type === 'choice' && lastDir.options[lastDir.correct] === (cw ? 'Clockwise' : 'Anticlockwise');
    return eq(speed, c.out) && dirOk ? null : `train ${c.teeth.join(',')}: ${c.out}`;
  },
  mistakes: (question) => {
    const q = question as Question<GearsCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    const out: { step: number; typed: string; expect: string }[] = [];
    if (c.kind === 'ratio' || c.kind === 'trade') {
      const rs = c.kind === 'ratio' ? 1 : 0;
      out.push({ step: rs, typed: typed(math.divide(F(c.driver), F(c.driven)) as Fraction), expect: 'upside down' });
      out.push({ step: rs + 1, typed: typed(math.multiply(F(c.speed), math.divide(F(c.driven), F(c.driver))) as Fraction), expect: 'multiplies by the ratio' });
      if (c.kind === 'trade') out.push({ step: 2, typed: typed(math.divide(F(c.moment), math.divide(F(c.driven), F(c.driver))) as Fraction), expect: 'divides by the ratio' });
    }
    if (c.kind === 'moment') {
      const cmStep = q.steps[0].prompt.includes('in metres?');
      if (c.ask === 'moment') {
        if (cmStep) out.push({ step: last, typed: String(Number(c.force) * c.cm), expect: 'centimetres' });
        out.push({ step: last, typed: typed(math.divide(F(c.force), math.divide(F(c.cm), 100)) as Fraction), expect: 'That divides' });
      } else {
        out.push({ step: last - 1, typed: 'Force = moment × distance', expect: 'Undo the multiplying' });
        out.push({ step: last, typed: typed(math.multiply(F(c.moment), math.divide(F(c.cm), 100)) as Fraction), expect: 'That multiplies' });
      }
    }
    if (c.kind === 'train') {
      const viaB = math.divide(math.multiply(F(c.speed), F(c.teeth[0])), F(c.teeth[1])) as Fraction;
      if (!eq(viaB, c.out)) out.push({ step: last, typed: typed(viaB), expect: 'speed of gear B' });
      const s0 = q.steps[0];
      if (s0.type === 'choice') out.push({ step: 0, typed: s0.options[1 - s0.correct], expect: 'opposite directions' });
    }
    return out;
  },
};
