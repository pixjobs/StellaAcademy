import { create, all, type Fraction as MFraction } from 'mathjs';
import { formatDecimal, type Digits } from '../../../src/lib/measures';
import type { Question } from '../../../src/lib/quiz/core';
import type { DPCheck } from '../../../src/lib/quiz/decimals-percentages';
import type { Verifier } from './types';

const math = create(all);
const frac = (x: string | number, y?: number) => (y === undefined ? math.fraction(String(x)) : math.fraction(Number(x), y)) as MFraction;
/** A number from answer text such as "60%", "£361", "24 litres" or "1,320". */
const num = (s: string) => Number(s.replace(/[£%,]|\s.*$/g, ''));
const val = (d: Digits) => num(formatDecimal(d));

/** Fractions, decimals and percentages: every answer recomputed with mathjs fractions. */
export const decimalsPercentagesVerifier: Verifier = {
  verify: (question) => {
    const q = question as Question<DPCheck>;
    const c = q.check;
    const typed = q.steps.filter((s) => s.type === 'number') as { answer: Digits; prompt: string }[];
    switch (c.kind) {
      case 'f2p': {
        const p = math.number(math.multiply(frac(c.n, c.d), 100) as MFraction);
        if (num(c.answer) !== p) return `f2p ${c.n}/${c.d}: ${c.answer} vs ${p}`;
        if (val(typed[0].answer) * c.d !== 100 || val(typed[1].answer) !== p) return `f2p steps wrong`;
        if (math.gcd(c.n, c.d) !== 1) return `f2p ${c.n}/${c.d} is not in its simplest form`;
        return null;
      }
      case 'd2p':
        return num(c.answer) === math.number(math.multiply(frac(c.x), 100) as MFraction) ? null : `d2p ${c.x}: ${c.answer}`;
      case 'p2d':
        return num(c.answer) === math.number(frac(c.p, 100)) ? null : `p2d ${c.p}: ${c.answer}`;
      case 'p2f': {
        const f = frac(c.p, 100);
        const want = `${f.n}/${f.d}`;
        return c.answer === want && val(typed[0].answer) === 100 / Number(f.d) ? null : `p2f ${c.p}: ${c.answer} vs ${want}`;
      }
      case 'amount':
      case 'discount': {
        const part = (p: number) => math.number(math.multiply(frac(c.a), frac(p, 100)) as MFraction);
        // Each "X% of A", "half of A" or "quarter of A" step, recomputed from its own words.
        for (const s of typed) {
          const got = val(s.answer);
          const m = s.prompt.match(/(\d+)% of £?(\d+)/);
          if (m && Number(m[2]) !== c.a) return `step "${s.prompt}" names the wrong amount`;
          if (m && got !== part(Number(m[1]))) return `step "${s.prompt}" gives ${got}, expected ${part(Number(m[1]))}`;
          if (/half of/.test(s.prompt) && got !== c.a / 2) return `half step ${got}`;
          if (/a quarter of/.test(s.prompt) && got !== c.a / 4) return `quarter step ${got}`;
        }
        const want = c.kind === 'amount' ? part(c.p) : c.a - part(c.p);
        return num(c.answer) === want ? null : `${c.kind} ${c.p}% of ${c.a}: ${c.answer} vs ${want}`;
      }
      case 'compare': {
        const value = (f: string) => (f.endsWith('%') ? num(f) / 100 : f.includes('/') ? math.number(frac(f)) : num(f));
        const vals = c.values.map(value);
        if (new Set(vals).size !== vals.length) return `compare has a tie: ${c.values.join(', ')}`;
        const target = c.values[vals.indexOf(c.largest ? Math.max(...vals) : Math.min(...vals))];
        if (target !== c.answer) return `compare ${c.values.join(', ')}: ${c.answer} vs ${target}`;
        // With two decimals, the one with fewer digits is the bigger, and picking the longer one when asked for the largest is named.
        const decimals = c.values.filter((f) => /^0\.\d+$/.test(f));
        if (decimals.length === 2) {
          const [short, long] = decimals.sort((x, y) => x.length - y.length);
          if (!(value(short) > value(long))) return `two-decimal trap missing: ${short} vs ${long}`;
          const choice = q.steps[2];
          if (c.largest && choice.type === 'choice' && !choice.why[choice.options.indexOf(long)]?.includes('more digits')) return 'no "more digits" feedback for the longer decimal';
        }
        return null;
      }
    }
  },
  mistakes: (question) => {
    const q = question as Question<DPCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    if (c.kind === 'f2p') {
      const joined = Number(`${c.n}${c.d}`);
      return joined === num(c.answer) ? [] : [{ step: 1, typed: String(joined), expect: 'is not' }];
    }
    if (c.kind === 'd2p') return [{ step: last, typed: String(Number((num(c.x) * 10).toFixed(6))), expect: '10 times too small' }];
    if (c.kind === 'p2d' && c.p >= 10) return [{ step: last, typed: String(c.p / 10), expect: '10 times too big' }];
    if (c.kind === 'amount' || c.kind === 'discount') {
      const byP = c.a / c.p;
      if (!Number.isInteger(byP * 1000) || byP === c.a / 10) return [];
      return q.steps.flatMap((s, i) => (s.type === 'number' && !/sale price/.test(s.prompt) && num(formatDecimal(s.answer)) !== byP ? [{ step: i, typed: String(byP), expect: 'divided' }] : []));
    }
    if (c.kind === 'compare') {
      const second = num(c.values[1]) * 100;
      return [{ step: 1, typed: String(Number((second / 10).toFixed(6))), expect: '10 times too small' }];
    }
    return [];
  },
};
