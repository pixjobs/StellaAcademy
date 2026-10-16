import type { Question, Step } from '../../../src/lib/quiz/core';
import type { WavesCheck } from '../../../src/lib/quiz/waves';
import type { Verifier } from './types';

const marked = (s: Step | undefined) => (s && s.type === 'number' ? (s.answer.neg ? -1 : 1) * Number(s.answer.digits) * 10 ** (s.answer.top - s.answer.digits.length + 1) : NaN);
const ok = (s: Step | undefined, x: number, rel = 0.005) => Math.abs(marked(s) - x) <= rel * Math.abs(x);
const chosen = (s: Step | undefined) => (s && s.type === 'choice' ? s.options[s.correct] : null);
const t3 = (x: number) => String(parseFloat(x.toPrecision(3)));

/**
 * Waves, checked against what each step marks: v = fλ in whichever form, f × T = 1, the new wavelength
 * straight from v ÷ f₂ (not from the given λ₁), and wavelength × number of waves = length.
 */
export const wavesVerifier: Verifier = {
  verify: (question) => {
    const q = question as Question<WavesCheck>;
    const c = q.check;
    const st = q.steps;
    const last = st[st.length - 1];
    if (c.kind === 'equation') {
      if (Math.abs(c.f * c.lambda - c.v) > 1e-6 * c.v) return 'v = fλ does not hold';
      const want = c.find === 'v' ? c.v : c.find === 'f' ? c.f : c.lambda;
      const form = { v: 'v = f × λ', f: 'f = v ÷ λ', lambda: 'λ = v ÷ f' }[c.find];
      return chosen(st[0]) === form && ok(last, want) ? null : `${c.find}: ${want}`;
    }
    if (c.kind === 'period') {
      if (Math.abs(c.f * c.T - 1) > 1e-9) return 'f × T is not 1';
      if (c.waves !== undefined) return ok(st[0], c.waves / c.seconds!) && ok(st[1], c.T) ? null : 'counted waves';
      return ok(st[0], 1 / c.T) && ok(st[1], 60 / c.T) ? null : 'from the period';
    }
    if (c.kind === 'compare') {
      const sizes = chosen(st[1]) === (c.f2 > c.f1 ? 'Shorter' : 'Longer');
      return chosen(st[0]) === 'It stays the same' && sizes && ok(last, c.v / c.f2, 0.006) ? null : `compare ${c.f1} → ${c.f2}`;
    }
    if (Math.abs(c.lambda * c.count - c.length) > 1e-9) return 'wavelength × count';
    if (!ok(st[0], c.lambda, 1e-9)) return 'wavelength step';
    if (c.height !== undefined && !ok(st[1], c.height / 2, 1e-9)) return 'amplitude';
    return chosen(last) === (c.transverse ? 'Transverse' : 'Longitudinal') ? null : 'wave type';
  },
  mistakes: (question) => {
    const q = question as Question<WavesCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    const out: { step: number; typed: string; expect: string }[] = [];
    if (c.kind === 'equation') {
      if (c.find === 'lambda') out.push({ step: last, typed: t3(c.v * c.f), expect: 'That multiplies' }, { step: last, typed: t3(c.f / c.v), expect: 'wrong way round' });
      if (c.find === 'f') out.push({ step: last, typed: t3(c.v * c.lambda), expect: 'That multiplies' }, { step: last, typed: t3(c.lambda / c.v), expect: 'wrong way round' });
      const conv = q.steps.findIndex((s) => s.prompt.startsWith('First,'));
      if (conv !== -1) {
        const p = q.steps[conv].prompt;
        const m = p.match(/what is ([\d.]+) (k|M|G)Hz/);
        if (m && c.find === 'lambda') out.push({ step: last, typed: t3(c.v / Number(m[1])), expect: 'frequency in' });
        if (p.includes('cm') && c.find === 'v') out.push({ step: last, typed: t3(c.f * c.lambda * 100), expect: 'centimetres' });
      }
      out.push({ step: 0, typed: (q.steps[0] as { options: string[]; correct: number }).options.find((_, i) => i !== (q.steps[0] as { correct: number }).correct)!, expect: 'rearrange it' });
    }
    if (c.kind === 'period') {
      if (c.waves !== undefined) {
        out.push({ step: 0, typed: t3(c.T), expect: 'the period' });
        if (Math.abs(c.f - c.T) > 0.01 * c.T) out.push({ step: 1, typed: t3(c.f), expect: 'frequency again' });
      } else {
        out.push({ step: 0, typed: t3(c.T), expect: 'period again' });
        out.push({ step: 1, typed: t3(c.f), expect: 'each second' });
      }
    }
    if (c.kind === 'compare') {
      out.push({ step: last, typed: t3((c.lambda1 * c.f2) / c.f1), expect: 'opposite ways' });
      out.push({ step: 1, typed: c.f2 > c.f1 ? 'Longer' : 'Shorter', expect: 'higher frequency means a shorter' });
    }
    if (c.kind === 'describe') {
      out.push({ step: 0, typed: String(c.length), expect: 'length of all the waves' });
      if (c.height !== undefined) out.push({ step: 1, typed: String(c.height), expect: 'crest to trough' });
      out.push({ step: last, typed: c.transverse ? 'Longitudinal' : 'Transverse', expect: 'Compare the direction' });
    }
    return out;
  },
};
