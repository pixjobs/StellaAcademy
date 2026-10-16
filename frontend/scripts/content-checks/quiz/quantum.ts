import { markNumber, type NumberStep, type Question, type Step } from '../../../src/lib/quiz/core';
import type { QuantumCheck } from '../../../src/lib/quiz/quantum';
import type { Verifier } from './types';

const H = 6.63e-34;
const C = 3.0e8;
const EV = 1.6e-19;
const ME = 9.11e-31;
const chosen = (s: Step | undefined) => (s && s.type === 'choice' ? s.options[s.correct] : null);
const r3 = (x: number) => Number(x.toPrecision(3));
/** Written to 3 s.f. as a calculator shows it (2.61e-19), and accepted? */
const accepts3 = (s: Step | undefined, x: number) => !!s && s.type === 'number' && markNumber(s as NumberStep, x.toPrecision(3)).ok;
const acceptsExact = (s: Step | undefined, x: number) => !!s && s.type === 'number' && markNumber(s as NumberStep, String(parseFloat(x.toPrecision(10)))).ok;
const s3 = (x: number) => x.toPrecision(3);

/**
 * Photons, recomputed from the constants and the numbers each question shows, and marked through the quiz's
 * own marking exactly and chained from rounded steps. Photon energy also by E = hc/λ (a second route), the
 * photoelectric effect by energy conservation, and energy levels by the photon carrying the difference.
 */
export const quantumVerifier: Verifier = {
  verify: (question) => {
    const q = question as Question<QuantumCheck>;
    const c = q.check;
    const st = q.steps;
    const last = st[st.length - 1];
    if (c.kind === 'photon') {
      // The colour named must match the frequency: c ÷ f inside that colour's wavelength range.
      // Ultraviolet first: its name contains "violet light".
      const RANGES: Record<string, [number, number]> = { ultraviolet: [10, 400], red: [620, 750], orange: [590, 625], yellow: [565, 595], green: [495, 570], blue: [445, 500], violet: [380, 450] };
      const colour = Object.keys(RANGES).find((k) => q.prompt.includes(`${k} light`));
      const lam = (C / c.f) * 1e9;
      if (!colour || lam < RANGES[colour][0] - 3 || lam > RANGES[colour][1] + 3) return `${colour} light at ${lam.toFixed(0)} nm`;
      if (Math.abs(c.f - 6e14) < 1e12 || Math.abs(c.f - 5e14) < 1e12) return 'the page’s worked example or practice frequency';
      if (c.nm !== undefined) {
        const viaLambda = (H * C) / (c.nm * 1e-9); // E = hc/λ directly
        if (Math.abs(viaLambda - c.EJ) > 0.01 * viaLambda) return 'E = hc/λ disagrees';
      }
      const fShown = c.f;
      const EJchained = H * fShown;
      return accepts3(st[st.length - 2], EJchained) && accepts3(last, r3(EJchained) / EV) && accepts3(last, c.eV) ? null : 'photon energy';
    }
    if (c.kind === 'photoelectric') {
      if (c.released !== c.eV > c.phi) return 'released';
      const at = c.nm !== undefined ? 1 : 0; // a wavelength first asks for the photon energy
      if (c.nm !== undefined) {
        const eV = (H * C) / (c.nm * 1e-9) / EV;
        if (!accepts3(st[0], eV)) return 'photon energy from the wavelength';
      }
      const rel = chosen(st[at])?.startsWith('Yes') === c.released;
      const bright = chosen(st[st.length - 1]) === (c.released ? 'More electrons, with the same greatest energy' : 'Nothing changes');
      const ek = c.released ? (c.nm !== undefined ? accepts3(st[at + 1], r3((H * C) / (c.nm * 1e-9) / EV) - c.phi) : acceptsExact(st[at + 1], Math.round((c.eV - c.phi) * 100) / 100)) : true;
      return rel && bright && ek ? null : 'photoelectric';
    }
    if (c.kind === 'levels') {
      const eV = Math.abs(c.from - c.to);
      const J = eV * EV;
      const isWavelength = last.prompt.includes('wavelength');
      const want = isWavelength ? (H * C) / r3(J) : r3(J) / H;
      return acceptsExact(st[0], Math.round(eV * 100) / 100) && accepts3(st[1], J) && accepts3(last, want) ? null : 'levels';
    }
    const p = ME * c.v;
    // Faster or heavier means more momentum and a shorter wavelength; slower means a longer one.
    const want = /slower/.test(st[2].prompt) ? 'Longer' : 'Shorter';
    return accepts3(st[0], p) && accepts3(st[1], H / r3(p)) && accepts3(st[1], H / p) && chosen(st[2]) === want ? null : 'de Broglie';
  },
  mistakes: (question) => {
    const q = question as Question<QuantumCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    const out: { step: number; typed: string; expect: string }[] = [];
    if (c.kind === 'photon') {
      out.push({ step: last - 1, typed: s3(H / c.f), expect: 'That divides' });
      out.push({ step: last, typed: s3(r3(H * c.f) * EV), expect: 'That multiplies' });
      if (c.nm !== undefined) out.push({ step: 1, typed: s3(C / c.nm), expect: 'nanometres' }, { step: 0, typed: String(c.nm), expect: 'still in nanometres' });
    }
    if (c.kind === 'photoelectric') {
      const at = c.nm !== undefined ? 1 : 0;
      const sc = q.steps[at] as { options: string[]; correct: number };
      out.push({ step: at, typed: sc.options.find((_, i) => i !== sc.correct)!, expect: c.released ? 'Compare the photon’s energy' : 'less energy than the work function' });
      if (c.released) out.push({ step: at + 1, typed: String(c.eV), expect: 'That is the photon energy' }, { step: at + 1, typed: String(Math.round((c.phi - c.eV) * 100) / 100), expect: 'wrong way round' });
      const b = q.steps[last];
      if (b.type === 'choice') out.push({ step: last, typed: 'The same number of electrons, but faster', expect: 'What sets the energy of each one' });
    }
    if (c.kind === 'levels') {
      out.push({ step: 0, typed: String(Math.round(Math.abs(c.from + c.to) * 100) / 100), expect: 'adds the levels' });
      out.push({ step: 1, typed: s3(Math.abs(c.from - c.to) / EV), expect: 'That divides' });
      const J = r3(Math.abs(c.from - c.to) * EV);
      if (q.steps[2].prompt.includes('wavelength')) out.push({ step: 2, typed: s3(J / (H * C)), expect: 'upside down' });
      else out.push({ step: 2, typed: s3(J * H), expect: 'That multiplies' });
    }
    if (c.kind === 'debroglie') {
      const p = r3(ME * c.v);
      out.push({ step: 1, typed: s3(p / H), expect: 'upside down' });
      out.push({ step: 1, typed: s3(H / c.v), expect: 'divides by the speed' });
    }
    return out;
  },
};
