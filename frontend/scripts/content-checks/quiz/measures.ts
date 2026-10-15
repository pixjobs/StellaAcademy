import { create, all } from 'mathjs';
import { formatDecimal } from '../../../src/lib/measures';
import type { Question } from '../../../src/lib/quiz/core';
import type { MeasuresCheck } from '../../../src/lib/quiz/measures';
import type { Verifier } from './types';

const math = create(all);
const MATHJS_UNIT: Record<string, string> = { km: 'km', m: 'm', cm: 'cm', mm: 'mm', kg: 'kg', g: 'g', l: 'l', ml: 'ml' };

/** Measures: metric answers with mathjs's unit converter; imperial answers against the exact UK definitions. */
export const measuresVerifier: Verifier = {
  verify: (question) => {
    const q = question as Question<MeasuresCheck>;
    const value = Number(q.check.value);
    const got = Number(formatDecimal(q.check.answer).replace(/,/g, ''));
    if (q.check.rough) {
      const want = value * Number(q.check.rough.factor);
      if (Math.abs(got - want) > 1e-9 * Math.max(1, want)) return `answer ${got}, expected ${value} × ${q.check.rough.factor} = ${want}`;
      const exact = value * q.check.rough.exactFactor;
      if (Math.abs(got - exact) / exact > 0.03) return `rough answer ${got} is more than 3% from the exact ${exact}`;
      return null;
    }
    const want = math.unit(value, MATHJS_UNIT[q.check.from]).toNumber(MATHJS_UNIT[q.check.to]);
    return Math.abs(got - want) > 1e-9 * Math.max(1, Math.abs(want)) ? `answer ${got}, mathjs gives ${want}` : null;
  },
  mistakes: (question) => {
    const q = question as Question<MeasuresCheck>;
    if (q.round === 'imperial') return [];
    const last = q.steps.length - 1;
    const step = q.steps[last];
    if (step.type !== 'number') return [];
    // Dividing instead of multiplying (or the reverse) is out by the factor twice.
    const m = q.prompt.match(/^Convert [\d.,]+ (\w+) to/);
    const places = q.steps[1].type === 'choice' && q.steps[1].correct === 0 ? 1 : -1; // multiply: the answer should be bigger
    const factorStep = q.steps[2];
    if (!m || factorStep.type !== 'choice') return [];
    const k = factorStep.options[factorStep.correct].replace(/,/g, '').length - 1;
    const wrong = formatDecimal({ ...step.answer, top: step.answer.top - 2 * k * places });
    return [{ step: last, typed: wrong, expect: places > 0 ? 'divide instead of multiplying' : 'multiply instead of dividing' }];
  },
  aggregate: (qs) => {
    const counts: Record<number, number> = {};
    for (const q of qs) for (const s of q.steps) if (s.type === 'choice' && /by how much\?$/.test(s.prompt)) counts[s.correct] = (counts[s.correct] ?? 0) + 1;
    const values = Object.values(counts);
    const total = values.reduce((a, b) => a + b, 0);
    return values.length < 4 || Math.max(...values) / total > 0.35 ? `the right factor is not spread across the four buttons: ${JSON.stringify(counts)}` : null;
  },
};
