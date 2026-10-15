/**
 * Quiz for "Fractions, Decimals and Percentages" (KAN-71): converting, percentages of amounts, comparing.
 * Year 5 and 6. Built on the shared engine in lib/quiz/core.ts; every number is exact.
 */
import { fmt, D, F, divide, gcd, int, multiply, pick, sameNumber, shuffle, simplify, whyAll, fracText, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';
import type { Digits } from '@/lib/measures';

export type Round = 'convert' | 'amount' | 'compare';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  convert: { label: 'Convert', blurb: 'Fractions, decimals and percentages: change one into another, one step at a time.' },
  amount: { label: 'Percentage of an amount', blurb: 'Build it from 10%, 5%, a half and a quarter. Includes money and measures.' },
  compare: { label: 'Compare', blurb: 'Write amounts the same way, as percentages, then pick one.' },
};

/** For the automatic check (scripts/content-checks/quiz): what was asked, and the final answer as text. */
export type DPCheck =
  | { kind: 'f2p'; n: number; d: number; answer: string }
  | { kind: 'd2p'; x: string; answer: string }
  | { kind: 'p2d'; p: number; answer: string }
  | { kind: 'p2f'; p: number; answer: string }
  | { kind: 'amount'; p: number; a: number; answer: string }
  | { kind: 'discount'; p: number; a: number; answer: string }
  | { kind: 'compare'; values: string[]; largest: boolean; answer: string };
type Question = Q<DPCheck>;

/**
 * Examples shown on the lesson page (the idea, the worked example, the notes and their table), whose
 * answers can be read there. The quiz never asks these.
 */
const SHOWN = new Set([
  'f2p 1/2', 'f2p 1/4', 'f2p 3/4', 'f2p 1/5', 'f2p 1/10', 'f2p 3/5',
  'd2p 0.5', 'd2p 0.25', 'd2p 0.75', 'd2p 0.2', 'd2p 0.1', 'd2p 0.01', 'd2p 0.65', 'd2p 0.37',
  'p2d 50', 'p2d 25', 'p2d 75', 'p2d 20', 'p2d 10', 'p2d 1', 'p2d 42', 'p2d 37',
  'p2f 50', 'p2f 25', 'p2f 75', 'p2f 20', 'p2f 10',
  'amount 25 40', 'amount 15 60', 'amount 75 600', 'amount 20 50',
  'compare 0.3 1/4 28%',
]);

const num = (d: Digits) => Number(fmt(d).replace(/,/g, ''));

/** The "how far do the digits move" step, as a choice so it is not always the same typed answer. */
function digitsStep(r: () => number, multiplying: boolean): Step {
  const right = `Two places to the ${multiplying ? 'left' : 'right'}`;
  const options = shuffle(r, ['One place to the left', 'Two places to the left', 'Two places to the right', 'Three places to the right']);
  const correct = options.indexOf(right);
  return {
    type: 'choice',
    prompt: `${multiplying ? 'Multiplying' : 'Dividing'} by 100: which way, and how far, do the digits move?`,
    options,
    correct,
    why: whyAll(options, correct, () => `100 has two zeros, so the digits move two places. ${multiplying ? 'Multiplying makes a number bigger: the digits move left.' : 'Dividing makes a number smaller: the digits move right.'}`),
  };
}

// ---------------------------------------------------------------------------------------------
// Convert
// ---------------------------------------------------------------------------------------------

function fractionToPercent(r: () => number): Question {
  let d: number;
  let n: number;
  do {
    d = pick(r, [2, 4, 5, 10, 20, 25, 50]);
    n = int(r, 1, d - 1);
  } while (gcd(BigInt(n), BigInt(d)) !== 1n || SHOWN.has(`f2p ${n}/${d}`));
  const k = 100 / d;
  const top = n * k;
  const joined = Number(`${n}${d}`); // the classic slip: 3/5 read as 35%
  const options = shuffle(r, [...new Set([`${top}%`, `${joined}%`, `${n}%`, `${top / 10}%`])]);
  const correct = options.indexOf(`${top}%`);
  return {
    round: 'convert',
    prompt: `Write ${n}/${d} as a percentage.`,
    steps: [
      { type: 'number', prompt: `What do you multiply ${d} by to make 100?`, answer: D(k), feedback: () => `Work out 100 ÷ ${d}.` },
      {
        type: 'number',
        prompt: `Multiply the top by ${k} too. ${n}/${d} = ?/100`,
        answer: D(top),
        feedback: (g) =>
          sameNumber(g, joined) && joined !== top
            ? `${n}/${d} is not ${joined}/100: the top and bottom are not just written next to each other. Multiply the top by ${k}.`
            : sameNumber(g, n)
              ? `The top changes as well: multiply ${n} by ${k}.`
              : `Work out ${n} × ${k}.`,
      },
      {
        type: 'choice',
        prompt: `So which percentage is the same as ${n}/${d}?`,
        options,
        correct,
        why: whyAll(options, correct, (o) =>
          o === `${joined}%` ? `${n}/${d} is not ${joined}%. Per cent means out of 100, so use the top of your fraction out of 100.` : `Per cent means out of 100. Use the top of your fraction out of 100.`,
        ),
      },
    ],
    workings: [`${d} × ${k} = 100, so multiply the top and the bottom by ${k}.`, `${n}/${d} = ${top}/100.`, `So ${n}/${d} = ${top}%.`],
    check: { kind: 'f2p', n, d, answer: `${top}%` },
  };
}

function decimalToPercent(r: () => number): Question {
  let x: string;
  do x = r() < 0.4 ? `0.${int(r, 1, 9)}` : `0.${String(int(r, 1, 99)).padStart(2, '0')}`.replace(/0$/, '');
  while (SHOWN.has(`d2p ${x}`));
  const answer = multiply(D(x), D(100));
  const a = fmt(answer);
  return {
    round: 'convert',
    prompt: `Write ${x} as a percentage.`,
    steps: [
      {
        type: 'choice',
        prompt: 'To change a decimal into a percentage, do you multiply or divide by 100?',
        options: ['Multiply', 'Divide'],
        correct: 0,
        why: { 1: 'Per cent means out of 100. A percentage is the number of hundredths, so multiply by 100.' },
      },
      digitsStep(r, true),
      {
        type: 'number',
        prompt: `So what is ${x} as a percentage?`,
        answer,
        unit: '%',
        feedback: (g) =>
          sameNumber(g, num(multiply(D(x), D(10))))
            ? `That is 10 times too small. ${x} is a number of hundredths: the digits move two places.`
            : sameNumber(g, num(multiply(D(x), D(1000))))
              ? 'That is 10 times too big: the digits move two places, not three.'
              : `Multiply ${x} by 100.`,
      },
    ],
    workings: [`Per cent means out of 100, so multiply by 100.`, `${x} × 100 = ${a}: every digit moves two places to the left.`, `So ${x} = ${a}%.`],
    check: { kind: 'd2p', x, answer: `${a}%` },
  };
}

function percentToDecimal(r: () => number): Question {
  let p: number;
  do p = int(r, 1, 99);
  while (SHOWN.has(`p2d ${p}`));
  const answer = divide(D(p), D(100))!;
  const a = fmt(answer);
  return {
    round: 'convert',
    prompt: `Write ${p}% as a decimal.`,
    steps: [
      {
        type: 'choice',
        prompt: 'To change a percentage into a decimal, do you multiply or divide by 100?',
        options: ['Multiply', 'Divide'],
        correct: 1,
        why: { 0: `${p}% means ${p} out of 100, which is ${p} hundredths. To go back from hundredths, divide by 100.` },
      },
      digitsStep(r, false),
      {
        type: 'number',
        prompt: `So what is ${p}% as a decimal?`,
        answer,
        feedback: (g) =>
          sameNumber(g, num(divide(D(p), D(10))!))
            ? `That is 10 times too big. ${p}% is ${p} hundredths: the digits move two places to the right.`
            : `Divide ${p} by 100. Put in a zero to hold the tenths place if you need to.`,
      },
    ],
    workings: [`${p}% means ${p} out of 100, so divide by 100.`, `${p} ÷ 100 = ${a}: every digit moves two places to the right.`, `So ${p}% = ${a}.`],
    check: { kind: 'p2d', p, answer: a },
  };
}

function percentToFraction(r: () => number): Question {
  let p: number;
  do p = int(r, 2, 98);
  while (gcd(BigInt(p), 100n) === 1n || SHOWN.has(`p2f ${p}`));
  const g = Number(gcd(BigInt(p), 100n));
  const simple = simplify(F(p, 100));
  return {
    round: 'convert',
    prompt: `Write ${p}% as a fraction in its simplest form.`,
    steps: [
      { type: 'fraction', prompt: `Write ${p}% as a fraction out of 100.`, answer: F(p, 100), simplest: false, denominator: 100n, feedback: () => `Per cent means out of 100, so ${p}% is ${p} over 100.` },
      {
        type: 'number',
        prompt: `What is the biggest number that divides into both ${p} and 100?`,
        answer: D(g),
        feedback: (x) => {
          const v = num(x);
          if (v === 1) return '1 divides into every number. Look for a bigger number that divides into both.';
          if (Number.isInteger(v) && v > 0 && p % v === 0 && 100 % v === 0) return `${v} divides into both, but a bigger number does too.`;
          return `${fmt(x)} does not divide into both ${p} and 100. Try 2, 4, 5, 10, 20, 25 or 50.`;
        },
      },
      {
        type: 'fraction',
        prompt: `Divide the top and bottom by ${g}. What is ${p}% in its simplest form?`,
        answer: simple,
        simplest: true,
        feedback: () => `Work out ${p} ÷ ${g} and 100 ÷ ${g}.`,
      },
    ],
    workings: [`${p}% = ${p}/100.`, `${g} is the biggest number that divides into ${p} and 100.`, `${p} ÷ ${g} = ${simple.n} and 100 ÷ ${g} = ${simple.d}, so ${p}% = ${fracText(simple)}.`],
    check: { kind: 'p2f', p, answer: fracText(simple) },
  };
}

// ---------------------------------------------------------------------------------------------
// Percentage of an amount
// ---------------------------------------------------------------------------------------------

type Context = { ask: (p: number, a: number) => string; unit?: string; money: boolean };
const CONTEXTS: Context[] = [
  { ask: (p, a) => `What is ${p}% of ${a}?`, money: false },
  { ask: (p, a) => `A water tank holds ${a} litres. ${p}% of it is used. How many litres is that?`, unit: 'litres', money: false },
  { ask: (p, a) => `A rover must drive ${a} km. It has done ${p}% of the drive. How far is that?`, unit: 'km', money: false },
  { ask: (p, a) => `A bag of flour holds ${a} g. A recipe uses ${p}% of it. How many grams is that?`, unit: 'g', money: false },
  { ask: (p, a) => `A bike costs £${a}. A shop takes ${p}% off. How much is taken off?`, unit: '£', money: true },
];

function percentOfAmount(r: () => number): Question {
  let p: number;
  let a: number;
  do {
    p = pick(r, [5, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95]);
    a = 20 * int(r, 1, 40);
  } while (SHOWN.has(`amount ${p} ${a}`));
  const ctx = pick(r, CONTEXTS);
  const discount = ctx.money && r() < 0.5;
  const part = (q: number) => D((a * q) / 100); // exact: a is a multiple of 20
  const result = part(p);
  const show = (v: string | number) => (ctx.money ? `£${v}` : ctx.unit ? `${v} ${ctx.unit}` : String(v));
  const money = ctx.money ? '£' : undefined;
  // The classic slip, caught on every step: dividing the amount by the percentage instead of building it up.
  const byP = divide(D(a), D(p));
  const slip = (g: Digits, hint: string) => (byP && sameNumber(g, num(byP)) && num(byP) !== num(part(10)) ? `It looks like you divided ${a} by ${p}. ${hint}` : hint);
  const steps: Step[] = [];
  const workings: string[] = [];

  if (p === 25 || p === 50 || p === 75) {
    const frac = p === 50 ? '1/2' : p === 25 ? '1/4' : '3/4';
    const options = shuffle(r, ['1/2', '1/4', '3/4', '1/5']);
    steps.push({ type: 'choice', prompt: `${p}% is the same as which fraction?`, options, correct: options.indexOf(frac), why: whyAll(options, options.indexOf(frac), () => `${p}% is ${p}/100. Simplify it.`) });
    if (p === 50) {
      steps.push({ type: 'number', prompt: `So what is half of ${show(a)}?`, answer: result, unit: ctx.unit, feedback: (g) => slip(g, `Divide ${a} by 2.`) });
      workings.push(`50% is a half.`, `${a} ÷ 2 = ${fmt(result)}.`);
    } else {
      steps.push({ type: 'number', prompt: `What is a quarter of ${show(a)}? Halve it, then halve it again.`, answer: part(25), unit: p === 25 ? ctx.unit : money, feedback: (g) => slip(g, `Halve ${a}, then halve the answer.`) });
      workings.push(`25% is a quarter: ${a} ÷ 4 = ${fmt(part(25))}.`);
      if (p === 75) {
        steps.push({ type: 'number', prompt: `75% is three quarters. So what is 75% of ${show(a)}?`, answer: result, unit: ctx.unit, feedback: (g) => slip(g, `Three lots of your quarter.`) });
        workings.push(`75% is three quarters: 3 × ${fmt(part(25))} = ${fmt(result)}.`);
      }
    }
  } else {
    const tens = Math.floor(p / 10);
    const five = p % 10 === 5;
    steps.push({ type: 'number', prompt: `What is 10% of ${show(a)}?`, answer: part(10), unit: money, feedback: (g) => slip(g, `10% is one tenth, so divide ${a} by 10.`) });
    workings.push(`10% of ${a} = ${a} ÷ 10 = ${fmt(part(10))}.`);
    if (tens >= 2) {
      steps.push({ type: 'number', prompt: `So what is ${tens * 10}% of ${show(a)}?`, answer: part(tens * 10), unit: five ? money : ctx.unit, feedback: (g) => slip(g, `${tens * 10}% is ${tens} lots of 10%.`) });
      workings.push(`${tens * 10}% = ${tens} × ${fmt(part(10))} = ${fmt(part(tens * 10))}.`);
    }
    if (five) {
      steps.push({ type: 'number', prompt: `What is 5% of ${show(a)}?`, answer: part(5), unit: tens === 0 ? ctx.unit : money, feedback: (g) => slip(g, `5% is half of 10%.`) });
      workings.push(`5% is half of 10%: ${fmt(part(5))}.`);
      if (tens >= 1) {
        steps.push({ type: 'number', prompt: `So what is ${p}% of ${show(a)}?`, answer: result, unit: ctx.unit, feedback: (g) => slip(g, `Add the parts you found.`) });
        workings.push(`${p}% = ${fmt(part(tens * 10))} + ${fmt(part(5))} = ${fmt(result)}.`);
      }
    }
  }

  let answer = show(fmt(result));
  if (discount) {
    const price = D((a * (100 - p)) / 100); // a whole number: a is a multiple of 20, p of 5
    steps.push({ type: 'number', prompt: `So what is the sale price?`, answer: price, unit: '£', feedback: () => `Take the amount off the price of £${a}.` });
    workings.push(`Sale price: £${a} − £${fmt(result)} = £${fmt(price)}.`);
    answer = `£${fmt(price)}`;
  }
  workings.push(discount ? `So the bike costs ${answer} in the sale.` : `So ${p}% of ${show(a)} is ${answer}.`);

  return {
    round: 'amount',
    prompt: discount ? `A bike costs £${a}. A shop takes ${p}% off. What is the sale price?` : ctx.ask(p, a),
    steps,
    workings,
    check: discount ? { kind: 'discount', p, a, answer } : { kind: 'amount', p, a, answer },
  };
}

// ---------------------------------------------------------------------------------------------
// Compare
// ---------------------------------------------------------------------------------------------

/** "0.6" from 60 (a percentage, as hundredths). */
const asDecimal = (pc: number) => fmt(divide(D(pc), D(100))!);

function compareQuestion(r: () => number): Question {
  for (;;) {
    // Half the time two decimals of different lengths, to tackle "the decimal with more digits is bigger".
    const twoDecimals = r() < 0.5;
    let firstForm: string;
    let firstPc: number;
    if (twoDecimals) {
      firstPc = int(r, 3, 9) * 10; // 0.3 to 0.9: one decimal place
      firstForm = asDecimal(firstPc);
    } else {
      const d = pick(r, [2, 4, 5, 8, 10, 20, 25]);
      const n = int(r, 1, d - 1);
      if (gcd(BigInt(n), BigInt(d)) !== 1n) continue;
      firstPc = num(divide(D(n * 100), D(d))!);
      firstForm = `${n}/${d}`;
    }
    const second = twoDecimals ? int(r, 11, 99) : int(r, 1, 19) * 5; // a two-place decimal, or a multiple of 0.05
    if (twoDecimals && second % 10 === 0) continue;
    if (twoDecimals && firstPc < second) continue; // the trap: the shorter decimal is the bigger one
    const x = asDecimal(second);
    const pp = int(r, 5, 95);
    const pcs = [firstPc, second, pp];
    if (new Set(pcs).size < 3 || Math.max(...pcs) - Math.min(...pcs) > 30) continue;
    const forms = [firstForm, x, `${pp}%`];
    if (SHOWN.has(`compare ${forms.join(' ')}`)) continue;
    const largest = r() < 0.6;
    const target = pcs.indexOf(largest ? Math.max(...pcs) : Math.min(...pcs));
    const options = shuffle(r, forms);
    const correct = options.indexOf(forms[target]);
    const word = largest ? 'largest' : 'smallest';
    const list = `${pcs[0]}%, ${pcs[1]}% and ${pcs[2]}%`;
    const fc = firstForm;
    const fp = firstPc;
    const firstStep: Step = twoDecimals
      ? { type: 'number', prompt: `Write ${fc} as a percentage.`, answer: D(fp), unit: '%', feedback: (g) => (sameNumber(g, fp / 10) ? `That is 10 times too small: ${fc} is a number of hundredths, so the digits move two places.` : `Multiply ${fc} by 100.`) }
      : {
          type: 'number',
          prompt: `Write ${fc} as a percentage.`,
          answer: D(fp),
          unit: '%',
          feedback: () => (fc.endsWith('/8') ? `Work out ${fc.split('/')[0]} ÷ 8, then multiply by 100.` : `Make the bottom 100: what do you multiply ${fc.split('/')[1]} by?`),
        };
    return {
      round: 'compare',
      prompt: `Which is ${word}: ${shuffle(r, forms).join(', ').replace(/, ([^,]*)$/, ' or $1')}?`,
      steps: [
        firstStep,
        {
          type: 'number',
          prompt: `Write ${x} as a percentage.`,
          answer: D(second),
          unit: '%',
          feedback: (g) => (sameNumber(g, second / 10) ? `That is 10 times too small: ${x} is a number of hundredths.` : `Multiply ${x} by 100.`),
        },
        {
          type: 'choice',
          prompt: `So which is ${word}?`,
          options,
          correct,
          why: whyAll(options, correct, (o) =>
            twoDecimals && o === x && largest
              ? `${x} has more digits, but that does not make it bigger: ${fc} is ${fp} hundredths and ${x} is ${second} hundredths. Compare ${list}.`
              : `Compare the percentages you found: ${list}.`,
          ),
        },
      ],
      workings: [`${fc} = ${fp}%.`, `${x} = ${second}%.`, `Comparing ${list}, the ${word} is ${forms[target]}.`],
      check: { kind: 'compare', values: forms, largest, answer: forms[target] },
    };
  }
}

/** One generated question for the round. */
export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'amount') return percentOfAmount(r);
  if (round === 'compare') return compareQuestion(r);
  return pick(r, [fractionToPercent, decimalToPercent, percentToDecimal, percentToFraction])(r);
}

export const decimalsPercentagesQuiz: LessonQuiz<DPCheck> = {
  lesson: 'decimals-percentages',
  storageKey: 'stella-quiz-decimals-percentages-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
