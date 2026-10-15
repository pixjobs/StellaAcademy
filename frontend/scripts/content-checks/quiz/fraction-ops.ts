import { create, all, type Fraction as MFraction } from 'mathjs';
import type { Question } from '../../../src/lib/quiz/core';
import type { FractionOpsCheck } from '../../../src/lib/quiz/fraction-ops';
import type { Verifier } from './types';

const math = create(all);
/** "2 3/4", "3/4" or "3" as a mathjs fraction. */
function parse(s: string): MFraction {
  const m = s.match(/^(\d+) (\d+)\/(\d+)$/);
  if (m) return math.add(math.fraction(Number(m[1])), math.fraction(Number(m[2]), Number(m[3]))) as MFraction;
  return math.fraction(s) as MFraction;
}

/** Calculating with fractions: every answer recomputed with mathjs fractions, and its simplest form checked. */
export const fractionOpsVerifier: Verifier = {
  verify: (question) => {
    const q = question as Question<FractionOpsCheck>;
    const c = q.check;
    const a = parse(c.a);
    const b = parse(c.b);
    const want = c.kind === 'add' || c.kind === 'mixed-add' ? math.add(a, b) : c.kind === 'sub' || c.kind === 'mixed-sub' ? math.subtract(a, b) : c.kind === 'mul' ? math.multiply(a, b) : math.divide(a, b);
    const got = parse(c.answer);
    if (!math.equal(got, want as MFraction)) return `${c.a} ${c.kind} ${c.b}: ${c.answer} vs ${math.format(want)}`;
    // The answer as written is in its simplest form.
    const m = c.answer.match(/(\d+)\/(\d+)$/);
    if (m && Number(math.gcd(Number(m[1]), Number(m[2]))) !== 1) return `${c.answer} is not in its simplest form`;
    if (Number((want as MFraction).s) < 0) return 'negative answer';
    return null;
  },
  mistakes: (question) => {
    const q = question as Question<FractionOpsCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    const out: { step: number; typed: string; expect: string }[] = [];
    // A common bottom number that works but is not the smallest.
    const lcmStep = q.steps.findIndex((s) => s.type === 'number' && /smallest number that both/.test(s.prompt));
    if (lcmStep !== -1) {
      const m = q.steps[lcmStep].prompt.match(/both (\d+) and (\d+)/)!;
      const product = Number(m[1]) * Number(m[2]);
      if (product !== Number(math.lcm(Number(m[1]), Number(m[2])))) out.push({ step: lcmStep, typed: String(product), expect: 'a smaller number' });
    }
    if (c.kind === 'add') {
      // Adding the bottoms as well as the tops.
      const [an, ad] = c.a.split('/').map(Number);
      const [bn, bd] = c.b.split('/').map(Number);
      const slip = `${an + bn}/${ad + bd}`;
      if (!math.equal(parse(slip), parse(c.answer))) out.push({ step: last, typed: slip, expect: 'added the bottom numbers' });
    }
    if (c.kind === 'mixed-add') {
      // The right amount as an improper fraction, when a mixed number is asked for.
      const f = parse(c.answer);
      out.push({ step: last, typed: `${f.n}/${f.d}`, expect: 'mixed number' });
    }
    if (c.kind === 'div') {
      // Multiplying the top instead of sharing.
      const [an, ad] = c.a.split('/').map(Number);
      out.push({ step: last, typed: `${an * Number(c.b)}/${ad}`, expect: 'Sharing makes each part smaller' });
    }
    return out;
  },
};
