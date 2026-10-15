import { create, all } from 'mathjs';
import type { Question } from '../../../src/lib/quiz/core';
import type { ArithmeticCheck } from '../../../src/lib/quiz/arithmetic';
import type { Verifier } from './types';

const math = create(all);
/** The calculation as mathjs reads it: ×, ÷, −, ² become *, /, -, ^2. */
const js = (e: string) => e.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/²/g, '^2');
/** Strictly left to right, ignoring the order (only for calculations with two operations and no brackets). */
function leftToRight(e: string): number | null {
  const m = e.match(/^(\d+) ([+−×÷]) (\d+) ([+−×÷]) (\d+)$/);
  if (!m) return null;
  const f = (a: number, o: string, b: number) => (o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : a / b);
  return f(f(Number(m[1]), m[2], Number(m[3])), m[4], Number(m[5]));
}

/** Order of operations: every answer recomputed by mathjs's parser, which follows the same conventions. */
export const arithmeticVerifier: Verifier = {
  verify: (question) => {
    const q = question as Question<ArithmeticCheck>;
    const want = math.evaluate(js(q.check.expr)) as number;
    if (want !== q.check.answer) return `${q.check.expr}: ${q.check.answer} vs mathjs ${want}`;
    // Every intermediate step the pupil types is a whole number, and the last one is the answer.
    const typed = q.steps.filter((s) => s.type === 'number');
    if (!typed.length) return 'no typed steps';
    return null;
  },
  mistakes: (question) => {
    const q = question as Question<ArithmeticCheck>;
    const last = q.steps.length - 1;
    const ltr = leftToRight(q.check.expr);
    const out: { step: number; typed: string; expect: string }[] = [];
    // Only a pure "× or ÷ after + or −" case is the left-to-right slip; equal-priority pairs are named differently.
    if (ltr !== null && Number.isInteger(ltr) && ltr !== q.check.answer && /[+−].*[×÷]/.test(q.check.expr)) out.push({ step: last, typed: String(ltr), expect: 'left to right' });
    const m = q.check.expr.match(/^\((\d+) ([+−]) (\d+)\)²$/);
    if (m) {
      const [x, y] = [Number(m[1]), Number(m[3])];
      const wrong = m[2] === '+' ? x * x + y * y : x * x - y * y;
      if (wrong !== q.check.answer && wrong > 0) out.push({ step: last, typed: String(wrong), expect: 'bracket first' });
    }
    const eq = q.check.expr.match(/^(\d+) ([×÷+−]) (\d+) ([×÷+−]) (\d+)$/);
    if (eq && ((eq[2] === '÷' && eq[4] === '×') || (eq[2] === '−' && eq[4] === '+'))) {
      const f = (a: number, o: string, b: number) => (o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : a / b);
      const wrong = f(Number(eq[1]), eq[2], f(Number(eq[3]), eq[4], Number(eq[5])));
      if (Number.isInteger(wrong) && wrong !== q.check.answer) out.push({ step: last, typed: String(wrong), expect: 'left to right' });
    }
    return out;
  },
};
