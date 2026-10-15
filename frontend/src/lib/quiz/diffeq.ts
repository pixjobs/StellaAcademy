/**
 * Quiz for "Differential Equations" (KAN-88): building an equation from a sentence, how a rate scales, and
 * using a solution. A-level; calculator answers to 3 significant figures.
 */
import { D, approx, fmt, int, pick, sameNumber, sf3, shuffle, toNumber, whyAll, type LessonQuiz, type Question as Q } from '@/lib/quiz/core';

export type Round = 'build' | 'scaling' | 'solutions';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  build: { label: 'Building an equation', blurb: '"Proportional to" means a constant times. A minus sign means it is falling.' },
  scaling: { label: 'How the rate changes', blurb: 'If the speed doubles, what happens to the drag?' },
  solutions: { label: 'Using a solution', blurb: 'Find the constant from the starting value, then work out a later value. Use a calculator.' },
};

export type DiffeqCheck =
  | { kind: 'build'; answer: string }
  | { kind: 'scale'; power: 1 | 2; m: number; rate: number; answer: number }
  | { kind: 'exp'; a: number; k: number; x: number; answer: number }
  | { kind: 'drag'; v0: number; k: number; t: number; answer: number };
type Question = Q<DiffeqCheck>;

// The page's own examples (radioactive decay, population growth, drag in v², a capsule at 5,000 m/s with
// k = 2 × 10⁻⁶, dy/dx = 3y) are not used: the sentences below are new, and the numbers never match them.

const SENTENCES = [
  { text: 'The charge Q on a capacitor leaks away at a rate proportional to the charge left.', q: 'Q', right: 'dQ/dt = −kQ', wrong: ['dQ/dt = kQ', 'dQ/dt = −k', 'dQ/dt = −kQ^{2}'], falling: true },
  { text: 'The number R of people who have heard a rumour grows at a rate proportional to the number who have heard it.', q: 'R', right: 'dR/dt = kR', wrong: ['dR/dt = −kR', 'dR/dt = k', 'dR/dt = kR^{2}'], falling: false },
  { text: 'Water drains from a funnel, and its height h falls at a rate proportional to the square of the height.', q: 'h', right: 'dh/dt = −kh^{2}', wrong: ['dh/dt = kh^{2}', 'dh/dt = −kh', 'dh/dt = −2kh'], falling: true },
  { text: 'The amount D of a medicine in the blood falls at a rate proportional to the amount there.', q: 'D', right: 'dD/dt = −kD', wrong: ['dD/dt = kD', 'dD/dt = −k', 'dD/dt = −kD^{2}'], falling: true },
  { text: 'The money M in a savings account grows at a rate proportional to the amount in it.', q: 'M', right: 'dM/dt = kM', wrong: ['dM/dt = −kM', 'dM/dt = k', 'dM/dt = kM^{2}'], falling: false },
  { text: 'The area A covered by a mould grows at a rate proportional to the area already covered.', q: 'A', right: 'dA/dt = kA', wrong: ['dA/dt = −kA', 'dA/dt = k', 'dA/dt = k√A'], falling: false },
  { text: 'The volume V of water in a leaking tank with straight sides falls at a rate proportional to the square root of the volume.', q: 'V', right: 'dV/dt = −k√V', wrong: ['dV/dt = k√V', 'dV/dt = −kV', 'dV/dt = −k/V'], falling: true },
] as const;

/** Cooling, with a room temperature that varies, so the round has plenty of different questions. */
function cooling(r: () => number) {
  const room = pick(r, [15, 16, 18, 19, 20, 21, 22, 24]);
  const what = pick(r, ['A cup of tea', 'A bowl of soup', 'A hot engine part', 'A loaf fresh from the oven']);
  return {
    text: `${what} at temperature T cools at a rate proportional to the difference between its temperature and the room temperature, ${room} °C.`,
    q: 'T',
    right: `dT/dt = −k(T − ${room})`,
    wrong: [`dT/dt = k(T − ${room})`, 'dT/dt = −kT', `dT/dt = −k(T + ${room})`],
    falling: true,
  };
}

function build(r: () => number): Question {
  const s = r() < 0.4 ? cooling(r) : pick(r, SENTENCES);
  const signs = shuffle(r, ['Negative: it is falling', 'Positive: it is rising']);
  const signRight = signs.indexOf(s.falling ? 'Negative: it is falling' : 'Positive: it is rising');
  const options = shuffle(r, [s.right, ...s.wrong]);
  const correct = options.indexOf(s.right);
  return {
    round: 'build',
    prompt: `${s.text} Which differential equation describes it? (k is a positive constant.)`,
    steps: [
      { type: 'choice', prompt: `Is d${s.q}/dt positive or negative?`, options: signs, correct: signRight, why: whyAll(signs, signRight, () => (s.falling ? 'It is falling, so its rate of change is negative.' : 'It is growing, so its rate of change is positive.')) },
      {
        type: 'choice',
        prompt: 'So which equation is it?',
        options,
        correct,
        // The sign is the sign at the front of the right-hand side (the cooling options all contain "T − room").
        why: whyAll(options, correct, (o) => (o.split('= ')[1].startsWith('−') !== s.right.split('= ')[1].startsWith('−') ? 'Check the sign: it must match whether the amount rises or falls.' : '"Proportional to" means k times exactly that quantity: read the sentence again for what the rate depends on.')),
      },
    ],
    workings: [`"Proportional to" means k times it; ${s.falling ? 'falling means a minus sign' : 'growing means it stays positive'}.`, `So ${s.right}.`],
    check: { kind: 'build', answer: s.right },
  };
}

function scaling(r: () => number): Question {
  for (;;) {
    const power = pick(r, [1, 2] as const);
    // Speed tripling is the page's own question; and ten times the speed would give unrealistic decelerations.
    const m = power === 2 ? pick(r, [2, 4, 0.5]) : pick(r, [2, 3, 4, 0.5, 10]);
    const rate = int(r, 2, 40) * (power === 2 ? 1 : 5);
    const factor = m ** power;
    const answer = rate * factor;
    const mText = m === 0.5 ? 'halves' : m === 10 ? 'is ten times as big' : `is multiplied by ${m}`;
    const thing = power === 2 ? { name: 'capsule', q: 'speed', eq: 'dv/dt = −kv^{2}', unit: 'm/s²', verb: 'slowing' } : { name: 'sample', q: 'amount of a radioactive substance', eq: 'dN/dt = −kN', unit: 'grams per hour', verb: 'decaying' };
    return {
      round: 'scaling',
      prompt: `${power === 2 ? `A capsule obeys ${thing.eq}. At one speed it is slowing at ${rate} m/s².` : `A sample obeys ${thing.eq}. At one moment it is decaying at ${rate} grams per hour.`} If the ${thing.q} ${mText}, how fast is it ${thing.verb}?`,
      steps: [
        {
          type: 'number',
          prompt: `The rate depends on ${power === 2 ? 'v^{2}' : 'N'}. If ${power === 2 ? 'v' : 'N'} is multiplied by ${fmt(D(m))}, what is ${power === 2 ? 'v^{2}' : 'N'} multiplied by?`,
          answer: D(factor),
          feedback: (g) => (power === 2 && sameNumber(g, m) ? `The rate depends on the square: ${fmt(D(m))}^{2}.` : power === 2 ? `Square ${fmt(D(m))}.` : 'The rate is proportional to N itself.'),
        },
        {
          type: 'number',
          prompt: `So how fast is it ${thing.verb} now?`,
          answer: D(answer),
          unit: thing.unit,
          feedback: (g) => (power === 2 && sameNumber(g, rate * m) ? `That is ${fmt(D(m))} times as fast. Drag goes with the square of the speed: ${fmt(D(m))}^{2} = ${fmt(D(factor))}.` : `${rate} × ${fmt(D(factor))}.`),
        },
      ],
      workings: [`The rate is proportional to ${power === 2 ? 'v^{2}' : 'N'}, so it is multiplied by ${fmt(D(factor))}.`, `${rate} × ${fmt(D(factor))} = ${fmt(D(answer))} ${thing.unit}.`],
      check: { kind: 'scale', power, m, rate, answer },
    };
  }
}

function solutions(r: () => number): Question {
  for (;;) {
    if (r() < 0.5) {
      // y = Ae^{kx}: the constant from the start, then a later value.
      const a = int(r, 2, 50);
      const k = pick(r, [0.1, 0.2, 0.3, 0.5, -0.1, -0.2, -0.4]);
      const x = int(r, 1, 6);
      const answer = a * Math.exp(k * x);
      const ctx = k > 0 ? { q: 'P', what: 'A population of bacteria, P in thousands,', t: 'hours', start: `P = ${a} (thousand)` } : { q: 'N', what: 'The mass N in grams of a radioactive sample', t: 'years', start: `N = ${a} g` };
      const kText = k < 0 ? `−${-k}` : String(k);
      return {
        round: 'solutions',
        prompt: `${ctx.what} follows ${ctx.q} = Ae^{${kText}t}, with t in ${ctx.t}. At t = 0, ${ctx.start}. Find ${ctx.q} when t = ${x}${k > 0 ? ', in thousands' : ''}.`,
        steps: [
          { type: 'number', prompt: `At t = 0, e^{0} = 1, so ${ctx.q} = A. What is A?`, answer: D(a), feedback: () => `The starting value is A.` },
          { type: 'number', prompt: `Work out ${kText} × ${x}, the power of e.`, answer: D(Number((k * x).toFixed(2))), feedback: () => `${kText} × ${x}.` },
          {
            type: 'number',
            prompt: `So ${ctx.q} = ${a}e^{${fmt(D(Number((k * x).toFixed(2))))}}. What is that, to 3 significant figures?`,
            ...approx(answer),
            feedback: (g) => (Math.abs(toNumber(g) - a * Math.exp(Math.abs(k) * x)) < 0.01 * a * Math.exp(Math.abs(k) * x) && k < 0 ? 'Keep the minus sign in the power: this amount is falling.' : `Use e^{x} on your calculator, then multiply by ${a}.`),
          },
        ],
        workings: [`A = ${a}, the value at t = 0.`, `${ctx.q} = ${a}e^{${fmt(D(Number((k * x).toFixed(2))))}} = ${sf3(answer)} to 3 significant figures.`],
        check: { kind: 'exp', a, k, x, answer },
      };
    }
    // v = v0 / (1 + k v0 t), from dv/dt = −kv².
    const v0 = 500 * int(r, 12, 16);
    const kMant = int(r, 1, 5);
    const k = kMant * 1e-6;
    const t = 5 * int(r, 1, 8);
    // kv₀t and 1 + kv₀t as exact decimals: whole numbers over a million, never 1.3900000000000001.
    const whole = kMant * v0 * t;
    const product = Number(fmt(D(whole / 1e6)).replace(/,/g, ''));
    const bottom = D(((whole + 1e6) / 1e6).toFixed(6));
    const answer = v0 / ((whole + 1e6) / 1e6);
    const noOne = v0 / product;
    return {
      round: 'solutions',
      prompt: `A capsule slows by drag, dv/dt = −kv^{2}, with k = ${kMant} × 10^{−6} per metre. It starts at v₀ = ${fmt(D(v0))} m/s. Using v = v₀ ÷ (1 + kv₀t), find its speed after ${t} s.`,
      steps: [
        { type: 'number', prompt: `Work out kv₀t = ${kMant} × 10^{−6} × ${fmt(D(v0))} × ${t}.`, answer: D(product), feedback: () => `${kMant} × ${fmt(D(v0))} × ${t}, then divide by 1,000,000.` },
        { type: 'number', prompt: `So what is the bottom, 1 + kv₀t?`, answer: bottom, feedback: () => `1 + ${fmt(D(product))}.` },
        {
          type: 'number',
          prompt: `So what is v, to 3 significant figures?`,
          ...approx(answer),
          unit: 'm/s',
          feedback: (g) => (Math.abs(toNumber(g) - noOne) < noOne * 0.01 ? 'Remember the 1 in the bottom: 1 + kv₀t.' : `${fmt(D(v0))} ÷ ${fmt(bottom)}.`),
        },
      ],
      workings: [`kv₀t = ${fmt(D(product))}, so the bottom is ${fmt(bottom)}.`, `v = ${fmt(D(v0))} ÷ ${fmt(bottom)} = ${sf3(answer)} m/s to 3 significant figures.`],
      check: { kind: 'drag', v0, k, t, answer },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'scaling') return scaling(r);
  if (round === 'solutions') return solutions(r);
  return build(r);
}

export const diffeqQuiz: LessonQuiz<DiffeqCheck> = {
  lesson: 'diffeq',
  storageKey: 'stella-quiz-diffeq-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
