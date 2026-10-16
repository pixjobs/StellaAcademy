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
  /** Show the answer without commas (a binary number such as 110011). */
  plain?: boolean;
  /**
   * A calculator answer (GCSE and A-level): `answer` is the exact value rounded to 3 significant figures, and
   * any typed value within half a unit of the third significant figure of `exact` is right (36.87 or 36.9).
   */
  exact?: number;
  /** How the answer is shown, when it keeps trailing zeros (13.0 to 3 significant figures). */
  shown?: string;
  /**
   * The answer may also be typed with a prefix on its unit (2.4 mA for 0.0024 A, 4.7 kΩ for 4,700 Ω). Off by
   * default: a quiz about prefixes must not accept the question's own unit typed back.
   */
  prefixes?: boolean;
  /**
   * How far a calculator answer may be from `exact`, as a fraction of it (default 0.002). Chained A-level steps
   * built from rounded values use more, so a pupil who rounded each step to 3 significant figures is not refused.
   */
  tolerance?: number;
  /** A ratio: "2:1" and "2/1" are read as 2, and "1:2" as 0.5, so a pupil may write it either way. */
  ratio?: boolean;
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
  /** The question asks for a mixed number: an improper fraction, or a fraction part of 1 or more, is refused. */
  requireMixed?: boolean;
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

/** A decimal from text or a number, negative numbers included ("-5", "−5" or -5). */
export const D = (s: string | number): Digits => {
  const t = String(s).trim();
  const neg = /^[-−]/.test(t);
  const d = parseDecimal(t.replace(/^[-−]\s*/, ''))!;
  return neg && d.digits !== '0' ? { ...d, neg: true } : d;
};
export const same = (a: Digits, b: Digits) => a.digits === b.digits && (a.digits === '0' || (a.top === b.top && !!a.neg === !!b.neg));
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
  // A pupil may type the π of an angle (2π/3, π/12, 5/3 π): read the number in front of it.
  const t = text.trim().replace(/\s+/g, ' ').replace(/^(π|pi)\s*\//i, '1/').replace(/\s*(π|pi)\s*/gi, '').trim();
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

/**
 * Reads a typed number: digits with optional commas, or spaces between groups of three as some lesson pages
 * write them (20 000), then optionally a unit or %.
 */
export function readAnswer(text: string): { value: Digits; unit: string; rawUnit: string } | null {
  // Superscript powers (10⁶, 10⁻³) read as 10^6 and 10^-3.
  const SUP: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
  const lifted = text.trim().replace(/10([⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, p: string) => `10^${[...p].map((c) => SUP[c]).join('')}`);
  const grouped = lifted.replace(/(\d)[ \u00a0\u2009\u202f](?=\d{3}(?!\d))/g, '$1');
  const UNIT = '([a-zA-Z %²³^.°/μµΩω⁻¹·-]*[123]?)';
  // Standard form, as the physics lessons teach it: 4.7 × 10^6, 4.7x10^6, 4.7*10^-3 or 4.7e6.
  const sf = grouped.match(new RegExp(`^(?:about\\s+)?([-−–]?)\\s*(\\d+(?:\\.\\d+)?)\\s*(?:[x×*]\\s*10\\s*\\^\\s*\\{?|e)\\s*([-−–+]?\\d+)\\}?\\s*${UNIT}$`, 'i'));
  if (sf) {
    const front = parseDecimal(sf[2]);
    if (!front) return null;
    const value = shiftDigits(front, (/^[-−–]/.test(sf[3]) ? -1 : 1) * Number(sf[3].replace(/^[-−–+]/, '')));
    return { value: sf[1] && value.digits !== '0' ? { ...value, neg: true } : value, unit: sf[4].trim().toLowerCase(), rawUnit: sf[4].trim() };
  }
  const m = grouped.match(new RegExp(`^(?:about\\s+)?([-−–]?)\\s*([\\d.,]+)\\s*${UNIT}$`, 'i'));
  const value = m && parseDecimal(m[2]);
  if (!m || !value) return null;
  return { value: m[1] && value.digits !== '0' ? { ...value, neg: true } : value, unit: m[3].trim().toLowerCase(), rawUnit: m[3].trim() };
}
/** Multiplies by 10 to the power `places`, exactly. */
const shiftDigits = (d: Digits, places: number): Digits => (d.digits === '0' ? d : { ...d, top: d.top + places });

/** The ways a unit may be written after an answer. */
const UNIT_WORDS: Record<string, string[]> = {
  km: ['km', 'kilometre', 'kilometres'], m: ['m', 'metre', 'metres'], cm: ['cm', 'centimetre', 'centimetres'], mm: ['mm', 'millimetre', 'millimetres'],
  kg: ['kg', 'kilogram', 'kilograms'], g: ['g', 'gram', 'grams'], l: ['l', 'litre', 'litres'], ml: ['ml', 'millilitre', 'millilitres'],
  miles: ['mile', 'miles'], inches: ['in', 'inch', 'inches'], pounds: ['lb', 'lbs', 'pound', 'pounds'], litres: ['l', 'litre', 'litres'],
  '%': ['%', 'percent', 'per cent'],
  '£': ['£'],
  days: ['day', 'days'],
  'm/s': ['m/s', 'm s⁻¹', 'm s-1', 'm s^-1', 'ms⁻¹', 'ms-1', 'ms^-1', 'm/sec', 'metres per second'],
  'm²/s²': ['m²/s²', 'm^2/s^2', 'm2/s2', 'm² s⁻²', 'm^2 s^-2', 'm2 s-2', 'm²s⁻²'],
  s: ['s', 'sec', 'secs', 'second', 'seconds'],
  '°': ['°', 'deg', 'degree', 'degrees'],
  hours: ['h', 'hr', 'hrs', 'hour', 'hours'],
  watts: ['w', 'watt', 'watts'],
  '°c': ['°c', '° c', 'c', 'degrees', '°', 'degrees c'],
  // The last word is the one feedback uses.
  'cm²': ['cm²', 'cm2', 'cm^2', 'sq cm', 'sq. cm', 'cm sq', 'square cm', 'square centimetre', 'square centimetres'],
  'm²': ['m²', 'm2', 'm^2', 'sq m', 'sq. m', 'm sq', 'square m', 'square metre', 'square metres'],
  'mm²': ['mm²', 'mm2', 'mm^2', 'sq mm', 'square mm', 'square millimetre', 'square millimetres'],
  'cm³': ['cm³', 'cm3', 'cm^3', 'cc', 'cubic cm', 'cubic centimetre', 'cubic centimetres'],
  'm³': ['m³', 'm3', 'm^3', 'cubic m', 'cubic metre', 'cubic metres'],
  // Physics units, by symbol. Prefixed ones are matched without case, so a quiz never asks for both mW and MW.
  A: ['a', 'amp', 'amps', 'ampere', 'amperes'],
  mA: ['ma', 'milliamp', 'milliamps', 'milliampere', 'milliamperes'],
  V: ['v', 'volt', 'volts'],
  mV: ['mv', 'millivolt', 'millivolts'],
  W: ['w', 'watt', 'watts'],
  kW: ['kw', 'kilowatt', 'kilowatts'],
  MW: ['mw', 'megawatt', 'megawatts'],
  J: ['j', 'joule', 'joules'],
  kJ: ['kj', 'kilojoule', 'kilojoules'],
  MJ: ['mj', 'megajoule', 'megajoules'],
  Hz: ['hz', 'hertz'],
  kHz: ['khz', 'kilohertz'],
  MHz: ['mhz', 'megahertz'],
  mg: ['mg', 'milligram', 'milligrams'],
  'Ω': ['ω', 'ohm', 'ohms'],
  'kΩ': ['kω', 'kohm', 'kohms', 'kilohm', 'kilohms'],
  C: ['c', 'coulomb', 'coulombs'],
  N: ['n', 'newton', 'newtons'],
  'km/s': ['km/s', 'kms', 'km s-1', 'km s⁻¹', 'km s^-1', 'km/sec', 'kilometres per second'],
  'km³': ['km³', 'km3', 'km^3', 'cubic km', 'cubic kilometres'],
  'kg m/s': ['kg m/s', 'kgm/s', 'kg m s-1', 'kg m s⁻¹', 'kg ms-1', 'kg ms⁻¹', 'kg m s^-1', 'kg·m/s', 'n s', 'ns', 'n·s', 'newton seconds'],
  // Field strength may also be given as an acceleration, as A-level allows.
  'N/kg': ['n/kg', 'n kg-1', 'n kg⁻¹', 'n kg^-1', 'nkg-1', 'nkg⁻¹', 'nkg^-1', 'm/s²', 'm/s^2', 'm/s2', 'm s⁻²', 'm s-2', 'm s^-2', 'ms⁻²', 'ms-2', 'ms^-2', 'newtons per kilogram', 'newtons per kg'],
  minutes: ['min', 'mins', 'minute', 'minutes'],
  'N m': ['n m', 'nm', 'n·m', 'n.m', 'newton metre', 'newton metres', 'newton-metre', 'newton-metres'],
  'turns a minute': ['turns per minute', 'turns per min', 'turns/min', 'turns/minute', 'times a minute', 'times per minute', 'revs per minute', 'revs a minute', 'rev/min', 'revolutions per minute', 'revolutions a minute', 'rotations per minute', 'rotations a minute', 'rpm', 'r.p.m.', 'r.p.m', 'per minute', 'a minute', 'turns', 'turns a minute'],
  'km/h': ['km/h', 'kmh', 'kph', 'kmph', 'km/hr', 'km h⁻¹', 'km h-1', 'km per hour', 'kilometres per hour'],
};

/** Is the typed number right? Empty feedback means yes. */
let unitWords: Set<string> | null = null;
/** Every unit word a pupil might type, so a unit on an answer that has none can be refused. */
const allUnitWords = () => (unitWords ??= new Set(Object.values(UNIT_WORDS).flat()));

export function markNumber(step: NumberStep, text: string): { ok: boolean; feedback: string } {
  if (step.plain) {
    // A binary number: only 0s and 1s.
    if (/^\s*\d+\s*$/.test(text) && /[2-9]/.test(text)) {
      // Digits other than 0 and 1: name the slip if this step knows it (adding as in denary), else say why.
      return { ok: false, feedback: step.feedback(D(text.trim())) || 'Binary uses only 0s and 1s.' };
    }
    if (!/^\s*[01]+\s*$/.test(text)) return { ok: false, feedback: 'Type only 0s and 1s, such as 10110.' };
    const given = D(text.trim().replace(/^0+(?=\d)/, ''));
    return same(given, step.answer) ? { ok: true, feedback: '' } : { ok: false, feedback: step.feedback(given) || 'Not quite. Try again.' };
  }
  if (step.ratio) {
    const m = text.trim().match(/^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/);
    if (m && Number(m[2]) !== 0) {
      const value = Number(m[1]) / Number(m[2]);
      if (Math.abs(value - toNumber(step.answer)) <= 1e-9 * Math.max(1, toNumber(step.answer))) return { ok: true, feedback: '' };
      return { ok: false, feedback: step.feedback(D(String(parseFloat(value.toPrecision(6))))) || 'Not quite. Try again.' };
    }
  }
  const pounds = /^£/.test(text.trim());
  if (pounds && step.unit !== '£') return { ok: false, feedback: 'This answer is not money. Type just the number.' };
  const read = readAnswer(text.trim().replace(/^£\s*/, ''));
  if (!read) return { ok: false, feedback: 'Type a number, such as 2.5 or 3,500.' };
  if (step.unit === '£') {
    if (read.unit) return { ok: false, feedback: /^p|pence/.test(read.unit) ? 'This answer is in pounds (£), not pence.' : 'Type the amount in pounds, such as 19 or £19.' };
    if (same(read.value, step.answer)) return { ok: true, feedback: '' };
    return { ok: false, feedback: step.feedback(read.value) || 'Not quite. Try again.' };
  }
  if (read.unit && !step.unit) return { ok: false, feedback: allUnitWords().has(read.unit) ? 'This answer has no unit. Type just the number.' : 'Type just a number, such as 2.5.' };
  // A prefixed unit where the step allows it: convert to the base unit, then mark as usual.
  if (step.prefixes && step.unit && read.rawUnit) {
    const m = read.rawUnit.match(/^([mkMμuG])\s*(A|V|W|Ω|J|C|m\/s)$/);
    if (m && m[2] === step.unit) {
      const power = { m: -3, k: 3, M: 6, μ: -6, u: -6, G: 9 }[m[1]]!;
      return markNumber({ ...step, prefixes: false }, `${fmt(shiftDigits(read.value, power))} ${step.unit}`.replace(/^−/, '-'));
    }
  }
  // Milli and mega differ only by a capital: mW for MW is a different unit, a billion times smaller.
  if (read.unit && step.unit && /^[mM][A-Za-z]/.test(step.unit) && /^[mM][A-Za-z]{1,2}$/.test(read.rawUnit) && read.rawUnit[0] !== step.unit[0])
    return { ok: false, feedback: 'Check the capital letter: m is milli and M is mega.' };
  if (read.unit && step.unit && !(UNIT_WORDS[step.unit] ?? [step.unit]).includes(read.unit)) {
    const words = UNIT_WORDS[step.unit];
    return { ok: false, feedback: `Check the unit: this answer is in ${words ? words[words.length - 1] : step.unit}.` };
  }
  if (same(read.value, step.answer) || step.alsoAccept?.some((d) => same(read.value, d))) return { ok: true, feedback: '' };
  if (step.exact !== undefined) {
    const v = toNumber(read.value);
    // Half a unit of the third significant figure, or 0.2%, whichever is larger: a pupil who rounded a value on
    // the way (such as sin 19° = 0.326) lands a little off the exact answer, and that is still right.
    const tol = Math.max(sigFigUnit(step.exact) / 2, Math.abs(step.exact) * (step.tolerance ?? 0.002));
    // Close enough, but with fewer than 3 significant figures (53 for 52.9): ask for 3, as the house rule says.
    // An answer that is exact with fewer figures (0.5 for 0.500, 13 for 13.0) matches `answer` above instead.
    if (Math.abs(v - step.exact) <= tol * 1.0001) return typedSigFigs(text) < 3 ? { ok: false, feedback: 'Close, but give your answer to 3 significant figures.' } : { ok: true, feedback: '' };
    // Right but rounded too far, such as 37 for 36.87.
    if (Math.abs(v - step.exact) <= 10 * tol && countSigFigs(read.value) < 3) return { ok: false, feedback: 'Close, but give your answer to 3 significant figures.' };
  }
  return { ok: false, feedback: step.feedback(read.value) || 'Not quite. Try again.' };
}

/** A decimal as an ordinary number. */
export const toNumber = (d: Digits) => (d.neg ? -1 : 1) * Number(d.digits) * 10 ** (d.top - d.digits.length + 1);
/** The place value of the third significant figure of x. */
const sigFigUnit = (x: number) => 10 ** (Math.floor(Math.log10(Math.abs(x))) - 2);
const countSigFigs = (d: Digits) => d.digits.replace(/^0+/, '').length;
/**
 * Significant figures as typed, so trailing zeros count: 0.290 and 1,500 have 3. In a whole number, trailing
 * zeros are taken as significant, giving the pupil the benefit of the doubt. In standard form, the front number.
 */
function typedSigFigs(text: string): number {
  const m = text.replace(/,/g, '').match(/\d+(?:\.\d*)?|\.\d+/);
  if (!m) return 0;
  const digits = m[0].replace('.', '').replace(/^0+/, '');
  return digits.length;
}

/** x to 3 significant figures as text, keeping trailing zeros (13.0, 5.10) and commas (2,820). */
export function sf3(x: number): string {
  const rounded = Number(x.toPrecision(3));
  if (Math.abs(rounded) >= 100) return fmt(D(rounded));
  const t = rounded.toPrecision(3);
  return t.startsWith('-') ? `−${t.slice(1)}` : t;
}

/** A calculator answer: rounded to 3 significant figures for display, with the exact value for marking. */
export function approx(x: number): { answer: Digits; exact: number; shown: string } {
  return { answer: D(Number(x.toPrecision(3))), exact: x, shown: sf3(x) };
}

/** 10^{17}, 10^{−6}: a power of ten, drawn with a raised index by the quiz panel. */
const tenTo = (n: number) => `10^{${n < 0 ? `−${-n}` : n}}`;

/**
 * A calculator answer to 3 significant figures, shown in standard form (3.98 × 10^{17}) when it is 100,000 or more,
 * or less than 0.001, and as an ordinary number otherwise. The answer is exact Digits, so it never passes through
 * a float's own exponent notation.
 */
export function approxStd(x: number): { answer: Digits; exact: number; shown: string } {
  if (x === 0) return { answer: D(0), exact: 0, shown: '0' };
  const e = Math.floor(Math.log10(Math.abs(x)));
  let mant = Number((x / 10 ** e).toPrecision(3));
  let exp = e;
  if (Math.abs(mant) >= 10) {
    mant /= 10;
    exp += 1;
  }
  const digits = Math.abs(Math.round(mant * 100)).toString().replace(/0+$/, '') || '0';
  const answer: Digits = { digits, top: exp, ...(x < 0 ? { neg: true } : {}) };
  const standard = Math.abs(x) >= 1e5 || Math.abs(x) < 1e-3;
  const m = (Math.abs(mant)).toFixed(2);
  return { answer, exact: x, shown: standard ? `${x < 0 ? '−' : ''}${m} × ${tenTo(exp)}` : sf3(x) };
}

/** Is the typed fraction right? */
export function markFraction(step: FractionStep, text: string): { ok: boolean; feedback: string } {
  const given = readFraction(text);
  if (!given) return { ok: false, feedback: 'Type a fraction such as 7/20.' };
  if (fracEqual(given, step.answer)) {
    if (step.requireMixed && step.answer.n > step.answer.d) {
      const m = text.trim().replace(/\s+/g, ' ').match(/^(\d+) (\d+)\s*\/\s*(\d+)$/);
      if (!m || Number(m[2]) >= Number(m[3])) return { ok: false, feedback: 'That is the right amount. Write it as a mixed number: a whole number and a fraction less than 1, such as 2 4/5.' };
    }
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

/** A unit as shown on screen (units are stored lower case where a pupil may type them so). */
export const unitLabel = (u: string) => (u === '°c' ? '°C' : u);

/** How an answer is shown once done. */
export function answerText(step: Step): string {
  if (step.type === 'number') {
    if (step.plain) return fmt(step.answer).replace(/,/g, '');
    if (step.shown) return `${step.shown}${step.unit ? (step.unit === '%' || step.unit === '°' ? step.unit : ` ${unitLabel(step.unit)}`) : ''}`;
    if (step.unit === '£') return `£${fmt(step.answer)}`;
    return `${fmt(step.answer)}${step.unit ? (step.unit === '%' || step.unit === '°' ? step.unit : ` ${unitLabel(step.unit)}`) : ''}`;
  }
  if (step.type === 'fraction') {
    const { n, d } = step.answer;
    if (step.mixed && n > d && d > 1n) return `${n / d}${n % d ? ` ${n % d}/${d}` : ''}`;
    return fracText(step.answer);
  }
  return step.options[step.correct];
}
