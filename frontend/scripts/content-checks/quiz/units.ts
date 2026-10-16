import { create, all } from 'mathjs';
import type { Question } from '../../../src/lib/quiz/core';
import type { UnitsCheck } from '../../../src/lib/quiz/units';
import type { Verifier } from './types';

const math = create(all);
/** The quiz's unit symbols in mathjs's spelling. */
const MJ = (u: string) => ({ 'm²': 'm^2', 'cm²': 'cm^2', 'mm²': 'mm^2', 'm³': 'm^3', 'cm³': 'cm^3', litres: 'L' })[u] ?? u.replace('μ', 'u');
const convert = (value: string, from: string, to: string) => math.unit(Number(value), MJ(from)).toNumber(MJ(to));
const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
/** A number as a pupil would type it, without float noise. */
const typed = (x: number) => parseFloat(x.toPrecision(12)).toLocaleString('en-GB', { useGrouping: false, maximumFractionDigits: 20 });

/** Converting Units: every answer recomputed with mathjs unit conversions, independently of the decimal shifting in the generator. */
export const unitsVerifier: Verifier = {
  verify: (question) => {
    const c = (question as Question<UnitsCheck>).check;
    if (c.kind === 'standard') {
      const x = convert(c.value, c.from, c.to);
      const a = Number(c.a);
      return a >= 1 && a < 10 && close(a * 10 ** c.n, x) ? null : `${c.value} ${c.from} = ${c.a} × 10^${c.n} ${c.to}? mathjs ${x}`;
    }
    const to = c.kind === 'speed' ? (c.from === 'km/h' ? 'm/s' : 'km/h') : c.to;
    const x = convert(c.value, c.from, to);
    return close(Number(c.answer), x) ? null : `${c.value} ${c.from} → ${c.answer} ${to}; mathjs ${x}`;
  },
  mistakes: (question) => {
    const q = question as Question<UnitsCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    const out: { step: number; typed: string; expect: string }[] = [];
    if (c.kind === 'prefix') {
      const f = Number(c.answer) / Number(c.value); // the factor the right answer used
      out.push({ step: last, typed: typed(Number(c.value) / f), expect: 'The number should get' });
      // Milli and mega: the other one of the pair must be an option, with the capitals warning.
      const right = q.steps[0].type === 'choice' ? q.steps[0].options[q.steps[0].correct] : '';
      const twin = right === '10^{6}' ? '10^{−3}' : right === '10^{−3}' ? '10^{6}' : null;
      if (twin) out.push({ step: 0, typed: twin, expect: 'Take care with capitals' });
      // The answer typed with the wrong capital (mW for MW, MA for mA) is refused.
      if (/^[mM][A-Za-z]/.test(c.to)) out.push({ step: last, typed: `${c.answer} ${c.to[0] === 'm' ? 'M' : 'm'}${c.to.slice(1)}`, expect: 'capital letter' });
    }
    if (c.kind === 'standard') {
      const p = Math.round(Math.log10(convert('1', c.from, c.to)));
      const k = c.n - p;
      out.push({ step: 0, typed: `10^{${-p < 0 ? `−${p}` : -p}}`, expect: 'prefix, so its power' });
      if (c.n !== 0) out.push({ step: 2, typed: String(-c.n), expect: 'check the sign' });
      if (k !== 0) {
        out.push({ step: 1, typed: c.value, expect: 'not between 1 and 10' });
        if (p - k !== -c.n) out.push({ step: 2, typed: String(p - k), expect: 'wrong way' });
      }
    }
    if (c.kind === 'speed') {
      const v = Number(c.value);
      if (c.from === 'km/h') {
        out.push({ step: 1, typed: '60', expect: 'minutes in an hour' });
        out.push({ step: 2, typed: typed((v * 1000) / 60), expect: 'metres per minute' });
        out.push({ step: 2, typed: typed(v * 3.6), expect: 'multiplies by 3.6' });
      } else {
        out.push({ step: 0, typed: '60', expect: 'minutes in an hour' });
        out.push({ step: 1, typed: typed(v * 60), expect: 'one minute' });
        out.push({ step: 2, typed: typed(v * 3600), expect: 'still in metres' });
        out.push({ step: 2, typed: (v / 3.6).toFixed(2), expect: 'divides by 3.6' });
      }
    }
    if (c.kind === 'space') {
      const v = Number(c.value);
      const big = convert('1', c.from, c.to) > 1;
      const unitPair = new Set([c.from, c.to]);
      const length = unitPair.has('mm²') ? 10 : unitPair.has('litres') ? null : 100;
      const dim = unitPair.has('m³') && unitPair.has('cm³') ? 3 : unitPair.has('litres') ? null : 2;
      out.push({ step: last, typed: typed(big ? v / (Number(c.answer) / v) : v * (v / Number(c.answer))), expect: 'The number should get' });
      if (length && dim) {
        out.push({ step: 1, typed: String(length), expect: 'length factor' });
        out.push({ step: last, typed: typed(big ? v * length : v / length), expect: 'uses the length factor' });
        if (dim === 3) {
          out.push({ step: 1, typed: String(length * length), expect: 'squares it' });
          out.push({ step: last, typed: typed(big ? v * length * length : v / (length * length)), expect: 'factor for an area' });
        }
      }
      if (unitPair.has('m³') && unitPair.has('litres')) out.push({ step: 0, typed: '1000000', expect: 'cm³ in 1 m³' });
    }
    return out;
  },
};
