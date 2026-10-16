import { markNumber, type NumberStep, type Question, type Step } from '../../../src/lib/quiz/core';
import type { ThermoCheck } from '../../../src/lib/quiz/thermodynamics';
import type { Verifier } from './types';

const R = 8.31;
const K = 1.38e-23;
const chosen = (s: Step | undefined) => (s && s.type === 'choice' ? s.options[s.correct] : null);
const t3 = (x: number) => String(parseFloat(x.toPrecision(3)));
const r3 = (x: number) => Number(x.toPrecision(3));
const clean = (x: number) => parseFloat(x.toPrecision(10));
/** Accepted as typed exactly (cleaned of float noise)? */
const acceptsExact = (s: Step | undefined, x: number) => !!s && s.type === 'number' && markNumber(s as NumberStep, String(clean(x))).ok;
/** Accepted when written to 3 s.f., as a calculator shows it? */
const accepts3 = (s: Step | undefined, x: number) => !!s && s.type === 'number' && markNumber(s as NumberStep, x.toPrecision(3)).ok;

/**
 * Thermodynamics, recomputed from the numbers the question shows: pV kept constant, p/T or V/T kept constant
 * in kelvin, pV = nRT in whichever form, and ³⁄₂kT. Each worked answer is typed exactly and to 3 s.f., and
 * chained from rounded earlier steps, through the quiz's own marking.
 */
export const thermodynamicsVerifier: Verifier = {
  verify: (question) => {
    const q = question as Question<ThermoCheck>;
    const c = q.check;
    const st = q.steps;
    const last = st[st.length - 1];
    if (c.kind === 'boyle') {
      if (Math.abs(c.p1 * c.V1 - c.p2 * c.V2) > 1e-9 * c.p1 * c.V1) return 'pV not constant';
      const up = c.find === 'p' ? c.p2 > c.p1 : c.V2 > c.V1;
      return chosen(st[0]) === (up ? 'It goes up' : 'It goes down') && acceptsExact(st[1], c.p1 * c.V1) && acceptsExact(last, c.find === 'p' ? c.p2 : c.V2) ? null : 'boyle';
    }
    if (c.kind === 'kelvin') {
      // A different route: x/T stays constant.
      const x2 = (c.x1 / (c.c1 + 273)) * (c.c2 + 273);
      return acceptsExact(st[0], c.c1 + 273) && acceptsExact(st[1], c.c2 + 273) && (acceptsExact(last, x2) || accepts3(last, x2)) ? null : 'kelvin';
    }
    if (c.kind === 'ideal') {
      const T = c.T;
      let want: number;
      if (c.find === 'p') want = (c.n * R * T) / c.V;
      else {
        const m = q.prompt.match(/([\d.]+) × 10\^\{(−?\d+)\} Pa|([\d,]+(?:\.\d+)?) Pa/);
        const p = m ? (m[1] ? Number(m[1]) * 10 ** Number(m[2].replace('−', '-')) : Number(m[3].replace(/,/g, ''))) : NaN;
        want = c.find === 'V' ? (c.n * R * T) / p : c.find === 'n' ? (p * c.V) / (R * T) : (p * c.V) / (c.n * R);
      }
      const formStep = st.find((s) => s.type === 'choice');
      const form = { p: 'p = nRT ÷ V', V: 'V = nRT ÷ p', n: 'n = pV ÷ RT', T: 'T = pV ÷ nR' }[c.find];
      return chosen(formStep) === form && accepts3(last, want) ? null : `ideal ${c.find}: ${want}`;
    }
    if (c.c2 === undefined) return acceptsExact(st[0], c.c1 + 273) && accepts3(last, 1.5 * K * (c.c1 + 273)) ? null : 'energy';
    const [T1, T2] = [c.c1 + 273, c.c2 + 273];
    const E1 = r3(1.5 * K * T1); // as the question shows it
    const chained = E1 * r3(T2 / T1);
    return accepts3(st[2], T2 / T1) && accepts3(last, E1 * (T2 / T1)) && accepts3(last, chained) ? null : 'energy scaling';
  },
  mistakes: (question) => {
    const q = question as Question<ThermoCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    const out: { step: number; typed: string; expect: string }[] = [];
    if (c.kind === 'boyle') {
      const ans = c.find === 'p' ? c.p2 : c.V2;
      const wrong = c.find === 'p' ? (c.p1 * c.V2) / c.V1 : (c.V1 * c.p2) / c.p1;
      if (Math.abs(wrong - ans) > 0.01 * ans) out.push({ step: last, typed: t3(wrong), expect: 'wrong way' });
    }
    if (c.kind === 'kelvin') {
      out.push({ step: 0, typed: String(c.c1), expect: 'still in °C' });
      out.push({ step: last, typed: t3((c.x1 * c.c2) / c.c1), expect: 'works in °C' });
      out.push({ step: last, typed: t3((c.x1 * (c.c1 + 273)) / (c.c2 + 273)), expect: 'upside down' });
    }
    if (c.kind === 'ideal') {
      const k = q.steps.findIndex((s) => s.prompt.includes('in kelvin?'));
      if (k !== -1) out.push({ step: k, typed: String(c.T - 273), expect: 'still in °C' });
      const s = q.steps.find((x) => x.type === 'choice');
      const upside = { p: 'p = V ÷ nRT', V: 'V = p ÷ nRT', n: 'n = RT ÷ pV', T: 'T = nR ÷ pV' }[c.find];
      if (s) out.push({ step: q.steps.indexOf(s), typed: upside, expect: 'upside down' });
      const lit = q.steps.findIndex((x) => x.prompt.includes('litres in m³'));
      if (lit !== -1) out.push({ step: lit, typed: String(c.V * 1000), expect: 'still in litres' });
      if (c.find === 'p' && c.T !== 273) out.push({ step: last, typed: t3((c.n * R * (c.T - 273)) / c.V), expect: 'temperature in °C' });
      if (c.find === 'p' && lit !== -1) out.push({ step: last, typed: t3((c.n * R * c.T) / (c.V * 1000)), expect: 'volume in litres' });
    }
    if (c.kind === 'energy') {
      if (c.c2 === undefined) {
        out.push({ step: last, typed: `${t3(K * (c.c1 + 273) * 1e21)}e-21`, expect: 'leaves out the ³⁄₂' });
        if (c.c1 !== 0) out.push({ step: last, typed: `${t3(1.5 * K * c.c1 * 1e21)}e-21`, expect: 'uses °C' });
      } else {
        if (c.c1 !== 0) out.push({ step: 2, typed: t3(c.c2 / c.c1), expect: 'in °C' });
        out.push({ step: 2, typed: t3((c.c1 + 273) / (c.c2 + 273)), expect: 'upside down' });
      }
    }
    return out;
  },
};
