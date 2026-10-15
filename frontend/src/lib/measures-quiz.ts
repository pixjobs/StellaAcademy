/**
 * Quiz questions for the Measures lesson. Every question is generated, and each one is answered in
 * steps: the reasoning first (bigger or smaller unit, multiply or divide, by how much), then the answer.
 * A later step only opens once the one before it is right, so the answer cannot be reached by guessing
 * the last box alone.
 *
 * All arithmetic is exact (decimal strings and BigInt), so answers never carry floating-point noise.
 * scripts/content-checks/quiz.ts generates thousands of questions and checks every answer independently.
 */
import { MEASURES, bottom, formatDecimal, parseDecimal, powerOfTen, shift, type Digits, type MeasureKind, type MetricUnit } from '@/lib/measures';

export type Round = 'metric' | 'decimals' | 'imperial';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  metric: { label: 'Metric', blurb: 'One step on the ladder: km and m, m and cm, cm and mm, kg and g, l and ml.' },
  decimals: { label: 'Bigger jumps', blurb: 'Jumps of more than one step, such as metres to millimetres, and answers with up to 3 decimal places.' },
  imperial: { label: 'Imperial', blurb: 'Miles, inches, pounds and pints, using the rough equivalents.' },
};

export type ChoiceStep = {
  type: 'choice';
  prompt: string;
  options: string[];
  correct: number;
  /** Feedback for each wrong option, by index. */
  why: Record<number, string>;
};

export type NumberStep = {
  type: 'number';
  prompt: string;
  answer: Digits;
  /** Unit shown after the box, if any. */
  unit?: string;
  /** Feedback for a wrong typed answer. */
  feedback: (given: Digits) => string;
  /** Other answers that are also right, such as a rough answer rounded. */
  alsoAccept?: Digits[];
};

export type Step = ChoiceStep | NumberStep;

export type Question = {
  round: Round;
  /** The question as the pupil reads it, for example "Convert 3.5 km to metres." */
  prompt: string;
  steps: Step[];
  /** The full working, shown once the question is finished. */
  workings: string[];
  /** For the automatic check: the starting value and units, and the final answer. */
  check: { value: string; from: string; to: string; answer: Digits; rough?: { factor: string; exactFactor: number } };
};

// ---------------------------------------------------------------------------------------------
// Random numbers (seeded, so the checks can repeat a run)
// ---------------------------------------------------------------------------------------------

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
const int = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
function shuffle<T>(r: () => number, xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------------------------
// Exact decimal helpers
// ---------------------------------------------------------------------------------------------

const D = (s: string) => parseDecimal(s)!;
const same = (a: Digits, b: Digits) => a.digits === b.digits && (a.digits === '0' || a.top === b.top);

/** a × b, exactly. */
export function multiply(a: Digits, b: Digits): Digits {
  if (a.digits === '0' || b.digits === '0') return D('0');
  const product = (BigInt(a.digits) * BigInt(b.digits)).toString();
  const exp = bottom(a) + bottom(b); // place value of the product's last digit
  const trimmed = product.replace(/0+$/, '');
  return { digits: trimmed, top: exp + product.length - 1 };
}

/** a ÷ b when it divides exactly to at most 3 decimal places; null otherwise. */
export function divide(a: Digits, b: Digits): Digits | null {
  if (b.digits === '0') return null;
  // Scale both to whole numbers: a = A × 10^ea, b = B × 10^eb.
  const A = BigInt(a.digits) * 10n ** 6n; // allow up to 6 extra places, then check
  const B = BigInt(b.digits);
  if (A % B !== 0n) return null;
  const q = (A / B).toString();
  const exp = bottom(a) - 6 - bottom(b);
  const trimmed = q.replace(/0+$/, '') || '0';
  if (trimmed === '0') return D('0');
  const result = { digits: trimmed, top: exp + q.length - 1 };
  return bottom(result) < -3 ? null : result;
}

/** Reads a typed answer: digits with optional commas, then optionally a unit. */
export function readAnswer(text: string): { value: Digits; unit: string } | null {
  const m = text.trim().match(/^(?:about\s+)?([\d.,]+)\s*([a-zA-Z ]*)$/i);
  const value = m && parseDecimal(m[1]);
  return value ? { value, unit: m[2].trim().toLowerCase() } : null;
}

/** The ways a unit may be written after an answer. */
const UNIT_WORDS: Record<string, string[]> = {
  km: ['km', 'kilometre', 'kilometres'], m: ['m', 'metre', 'metres'], cm: ['cm', 'centimetre', 'centimetres'], mm: ['mm', 'millimetre', 'millimetres'],
  kg: ['kg', 'kilogram', 'kilograms'], g: ['g', 'gram', 'grams'], l: ['l', 'litre', 'litres'], ml: ['ml', 'millilitre', 'millilitres'],
  miles: ['mile', 'miles'], inches: ['in', 'inch', 'inches'], pounds: ['lb', 'lbs', 'pound', 'pounds'], litres: ['l', 'litre', 'litres'],
};

// ---------------------------------------------------------------------------------------------
// Metric questions
// ---------------------------------------------------------------------------------------------

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Practice questions printed in the lesson (value, from, to). The quiz never asks these. */
const PRINTED = new Set(['3.5 km m', '17 cm mm', '45 mm cm', '2,750 g kg', '1.5 l ml', '8,849 m km', '15 miles km', '30 cm inches', '20 kilograms pounds']);

/** A starting value whose digits fit the place-value range, built from 1 to 3 significant digits. */
function startValue(r: () => number, places: number, startMin: number, resultMin: number, maxTop: number): Digits {
  for (let tries = 0; tries < 200; tries++) {
    const n = int(r, 1, 3);
    let digits = String(int(r, 1, 9));
    for (let i = 1; i < n; i++) digits += String(int(r, i === n - 1 ? 1 : 0, 9));
    const top = int(r, -2, 4);
    const d = { digits, top };
    const res = shift(d, places);
    if (bottom(d) >= startMin && bottom(res) >= resultMin && Math.max(d.top, res.top) <= maxTop && Math.min(d.top, res.top) >= -3) return d;
  }
  return D('5');
}

function metricQuestion(r: () => number, round: 'metric' | 'decimals'): Question {
  const kind: MeasureKind = round === 'metric' ? pick(r, ['length', 'length', 'length', 'mass', 'capacity'] as const) : pick(r, ['length', 'length', 'mass', 'capacity'] as const);
  const units = MEASURES[kind].units;
  let i: number;
  let j: number;
  if (round === 'metric' || units.length === 2) {
    i = int(r, 0, units.length - 2);
    j = i + 1;
  } else {
    // A jump of two steps (m and mm), or km and m with up to 3 decimal places. km to cm or mm is left out:
    // the lesson's examples stop at two steps.
    [i, j] = pick(r, [[1, 3], [0, 1]] as const);
  }
  if (r() < 0.5) [i, j] = [j, i];
  const from = units[i];
  const to = units[j];
  const places = from.power - to.power;
  const factor = powerOfTen(Math.abs(places));
  let start = round === 'metric' ? startValue(r, places, -1, -2, 5) : startValue(r, places, -2, -3, 6);
  // Never the same as a practice question printed on the page, whose answer is shown there.
  while (PRINTED.has(`${formatDecimal(start)} ${from.symbol} ${to.symbol}`)) start = startValue(r, places, -1, -2, 5);
  const answer = shift(start, places);
  const smaller = places > 0; // the new unit is smaller
  const op = smaller ? 'Multiply' : 'Divide';
  const s = formatDecimal(start);
  const a = formatDecimal(answer);

  // The right factor and three others, then shuffled, so its position gives nothing away.
  const others = shuffle(r, ['10', '100', '1,000', '10,000', '1,000,000'].filter((x) => x !== factor)).slice(0, 3);
  const factorOptions = shuffle(r, [factor, ...others]);
  const steps: Step[] = [
    {
      type: 'choice',
      prompt: `Is a ${to.name} bigger or smaller than a ${from.name}?`,
      options: ['Bigger', 'Smaller'],
      correct: smaller ? 1 : 0,
      why: smaller
        ? { 0: `A ${to.name} is smaller: there are ${factor} ${to.plural} in one ${from.name}.` }
        : { 1: `A ${to.name} is bigger: one ${to.name} is ${factor} ${from.plural}.` },
    },
    {
      type: 'choice',
      prompt: smaller ? `So you need more of them. Do you multiply or divide?` : `So you need fewer of them. Do you multiply or divide?`,
      options: ['Multiply', 'Divide'],
      correct: smaller ? 0 : 1,
      why: smaller ? { 1: 'More of a smaller unit means a bigger number, so multiply.' } : { 0: 'Fewer of a bigger unit means a smaller number, so divide.' },
    },
    {
      type: 'choice',
      prompt: `${op} by how much?`,
      options: factorOptions,
      correct: factorOptions.indexOf(factor),
      why: Object.fromEntries(
        factorOptions.map((o, k) => [k, Math.abs(i - j) > 1 ? `Count the steps between ${from.symbol} and ${to.symbol} on the ladder, and multiply their numbers together.` : `1 ${smaller ? from.symbol : to.symbol} = ${factor} ${smaller ? to.symbol : from.symbol}.`]).filter(([k]) => k !== factorOptions.indexOf(factor)),
      ),
    },
    {
      type: 'number',
      prompt: `${op} ${s} by ${factor}. What is ${s} ${from.symbol} in ${to.plural}?`,
      answer,
      unit: to.symbol,
      feedback: (given) => offByPowerOfTen(given, answer, places, factor),
    },
  ];

  return {
    round,
    prompt: `Convert ${s} ${from.symbol} to ${to.plural}.`,
    steps,
    workings: [
      `${cap(to.plural)} are ${smaller ? 'smaller' : 'bigger'} than ${from.plural}, so the number gets ${smaller ? 'bigger' : 'smaller'}: ${op.toLowerCase()}.`,
      `${s} ${smaller ? '×' : '÷'} ${factor} = ${a}. Every digit moves ${Math.abs(places)} place${Math.abs(places) === 1 ? '' : 's'} to the ${smaller ? 'left' : 'right'}.`,
      `So ${s} ${from.symbol} = ${a} ${to.symbol}.`,
    ],
    check: { value: s.replace(/,/g, ''), from: from.symbol, to: to.symbol, answer },
  };
}

/** Feedback when a typed answer has the right digits but the wrong size, or is wrong some other way. */
function offByPowerOfTen(given: Digits, answer: Digits, places: number, factor: string): string {
  if (given.digits === answer.digits && given.digits !== '0') {
    const k = given.top - answer.top;
    const times = powerOfTen(Math.abs(k));
    const size = k > 0 ? 'too big' : 'too small';
    if (k === -2 * places) return `Your answer is ${times} times ${size}. Did you ${places > 0 ? 'divide instead of multiplying' : 'multiply instead of dividing'}?`;
    return `Your answer is ${times} times ${size}. Check how many places the digits move when you ${places > 0 ? 'multiply' : 'divide'} by ${factor}.`;
  }
  return `Not quite. The digits stay the same and move ${Math.abs(places)} place${Math.abs(places) === 1 ? '' : 's'}; put in zeros to hold empty places.`;
}

// ---------------------------------------------------------------------------------------------
// Imperial questions (rough equivalents, as the curriculum asks)
// ---------------------------------------------------------------------------------------------

const EQUIVALENTS = ['5 miles is about 8 km', '1 inch is about 2.5 cm', '1 kg is about 2.2 pounds', '1 pint is about 0.57 litres'] as const;
const EQUIVALENT_FOR: Record<(typeof EQUIVALENTS)[number], string> = {
  '5 miles is about 8 km': 'miles and kilometres',
  '1 inch is about 2.5 cm': 'inches and centimetres',
  '1 kg is about 2.2 pounds': 'kilograms and pounds',
  '1 pint is about 0.57 litres': 'pints and litres',
};
// Exact UK definitions (Weights and Measures Act 1985), for the automatic check only.
const MILE_KM = 1.609344;
const INCH_CM = 2.54;
const POUND_KG = 0.45359237;
const PINT_L = 4.54609 / 8;

function equivalentStep(r: () => number, correct: (typeof EQUIVALENTS)[number]): ChoiceStep {
  const options = shuffle(r, [...EQUIVALENTS]);
  return {
    type: 'choice',
    prompt: 'Which rough equivalent do you need?',
    options,
    correct: options.indexOf(correct),
    why: Object.fromEntries(options.map((o, k) => [k, `That one is for ${EQUIVALENT_FOR[o]}. Look at the units in the question.`]).filter(([k]) => k !== options.indexOf(correct))),
  };
}

function imperialQuestion(r: () => number): Question {
  const type = pick(r, ['miles-km', 'km-miles', 'in-cm', 'cm-in', 'kg-lb', 'pint-l'] as const);
  const wrongNumber = (answer: Digits, hint: string) => (given: Digits) => (same(given, answer) ? '' : hint);

  if (type === 'miles-km' || type === 'km-miles') {
    const toKm = type === 'miles-km';
    let lots = int(r, 2, 12);
    while (toKm && lots === 3) lots = int(r, 2, 12); // 15 miles is a printed practice question
    const start = String(lots * (toKm ? 5 : 8));
    const answer = D(String(lots * (toKm ? 8 : 5)));
    const per = toKm ? '5 miles' : '8 km';
    return {
      round: 'imperial',
      prompt: toKm ? `A road sign says ${start} miles. Roughly how far is that in kilometres?` : `A race is ${start} km long. Roughly how far is that in miles?`,
      steps: [
        equivalentStep(r, EQUIVALENTS[0]),
        { type: 'number', prompt: `How many lots of ${per} are in ${start} ${toKm ? 'miles' : 'km'}?`, answer: D(String(lots)), feedback: wrongNumber(D(String(lots)), `Divide ${start} by ${toKm ? 5 : 8}.`) },
        {
          type: 'number',
          prompt: `Each lot is about ${toKm ? '8 km' : '5 miles'}. So about how far is it in ${toKm ? 'kilometres' : 'miles'}?`,
          answer,
          unit: toKm ? 'km' : 'miles',
          feedback: wrongNumber(answer, `Multiply the number of lots, ${lots}, by ${toKm ? 8 : 5}.`),
        },
      ],
      workings: [
        `5 miles is about 8 km.`,
        `${start} ÷ ${toKm ? 5 : 8} = ${lots} lots.`,
        `${lots} × ${toKm ? 8 : 5} = ${formatDecimal(answer)}, so ${start} ${toKm ? 'miles' : 'km'} is about ${formatDecimal(answer)} ${toKm ? 'km' : 'miles'}.`,
      ],
      check: { value: start, from: toKm ? 'mile' : 'km', to: toKm ? 'km' : 'mile', answer, rough: { factor: toKm ? '1.6' : '0.625', exactFactor: toKm ? MILE_KM : 1 / MILE_KM } },
    };
  }

  // One multiplication or division by a rough equivalent.
  const spec = {
    'in-cm': { n: int(r, 2, 40), from: 'inches', to: 'centimetres', unit: 'cm', eq: EQUIVALENTS[1], factor: '2.5', mult: true, exact: INCH_CM, prompt: (v: string) => `A ribbon is ${v} inches long. Roughly how long is it in centimetres?` },
    'cm-in': { n: pick(r, [5, 10, 15, 20, 25, 35, 40, 50, 60, 75, 100]), from: 'centimetres', to: 'inches', unit: 'inches', eq: EQUIVALENTS[1], factor: '2.5', mult: false, exact: 1 / INCH_CM, prompt: (v: string) => `A plant is ${v} cm tall. Roughly how tall is it in inches?` },
    'kg-lb': { n: pick(r, [2, 3, 4, 5, 6, 8, 10, 12, 15, 25, 30]), from: 'kilograms', to: 'pounds', unit: 'pounds', eq: EQUIVALENTS[2], factor: '2.2', mult: true, exact: 1 / POUND_KG, prompt: (v: string) => `A dog has a mass of ${v} kg. Roughly how many pounds is that?` },
    'pint-l': { n: pick(r, [2, 4, 6]), from: 'pints', to: 'litres', unit: 'litres', eq: EQUIVALENTS[3], factor: '0.57', mult: true, exact: PINT_L, prompt: (v: string) => `A milk bottle holds ${v} pint${v === '1' ? '' : 's'}. Roughly how many litres is that?` },
  }[type];
  const start = String(spec.n);
  const answer = spec.mult ? multiply(D(start), D(spec.factor)) : divide(D(start), D(spec.factor))!;
  const a = formatDecimal(answer);
  // A rough answer rounded to 1 decimal place or to a whole number is also right ("about 64 pounds").
  const rounded = [1, 0].map((dp) => D(String(Number(Number(a.replace(/,/g, '')).toFixed(dp))))).filter((d) => !same(d, answer) && d.digits !== '0');
  const whole = spec.factor.replace('.', '').replace(/^0+/, '');
  return {
    round: 'imperial',
    prompt: spec.prompt(start),
    steps: [
      equivalentStep(r, spec.eq),
      {
        type: 'choice',
        prompt: `Do you multiply or divide ${start} by ${spec.factor}?`,
        options: ['Multiply', 'Divide'],
        correct: spec.mult ? 0 : 1,
        why: spec.mult
          ? { 1: `${cap(spec.eq)}, so multiply by ${spec.factor}.` }
          : { 0: `${cap(spec.eq)}, so divide by ${spec.factor}.` },
      },
      {
        type: 'number',
        prompt: `${spec.mult ? 'Multiply' : 'Divide'} ${start} by ${spec.factor}. About how many ${spec.to}?`,
        answer,
        unit: spec.unit,
        alsoAccept: rounded,
        feedback: wrongNumber(answer, spec.mult ? `Work out ${start} × ${spec.factor}. Try ${start} × ${whole} first, then divide by ${spec.factor.split('.')[1].length === 1 ? 10 : 100}.` : `Work out ${start} ÷ ${spec.factor}. Hint: dividing by 2.5 is the same as dividing by 5 and multiplying by 2.`),
      },
    ],
    workings: [
      `${spec.eq.replace(/^./, (c) => c.toUpperCase())}.`,
      `${start} ${spec.mult ? '×' : '÷'} ${spec.factor} = ${a}.`,
      `So ${start} ${spec.from} is about ${a} ${spec.to}.`,
    ],
    check: { value: start, from: spec.from, to: spec.to, answer, rough: { factor: spec.mult ? spec.factor : String(1 / Number(spec.factor)), exactFactor: spec.exact } },
  };
}

/** One generated question for the round. */
export function makeQuestion(round: Round, r: () => number): Question {
  return round === 'imperial' ? imperialQuestion(r) : metricQuestion(r, round);
}

/** Is the typed answer right? Empty feedback means yes. */
export function markNumber(step: NumberStep, text: string): { ok: boolean; feedback: string } {
  const read = readAnswer(text);
  if (!read) return { ok: false, feedback: 'Type a number, such as 2.5 or 3,500.' };
  if (read.unit && step.unit && !(UNIT_WORDS[step.unit] ?? [step.unit]).includes(read.unit)) {
    const words = UNIT_WORDS[step.unit];
    return { ok: false, feedback: `Check the unit: this answer is in ${words ? words[words.length - 1] : step.unit}.` };
  }
  if (same(read.value, step.answer) || step.alsoAccept?.some((d) => same(read.value, d))) return { ok: true, feedback: '' };
  return { ok: false, feedback: step.feedback(read.value) || 'Not quite. Try again.' };
}

export type { MetricUnit };
