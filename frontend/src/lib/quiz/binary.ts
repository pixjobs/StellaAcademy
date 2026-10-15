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
const SHOWN = new Set(['10110', '19', '10011', '110+11', '100', '1011', '13', '25', '101+11', '1101+111']);

const bin = (n: number) => n.toString(2);
const places = (bits: string) => bits.split('').map((b, i) => [b, 2 ** (bits.length - 1 - i)] as const);

function placeValueStep(r: () => number): Step {
  const right = '1, 2, 4, 8, 16, 32';
  const options = shuffle(r, [right, '1, 10, 100, 1000, 10000', '1, 2, 3, 4, 5, 6', '2, 4, 6, 8, 10, 12']);
  const correct = options.indexOf(right);
  return { type: 'choice', prompt: 'Reading from the right, what are the binary place values?', options, correct, why: whyAll(options, correct, () => 'In binary each place is worth two times the place to its right.') };
}

function toDenary(r: () => number): Question {
  for (;;) {
    const n = int(r, 9, 63);
    const bits = bin(n);
    if (SHOWN.has(bits)) continue;
    const ones = places(bits).filter(([b]) => b === '1').map(([, v]) => v);
    const digitSum = ones.length;
    return {
      round: 'to-denary',
      prompt: `Change the binary number ${bits} into denary.`,
      steps: [
        placeValueStep(r),
        { type: 'number', prompt: `What is the place value of the leftmost 1 in ${bits}?`, answer: D(2 ** (bits.length - 1)), feedback: () => `${bits} has ${bits.length} digits. Count the place values from the right: 1, 2, 4 and so on.` },
        {
          type: 'number',
          prompt: `Add up the place values that hold a 1. What is ${bits} in denary?`,
          answer: D(n),
          feedback: (g) =>
            sameNumber(g, digitSum) ? 'That counts the 1s. Each 1 is worth its place value: add those up.' : sameNumber(g, Number(bits)) ? 'That reads the digits as a denary number. Use the binary place values instead.' : `Add ${ones.join(', ')}.`,
        },
      ],
      workings: [`The 1s are in the ${ones.map((v) => `${v}s`).join(', ')} places.`, `${ones.join(' + ')} = ${n}.`, `So ${bits} in denary is ${n}.`],
      check: { kind: 'to-denary', bits, answer: n },
    };
  }
}

function toBinary(r: () => number): Question {
  for (;;) {
    const n = int(r, 9, 63);
    if (SHOWN.has(String(n))) continue;
    const top = 2 ** Math.floor(Math.log2(n));
    const answer = bin(n);
    const reversed = answer.split('').reverse().join('');
    return {
      round: 'to-binary',
      prompt: `Change ${n} into binary.`,
      steps: [
        { type: 'number', prompt: `What is the biggest binary place value (1, 2, 4, 8, 16, 32 ...) that fits into ${n}?`, answer: D(top), feedback: (g) => (sameNumber(g, top * 2) ? `${top * 2} is bigger than ${n}.` : `Go up 1, 2, 4, 8 ... and stop before you pass ${n}.`) },
        { type: 'number', prompt: `Take it away. What is left?`, answer: D(n - top), feedback: () => `${n} − ${top}.` },
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
    const a = bin(x);
    const b = bin(y);
    if (SHOWN.has(`${a}+${b}`) || SHOWN.has(`${b}+${a}`)) continue;
    const sum = bin(x + y);
    const denaryStyle = String(Number(a) + Number(b)); // the slip: adding the digits as if they were denary
    return {
      round: 'add',
      prompt: `Work out ${a} + ${b} in binary.`,
      steps: [
        { type: 'number', prompt: `What is ${a} in denary?`, answer: D(x), feedback: () => 'Add the place values that hold a 1.' },
        { type: 'number', prompt: `What is ${b} in denary?`, answer: D(y), feedback: () => 'Add the place values that hold a 1.' },
        { type: 'number', prompt: `Add them in denary.`, answer: D(x + y), feedback: () => `${x} + ${y}.` },
        {
          type: 'number',
          prompt: `Now change ${x + y} back into binary. What is ${a} + ${b} in binary?`,
          answer: D(sum),
          plain: true,
          feedback: (g) => (sameNumber(g, Number(denaryStyle)) && denaryStyle !== sum ? 'That adds the digits as in denary. In binary there is no 2: 1 + 1 = 10, so carry.' : `Change ${x + y} into binary, as in the last round.`),
        },
      ],
      workings: [`${a} = ${x} and ${b} = ${y}.`, `${x} + ${y} = ${x + y}.`, `${x + y} in binary is ${sum}, so ${a} + ${b} = ${sum}.`],
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
