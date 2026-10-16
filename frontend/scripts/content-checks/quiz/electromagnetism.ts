import { markNumber, type NumberStep, type Question, type Step } from '../../../src/lib/quiz/core';
import type { EmCheck } from '../../../src/lib/quiz/electromagnetism';
import type { Verifier } from './types';

const chosen = (s: Step | undefined) => (s && s.type === 'choice' ? s.options[s.correct] : null);
const clean = (x: number) => parseFloat(x.toPrecision(10));
const t3 = (x: number) => String(parseFloat(x.toPrecision(3)));
/** Typed exactly (cleaned of float noise), as a pupil works it out. */
const accepts = (s: Step | undefined, x: number) => !!s && s.type === 'number' && markNumber(s as NumberStep, String(clean(x))).ok;
const N = Number;
/** The numbers in a "when is an emf induced" prompt, in order: speeds, turns, rates or currents. */
const nums = (text: string) => (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);

/**
 * Electromagnetic induction, recomputed with ordinary arithmetic from the numbers each question shows and
 * marked through the quiz's own marking. The "when" round is checked against the rule that the emf is in
 * proportion to the rate of change of flux linkage: speed × turns, the turning rate, or the rate of change
 * of current, and zero when nothing changes.
 */
export const electromagnetismVerifier: Verifier = {
  verify: (question) => {
    const q = question as Question<EmCheck>;
    const c = q.check;
    const st = q.steps;
    const last = st[st.length - 1];
    if (c.kind === 'induced') {
      const p = q.prompt;
      const cut = p.indexOf('. ') + 1; // the first sentence ends at '. ', not at the point in 0.2 m/s
      const [first, second] = [nums(p.slice(0, cut)), nums(p.slice(cut))];
      let want: string;
      if (/nothing moves/.test(p) || /stopped inside|stops turning|stays steady/.test(p)) want = 'zero';
      else if (/stronger magnet is used/.test(p)) want = 'bigger';
      else {
        // The quantity that sets the emf, before and after: speed (with the turns), turning rate, or current change.
        const before = /m\/s into a (\d+)-turn/.test(p) ? first[0] * first[1] : first[0];
        const after = /swapped for one with (\d+) turns/.test(p) ? first[0] * second[0] : /m\/s into a/.test(p) ? second[0] * first[1] : second[0];
        want = after > before ? 'bigger' : after < before ? 'smaller' : 'same size';
      }
      const label = { bigger: 'Bigger', smaller: 'Smaller', 'same size': 'The same size', zero: 'Zero: no emf' }[want];
      if (want !== c.effect || chosen(st[1]) !== label) return `induced: expected ${want}, got ${c.effect}`;
      if (chosen(st[0]) !== (/nothing moves/.test(p) ? 'No, it is not changing' : 'Yes, it is changing')) return 'is the flux changing';
      if (st[2]) {
        const opposite = /pulled out|switched off/.test(p);
        if (chosen(st[2]) !== (opposite ? 'The opposite direction' : 'The same direction')) return 'direction';
      }
      return null;
    }
    if (c.kind === 'flux') {
      const phi = N(c.B) * N(c.A);
      return accepts(st[st.length - 2], phi) && accepts(last, phi * c.N) ? null : `flux ${c.B} T × ${c.A} m²`;
    }
    if (c.kind === 'faraday') {
      const emf = (c.N * Math.abs(N(c.phi2) - N(c.phi1))) / N(c.seconds);
      return accepts(st[0], Math.abs(N(c.phi2) - N(c.phi1))) && accepts(last, emf) ? null : `faraday ${c.N}: ${emf}`;
    }
    const force = chosen(st[0]) === (c.inwards ? 'It repels the magnet' : 'It attracts the magnet');
    const facing = c.inwards ? c.pole : c.pole === 'north' ? 'south' : 'north';
    const poleOk = chosen(st[1]) === (facing === 'north' ? 'A north pole' : 'A south pole');
    return force && poleOk && accepts(last, N(c.linkage) / N(c.seconds)) && !(c.pole === 'north' && c.inwards) ? null : 'lenz';
  },
  mistakes: (question) => {
    const q = question as Question<EmCheck>;
    const c = q.check;
    const last = q.steps.length - 1;
    const out: { step: number; typed: string; expect: string }[] = [];
    const wrong = (k: number) => {
      const s = q.steps[k];
      return s.type === 'choice' ? s.options.find((_, i) => i !== s.correct)! : '';
    };
    if (c.kind === 'induced') {
      if (c.effect === 'zero') out.push({ step: 1, typed: 'Bigger', expect: 'induces nothing' });
      else out.push({ step: 1, typed: 'Zero: no emf', expect: 'still changing the flux' });
      if (c.direction) out.push({ step: 2, typed: wrong(2), expect: 'reverses' });
    }
    if (c.kind === 'flux') {
      const phi = N(c.B) * N(c.A);
      const cm = q.steps.findIndex((s) => s.prompt.includes('cm²'));
      if (cm !== -1) out.push({ step: cm, typed: t3(N(c.A) * 100), expect: 'divides by 100' }, { step: last - 1, typed: t3(phi * 10000), expect: 'area in cm²' });
      const mt = q.steps.findIndex((s) => s.prompt.includes('mT'));
      if (mt !== -1) out.push({ step: mt, typed: t3(N(c.B) * 1000), expect: 'still in millitesla' });
      if (c.N !== 1) out.push({ step: last, typed: t3(phi), expect: 'one turn' });
    }
    if (c.kind === 'faraday') {
      const d = Math.abs(N(c.phi2) - N(c.phi1));
      out.push({ step: 0, typed: t3(N(c.phi2)), expect: 'final flux' });
      out.push({ step: last, typed: t3(d / N(c.seconds)), expect: 'leaves out the turns' });
      const ms = q.steps.findIndex((s) => s.prompt.includes(' ms in seconds'));
      if (ms !== -1) out.push({ step: ms + 1, typed: t3(d / (N(c.seconds) * 1000)), expect: 'milliseconds' });
    }
    if (c.kind === 'lenz') {
      out.push({ step: 0, typed: wrong(0), expect: 'opposes the change' });
      out.push({ step: 1, typed: wrong(1), expect: 'Like poles repel' });
      out.push({ step: last, typed: t3(N(c.linkage) * N(c.seconds)), expect: 'That multiplies' });
    }
    return out;
  },
};
