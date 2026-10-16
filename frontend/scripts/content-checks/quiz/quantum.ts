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
      const rel = chosen(st[0])?.startsWith('Yes') === c.released;
      const bright = chosen(st[st.length - 1]) === (c.released ? 'More electrons, with the same greatest energy' : 'Nothing changes');
      const ek = c.released ? acceptsExact(st[1], Math.round((c.eV - c.phi) * 100) / 100) : true;
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
    return accepts3(st[0], p) && accepts3(st[1], H / r3(p)) && accepts3(st[1], H / p) && chosen(st[2]) === 'Shorter' ? null : 'de Broglie';
  },
  mistakes: (question) => {
    const q = question as Question<QuantumCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    const out: { step: number; typed: string; expect: string }[] = [];
    if (c.kind === 'photon') {
      out.push({ step: last - 1, typed: s3(H / c.f), expect: 'That divides' });
      out.push({ step: last, typed: s3(r3(H * c.f) * EV), expect: 'That multiplies' });
      if (c.nm !== undefined) out.push({ step: 1, typed: s3(C / c.nm), expect: 'nanometres' });
    }
    if (c.kind === 'photoelectric') {
      out.push({ step: 0, typed: (q.steps[0] as { options: string[]; correct: number }).options.find((_, i) => i !== (q.steps[0] as { correct: number }).correct)!, expect: 'One photon gives its energy' });
      if (c.released) out.push({ step: 1, typed: String(c.eV), expect: 'That is the photon energy' });
      const b = q.steps[last];
      if (b.type === 'choice') out.push({ step: last, typed: 'The same number of electrons, but faster', expect: c.released ? 'same energy' : 'still release nothing' });
    }
    if (c.kind === 'levels') {
      out.push({ step: 0, typed: String(Math.round(Math.abs(c.from + c.to) * 100) / 100), expect: 'adds the levels' });
      out.push({ step: 1, typed: s3(Math.abs(c.from - c.to) / EV), expect: 'That divides' });
    }
    if (c.kind === 'debroglie') {
      const p = r3(ME * c.v);
      out.push({ step: 1, typed: s3(p / H), expect: 'upside down' });
      out.push({ step: 1, typed: s3(H / c.v), expect: 'divides by the speed' });
    }
    return out;
  },
};
