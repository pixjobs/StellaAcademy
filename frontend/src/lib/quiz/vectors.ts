/**
 * Quiz for "Vectors: Magnitude and Direction" (KAN-82): column vectors, magnitude, direction and parallel
 * vectors. GCSE with A-level parts; calculator answers are marked to 3 significant figures.
 * Column vectors are written [[top;bottom]] and drawn as columns by the quiz panel.
 */
import { D, approx, sf3, fmt, int, pick, sameNumber, shuffle, toNumber, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';

export type Round = 'columns' | 'magnitude' | 'direction';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  columns: { label: 'Column vectors', blurb: 'Add, take away and multiply: tops with tops, bottoms with bottoms.' },
  magnitude: { label: 'Magnitude', blurb: 'Square each part, add them, then take the square root.' },
  direction: { label: 'Direction and parallel', blurb: 'The angle from tan θ, and whether one vector is a multiple of another.' },
};

export type VectorsCheck =
  | { kind: 'combine'; a: [number, number]; b: [number, number]; ka: number; kb: number; answer: [number, number] }
  | { kind: 'magnitude'; v: [number, number]; answer: number }
  | { kind: 'direction'; v: [number, number]; answer: number }
  | { kind: 'parallel'; a: [number, number]; b: [number, number]; k: number | null };
type Question = Q<VectorsCheck>;

/** Examples shown on the lesson page, and the earlier practice questions. The quiz never asks these. */
const SHOWN = new Set(['3,2 2,-1', '3,2 1,-4', 'scale 3,2 3', 'mag 3000,4000', 'mag 6,8', 'mag -5,12', 'mag 4,3', 'mag 3,4']);

const sn = (x: number) => (x < 0 ? `−${fmt(D(-x))}` : fmt(D(x)));
/** In brackets when negative, after an operation sign: 2 × (−3). */
const br = (x: number) => (x < 0 ? `(${sn(x)})` : sn(x));
const col = (v: [number, number]) => `[[${sn(v[0])};${sn(v[1])}]]`;
const nz = (r: () => number, lo: number, hi: number) => {
  for (;;) {
    const x = int(r, lo, hi);
    if (x !== 0) return x;
  }
};
const short = sf3;

// ---------------------------------------------------------------------------------------------
// Column vectors
// ---------------------------------------------------------------------------------------------

function combine(r: () => number): Question {
  for (;;) {
    const a: [number, number] = [nz(r, -6, 9), nz(r, -6, 9)];
    const b: [number, number] = [nz(r, -6, 9), nz(r, -6, 9)];
    if (SHOWN.has(`${a} ${b}`) || (a[0] === b[0] && a[1] === b[1])) continue;
    // a + b, a − b, ka, ka + b, a − kb
    const form = pick(r, ['add', 'sub', 'scale', 'scale-add', 'sub-scale'] as const);
    const ka = form === 'scale' || form === 'scale-add' ? int(r, 2, 4) : 1;
    const kb = form === 'scale' ? 0 : form === 'sub' ? -1 : form === 'sub-scale' ? -int(r, 2, 3) : 1;
    if (form === 'scale' && SHOWN.has(`scale ${a} ${ka}`)) continue;
    const answer: [number, number] = [ka * a[0] + kb * b[0], ka * a[1] + kb * b[1]];
    const expr = form === 'add' ? 'a + b' : form === 'sub' ? 'a − b' : form === 'scale' ? `${ka}a` : form === 'scale-add' ? `${ka}a + b` : `a − ${-kb}b`;
    const steps: Step[] = [];
    // The rule, with wrong options that fit this form of question.
    const rightRule = form === 'scale' ? `Multiply both parts by ${ka}` : form === 'add' ? 'Add the tops, then add the bottoms' : form === 'sub' ? 'Take away the tops, then take away the bottoms' : 'Multiply first, then combine the tops and the bottoms';
    const wrongRules = form === 'scale' ? [`Multiply only the top by ${ka}`, `Add ${ka} to both parts`] : ['Add the top to the bottom of each vector', 'Multiply the tops together and the bottoms together'];
    const ruleOptions = shuffle(r, [rightRule, ...wrongRules]);
    const ruleCorrect = ruleOptions.indexOf(rightRule);
    steps.push({ type: 'choice', prompt: `How do you work out ${expr} with column vectors?`, options: ruleOptions, correct: ruleCorrect, why: whyAll(ruleOptions, ruleCorrect, () => (form === 'scale' ? `Multiplying a vector by ${ka} stretches it: both the step across and the step up are ${ka} times as big.` : 'The top is the step across and the bottom is the step up. Keep them apart: tops with tops, bottoms with bottoms.')) });
    const scaled = form === 'scale' ? null : ka !== 1 ? 'a' : Math.abs(kb) > 1 ? 'b' : null;
    if (scaled) {
      const k = scaled === 'a' ? ka : -kb;
      const v = scaled === 'a' ? a : b;
      steps.push({ type: 'number', prompt: `First, ${k}${scaled}: multiply each part by ${k}. What is the top of ${k}${scaled}?`, answer: D(k * v[0]), feedback: () => `${k} × ${sn(v[0])}.` });
    }
    // 3 − (−2) worked as 1: taking away a negative part as if it were positive.
    const slipTop = kb < 0 && b[0] < 0 ? ka * a[0] + kb * Math.abs(b[0]) : null;
    const slipBottom = kb < 0 && b[1] < 0 ? ka * a[1] + kb * Math.abs(b[1]) : null;
    const neg = 'Taking away a negative number makes it bigger: the two minus signs make a plus.';
    /** The sum for one part, such as "2 × 3 − (−2)". */
    const part = (i: 0 | 1) => {
      const first = `${ka === 1 ? '' : `${ka} × `}${sn(a[i])}`;
      if (kb === 0) return first;
      const second = `${Math.abs(kb) === 1 ? '' : `${Math.abs(kb)} × `}${b[i] < 0 ? `(${sn(b[i])})` : sn(b[i])}`;
      return `${first} ${kb < 0 ? '−' : '+'} ${second}`;
    };
    steps.push(
      { type: 'number', prompt: `What is the top of ${expr}?`, answer: D(answer[0]), feedback: (g) => (slipTop !== null && slipTop !== answer[0] && sameNumber(g, slipTop) ? neg : `Work out ${part(0)}.`) },
      { type: 'number', prompt: `And the bottom?`, answer: D(answer[1]), feedback: (g) => (slipBottom !== null && slipBottom !== answer[1] && sameNumber(g, slipBottom) ? neg : `Work out ${part(1)}.`) },
    );
    return {
      round: 'columns',
      prompt: kb === 0 ? `a = ${col(a)}. Work out ${expr}.` : `a = ${col(a)} and b = ${col(b)}. Work out ${expr}.`,
      steps,
      workings: [`Tops: ${answer[0] === 0 ? '0' : sn(answer[0])}. Bottoms: ${sn(answer[1])}.`, `So ${expr} = ${col(answer)}.`],
      check: { kind: 'combine', a, b, ka, kb, answer },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Magnitude
// ---------------------------------------------------------------------------------------------

function magnitude(r: () => number): Question {
  for (;;) {
    const speed = r() < 0.35;
    // A spacecraft's parts in hundreds or thousands of m/s.
    const v: [number, number] = speed ? [10 * int(r, 50, 300), 10 * int(r, 50, 300)] : [nz(r, -12, 12), nz(r, -12, 12)];
    if (SHOWN.has(`mag ${v[0]},${v[1]}`)) continue;
    const sq = v[0] ** 2 + v[1] ** 2;
    const exact = Math.sqrt(sq);
    const ans = Number.isInteger(exact) ? { answer: D(exact) } : approx(exact);
    const sumSlip = Math.abs(v[0]) + Math.abs(v[1]);
    const unit = speed ? 'm/s' : undefined;
    return {
      round: 'magnitude',
      prompt: speed
        ? `A spacecraft moves at ${fmt(D(v[0]))} m/s across and ${fmt(D(v[1]))} m/s up. What is its speed?`
        : `Find the magnitude of ${col(v)}.`,
      steps: [
        { type: 'number', prompt: `Square the top: ${br(v[0])}^{2} = ?`, answer: D(v[0] ** 2), feedback: (g) => (sameNumber(g, -(v[0] ** 2)) ? 'A negative number squared is positive.' : `${sn(v[0])} × ${sn(v[0])}.`) },
        { type: 'number', prompt: `Square the bottom: ${br(v[1])}^{2} = ?`, answer: D(v[1] ** 2), feedback: (g) => (sameNumber(g, -(v[1] ** 2)) ? 'A negative number squared is positive.' : `${sn(v[1])} × ${sn(v[1])}.`) },
        { type: 'number', prompt: `Add them.`, answer: D(sq), feedback: () => `${fmt(D(v[0] ** 2))} + ${fmt(D(v[1] ** 2))}.` },
        {
          type: 'number',
          prompt: `Take the square root. ${speed ? 'What is the speed?' : 'What is the magnitude?'}${Number.isInteger(exact) ? '' : ' Give 3 significant figures.'}`,
          ...ans,
          unit,
          feedback: (g) => (sameNumber(g, sumSlip) && sumSlip !== exact ? 'That adds the parts. The parts are at right angles, so use Pythagoras: square, add, then square root.' : `√${fmt(D(sq))}.`),
        },
      ],
      workings: [`${br(v[0])}^{2} + ${br(v[1])}^{2} = ${fmt(D(v[0] ** 2))} + ${fmt(D(v[1] ** 2))} = ${fmt(D(sq))}.`, `√${fmt(D(sq))} = ${Number.isInteger(exact) ? fmt(D(exact)) : short(exact)}${unit ? ` ${unit}` : ''}${Number.isInteger(exact) ? '' : ' to 3 significant figures'}.`],
      check: { kind: 'magnitude', v, answer: exact },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Direction and parallel
// ---------------------------------------------------------------------------------------------

function direction(r: () => number): Question {
  for (;;) {
    if (r() < 0.45) return parallel(r);
    const v: [number, number] = [int(r, 1, 12), int(r, 1, 12)];
    if (v[0] === v[1] || SHOWN.has(`mag ${v[0]},${v[1]}`) || v[0] * 4 === v[1] * 3 || v[0] * 3 === v[1] * 4) continue; // 3 : 4 gives the page's 36.9° and 53.1°
    const ratio = v[1] / v[0];
    const angle = Math.atan(ratio) * (180 / Math.PI);
    const options = shuffle(r, ['up ÷ across', 'across ÷ up', 'up × across']);
    const correct = options.indexOf('up ÷ across');
    const flipped = Math.atan(v[0] / v[1]) * (180 / Math.PI);
    return {
      round: 'direction',
      prompt: `The vector ${col(v)} points ${v[0]} across and ${v[1]} up. At what angle θ above the x direction does it point?`,
      steps: [
        { type: 'choice', prompt: 'tan θ = ?', options, correct, why: whyAll(options, correct, () => 'The angle is at the start, along the x direction: the step up is opposite it and the step across is next to it. tan = opposite ÷ adjacent.') },
        { type: 'number', prompt: `Work out ${v[1]} ÷ ${v[0]} (3 significant figures).`, ...approx(ratio), feedback: () => `${v[1]} ÷ ${v[0]}.` },
        {
          type: 'number',
          prompt: `θ = tan^{−1} of that. What is θ, to 3 significant figures?`,
          ...approx(angle),
          unit: '°',
          feedback: (g) => (Math.abs(toNumber(g) - flipped) < 0.05 ? 'That is the angle from the y direction: you used across ÷ up. Use up ÷ across.' : `Use tan^{−1} on your calculator, in degrees.`),
        },
      ],
      workings: [`tan θ = up ÷ across = ${v[1]} ÷ ${v[0]} = ${short(ratio)}.`, `θ = tan^{−1}(${short(ratio)}) = ${short(angle)}°.`],
      check: { kind: 'direction', v, answer: angle },
    };
  }
}

function parallel(r: () => number): Question {
  for (;;) {
    const a: [number, number] = [nz(r, -5, 6), nz(r, -5, 6)];
    const k = pick(r, [2, 3, 4, -2, -3]);
    const yes = r() < 0.6;
    const b: [number, number] = yes ? [k * a[0], k * a[1]] : [k * a[0], k * a[1] + pick(r, [1, -1, 2])];
    if (b[1] === 0) continue;
    const kTop = b[0] / a[0];
    const kBottom = b[1] / a[1];
    if (!Number.isInteger(kBottom) && yes) continue;
    const options = shuffle(r, ['Yes, they are parallel', 'No, they are not parallel']);
    const right = yes ? 'Yes, they are parallel' : 'No, they are not parallel';
    const correct = options.indexOf(right);
    return {
      round: 'direction',
      prompt: `a = ${col(a)} and b = ${col(b)}. Is b parallel to a?`,
      steps: [
        { type: 'number', prompt: `What number times the top of a gives the top of b? (${sn(a[0])} × ? = ${sn(b[0])})`, answer: D(kTop), feedback: () => `${sn(b[0])} ÷ ${sn(a[0])}.` },
        Number.isInteger(kBottom)
          ? { type: 'number', prompt: `And for the bottoms? (${sn(a[1])} × ? = ${sn(b[1])})`, answer: D(kBottom), feedback: () => `${sn(b[1])} ÷ ${sn(a[1])}.` }
          : (() => {
              const yn = shuffle(r, ['Yes', 'No']);
              const no = yn.indexOf('No');
              return { type: 'choice', prompt: `The bottom of a is ${sn(a[1])}. Is ${sn(kTop)} × ${br(a[1])} equal to ${sn(b[1])}?`, options: yn, correct: no, why: { [1 - no]: `${sn(kTop)} × ${br(a[1])} = ${sn(kTop * a[1])}, not ${sn(b[1])}.` } } as Step;
            })(),
        { type: 'choice', prompt: 'So is b parallel to a?', options, correct, why: whyAll(options, correct, () => (yes ? `Both parts use the same number, so b is a multiple of a: parallel.${k < 0 ? ' A negative multiple points the opposite way, but the vectors are still parallel.' : ''}` : 'The tops and bottoms use different numbers, so b is not a multiple of a.')) },
      ],
      workings: yes
        ? [`b = ${sn(k)} × a: both parts are multiplied by ${sn(k)}${k < 0 ? ', so b points the opposite way' : ''}.`, `${right}.`]
        : [`The tops use ${sn(kTop)}, but the bottoms do not: ${sn(kTop)} × ${br(a[1])} = ${sn(kTop * a[1])}, not ${sn(b[1])}.`, `${right}.`],
      check: { kind: 'parallel', a, b, k: yes ? k : null },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'magnitude') return magnitude(r);
  if (round === 'direction') return direction(r);
  return combine(r);
}

export const vectorsQuiz: LessonQuiz<VectorsCheck> = {
  lesson: 'vectors',
  storageKey: 'stella-quiz-vectors-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
