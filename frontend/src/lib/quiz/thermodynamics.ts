/**
 * Quiz for "Thermodynamics and the Ideal Gas Law" (KAN-98): constant temperature, temperature and pressure
 * (always in kelvin), pV = nRT, and the average kinetic energy of molecules. GCSE to A-level; calculator answers
 * to 3 significant figures, every one worked from the values shown.
 */
import { D, approx, approxStd, fmt, pick, shuffle, toNumber, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';
import type { Digits } from '@/lib/measures';

export type Round = 'boyle' | 'kelvin' | 'ideal' | 'energy';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  boyle: { label: 'Constant temperature', blurb: 'pV stays the same: squeeze a gas and its pressure rises.' },
  kelvin: { label: 'Temperature and pressure', blurb: 'In a fixed volume p is proportional to T, in kelvin. Give 3 significant figures.' },
  ideal: { label: 'The ideal gas equation', blurb: 'pV = nRT, with R = 8.31 J mol⁻¹ K⁻¹, T in kelvin and V in m³.' },
  energy: { label: 'Molecules’ energy', blurb: 'Average kinetic energy = ³⁄₂kT, with k = 1.38 × 10⁻²³ J K⁻¹.' },
};

export type ThermoCheck =
  | { kind: 'boyle'; p1: number; V1: number; p2: number; V2: number; find: 'p' | 'V' }
  | { kind: 'kelvin'; law: 'pressure' | 'volume'; x1: number; c1: number; c2: number; x2: number }
  | { kind: 'ideal'; find: 'p' | 'V' | 'n' | 'T'; p: number; V: number; n: number; T: number }
  | { kind: 'energy'; c1: number; c2?: number; E: number };
type Question = Q<ThermoCheck>;

const R = 8.31;
const K = 1.38e-23;
const near = (g: Digits, x: number, rel = 0.01) => Math.abs(toNumber(g) - x) <= rel * Math.abs(x);
const num = (x: number) => fmt(D(String(parseFloat(x.toPrecision(10)))));
/** A temperature in °C with a proper minus sign: −20, not -20. */
const degC = (c: number) => (c < 0 ? `−${-c}` : String(c));
/** An exact value shown as it is, or 3 s.f. with the exact value for marking. */
function exactOr3(x: number) {
  const clean = parseFloat(x.toPrecision(10));
  const d = D(String(clean));
  // Exact answers keep `exact` too, so a pupil who rounded along the way (372 for 373) gets the same tolerance.
  return d.digits.length <= 3 && Math.abs(clean - x) < 1e-9 * Math.max(1, Math.abs(x)) ? { answer: d, shown: fmt(d), exact: clean } : approx(x);
}
const kelvinStep = (c: number, which: string): Step => ({
  type: 'number',
  prompt: `What is ${which}${degC(c)} °C in kelvin?`,
  answer: D(c + 273),
  unit: 'K',
  feedback: (g) => (near(g, c, 1e-9) ? 'That is still in °C. Add 273.' : near(g, c - 273, 1e-9) ? 'That takes 273 away. Add it: K = °C + 273.' : 'Add 273 to the temperature in °C.'),
});

// ---------------------------------------------------------------------------------------------
// Constant temperature
// ---------------------------------------------------------------------------------------------

const BOYLE: { what: string; unitP: string; unitV: string; p: number[]; V: number[]; ratios: number[] }[] = [
  { what: 'The air in a sealed syringe', unitP: 'kPa', unitV: 'cm³', p: [100, 120, 150], V: [20, 30, 40, 50, 60], ratios: [0.5, 0.4, 0.25, 0.8, 0.6] },
  // A diver's bubble rises and grows as the water pressure falls.
  { what: 'A bubble of air breathed out by a diver', unitP: 'kPa', unitV: 'cm³', p: [200, 300, 400, 500], V: [2, 3, 4, 5, 6], ratios: [1.25, 1.5, 2, 2.5, 4] },
  { what: 'The air in a bicycle pump', unitP: 'kPa', unitV: 'cm³', p: [100], V: [120, 150, 200, 250], ratios: [0.5, 0.4, 0.25, 0.8] },
  { what: 'A weather balloon’s gas', unitP: 'kPa', unitV: 'm³', p: [100], V: [4, 5, 6, 8, 10], ratios: [2, 2.5, 4, 5] },
];

function boyleQuestion(r: () => number): Question {
  for (;;) {
    const b = pick(r, BOYLE);
    const p1 = pick(r, b.p);
    const V1 = pick(r, b.V);
    const ratio = pick(r, b.ratios); // V₂ = ratio × V₁
    const V2 = parseFloat((V1 * ratio).toPrecision(10));
    const p2 = parseFloat(((p1 * V1) / V2).toPrecision(10));
    if (V1 === 4 && p1 === 200) continue; // the page's 4 litres at 200 kPa
    if (b.what.includes('diver') && p2 < 100) continue; // under water the pressure is never below the air's
    if (!Number.isInteger(p2 * 100) || !Number.isInteger(V2 * 100)) continue;
    const find: 'p' | 'V' = r() < 0.6 ? 'p' : 'V';
    const up = find === 'p' ? p2 > p1 : V2 > V1;
    const options = shuffle(r, ['It goes up', 'It goes down']);
    const correct = options.indexOf(up ? 'It goes up' : 'It goes down');
    const product = p1 * V1;
    const ans = find === 'p' ? p2 : V2;
    const wrongWay = find === 'p' ? (p1 * V2) / V1 : (V1 * p2) / p1;
    // Neutral wording, so the up-or-down step has to be reasoned from pV, not read from a verb like "squeezed".
    const diver = b.what.includes('diver');
    const change = find === 'p' ? `its volume changes${diver ? ' as it rises' : ''} to ${num(V2)} ${b.unitV}` : `its pressure changes${diver ? ' as it rises' : ''} to ${num(p2)} ${b.unitP}`;
    const ansShown = exactOr3(ans);
    return {
      round: 'boyle',
      prompt: `${b.what} has a volume of ${num(V1)} ${b.unitV} at ${num(p1)} ${b.unitP}. At a steady temperature ${change}. What is its new ${find === 'p' ? 'pressure' : 'volume'}?`,
      steps: [
        { type: 'choice', prompt: `Does the ${find === 'p' ? 'pressure' : 'volume'} go up or down?`, options, correct, why: { [1 - correct]: 'At a steady temperature, pV stays the same: when one goes down, the other goes up.' } },
        { type: 'number', prompt: `What is p₁V₁, in ${b.unitP} × ${b.unitV}?`, answer: D(String(product)), feedback: () => 'Multiply the starting pressure by the starting volume.' },
        {
          type: 'number',
          prompt: `So what is the new ${find === 'p' ? 'pressure' : 'volume'}?`,
          ...ansShown,
          unit: find === 'p' ? b.unitP : b.unitV,
          feedback: (g) => (Math.abs(wrongWay - ans) > 0.01 * ans && near(g, wrongWay) ? 'That multiplies by the ratio the wrong way. pV stays the same, so divide p₁V₁ by the new value.' : `Divide p₁V₁ by the new ${find === 'p' ? 'volume' : 'pressure'}.`),
        },
      ],
      workings: [`p₁V₁ = ${num(p1)} × ${num(V1)} = ${num(product)}.`, `The new ${find === 'p' ? 'pressure' : 'volume'} is ${num(product)} ÷ ${num(find === 'p' ? V2 : p2)} = ${ansShown.shown} ${find === 'p' ? b.unitP : b.unitV}.`],
      check: { kind: 'boyle', p1, V1, p2, V2, find },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Temperature and pressure (in kelvin)
// ---------------------------------------------------------------------------------------------

const HEATED: { law: 'pressure' | 'volume'; what: string; unit: string; x: number[]; c1: number[]; c2: number[] }[] = [
  // Aerosol cans warn against going above 50 °C; tyre figures are the total pressure inside, not a gauge reading.
  { law: 'pressure', what: 'An aerosol can', unit: 'kPa', x: [200, 250, 300, 350], c1: [15, 20, 25], c2: [35, 40, 45, 50] },
  { law: 'pressure', what: 'A car tyre (total pressure inside)', unit: 'kPa', x: [320, 340, 350, 400], c1: [5, 10, 15], c2: [30, 35, 40, 45] },
  { law: 'pressure', what: 'A sealed gas cylinder', unit: 'kPa', x: [800, 1000, 1200, 1500], c1: [10, 15, 20], c2: [-20, -10, 35, 50] },
  { law: 'volume', what: 'A balloon', unit: 'litres', x: [2, 2.5, 3, 4, 5], c1: [15, 20, 25], c2: [-15, -5, 40, 60] },
  { law: 'volume', what: 'The gas under a free-moving piston', unit: 'cm³', x: [200, 250, 300, 400], c1: [20, 25, 27], c2: [77, 100, 127, 200] },
];

function kelvinQuestion(r: () => number): Question {
  for (;;) {
    const h = pick(r, HEATED);
    const x1 = pick(r, h.x);
    const c1 = pick(r, h.c1);
    const c2 = pick(r, h.c2);
    if (c1 === c2) continue;
    const [T1, T2] = [c1 + 273, c2 + 273];
    const x2 = (x1 * T2) / T1;
    const inC = (x1 * c2) / c1; // the slip: working in °C
    const upside = (x1 * T1) / T2;
    const a = exactOr3(x2);
    // Slips must be well clear of the answer, which allows 1% for rounding along the way.
    if (Math.abs(inC - x2) < 0.04 * x2 || Math.abs(upside - x2) < 0.04 * x2) continue;
    const q = h.law === 'pressure' ? 'pressure' : 'volume';
    return {
      round: 'kelvin',
      prompt: `${h.what} ${h.law === 'pressure' ? 'holds gas at a pressure of' : 'has a volume of'} ${num(x1)} ${h.unit} at ${degC(c1)} °C. ${h.law === 'pressure' ? 'Its volume stays the same' : 'The pressure stays the same'}, and the temperature changes to ${degC(c2)} °C. What is the new ${q}?`,
      steps: [
        kelvinStep(c1, ''),
        kelvinStep(c2, ''),
        {
          type: 'number',
          prompt: `So what is the new ${q}? Give 3 significant figures.`,
          ...a,
          unit: h.unit,
          tolerance: 0.01, // T₂ ÷ T₁ rounded to 3 s.f. first moves the answer by up to about 0.6%
          feedback: (g) =>
            near(g, inC) ? 'That works in °C. The rule only works in kelvin, which starts at absolute zero.' : near(g, upside) ? `That is upside down. The ${q} goes ${T2 > T1 ? 'up' : 'down'} with the temperature: multiply by T₂ ÷ T₁.` : `Multiply the ${q} by T₂ ÷ T₁, in kelvin.`,
        },
      ],
      workings: [`T₁ = ${degC(c1)} + 273 = ${T1} K, and T₂ = ${degC(c2)} + 273 = ${T2} K.`, `The new ${q} is ${num(x1)} × ${T2} ÷ ${T1} = ${a.shown} ${h.unit}.`],
      check: { kind: 'kelvin', law: h.law, x1, c1, c2, x2 },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// The ideal gas equation
// ---------------------------------------------------------------------------------------------

const FORMS = { p: 'p = nRT ÷ V', V: 'V = nRT ÷ p', n: 'n = pV ÷ RT', T: 'T = pV ÷ nR' } as const;
const UPSIDE = { p: 'p = V ÷ nRT', V: 'V = p ÷ nRT', n: 'n = RT ÷ pV', T: 'T = nR ÷ pV' } as const;
/** A third wrong form with the same letter on the left, so the letter alone never rules it out. */
const MUDDLED = { p: 'p = nR ÷ VT', V: 'V = nR ÷ pT', n: 'n = pT ÷ RV', T: 'T = pR ÷ nV' } as const;

function idealQuestion(r: () => number): Question {
  for (;;) {
    const find = pick(r, ['p', 'p', 'V', 'n', 'T'] as const);
    const n = pick(r, [0.5, 1.5, 2, 2.5, 3, 4, 5]);
    const c = pick(r, [-20, 0, 15, 20, 27, 37, 50, 100, 127]);
    const T = c + 273;
    // The volume as given: litres (÷ 1,000 for m³) or m³.
    // The volume as given: litres, cm³ or m³.
    const vu = pick(r, ['litres', 'litres', 'cm³', 'm³'] as const);
    const Vgiven = vu === 'litres' ? pick(r, [5, 10, 20, 24, 25, 40, 50]) : vu === 'cm³' ? pick(r, [500, 750, 1000, 2000, 2500]) : pick(r, [0.05, 0.08, 0.2, 0.25, 0.5]);
    const V = vu === 'litres' ? Vgiven / 1000 : vu === 'cm³' ? Vgiven / 1e6 : Vgiven;
    const litres = vu !== 'm³';
    const p = (n * R * T) / V;
    if (p < 5e4 || p > 2e6) continue; // between half and twenty times air pressure
    if (n === 1 && T === 300 && V === 0.025) continue; // the page's practice question
    if (n === 2 && T === 400 && V === 0.1) continue; // the worked example
    const pShown = approxStd(p);
    const pUsed = toNumber(pShown.answer); // the pressure as the question shows it, when it is given
    const ans = find === 'p' ? p : find === 'V' ? (n * R * T) / pUsed : find === 'n' ? (pUsed * V) / (R * T) : (pUsed * V) / (n * R);
    const out = find === 'p' || find === 'V' ? approxStd(ans) : approx(ans);
    const options = shuffle(r, [FORMS[find], UPSIDE[find], MUDDLED[find]]);
    const correct = options.indexOf(FORMS[find]);
    const steps: Step[] = [];
    const cGiven = find !== 'T';
    if (cGiven) steps.push(kelvinStep(c, ''));
    const vGiven = find !== 'V' && litres;
    if (vGiven)
      steps.push({
        type: 'number',
        prompt: `What is ${num(Vgiven)} ${vu} in m³?`,
        answer: D(String(parseFloat(V.toPrecision(10)))),
        unit: 'm³',
        feedback: (g) => (near(g, Vgiven, 1e-9) ? `That is still in ${vu}. There are ${vu === 'litres' ? '1,000 litres' : '1,000,000 cm³'} in 1 m³.` : vu === 'litres' ? 'Divide by 1,000: 1 m³ is 1,000 litres.' : 'Divide by 1,000,000: 1 m³ is 100 × 100 × 100 cm³.'),
      });
    steps.push({ type: 'choice', prompt: `Rearrange pV = nRT. Which form finds ${find === 'p' ? 'the pressure' : find === 'V' ? 'the volume' : find === 'n' ? 'the amount of gas' : 'the temperature'}?`, options, correct, why: whyAll(options, correct, (o) => (o === UPSIDE[find] ? 'That is upside down.' : 'Divide both sides of pV = nRT by everything except the quantity you want.')) });
    const unit = find === 'p' ? 'Pa' : find === 'V' ? 'm³' : find === 'n' ? 'mol' : 'K';
    const inC = find === 'p' ? (n * R * c) / V : find === 'V' ? (n * R * c) / pUsed : find === 'n' ? (pUsed * V) / (R * c) : null;
    const inLitres = find === 'p' && litres ? (n * R * T) / Vgiven : find === 'n' && litres ? (pUsed * Vgiven) / (R * T) : find === 'T' && litres ? (pUsed * Vgiven) / (n * R) : null;
    steps.push({
      type: 'number',
      prompt: `So what is ${find === 'p' ? 'the pressure' : find === 'V' ? 'the volume' : find === 'n' ? 'the amount of gas' : 'the temperature'}? Give 3 significant figures.`,
      ...out,
      unit,
      ...(find === 'p' ? { prefixes: true } : {}),
      tolerance: 0.01, // pV or nRT rounded to 3 s.f. first moves the answer by up to about 0.6%
      feedback: (g) =>
        inC !== null && c !== 0 && near(g, inC) ? 'That uses the temperature in °C. Use kelvin.' : inLitres !== null && near(g, inLitres) ? `That uses the volume in ${vu}. Change it to m³ first.` : `Put the values into ${FORMS[find]}, in Pa, m³, mol and K.`,
    });
    // A glass flask only near air pressure; steel tanks and cylinders for higher pressures.
    const what = p < 1.5e5 && V < 0.01 ? pick(r, ['A sealed flask', 'A storage bottle', 'A sealed tank']) : pick(r, ['A sealed tank', 'A gas cylinder', 'A steel storage bottle']);
    const Vtext = `${num(Vgiven)} ${vu}`;
    const prompt =
      find === 'p'
        ? `${what} holds ${num(n)} mol of gas at ${degC(c)} °C in a volume of ${Vtext}. What is the pressure? (R = 8.31 J mol⁻¹ K⁻¹)`
        : find === 'V'
          ? `${num(n)} mol of gas at ${degC(c)} °C has a pressure of ${pShown.shown} Pa. What volume does it take up? (R = 8.31 J mol⁻¹ K⁻¹)`
          : find === 'n'
            ? `${what} has a volume of ${Vtext} and holds gas at ${pShown.shown} Pa and ${degC(c)} °C. How many moles of gas are in it? (R = 8.31 J mol⁻¹ K⁻¹)`
            : `${what} holds ${num(n)} mol of gas in ${Vtext} at a pressure of ${pShown.shown} Pa. What is its temperature, in kelvin? (R = 8.31 J mol⁻¹ K⁻¹)`;
    return {
      round: 'ideal',
      prompt,
      steps,
      workings: [
        ...(cGiven ? [`T = ${degC(c)} + 273 = ${T} K.`] : []),
        ...(vGiven ? [`V = ${num(Vgiven)} ÷ ${vu === 'litres' ? '1,000' : '1,000,000'} = ${num(V)} m³.`] : []),
        `${FORMS[find]} gives ${out.shown} ${unit}.`,
      ],
      check: { kind: 'ideal', find, p: find === 'p' ? p : pUsed, V, n, T },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Molecules' energy
// ---------------------------------------------------------------------------------------------

function energyQuestion(r: () => number): Question {
  for (;;) {
    const c1 = pick(r, [-73, -23, 0, 7, 20, 37, 77, 127, 227, 327, 527]);
    const T1 = c1 + 273;
    if (T1 === 300) continue; // the notes' 300 K example
    // Using °C (1.5 × c) and leaving out the ³⁄₂ (T) must give clearly different numbers: not at 527 °C.
    const oneTemp = r() < 0.5;
    if (oneTemp && Math.abs(1.5 * c1 - T1) < 0.03 * T1) continue;
    if (oneTemp) {
      const E = 1.5 * K * T1;
      const a = approxStd(E);
      return {
        round: 'energy',
        prompt: `A gas is at ${degC(c1)} °C. What is the average kinetic energy of one of its molecules? (k = 1.38 × 10^{−23} J K^{−1})`,
        steps: [
          kelvinStep(c1, ''),
          {
            type: 'number',
            prompt: 'So what is the average kinetic energy, ³⁄₂kT? Give 3 significant figures.',
            ...a,
            unit: 'J',
            tolerance: 0.005,
            feedback: (g) => (c1 !== 0 && near(g, 1.5 * K * c1) ? 'That uses °C. Use kelvin.' : near(g, K * T1) ? 'That leaves out the ³⁄₂.' : 'Multiply 1.5 by k and by T in kelvin.'),
          },
        ],
        workings: [`T = ${degC(c1)} + 273 = ${T1} K.`, `³⁄₂kT = 1.5 × 1.38 × 10^{−23} × ${T1} = ${a.shown} J.`],
        check: { kind: 'energy', c1, E },
      };
    }
    const c2 = pick(r, [-73, -23, 0, 7, 20, 37, 77, 127, 227, 327, 527, 727]);
    const T2 = c2 + 273;
    if (c2 === c1 || T2 === 600 || (T1 === 300 && T2 === 600)) continue;
    const E1 = approxStd(1.5 * K * T1);
    const E1n = toNumber(E1.answer);
    const factor = T2 / T1;
    const f = exactOr3(factor);
    const E2 = E1n * factor;
    const a = approxStd(E2);
    const cFactor = c1 !== 0 ? c2 / c1 : null;
    return {
      round: 'energy',
      prompt: `The molecules of a gas at ${degC(c1)} °C have an average kinetic energy of ${E1.shown} J. The gas is ${T2 > T1 ? 'heated' : 'cooled'} to ${degC(c2)} °C. What is their average kinetic energy now?`,
      steps: [
        kelvinStep(c1, ''),
        kelvinStep(c2, ''),
        { type: 'number', prompt: 'By what factor does the temperature in kelvin change? Give 3 significant figures.', ...f, tolerance: 0.005, feedback: (g) => (cFactor !== null && near(g, cFactor) ? 'That divides the temperatures in °C. Use kelvin.' : near(g, T1 / T2) ? 'That is upside down: new ÷ old.' : 'Divide the new temperature by the old one, in kelvin.') },
        { type: 'number', prompt: 'So what is the new average kinetic energy? Give 3 significant figures.', ...a, unit: 'J', tolerance: 0.006, feedback: (g) => (cFactor !== null && near(g, E1n * cFactor) ? 'That scales by the change in °C. The energy is proportional to the temperature in kelvin.' : 'Multiply the old energy by the factor.') },
      ],
      workings: [`T₁ = ${T1} K and T₂ = ${T2} K, so the factor is ${T2} ÷ ${T1} = ${f.shown}.`, `${E1.shown} × ${T2} ÷ ${T1} = ${a.shown} J.`],
      check: { kind: 'energy', c1, c2, E: E2 },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'kelvin') return kelvinQuestion(r);
  if (round === 'ideal') return idealQuestion(r);
  if (round === 'energy') return energyQuestion(r);
  return boyleQuestion(r);
}

export const thermodynamicsQuiz: LessonQuiz<ThermoCheck> = {
  lesson: 'thermodynamics',
  storageKey: 'stella-quiz-thermodynamics-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};

