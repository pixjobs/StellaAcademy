/**
 * Quiz for "Calculating with Fractions" (KAN-73): adding and subtracting, mixed numbers, multiplying, and
 * dividing by a whole number. Year 6. Built on lib/quiz/core.ts; every fraction is exact.
 */
import { D, F, fracEqual, fracText, gcd, int, pick, sameNumber, shuffle, simplify, whyAll, type Fraction, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';
import type { Digits } from '@/lib/measures';

export type Round = 'add' | 'mixed' | 'multiply';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  add: { label: 'Add and subtract', blurb: 'Make the bottom numbers the same first, then add or take away the tops.' },
  mixed: { label: 'Mixed numbers', blurb: 'Whole numbers and fractions together, such as 2 1/4 + 1 1/3.' },
  multiply: { label: 'Multiply and divide', blurb: 'Multiply two fractions, or share a fraction by a whole number.' },
};

export type FractionOpsCheck = { kind: 'add' | 'sub' | 'mixed-add' | 'mixed-sub' | 'mul' | 'div'; a: string; b: string; answer: string };
type Question = Q<FractionOpsCheck>;

/** Examples shown on the lesson page. The quiz never asks these. */
const SHOWN = new Set([
  'add 1/3 1/4', 'add 2/7 3/7', 'add 1/2 1/5', 'sub 3/4 1/3', 'sub 3/4 2/8', 'sub 3/4 1/4',
  'mixed-add 1 1/2 2 1/3', 'mixed-sub 3 1/4 1 1/2',
  'mul 4/5 1/2', 'mul 1/2 1/4', 'mul 2/3 3/4', 'div 1/2 3', 'div 3/4 2',
]);

const big = (x: bigint) => Number(x);
const lcm = (a: number, b: number) => (a * b) / Number(gcd(BigInt(a), BigInt(b)));
const num = (d: Digits) => Number(d.digits) * 10 ** (d.top - d.digits.length + 1);
/** "2 3/4" for an improper fraction, or the fraction itself when it is less than 1. */
function mixedText(f: Fraction): string {
  const s = simplify(f);
  const w = s.n / s.d;
  const rest = s.n % s.d;
  if (w === 0n) return fracText(s);
  return rest === 0n ? String(w) : `${w} ${rest}/${s.d}`;
}

/** A proper fraction in its simplest form with a bottom number from the list. */
function proper(r: () => number, bottoms: number[]): Fraction {
  for (;;) {
    const d = pick(r, bottoms);
    const n = int(r, 1, d - 1);
    if (gcd(BigInt(n), BigInt(d)) === 1n) return F(n, d);
  }
}

/** The common-bottom step: the smallest number both bottoms divide into. */
function lcmStep(b: number, d: number): Step {
  const L = lcm(b, d);
  return {
    type: 'number',
    prompt: `What is the smallest number that both ${b} and ${d} divide into?`,
    answer: D(L),
    feedback: (g) => {
      const v = num(g);
      if (Number.isInteger(v) && v > L && v % b === 0 && v % d === 0) return `${v} works, but a smaller number does too.`;
      return `Count up in ${Math.max(b, d)}s until you reach a number that ${Math.min(b, d)} also divides into.`;
    },
  };
}

/** Rewrite one fraction over the common bottom number. */
function overStep(f: Fraction, L: number): Step {
  const k = L / big(f.d);
  return {
    type: 'fraction',
    prompt: `Write ${fracText(f)} with ${L} on the bottom.`,
    answer: F(big(f.n) * k, L),
    simplest: false,
    denominator: BigInt(L),
    feedback: () => `${big(f.d)} × ${k} = ${L}, so multiply the top by ${k} too.`,
  };
}

// ---------------------------------------------------------------------------------------------
// Add and subtract
// ---------------------------------------------------------------------------------------------

function addSub(r: () => number): Question {
  for (;;) {
    const x = proper(r, [2, 3, 4, 5, 6, 8, 9, 10, 12]);
    const y = proper(r, [2, 3, 4, 5, 6, 8, 9, 10, 12]);
    if (x.d === y.d) continue;
    const sub = r() < 0.4;
    const [a, b] = sub && big(x.n) * big(y.d) < big(y.n) * big(x.d) ? [y, x] : [x, y]; // bigger first when subtracting
    const L = lcm(big(a.d), big(b.d));
    const exact = sub ? F(big(a.n) * big(b.d) - big(b.n) * big(a.d), big(a.d) * big(b.d)) : F(big(a.n) * big(b.d) + big(b.n) * big(a.d), big(a.d) * big(b.d));
    if (exact.n <= 0n || big(exact.n) >= big(exact.d)) continue; // a proper fraction, so the answer is not a mixed number here
    const key = `${sub ? 'sub' : 'add'} ${fracText(a)} ${fracText(b)}`;
    if (SHOWN.has(key) || L > 60) continue;
    const answer = simplify(exact);
    const sign = sub ? '−' : '+';
    const sumTops = F(big(a.n) + (sub ? -big(b.n) : big(b.n)), big(a.d) + big(b.d)); // the slip: adding tops and bottoms
    const ka = L / big(a.d);
    const kb = L / big(b.d);
    const top = sub ? big(a.n) * ka - big(b.n) * kb : big(a.n) * ka + big(b.n) * kb;
    return {
      round: 'add',
      prompt: `Work out ${fracText(a)} ${sign} ${fracText(b)}. Give your answer in its simplest form.`,
      steps: [
        lcmStep(big(a.d), big(b.d)),
        // A fraction already over the common bottom number needs no step.
        ...(big(a.d) === L ? [] : [overStep(a, L)]),
        ...(big(b.d) === L ? [] : [overStep(b, L)]),
        {
          type: 'fraction',
          prompt: `${sub ? 'Take away' : 'Add'} the tops and keep the bottom, then simplify if you can. What is the answer?`,
          answer,
          simplest: true,
          feedback: (g) =>
            !sub && fracEqual(g, sumTops) && !fracEqual(sumTops, answer)
              ? `It looks like you added the bottom numbers too. Only the tops are added: the bottom stays ${L}.`
              : `${big(a.n) * ka}/${L} ${sign} ${big(b.n) * kb}/${L}: ${sub ? 'take away' : 'add'} the tops.`,
        },
      ],
      workings: [
        `${L} is the smallest number that ${big(a.d)} and ${big(b.d)} both divide into.`,
        `${fracText(a)} = ${big(a.n) * ka}/${L} and ${fracText(b)} = ${big(b.n) * kb}/${L}.`,
        `${big(a.n) * ka}/${L} ${sign} ${big(b.n) * kb}/${L} = ${top}/${L}${fracText(F(top, L)) === fracText(answer) ? '' : ` = ${fracText(answer)}`}.`,
      ],
      check: { kind: sub ? 'sub' : 'add', a: fracText(a), b: fracText(b), answer: fracText(answer) },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Mixed numbers
// ---------------------------------------------------------------------------------------------

function mixed(r: () => number): Question {
  for (;;) {
    const x = proper(r, [2, 3, 4, 5, 6, 8, 10]);
    const y = proper(r, [2, 3, 4, 5, 6, 8, 10]);
    const L = lcm(big(x.d), big(y.d));
    if (L > 40) continue;
    const w1 = int(r, 1, 5);
    const w2 = int(r, 1, 4);
    const sub = r() < 0.5;
    if (!sub) {
      const fracSum = F(big(x.n) * big(y.d) + big(y.n) * big(x.d), big(x.d) * big(y.d));
      if (big(fracSum.n) >= big(fracSum.d)) continue; // the fractions add to less than 1
      const key = `mixed-add ${w1} ${fracText(x)} ${w2} ${fracText(y)}`;
      if (SHOWN.has(key)) continue;
      const fs = simplify(fracSum);
      const total = F(BigInt(w1 + w2) * fs.d + fs.n, fs.d);
      const ka = L / big(x.d);
      const kb = L / big(y.d);
      return {
        round: 'mixed',
        prompt: `Work out ${w1} ${fracText(x)} + ${w2} ${fracText(y)}. Give your answer as a mixed number.`,
        steps: [
          { type: 'number', prompt: `Add the whole numbers: ${w1} + ${w2} = ?`, answer: D(w1 + w2), feedback: () => `Just the whole numbers: ${w1} + ${w2}.` },
          lcmStep(big(x.d), big(y.d)),
          {
            type: 'fraction',
            prompt: `Add the fractions over ${L}: ${fracText(x)} + ${fracText(y)} = ?/${L}`,
            answer: F(big(x.n) * ka + big(y.n) * kb, L),
            simplest: false,
            denominator: BigInt(L),
            feedback: () => `${fracText(x)} = ${big(x.n) * ka}/${L} and ${fracText(y)} = ${big(y.n) * kb}/${L}. Add the tops.`,
          },
          {
            type: 'fraction',
            prompt: `So what is ${w1} ${fracText(x)} + ${w2} ${fracText(y)}? Type a mixed number such as 3 5/6.`,
            answer: total,
            simplest: true,
            mixed: true,
            feedback: () => `Put the whole number ${w1 + w2} with the fraction you found, simplified.`,
          },
        ],
        workings: [`Whole numbers: ${w1} + ${w2} = ${w1 + w2}.`, `Fractions: ${big(x.n) * ka}/${L} + ${big(y.n) * kb}/${L} = ${big(x.n) * ka + big(y.n) * kb}/${L}.`, `So the answer is ${mixedText(total)}.`],
        check: { kind: 'mixed-add', a: `${w1} ${fracText(x)}`, b: `${w2} ${fracText(y)}`, answer: mixedText(total) },
      };
    }
    // Subtract: turn both into improper fractions over the common bottom number.
    const A = F(BigInt(w1 + w2) * x.d + x.n, x.d); // the bigger mixed number
    const B = F(BigInt(w2) * y.d + y.n, y.d);
    const key = `mixed-sub ${mixedText(A)} ${mixedText(B)}`;
    if (SHOWN.has(key)) continue;
    const diff = F(big(A.n) * big(B.d) - big(B.n) * big(A.d), big(A.d) * big(B.d));
    if (diff.n <= 0n) continue;
    const answer = simplify(diff);
    const ka = L / big(A.d);
    const kb = L / big(B.d);
    return {
      round: 'mixed',
      prompt: `Work out ${mixedText(A)} − ${mixedText(B)}. Give your answer in its simplest form.`,
      steps: [
        lcmStep(big(A.d), big(B.d)),
        { type: 'fraction', prompt: `Write ${mixedText(A)} as an improper fraction with ${L} on the bottom.`, answer: F(big(A.n) * ka, L), simplest: false, denominator: BigInt(L), feedback: () => `${w1 + w2} whole ones is ${(w1 + w2) * L}/${L}. Add the ${big(x.n) * ka}/${L}.` },
        { type: 'fraction', prompt: `Write ${mixedText(B)} as an improper fraction with ${L} on the bottom.`, answer: F(big(B.n) * kb, L), simplest: false, denominator: BigInt(L), feedback: () => `${w2} whole ones is ${w2 * L}/${L}. Add the ${big(y.n) * kb}/${L}.` },
        { type: 'fraction', prompt: `Take away the tops. What is the answer? You can type it as a mixed number.`, answer, simplest: true, mixed: true, feedback: () => `${big(A.n) * ka}/${L} − ${big(B.n) * kb}/${L}: take away the tops, then simplify.` },
      ],
      workings: [`${mixedText(A)} = ${big(A.n) * ka}/${L} and ${mixedText(B)} = ${big(B.n) * kb}/${L}.`, `${big(A.n) * ka}/${L} − ${big(B.n) * kb}/${L} = ${big(A.n) * ka - big(B.n) * kb}/${L}.`, `So the answer is ${mixedText(answer)}.`],
      check: { kind: 'mixed-sub', a: mixedText(A), b: mixedText(B), answer: mixedText(answer) },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Multiply and divide
// ---------------------------------------------------------------------------------------------

function multiplyDivide(r: () => number): Question {
  for (;;) {
    if (r() < 0.55) {
      const a = proper(r, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const b = proper(r, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const key = `mul ${fracText(a)} ${fracText(b)}`;
      if (SHOWN.has(key)) continue;
      const tops = big(a.n) * big(b.n);
      const bottoms = big(a.d) * big(b.d);
      const answer = simplify(F(tops, bottoms));
      return {
        round: 'multiply',
        prompt: `Work out ${fracText(a)} × ${fracText(b)}. Give your answer in its simplest form.`,
        steps: [
          { type: 'number', prompt: `Multiply the tops: ${big(a.n)} × ${big(b.n)} = ?`, answer: D(tops), feedback: () => `Work out ${big(a.n)} × ${big(b.n)}.` },
          { type: 'number', prompt: `Multiply the bottoms: ${big(a.d)} × ${big(b.d)} = ?`, answer: D(bottoms), feedback: (g) => (sameNumber(g, lcm(big(a.d), big(b.d))) && lcm(big(a.d), big(b.d)) !== bottoms ? 'To multiply you do not need a common bottom number: just multiply the bottoms.' : `Work out ${big(a.d)} × ${big(b.d)}.`) },
          { type: 'fraction', prompt: `So ${fracText(a)} × ${fracText(b)} = ${tops}/${bottoms}. What is that in its simplest form?`, answer, simplest: true, feedback: () => `Divide the top and bottom of ${tops}/${bottoms} by the biggest number that goes into both.` },
        ],
        workings: [`Tops: ${big(a.n)} × ${big(b.n)} = ${tops}. Bottoms: ${big(a.d)} × ${big(b.d)} = ${bottoms}.`, `${tops}/${bottoms}${fracText(answer) === `${tops}/${bottoms}` ? ' is already in its simplest form' : ` = ${fracText(answer)}`}.`, `So the answer is ${fracText(answer)}.`],
        check: { kind: 'mul', a: fracText(a), b: fracText(b), answer: fracText(answer) },
      };
    }
    const a = proper(r, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const n = int(r, 2, 6);
    const key = `div ${fracText(a)} ${n}`;
    if (SHOWN.has(key)) continue;
    const bottom = big(a.d) * n;
    const answer = simplify(F(big(a.n), bottom));
    const options = shuffle(r, ['It stays the same', `It is multiplied by ${n}`, `It is divided by ${n}`]);
    const correct = options.indexOf('It stays the same');
    const slipTimes = F(big(a.n) * n, big(a.d));
    return {
      round: 'multiply',
      prompt: `Work out ${fracText(a)} ÷ ${n}. Give your answer in its simplest form.`,
      steps: [
        {
          type: 'choice',
          prompt: `Sharing ${fracText(a)} into ${n} equal parts: what happens to the top number?`,
          options,
          correct,
          why: whyAll(options, correct, () => `Each part is a smaller piece, not fewer pieces: the top stays ${big(a.n)}, and the pieces get smaller.`),
        },
        { type: 'number', prompt: `The pieces get ${n} times smaller. What is the new bottom number?`, answer: D(bottom), feedback: () => `Multiply the bottom by ${n}: ${big(a.d)} × ${n}.` },
        {
          type: 'fraction',
          prompt: `So what is ${fracText(a)} ÷ ${n}, in its simplest form?`,
          answer,
          simplest: true,
          feedback: (g) => (fracEqual(g, slipTimes) ? `That is ${fracText(a)} × ${n}, which is bigger. Sharing makes each part smaller.` : `${big(a.n)}/${bottom}, simplified if you can.`),
        },
      ],
      workings: [`Sharing into ${n} parts keeps the top and multiplies the bottom by ${n}.`, `${fracText(a)} ÷ ${n} = ${big(a.n)}/${bottom}.`, `So the answer is ${fracText(answer)}.`],
      check: { kind: 'div', a: fracText(a), b: String(n), answer: fracText(answer) },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'add') return addSub(r);
  if (round === 'mixed') return mixed(r);
  return multiplyDivide(r);
}

export const fractionOpsQuiz: LessonQuiz<FractionOpsCheck> = {
  lesson: 'fraction-ops',
  storageKey: 'stella-quiz-fraction-ops-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
