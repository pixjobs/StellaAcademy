/**
 * Quiz for "Binary Numbers" (KAN-80): binary to denary, denary to binary, and adding by converting.
 * Key stage 3 computing. Built on lib/quiz/core.ts; binary answers are typed as digits.
 */
import { D, int, sameNumber, shuffle, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';

export type Round = 'to-denary' | 'to-binary' | 'add';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  'to-denary': { label: 'Binary to denary', blurb: 'Add up the place values that hold a 1.' },
  'to-binary': { label: 'Denary to binary', blurb: 'Take away the biggest place value that fits, and repeat.' },
  add: { label: 'Adding in binary', blurb: 'Change to denary, add, then change back.' },
};

export type BinaryCheck =
  | { kind: 'to-denary'; bits: string; answer: number }
  | { kind: 'to-binary'; n: number; answer: string }
  | { kind: 'add'; a: string; b: string; answer: string };
type Question = Q<BinaryCheck>;

/** Examples shown on the lesson page, and the earlier practice questions. The quiz never asks these. */
/** Numbers shown on the page (in either direction), and additions shown there. The quiz never asks these. */
const SHOWN_VALUES = new Set([4, 11, 13, 19, 22, 25]);
const SHOWN_SUMS = new Set(['110+11', '101+11', '1101+111']);
const list = (xs: (string | number)[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

const bin = (n: number) => n.toString(2);
const places = (bits: string) => bits.split('').map((b, i) => [b, 2 ** (bits.length - 1 - i)] as const);

/** A different place each time: the place value of the nth digit from the right. */
function placeValueStep(r: () => number, length: number): Step {
  const k = int(r, 3, Math.max(3, length));
  const ord = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth'][k];
  return {
    type: 'number',
    prompt: `In binary, what is the place value of the ${ord} digit from the right?`,
    answer: D(2 ** (k - 1)),
    feedback: (g) => (sameNumber(g, 10 ** (k - 1)) ? 'That is a denary place value. In binary each place is worth two times the one to its right: 1, 2, 4, 8 ...' : 'Start at 1 and double for each place: 1, 2, 4, 8 ...'),
  };
}

function toDenary(r: () => number): Question {
  for (;;) {
    const n = int(r, 9, 63);
    const bits = bin(n);
    if (SHOWN_VALUES.has(n)) continue;
    const ones = places(bits).filter(([b]) => b === '1').map(([, v]) => v);
    const digitSum = ones.length;
    return {
      round: 'to-denary',
      prompt: `Change the binary number ${bits} into denary.`,
      steps: [
        placeValueStep(r, bits.length),
        { type: 'number', prompt: `What is the place value of the leftmost 1 in ${bits}?`, answer: D(2 ** (bits.length - 1)), feedback: () => `${bits} has ${bits.length} digits. Count the place values from the right: 1, 2, 4 and so on.` },
        {
          type: 'number',
          prompt: `Add up the place values that hold a 1. What is ${bits} in denary?`,
          answer: D(n),
          feedback: (g) =>
            sameNumber(g, digitSum) ? 'That counts the 1s. Each 1 is worth its place value: add those up.' : sameNumber(g, Number(bits)) ? 'That reads the digits as a denary number. Use the binary place values instead.' : 'Add the place values that hold a 1.',
        },
      ],
      workings: [`The 1s are in the ${list(ones.map((v) => `${v}s`))} places.`, `${ones.join(' + ')} = ${n}.`, `So ${bits} in denary is ${n}.`],
      check: { kind: 'to-denary', bits, answer: n },
    };
  }
}

function toBinary(r: () => number): Question {
  for (;;) {
    const n = int(r, 9, 63);
    if (SHOWN_VALUES.has(n)) continue;
    const top = 2 ** Math.floor(Math.log2(n));
    const left = n - top;
    if (left < 2) continue; // so there is a next place value to find
    const next = 2 ** Math.floor(Math.log2(left));
    const answer = bin(n);
    const reversed = answer.split('').reverse().join('');
    return {
      round: 'to-binary',
      prompt: `Change ${n} into binary.`,
      steps: [
        { type: 'number', prompt: `What is the biggest binary place value (1, 2, 4, 8, 16, 32 ...) that fits into ${n}?`, answer: D(top), feedback: (g) => (sameNumber(g, top * 2) ? `${top * 2} is bigger than ${n}.` : `Go up 1, 2, 4, 8 ... and stop before you pass ${n}.`) },
        { type: 'number', prompt: `Take it away. What is left?`, answer: D(left), feedback: () => `${n} − ${top}.` },
        { type: 'number', prompt: `What is the biggest place value that fits into ${left}?`, answer: D(next), feedback: (g) => (sameNumber(g, next * 2) ? `${next * 2} is bigger than ${left}.` : `Go up 1, 2, 4, 8 ... and stop before you pass ${left}.`) },
        { type: 'number', prompt: `Take that away too. What is left now?`, answer: D(left - next), feedback: () => `${left} − ${next}.` },
        {
          type: 'number',
          prompt: `Keep going with what is left, writing 1 where a place value fits and 0 where it does not. What is ${n} in binary?`,
          answer: D(answer),
          plain: true,
          feedback: (g) => (reversed !== answer && sameNumber(g, Number(reversed)) ? 'Those are the right bits, but backwards. The biggest place value goes on the left.' : `Start with a 1 in the ${top}s place, then fill each smaller place with 1 or 0.`),
        },
      ],
      workings: [
        `${top} is the biggest place value that fits into ${n}, leaving ${n - top}.`,
        `Place values ${places(answer).map(([, v]) => v).join(', ')} get ${answer.split('').join(', ')}.`,
        `So ${n} in binary is ${answer}.`,
      ],
      check: { kind: 'to-binary', n, answer },
    };
  }
}

function addBinary(r: () => number): Question {
  for (;;) {
    const x = int(r, 3, 31);
    const y = int(r, 3, 31);
    if ((x & y) === 0) continue; // at least one column with 1 + 1, so there is a carry
    const a = bin(x);
    const b = bin(y);
    if (SHOWN_SUMS.has(`${a}+${b}`) || SHOWN_SUMS.has(`${b}+${a}`)) continue;
    const sum = bin(x + y);
    const ra = x & 1;
    const rb = y & 1;
    const rightDigit = (ra + rb) % 2;
    const carry = ra + rb >= 2;
    const carryOptions = shuffle(r, ['Yes, carry 1', 'No carry']);
    const carryRight = carry ? 'Yes, carry 1' : 'No carry';
    const denaryStyle = String(Number(a) + Number(b)); // the slip: adding the digits as if they were denary
    return {
      round: 'add',
      prompt: `Work out ${a} + ${b} in binary.`,
      steps: [
        {
          type: 'number',
          prompt: `Line them up on the right. Add the right-hand column, ${ra} + ${rb}. What digit do you write down?`,
          answer: D(rightDigit),
          feedback: (g) => (sameNumber(g, 2) ? 'There is no 2 in binary: 1 + 1 = 10. Write 0 and carry 1.' : `${ra} + ${rb} in binary.`),
        },
        { type: 'choice', prompt: 'Do you carry 1 into the next column?', options: carryOptions, correct: carryOptions.indexOf(carryRight), why: whyAll(carryOptions, carryOptions.indexOf(carryRight), () => (carry ? '1 + 1 = 10: write 0 and carry 1.' : 'Only 1 + 1 (or more) makes a carry.')) },
        {
          type: 'number',
          prompt: `Carry on column by column. What is ${a} + ${b} in binary?`,
          answer: D(sum),
          plain: true,
          feedback: (g) => (sameNumber(g, Number(denaryStyle)) && denaryStyle !== sum ? 'That adds the digits as in denary. In binary there is no 2: 1 + 1 = 10, so carry.' : 'Work column by column from the right, carrying 1 whenever a column makes 10 or 11.'),
        },
      ],
      workings: [`Right-hand column: ${ra} + ${rb} = ${ra + rb === 2 ? '10, write 0 and carry 1' : rightDigit}.`, `Check in denary: ${a} = ${x} and ${b} = ${y}, and ${x} + ${y} = ${x + y}.`, `${x + y} in binary is ${sum}, so ${a} + ${b} = ${sum}.`],
      check: { kind: 'add', a, b, answer: sum },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'to-binary') return toBinary(r);
  if (round === 'add') return addBinary(r);
  return toDenary(r);
}

export const binaryQuiz: LessonQuiz<BinaryCheck> = {
  lesson: 'binary',
  storageKey: 'stella-quiz-binary-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
