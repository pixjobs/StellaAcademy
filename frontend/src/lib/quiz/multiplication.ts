/**
 * Quiz for "Long Multiplication" (KAN-75): estimate, then the partial products, then add them.
 * Years 5 and 6. Built on lib/quiz/core.ts; every number is a whole number.
 */
import { D, fmt, int, pick, sameNumber, shuffle, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';

export type Round = 'two' | 'bigger' | 'stories';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  two: { label: 'Two digits by two digits', blurb: 'Estimate, multiply by the ones, then by the tens, then add.' },
  bigger: { label: 'Bigger numbers', blurb: 'Three- and four-digit numbers times a two-digit number.' },
  stories: { label: 'Word problems', blurb: 'Choose the calculation, then work it out by long multiplication.' },
};

export type MultiplicationCheck = { a: number; b: number; estimate: number; answer: number };
type Question = Q<MultiplicationCheck>;

/** Examples shown on the lesson page, and the earlier practice questions. The quiz never asks these. */
const SHOWN = new Set(['24 13', '31 12', '38 7', '1234 25', '365 16', '15 12', '23 14', '47 36', '325 18', '2406 15', '1250 24']);

const n = (x: number) => fmt(D(x)); // 1,692 with a comma
/** Round to the nearest `to` (halves round up). */
const roundTo = (x: number, to: number) => Math.round(x / to) * to;

/** Estimate, ones row, tens row (with its 0), then the total. */
function longSteps(a: number, b: number, unit?: string): { steps: Step[]; workings: string[]; estimate: number; answer: number } {
  const ones = b % 10;
  const tens = Math.floor(b / 10);
  const ra = roundTo(a, a >= 1000 ? 100 : 10);
  const rb = roundTo(b, 10);
  const estimate = ra * rb;
  const p1 = a * ones;
  const p2 = a * tens * 10;
  const answer = p1 + p2;
  const steps: Step[] = [
    {
      type: 'number',
      prompt: `Estimate first. Round ${n(a)} to the nearest ${a >= 1000 ? 100 : 10} and ${b} to the nearest 10, then multiply. What is the estimate?`,
      answer: D(estimate),
      feedback: () => `${n(a)} is about ${n(ra)} and ${b} is about ${rb}. Work out ${n(ra)} × ${rb}.`,
    },
    { type: 'number', prompt: `Multiply by the ones digit: ${n(a)} × ${ones} = ?`, answer: D(p1), feedback: () => `Work out ${n(a)} × ${ones}, carrying where a column makes 10 or more.` },
    {
      type: 'number',
      prompt: `Now the tens digit, ${tens}. This row counts tens. What is ${n(a)} × ${tens} tens?`,
      answer: D(p2),
      feedback: (g) => (sameNumber(g, a * tens) ? `That row counts tens, so it is ten times bigger: write a 0 in the ones column first, then ${n(a)} × ${tens}.` : `Work out ${n(a)} × ${tens}, then put a 0 on the end.`),
    },
    {
      type: 'number',
      prompt: `Add your two rows. What is ${n(a)} × ${b}?`,
      answer: D(answer),
      unit,
      feedback: (g) =>
        sameNumber(g, p1 + a * tens)
          ? `That is far too small: compare it with your estimate of ${n(estimate)}. The tens row needs its 0.`
          : `Add the two rows you found. Your answer should be close to your estimate.`,
    },
  ];
  const workings = [
    `Estimate: ${n(ra)} × ${rb} = ${n(estimate)}.`,
    `${n(a)} × ${ones} = ${n(p1)} and ${n(a)} × ${tens * 10} = ${n(p2)}.`,
    `${n(p1)} + ${n(p2)} = ${n(answer)}${unit ? ` ${unit}` : ''}, close to the estimate.`,
  ];
  return { steps, workings, estimate, answer };
}

function pair(r: () => number, round: Round): [number, number] {
  for (;;) {
    // From 21 up, rounding to the nearest 10 gives an estimate close enough to check against.
    const a = round === 'two' ? int(r, 21, 99) : round === 'bigger' ? (r() < 0.5 ? int(r, 101, 999) : int(r, 1001, 4999)) : pick(r, [int(r, 21, 99), int(r, 101, 999), int(r, 1001, 4999)]);
    const b = int(r, 21, 99);
    // Numbers ending in 0 have no ones row; numbers ending in 5 round a long way, which makes a poor estimate.
    if (a % 10 === 0 || b % 10 === 0 || a % 10 === 5 || b % 10 === 5 || SHOWN.has(`${a} ${b}`)) continue;
    return [a, b];
  }
}

function calculation(r: () => number, round: 'two' | 'bigger'): Question {
  const [a, b] = pair(r, round);
  const { steps, workings, estimate, answer } = longSteps(a, b);
  return { round, prompt: `Work out ${n(a)} × ${b} using long multiplication.`, steps, workings, check: { a, b, estimate, answer } };
}

const STORIES = [
  { ask: (a: number, b: number) => `A rocket's engines burn ${n(a)} kg of fuel every second. How much fuel do they burn in ${b} seconds?`, unit: 'kg' },
  { ask: (a: number, b: number) => `A school orders ${b} boxes of pencils, with ${n(a)} pencils in each box. How many pencils is that?`, unit: undefined },
  { ask: (a: number, b: number) => `A satellite sends ${n(a)} pictures a day. How many pictures does it send in ${b} days?`, unit: undefined },
  { ask: (a: number, b: number) => `A train travels ${n(a)} km every week. How far does it travel in ${b} weeks?`, unit: 'km' },
];

function story(r: () => number): Question {
  const [a, b] = pair(r, 'stories');
  const st = pick(r, STORIES);
  const sum = `${n(a)} + ${b}`;
  const product = `${n(a)} × ${b}`;
  const quotient = `${n(Math.max(a, b))} ÷ ${n(Math.min(a, b))}`; // bigger number first, so it is a believable option
  const options = shuffle(r, [product, sum, quotient]);
  const correct = options.indexOf(product);
  const { steps, workings, estimate, answer } = longSteps(a, b, st.unit);
  return {
    round: 'stories',
    prompt: st.ask(a, b),
    steps: [
      {
        type: 'choice',
        prompt: 'Which calculation answers the question?',
        options,
        correct,
        why: whyAll(options, correct, (o) => (o === sum ? `There are ${b} lots of ${n(a)}. Adding ${b} only adds ${b} more, once. Multiply.` : `Dividing shares an amount out. Here there are ${b} lots of ${n(a)}, so multiply.`)),
      },
      ...steps,
    ],
    workings: [`${b} lots of ${n(a)}: ${product} (the same as ${b} × ${n(a)}).`, ...workings],
    check: { a, b, estimate, answer },
  };
}

export function makeQuestion(round: Round, r: () => number): Question {
  return round === 'stories' ? story(r) : calculation(r, round);
}

export const multiplicationQuiz: LessonQuiz<MultiplicationCheck> = {
  lesson: 'multiplication',
  storageKey: 'stella-quiz-multiplication-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
