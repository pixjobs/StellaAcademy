/**
 * Quiz for "Ratio and Proportion" (KAN-78): simplifying ratios, sharing in a ratio, direct and inverse
 * proportion. Key stage 3. Built on lib/quiz/core.ts; every answer is a whole number.
 */
import { D, F, fmt, fracText, gcd, int, pick, sameNumber, shuffle, simplify, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';
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
      `A rocket mixture has ${a} kg of fuel to ${b} kg of oxidiser. Write the ratio of fuel to oxidiser in its simplest form.`,
      ...(a + b <= 34 ? [`A class has ${a} girls and ${b} boys. Write the ratio of girls to boys in its simplest form.`] : []),
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
    // The slip: dividing by one part of the ratio instead of all the parts.
    const byPart = [total / p, total / q].filter((x) => Number.isInteger(x) && x !== one);
    const steps: Step[] = [
      { type: 'number', prompt: `How many parts are there altogether?`, answer: D(parts), feedback: () => `Add the parts of the ratio: ${p} + ${q}.` },
      {
        type: 'number',
        prompt: `So how much is one part?`,
        answer: D(one),
        unit,
        feedback: (g) => (byPart.some((x) => sameNumber(g, x)) ? `It looks like you divided by one part of the ratio. Divide by all the parts: ${p} + ${q} = ${parts}.` : `Share ${show(total)} into ${parts} equal parts.`),
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

type Situation = {
  kind: 'direct' | 'inverse';
  ask: (n1: number, v1: number, n2: number) => string;
  /** The thing that changes from n1 to n2, and the unit of the answer. */
  thing: string;
  unit: string;
  /** Why the answer goes the way it does, for more and for fewer. */
  more: string;
  fewer: string;
  /** Direct: the amount for one; inverse: the name of the total. */
  one: string;
};
const SITUATIONS: Situation[] = [
  { kind: 'direct', ask: (n1, v1, n2) => `${n1} bags of rice cost £${v1}. How much do ${n2} bags cost?`, thing: 'bags', unit: '£', more: 'More bags cost more.', fewer: 'Fewer bags cost less.', one: 'one bag' },
  { kind: 'direct', ask: (n1, v1, n2) => `Hiring a car costs £${v1} for ${n1} days. How much does it cost for ${n2} days?`, thing: 'days', unit: '£', more: 'More days cost more.', fewer: 'Fewer days cost less.', one: 'one day' },
  { kind: 'direct', ask: (n1, v1, n2) => `A rover drives ${v1} km in ${n1} hours. How far does it drive in ${n2} hours at the same speed?`, thing: 'hours', unit: 'km', more: 'More time means further.', fewer: 'Less time means less far.', one: 'one hour' },
  { kind: 'direct', ask: (n1, v1, n2) => `${n1} solar panels make ${v1} watts. How many watts do ${n2} of the same panels make?`, thing: 'panels', unit: 'watts', more: 'More panels make more.', fewer: 'Fewer panels make less.', one: 'one panel' },
  { kind: 'inverse', ask: (n1, v1, n2) => `Food for ${n1} astronauts lasts ${v1} days. How long would the same food last ${n2} astronauts?`, thing: 'astronauts', unit: 'days', more: 'More astronauts eat it faster, so it lasts less time.', fewer: 'Fewer astronauts eat it more slowly, so it lasts longer.', one: 'astronaut-days' },
  { kind: 'inverse', ask: (n1, v1, n2) => `${n1} workers take ${v1} days to build a launch pad. How long would ${n2} workers take, working at the same rate?`, thing: 'workers', unit: 'days', more: 'More workers finish sooner.', fewer: 'Fewer workers take longer.', one: 'worker-days' },
  { kind: 'inverse', ask: (n1, v1, n2) => `${n1} pumps fill a fuel tank in ${v1} hours. How long would ${n2} of the same pumps take?`, thing: 'pumps', unit: 'hours', more: 'More pumps fill it sooner.', fewer: 'Fewer pumps take longer.', one: 'pump-hours' },
];

/** The amount for one: realistic sizes for each situation. */
function each(r: () => number, sit: Situation): number {
  if (sit.unit === 'watts') return 50 * int(r, 4, 9); // a panel makes a few hundred watts
  if (sit.thing === 'days') return 5 * int(r, 6, 16); // a car costs £30 to £80 a day
  if (sit.thing === 'hours') return int(r, 2, 15); // km in an hour
  return int(r, 2, 9); // a bag of rice
}

function proportion(r: () => number): Question {
  for (;;) {
    const sit = pick(r, SITUATIONS);
    const n1 = int(r, 2, 8);
    let n2: number;
    let v1: number;
    let answer: number;
    let product = 0;
    if (sit.kind === 'direct') {
      n2 = int(r, 2, 12);
      const unitAmount = each(r, sit);
      v1 = n1 * unitAmount;
      answer = unitAmount * n2;
    } else {
      // Inverse: the product stays the same, so pick numbers that divide exactly.
      product = n1 * int(r, 3, 30);
      v1 = product / n1;
      const divisors = [...Array(11).keys()].map((k) => k + 2).filter((d) => product % d === 0 && d !== n1 && product / d > 1);
      if (!divisors.length) continue;
      n2 = pick(r, divisors);
      answer = product / n2;
    }
    if (n2 === n1 || SHOWN.has(`${sit.kind} ${n1} ${v1} ${n2}`)) continue;
    const goesUp = sit.kind === 'direct' ? n2 > n1 : n2 < n1;
    const options = shuffle(r, ['It goes up', 'It goes down']);
    const correct = options.indexOf(goesUp ? 'It goes up' : 'It goes down');
    const why = n2 > n1 ? sit.more : sit.fewer;
    const c = (v: number) => fmt(D(v)); // with commas from 1,000
    const show = (v: number) => (sit.unit === '£' ? `£${c(v)}` : `${c(v)} ${sit.unit}`);
    // The same first question for both kinds, so the wording does not give the kind away.
    const upDown: Step = {
      type: 'choice',
      prompt: `Going from ${n1} to ${n2} ${sit.thing}, does the answer go up or down?`,
      options,
      correct,
      why: whyAll(options, correct, () => `${why} This is ${sit.kind} proportion.`),
    };
    if (sit.kind === 'direct') {
      const unitAmount = v1 / n1;
      const how = sit.unit === 'km' ? 'far' : 'much';
      return {
        round: 'proportion',
        prompt: sit.ask(n1, v1, n2),
        steps: [
          upDown,
          { type: 'number', prompt: `How ${how} for ${sit.one}?`, answer: D(unitAmount), unit: sit.unit, feedback: () => `Divide by ${n1}: ${show(v1)} ÷ ${n1}.` },
          { type: 'number', prompt: `So how ${how} for ${n2} ${sit.thing}?`, answer: D(answer), unit: sit.unit, feedback: () => `${n2} lots of ${show(unitAmount)}.` },
        ],
        workings: [`Direct proportion: ${why.toLowerCase()}`, `For ${sit.one}: ${show(v1)} ÷ ${n1} = ${show(unitAmount)}.`, `For ${n2} ${sit.thing}: ${n2} × ${show(unitAmount)} = ${show(answer)}.`],
        check: { kind: 'direct', n1, v1, n2, answer },
      };
    }
    const asDirect = (v1 * n2) / n1; // the slip: treating it as direct proportion
    return {
      round: 'proportion',
      prompt: sit.ask(n1, v1, n2),
      steps: [
        upDown,
        { type: 'number', prompt: `Multiply them: how many ${sit.one} is that in total? ${n1} × ${v1} = ?`, answer: D(product), feedback: () => `Work out ${n1} × ${v1}.` },
        {
          type: 'number',
          prompt: `Share the ${product} ${sit.one} between ${n2} ${sit.thing}. How many ${sit.unit}?`,
          answer: D(answer),
          unit: sit.unit,
          feedback: (g) => (Number.isInteger(asDirect) && sameNumber(g, asDirect) && asDirect !== answer ? `That treats it as direct proportion. ${why} Divide the total by ${n2}.` : `Work out ${product} ÷ ${n2}.`),
        },
      ],
      workings: [`Inverse proportion: ${why.toLowerCase()}`, `The total stays the same: ${n1} × ${v1} = ${product} ${sit.one}.`, `${c(product)} ÷ ${n2} = ${c(answer)} ${sit.unit}.`],
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
