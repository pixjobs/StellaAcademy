/**
 * Quiz for "Ratio and Proportion" (KAN-78): simplifying ratios, sharing in a ratio, direct and inverse
 * proportion. Key stage 3. Built on lib/quiz/core.ts; every answer is a whole number.
 */
import { D, F, fracText, gcd, int, pick, sameNumber, shuffle, simplify, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';
import type { Digits } from '@/lib/measures';

export type Round = 'simplify' | 'share' | 'proportion';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  simplify: { label: 'Simplify a ratio', blurb: 'Divide every part by the biggest number that goes into all of them.' },
  share: { label: 'Share in a ratio', blurb: 'Count the parts, find one part, then each share.' },
  proportion: { label: 'Direct and inverse proportion', blurb: 'Does more of one mean more of the other, or less?' },
};

export type ProportionCheck =
  | { kind: 'simplify'; a: number; b: number; answer: string }
  | { kind: 'share'; total: number; p: number; q: number; answer: string }
  | { kind: 'direct'; n1: number; v1: number; n2: number; answer: number }
  | { kind: 'inverse'; n1: number; v1: number; n2: number; answer: number };
type Question = Q<ProportionCheck>;

/** Examples shown on the lesson page. The quiz never asks these. */
const SHOWN = new Set(['simplify 15 25', 'simplify 2 3', 'share 40 3 5', 'direct 5 30 8', 'direct 15 150 24', 'inverse 50 6 100']);

const num = (d: Digits) => Number(d.digits) * 10 ** (d.top - d.digits.length + 1);

function gcdStep(a: number, b: number): Step {
  const g = Number(gcd(BigInt(a), BigInt(b)));
  return {
    type: 'number',
    prompt: `What is the biggest number that divides into both ${a} and ${b}?`,
    answer: D(g),
    feedback: (x) => {
      const v = num(x);
      if (v === 1) return '1 divides into every number. Look for a bigger number that divides into both.';
      if (Number.isInteger(v) && v > 1 && a % v === 0 && b % v === 0) return `${v} divides into both, but a bigger number does too.`;
      return `${v} does not divide into both ${a} and ${b}.`;
    },
  };
}

function simplifyRatio(r: () => number): Question {
  for (;;) {
    const p = int(r, 1, 9);
    const q = int(r, 1, 9);
    if (p === q || gcd(BigInt(p), BigInt(q)) !== 1n) continue;
    const k = int(r, 2, 12);
    const a = p * k;
    const b = q * k;
    if (SHOWN.has(`simplify ${a} ${b}`) || SHOWN.has(`simplify ${p} ${q}`)) continue;
    const ctx = pick(r, [
      `Write the ratio ${a} : ${b} in its simplest form.`,
      `A rocket fuel has ${a} kg of fuel to ${b} kg of oxidiser. Write the ratio of fuel to oxidiser in its simplest form.`,
      `A class has ${a} girls and ${b} boys. Write the ratio of girls to boys in its simplest form.`,
    ]);
    return {
      round: 'simplify',
      prompt: ctx,
      steps: [
        gcdStep(a, b),
        { type: 'number', prompt: `Divide the first part by ${k}: ${a} ÷ ${k} = ?`, answer: D(p), feedback: () => `Work out ${a} ÷ ${k}.` },
        { type: 'number', prompt: `Divide the second part by ${k} too. What is the second part of the simplest ratio?`, answer: D(q), feedback: () => `Work out ${b} ÷ ${k}.` },
      ],
      workings: [`${k} is the biggest number that divides into ${a} and ${b}.`, `${a} ÷ ${k} = ${p} and ${b} ÷ ${k} = ${q}.`, `So ${a} : ${b} = ${p} : ${q}.`],
      check: { kind: 'simplify', a, b, answer: `${p} : ${q}` },
    };
  }
}

function share(r: () => number): Question {
  for (;;) {
    const p = int(r, 1, 7);
    const q = int(r, 1, 7);
    if (p === q || gcd(BigInt(p), BigInt(q)) !== 1n) continue;
    const parts = p + q;
    const one = int(r, 2, 25);
    const total = parts * one;
    if (SHOWN.has(`share ${total} ${p} ${q}`)) continue;
    const money = r() < 0.6;
    const unit = money ? '£' : 'kg';
    const show = (v: number) => (money ? `£${v}` : `${v} kg`);
    const fractionQ = r() < 0.3;
    const prompt = money
      ? `${show(total)} is shared between Amir and Beth in the ratio ${p} : ${q}. How much does each get?`
      : `${show(total)} of rock samples is shared between two labs in the ratio ${p} : ${q}. How much does each lab get?`;
    const byPart = total / p; // the slip: dividing by one part of the ratio
    const steps: Step[] = [
      { type: 'number', prompt: `How many parts are there altogether?`, answer: D(parts), feedback: () => `Add the parts of the ratio: ${p} + ${q}.` },
      {
        type: 'number',
        prompt: `So how much is one part?`,
        answer: D(one),
        unit,
        feedback: (g) => (sameNumber(g, byPart) && byPart !== one ? `It looks like you divided by ${p}, one part of the ratio. Divide by all the parts: ${p} + ${q} = ${parts}.` : `Share ${show(total)} into ${parts} equal parts.`),
      },
      { type: 'number', prompt: `So how much is the first share, ${p} part${p === 1 ? '' : 's'}?`, answer: D(p * one), unit, feedback: () => `${p} lots of one part.` },
      { type: 'number', prompt: `And the second share, ${q} part${q === 1 ? '' : 's'}?`, answer: D(q * one), unit, feedback: () => `${q} lots of one part. Check: the two shares add up to ${show(total)}.` },
    ];
    const workings = [`${p} + ${q} = ${parts} parts.`, `One part is ${show(total)} ÷ ${parts} = ${show(one)}.`, `The shares are ${p} × ${one} = ${show(p * one)} and ${q} × ${one} = ${show(q * one)}.`];
    if (fractionQ) {
      const f = simplify(F(p, parts));
      steps.push({ type: 'fraction', prompt: `What fraction of the total is the first share?`, answer: f, simplest: true, feedback: () => `The first share is ${p} of the ${parts} parts.` });
      workings.push(`The first share is ${p} of ${parts} parts, so it is ${fracText(f)} of the total.`);
    }
    return { round: 'share', prompt, steps, workings, check: { kind: 'share', total, p, q, answer: fractionQ ? fracText(simplify(F(p, parts))) : show(q * one) } };
  }
}

type Situation = { kind: 'direct' | 'inverse'; ask: (n1: number, v1: number, n2: number) => string; unit: string; more: string; one: string };
const SITUATIONS: Situation[] = [
  { kind: 'direct', ask: (n1, v1, n2) => `${n1} bags of rice cost £${v1}. How much do ${n2} bags cost?`, unit: '£', more: 'More bags cost more.', one: 'one bag' },
  { kind: 'direct', ask: (n1, v1, n2) => `A rover drives ${v1} km in ${n1} hours. How far does it drive in ${n2} hours at the same speed?`, unit: 'km', more: 'More time means further.', one: 'one hour' },
  { kind: 'direct', ask: (n1, v1, n2) => `${n1} solar panels make ${v1} watts. How many watts do ${n2} of the same panels make?`, unit: 'watts', more: 'More panels make more.', one: 'one panel' },
  { kind: 'inverse', ask: (n1, v1, n2) => `Food for ${n1} astronauts lasts ${v1} days. How long would the same food last ${n2} astronauts?`, unit: 'days', more: 'More astronauts eat it faster, so it lasts less time.', one: 'astronaut-days' },
  { kind: 'inverse', ask: (n1, v1, n2) => `${n1} workers take ${v1} days to build a launch pad. How long would ${n2} workers take, working at the same rate?`, unit: 'days', more: 'More workers finish sooner.', one: 'worker-days' },
];

function proportion(r: () => number): Question {
  for (;;) {
    const sit = pick(r, SITUATIONS);
    const n1 = int(r, 2, 8);
    let n2 = int(r, 2, 12);
    if (n2 === n1) continue;
    if (sit.kind === 'direct') {
      const each = int(r, 2, 30);
      const v1 = n1 * each;
      if (SHOWN.has(`direct ${n1} ${v1} ${n2}`)) continue;
      const answer = each * n2;
      const options = shuffle(r, ['It goes up', 'It goes down']);
      const right = n2 > n1 ? 'It goes up' : 'It goes down';
      const money = sit.unit === '£';
      const show = (v: number) => (money ? `£${v}` : `${v} ${sit.unit}`);
      return {
        round: 'proportion',
        prompt: sit.ask(n1, v1, n2),
        steps: [
          { type: 'choice', prompt: `Going from ${n1} to ${n2}, does the answer go up or down?`, options, correct: options.indexOf(right), why: whyAll(options, options.indexOf(right), () => `${sit.more} This is direct proportion.`) },
          { type: 'number', prompt: `How much for ${sit.one}?`, answer: D(each), unit: sit.unit, feedback: () => `Divide by ${n1}: ${show(v1)} ÷ ${n1}.` },
          { type: 'number', prompt: `So how much for ${n2}?`, answer: D(answer), unit: sit.unit, feedback: () => `${n2} lots of ${show(each)}.` },
        ],
        workings: [`Direct proportion: ${sit.more.toLowerCase()}`, `For ${sit.one}: ${show(v1)} ÷ ${n1} = ${show(each)}.`, `For ${n2}: ${n2} × ${show(each)} = ${show(answer)}.`],
        check: { kind: 'direct', n1, v1, n2, answer },
      };
    }
    // Inverse: the product stays the same, so pick numbers that divide exactly.
    const product = n1 * int(r, 3, 30);
    const v1 = product / n1;
    const divisors = [...Array(20).keys()].map((k) => k + 2).filter((d) => product % d === 0 && d !== n1);
    if (!divisors.length) continue;
    n2 = pick(r, divisors);
    if (SHOWN.has(`inverse ${n1} ${v1} ${n2}`)) continue;
    const answer = product / n2;
    const asDirect = (v1 * n2) / n1; // the slip: treating it as direct proportion
    const options = shuffle(r, ['It goes up', 'It goes down']);
    const right = n2 > n1 ? 'It goes down' : 'It goes up';
    return {
      round: 'proportion',
      prompt: sit.ask(n1, v1, n2),
      steps: [
        { type: 'choice', prompt: `Going from ${n1} to ${n2}, does the number of days go up or down?`, options, correct: options.indexOf(right), why: whyAll(options, options.indexOf(right), () => `${sit.more} This is inverse proportion.`) },
        { type: 'number', prompt: `Multiply them: how many ${sit.one} is that in total? ${n1} × ${v1} = ?`, answer: D(product), feedback: () => `Work out ${n1} × ${v1}.` },
        {
          type: 'number',
          prompt: `Share the ${product} ${sit.one} between ${n2}. How many days?`,
          answer: D(answer),
          unit: 'days',
          feedback: (g) => (Number.isInteger(asDirect) && sameNumber(g, asDirect) && asDirect !== answer ? `That treats it as direct proportion. ${sit.more} Divide the total by ${n2}.` : `Work out ${product} ÷ ${n2}.`),
        },
      ],
      workings: [`Inverse proportion: ${sit.more.toLowerCase()}`, `The total stays the same: ${n1} × ${v1} = ${product} ${sit.one}.`, `${product} ÷ ${n2} = ${answer} days.`],
      check: { kind: 'inverse', n1, v1, n2, answer },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'share') return share(r);
  if (round === 'proportion') return proportion(r);
  return simplifyRatio(r);
}

export const proportionsQuiz: LessonQuiz<ProportionCheck> = {
  lesson: 'proportions',
  storageKey: 'stella-quiz-proportions-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
