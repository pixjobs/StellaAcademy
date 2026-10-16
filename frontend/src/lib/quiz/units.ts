/**
 * Quiz for "Converting Units" (KAN-89), the first physics quiz: prefixes as powers of ten, standard form,
 * speeds in km/h and m/s, and areas and volumes. Plain metric ladder steps (km, m, cm, mm) are the Measures
 * quiz's job, so they are not asked here. Every answer is exact; no rounding is needed.
 */
import { shift, type Digits } from '@/lib/measures';
import { D, fmt, int, multiply, pick, same, sameNumber, shuffle, toNumber, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';

export type Round = 'prefix' | 'standard' | 'speed' | 'space';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  prefix: { label: 'Prefixes', blurb: 'Kilo, mega and milli: replace the prefix with its power of ten.' },
  standard: { label: 'Standard form', blurb: 'Giga, tera, micro and nano, with the answer in standard form.' },
  speed: { label: 'Speeds', blurb: 'km/h and m/s: convert the distance and the time separately.' },
  space: { label: 'Areas and volumes', blurb: 'Square the length factor for an area, and cube it for a volume.' },
};

export type UnitsCheck =
  | { kind: 'prefix'; value: string; from: string; to: string; answer: string }
  | { kind: 'standard'; value: string; from: string; to: string; a: string; n: number }
  | { kind: 'speed'; value: string; from: 'km/h' | 'm/s'; answer: string }
  | { kind: 'space'; value: string; from: string; to: string; answer: string };
type Question = Q<UnitsCheck>;

/** Examples and practice answers on the lesson page. The quiz never asks these. */
// Both directions: 0.45 A to mA is the 450 mA practice question turned round.
const SHOWN = new Set(['450 mA A', '0.45 A mA', '20 mA A', '0.02 A mA', '650 nm m', '97.5 MHz Hz', '2 m² cm²', '20,000 cm² m²']);
/** Speeds on the page, in m/s: 90 km/h = 25 m/s, 15 m/s = 54 km/h, 72 km/h = 20 m/s. Neither direction is asked. */
const SHOWN_SPEEDS = new Set([25, 15, 20]);

/** 10^{3}, 10^{−6}: a power of ten, drawn with a raised index by the quiz panel. */
const pow = (n: number) => `10^{${n < 0 ? `−${-n}` : n}}`;
/** 1,000 for a power of 3 or −3. */
const factorText = (n: number) => fmt(D(10 ** Math.abs(n)));
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const plain = (d: Digits) => fmt(d).replace(/,/g, '');
/** −9 for a signed whole number, with a proper minus sign. */
const signed = (n: number) => (n < 0 ? `−${-n}` : String(n));

/** A realistic value between lo and hi, to 2 significant figures (sometimes 3, unless it is "about"), never exactly 1. */
function between(r: () => number, lo: number, hi: number, rough = false): Digits {
  for (;;) {
    const x = lo + r() * (hi - lo);
    const d = D(String(parseFloat(x.toPrecision(!rough && r() < 0.2 ? 3 : 2))));
    const v = toNumber(d);
    if (v >= lo && v <= hi && v !== 1) return d;
  }
}

// ---------------------------------------------------------------------------------------------
// Prefixes: kilo, mega, milli, both ways. km, kg and cm are on the Measures ladder, so they are left out here.
// ---------------------------------------------------------------------------------------------

const PREFIX = { k: { name: 'kilo', p: 3 }, M: { name: 'mega', p: 6 }, m: { name: 'milli', p: -3 } } as const;
type PrefixSym = keyof typeof PREFIX;
/** Base units, singular and plural. */
const BASE: Record<string, [string, string]> = { A: ['ampere', 'amperes'], V: ['volt', 'volts'], W: ['watt', 'watts'], J: ['joule', 'joules'], Hz: ['hertz', 'hertz'], g: ['gram', 'grams'] };
/** "a watt", "an ampere". */
const an = (w: string) => `${/^[aeiou]/.test(w) ? 'an' : 'a'} ${w}`;
/**
 * Prefixed units, with a realistic range in the prefixed unit. `target` marks those an answer may be asked in;
 * never both mW and MW, which marking cannot tell apart.
 */
const PREFIXED: { pre: PrefixSym; unit: string; lo: number; hi: number; target: boolean }[] = [
  { pre: 'k', unit: 'W', lo: 0.4, hi: 12, target: true },
  { pre: 'k', unit: 'J', lo: 0.2, hi: 900, target: true },
  { pre: 'k', unit: 'Hz', lo: 0.5, hi: 20, target: true },
  { pre: 'M', unit: 'W', lo: 0.5, hi: 9, target: true },
  { pre: 'M', unit: 'Hz', lo: 0.5, hi: 110, target: true },
  { pre: 'M', unit: 'J', lo: 0.4, hi: 50, target: true },
  { pre: 'm', unit: 'A', lo: 5, hi: 900, target: true },
  { pre: 'm', unit: 'V', lo: 5, hi: 900, target: true },
  { pre: 'm', unit: 'g', lo: 5, hi: 900, target: true },
  { pre: 'm', unit: 'W', lo: 5, hi: 900, target: false },
];

function prefixQuestion(r: () => number): Question {
  for (;;) {
    const { pre, unit, lo, hi, target } = pick(r, PREFIXED);
    const { name, p } = PREFIX[pre];
    const [one, many] = BASE[unit];
    const toBase = !target || r() < 0.55;
    const sym = `${pre}${unit}`;
    const inPrefixed = between(r, lo, hi);
    const inBase = shift(inPrefixed, p);
    const [start, answer] = toBase ? [inPrefixed, inBase] : [inBase, inPrefixed];
    const from = toBase ? sym : unit;
    const to = toBase ? unit : sym;
    const fromName = toBase ? `${name}${one}` : one;
    const toName = toBase ? one : `${name}${one}`;
    const toWords = toBase ? many : sym;
    const v = fmt(start);
    if (SHOWN.has(`${v} ${from} ${to}`)) continue;
    const bigger = (toBase ? p : -p) > 0; // the number gets bigger when the new unit is smaller
    const f = factorText(p);

    // Step 1: the prefix's power of ten. The capital-letter slip (m and M) is always one of the options.
    const twin = p === -3 ? 6 : p === 6 ? -3 : null;
    const distract = shuffle(r, [3, -3, 6, -6, -2, 2, 9].filter((x) => x !== p && x !== twin)).slice(0, twin === null ? 3 : 2);
    const powOptions = shuffle(r, [p, ...(twin === null ? [] : [twin]), ...distract].map(pow));
    const powRight = powOptions.indexOf(pow(p));
    const opOptions = shuffle(r, [`Multiply by ${f}`, `Divide by ${f}`]);
    const opRight = opOptions.indexOf(`${bigger ? 'Multiply' : 'Divide'} by ${f}`);
    const wrongWay = toBase ? shift(inPrefixed, -p) : shift(inBase, p);
    return {
      round: 'prefix',
      prompt: `Convert ${v} ${from} to ${toWords}.`,
      steps: [
        {
          type: 'choice',
          prompt: `What power of ten does the ${pre} in ${sym} stand for?`,
          options: powOptions,
          correct: powRight,
          why: whyAll(powOptions, powRight, (o) =>
            twin !== null && o === pow(twin) ? `Take care with capitals: m is milli, a thousandth, and M is mega, a million. This ${pre} is ${name}.` : `${pre} is ${name}. Look it up in the prefix table: each prefix stands for one power of ten.`,
          ),
        },
        {
          type: 'choice',
          prompt: `To change ${from} into ${to}, do you multiply or divide?`,
          options: opOptions,
          correct: opRight,
          why: { [1 - opRight]: `${cap(an(toName))} is ${bigger ? 'smaller' : 'bigger'} than ${an(fromName)}, so you need ${bigger ? 'more' : 'fewer'} of them: the number gets ${bigger ? 'bigger' : 'smaller'}.` },
        },
        {
          type: 'number',
          prompt: `So what is ${v} ${from} in ${toWords}?`,
          answer,
          unit: to,
          feedback: (g) =>
            same(g, wrongWay) ? `That ${bigger ? 'divides' : 'multiplies'}. The number should get ${bigger ? 'bigger' : 'smaller'}, because ${an(toName)} is ${bigger ? 'smaller' : 'bigger'} than ${an(fromName)}.` : `${bigger ? 'Multiply' : 'Divide'} by ${f}: every digit moves ${Math.abs(p)} places.`,
        },
      ],
      workings: [`${cap(name)} (${pre}) stands for ${pow(p)}, so 1 ${sym} = ${fmt(shift(D(1), p))} ${unit}.`, `${cap(an(toName))} is ${bigger ? 'smaller' : 'bigger'} than ${an(fromName)}, so ${bigger ? 'multiply' : 'divide'} by ${f}.`, `${v} ${from} = ${fmt(answer)} ${to}.`],
      check: { kind: 'prefix', value: plain(start), from, to, answer: plain(answer) },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Standard form: giga, tera, mega, micro, nano to the base unit
// ---------------------------------------------------------------------------------------------

const BIG = { G: { name: 'giga', p: 9 }, T: { name: 'tera', p: 12 }, M: { name: 'mega', p: 6 }, μ: { name: 'micro', p: -6 }, n: { name: 'nano', p: -9 } } as const;
/** Real things, each with a realistic range in the prefixed unit. */
const STANDARD: { pre: keyof typeof BIG; unit: string; what: string; lo: number; hi: number }[] = [
  { pre: 'M', unit: 'W', what: 'A large power station produces', lo: 1200, hi: 3600 },
  { pre: 'G', unit: 'W', what: 'An offshore wind farm can produce', lo: 0.3, hi: 0.9 },
  { pre: 'M', unit: 'Hz', what: 'A mobile phone signal has a frequency of', lo: 700, hi: 3800 },
  { pre: 'G', unit: 'J', what: 'A lightning strike carries about', lo: 1, hi: 5 },
  { pre: 'T', unit: 'W', what: 'The whole world uses electrical power of about', lo: 2.5, hi: 3.5 },
  { pre: 'T', unit: 'W', what: 'A pulse from a powerful laser reaches', lo: 10, hi: 500 },
  { pre: 'M', unit: 'Hz', what: 'An FM radio station broadcasts at', lo: 88, hi: 108 },
  { pre: 'M', unit: 'J', what: 'A car battery stores about', lo: 1.5, hi: 3 },
  { pre: 'μ', unit: 'm', what: 'A human hair is about', lo: 40, hi: 120 },
  { pre: 'μ', unit: 'm', what: 'A red blood cell is about', lo: 6, hi: 8 },
  { pre: 'μ', unit: 'A', what: 'A small sensor draws a current of', lo: 10, hi: 900 },
  { pre: 'n', unit: 'm', what: 'Green light has a wavelength of', lo: 495, hi: 570 },
  { pre: 'n', unit: 'm', what: 'Ultraviolet light has a wavelength of', lo: 100, hi: 400 },
  { pre: 'n', unit: 'm', what: 'A virus is about', lo: 20, hi: 300 },
  { pre: 'n', unit: 's', what: 'One step of a computer chip takes', lo: 0.2, hi: 0.9 },
];
const WORD: Record<string, string> = { W: 'watts', Hz: 'hertz', J: 'joules', m: 'metres', A: 'amperes', s: 'seconds' };

function standardQuestion(r: () => number): Question {
  for (;;) {
    const { pre, unit, what, lo, hi } = pick(r, STANDARD);
    const { name, p } = BIG[pre];
    const start = between(r, lo, hi, what.endsWith('about'));
    const v = fmt(start);
    if (SHOWN.has(`${v} ${pre}${unit} ${unit}`)) continue;
    // a × 10^n with 1 ≤ a < 10: the digits of v with the first one in the units place.
    const k = start.top;
    const a: Digits = { digits: start.digits, top: 0 };
    const n = p + k;
    const tiny = p < 0;
    const powOptions = shuffle(r, [p, -p, p + (p > 0 ? 3 : -3), p - (p > 0 ? 3 : -3)].map(pow));
    const powRight = powOptions.indexOf(pow(p));
    const steps: Step[] = [
      {
        type: 'choice',
        prompt: `What power of ten does the ${pre} in ${pre}${unit} stand for?`,
        options: powOptions,
        correct: powRight,
        why: whyAll(powOptions, powRight, (o) => (o === pow(-p) ? `${pre} is ${name}, a ${tiny ? 'tiny' : 'huge'} prefix, so its power of ten is ${tiny ? 'negative' : 'positive'}.` : `${pre} is ${name}. Look it up in the prefix table.`)),
      },
      {
        type: 'number',
        prompt: `So ${v} ${pre}${unit} = ${v} × ${pow(p)} ${unit}. In standard form, a × 10^{n}, a is at least 1 and less than 10. What is a?`,
        answer: a,
        feedback: (g) => (same(g, start) && k !== 0 ? `${v} is not between 1 and 10. Move the decimal point so exactly one digit, not zero, is in front of it.` : 'Keep the same digits, with exactly one digit, not zero, in front of the decimal point.'),
      },
      {
        type: 'number',
        prompt: 'And what is n?',
        answer: D(n),
        feedback: (g) =>
          sameNumber(g, -n) && n !== 0
            ? `${pre} is ${name}, a ${tiny ? 'tiny' : 'huge'} prefix: check the sign of the power.`
            : k !== 0 && sameNumber(g, p - k)
            ? `That moves the power the wrong way. The front number became ${factorText(k)} times ${k > 0 ? 'smaller' : 'bigger'}, so the power of ten must make up for it: ${k > 0 ? 'add' : 'take away'} ${Math.abs(k)}.`
            : `Write ${v} as a × a power of ten, then add the indices.`,
      },
    ];
    return {
      round: 'standard',
      prompt: `${what} ${v} ${pre}${unit}. Write this in ${WORD[unit]}, in standard form.`,
      steps,
      workings: [
        `${cap(name)} (${pre}) stands for ${pow(p)}, so ${v} ${pre}${unit} = ${v} × ${pow(p)} ${unit}.`,
        k === 0 ? `${v} is already between 1 and 10.` : `${v} = ${fmt(a)} × ${pow(k)}, so the power is ${signed(p)} ${k > 0 ? '+' : '−'} ${Math.abs(k)} = ${signed(n)}.`,
        `So ${v} ${pre}${unit} = ${fmt(a)} × ${pow(n)} ${unit}.`,
      ],
      check: { kind: 'standard', value: plain(start), from: `${pre}${unit}`, to: unit, a: plain(a), n },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Speeds: km/h and m/s
// ---------------------------------------------------------------------------------------------

/** Who is moving, and a realistic speed range in m/s. */
const MOVERS: { who: string; lo: number; hi: number }[] = [
  { who: 'A high-speed train', lo: 40, hi: 85 },
  { who: 'A car on a motorway', lo: 26, hi: 31 },
  { who: 'A cyclist', lo: 5, hi: 12 },
  { who: 'A gust of wind', lo: 10, hi: 40 },
  { who: 'A sprinter', lo: 8, hi: 12 },
  { who: 'A cheetah', lo: 25, hi: 30 },
  { who: 'A plane on its take-off run', lo: 60, hi: 80 },
  { who: 'A person jogging', lo: 2, hi: 4 },
];
const SECONDS_FEEDBACK = (g: Digits) => (sameNumber(g, 60) ? '60 is the number of minutes in an hour, and each minute has 60 seconds.' : 'An hour is 60 minutes, and each minute is 60 seconds.');
const near = (g: Digits, x: number) => Math.abs(toNumber(g) - x) < 0.01;

function speedQuestion(r: () => number): Question {
  for (;;) {
    const { who, lo, hi } = pick(r, MOVERS);
    const ms = int(r, lo, hi);
    const kmh = multiply(D(ms), D('3.6'));
    const toMs = r() < 0.5;
    if (SHOWN_SPEEDS.has(ms)) continue;
    if (toMs) {
      const perHour = multiply(kmh, D(1000));
      return {
        round: 'speed',
        prompt: `${who} travels at ${fmt(kmh)} km/h. What is this speed in m/s?`,
        steps: [
          { type: 'number', prompt: `In one hour it travels ${fmt(kmh)} km. How many metres is that?`, answer: perHour, unit: 'm', feedback: () => '1 km is 1,000 m.' },
          { type: 'number', prompt: 'How many seconds are there in one hour?', answer: D(3600), unit: 's', feedback: SECONDS_FEEDBACK },
          {
            type: 'number',
            prompt: 'So how many metres does it travel each second?',
            answer: D(ms),
            unit: 'm/s',
            feedback: (g) =>
              near(g, toNumber(perHour) / 60)
                ? 'That divides by 60, which gives metres per minute. Divide by the seconds in an hour.'
                : near(g, toNumber(kmh) * 3.6)
                  ? 'That multiplies by 3.6. Going from km/h to m/s the number gets smaller.'
                  : 'Divide the metres in one hour by the seconds in one hour.',
          },
        ],
        workings: [`${fmt(kmh)} km = ${fmt(perHour)} m, and 1 hour = 3,600 s.`, `${fmt(perHour)} ÷ 3,600 = ${ms}, so the speed is ${ms} m/s.`, `The shortcut: ${fmt(kmh)} ÷ 3.6 = ${ms}.`],
        check: { kind: 'speed', value: plain(kmh), from: 'km/h', answer: String(ms) },
      };
    }
    const metres = D(ms * 3600);
    return {
      round: 'speed',
      prompt: `${who} moves at ${ms} m/s. What is this speed in km/h?`,
      steps: [
        { type: 'number', prompt: 'How many seconds are there in one hour?', answer: D(3600), unit: 's', feedback: SECONDS_FEEDBACK },
        { type: 'number', prompt: `It goes ${ms} m every second. How many metres is that in one hour?`, answer: metres, unit: 'm', feedback: (g) => (sameNumber(g, ms * 60) ? 'That is one minute. An hour has 3,600 seconds.' : 'Multiply the metres each second by the seconds in an hour.') },
        {
          type: 'number',
          prompt: 'And how many kilometres is that? That is its speed in km/h.',
          answer: kmh,
          unit: 'km/h',
          feedback: (g) => (same(g, metres) ? 'That is still in metres. 1 km is 1,000 m.' : near(g, ms / 3.6) ? 'That divides by 3.6. Going from m/s to km/h the number gets bigger.' : 'Divide the metres by 1,000 to get kilometres.'),
        },
      ],
      workings: [`In one hour (3,600 s) it goes ${ms} × 3,600 = ${fmt(metres)} m.`, `${fmt(metres)} m = ${fmt(kmh)} km, so the speed is ${fmt(kmh)} km/h.`, `The shortcut: ${ms} × 3.6 = ${fmt(kmh)}.`],
      check: { kind: 'speed', value: String(ms), from: 'm/s', answer: plain(kmh) },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Areas and volumes
// ---------------------------------------------------------------------------------------------

/** Pairs of units: the bigger, the smaller, how many of the smaller are in one of the bigger, and the length factor behind it. */
type Pair = { big: string; small: string; power: number; length?: { small: string; big: string; factor: number; dim: 2 | 3 } };
const M2: Pair = { big: 'm²', small: 'cm²', power: 4, length: { small: 'centimetres', big: 'metre', factor: 100, dim: 2 } };
const CM2: Pair = { big: 'cm²', small: 'mm²', power: 2, length: { small: 'millimetres', big: 'centimetre', factor: 10, dim: 2 } };
const M3: Pair = { big: 'm³', small: 'cm³', power: 6, length: { small: 'centimetres', big: 'metre', factor: 100, dim: 3 } };
const M3L: Pair = { big: 'm³', small: 'litres', power: 3 };
const LCM3: Pair = { big: 'litres', small: 'cm³', power: 3 };
/** Real things, with a realistic size in the unit the question starts in. */
const SPACES: { pair: Pair; toSmall: boolean; what: string; lo: number; hi: number }[] = [
  { pair: M2, toSmall: true, what: 'A solar panel has an area of', lo: 1.2, hi: 2.4 },
  { pair: M2, toSmall: true, what: 'A classroom whiteboard has an area of', lo: 1.5, hi: 4 },
  { pair: M2, toSmall: false, what: 'A sheet of card has an area of', lo: 300, hi: 2000 },
  { pair: M2, toSmall: false, what: 'A laptop screen has an area of', lo: 400, hi: 800 },
  { pair: CM2, toSmall: true, what: 'A postage stamp has an area of', lo: 4, hi: 9 },
  { pair: CM2, toSmall: true, what: 'A phone camera sensor has an area of', lo: 0.2, hi: 0.5 },
  { pair: CM2, toSmall: false, what: 'A computer chip has an area of', lo: 50, hi: 800 },
  { pair: CM2, toSmall: false, what: 'A fingernail has an area of', lo: 80, hi: 150 },
  { pair: M3, toSmall: true, what: 'A storage box has a volume of', lo: 0.02, hi: 0.5 },
  { pair: M3, toSmall: false, what: 'A rock sample has a volume of', lo: 200, hi: 5000 },
  { pair: M3, toSmall: false, what: 'A brick has a volume of', lo: 1500, hi: 2500 },
  { pair: M3L, toSmall: true, what: 'A water tank holds', lo: 0.5, hi: 5 },
  { pair: M3L, toSmall: true, what: 'A swimming pool holds', lo: 50, hi: 500 },
  { pair: M3L, toSmall: false, what: 'A fish tank holds', lo: 50, hi: 400 },
  { pair: M3L, toSmall: false, what: 'A bath holds', lo: 150, hi: 300 },
  { pair: LCM3, toSmall: true, what: 'A drinks bottle holds', lo: 0.33, hi: 2 },
  { pair: LCM3, toSmall: false, what: 'A cup holds', lo: 200, hi: 350 },
  { pair: LCM3, toSmall: false, what: 'A can of drink holds', lo: 250, hi: 500 },
];
const one = (u: string) => (u === 'litres' ? 'litre' : u);

function spaceQuestion(r: () => number): Question {
  for (;;) {
    const { pair, toSmall, what, lo, hi } = pick(r, SPACES);
    const start = between(r, lo, hi);
    const places = toSmall ? pair.power : -pair.power;
    const answer = shift(start, places);
    const from = toSmall ? pair.big : pair.small;
    const to = toSmall ? pair.small : pair.big;
    const v = fmt(start);
    if (SHOWN.has(`${v} ${from} ${to}`)) continue;
    const factor = D(10 ** pair.power);
    const F = fmt(factor);
    const opOptions = shuffle(r, [`Multiply by ${F}`, `Divide by ${F}`]);
    const opRight = opOptions.indexOf(`${toSmall ? 'Multiply' : 'Divide'} by ${F}`);
    const wrongWay = shift(start, -places);
    const L = pair.length;
    const steps: Step[] = [];
    if (L) {
      steps.push(
        { type: 'number', prompt: `How many ${L.small} are in 1 ${L.big}?`, answer: D(L.factor), unit: L.small === 'centimetres' ? 'cm' : 'mm', feedback: () => (L.factor === 100 ? 'Centi means a hundredth: a centimetre is a hundredth of a metre.' : 'Look at a ruler: count the millimetre marks in one centimetre.') },
        {
          type: 'number',
          prompt: `So how many ${pair.small} are in 1 ${pair.big}?`,
          answer: factor,
          unit: pair.small,
          feedback: (g) =>
            sameNumber(g, L.factor)
              ? `That is the length factor. A ${L.dim === 2 ? 'square' : 'cube'} 1 ${L.big} across is ${L.factor} ${L.small} ${L.dim === 2 ? 'by' : 'by'} ${L.factor}${L.dim === 3 ? ` by ${L.factor}` : ''}: ${L.dim === 2 ? 'square' : 'cube'} it.`
              : L.dim === 3 && sameNumber(g, L.factor * L.factor)
                ? `That squares it, which is for an area. A cube has three lengths: multiply by ${L.factor} three times.`
                : `${L.dim === 2 ? 'Square' : 'Cube'} the length factor.`,
        },
      );
    } else {
      steps.push({
        type: 'number',
        prompt: `How many ${pair.small} are in 1 ${one(pair.big)}?`,
        answer: factor,
        unit: pair.small,
        feedback: (g) =>
          pair.big === 'm³' && sameNumber(g, 1000000)
            ? 'That is the number of cm³ in 1 m³. A litre is much bigger than 1 cm³, so fewer litres fill a cubic metre.'
            : pair.big === 'm³'
              ? 'See "Areas and volumes" in the notes: how many litres fill a cubic metre?'
              : 'See "Areas and volumes" in the notes: how many cm³ fill one litre?',
      });
    }
    steps.push(
      { type: 'choice', prompt: `To change ${from} into ${to}, do you multiply or divide?`, options: opOptions, correct: opRight, why: { [1 - opRight]: toSmall ? `The new unit, ${to}, is smaller, so you need more of them: multiply.` : `The new unit, ${to}, is bigger, so you need fewer of them: divide.` } },
      {
        type: 'number',
        prompt: `So what is ${v} ${from} in ${to}?`,
        answer,
        unit: to,
        feedback: (g) =>
          L && same(g, shift(start, (toSmall ? 1 : -1) * Math.log10(L.factor)))
            ? `That uses the length factor, ${L.factor}. For ${L.dim === 2 ? 'an area' : 'a volume'} use ${F}.`
            : L?.dim === 3 && same(g, shift(start, (toSmall ? 2 : -2) * Math.log10(L.factor)))
              ? `That uses ${fmt(D(L.factor * L.factor))}, the factor for an area. For a volume use ${F}.`
              : same(g, wrongWay)
                ? `That ${toSmall ? 'divides' : 'multiplies'}. The number should get ${toSmall ? 'bigger' : 'smaller'}.`
                : `${toSmall ? 'Multiply' : 'Divide'} by ${F}.`,
      },
    );
    return {
      round: 'space',
      prompt: `${what} ${v} ${from}. What is this in ${to}?`,
      steps,
      workings: [
        L ? `1 ${L.big} = ${L.factor} ${L.small}, so 1 ${pair.big} = ${Array(L.dim).fill(L.factor).join(' × ')} = ${F} ${pair.small}.` : `1 ${one(pair.big)} = ${F} ${pair.small}.`,
        `${v} ${toSmall ? '×' : '÷'} ${F} = ${fmt(answer)}.`,
        `So ${v} ${from} = ${fmt(answer)} ${to}.`,
      ],
      check: { kind: 'space', value: plain(start), from, to, answer: plain(answer) },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'standard') return standardQuestion(r);
  if (round === 'speed') return speedQuestion(r);
  if (round === 'space') return spaceQuestion(r);
  return prefixQuestion(r);
}

export const unitsQuiz: LessonQuiz<UnitsCheck> = {
  lesson: 'units',
  storageKey: 'stella-quiz-units-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
