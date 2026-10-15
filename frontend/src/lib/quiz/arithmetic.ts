/**
 * Quiz for "Order of Operations (BIDMAS)" (KAN-74). Year 6, with the key stage 3 statement on brackets and
 * powers. A small evaluator works each calculation one part at a time in BIDMAS order, and the quiz asks for
 * those parts as steps. Built on lib/quiz/core.ts; every number is a whole number.
 */
import { D, int, pick, sameNumber, shuffle, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';

export type Round = 'order' | 'brackets' | 'stories';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  order: { label: 'Which comes first', blurb: 'Two operations. Choose which part to work out first, then finish it.' },
  brackets: { label: 'Brackets and powers', blurb: 'Brackets first, then powers, then × and ÷, then + and −.' },
  stories: { label: 'Write the calculation', blurb: 'Turn a short story into one calculation, then work it out.' },
};

export type ArithmeticCheck = { expr: string; answer: number };
type Question = Q<ArithmeticCheck>;

/** Examples shown on the lesson page. The quiz never asks these. */
const SHOWN = new Set(['8 − 4 ÷ 2 + (1 + 1)²', '5 + 2 × 3', '(5 + 2) × 3', '16 ÷ 4 × 2', '10 − 4 + 3', '3 × 2 × 5 + 4', '3 × 2 × (5 + 4)', '4 × 3 + 2', '6 + 4 × 5', '(6 + 4) × 5', '18 ÷ 3 × 2', '3² + 4 × 2', '2 + 3 × 4', '(2 + 3) × 4']);

/**
 * Feedback for picking `option` as the first part when `first` is right. Each names the mistake behind
 * the pick, without saying which part is right.
 */
function whyNotFirst(expr: string, first: string, option: string): string {
  const inBracket = /\(/.test(expr) && expr.includes(`(${first})`);
  if (inBracket && option.endsWith('²')) return 'Work out the bracket first, then square the answer. Squaring a number inside the bracket gives the wrong answer.';
  if (inBracket) return 'Brackets come first: work out the part inside the brackets before anything else.';
  if (first.endsWith('²')) return 'Powers come before ×, ÷, + and −: work out the power first.';
  const md = (x: string) => /[×÷]/.test(x);
  if (md(first) && !md(option)) return 'It looks like you worked from left to right. × and ÷ come before + and −.';
  return md(first) ? '× and ÷ are equal, so work from left to right: start with the one on the left.' : '+ and − are equal, so work from left to right: start with the one on the left.';
}

// ---------------------------------------------------------------------------------------------
// A tiny evaluator: tokens, one reduction at a time, in BIDMAS order
// ---------------------------------------------------------------------------------------------

type Tok = number | '+' | '−' | '×' | '÷' | '(' | ')' | '²';
const isOp = (t: Tok) => t === '+' || t === '−' || t === '×' || t === '÷';

export function tokens(expr: string): Tok[] {
  const out: Tok[] = [];
  for (const m of expr.matchAll(/\d+|[+−×÷()²]/g)) out.push(/\d/.test(m[0]) ? Number(m[0]) : (m[0] as Tok));
  return out;
}
export function text(ts: Tok[]): string {
  let s = '';
  ts.forEach((t, i) => {
    if (t === '²' || t === ')') s += t;
    else if (t === '(') s += (i && ts[i - 1] !== '(' ? ' ' : '') + '(';
    else s += (i && ts[i - 1] !== '(' ? ' ' : '') + String(t);
  });
  return s;
}
const apply = (a: number, op: Tok, b: number) => (op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b);

/** One step of BIDMAS: the part worked out, its value and the calculation afterwards. Null when only a number is left. */
function reduce(ts: Tok[]): { part: string; value: number; next: Tok[] } | null {
  // Brackets: the innermost pair. A pair round a single number is removed without a step.
  for (let i = ts.length - 1; i >= 0; i--) {
    if (ts[i] !== '(') continue;
    const j = ts.indexOf(')', i);
    const inner = ts.slice(i + 1, j);
    if (inner.length === 1) return reduce([...ts.slice(0, i), inner[0], ...ts.slice(j + 1)]);
    const r = reduce(inner)!;
    const next = [...ts.slice(0, i + 1), ...r.next, ...ts.slice(j)];
    const tidy = r.next.length === 1 ? [...ts.slice(0, i), r.next[0], ...ts.slice(j + 1)] : next;
    return { part: r.part, value: r.value, next: tidy };
  }
  // Powers.
  const p = ts.indexOf('²');
  if (p > 0) {
    const a = ts[p - 1] as number;
    return { part: `${a}²`, value: a * a, next: [...ts.slice(0, p - 1), a * a, ...ts.slice(p + 1)] };
  }
  // × and ÷, then + and −, each from left to right.
  for (const ops of [['×', '÷'], ['+', '−']]) {
    const k = ts.findIndex((t) => ops.includes(t as string));
    if (k > 0) {
      const v = apply(ts[k - 1] as number, ts[k], ts[k + 1] as number);
      return { part: `${ts[k - 1]} ${ts[k]} ${ts[k + 1]}`, value: v, next: [...ts.slice(0, k - 1), v, ...ts.slice(k + 2)] };
    }
  }
  return null;
}

/** Every step from the calculation to its answer. */
export function solve(expr: string): { part: string; value: number; now: string }[] {
  let ts = tokens(expr);
  const out: { part: string; value: number; now: string }[] = [];
  for (let r = reduce(ts); r; r = reduce(ts)) {
    ts = r.next;
    out.push({ part: r.part, value: r.value, now: text(ts) });
  }
  return out;
}
export const evaluate = (expr: string) => {
  const s = solve(expr);
  return s.length ? s[s.length - 1].value : Number(expr);
};

/** The common slips, worked out so their feedback can name them. */
function slips(expr: string): { value: number; why: string }[] {
  const ts = tokens(expr);
  const out: { value: number; why: string }[] = [];
  // Strictly left to right, ignoring the order (brackets and powers still respected).
  const flat = (xs: Tok[]): number => {
    const ys: Tok[] = [];
    for (let i = 0; i < xs.length; i++) {
      if (xs[i] === '(') {
        let depth = 1;
        let j = i + 1;
        for (; depth; j++) depth += xs[j] === '(' ? 1 : xs[j] === ')' ? -1 : 0;
        ys.push(flat(xs.slice(i + 1, j - 1)));
        i = j - 1;
      } else if (xs[i] === '²') ys[ys.length - 1] = (ys[ys.length - 1] as number) ** 2;
      else ys.push(xs[i]);
    }
    let v = ys[0] as number;
    for (let i = 1; i < ys.length; i += 2) v = apply(v, ys[i], ys[i + 1] as number);
    return v;
  };
  out.push({ value: flat(ts), why: 'It looks like you worked from left to right. × and ÷ come before + and −.' });
  // "Divide before multiply" or "add before subtract": the second of two equal-priority operations done first.
  if (ts.length === 5 && isOp(ts[1]) && isOp(ts[3])) {
    const [a, o1, b, o2, c] = ts as [number, Tok, number, Tok, number];
    const pair = (x: Tok, y: Tok) => (['×', '÷'].includes(x as string) && ['×', '÷'].includes(y as string)) || (['+', '−'].includes(x as string) && ['+', '−'].includes(y as string));
    if (pair(o1, o2) && o1 !== o2) out.push({ value: apply(a, o1, apply(b, o2, c)), why: `${o1} and ${o2} are equal, so work from left to right: ${a} ${o1} ${b} comes first.` });
  }
  // (a ± b)² worked as a² ± b².
  const m = expr.match(/\((\d+) ([+−]) (\d+)\)²/);
  if (m) {
    const [x, op, y] = [Number(m[1]), m[2], Number(m[3])];
    const wrong = expr.replace(m[0], String(op === '+' ? x * x + y * y : x * x - y * y));
    out.push({ value: evaluate(wrong), why: `Work out the bracket first, then square it. Squaring ${x} and ${y} separately gives a different answer.` });
  }
  return out;
}

/** The steps for a calculation: choose the first part, work out each part, then the answer. */
function stepsFor(r: () => number, expr: string): { steps: Step[]; answer: number; workings: string[] } {
  const s = solve(expr);
  const answer = s[s.length - 1].value;
  const named = slips(expr).filter((x) => x.value !== answer && Number.isInteger(x.value));
  // The first part, among other parts a pupil might pick.
  const candidates = new Set<string>([s[0].part]);
  const ts = tokens(expr).filter((t) => t !== '(' && t !== ')');
  for (let i = 1; i < ts.length - 1; i++) if (isOp(ts[i]) && typeof ts[i - 1] === 'number' && typeof ts[i + 1] === 'number') candidates.add(`${ts[i - 1]} ${ts[i]} ${ts[i + 1]}`);
  for (let i = 1; i < ts.length; i++) if (ts[i] === '²') candidates.add(`${ts[i - 1]}²`);
  const options = shuffle(r, [...candidates]).slice(0, 4);
  if (!options.includes(s[0].part)) options[0] = s[0].part;
  const correct = options.indexOf(s[0].part);
  const steps: Step[] = [];
  if (options.length > 1) {
    steps.push({
      type: 'choice',
      prompt: `In ${expr}, which part do you work out first?`,
      options,
      correct,
      why: whyAll(options, correct, (o) => whyNotFirst(expr, s[0].part, o)),
    });
  }
  s.forEach((x, i) => {
    const last = i === s.length - 1;
    const before = i === 0 ? expr : s[i - 1].now;
    steps.push({
      type: 'number',
      prompt: last ? `${i === 0 ? '' : `The calculation is now ${before}. `}What is the answer?` : `${i === 0 ? '' : `The calculation is now ${before}. `}Work out ${x.part}.`,
      answer: D(x.value),
      feedback: (g) => {
        if (last) for (const sl of named) if (sameNumber(g, sl.value)) return sl.why;
        return `Work out ${x.part}.`;
      },
    });
  });
  const workings = s.map((x, i) => `${x.part} = ${x.value}${i < s.length - 1 ? `, so the calculation is now ${x.now}` : ''}.`);
  workings.push(`So ${expr} = ${answer}.`);
  return { steps, answer, workings };
}

// ---------------------------------------------------------------------------------------------
// Rounds
// ---------------------------------------------------------------------------------------------

const ORDER = [
  (a: number, b: number, c: number) => `${a} + ${b} × ${c}`,
  (a: number, b: number, c: number) => `${a * c + b * c} − ${b} × ${c}`,
  (a: number, b: number, c: number) => `${a} + ${b * c} ÷ ${c}`,
  (a: number, b: number, c: number) => `${a + b + 6} − ${b} + ${c}`,
  (a: number, b: number, c: number) => `${b * c * a} ÷ ${b} × ${c}`,
  (a: number, b: number, c: number) => `${a} × ${b} − ${c}`,
];

const BRACKETS = [
  (a: number, b: number, c: number) => `(${a} + ${b}) × ${c}`,
  (a: number, b: number, c: number) => `${c} × (${a + b} − ${b})`,
  (a: number, b: number) => `${a} + ${b}²`,
  (a: number, b: number) => `(${a + b} − ${b})²`,
  (a: number, b: number, c: number) => `${a + 2}² − ${b} × ${c}`,
  (a: number, b: number, c: number) => `(${a * c} + ${b * c}) ÷ ${c}`,
  (a: number, b: number, c: number) => `(${a} + ${b})² − ${c}`,
  (a: number, b: number, c: number) => `${a} × (${b} + ${c})²`,
];

function calculation(r: () => number, round: 'order' | 'brackets'): Question {
  for (;;) {
    const a = int(r, 2, 9);
    const b = int(r, 2, 9);
    const c = int(r, 2, 6);
    const expr = pick(r, round === 'order' ? ORDER : BRACKETS)(a, b, c);
    if (SHOWN.has(expr)) continue;
    const s = solve(expr);
    if (s.some((x) => x.value < 0 || !Number.isInteger(x.value)) || s[s.length - 1].value > 500) continue;
    const { steps, answer, workings } = stepsFor(r, expr);
    return { round, prompt: `Work out ${expr}.`, steps, workings, check: { expr, answer } };
  }
}

type Story = { ask: (n: number[]) => string; right: (n: number[]) => string; wrong: ((n: number[]) => string)[] };
const STORIES: Story[] = [
  {
    ask: ([a, b, c]) => `A rover makes ${a} trips of ${b} km, then drives ${c} km back to its lander. How far does it drive in total?`,
    right: ([a, b, c]) => `${a} × ${b} + ${c}`,
    wrong: [([a, b, c]) => `${a} × (${b} + ${c})`, ([a, b, c]) => `(${a} + ${b}) × ${c}`],
  },
  {
    ask: ([a, b, c, d]) => `${a} astronauts each eat ${b} meals a day on a ${c}-day trip, and the crew takes ${d} spare meals. How many meals is that?`,
    right: ([a, b, c, d]) => `${a} × ${b} × ${c} + ${d}`,
    wrong: [([a, b, c, d]) => `${a} × ${b} × (${c} + ${d})`, ([a, b, c, d]) => `${a} × (${b} + ${c}) + ${d}`],
  },
  {
    ask: ([a, b, c]) => `Each of ${a} teams has ${b} engineers and ${c} pilots. How many people is that altogether?`,
    right: ([a, b, c]) => `${a} × (${b} + ${c})`,
    wrong: [([a, b, c]) => `${a} × ${b} + ${c}`, ([a, b, c]) => `${a} + ${b} × ${c}`],
  },
  {
    ask: ([a, b, c]) => `A crate holds ${a} bags of ${b} rock samples. ${c} samples are taken out. How many samples are left?`,
    right: ([a, b, c]) => `${a} × ${b} − ${c}`,
    wrong: [([a, b, c]) => `${a} × (${b} − ${c})`, ([a, b, c]) => `(${a} − ${c}) × ${b}`],
  },
  {
    ask: ([a, b, c]) => `£${a * b} is shared equally between ${b} people, and each person also gets a £${c} bonus. How much does each person get?`,
    right: ([a, b, c]) => `${a * b} ÷ ${b} + ${c}`,
    wrong: [([a, b, c]) => `${a * b} ÷ (${b} + ${c})`, ([a, b, c]) => `${a * b} + ${c} ÷ ${b}`],
  },
];

function story(r: () => number): Question {
  const st = pick(r, STORIES); // the story first, then numbers that suit it, so every story comes up as often
  for (;;) {
    const n = [int(r, 2, 9), int(r, 2, 6), int(r, 2, 9), int(r, 2, 12)];
    const right = st.right(n);
    if (SHOWN.has(right)) continue;
    const wrongs = st.wrong.map((w) => w(n)).filter((w) => Number.isInteger(evaluate(w)) && evaluate(w) > 0 && evaluate(w) !== evaluate(right));
    if (wrongs.length < 2 || solve(right).some((x) => x.value < 0 || !Number.isInteger(x.value))) continue;
    const options = shuffle(r, [right, ...wrongs]);
    const correct = options.indexOf(right);
    const { steps, answer, workings } = stepsFor(r, right);
    const unitFree = steps.filter((s) => s.type === 'number'); // the parts of the chosen calculation, then the answer
    const money = /£/.test(st.ask(n));
    return {
      round: 'stories',
      prompt: st.ask(n),
      steps: [
        {
          type: 'choice',
          prompt: 'Which calculation matches the story?',
          options,
          correct,
          why: whyAll(options, correct, (o) => `${o} does not match: think about what happens to each number in the story, and where brackets are needed.`),
        },
        // In the money story every amount is in pounds.
        ...unitFree.map((s) => (money ? { ...s, unit: '£' } : s)),
      ],
      workings: [`The calculation is ${right}.`, ...workings, ...(money ? [`So each person gets £${answer}.`] : [])],
      check: { expr: right, answer },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'stories') return story(r);
  return calculation(r, round);
}

export const arithmeticQuiz: LessonQuiz<ArithmeticCheck> = {
  lesson: 'arithmetic',
  storageKey: 'stella-quiz-arithmetic-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
