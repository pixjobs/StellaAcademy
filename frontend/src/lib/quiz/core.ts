/**
 * The shared quiz engine: step types, seeded random numbers, exact arithmetic and answer marking.
 *
 * Every lesson quiz (lib/quiz/<lesson>.ts) generates questions that are answered in steps: the reasoning
 * first, then the answer. A later step only opens once the one before it is right, so the answer cannot be
 * reached by guessing the last box alone. Arithmetic is exact (decimal strings, BigInt fractions), so
 * answers never carry floating-point noise. scripts/content-checks/quiz.ts generates thousands of questions
 * per lesson and checks every one independently.
 */
import { bottom, formatDecimal, parseDecimal, type Digits } from '@/lib/measures';
import type { ConceptId } from '@/lib/study-modules';

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
  /** Unit shown with the box, if any: '%' for percentages, '£' for money (shown before the box). */
  unit?: string;
  /** Feedback for a wrong typed answer. */
  feedback: (given: Digits) => string;
  /** Other answers that are also right, such as a rough answer rounded. */
  alsoAccept?: Digits[];
};

export type FractionStep = {
  type: 'fraction';
  prompt: string;
  answer: Fraction;
  /** Only the simplest form is right; an equal but unsimplified fraction gets a nudge. */
  simplest: boolean;
  /** The bottom number the answer must have, such as 100 for "out of 100". */
  denominator?: bigint;
  /** Show the answer as a mixed number (3 11/24) once it is done. */
  mixed?: boolean;
  feedback: (given: Fraction) => string;
};

export type Step = ChoiceStep | NumberStep | FractionStep;

export type Question<C = unknown> = {
  round: string;
  /** The question as the pupil reads it. */
  prompt: string;
  steps: Step[];
  /** The full working, shown once the question is finished. */
  workings: string[];
  /** Data for the automatic check (scripts/content-checks/quiz). */
  check: C;
};

/** One lesson's quiz: its rounds, how to make a question, and where its progress is saved. */
export type LessonQuiz<C = unknown> = {
  lesson: ConceptId;
  /** localStorage key for scores and the review list. */
  storageKey: string;
  rounds: Record<string, { label: string; blurb: string }>;
  make: (round: string, r: () => number) => Question<C>;
  /** One sentence above the rounds. */
  intro?: string;
};

// ---------------------------------------------------------------------------------------------
// Random numbers (seeded, so a question can be made again and the checks can repeat a run)
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
export const pick = <T>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
export const int = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
export function shuffle<T>(r: () => number, xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Two numbers equal, ignoring how they are written ("1,320" and "1320"). */
export const sameNumber = (a: Digits, b: string | number) => same(a, D(String(b).replace(/,/g, '')));

/** Feedback for every wrong option of a choice step, from one function. */
export function whyAll(options: string[], correct: number, why: (option: string, k: number) => string): Record<number, string> {
  return Object.fromEntries(options.map((o, k) => [k, why(o, k)]).filter(([k]) => k !== correct));
}

// ---------------------------------------------------------------------------------------------
// Exact decimals
// ---------------------------------------------------------------------------------------------

export const D = (s: string | number) => parseDecimal(String(s))!;
export const same = (a: Digits, b: Digits) => a.digits === b.digits && (a.digits === '0' || a.top === b.top);
export const fmt = formatDecimal;

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

/** a + b, exactly. */
export function add(a: Digits, b: Digits): Digits {
  const lo = Math.min(bottom(a), bottom(b));
  const scaled = (d: Digits) => (d.digits === '0' ? 0n : BigInt(d.digits) * 10n ** BigInt(bottom(d) - lo));
  const sum = (scaled(a) + scaled(b)).toString();
  if (sum === '0') return D('0');
  const trimmed = sum.replace(/0+$/, '');
  return { digits: trimmed, top: lo + sum.length - 1 };
}

// ---------------------------------------------------------------------------------------------
// Fractions
// ---------------------------------------------------------------------------------------------

export type Fraction = { n: bigint; d: bigint };

export const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));
export const F = (n: number | bigint, d: number | bigint = 1): Fraction => ({ n: BigInt(n), d: BigInt(d) });
export function simplify(f: Fraction): Fraction {
  const g = gcd(f.n, f.d) || 1n;
  return { n: f.n / g, d: f.d / g };
}
export const fracEqual = (a: Fraction, b: Fraction) => a.n * b.d === b.n * a.d;
export const isSimplest = (f: Fraction) => gcd(f.n, f.d) === 1n;
export const fracText = (f: Fraction) => (f.d === 1n ? String(f.n) : `${f.n}/${f.d}`);

/** Reads "7/20", "2 3/4" (a mixed number) or a whole number. */
export function readFraction(text: string): Fraction | null {
  const t = text.trim().replace(/\s+/g, ' ');
  let m = t.match(/^(\d+) (\d+)\s*\/\s*(\d+)$/);
  if (m) {
    const d = BigInt(m[3]);
    return d === 0n ? null : { n: BigInt(m[1]) * d + BigInt(m[2]), d };
  }
  m = t.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (m) {
    const d = BigInt(m[2]);
    return d === 0n ? null : { n: BigInt(m[1]), d };
  }
  m = t.match(/^(\d+)$/);
  return m ? { n: BigInt(m[1]), d: 1n } : null;
}

// ---------------------------------------------------------------------------------------------
// Marking
// ---------------------------------------------------------------------------------------------

/** Reads a typed number: digits with optional commas, then optionally a unit or %. */
export function readAnswer(text: string): { value: Digits; unit: string } | null {
  const m = text.trim().match(/^(?:about\s+)?([\d.,]+)\s*([a-zA-Z %]*)$/i);
  const value = m && parseDecimal(m[1]);
  return value ? { value, unit: m[2].trim().toLowerCase() } : null;
}

/** The ways a unit may be written after an answer. */
const UNIT_WORDS: Record<string, string[]> = {
  km: ['km', 'kilometre', 'kilometres'], m: ['m', 'metre', 'metres'], cm: ['cm', 'centimetre', 'centimetres'], mm: ['mm', 'millimetre', 'millimetres'],
  kg: ['kg', 'kilogram', 'kilograms'], g: ['g', 'gram', 'grams'], l: ['l', 'litre', 'litres'], ml: ['ml', 'millilitre', 'millilitres'],
  miles: ['mile', 'miles'], inches: ['in', 'inch', 'inches'], pounds: ['lb', 'lbs', 'pound', 'pounds'], litres: ['l', 'litre', 'litres'],
  '%': ['%', 'percent', 'per cent'],
  '£': ['£'],
};

/** Is the typed number right? Empty feedback means yes. */
export function markNumber(step: NumberStep, text: string): { ok: boolean; feedback: string } {
  const pounds = /^£/.test(text.trim());
  if (pounds && step.unit !== '£') return { ok: false, feedback: 'This answer is not money. Type just the number.' };
  const read = readAnswer(text.trim().replace(/^£\s*/, ''));
  if (!read) return { ok: false, feedback: 'Type a number, such as 2.5 or 3,500.' };
  if (step.unit === '£') {
    if (read.unit) return { ok: false, feedback: /^p|pence/.test(read.unit) ? 'This answer is in pounds (£), not pence.' : 'Type the amount in pounds, such as 19 or £19.' };
    if (same(read.value, step.answer)) return { ok: true, feedback: '' };
    return { ok: false, feedback: step.feedback(read.value) || 'Not quite. Try again.' };
  }
  if (read.unit && step.unit && !(UNIT_WORDS[step.unit] ?? [step.unit]).includes(read.unit)) {
    const words = UNIT_WORDS[step.unit];
    return { ok: false, feedback: `Check the unit: this answer is in ${words ? words[words.length - 1] : step.unit}.` };
  }
  if (same(read.value, step.answer) || step.alsoAccept?.some((d) => same(read.value, d))) return { ok: true, feedback: '' };
  return { ok: false, feedback: step.feedback(read.value) || 'Not quite. Try again.' };
}

/** Is the typed fraction right? */
export function markFraction(step: FractionStep, text: string): { ok: boolean; feedback: string } {
  const given = readFraction(text);
  if (!given) return { ok: false, feedback: 'Type a fraction such as 7/20.' };
  if (fracEqual(given, step.answer)) {
    if (step.denominator && given.d !== step.denominator) return { ok: false, feedback: `Write it with ${step.denominator} on the bottom.` };
    if (step.simplest && !isSimplest(given)) return { ok: false, feedback: 'That is equal, but it can be simplified. Divide the top and bottom by a number that goes into both.' };
    return { ok: true, feedback: '' };
  }
  return { ok: false, feedback: step.feedback(given) || 'Not quite. Try again.' };
}

/** Marks any typed step. */
export function markTyped(step: NumberStep | FractionStep, text: string) {
  return step.type === 'number' ? markNumber(step, text) : markFraction(step, text);
}

/** How an answer is shown once done. */
export function answerText(step: Step): string {
  if (step.type === 'number') {
    if (step.unit === '£') return `£${fmt(step.answer)}`;
    return `${fmt(step.answer)}${step.unit ? (step.unit === '%' ? '%' : ` ${step.unit}`) : ''}`;
  }
  if (step.type === 'fraction') {
    const { n, d } = step.answer;
    if (step.mixed && n > d && d > 1n) return `${n / d}${n % d ? ` ${n % d}/${d}` : ''}`;
    return fracText(step.answer);
  }
  return step.options[step.correct];
}
