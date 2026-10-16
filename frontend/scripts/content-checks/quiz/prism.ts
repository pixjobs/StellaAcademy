import type { Question, Step } from '../../../src/lib/quiz/core';
import type { PrismCheck } from '../../../src/lib/quiz/prism';
import type { Verifier } from './types';

const marked = (s: Step | undefined) => (s && s.type === 'number' ? (s.answer.neg ? -1 : 1) * Number(s.answer.digits) * 10 ** (s.answer.top - s.answer.digits.length + 1) : NaN);
const ok3 = (s: Step | undefined, x: number) => Math.abs(marked(s) - x) <= 0.005 * Math.abs(x);
const chosen = (s: Step | undefined) => (s && s.type === 'choice' ? s.options[s.correct] : null);
const t3 = (x: number) => String(parseFloat(x.toPrecision(3)));
const rad = (d: number) => (d * Math.PI) / 180;
const SPECTRUM = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];

/**
 * Refraction, checked against what each step marks. Directions from the rule "slower bends towards the normal";
 * Snell's law by θ₂ = atan(n₁ sin θ₁ / √(n₂² − n₁² sin² θ₁)), a different route from the inverse sine; speeds by
 * v × n = c; colours by their place in the spectrum; filters by "only its own colour passes".
 */
export const prismVerifier: Verifier = {
  verify: (question) => {
    const q = question as Question<PrismCheck>;
    const c = q.check;
    const st = q.steps;
    if (c.kind === 'bend') {
      let i = 0;
      if (c.surface && marked(st[i++]) !== c.angle) return 'angle to the normal';
      if (chosen(st[i++]) !== (c.n2 > c.n1 ? 'It slows down' : 'It speeds up')) return 'speed change';
      const dir = c.angle === 0 ? 'It does not change direction' : c.n2 > c.n1 ? 'Towards the normal' : 'Away from the normal';
      if (chosen(st[i++]) !== dir) return `direction: ${chosen(st[i - 1])}`;
      if (c.angle !== 0 && chosen(st[i]) !== (c.n2 > c.n1 ? 'Smaller' : 'Bigger')) return 'angle size';
      if (c.n1 * Math.sin(rad(c.angle)) >= c.n2) return 'beyond the critical angle';
      return null;
    }
    if (c.kind === 'snell') {
      const s = c.n1 * Math.sin(rad(c.theta1));
      if (s >= c.n2) return 'beyond the critical angle';
      const theta2 = (Math.atan(s / Math.sqrt(c.n2 ** 2 - s ** 2)) * 180) / Math.PI;
      return ok3(st[0], Math.sin(rad(c.theta1))) && ok3(st[1], s / c.n2) && ok3(st[2], theta2) ? null : `snell ${c.n1}→${c.n2} at ${c.theta1}°`;
    }
    if (c.kind === 'crossing') {
      // Time by the number of wavelengths-free route: distance ÷ (c ÷ n) = distance × n ÷ c.
      const t = ((c.cm / 100) * c.n) / 3e8;
      return ok3(st[0], 3e8 / c.n) && Math.abs(marked(st[1]) - c.cm / 100) < 1e-9 && ok3(st[2], t) ? null : `crossing ${c.cm} cm, n=${c.n}`;
    }
    if (c.kind === 'speed') return Math.abs(c.v * c.n - 3e8) < 1 && ok3(st[1], c.ask === 'v' ? c.v : c.n) ? null : `speed n=${c.n}`;
    if (c.kind === 'colours') {
      if (SPECTRUM.indexOf(c.high) <= SPECTRUM.indexOf(c.low)) return 'colour order';
      const want = c.asks.map((a) => (a === 'higher' || a === 'more' || a === 'bentMore' ? c.high : c.low));
      return want.every((w, k) => chosen(st[k])?.toLowerCase() === `${w} light`) ? null : 'colour answers';
    }
    const out = c.first === c.second ? `${c.first} light` : 'no light';
    return chosen(st[0])?.toLowerCase() === `${c.first} light` && chosen(st[1])?.toLowerCase() === out ? null : `filters ${c.first} then ${c.second}`;
  },
  mistakes: (question) => {
    const q = question as Question<PrismCheck>;
    const c = q.check;
    const out: { step: number; typed: string; expect: string }[] = [];
    const wrongOption = (k: number, pickOne?: (o: string) => boolean) => {
      const s = q.steps[k];
      if (s.type !== 'choice') return null;
      const opts = s.options.filter((_, i) => i !== s.correct);
      return (pickOne ? opts.find(pickOne) : opts[0]) ?? null;
    };
    if (c.kind === 'bend') {
      let i = 0;
      if (c.surface) out.push({ step: i++, typed: String(90 - c.angle), expect: 'angle to the boundary' });
      out.push({ step: i, typed: wrongOption(i)!, expect: 'refractive index of' });
      i++;
      if (c.angle === 0) out.push({ step: i, typed: wrongOption(i)!, expect: 'reaches the surface all at once' });
      else {
        out.push({ step: i, typed: 'It does not change direction', expect: 'one side of the beam' });
        out.push({ step: i, typed: c.n2 > c.n1 ? 'Away from the normal' : 'Towards the normal', expect: 'Slowing down bends light towards' });
      }
    }
    if (c.kind === 'snell') {
      const s1 = Math.sin(rad(c.theta1));
      const s2 = (c.n1 * s1) / c.n2;
      if (Math.abs(Math.sin(c.theta1) - s1) > 0.05) out.push({ step: 0, typed: t3(Math.sin(c.theta1)), expect: 'radians' });
      out.push({ step: 1, typed: t3((c.n2 * s1) / c.n1), expect: 'wrong way round' });
      out.push({ step: 2, typed: t3(s2), expect: 'That is sin θ₂' });
      if (Math.abs(Math.asin(s2) - s2) > 0.05) out.push({ step: 2, typed: t3(Math.asin(s2)), expect: 'radians' });
    }
    if (c.kind === 'speed') {
      if (c.ask === 'v') out.push({ step: 1, typed: `${t3((3e8 * c.n) / 1e8)}e8`, expect: 'That multiplies' });
      else out.push({ step: 1, typed: t3(c.v / 3e8), expect: 'upside down' });
      out.push({ step: 0, typed: wrongOption(0)!, expect: c.ask === 'v' ? 'n times slower' : 'more than 1' });
    }
    if (c.kind === 'crossing') {
      out.push({ step: 2, typed: `${t3((c.cm * c.n) / 3)}e-8`, expect: 'centimetres' });
      out.push({ step: 2, typed: `${t3((c.cm / 100 / 3e8) * 1e10)}e-10`, expect: 'speed in a vacuum' });
    }
    if (c.kind === 'colours') {
      const why = ['Frequency rises', 'the higher the frequency, the more the light slows', 'violet bends the most'];
      c.asks.forEach((a, k) => out.push({ step: k, typed: wrongOption(k)!, expect: a === 'higher' || a === 'lower' ? why[0] : a === 'more' || a === 'less' ? why[1] : why[2] }));
    }
    if (c.kind === 'filters' && c.first !== c.second) out.push({ step: 1, typed: `${c.second[0].toUpperCase()}${c.second.slice(1)} light`, expect: 'cannot add a colour' });
    return out;
  },
  aggregate: (qs) => {
    const counts: Record<number, number[]> = {};
    for (const q of qs) for (const s of q.steps) if (s.type === 'choice') (counts[s.options.length] ??= Array(s.options.length).fill(0))[s.correct]++;
    for (const [n, cs] of Object.entries(counts)) {
      const total = cs.reduce((a, b) => a + b, 0);
      if (total > 50 && Math.min(...cs) / total < 0.5 / Number(n)) return `right answers bunched in ${n}-option steps: ${cs.join(' / ')}`;
    }
    return null;
  },
};
