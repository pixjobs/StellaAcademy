import { markNumber, type NumberStep, type Question, type Step } from '../../../src/lib/quiz/core';
import type { WavesCheck } from '../../../src/lib/quiz/waves';
import type { Verifier } from './types';

const marked = (s: Step | undefined) => (s && s.type === 'number' ? (s.answer.neg ? -1 : 1) * Number(s.answer.digits) * 10 ** (s.answer.top - s.answer.digits.length + 1) : NaN);
const ok = (s: Step | undefined, x: number, rel = 0.005) => Math.abs(marked(s) - x) <= rel * Math.abs(x);
const chosen = (s: Step | undefined) => (s && s.type === 'choice' ? s.options[s.correct] : null);
const t3 = (x: number) => String(parseFloat(x.toPrecision(3)));
/** As a calculator shows it to 3 s.f., trailing zeros kept: 0.400, 2.61e+9. */
const calc = (x: number) => x.toPrecision(3);
/** Would this typed answer be accepted? */
const accepts = (s: Step | undefined, typed: string) => !!s && s.type === 'number' && markNumber(s as NumberStep, typed).ok;
/** A number printed in the prompt, such as "91.3 MHz" or "0.172 m", in base units. */
function given(prompt: string, re: RegExp): number {
  const m = prompt.match(re);
  if (!m) return NaN;
  const scale = { G: 1e9, M: 1e6, k: 1e3, c: 0.01, '': 1 }[m[2] ?? ''] ?? 1;
  return Number(m[1].replace(/,/g, '')) * scale;
}

/**
 * Waves, checked by working each answer the way a pupil would, from the numbers the question shows, and
 * marking that through the quiz's own marking: v = fλ in each form, f × T = 1 with T from the rounded f,
 * the new wavelength from the shown one, and wavelength = length ÷ waves typed as a plain decimal.
 */
export const wavesVerifier: Verifier = {
  verify: (question) => {
    const q = question as Question<WavesCheck>;
    const c = q.check;
    const st = q.steps;
    const last = st[st.length - 1];
    if (c.kind === 'equation') {
      if (Math.abs(c.f * c.lambda - c.v) > 1e-6 * c.v) return 'v = fλ does not hold';
      const form = { v: 'v = f × λ', f: 'f = v ÷ λ', lambda: 'λ = v ÷ f' }[c.find];
      if (chosen(st[0]) !== form) return 'form';
      if (c.find === 'f') {
        const lam = given(q.prompt, /wavelength of ([\d.,]+) (c)?m/);
        return accepts(last, calc(c.v / lam)) ? null : `f worked from the shown λ (${lam}) is refused`;
      }
      if (c.find === 'lambda') {
        const f = given(q.prompt, /frequency of ([\d.,]+) (G|M|k)?Hz/);
        const conv = st.find((s) => s.prompt.startsWith('First, what is'));
        if (conv && !(accepts(conv, String(f)) && Math.abs(marked(conv) - f) < 1e-6 * f)) return 'conversion to Hz is not exact';
        return accepts(last, calc(c.v / f)) ? null : `λ worked from the shown f (${f}) is refused`;
      }
      const f = given(q.prompt, /frequency of ([\d.,]+) (G|M|k)?Hz/);
      const lam = given(q.prompt, /wavelength of ([\d.,]+) (c)?m/);
      return accepts(last, calc(f * lam)) ? null : 'speed worked from the shown values is refused';
    }
    if (c.kind === 'period') {
      if (Math.abs(c.f * c.T - 1) > 1e-9 || Math.abs(c.f - c.waves / c.seconds) > 1e-9) return 'f and T';
      const f3 = Number(calc(c.waves / c.seconds));
      return accepts(st[0], calc(c.waves / c.seconds)) && accepts(st[1], calc(1 / f3)) ? null : 'counted waves: worked answers refused';
    }
    if (c.kind === 'compare') {
      const lam1 = given(q.prompt, /wavelength of ([\d.,]+) m/);
      const k = c.f2 / c.f1;
      if (!ok(st[0], k, 1e-9) || chosen(st[1]) !== (k > 1 ? 'Shorter' : 'Longer')) return 'ratio or direction';
      // Worked from the shown λ₁, and close to the true v ÷ f₂.
      return accepts(last, calc(lam1 / k)) && ok(last, c.v / c.f2, 0.006) ? null : `compare ${c.f1} → ${c.f2}`;
    }
    const L = Number(c.length);
    const plain = String(Number((L / c.count).toFixed(9)));
    if (!accepts(st[0], plain)) return `wavelength ${plain} is refused`;
    if (c.height !== undefined && !accepts(st[1], String(c.height / 2))) return 'amplitude refused';
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
      const conv = q.steps.find((s) => s.prompt.startsWith('First, what is'));
      if (conv?.prompt.includes('Hz')) out.push({ step: last, typed: t3(c.v / given(conv.prompt, /what is ([\d.,]+) (?:G|M)Hz/)), expect: 'frequency in' });
      if (conv?.prompt.includes(' cm ')) out.push({ step: last, typed: t3(c.find === 'v' ? c.f * c.lambda * 100 : c.v / (c.lambda * 100)), expect: 'centimetres' });
      const s0 = q.steps[0];
      if (s0.type === 'choice') {
        const upside = { v: 'v = f ÷ λ', lambda: 'λ = f ÷ v', f: 'f = λ ÷ v' }[c.find];
        if (s0.options.includes(upside)) out.push({ step: 0, typed: upside, expect: 'That is upside down' });
        else return [{ step: 0, typed: '', expect: 'the upside-down form with the same letter is missing' }];
      }
    }
    if (c.kind === 'period') {
      out.push({ step: 0, typed: t3(c.T), expect: 'the period' });
      out.push({ step: 1, typed: t3(c.f), expect: 'frequency again' });
    }
    if (c.kind === 'compare') {
      out.push({ step: last, typed: t3(c.lambda1 * (c.f2 / c.f1)), expect: 'opposite ways' });
      out.push({ step: 1, typed: c.f2 > c.f1 ? 'Longer' : 'Shorter', expect: 'opposite ways' });
    }
    if (c.kind === 'describe') {
      out.push({ step: 0, typed: c.length, expect: 'length of all the waves' });
      if (c.height !== undefined) out.push({ step: 1, typed: String(c.height), expect: 'crest to trough' });
      out.push({ step: last, typed: c.transverse ? 'Longitudinal' : 'Transverse', expect: 'Compare the direction' });
    }
    return out;
  },
  aggregate: (qs) => {
    // An amplitude step must not give away the wave type: some transverse waves come without one.
    const d = qs.filter((q) => (q.check as WavesCheck).kind === 'describe').map((q) => q.check as { transverse: boolean; height?: number });
    const transverseNoAmp = d.filter((x) => x.transverse && x.height === undefined).length;
    return d.length > 50 && transverseNoAmp < 0.1 * d.length ? 'every transverse wave has an amplitude step, which gives the type away' : null;
  },
};
