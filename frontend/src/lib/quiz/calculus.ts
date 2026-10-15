/**
 * Quiz for "Differentiation and Rates of Change" (KAN-87): the power rule, motion, and first principles.
 * A-level. Each step asks for one number (a new coefficient, a new power, a value), so no algebra has to
 * be typed and the reasoning is still shown.
 */
import { D, fmt, int, pick, sameNumber, shuffle, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';

export type Round = 'power' | 'motion' | 'limit';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  power: { label: 'The power rule', blurb: 'Multiply by the power, then take one off the power. Then the gradient at a point.' },
  motion: { label: 'Motion', blurb: 'Velocity is ds/dt, and acceleration is dv/dt.' },
  limit: { label: 'From first principles', blurb: 'The gradient of a chord, then what it tends to as the chord shrinks.' },
};

type Term = { c: number; n: number };
export type CalculusCheck =
  | { kind: 'gradient'; terms: Term[]; x: number; answer: number }
  | { kind: 'velocity' | 'acceleration'; terms: Term[]; t: number; answer: number }
  | { kind: 'limit'; k: number; a: number; answer: number };
type Question = Q<CalculusCheck>;

/** Functions and points shown on the lesson page and in its earlier practice. The quiz never asks these. */
const SHOWN = new Set(['1x2', '2x3 7x1', '5x2 10x1', '4x3', '20x1', '3x2 2x0', 'limit 1 2', 'limit 1 3']);

const sn = (x: number) => fmt(D(x)); // with − and commas: −1,323
/** "3x^{4}", "−5x", "7": one term written for a pupil, in variable v. */
function termText(t: Term, v: string, first: boolean): string {
  const sign = t.c < 0 ? (first ? '−' : ' − ') : first ? '' : ' + ';
  const a = Math.abs(t.c);
  if (t.n === 0) return `${sign}${a}`;
  const coef = a === 1 ? '' : String(a);
  return `${sign}${coef}${v}${t.n === 1 ? '' : `^{${t.n}}`}`;
}
const poly = (ts: Term[], v: string) => ts.map((t, i) => termText(t, v, i === 0)).join('');
const key = (ts: Term[]) => ts.map((t) => `${t.c}x${t.n}`).join(' ');
const evaluate = (ts: Term[], x: number) => ts.reduce((s, t) => s + t.c * x ** t.n, 0);
const derive = (ts: Term[]): Term[] => ts.filter((t) => t.n > 0).map((t) => ({ c: t.c * t.n, n: t.n - 1 }));

/** For each term with a power: the new coefficient, then the new power. A constant term: what happens to it. */
function powerRuleSteps(r: () => number, ts: Term[], v: string): Step[] {
  const steps: Step[] = [];
  for (const t of ts) {
    if (t.n === 0) {
      const options = shuffle(r, ['It disappears: its derivative is 0', 'It stays the same', `It becomes ${termText({ c: t.c, n: 1 }, v, true)}`]);
      const correct = options.indexOf('It disappears: its derivative is 0');
      steps.push({ type: 'choice', prompt: `What happens to the constant ${sn(t.c)}?`, options, correct, why: whyAll(options, correct, () => 'A constant does not change, so its rate of change is 0.') });
      continue;
    }
    const term = termText(t, v, true);
    steps.push({
      type: 'number',
      prompt: `For ${term}: multiply by the power. What is the new number in front?`,
      answer: D(t.c * t.n),
      feedback: (g) => (sameNumber(g, t.c) && t.n !== 1 ? `Multiply ${sn(t.c)} by the power, ${t.n}.` : sameNumber(g, t.c * (t.n - 1)) && t.n > 1 ? `Multiply by the power before you take one off it: ${sn(t.c)} × ${t.n}.` : `${sn(t.c)} × ${t.n}.`),
    });
    if (t.n > 1) steps.push({ type: 'number', prompt: `And the new power of ${v}?`, answer: D(t.n - 1), feedback: () => `Take one off the power: ${t.n} − 1.` });
  }
  return steps;
}

function powerRule(r: () => number): Question {
  for (;;) {
    const n1 = int(r, 2, 5);
    const n2 = int(r, 1, n1 - 1);
    const ts: Term[] = [{ c: pick(r, [1, 2, 3, 4, 5, -2, -3]), n: n1 }, { c: pick(r, [2, 3, 4, 5, 6, 7, -1, -4, -5]), n: n2 }];
    if (r() < 0.5) ts.push({ c: int(r, -9, 9) || 1, n: 0 });
    if (SHOWN.has(key(ts))) continue;
    const x = pick(r, [-2, -1, 1, 2, 3]);
    const d = derive(ts);
    const answer = evaluate(d, x);
    const withConstant = ts.some((t) => t.n === 0) ? answer + ts.find((t) => t.n === 0)!.c : null;
    return {
      round: 'power',
      prompt: `y = ${poly(ts, 'x')}. Find dy/dx, then the gradient of the curve where x = ${sn(x)}.`,
      steps: [
        ...powerRuleSteps(r, ts, 'x'),
        {
          type: 'number',
          prompt: `So dy/dx = ${poly(d, 'x')}. What is the gradient where x = ${sn(x)}?`,
          answer: D(answer),
          feedback: (g) => (withConstant !== null && sameNumber(g, withConstant) ? 'The constant has no derivative: leave it out.' : `Put x = ${sn(x)} into ${poly(d, 'x')}.`),
        },
      ],
      workings: [`dy/dx = ${poly(d, 'x')}.`, `At x = ${sn(x)}: ${sn(answer)}.`, `So the gradient where x = ${sn(x)} is ${sn(answer)}.`],
      check: { kind: 'gradient', terms: ts, x, answer },
    };
  }
}

function motion(r: () => number): Question {
  for (;;) {
    const acc = r() < 0.4;
    const ts: Term[] = acc
      ? [{ c: int(r, 1, 4), n: 2 }, { c: int(r, 1, 9), n: 1 }, { c: int(r, 0, 9), n: 0 }].filter((t) => t.c !== 0)
      : [{ c: int(r, 1, 3), n: 3 }, { c: int(r, 1, 6), n: 2 }, { c: int(r, 1, 9), n: 1 }];
    if (SHOWN.has(key(ts))) continue;
    const t = int(r, 1, 5);
    const d = derive(ts);
    const answer = evaluate(d, t);
    const unit = acc ? 'm/s²' : 'm/s';
    const how = shuffle(r, ['Differentiate', 'Integrate', 'Divide by t']);
    const howRight = how.indexOf('Differentiate');
    return {
      round: 'motion',
      prompt: acc
        ? `A rover's velocity is v = ${poly(ts, 't')} m/s at time t seconds. Find its acceleration at t = ${t}.`
        : `A probe's displacement is s = ${poly(ts, 't')} metres at time t seconds. Find its velocity at t = ${t}.`,
      steps: [
        {
          type: 'choice',
          prompt: `How do you get ${acc ? 'acceleration from velocity' : 'velocity from displacement'}?`,
          options: how,
          correct: howRight,
          why: whyAll(how, howRight, () => 'Velocity is the rate of change of displacement, and acceleration is the rate of change of velocity: differentiate.'),
        },
        ...powerRuleSteps(r, ts, 't'),
        { type: 'number', prompt: `So ${acc ? 'a' : 'v'} = ${poly(d, 't')}. What is it at t = ${t}?`, answer: D(answer), unit, feedback: () => `Put t = ${t} into ${poly(d, 't')}.` },
      ],
      workings: [`${acc ? 'a = dv/dt' : 'v = ds/dt'} = ${poly(d, 't')}.`, `At t = ${t}: ${sn(answer)} ${unit}.`],
      check: { kind: acc ? 'acceleration' : 'velocity', terms: ts, t, answer },
    };
  }
}

function limit(r: () => number): Question {
  for (;;) {
    const k = pick(r, [1, 2, 3, 5]);
    const a = int(r, 1, 6);
    if (SHOWN.has(`limit ${k} ${a}`)) continue;
    const y = k === 1 ? 'x^{2}' : `${k}x^{2}`;
    const options = shuffle(r, [`${2 * k * a} + ${k === 1 ? '' : k}h`, `${2 * k * a}`, `${k === 1 ? '' : k}h`]);
    const right = `${2 * k * a} + ${k === 1 ? '' : k}h`;
    const correct = options.indexOf(right);
    return {
      round: 'limit',
      prompt: `Find the gradient of y = ${y} at x = ${a} from first principles, using a chord from x = ${a} to x = ${a} + h.`,
      steps: [
        { type: 'number', prompt: `Expand: (${a} + h)^{2} = ${a * a} + ?h + h^{2}. What number goes in front of h?`, answer: D(2 * a), feedback: () => `(${a} + h)(${a} + h): the h terms are ${a}h and ${a}h.` },
        ...(k === 1
          ? []
          : [{ type: 'number' as const, prompt: `Multiply by ${k} and take away ${k} × ${a}^{2}: ${k}(${a} + h)^{2} − ${k * a * a} = ?h + ${k}h^{2}. What number goes in front of h?`, answer: D(2 * k * a), feedback: () => `${k} × ${2 * a}.` }]),
        { type: 'choice', prompt: `The change in y is ${2 * k * a}h + ${k === 1 ? '' : k}h^{2}. Divide by h, the change in x. What is the chord’s gradient?`, options, correct, why: whyAll(options, correct, () => `Each term is divided by h: ${2 * k * a}h ÷ h = ${2 * k * a} and ${k === 1 ? '' : k}h^{2} ÷ h = ${k === 1 ? '' : k}h.`) },
        { type: 'number', prompt: 'As h gets closer and closer to 0, what does the gradient get closer to?', answer: D(2 * k * a), feedback: (g) => (sameNumber(g, 0) ? 'Only the h part shrinks to 0. The number on its own stays.' : `What is left of ${right} when h is 0?`) },
      ],
      workings: [`The chord’s gradient is ${right}.`, `As h → 0, the h part vanishes, leaving ${2 * k * a}.`, `So the gradient at x = ${a} is ${2 * k * a}, which matches dy/dx = ${2 * k}x.`],
      check: { kind: 'limit', k, a, answer: 2 * k * a },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'motion') return motion(r);
  if (round === 'limit') return limit(r);
  return powerRule(r);
}

export const calculusQuiz: LessonQuiz<CalculusCheck> = {
  lesson: 'calculus',
  storageKey: 'stella-quiz-calculus-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
