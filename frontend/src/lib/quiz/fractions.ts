/**
 * Quiz for "Fractions and Proportions" (KAN-72): equivalent fractions, simplest form, fractions of amounts and
 * one amount as a fraction of another. Year 5, with the key stage 3 statement. Built on lib/quiz/core.ts.
 */
import { D, F, fracText, gcd, int, pick, sameNumber, simplify, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';
import type { Digits } from '@/lib/measures';

export type Round = 'equivalent' | 'simplest' | 'amounts';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  equivalent: { label: 'Equivalent fractions', blurb: 'Find the missing number. Multiply or divide the top and bottom by the same number.' },
  simplest: { label: 'Simplest form', blurb: 'Find the biggest number that divides into both, then simplify.' },
  amounts: { label: 'Fractions of amounts', blurb: 'Two thirds of 90 kg, and what fraction one amount is of another.' },
};

export type FractionsCheck =
  | { kind: 'scale-up'; n: number; d: number; to: number; answer: string }
  | { kind: 'scale-down'; n: number; d: number; to: number; answer: string }
  | { kind: 'simplest'; n: number; d: number; answer: string }
  | { kind: 'of-amount'; n: number; d: number; a: number; answer: string }
  | { kind: 'part-whole'; part: number; whole: number; answer: string };
type Question = Q<FractionsCheck>;

/** Examples shown on the lesson page. The quiz never asks these. */
const SHOWN = new Set([
  'eq 1/2 4', 'eq 1/2 8', 'eq 1/2 100', 'eq 2/4 8', 'eq 7/10 100', 'eq 9/10 100', 'eq 1/4 100', 'eq 1/5 100',
  'simplest 10/15', 'simplest 2/4', 'simplest 50/100', 'simplest 75/100', 'simplest 4/8',
  'of 2/3 90',
  'pw 300 900', 'pw 15 10', 'pw 7500 10000',
]);

const num = (d: Digits) => Number(d.digits) * 10 ** (d.top - d.digits.length + 1);

// ---------------------------------------------------------------------------------------------
// Equivalent fractions
// ---------------------------------------------------------------------------------------------

function equivalent(r: () => number): Question {
  for (;;) {
    const d = pick(r, [2, 3, 4, 5, 6, 8, 10]);
    const n = int(r, 1, d - 1);
    if (gcd(BigInt(n), BigInt(d)) !== 1n) continue;
    const k = pick(r, [2, 3, 4, 5, 6, 10, ...(d === 10 ? [10] : [])]);
    const D2 = d * k;
    const N2 = n * k;
    const up = r() < 0.6; // most often "?/20"; sometimes the other way, from the bigger fraction down
    if (SHOWN.has(`eq ${n}/${d} ${D2}`) || SHOWN.has(`eq ${N2}/${D2} ${d}`)) continue;
    if (up) {
      const added = n + (D2 - d); // the slip: adding the same number to the top and bottom
      return {
        round: 'equivalent',
        prompt: `Find the missing number: ${n}/${d} = ?/${D2}`,
        steps: [
          { type: 'number', prompt: `${d} times what makes ${D2}?`, answer: D(k), feedback: () => `Work out ${D2} ÷ ${d}.` },
          {
            type: 'number',
            prompt: `Multiply the top by the same number. ${n} × ${k} = ?`,
            answer: D(N2),
            feedback: (g) => (sameNumber(g, added) && added !== N2 ? `It looks like you added ${D2 - d} to the top, as you did to the bottom. Fractions stay the same size when you multiply, not add.` : `Work out ${n} × ${k}.`),
          },
        ],
        workings: [`${d} × ${k} = ${D2}, so multiply the top by ${k} too.`, `${n} × ${k} = ${N2}.`, `So ${n}/${d} = ${N2}/${D2}.`],
        check: { kind: 'scale-up', n, d, to: D2, answer: String(N2) },
      };
    }
    const subtracted = N2 - (D2 - d);
    return {
      round: 'equivalent',
      prompt: `Find the missing number: ${N2}/${D2} = ?/${d}`,
      steps: [
        { type: 'number', prompt: `${D2} divided by what makes ${d}?`, answer: D(k), feedback: () => `Work out ${D2} ÷ ${d}.` },
        {
          type: 'number',
          prompt: `Divide the top by the same number. ${N2} ÷ ${k} = ?`,
          answer: D(n),
          feedback: (g) => (subtracted > 0 && sameNumber(g, subtracted) && subtracted !== n ? `It looks like you took ${D2 - d} off the top, as from the bottom. Fractions stay the same size when you divide, not subtract.` : `Work out ${N2} ÷ ${k}.`),
        },
      ],
      workings: [`${D2} ÷ ${k} = ${d}, so divide the top by ${k} too.`, `${N2} ÷ ${k} = ${n}.`, `So ${N2}/${D2} = ${n}/${d}.`],
      check: { kind: 'scale-down', n: N2, d: D2, to: d, answer: String(n) },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Simplest form
// ---------------------------------------------------------------------------------------------

/** The two steps that simplify n/d: the biggest common factor, then the fraction. */
function simplifySteps(n: number, d: number): { steps: Step[]; g: number; simple: string } {
  const g = Number(gcd(BigInt(n), BigInt(d)));
  const s = simplify(F(n, d));
  return {
    g,
    simple: fracText(s),
    steps: [
      {
        type: 'number',
        prompt: `What is the biggest number that divides into both ${n} and ${d}?`,
        answer: D(g),
        feedback: (x) => {
          const v = num(x);
          if (v === 1) return '1 divides into every number. Look for a bigger number that divides into both.';
          if (Number.isInteger(v) && v > 1 && n % v === 0 && d % v === 0) return `${v} divides into both, but a bigger number does too.`;
          return `${v} does not divide into both ${n} and ${d}. List the numbers that divide into ${n}, and find the biggest that also divides into ${d}.`;
        },
      },
      { type: 'fraction', prompt: `Divide the top and bottom by ${g}. What is ${n}/${d} in its simplest form?`, answer: s, simplest: true, feedback: () => `Work out ${n} ÷ ${g} and ${d} ÷ ${g}.` },
    ],
  };
}

function simplest(r: () => number): Question {
  for (;;) {
    const d0 = pick(r, [3, 4, 5, 6, 7, 8, 9, 10, 12]);
    const n0 = int(r, 1, d0 - 1);
    if (gcd(BigInt(n0), BigInt(d0)) !== 1n) continue;
    const k = int(r, 2, 12);
    const n = n0 * k;
    const d = d0 * k;
    if (d > 144 || SHOWN.has(`simplest ${n}/${d}`)) continue;
    const { steps, g, simple } = simplifySteps(n, d);
    return {
      round: 'simplest',
      prompt: `Write ${n}/${d} in its simplest form.`,
      steps,
      workings: [`${g} is the biggest number that divides into ${n} and ${d}.`, `${n} ÷ ${g} = ${n / g} and ${d} ÷ ${g} = ${d / g}.`, `So ${n}/${d} = ${simple}.`],
      check: { kind: 'simplest', n, d, answer: simple },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Fractions of amounts
// ---------------------------------------------------------------------------------------------

const AMOUNT_CONTEXTS = [
  { ask: (f: string, a: number) => `What is ${f} of ${a}?`, unit: undefined as string | undefined, show: (v: number | string) => String(v), min: 6, max: 200 },
  { ask: (f: string, a: number) => `A satellite has a mass of ${a} kg. Of that, ${f} is fuel. What is the mass of the fuel?`, unit: 'kg', show: (v: number | string) => `${v} kg`, min: 60, max: 600 },
  { ask: (f: string, a: number) => `A rover must drive ${a} km. It has done ${f} of the drive. How far is that?`, unit: 'km', show: (v: number | string) => `${v} km`, min: 12, max: 300 },
  { ask: (f: string, a: number) => `A class of ${a} pupils voted. Of them, ${f} chose Mars. How many pupils is that?`, unit: undefined, show: (v: number | string) => String(v), min: 20, max: 36 },
];

function ofAmount(r: () => number): Question {
  for (;;) {
    const d = pick(r, [3, 4, 5, 6, 8, 10]);
    const n = int(r, 2, d - 1);
    if (gcd(BigInt(n), BigInt(d)) !== 1n) continue;
    // A multiple of both n and d, so dividing by the top by mistake gives a whole number the feedback can name.
    const step = (n * d) / Number(gcd(BigInt(n), BigInt(d)));
    const ctx = pick(r, AMOUNT_CONTEXTS);
    const a = step * int(r, Math.ceil(ctx.min / step), Math.max(Math.ceil(ctx.min / step), Math.floor(ctx.max / step)));
    if (a < ctx.min || a > ctx.max || a / n === a / d || SHOWN.has(`of ${n}/${d} ${a}`)) continue;
    const one = a / d;
    const answer = one * n;
    const byTop = a / n; // the slip: dividing by the top number
    return {
      round: 'amounts',
      prompt: ctx.ask(`${n}/${d}`, a),
      steps: [
        {
          type: 'number',
          prompt: `First find 1/${d}: divide ${ctx.show(a)} by the bottom number. What is 1/${d} of ${a}?`,
          answer: D(one),
          feedback: (g) => (Number.isInteger(byTop) && sameNumber(g, byTop) && byTop !== one ? `It looks like you divided by the top number, ${n}. Divide by the bottom number, ${d}: it says how many equal parts.` : `Work out ${a} ÷ ${d}.`),
        },
        {
          type: 'number',
          prompt: `Then multiply by the top number. So what is ${n}/${d} of ${a}?`,
          answer: D(answer),
          unit: ctx.unit,
          feedback: () => `You have ${n} of those parts: ${one} × ${n}.`,
        },
      ],
      workings: [`${a} ÷ ${d} = ${one}, so 1/${d} of ${a} is ${one}.`, `${one} × ${n} = ${answer}.`, `So ${n}/${d} of ${ctx.show(a)} is ${ctx.show(answer)}.`],
      check: { kind: 'of-amount', n, d, a, answer: String(answer) },
    };
  }
}

const PART_WHOLE = [
  { make: (p: number, w: number) => `A lander has a mass of ${w} kg, and ${p} kg of that is fuel. What fraction of the lander is fuel?`, min: 100, max: 2000 },
  { make: (p: number, w: number) => `A team of ${w} people builds a rover. Of them, ${p} are engineers. What fraction of the team are engineers?`, min: 8, max: 40 },
  { make: (p: number, w: number) => `A probe sends ${w} pictures, and ${p} of them show clouds. What fraction of the pictures show clouds?`, min: 10, max: 200 },
];
const BIGGER = { make: (p: number, w: number) => `A rocket is ${p} m tall. Another is ${w} m tall. What fraction of the second rocket's height is the first? Your answer will be bigger than 1.`, min: 4, max: 120 };

function partWhole(r: () => number): Question {
  for (;;) {
    const bigger = r() < 0.2; // key stage 3: a fraction greater than 1
    const d0 = pick(r, [2, 3, 4, 5, 8, 10]);
    const n0 = bigger ? int(r, d0 + 1, 2 * d0) : int(r, 1, d0 - 1);
    if (gcd(BigInt(n0), BigInt(d0)) !== 1n) continue;
    const ctx = bigger ? BIGGER : pick(r, PART_WHOLE);
    const k = bigger ? int(r, 2, 6) : pick(r, [2, 3, 4, 5, 6, 10, 20, 25, 50, 100]);
    const part = n0 * k;
    const whole = d0 * k;
    if (whole < ctx.min || whole > ctx.max) continue;
    if (SHOWN.has(`pw ${part} ${whole}`) || SHOWN.has(`simplest ${part}/${whole}`)) continue;
    const { steps, g, simple } = simplifySteps(part, whole);
    return {
      round: 'amounts',
      prompt: ctx.make(part, whole),
      steps: [
        {
          type: 'fraction',
          prompt: bigger ? `Put the first height over the second.` : `Put the part over the whole. Which fraction is that, before simplifying?`,
          answer: F(part, whole),
          simplest: false,
          denominator: BigInt(whole),
          feedback: (f) => (f.n === BigInt(whole) && f.d === BigInt(part) ? `That is upside down. ${bigger ? 'The first height goes on top.' : 'The part goes on top, the whole underneath.'}` : `Write ${part} over ${whole}.`),
        },
        ...steps,
      ],
      workings: [`${bigger ? 'First over second' : 'Part over whole'}: ${part}/${whole}.`, `${g} is the biggest number that divides into ${part} and ${whole}.`, `So the answer is ${simple}.`],
      check: { kind: 'part-whole', part, whole, answer: simple },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'equivalent') return equivalent(r);
  if (round === 'simplest') return simplest(r);
  return r() < 0.5 ? ofAmount(r) : partWhole(r);
}

export const fractionsQuiz: LessonQuiz<FractionsCheck> = {
  lesson: 'fractions',
  storageKey: 'stella-quiz-fractions-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
