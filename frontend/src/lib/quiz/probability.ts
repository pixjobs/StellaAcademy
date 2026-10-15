/**
 * Quiz for "Probability" (KAN-83): single events, combined events, dependent events and backups.
 * Key stage 3 to GCSE. Built on lib/quiz/core.ts; fractions and decimals are exact.
 */
import { D, F, fmt, fracEqual, fracText, int, pick, sameNumber, shuffle, simplify, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';

export type Round = 'single' | 'combined' | 'dependent';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  single: { label: 'Single events', blurb: 'Outcomes you want over all the outcomes, and the chance something does not happen.' },
  combined: { label: 'Combined events', blurb: 'Both: multiply, if independent. One or the other, when both cannot happen: add.' },
  dependent: { label: 'Without replacement and backups', blurb: 'When the first pick changes the second, and spare parts working side by side.' },
};

export type ProbabilityCheck =
  | { kind: 'single'; want: number; total: number; not: boolean; answer: string }
  | { kind: 'not-decimal'; p: string; answer: string }
  | { kind: 'and'; p: string; q: string; answer: string }
  | { kind: 'or'; outcomes: number[]; sides: number; answer: string }
  | { kind: 'without'; want: number; total: number; answer: string }
  | { kind: 'backups'; p: string; n: number; answer: string };
type Question = Q<ProbabilityCheck>;

/** Examples shown on the lesson page. The quiz never asks these. */
const SHOWN = new Set(['bag 2 7', 'not 0.05', 'backups 0.9 3']);

const COLOURS = ['red', 'blue', 'green', 'yellow'] as const;
/** p in hundredths as an exact decimal string: 35 gives "0.35". */
const hundredths = (h: number) => fmt(D(h / 100));
/** An exact decimal from a whole number over a power of ten. */
const exactDecimal = (num: number, places: number) => fmt(D((num / 10 ** places).toFixed(places)));

// ---------------------------------------------------------------------------------------------
// Single events
// ---------------------------------------------------------------------------------------------

function single(r: () => number): Question {
  for (;;) {
    if (r() < 0.3) return notDecimal(r);
    const [c1, c2, c3] = shuffle(r, [...COLOURS]);
    const n1 = int(r, 1, 9);
    const n2 = int(r, 1, 9);
    const n3 = r() < 0.5 ? int(r, 1, 6) : 0;
    const total = n1 + n2 + n3;
    if (SHOWN.has(`bag ${n1} ${n2}`) || SHOWN.has(`bag ${n2} ${n1}`)) continue;
    const not = r() < 0.45;
    const bag = `A bag holds ${n1} ${c1}, ${n2} ${c2}${n3 ? ` and ${n3} ${c3}` : ''} counters. One is taken at random.`;
    const p = simplify(F(n1, total));
    const pNot = simplify(F(total - n1, total));
    const steps: Step[] = [
      { type: 'number', prompt: 'How many counters are there altogether?', answer: D(total), feedback: () => 'Add up all the counters.' },
      {
        type: 'fraction',
        prompt: `What is the probability that it is ${c1}? (In its simplest form.)`,
        answer: p,
        simplest: true,
        feedback: (g) => (fracEqual(g, F(n1, total - n1)) ? `That divides by the counters that are not ${c1}. Divide by all ${total} counters.` : `${n1} of the ${total} counters are ${c1}.`),
      },
    ];
    if (not) {
      const options = shuffle(r, [`1 − P(${c1})`, `P(${c1}) − 1`, `1 ÷ P(${c1})`]);
      const correct = options.indexOf(`1 − P(${c1})`);
      steps.push(
        { type: 'choice', prompt: `So P(not ${c1}) = ?`, options, correct, why: whyAll(options, correct, () => 'A counter is either the colour or not, so the two probabilities add up to 1.') },
        { type: 'fraction', prompt: `What is the probability that it is not ${c1}? (In its simplest form.)`, answer: pNot, simplest: true, feedback: () => `1 − ${fracText(p)}, or count the counters that are not ${c1}.` },
      );
    }
    return {
      round: 'single',
      prompt: `${bag} What is the probability that it is ${not ? `not ${c1}` : c1}?`,
      steps,
      workings: not
        ? [`There are ${total} counters, ${n1} of them ${c1}, so P(${c1}) = ${fracText(p)}.`, `P(not ${c1}) = 1 − ${fracText(p)} = ${fracText(pNot)}.`]
        : [`There are ${total} counters and ${n1} are ${c1}.`, `P(${c1}) = ${n1}/${total}${fracText(p) === `${n1}/${total}` ? '' : ` = ${fracText(p)}`}.`],
      check: { kind: 'single', want: not ? total - n1 : n1, total, not, answer: fracText(not ? pNot : p) },
    };
  }
}

function notDecimal(r: () => number): Question {
  for (;;) {
    const h = int(r, 2, 19) * 5;
    const p = hundredths(h);
    if (SHOWN.has(`not ${p}`)) continue;
    const [ctx, notText] = pick(r, [
      [`The probability that it rains tomorrow is ${p}.`, 'it does not rain'],
      [`The probability that a launch is delayed is ${p}.`, 'the launch is not delayed'],
      [`The probability that a radio signal is lost is ${p}.`, 'the signal gets through'],
    ] as const);
    const answer = hundredths(100 - h);
    const options = shuffle(r, [`1 − ${p}`, `${p} − 1`, `${p} × 2`]);
    const correct = options.indexOf(`1 − ${p}`);
    return {
      round: 'single',
      prompt: `${ctx} What is the probability that ${notText}?`,
      steps: [
        { type: 'choice', prompt: 'Which calculation gives the probability that it does not happen?', options, correct, why: whyAll(options, correct, () => 'It either happens or it does not, so the two probabilities add up to 1.') },
        { type: 'number', prompt: `So what is ${p} taken from 1?`, answer: D(answer), feedback: () => `1 − ${p}: what do you add to ${p} to make 1?` },
      ],
      workings: [`It happens or it does not, so the probabilities add up to 1.`, `1 − ${p} = ${answer}.`],
      check: { kind: 'not-decimal', p, answer },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Combined events
// ---------------------------------------------------------------------------------------------

function combined(r: () => number): Question {
  for (;;) {
    if (r() < 0.6) {
      // Independent "and": multiply decimals.
      const a = int(r, 2, 9) / 10;
      const b = int(r, 2, 9) / 10;
      const [pa, pb] = [hundredths(a * 100), hundredths(b * 100)];
      const product = exactDecimal(Math.round(a * 10) * Math.round(b * 10), 2);
      const sumSlip = hundredths(Math.round(a * 100 + b * 100));
      const ctx = pick(r, [
        [`The probability a launch leaves on time is ${pa}. Separately, the probability of good weather at the landing site is ${pb}.`, 'both'],
        [`A rover's camera works on a given day with probability ${pa}, and its radio with probability ${pb}, independently.`, 'both work'],
        [`The probability that a bus is late is ${pa}, and that a train is late is ${pb}. They are independent.`, 'both are late'],
      ] as const);
      const options = shuffle(r, ['Multiply them', 'Add them']);
      const correct = options.indexOf('Multiply them');
      return {
        round: 'combined',
        prompt: `${ctx[0]} What is the probability that ${ctx[1] === 'both' ? 'both happen' : ctx[1]}?`,
        steps: [
          { type: 'choice', prompt: 'The events are independent and you want both. Do you multiply or add the probabilities?', options, correct, why: whyAll(options, correct, () => 'For both of two independent events, multiply. Adding is for one or the other, when they cannot both happen.') },
          { type: 'number', prompt: `So what is ${pa} × ${pb}?`, answer: D(product), feedback: (g) => (sameNumber(g, Number(sumSlip)) ? 'That adds them. For both, multiply.' : `Work out ${Math.round(a * 10)} × ${Math.round(b * 10)}, then divide by 100.`) },
        ],
        workings: [`Independent events, both: multiply.`, `${pa} × ${pb} = ${product}.`],
        check: { kind: 'and', p: pa, q: pb, answer: product },
      };
    }
    // "Either" on a dice: outcomes that cannot happen together, so add.
    const sides = pick(r, [6, 8, 10, 12]);
    const k = int(r, 2, 3);
    const outcomes = shuffle(r, [...Array(sides).keys()].map((x) => x + 1)).slice(0, k).sort((x, y) => x - y);
    const each = F(1, sides);
    const sum = simplify(F(k, sides));
    const list = outcomes.length === 2 ? `${outcomes[0]} or ${outcomes[1]}` : `${outcomes.slice(0, -1).join(', ')} or ${outcomes[outcomes.length - 1]}`;
    const options = shuffle(r, ['Add them', 'Multiply them']);
    const correct = options.indexOf('Add them');
    return {
      round: 'combined',
      prompt: `A fair ${sides}-sided dice is rolled once. What is the probability that it lands on ${list}?`,
      steps: [
        { type: 'fraction', prompt: `What is the probability of landing on any one number?`, answer: each, simplest: true, feedback: () => `There are ${sides} equally likely numbers.` },
        { type: 'choice', prompt: `It cannot land on two numbers at once. To get ${list}, do you add or multiply?`, options, correct, why: whyAll(options, correct, () => 'One or the other, when they cannot both happen: add. Multiplying is for both of two independent events.') },
        { type: 'fraction', prompt: `So what is the probability, in its simplest form?`, answer: sum, simplest: true, feedback: (g) => (fracEqual(g, F(1, sides ** k)) ? 'That multiplies. One or the other: add.' : `Add ${k} lots of 1/${sides}, then simplify.`) },
      ],
      workings: [`Each number has probability 1/${sides}.`, `The ${k} outcomes cannot happen together, so add: ${k}/${sides}${fracText(sum) === `${k}/${sides}` ? '' : ` = ${fracText(sum)}`}.`],
      check: { kind: 'or', outcomes, sides, answer: fracText(sum) },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Dependent events and backups
// ---------------------------------------------------------------------------------------------

function dependent(r: () => number): Question {
  for (;;) {
    if (r() < 0.55) {
      const [c1, c2] = shuffle(r, [...COLOURS]);
      const want = int(r, 2, 8);
      const other = int(r, 2, 9);
      const total = want + other;
      if (SHOWN.has(`bag ${want} ${other}`)) continue;
      const first = F(want, total);
      const second = F(want - 1, total - 1);
      const answer = simplify(F(want * (want - 1), total * (total - 1)));
      const sameBottom = F(want - 1, total);
      return {
        round: 'dependent',
        prompt: `A bag holds ${want} ${c1} and ${other} ${c2} counters. Two are taken out, one after the other, without putting the first back. What is the probability that both are ${c1}?`,
        steps: [
          { type: 'fraction', prompt: `What is the probability that the first is ${c1}?`, answer: first, simplest: false, feedback: () => `${want} of the ${total} counters are ${c1}.` },
          {
            type: 'fraction',
            prompt: `The first ${c1} is not put back. Now what is the probability that the second is ${c1}?`,
            answer: second,
            simplest: false,
            feedback: (g) => (fracEqual(g, sameBottom) || fracEqual(g, first) ? `One counter has gone, so there are ${total - 1} left, and ${want - 1} of them are ${c1}.` : `Count again: how many ${c1} are left, and how many counters?`),
          },
          { type: 'fraction', prompt: 'Multiply the two. What is the probability that both are ' + c1 + ', in its simplest form?', answer, simplest: true, feedback: () => `${want}/${total} × ${want - 1}/${total - 1}: multiply the tops and the bottoms, then simplify.` },
        ],
        workings: [`First: ${want}/${total}. Second, with one ${c1} gone: ${want - 1}/${total - 1}.`, `${want}/${total} × ${want - 1}/${total - 1} = ${want * (want - 1)}/${total * (total - 1)}${fracText(answer) === `${want * (want - 1)}/${total * (total - 1)}` ? '' : ` = ${fracText(answer)}`}.`],
        check: { kind: 'without', want, total, answer: fracText(answer) },
      };
    }
    // Backups side by side: works if at least one works.
    const h = pick(r, [60, 70, 75, 80, 85, 90, 95]);
    const n = int(r, 2, 4);
    const p = hundredths(h);
    if (SHOWN.has(`backups ${p} ${n}`)) continue;
    const fail = 100 - h;
    const failText = hundredths(fail);
    const allFail = exactDecimal(fail ** n, 2 * n);
    const works = exactDecimal(100 ** n - fail ** n, 2 * n);
    const nTimesP = hundredths(n * h);
    return {
      round: 'dependent',
      prompt: `A spacecraft carries ${n} identical radios side by side. Each works with probability ${p}, independently. The link works if at least one radio works. What is the probability that the link works?`,
      steps: [
        { type: 'number', prompt: `What is the probability that one radio fails?`, answer: D(failText), feedback: () => `1 − ${p}.` },
        { type: 'number', prompt: `The link fails only if all ${n} fail. What is the probability of that? (${failText} multiplied by itself ${n} times)`, answer: D(allFail), feedback: () => `${Array(n).fill(failText).join(' × ')}.` },
        { type: 'number', prompt: `So what is the probability that the link works?`, answer: D(works), feedback: (g) => (sameNumber(g, Number(nTimesP)) ? `That is ${n} × ${p}, which can be more than 1. The link works unless all fail: 1 − ${allFail}.` : `1 − ${allFail}.`) },
      ],
      workings: [`One radio fails with probability 1 − ${p} = ${failText}.`, `All ${n} fail: ${failText} to the power ${n} = ${allFail}.`, `So the link works with probability 1 − ${allFail} = ${works}.`],
      check: { kind: 'backups', p, n, answer: works },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'combined') return combined(r);
  if (round === 'dependent') return dependent(r);
  return single(r);
}

export const probabilityQuiz: LessonQuiz<ProbabilityCheck> = {
  lesson: 'probability',
  storageKey: 'stella-quiz-probability-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};

