/**
 * Quiz for "Photons and Quantum Physics" (KAN-100): photon energy, the photoelectric effect, energy levels and
 * line spectra, and the de Broglie wavelength. A-level; calculator answers to 3 significant figures in standard
 * form, each worked from the values the question shows.
 */
import { D, approx, approxStd, pick, shuffle, toNumber, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';
import type { Digits } from '@/lib/measures';

export type Round = 'photon' | 'photoelectric' | 'levels' | 'debroglie';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  photon: { label: 'Photon energy', blurb: 'E = hf, with h = 6.63 × 10⁻³⁴ J s. 1 eV = 1.60 × 10⁻¹⁹ J.' },
  photoelectric: { label: 'The photoelectric effect', blurb: 'hf = φ + Eₖ(max): one photon releases one electron.' },
  levels: { label: 'Energy levels', blurb: 'A photon’s energy is the difference between two energy levels.' },
  debroglie: { label: 'De Broglie wavelength', blurb: 'λ = h ÷ p, with p = mv.' },
};

export type QuantumCheck =
  | { kind: 'photon'; nm?: number; f: number; EJ: number; eV: number }
  | { kind: 'photoelectric'; eV: number; phi: number; released: boolean; ek?: number; nm?: number }
  | { kind: 'levels'; from: number; to: number; eV: number; J: number; f: number }
  | { kind: 'debroglie'; v: number; p: number; lambda: number; choice: 'Shorter' | 'Longer' };
type Question = Q<QuantumCheck>;

const H = 6.63e-34;
const C = 3.0e8;
const EV = 1.6e-19;
const ME = 9.11e-31;
const near = (g: Digits, x: number, rel = 0.01) => Math.abs(toNumber(g) - x) <= rel * Math.abs(x);
const std = (x: number) => approxStd(x).shown;
/** A calculator value as shown, read back as the number a pupil carries on with. */
const shownValue = (x: number) => toNumber(approxStd(x).answer);

// ---------------------------------------------------------------------------------------------
// Photon energy
// ---------------------------------------------------------------------------------------------

const steps5 = (lo: number, hi: number) => Array.from({ length: (hi - lo) / 5 + 1 }, (_, i) => lo + i * 5);
const LIGHTS: { what: string; nm: number[] }[] = [
  { what: 'red light', nm: steps5(625, 700) },
  { what: 'orange light', nm: steps5(595, 620) },
  { what: 'yellow light', nm: steps5(570, 590) },
  { what: 'green light', nm: steps5(500, 565) },
  { what: 'blue light', nm: steps5(450, 495) },
  { what: 'violet light', nm: steps5(400, 445) },
  { what: 'ultraviolet light', nm: steps5(200, 380) },
];

function photonQuestion(r: () => number): Question {
  for (;;) {
    const L = pick(r, LIGHTS);
    const fromNm = r() < 0.5;
    const nm = pick(r, L.nm);
    // From a frequency: one with a mantissa that is not on the page (6.0 and 5.0 × 10^14 are).
    // The frequency always comes from the colour's own wavelength, so the colour named is the right one.
    const fShown = approxStd(C / (nm * 1e-9));
    const f = toNumber(fShown.answer);
    if (Math.abs(f - 6e14) < 1e12 || Math.abs(f - 5e14) < 1e12) continue; // the page's worked example and practice question
    const EJ = H * f;
    const EJs = shownValue(EJ);
    const eV = EJs / EV;
    const steps: Step[] = [];
    if (fromNm) {
      steps.push(
        { type: 'number', prompt: `What is ${nm} nm in metres?`, ...approxStd(nm * 1e-9), unit: 'm', feedback: (g) => (near(g, nm, 1e-9) ? 'That is still in nanometres. A nanometre is 10^{−9} m.' : 'Multiply by 10^{−9}.') },
        { type: 'number', prompt: 'What is the frequency, f = c ÷ λ? Give 3 significant figures.', ...fShown, unit: 'Hz', tolerance: 0.005, feedback: (g) => (near(g, C / nm) ? 'That uses the wavelength in nanometres. Change it to metres first.' : 'Divide the speed of light by the wavelength in metres.') },
      );
    }
    steps.push(
      { type: 'number', prompt: 'What is the photon’s energy, E = hf, in joules? Give 3 significant figures.', ...approxStd(EJ), unit: 'J', tolerance: 0.006, feedback: (g) => (near(g, H / f) ? 'That divides. E = h × f.' : 'Multiply the Planck constant by the frequency.') },
      { type: 'number', prompt: 'And in electronvolts? Give 3 significant figures.', ...approx(eV), unit: 'eV', tolerance: 0.008, feedback: (g) => (near(g, EJs * EV) ? 'That multiplies. Divide the energy in joules by 1.60 × 10^{−19}.' : 'Divide by 1.60 × 10^{−19}: that many joules make one electronvolt.') },
    );
    return {
      round: 'photon',
      prompt: fromNm
        ? `A photon of ${L.what} has a wavelength of ${nm} nm. Find its energy, in joules and in electronvolts. (h = 6.63 × 10^{−34} J s, c = 3.00 × 10^{8} m/s, 1 eV = 1.60 × 10^{−19} J)`
        : `A photon of ${L.what} has a frequency of ${fShown.shown} Hz. Find its energy, in joules and in electronvolts. (h = 6.63 × 10^{−34} J s, 1 eV = 1.60 × 10^{−19} J)`,
      steps,
      workings: [
        ...(fromNm ? [`λ = ${nm} × 10^{−9} m, so f = 3.00 × 10^{8} ÷ (${std(nm * 1e-9)}) = ${fShown.shown} Hz.`] : []),
        `E = hf = 6.63 × 10^{−34} × ${fShown.shown} = ${std(EJ)} J.`,
        `In eV: ${std(EJ)} ÷ (1.60 × 10^{−19}) = ${approx(eV).shown} eV.`,
      ],
      check: { kind: 'photon', ...(fromNm ? { nm } : {}), f, EJ, eV },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// The photoelectric effect
// ---------------------------------------------------------------------------------------------

const METALS: { name: string; phi: number }[] = [
  { name: 'caesium', phi: 2.1 },
  { name: 'potassium', phi: 2.3 },
  { name: 'calcium', phi: 2.9 },
  { name: 'magnesium', phi: 3.7 },
  { name: 'zinc', phi: 4.3 },
  { name: 'copper', phi: 4.7 },
];

function photoelectricQuestion(r: () => number): Question {
  for (;;) {
    const m = pick(r, METALS);
    // Half the time the light is given by its wavelength, so the photon energy has to be found first.
    const byWavelength = r() < 0.5;
    const L = pick(r, LIGHTS);
    const nm = pick(r, L.nm);
    const eVexact = byWavelength ? (H * C) / (nm * 1e-9) / EV : Math.round((1.6 + Math.floor(r() * 47) * 0.1) * 10) / 10; // 1.6 to 6.2 eV
    const eVa = approx(eVexact);
    const eV = byWavelength ? toNumber(eVa.answer) : eVexact;
    if (eV === 3.0 && m.phi === 2.3) continue; // the page's practice question
    if (Math.abs(eV - m.phi) < 0.15) continue; // too close to call
    const released = eV > m.phi;
    const ek = released ? Math.round((eV - m.phi) * 1000) / 1000 : undefined;
    const relOptions = shuffle(r, ['Yes: each photon has enough energy', 'No: each photon has too little energy']);
    const relRight = relOptions.indexOf(released ? 'Yes: each photon has enough energy' : 'No: each photon has too little energy');
    const steps: Step[] = [];
    if (byWavelength)
      steps.push({ type: 'number', prompt: 'What is the energy of each photon, in eV? (E = hc ÷ λ, then ÷ 1.60 × 10^{−19}.) Give 3 significant figures.', ...eVa, unit: 'eV', tolerance: 0.006, feedback: (g) => (near(g, eVexact * EV) ? 'That is in joules. Divide by 1.60 × 10^{−19} for eV.' : near(g, (H * C) / nm / EV) ? 'That uses the wavelength in nanometres. Change it to metres first.' : 'Work out hc ÷ λ with λ in metres, then divide by 1.60 × 10^{−19}.') });
    steps.push({
      type: 'choice',
      prompt: `The work function of ${m.name} is ${m.phi} eV. Are electrons released?`,
      options: relOptions,
      correct: relRight,
      why: { [1 - relRight]: released ? 'One photon gives its energy to one electron. Compare the photon’s energy with the work function.' : 'Each photon has less energy than the work function. Brighter light only means more photons, each still too weak.' },
    });
    if (released) {
      steps.push({ type: 'number', prompt: 'What is the greatest kinetic energy of the electrons released, in eV?', ...(byWavelength ? approx(ek!) : { answer: D(String(ek)) }), exact: ek, tolerance: byWavelength ? 0.02 : 0.002, unit: 'eV', feedback: (g) => (near(g, -ek!) || near(g, ek! * -1) ? 'That is the wrong way round: Eₖ(max) = hf − φ.' : near(g, eV) ? 'That is the photon energy. Some of it is used to escape: take away the work function.' : 'Eₖ(max) = hf − φ.') });
    }
    const brightOptions = shuffle(r, ['More electrons, with the same greatest energy', 'The same number of electrons, but faster', 'More electrons, and faster ones', 'Nothing changes']);
    const brightRight = brightOptions.indexOf(released ? 'More electrons, with the same greatest energy' : 'Nothing changes');
    steps.push({
      type: 'choice',
      prompt: 'The same light is made brighter. What changes?',
      options: brightOptions,
      correct: brightRight,
      why: whyAll(brightOptions, brightRight, () => 'Brighter light of the same colour has more photons each second. What sets the energy of each one?'),
    });
    return {
      round: 'photoelectric',
      prompt: byWavelength
        ? `${L.what.charAt(0).toUpperCase() + L.what.slice(1)} of wavelength ${nm} nm shines on a clean ${m.name} surface. Are electrons released, and with what greatest kinetic energy? (h = 6.63 × 10^{−34} J s, c = 3.00 × 10^{8} m/s, 1 eV = 1.60 × 10^{−19} J)`
        : `Light whose photons each carry ${eV} eV shines on a clean ${m.name} surface. Are electrons released, and with what greatest kinetic energy?`,
      steps,
      workings: [
        ...(byWavelength ? [`Each photon carries hc ÷ λ = ${eVa.shown} eV.`] : []),
        released ? `${eV} eV is more than the work function, ${m.phi} eV, so electrons are released.` : `${eV} eV is less than the work function, ${m.phi} eV, so no electrons are released, however bright the light.`,
        ...(released ? [`Eₖ(max) = ${eV} − ${m.phi} = ${byWavelength ? approx(ek!).shown : ek} eV.`] : []),
        released ? 'More electrons, with the same greatest energy: brighter light means more photons, each with the same energy.' : 'Nothing changes: brighter light means more photons, each still too weak.',
      ],
      check: { kind: 'photoelectric', eV, phi: m.phi, released, ...(released ? { ek } : {}), ...(byWavelength ? { nm } : {}) },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Energy levels
// ---------------------------------------------------------------------------------------------

/** Real energy levels in eV: hydrogen's lowest six, and mercury's lowest five. */
const ATOMS: { name: string; levels: string[] }[] = [
  { name: 'a hydrogen atom', levels: ['−13.6', '−3.40', '−1.51', '−0.85', '−0.54', '−0.38'] },
  { name: 'a mercury atom', levels: ['−10.4', '−5.52', '−3.71', '−2.68', '−1.57'] },
];
const val = (x: string) => -Number(x.replace('−', ''));

function levelsQuestion(r: () => number): Question {
  for (;;) {
    const atom = pick(r, ATOMS);
    const [a, b] = shuffle(r, [...atom.levels]).slice(0, 2);
    const [lo, hi] = val(a) < val(b) ? [a, b] : [b, a];
    const emits = r() < 0.6; // dropping gives a photon out; jumping up takes one in
    const askWavelength = r() < 0.4;
    const eV = Math.round((val(hi) - val(lo)) * 100) / 100;
    const J = eV * EV;
    const Js = shownValue(J);
    const f = Js / H;
    const lambda = (H * C) / Js;
    const [start, finish] = emits ? [hi, lo] : [lo, hi];
    const steps: Step[] = [
      { type: 'number', prompt: 'How much energy does the photon carry, in eV?', answer: D(String(eV)), exact: eV, tolerance: 0.005, unit: 'eV', feedback: (g) => (near(g, -(val(hi) + val(lo))) || near(g, val(hi) + val(lo)) ? 'That adds the levels. The photon carries the difference between them.' : 'Take the lower level from the higher one.') },
      { type: 'number', prompt: 'And in joules? Give 3 significant figures.', ...approxStd(J), unit: 'J', tolerance: 0.005, feedback: (g) => (near(g, eV / EV) ? 'That divides. Multiply by 1.60 × 10^{−19} to get joules.' : 'Multiply the energy in eV by 1.60 × 10^{−19}.') },
    ];
    if (askWavelength)
      steps.push({ type: 'number', prompt: 'So what is the photon’s wavelength, λ = hc ÷ E? Give 3 significant figures.', ...approxStd(lambda), unit: 'm', tolerance: 0.008, feedback: (g) => (near(g, Js / (H * C)) ? 'That is upside down. λ = hc ÷ E.' : 'Multiply h by c, then divide by the energy in joules.') });
    else steps.push({ type: 'number', prompt: 'So what is the photon’s frequency, f = E ÷ h? Give 3 significant figures.', ...approxStd(f), unit: 'Hz', tolerance: 0.008, feedback: (g) => (near(g, Js * H) ? 'That multiplies. f = E ÷ h.' : 'Divide the energy in joules by the Planck constant.') });
    return {
      round: 'levels',
      prompt: `An electron in ${atom.name} ${emits ? 'drops' : 'jumps up'} from the energy level at ${start} eV to the one at ${finish} eV, ${emits ? 'giving out' : 'taking in'} a photon. What is the photon’s ${askWavelength ? 'wavelength' : 'frequency'}? (h = 6.63 × 10^{−34} J s, ${askWavelength ? 'c = 3.00 × 10^{8} m/s, ' : ''}1 eV = 1.60 × 10^{−19} J)`,
      steps,
      workings: [
        `The difference: ${hi} − (${lo}) = ${eV} eV.`,
        `${eV} × 1.60 × 10^{−19} = ${std(J)} J.`,
        askWavelength ? `λ = hc ÷ E = ${std(lambda)} m.` : `f = ${std(J)} ÷ (6.63 × 10^{−34}) = ${std(f)} Hz.`,
      ],
      check: { kind: 'levels', from: val(start), to: val(finish), eV, J, f },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// De Broglie wavelength
// ---------------------------------------------------------------------------------------------

function debroglieQuestion(r: () => number): Question {
  for (;;) {
    // 1.0 × 10^5 to 9.9 × 10^6 m/s: the speeds of electrons in a diffraction tube and below.
    const v = ((10 + Math.floor(r() * 90)) / 10) * (r() < 0.5 ? 1e5 : 1e6);
    const p = ME * v;
    if (Math.abs(p - 1e-24) < 0.02e-24) continue; // the page's 1.0 × 10^{−24} kg m/s
    const ps = shownValue(p);
    const lambda = H / ps;
    // A slower electron, a faster one, or a heavier proton at the same speed, so the answer is not always the same.
    const [what, right, reason] = pick(r, [
      ['A faster electron', 'Shorter', 'faster means more momentum'],
      ['A slower electron', 'Longer', 'slower means less momentum'],
      ['A proton (about 1,800 times heavier) at the same speed', 'Shorter', 'more mass at the same speed means more momentum'],
    ] as const);
    const options = shuffle(r, ['Shorter', 'Longer', 'The same']);
    const correct = options.indexOf(right);
    return {
      round: 'debroglie',
      prompt: `An electron (mass 9.11 × 10^{−31} kg) moves at ${std(v)} m/s. What is its de Broglie wavelength? (h = 6.63 × 10^{−34} J s)`,
      steps: [
        { type: 'number', prompt: 'What is its momentum, p = mv? Give 3 significant figures.', ...approxStd(p), unit: 'kg m/s', tolerance: 0.005, feedback: (g) => (near(g, ME / v) ? 'That divides. p = m × v.' : 'Multiply the mass by the speed.') },
        { type: 'number', prompt: 'So what is its wavelength, λ = h ÷ p? Give 3 significant figures.', ...approxStd(lambda), unit: 'm', tolerance: 0.008, feedback: (g) => (near(g, ps / H) ? 'That is upside down. λ = h ÷ p.' : near(g, H / v) ? 'That divides by the speed. Use the momentum, mass × speed.' : 'Divide the Planck constant by the momentum.') },
        { type: 'choice', prompt: `${what} would have a de Broglie wavelength that is…`, options, correct, why: whyAll(options, correct, () => 'λ = h ÷ p. How does its momentum compare?') },
      ],
      workings: [`p = 9.11 × 10^{−31} × ${std(v)} = ${std(p)} kg m/s.`, `λ = 6.63 × 10^{−34} ÷ (${std(p)}) = ${std(lambda)} m.`, `${right}: ${reason}, and λ = h ÷ p.`],
      check: { kind: 'debroglie', v, p, lambda, choice: right },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'photoelectric') return photoelectricQuestion(r);
  if (round === 'levels') return levelsQuestion(r);
  if (round === 'debroglie') return debroglieQuestion(r);
  return photonQuestion(r);
}

export const quantumQuiz: LessonQuiz<QuantumCheck> = {
  lesson: 'quantum',
  storageKey: 'stella-quiz-quantum-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};

