/**
 * Quiz for "Ohm's Law: Voltage, Current and Resistance" (KAN-91): V = IR, series and parallel circuits, charge
 * and power. Key stage 3 to GCSE. Calculators are allowed, but the numbers are chosen so every answer is exact.
 */
import { bottom, shift, type Digits } from '@/lib/measures';
import { D, add, fmt, int, multiply, pick, same, shuffle, toNumber, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';

export type Round = 'ohm' | 'series' | 'parallel' | 'charge';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  ohm: { label: 'V = IR', blurb: 'Choose the right form of V = IR, change mA and kΩ first, then work it out.' },
  series: { label: 'Series', blurb: 'One loop: the resistances add and the potential difference is shared.' },
  parallel: { label: 'Parallel', blurb: 'Each branch has the full potential difference, and the branch currents add.' },
  charge: { label: 'Charge and power', blurb: 'Q = It with the time in seconds, and P = VI or P = I²R.' },
};

export type CircuitCheck =
  | { kind: 'ohm'; find: 'I' | 'V' | 'R'; V: string; I: string; R: string }
  | { kind: 'series'; V: string; R1: string; R2: string; I: string; asked: string; V2: string }
  | { kind: 'parallel'; V: string; R1: string; R2: string; I1: string; I2: string; I: string }
  | { kind: 'charge'; I: string; seconds: string; Q: string }
  | { kind: 'power'; V?: string; I: string; R?: string; P: string };
type Question = Q<CircuitCheck>;

/** a ÷ b exactly, to at most 6 decimal places and 3 significant figures; null otherwise. */
function div(a: Digits, b: Digits): Digits | null {
  if (b.digits === '0') return null;
  const A = BigInt(a.digits) * 10n ** 12n;
  const B = BigInt(b.digits);
  if (A % B !== 0n) return null;
  const q = (A / B).toString();
  const trimmed = q.replace(/0+$/, '') || '0';
  if (trimmed === '0') return D('0');
  const out = { digits: trimmed, top: bottom(a) - 12 - bottom(b) + q.length - 1 };
  return bottom(out) < -6 || out.digits.length > 3 ? null : out;
}
const plain = (d: Digits) => fmt(d).replace(/,/g, '');
/** A typed slip, recognised within 0.5% so a pupil who rounded it (0.0021 for 0.002128) still gets the named feedback. */
const near = (g: Digits, x: number | null) => x !== null && Math.abs(toNumber(g) - x) <= 0.005 * Math.abs(x);
/** 4,700 Ω as "4.7 kΩ" when the question gives it that way. */
const ohms = (r: Digits, kilo: boolean) => (kilo ? `${fmt(shift(r, -3))} kΩ` : `${fmt(r)} Ω`);
const mA = (i: Digits) => `${fmt(shift(i, 3))} mA`;

/** Shown on the page: the worked example, the notes example and the practice questions. The quiz never asks these. */
const SHOWN = new Set(['I 12 150', 'R 12 0.08', 'I 5 100', 'R 10 0.02', 'series 6 100 200', 'series 12 4 8', 'charge 2 30']);

const RESISTORS = [10, 12, 15, 20, 22, 25, 33, 40, 47, 50, 60, 68, 75, 100, 120, 150, 200, 220, 250, 300, 330, 400, 470, 500, 600, 680, 750, 1000, 1200, 1500, 2000, 2200, 2500, 3000, 4700, 5000].map(D);
const SUPPLIES = ['1.5', '3', '4.5', '6', '9', '12', '24'].map(D);

// ---------------------------------------------------------------------------------------------
// V = IR
// ---------------------------------------------------------------------------------------------

const EQUATIONS = { V: 'V = I × R', I: 'I = V ÷ R', R: 'R = V ÷ I' } as const;
const WRONG_EQUATIONS = ['I = V × R', 'R = I ÷ V', 'V = I ÷ R'];

/** Real circuits for V = IR: what is asked, the wording, and realistic values (resistances in Ω, currents in A). */
type OhmContext = { find: 'I' | 'V' | 'R'; text: string; R?: string[]; V?: string[]; I?: string[] };
const MILLI = (xs: string[]) => xs.map((x) => plain(shift(D(x), -3)));
const OHM_CONTEXTS: OhmContext[] = [
  { find: 'I', text: 'A {R} resistor in a sensor circuit is connected to a {V} V supply. Find the current through it.', R: ['470', '680', '1000', '1200', '1500', '2000', '2200', '2500', '3000', '4700', '5000'], V: ['3', '4.5', '5', '6', '9', '12'] },
  { find: 'I', text: 'A heater with a resistance of {R} is connected to a {V} V supply. Find the current through it.', R: ['6', '8', '12', '14', '16', '24', '28', '48'], V: ['12', '24', '28'] },
  { find: 'I', text: 'A car headlamp has a resistance of {R} when it is lit, on a 12 V battery. Find the current through it.', R: ['2.4', '2.5', '3', '4'], V: ['12'] },
  { find: 'V', text: 'A current of {I} flows through a {R} resistor in a radio. Find the potential difference across it.', R: ['100', '150', '220', '330', '470', '680', '1000', '1500', '2200', '4700'], I: MILLI(['1', '2', '2.5', '4', '5', '8', '10', '12', '15', '20']) },
  { find: 'V', text: 'A current of {I} flows through a heater with a resistance of {R}. Find the potential difference across it.', R: ['4', '5', '6', '8', '10', '12'], I: ['1.5', '2', '2.5', '3', '4'] },
  { find: 'R', text: 'The resistor that protects an LED has {V} V across it when a current of {I} flows. Find its resistance.', V: ['2', '3', '4', '4.5', '7'], I: MILLI(['10', '15', '20', '25', '30']) },
  { find: 'R', text: 'A lamp takes a current of {I} from a {V} V supply. Find its resistance.', V: ['6', '12', '24'], I: ['0.5', '1', '1.5', '2', '2.5', '3', '4', '5'] },
];

function ohmQuestion(r: () => number): Question {
  for (;;) {
    const ctx = pick(r, OHM_CONTEXTS);
    const find = ctx.find;
    let V: Digits;
    let I: Digits | null;
    let R: Digits | null;
    if (find === 'I') {
      R = D(pick(r, ctx.R!));
      V = D(pick(r, ctx.V!));
      I = div(V, R);
    } else if (find === 'V') {
      R = D(pick(r, ctx.R!));
      I = D(pick(r, ctx.I!));
      V = multiply(I, R);
    } else {
      V = D(pick(r, ctx.V!));
      I = D(pick(r, ctx.I!));
      R = div(V, I);
    }
    if (!I || !R || V.digits.length > 3) continue;
    if (SHOWN.has(`${find} ${plain(V)} ${find === 'R' ? plain(I) : plain(R)}`)) continue;
    const R0 = R;
    const I0 = I;
    const kilo = find !== 'R' && toNumber(R0) >= 1000 && r() < 0.6; // the resistance given in kΩ
    const milli = find !== 'I' && toNumber(I0) < 0.1; // a small current is given in mA, as in the lesson
    const right = EQUATIONS[find];
    // The wrong forms for this quantity first (I = V × R, R = I ÷ V), then one other.
    const options = shuffle(r, [right, ...WRONG_EQUATIONS.filter((w) => w[0] === find), ...shuffle(r, WRONG_EQUATIONS.filter((w) => w[0] !== find))].slice(0, 3));
    const correct = options.indexOf(right);
    const steps: Step[] = [
      {
        type: 'choice',
        prompt: `Which form of V = IR finds ${find === 'I' ? 'the current' : find === 'V' ? 'the potential difference' : 'the resistance'}?`,
        options,
        correct,
        why: whyAll(options, correct, (o) => (o === 'R = I ÷ V' ? 'That is upside down. Resistance is potential difference divided by current.' : o === 'I = V × R' ? 'More resistance means less current, so divide by R.' : 'Rearrange V = IR so the quantity you want is on its own.')),
      },
    ];
    if (kilo) steps.push({ type: 'number', prompt: `First change ${ohms(R0, true)} into ohms.`, answer: R0, unit: 'Ω', feedback: (g) => (same(g, shift(R0, -3)) ? 'Kilo means 1,000: the number gets bigger.' : 'Kilo means a thousand.') });
    if (milli) steps.push({ type: 'number', prompt: `First change ${mA(I0)} into amperes.`, answer: I0, unit: 'A', feedback: (g) => (same(g, shift(I0, 3)) ? 'Milli means a thousandth: the number gets smaller.' : 'Milli means a thousandth: divide by 1,000.') });
    const answer = find === 'I' ? I0 : find === 'V' ? V : R0;
    const unit = find === 'I' ? 'A' : find === 'V' ? 'V' : 'Ω';
    // The slips, in the units the answer is asked in.
    const [v, i, rr] = [toNumber(V), toNumber(I0), toNumber(R0)];
    const timesSlip = find === 'I' ? v * rr : null;
    const upsideDown = find === 'R' ? i / v : null;
    // A value left in mA or kΩ, worked through the rest of the sum as if it were in A or Ω.
    const inMA = milli ? (find === 'V' ? i * 1000 * rr : v / (i * 1000)) : null;
    const inKOhm = kilo ? (find === 'I' ? v / (rr / 1000) : i * (rr / 1000)) : null;
    steps.push({
      type: 'number',
      prompt: `So what is ${find === 'I' ? 'the current in amperes' : find === 'V' ? 'the potential difference' : 'the resistance in ohms'}?`,
      answer,
      unit,
      prefixes: true,
      feedback: (g) =>
        near(g, timesSlip)
          ? 'That multiplies. More resistance means less current: I = V ÷ R.'
          : near(g, upsideDown)
            ? 'That divides the wrong way round: R = V ÷ I.'
            : near(g, inMA)
              ? 'That uses the current in mA. Change it to amperes first.'
              : near(g, inKOhm)
                ? 'That uses the resistance in kΩ. Change it to ohms first.'
                : `Put the numbers into ${right}, in volts, amperes and ohms.`,
    });
    if (find === 'I' && i < 0.1) steps.push({ type: 'number', prompt: 'And what is that in milliamperes?', answer: shift(I0, 3), unit: 'mA', feedback: () => 'A milliampere is a thousandth of an ampere, so there are more of them: multiply by 1,000.' });
    const prompt = ctx.text
      .replace('{R}', ohms(R0, kilo))
      .replace('{V}', fmt(V))
      .replace('{I}', milli ? mA(I0) : `${fmt(I0)} A`);
    return {
      round: 'ohm',
      prompt,
      steps,
      workings: [
        `Use ${right}.`,
        `${find === 'I' ? `I = ${fmt(V)} ÷ ${fmt(R0)}` : find === 'V' ? `V = ${fmt(I0)} × ${fmt(R0)}` : `R = ${fmt(V)} ÷ ${fmt(I0)}`} = ${fmt(answer)} ${unit}${find === 'I' && i < 0.1 ? `, which is ${mA(I0)}` : ''}.`,
      ],
      check: { kind: 'ohm', find, V: plain(V), I: plain(I0), R: plain(R0) },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Series
// ---------------------------------------------------------------------------------------------

function seriesQuestion(r: () => number): Question {
  for (;;) {
    const R1 = pick(r, RESISTORS);
    const R2 = pick(r, RESISTORS);
    if (same(R1, R2) || toNumber(R2) / toNumber(R1) > 20 || toNumber(R1) / toNumber(R2) > 20) continue;
    const V = pick(r, SUPPLIES);
    const Rt = add(R1, R2);
    const I = div(V, Rt);
    if (!I) continue;
    // Low enough power for ordinary resistors (at most 3 W in all).
    if (toNumber(V) * toNumber(I) > 3) continue;
    const Rx = r() < 0.5 ? R1 : R2; // the resistor asked about
    const V2 = multiply(I, Rx);
    if (V2.digits.length > 3 || SHOWN.has(`series ${plain(V)} ${plain(R1)} ${plain(R2)}`) || SHOWN.has(`series ${plain(V)} ${plain(R2)} ${plain(R1)}`)) continue;
    const product = toNumber(R1) * toNumber(R2);
    const oneOnly = toNumber(V) / toNumber(R1);
    return {
      round: 'series',
      prompt: `A ${fmt(R1)} Ω resistor and a ${fmt(R2)} Ω resistor are connected in series to a ${fmt(V)} V battery. Find the potential difference across the ${fmt(Rx)} Ω resistor.`,
      steps: [
        {
          type: 'number',
          prompt: 'What is the total resistance?',
          answer: Rt,
          unit: 'Ω',
          feedback: (g) => (near(g, product) ? 'That multiplies them. In series the resistances add.' : 'In series the resistances add: R₁ + R₂.'),
        },
        {
          type: 'number',
          prompt: 'What is the current from the battery?',
          answer: I,
          unit: 'A',
          prefixes: true,
          feedback: (g) => (near(g, oneOnly) ? 'That uses one resistor. The same current flows through both, so use the total resistance.' : 'I = V ÷ R, with the total resistance.'),
        },
        {
          type: 'number',
          prompt: `What is the potential difference across the ${fmt(Rx)} Ω resistor?`,
          answer: V2,
          unit: 'V',
          feedback: (g) => (same(g, V) ? 'In series the potential difference is shared, so each resistor has only part of it.' : `V = I × R, with the current and the ${fmt(Rx)} Ω resistor.`),
        },
      ],
      workings: [`Total resistance: ${fmt(R1)} + ${fmt(R2)} = ${fmt(Rt)} Ω.`, `Current: I = ${fmt(V)} ÷ ${fmt(Rt)} = ${fmt(I)} A.`, `Across the ${fmt(Rx)} Ω resistor: V = ${fmt(I)} × ${fmt(Rx)} = ${fmt(V2)} V. The rest of the ${fmt(V)} V is across the other resistor.`],
      check: { kind: 'series', V: plain(V), R1: plain(R1), R2: plain(R2), I: plain(I), asked: plain(Rx), V2: plain(V2) },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Parallel
// ---------------------------------------------------------------------------------------------

function parallelQuestion(r: () => number): Question {
  for (;;) {
    const R1 = pick(r, RESISTORS);
    const R2 = pick(r, RESISTORS);
    if (same(R1, R2)) continue;
    const V = pick(r, SUPPLIES);
    const I1 = div(V, R1);
    const I2 = div(V, R2);
    if (!I1 || !I2) continue;
    const I = add(I1, I2);
    if (I.digits.length > 3 || toNumber(V) * toNumber(I) > 5) continue;
    const halfV = div(V, D(2));
    const asSeries = toNumber(V) / (toNumber(R1) + toNumber(R2));
    return {
      round: 'parallel',
      prompt: `A ${fmt(R1)} Ω resistor and a ${fmt(R2)} Ω resistor are connected in parallel to a ${fmt(V)} V battery. Find the current from the battery.`,
      steps: [
        { type: 'number', prompt: `What is the potential difference across the ${fmt(R1)} Ω resistor?`, answer: V, unit: 'V', feedback: (g) => (halfV && same(g, halfV) ? 'In parallel the potential difference is not shared: each branch has the full potential difference of the battery.' : 'Each branch is connected straight across the battery.') },
        { type: 'number', prompt: `So what is the current through the ${fmt(R1)} Ω resistor?`, answer: I1, unit: 'A', prefixes: true, feedback: (g) => (near(g, toNumber(V) / 2 / toNumber(R1)) ? 'Each branch has the full potential difference, not half.' : 'I = V ÷ R for that branch.') },
        { type: 'number', prompt: `And through the ${fmt(R2)} Ω resistor?`, answer: I2, unit: 'A', prefixes: true, feedback: (g) => (near(g, toNumber(V) / 2 / toNumber(R2)) ? 'Each branch has the full potential difference, not half.' : 'I = V ÷ R for that branch.') },
        { type: 'number', prompt: 'What is the current from the battery?', answer: I, unit: 'A', prefixes: true, feedback: (g) => (near(g, asSeries) ? 'That treats them as in series. In parallel the branch currents add.' : 'The currents in the branches add up to the current from the battery.') },
      ],
      workings: [`Each branch has the full ${fmt(V)} V.`, `${fmt(V)} ÷ ${fmt(R1)} = ${fmt(I1)} A, and ${fmt(V)} ÷ ${fmt(R2)} = ${fmt(I2)} A.`, `The battery supplies ${fmt(I1)} + ${fmt(I2)} = ${fmt(I)} A.`],
      check: { kind: 'parallel', V: plain(V), R1: plain(R1), R2: plain(R2), I1: plain(I1), I2: plain(I2), I: plain(I) },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Charge and power
// ---------------------------------------------------------------------------------------------

/** Real uses for a current over a time, with a current range in amperes and a time range in minutes. */
const CHARGES: { what: string; lo: number; hi: number; tmin: number; tmax: number }[] = [
  { what: 'A phone charges with a current of', lo: 1, hi: 3, tmin: 10, tmax: 90 },
  { what: 'A torch bulb takes a current of', lo: 0.2, hi: 0.5, tmin: 5, tmax: 30 },
  { what: 'An electric drill takes a current of', lo: 2, hi: 5, tmin: 2, tmax: 5 },
  { what: 'A rover heater takes a current of', lo: 0.5, hi: 2, tmin: 10, tmax: 60 },
];
/** Things whose power is worked out, with a realistic supply and current, or current and resistance. */
const POWERS: { what: string; V?: string[]; I: string[]; R?: string[]; maxP?: number }[] = [
  { what: 'A kettle on the 230 V mains takes a current of', V: ['230'], I: ['8', '9', '10', '12', '13'] },
  { what: 'A phone charger supplies 5 V at a current of', V: ['5'], I: ['1', '1.5', '2', '2.4', '3'] },
  { what: 'A car headlamp on a 12 V battery takes a current of', V: ['12'], I: ['4', '4.5', '5', '5.5'] },
  { what: 'A spacecraft heater on a 28 V supply takes a current of', V: ['28'], I: ['0.5', '1', '1.5', '2', '2.5'] },
  // Never 2 A for I²R: doubling it and squaring it both give 4, so the slip could not be told apart.
  { what: 'A heating element has a resistance of R Ω and a current of', I: ['2.5', '3', '4', '5', '6'], R: ['5', '8', '10', '12', '15', '20', '25'] },
  // An ordinary resistor: at most 5 W, which a power resistor can take.
  { what: 'A resistor of R Ω has a current of', I: ['0.05', '0.1', '0.2', '0.3', '0.5'], R: ['10', '20', '47', '50', '100', '220'], maxP: 5 },
];

function chargeQuestion(r: () => number): Question {
  const { what, lo, hi, tmin, tmax } = pick(r, CHARGES);
  for (;;) {
    const I = D(String(parseFloat((lo + r() * (hi - lo)).toPrecision(2))));
    const minutes = r() < 0.75;
    const t = minutes ? int(r, tmin, tmax) : int(r, 2, 30) * 10;
    const seconds = minutes ? D(t * 60) : D(t);
    const Q = multiply(I, seconds);
    if (Q.digits.length > 3 || SHOWN.has(`charge ${plain(I)} ${plain(seconds)}`)) continue; // exact, no rounding needed
    const options = shuffle(r, ['Q = I × t', 'Q = I ÷ t', 'Q = t ÷ I']);
    const correct = options.indexOf('Q = I × t');
    const steps: Step[] = [{ type: 'choice', prompt: 'Which equation gives the charge?', options, correct, why: whyAll(options, correct, () => 'Current is the charge that flows each second, so the charge is the current times the time.') }];
    if (minutes) steps.push({ type: 'number', prompt: `The time must be in seconds. What is ${t} minutes in seconds?`, answer: seconds, unit: 's', feedback: () => 'Each minute is 60 seconds.' });
    steps.push({
      type: 'number',
      prompt: 'So how much charge flows?',
      answer: Q,
      unit: 'C',
      prefixes: true,
      feedback: (g) => (minutes && near(g, toNumber(I) * t) ? 'That uses the time in minutes. Use seconds.' : 'Multiply the current in amperes by the time in seconds.'),
    });
    return {
      round: 'charge',
      prompt: `${what} ${fmt(I)} A for ${minutes ? `${t} minute${t === 1 ? '' : 's'}` : `${t} seconds`}. How much charge flows?`,
      steps,
      workings: [minutes ? `${t} minutes = ${t} × 60 = ${fmt(seconds)} s.` : `The time is ${t} s.`, `Q = I × t = ${fmt(I)} × ${fmt(seconds)} = ${fmt(Q)} C.`],
      check: { kind: 'charge', I: plain(I), seconds: plain(seconds), Q: plain(Q) },
    };
  }
}

function powerQuestion(r: () => number): Question {
  for (;;) {
  const k = pick(r, POWERS);
  const I = D(pick(r, k.I));
  const byVI = !!k.V;
  const V = byVI ? D(pick(r, k.V!)) : null;
  const R = byVI ? null : D(pick(r, k.R!));
  const I2 = multiply(I, I);
  const P = byVI ? multiply(V!, I) : multiply(I2, R!);
  if (P.digits.length > 3 || (k.maxP && toNumber(P) > k.maxP)) continue; // exact, and realistic
  const right = byVI ? 'P = V × I' : 'P = I^{2} × R';
  // P = I × R is the named slip: it is the potential difference, not the power.
  const options = shuffle(r, ['P = V × I', 'P = I^{2} × R', 'P = I × R']);
  const correct = options.indexOf(right);
  const steps: Step[] = [
    {
      type: 'choice',
      prompt: 'Which equation gives the power from the values in the question?',
      options,
      correct,
      why: whyAll(options, correct, (o) => (o === 'P = I × R' ? 'I × R is the potential difference, not the power.' : byVI ? 'The question gives the potential difference and the current.' : 'The question gives the current and the resistance, not the potential difference.')),
    },
  ];
  if (!byVI) steps.push({ type: 'number', prompt: `First, what is I^{2}, the current squared?`, answer: I2, feedback: (g) => (same(g, multiply(I, D(2))) ? 'That doubles it. Squaring means multiplying the current by itself.' : 'Multiply the current by itself.') });
  steps.push({
    type: 'number',
    prompt: 'So what is the power?',
    answer: P,
    unit: 'W',
    prefixes: true,
    feedback: (g) => (!byVI && same(g, multiply(I, R!)) ? 'That is I × R, which is the potential difference. Square the current first.' : !byVI && same(g, multiply(multiply(I, D(2)), R!)) ? 'That uses 2I. Square the current instead.' : `Put the numbers into ${right.replace('^{2}', '²')}.`),
  });
  const prompt = byVI ? `${k.what} ${fmt(I)} A. What is its power?` : `${k.what.replace('R Ω', `${fmt(R!)} Ω`)} ${fmt(I)} A. What power does it transfer?`;
  return {
    round: 'charge',
    prompt,
    steps,
    workings: byVI ? [`P = V × I = ${fmt(V!)} × ${fmt(I)} = ${fmt(P)} W.`] : [`I^{2} = ${fmt(I)} × ${fmt(I)} = ${fmt(I2)}.`, `P = I^{2} × R = ${fmt(I2)} × ${fmt(R!)} = ${fmt(P)} W.`],
    check: { kind: 'power', ...(V ? { V: plain(V) } : {}), I: plain(I), ...(R ? { R: plain(R) } : {}), P: plain(P) },
  };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'series') return seriesQuestion(r);
  if (round === 'parallel') return parallelQuestion(r);
  if (round === 'charge') return r() < 0.5 ? chargeQuestion(r) : powerQuestion(r);
  return ohmQuestion(r);
}

export const circuitQuiz: LessonQuiz<CircuitCheck> = {
  lesson: 'circuit',
  storageKey: 'stella-quiz-circuit-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
