/**
 * Quiz for "Powers and Roots" (KAN-79): powers and roots, index laws, standard form. Key stage 3.
 * Built on lib/quiz/core.ts; every number is exact (standard form uses exact decimals).
 */
import { D, fmt, int, pick, sameNumber, shuffle, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';
import { shift, type Digits } from '@/lib/measures';

export type Round = 'powers' | 'laws' | 'standard';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  powers: { label: 'Powers and roots', blurb: 'What a power and a root mean, then their values.' },
  laws: { label: 'Index laws', blurb: 'Multiply, divide and raise powers of the same number.' },
  standard: { label: 'Standard form', blurb: 'Very big and very small numbers as A × 10ⁿ.' },
};

export type ExponentsCheck =
  | { kind: 'power'; base: number; index: number; answer: number }
  | { kind: 'root'; n: number; which: 2 | 3; answer: number }
  | { kind: 'law'; base: number; m: number; n: number; op: 'mul' | 'div' | 'pow'; answer: number }
  | { kind: 'standard'; value: string; a: string; n: number }
  | { kind: 'compare'; x: [string, number]; y: [string, number]; larger: string };
type Question = Q<ExponentsCheck>;

/** 2^{5}, 10^{−3}: a power, drawn with a raised index by the quiz panel. */
const pow = (b: number | string, i: number) => `${b}^{${i < 0 ? `−${-i}` : i}}`;

/** Powers and roots shown in the lesson's table and examples. The quiz never asks these. */
const SHOWN_POWERS = new Set(['2 1', '2 2', '2 3', '2 4', '2 5', '2 6', '3 1', '3 2', '3 3', '3 4', '4 1', '4 2', '4 3', '5 1', '5 2', '5 3', '7 0', '10 -3', '2 7']);
const SHOWN_ROOTS = new Set(['2 9', '2 49', '2 144', '2 64', '2 16', '2 25', '2 81', '3 8', '3 27', '3 64', '3 125', '2 2']);
const SHOWN_LAWS = new Set(['mul 2 3 4', 'mul 3 2 3', 'div 5 6 2', 'pow 3 2 3']);
const SHOWN_STANDARD = new Set(['3000', '0.004', '93,000,000', '0.00056', '150,000,000', '0.0031', '300,000,000']);

/** Powers to ask about: each base with the indices that give a sensible number, none from the lesson's table. */
const POWERS: [number, number[]][] = [[2, [7, 8, 9, 10]], [3, [5]], [4, [4]], [5, [4]], [6, [2, 3]], [7, [2, 3]], [8, [2, 3]], [9, [2, 3]], [10, [3, 4, 5, 6]], [11, [2]], [12, [2]]];

// ---------------------------------------------------------------------------------------------
// Powers and roots
// ---------------------------------------------------------------------------------------------

function powerOrRoot(r: () => number): Question {
  for (;;) {
    if (r() < 0.55) {
      const [base, indices] = pick(r, POWERS);
      const index = pick(r, indices);
      if (SHOWN_POWERS.has(`${base} ${index}`)) continue;
      const answer = base ** index;
      const options = shuffle(r, [`${base} multiplied by itself, ${index} times in all`, `${base} × ${index}`, `${base} + ${index}`]);
      const correct = options.indexOf(`${base} multiplied by itself, ${index} times in all`);
      return {
        round: 'powers',
        prompt: `What is ${pow(base, index)}?`,
        steps: [
          { type: 'choice', prompt: `What does ${pow(base, index)} mean?`, options, correct, why: whyAll(options, correct, () => `The small raised number says how many ${base}s are multiplied together.`) },
          {
            type: 'number',
            prompt: `So what is ${pow(base, index)}?`,
            answer: D(answer),
            feedback: (g) => (sameNumber(g, base * index) ? `That is ${base} × ${index}. A power multiplies ${base} by itself: ${Array(index).fill(base).join(' × ')}.` : `Work out ${Array(index).fill(base).join(' × ')}.`),
          },
        ],
        workings: [`${pow(base, index)} = ${Array(index).fill(base).join(' × ')}.`, `So ${pow(base, index)} = ${fmt(D(answer))}.`],
        check: { kind: 'power', base, index, answer },
      };
    }
    const which = r() < 0.65 ? 2 : 3;
    const answer = which === 2 ? int(r, 6, 15) : int(r, 5, 10);
    const n = answer ** which;
    if (SHOWN_ROOTS.has(`${which} ${n}`)) continue;
    const name = which === 2 ? 'square root' : 'cube root';
    const sym = which === 2 ? `√${fmt(D(n))}` : `∛${fmt(D(n))}`;
    const right = which === 2 ? `The number that multiplied by itself makes ${fmt(D(n))}` : `The number that, used three times in a multiplication, makes ${fmt(D(n))}`;
    const divided = `${fmt(D(n))} divided by ${which}`;
    const options = shuffle(r, [right, divided, `${fmt(D(n))} multiplied by ${which}`]);
    const correct = options.indexOf(right);
    return {
      round: 'powers',
      prompt: `What is the ${name} of ${fmt(D(n))}, written ${sym}?`,
      steps: [
        {
          type: 'choice',
          prompt: `What does the ${name} of ${fmt(D(n))} mean?`,
          options,
          correct,
          why: whyAll(options, correct, (o) => (o === divided ? `A root undoes a power: it is not ${which === 2 ? 'halving' : 'dividing by 3'}.` : `A root makes the number smaller: it undoes a power, so it is not multiplying.`)),
        },
        {
          type: 'number',
          prompt: `So what is ${sym}?`,
          answer: D(answer),
          feedback: (g) => (sameNumber(g, n / which) ? `That is ${fmt(D(n))} ÷ ${which}. The ${name} is the number that, ${which === 2 ? 'times itself' : 'used three times in a multiplication'}, makes ${fmt(D(n))}.` : `Try numbers: which one, ${which === 2 ? 'squared' : 'cubed'}, makes ${fmt(D(n))}?`),
        },
      ],
      workings: [`${which === 2 ? `${answer} × ${answer}` : `${answer} × ${answer} × ${answer}`} = ${fmt(D(n))}.`, `So ${sym} = ${answer}.`],
      check: { kind: 'root', n, which, answer },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Index laws
// ---------------------------------------------------------------------------------------------

function law(r: () => number): Question {
  for (;;) {
    const op = pick(r, ['mul', 'div', 'pow'] as const);
    const base = pick(r, [2, 3, 5, 7, 10]);
    const m = int(r, 2, 8);
    const n = int(r, 2, op === 'pow' ? 4 : 7);
    if (op === 'div' && n >= m) continue;
    if (SHOWN_LAWS.has(`${op} ${base} ${m} ${n}`)) continue;
    const index = op === 'mul' ? m + n : op === 'div' ? m - n : m * n;
    const expr = op === 'mul' ? `${pow(base, m)} × ${pow(base, n)}` : op === 'div' ? `${pow(base, m)} ÷ ${pow(base, n)}` : `(${pow(base, m)})^{${n}}`;
    const rule = op === 'mul' ? 'Add them' : op === 'div' ? 'Take them away' : 'Multiply them';
    const verb = op === 'mul' ? 'Add' : op === 'div' ? 'Take away' : 'Multiply';
    const options = shuffle(r, ['Add them', 'Take them away', 'Multiply them']);
    const correct = options.indexOf(rule);
    const wrongIndex = op === 'mul' ? m * n : op === 'pow' ? m + n : m / n;
    const askValue = base ** index <= 1000;
    const steps: Step[] = [
      {
        type: 'choice',
        prompt: `In ${expr}, what do you do with the indices ${m} and ${n}?`,
        options,
        correct,
        why: whyAll(options, correct, () =>
          op === 'mul' ? `Multiplying powers of the same number: write out the ${base}s and count them. That adds the indices.` : op === 'div' ? 'Dividing cancels some of the multiplications: take the indices away.' : `${expr} means ${pow(base, m)} multiplied by itself ${n} times, so there are ${n} × ${m} ${base}s. Multiply the indices.`,
        ),
      },
      {
        type: 'number',
        prompt: `So ${expr} = ${base} to the power of what?`,
        answer: D(index),
        feedback: (g) => (Number.isInteger(wrongIndex) && sameNumber(g, wrongIndex) && wrongIndex !== index ? (op === 'mul' ? `${pow(base, m)} × ${pow(base, n)} has ${m} + ${n} ${base}s multiplied together, so add the indices, do not multiply them.` : `Check the rule for this one: ${verb.toLowerCase()} the indices.`) : `${verb} the indices ${m} and ${n}.`),
      },
    ];
    if (askValue) steps.push({ type: 'number', prompt: `What is ${pow(base, index)} as a number?`, answer: D(base ** index), feedback: () => `Work out ${pow(base, index)}.` });
    return {
      round: 'laws',
      prompt: `Write ${expr} as a single power of ${base}${askValue ? ', then work it out' : ''}.`,
      steps,
      workings: [`${op === 'mul' ? 'Add' : op === 'div' ? 'Take away' : 'Multiply'} the indices: ${op === 'mul' ? `${m} + ${n}` : op === 'div' ? `${m} − ${n}` : `${m} × ${n}`} = ${index}.`, `So ${expr} = ${pow(base, index)}${askValue ? ` = ${fmt(D(base ** index))}` : ''}.`],
      check: { kind: 'law', base, m, n, op, answer: index },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Standard form
// ---------------------------------------------------------------------------------------------

function standard(r: () => number): Question {
  for (;;) {
    if (r() < 0.25) return compare(r);
    // Mostly two or three digits; a single digit only now and then.
    const digits = String(pick(r, [int(r, 1, 9), int(r, 11, 99), int(r, 11, 99), int(r, 101, 999), int(r, 101, 999)])).replace(/0+$/, '');
    if (!digits) continue;
    const big = r() < 0.55;
    const n = big ? int(r, 3, 9) : -int(r, 1, 6);
    const A: Digits = { digits, top: 0 };
    const value = shift(A, n);
    const valueText = fmt(value);
    if (SHOWN_STANDARD.has(valueText)) continue;
    const a = fmt(A);
    const options = ['Positive', 'Negative'];
    return {
      round: 'standard',
      prompt: `Write ${valueText} in standard form.`,
      steps: [
        {
          type: 'number',
          prompt: `Standard form starts with a number from 1 up to (but not including) 10, using the ${digits.length === 1 ? 'digit' : 'digits'} ${digits.split('').join(', ')}. What is that number?`,
          answer: A,
          feedback: (g) => (g.digits === digits ? `It must be at least 1 and less than 10: put the decimal point straight after the first digit.` : `Use the digits of ${valueText}, with the point after the first one.`),
        },
        {
          type: 'choice',
          prompt: `${valueText} is ${big ? 'bigger' : 'smaller'} than 1. Is the power of ten positive or negative?`,
          options,
          correct: big ? 0 : 1,
          why: { [big ? 1 : 0]: big ? 'Big numbers have a positive power of ten.' : 'Numbers smaller than 1 have a negative power of ten.' },
        },
        {
          type: 'number',
          prompt: `How many places does the decimal point move to turn ${a} into ${valueText}? So what is the power of ten? (Type a negative power with a minus sign.)`,
          answer: D(n),
          feedback: (g) => (sameNumber(g, -n) ? (big ? 'A big number has a positive power.' : 'A number smaller than 1 has a negative power: put a minus sign in front.') : `Count how many places the digits move between ${a} and ${valueText}.`),
        },
      ],
      workings: [`The first number is ${a}.`, `The digits move ${Math.abs(n)} place${Math.abs(n) === 1 ? '' : 's'}, and ${valueText} is ${big ? 'bigger' : 'smaller'} than 1, so the power is ${fmt(D(n))}.`, `So ${valueText} = ${a} × ${pow(10, n)}.`],
      check: { kind: 'standard', value: valueText, a, n },
    };
  }
}

function compare(r: () => number): Question {
  for (;;) {
    const ax = fmt({ digits: String(int(r, 11, 99)).replace(/0+$/, ''), top: 0 });
    const ay = fmt({ digits: String(int(r, 11, 99)).replace(/0+$/, ''), top: 0 });
    if (ax === ay) continue;
    const nx = int(r, 3, 9);
    // Three kinds, so no pattern gives the answer: the bigger power with the smaller front number (the trap),
    // the bigger power with the bigger front number, and equal powers, where the front numbers decide.
    const kind = pick(r, ['trap', 'both', 'equal'] as const);
    const [hiA, loA] = Number(ax) > Number(ay) ? [ax, ay] : [ay, ax];
    const ny = kind === 'equal' ? nx : nx + pick(r, [1, 2]);
    const x: [string, number] = kind === 'both' ? [loA, nx] : [hiA, nx];
    const y: [string, number] = kind === 'both' ? [hiA, ny] : kind === 'equal' ? [loA, ny] : [loA, ny];
    const vx = Number(x[0]) * 10 ** x[1];
    const vy = Number(y[0]) * 10 ** y[1];
    const [win, lose] = vx > vy ? [x, y] : [y, x];
    const fw = `${win[0]} × ${pow(10, win[1])}`;
    const fl = `${lose[0]} × ${pow(10, lose[1])}`;
    if (['9 7', '2 8', '9.8 4', '4.2 5'].includes(`${x[0]} ${x[1]}`) || ['9 7', '2 8', '9.8 4', '4.2 5'].includes(`${y[0]} ${y[1]}`)) continue; // shown on the page
    const options = shuffle(r, [fw, fl]);
    const correct = options.indexOf(fw);
    // Which power of ten is bigger: one of the two, or neither.
    const po = shuffle(r, [...new Set([pow(10, x[1]), pow(10, y[1]), 'They are the same'])]);
    const powRight = x[1] === y[1] ? 'They are the same' : pow(10, Math.max(x[1], y[1]));
    return {
      round: 'standard',
      prompt: `Which is larger: ${options[0]} or ${options[1]}?`,
      steps: [
        { type: 'choice', prompt: 'Look at the powers of ten first. Which is bigger?', options: po, correct: po.indexOf(powRight), why: whyAll(po, po.indexOf(powRight), () => `Compare the small raised numbers on the 10s: ${x[1]} and ${y[1]}.`) },
        {
          type: 'choice',
          prompt: 'So which number is larger?',
          options,
          correct,
          why: whyAll(options, correct, () => (x[1] === y[1] ? 'The powers are the same, so the front numbers decide.' : `The bigger power of ten wins, whatever the front numbers: each step in the power is ten times bigger.`)),
        },
      ],
      workings: [`The powers of ten are ${x[1]} and ${y[1]}.`, x[1] === y[1] ? 'They are the same, so compare the front numbers.' : 'The bigger power wins, whatever the front numbers are.', `So ${fw} is larger.`],
      check: { kind: 'compare', x, y, larger: fw },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'laws') return law(r);
  if (round === 'standard') return standard(r);
  return powerOrRoot(r);
}

export const exponentsRootsQuiz: LessonQuiz<ExponentsCheck> = {
  lesson: 'exponents-roots',
  storageKey: 'stella-quiz-exponents-roots-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
