/**
 * Quiz for "Negative Numbers" (KAN-77): adding and subtracting, intervals across zero, multiplying and
 * dividing. Year 6 to key stage 3. Built on lib/quiz/core.ts; negative answers can be typed with - or −.
 */
import { D, fmt, int, pick, sameNumber, shuffle, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';

export type Round = 'add' | 'zero' | 'multiply';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  add: { label: 'Add and subtract', blurb: 'Move along the number line, including adding and taking away negative numbers.' },
  zero: { label: 'Across zero', blurb: 'Differences between temperatures and heights above and below zero.' },
  multiply: { label: 'Multiply and divide', blurb: 'Work out the size, then decide the sign.' },
};

export type NegativeCheck =
  | { kind: 'add'; a: number; op: '+' | '−'; b: number; answer: number }
  | { kind: 'zero'; low: number; high: number; answer: number }
  | { kind: 'mul'; a: number; op: '×' | '÷'; b: number; answer: number };
type Question = Q<NegativeCheck>;

/** Examples shown on the lesson page. The quiz never asks these. */
const SHOWN = new Set(['add -4 + 6', 'add 4 − 9', 'add 6 + -2', 'add -2 − -5', 'zero -8 5', 'mul 2 × 6', 'mul -2 × -6', 'mul 2 × -6', 'mul -12 ÷ -4', 'mul 12 ÷ -4', 'mul -1.5 × 4', 'mul -3 × -4']);

/** −5 with a proper minus sign. */
const sn = (x: number) => (x < 0 ? `−${fmt(D(-x))}` : fmt(D(x)));
/** (−5) in brackets when it follows an operation sign. */
const br = (x: number) => (x < 0 ? `(${sn(x)})` : sn(x));
const nonZero = (r: () => number, lo: number, hi: number) => {
  for (;;) {
    const x = int(r, lo, hi);
    if (x !== 0) return x;
  }
};

// ---------------------------------------------------------------------------------------------
// Add and subtract
// ---------------------------------------------------------------------------------------------

function addSub(r: () => number): Question {
  for (;;) {
    const a = nonZero(r, -12, 12);
    const b = nonZero(r, -12, 12);
    const op = pick(r, ['+', '−'] as const);
    if (a > 0 && b > 0 && op === '+') continue; // at least one negative, or a subtraction that crosses zero
    if (a > 0 && b > 0 && op === '−' && b <= a) continue;
    if (SHOWN.has(`add ${a} ${op} ${b}`)) continue;
    const answer = op === '+' ? a + b : a - b;
    const expr = `${sn(a)} ${op} ${br(b)}`;
    const move = op === '+' ? b : -b; // the move along the number line
    const steps: Step[] = [];
    const workings: string[] = [];
    if (b < 0) {
      // Two signs together: rewrite first.
      const right = op === '+' ? `${sn(a)} − ${-b}` : `${sn(a)} + ${-b}`;
      const wrongs = op === '+' ? [`${sn(a)} + ${-b}`, `${sn(-a)} − ${-b}`] : [`${sn(a)} − ${-b}`, `${sn(-a)} + ${-b}`];
      const options = shuffle(r, [...new Set([right, ...wrongs])]);
      const correct = options.indexOf(right);
      steps.push({
        type: 'choice',
        prompt: `${expr} is the same as which of these?`,
        options,
        correct,
        why: whyAll(options, correct, () => (op === '−' ? 'Taking away a negative number is the same as adding: the two minus signs make a plus.' : 'Adding a negative number is the same as taking away.')),
      });
      workings.push(`${expr} is the same as ${right}.`);
    }
    const direction = move > 0 ? 'Right' : 'Left';
    const dirOptions = shuffle(r, [`Right, ${Math.abs(move)} places`, `Left, ${Math.abs(move)} places`]);
    const dirCorrect = dirOptions.indexOf(`${direction}, ${Math.abs(move)} places`);
    steps.push({
      type: 'choice',
      prompt: `Start at ${sn(a)} on the number line. Which way do you move, and how far?`,
      options: dirOptions,
      correct: dirCorrect,
      why: whyAll(dirOptions, dirCorrect, () => (op === '−' && b < 0 ? 'Taking away a negative makes the answer bigger: move right.' : move > 0 ? 'Adding a positive amount moves you right.' : 'Taking away, or adding a negative, moves you left.')),
    });
    const wrongWay = a - move; // moving the wrong way
    steps.push({
      type: 'number',
      prompt: `So what is ${expr}?`,
      answer: D(answer),
      feedback: (g) =>
        sameNumber(g, wrongWay) && wrongWay !== answer
          ? op === '−' && b < 0
            ? 'Taking away a negative number makes the answer bigger, not smaller.'
            : 'That is moving the wrong way along the number line.'
          : `Start at ${sn(a)} and move ${Math.abs(move)} to the ${direction.toLowerCase()}.`,
    });
    workings.push(`Start at ${sn(a)} and move ${Math.abs(move)} to the ${direction.toLowerCase()}.`, `So ${expr} = ${sn(answer)}.`);
    return { round: 'add', prompt: `Work out ${expr}.`, steps, workings, check: { kind: 'add', a, op, b, answer } };
  }
}

// ---------------------------------------------------------------------------------------------
// Across zero
// ---------------------------------------------------------------------------------------------

const ZERO_CONTEXTS = [
  { ask: (lo: number, hi: number) => `At night it is ${sn(lo)} °C. By midday it is ${sn(hi)} °C. How many degrees warmer is it at midday?`, unit: '°C' },
  { ask: (lo: number, hi: number) => `On the Moon the ground can be ${sn(lo * 10)} °C at night and ${sn(hi * 10)} °C in the day. What is the difference?`, unit: '°C', scale: 10 },
  { ask: (lo: number, hi: number) => `A diver is ${-lo} m below the sea's surface, at ${sn(lo)} m. A seabird is ${hi} m above it. How far apart are they?`, unit: 'm' },
];

function acrossZero(r: () => number): Question {
  for (;;) {
    const ctx = pick(r, ZERO_CONTEXTS);
    const k = ctx.scale ?? 1;
    const lo = -int(r, 2, 15) * k;
    const hi = int(r, 2, 15) * k;
    if (SHOWN.has(`zero ${lo} ${hi}`) || -lo === hi) continue;
    const answer = hi - lo;
    const unit = ctx.unit === '°C' ? '°c' : ctx.unit;
    return {
      round: 'zero',
      prompt: ctx.ask(lo / k, hi / k),
      steps: [
        { type: 'number', prompt: `How far is it from ${sn(lo)} up to 0?`, answer: D(-lo), unit, feedback: (g) => (g.neg ? 'A distance is never negative: count the steps up to 0.' : `Count up from ${sn(lo)} to 0.`) },
        { type: 'number', prompt: `And from 0 up to ${sn(hi)}?`, answer: D(hi), unit, feedback: () => `Count from 0 to ${hi}.` },
        {
          type: 'number',
          prompt: `So what is the difference?`,
          answer: D(answer),
          unit,
          feedback: (g) => (sameNumber(g, hi + lo) || sameNumber(g, -(hi + lo)) ? `It looks like you took ${-lo} away from ${hi}. Across zero, add the two distances: to 0 and on from 0.` : `Add the two distances together.`),
        },
      ],
      workings: [`From ${sn(lo)} up to 0 is ${-lo}.`, `From 0 up to ${sn(hi)} is ${hi}.`, `So the difference is ${-lo} + ${hi} = ${answer} ${ctx.unit}. As a calculation, ${sn(hi)} − (${sn(lo)}) = ${answer}.`],
      check: { kind: 'zero', low: lo, high: hi, answer },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Multiply and divide
// ---------------------------------------------------------------------------------------------

function mulDiv(r: () => number): Question {
  for (;;) {
    const op = pick(r, ['×', '÷'] as const);
    const decimal = op === '×' && r() < 0.2;
    let a = nonZero(r, -12, 12) * (decimal ? 0.5 : 1);
    let b = nonZero(r, -12, 12);
    if (op === '÷') a = a * b; // exact division
    if (a > 0 && b > 0) continue;
    if (Math.abs(b) === 1 || SHOWN.has(`mul ${a} ${op} ${b}`)) continue;
    const answer = op === '×' ? a * b : a / b;
    const sameSign = a < 0 === b < 0;
    const expr = `${br(a)} ${op} ${br(b)}`;
    const signOptions = ['The same', 'Different'];
    const posNeg = ['Positive', 'Negative'];
    return {
      round: 'multiply',
      prompt: `Work out ${expr}.`,
      steps: [
        { type: 'choice', prompt: `Are the signs of ${sn(a)} and ${sn(b)} the same or different?`, options: signOptions, correct: sameSign ? 0 : 1, why: { [sameSign ? 1 : 0]: `${sn(a)} is ${a < 0 ? 'negative' : 'positive'} and ${sn(b)} is ${b < 0 ? 'negative' : 'positive'}.` } },
        {
          type: 'choice',
          prompt: 'So is the answer positive or negative?',
          options: posNeg,
          correct: sameSign ? 0 : 1,
          why: { [sameSign ? 1 : 0]: sameSign ? `Same signs give a positive answer: a negative ${op === '×' ? 'times' : 'divided by'} a negative is positive.` : 'Different signs give a negative answer.' },
        },
        {
          type: 'number',
          prompt: `So what is ${expr}?`,
          answer: D(answer),
          feedback: (g) =>
            sameNumber(g, -answer)
              ? sameSign
                ? `A negative ${op === '×' ? 'times' : 'divided by'} a negative is positive.`
                : 'The signs are different, so the answer is negative.'
              : `Work out ${fmt(D(Math.abs(a)))} ${op} ${Math.abs(b)}, then give it the sign you chose.`,
        },
      ],
      workings: [`${fmt(D(Math.abs(a)))} ${op} ${Math.abs(b)} = ${fmt(D(Math.abs(answer)))}.`, `The signs are ${sameSign ? 'the same, so the answer is positive' : 'different, so the answer is negative'}.`, `So ${expr} = ${sn(answer)}.`],
      check: { kind: 'mul', a, op, b, answer },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'zero') return acrossZero(r);
  if (round === 'multiply') return mulDiv(r);
  return addSub(r);
}

export const negativeNumbersQuiz: LessonQuiz<NegativeCheck> = {
  lesson: 'negative-numbers',
  storageKey: 'stella-quiz-negative-numbers-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
