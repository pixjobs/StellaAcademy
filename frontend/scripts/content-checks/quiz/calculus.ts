import { create, all } from 'mathjs';
import type { Question } from '../../../src/lib/quiz/core';
import type { CalculusCheck } from '../../../src/lib/quiz/calculus';
import type { Verifier } from './types';

const math = create(all);
type Term = { c: number; n: number };
const expr = (ts: Term[], v: string) => ts.map((t) => `(${t.c})*${v}^${t.n}`).join(' + ');

/** Differentiation: mathjs's symbolic derivative, evaluated at the point; the limit by a numerical chord. */
export const calculusVerifier: Verifier = {
  verify: (question) => {
    const c = (question as Question<CalculusCheck>).check;
    if (c.kind === 'limit') {
      const f = (x: number) => c.k * x * x;
      const h = 1e-7;
      return Math.abs((f(c.a + h) - f(c.a)) / h - c.answer) < 1e-4 ? null : `limit ${c.k}x² at ${c.a}: ${c.answer}`;
    }
    const v = c.kind === 'gradient' ? 'x' : 't';
    const d = math.derivative(expr(c.terms, v), v);
    const at = c.kind === 'gradient' ? c.x : c.t;
    const got = d.evaluate({ [v]: at }) as number;
    return Math.abs(got - c.answer) < 1e-9 ? null : `${c.kind}: ${c.answer} vs mathjs ${got}`;
  },
  mistakes: (question) => {
    const q = question as Question<CalculusCheck>;
    const c = q.check;
    if (c.kind === 'limit') return [{ step: q.steps.length - 1, typed: '0', expect: 'Only the h part' }];
    const out: { step: number; typed: string; expect: string }[] = [];
    // The coefficient left unmultiplied, and multiplied by the new power, on the first term's coefficient step.
    const t = c.terms[0];
    const at = q.steps.findIndex((s) => s.type === 'number' && /multiply by the power/.test(s.prompt));
    if (t.n > 1 && at !== -1) out.push({ step: at, typed: String(t.c), expect: 'by the power' });
    if (t.n > 2 && at !== -1 && t.c * (t.n - 1) !== t.c * t.n && t.c * (t.n - 1) !== t.c) out.push({ step: at, typed: String(t.c * (t.n - 1)), expect: 'new power' });
    // The constant kept in the value at the end.
    const k = c.terms.find((x) => x.n === 0);
    if (k && k.c !== 0) out.push({ step: q.steps.length - 1, typed: String(c.answer + k.c), expect: 'no derivative' });
    return out;
  },
};
