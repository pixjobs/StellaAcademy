/**
 * Quiz for "Trigonometry in Right-Angled Triangles" (KAN-81): finding a side, finding an angle, Pythagoras.
 * GCSE: a calculator is allowed and answers are marked to 3 significant figures (core.ts `approx`).
 */
import { D, approx, sf3, fmt, int, pick, shuffle, toNumber, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';

export type Round = 'sides' | 'angles' | 'pythagoras';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  sides: { label: 'Find a side', blurb: 'Choose the sides, then the ratio, then rearrange. Use a calculator; give 3 significant figures.' },
  angles: { label: 'Find an angle', blurb: 'Work out the ratio, then use the inverse function on a calculator.' },
  pythagoras: { label: 'Pythagoras', blurb: 'Square, add or take away, then take the square root.' },
};

type Side = 'opposite' | 'adjacent' | 'hypotenuse';
type Ratio = 'sin' | 'cos' | 'tan';
export type TrigCheck =
  | { kind: 'side'; angle: number; known: Side; knownLength: number; want: Side; answer: number }
  | { kind: 'angle'; a: Side; aLength: number; b: Side; bLength: number; answer: number }
  | { kind: 'pythagoras'; a: number; b: number; hypotenuse: boolean; answer: number };
type Question = Q<TrigCheck>;

const RAD = Math.PI / 180;
const f = { sin: Math.sin, cos: Math.cos, tan: Math.tan };
const RATIO_OF: Record<string, Ratio> = { 'hypotenuse opposite': 'sin', 'adjacent hypotenuse': 'cos', 'adjacent opposite': 'tan' };
const ratioFor = (x: Side, y: Side): Ratio => RATIO_OF[[x, y].sort().join(' ')];
const RATIO_TEXT: Record<Ratio, string> = { sin: 'sin θ = opposite ÷ hypotenuse', cos: 'cos θ = adjacent ÷ hypotenuse', tan: 'tan θ = opposite ÷ adjacent' };
const TOP: Record<Ratio, Side> = { sin: 'opposite', cos: 'adjacent', tan: 'opposite' };
const BOTTOM: Record<Ratio, Side> = { sin: 'hypotenuse', cos: 'hypotenuse', tan: 'adjacent' };
const short = sf3;

/** Angles in the lesson's exact-values table, left out so they cannot be looked up. */
const TABLE_ANGLES = new Set([0, 30, 45, 60, 90]);

const pairStep = (r: () => number, x: Side, y: Side): Step => {
  const pairs = ['opposite and hypotenuse', 'adjacent and hypotenuse', 'opposite and adjacent'];
  const options = shuffle(r, pairs);
  const right = pairs.find((p) => p.includes(x) && p.includes(y))!;
  const correct = options.indexOf(right);
  return { type: 'choice', prompt: 'Which two sides are involved: the one you know and the one you want?', options, correct, why: whyAll(options, correct, () => `Name the sides from the angle θ: the hypotenuse is opposite the right angle, the opposite side faces θ, and the adjacent side is next to θ.`) };
};
const ratioStep = (r: () => number, ratio: Ratio): Step => {
  const options = shuffle(r, Object.values(RATIO_TEXT));
  const correct = options.indexOf(RATIO_TEXT[ratio]);
  return { type: 'choice', prompt: 'So which ratio do you use? (SOH CAH TOA)', options, correct, why: whyAll(options, correct, () => 'Pick the ratio with both of your sides in it.') };
};

// ---------------------------------------------------------------------------------------------
// Find a side
// ---------------------------------------------------------------------------------------------

/** Each context with sizes that make sense: ladders stand steeply, ramps are gentle. */
type SideContext = { known: Side; want: Side; ask: (angle: number, len: number) => string; unit: string; angles: [number, number]; lengths: [number, number] };
const SIDE_CONTEXTS: SideContext[] = [
  { known: 'hypotenuse', want: 'opposite', ask: (a, l) => `A ladder ${l} m long leans against a wall at ${a}° to the ground. How high up the wall does it reach?`, unit: 'm', angles: [61, 80], lengths: [2, 10] },
  { known: 'hypotenuse', want: 'adjacent', ask: (a, l) => `A ladder ${l} m long leans against a wall at ${a}° to the ground. How far is its foot from the wall?`, unit: 'm', angles: [61, 80], lengths: [2, 10] },
  { known: 'opposite', want: 'hypotenuse', ask: (a, l) => `A ramp rises ${l} m and slopes at ${a}° to the ground. How long is the ramp?`, unit: 'm', angles: [3, 15], lengths: [1, 3] },
  { known: 'hypotenuse', want: 'opposite', ask: (a, l) => `A kite flies on a string ${l} m long, at ${a}° above the ground. How high is the kite?`, unit: 'm', angles: [20, 70], lengths: [10, 60] },
  { known: 'adjacent', want: 'opposite', ask: (a, l) => `You stand ${l} km from a launch pad and see a rocket at ${a}° above the horizon. How high is the rocket? Treat the ground as flat.`, unit: 'km', angles: [10, 70], lengths: [2, 20] },
  { known: 'adjacent', want: 'hypotenuse', ask: (a, l) => `In a right-angled triangle, the side adjacent to angle θ = ${a}° is ${l} cm. How long is the hypotenuse?`, unit: 'cm', angles: [15, 75], lengths: [3, 30] },
  { known: 'opposite', want: 'adjacent', ask: (a, l) => `In a right-angled triangle, the side opposite angle θ = ${a}° is ${l} cm. How long is the side adjacent to θ?`, unit: 'cm', angles: [15, 75], lengths: [3, 30] },
];

function findSide(r: () => number): Question {
  for (;;) {
    const ctx = pick(r, SIDE_CONTEXTS);
    const angle = int(r, ...ctx.angles);
    if (TABLE_ANGLES.has(angle)) continue;
    const len = int(r, ...ctx.lengths);
    const ratio = ratioFor(ctx.known, ctx.want);
    const value = f[ratio](angle * RAD);
    const wantOnTop = TOP[ratio] === ctx.want;
    const exact = wantOnTop ? len * value : len / value;
    const other = wantOnTop ? len / value : len * value; // the slip: × and ÷ swapped
    const w = ctx.want;
    const options = shuffle(r, [`${w} = ${ctx.known} × ${ratio} ${angle}°`, `${w} = ${ctx.known} ÷ ${ratio} ${angle}°`, `${w} = ${ratio} ${angle}° ÷ ${ctx.known}`]);
    const right = wantOnTop ? `${w} = ${ctx.known} × ${ratio} ${angle}°` : `${w} = ${ctx.known} ÷ ${ratio} ${angle}°`;
    const correct = options.indexOf(right);
    const a = approx(exact);
    return {
      round: 'sides',
      prompt: ctx.ask(angle, len),
      steps: [
        pairStep(r, ctx.known, ctx.want),
        ratioStep(r, ratio),
        {
          type: 'choice',
          prompt: `Rearrange ${RATIO_TEXT[ratio]} to find the ${w}.`,
          options,
          correct,
          why: whyAll(options, correct, () => (wantOnTop ? `The ${w} is on top of the ratio, so multiply: ${w} = ${ctx.known} × ${ratio} θ.` : `The ${w} is on the bottom of the ratio, so divide: ${w} = ${ctx.known} ÷ ${ratio} θ.`)),
        },
        {
          type: 'number',
          prompt: `So how long is it? Use a calculator and give 3 significant figures.`,
          ...a,
          unit: ctx.unit,
          feedback: (g) => (Math.abs(toNumber(g) - other) <= Math.abs(other) * 0.005 ? `That ${wantOnTop ? 'divides' : 'multiplies'}, but the ${w} is ${wantOnTop ? 'on top' : 'on the bottom'} of the ratio, so ${wantOnTop ? 'multiply' : 'divide'}.` : `Work out ${len} ${wantOnTop ? '×' : '÷'} ${ratio} ${angle}°, with your calculator in degrees.`),
        },
      ],
      workings: [`The ${ctx.known} and the ${w} are in the ${ratio} ratio: ${RATIO_TEXT[ratio]}.`, `${w} = ${len} ${wantOnTop ? '×' : '÷'} ${ratio} ${angle}° = ${short(exact)} ${ctx.unit}.`, `So it is ${short(exact)} ${ctx.unit} to 3 significant figures.`],
      check: { kind: 'side', angle, known: ctx.known, knownLength: len, want: w, answer: exact },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Find an angle
// ---------------------------------------------------------------------------------------------

function findAngle(r: () => number): Question {
  for (;;) {
    const ratio = pick(r, ['sin', 'cos', 'tan'] as const);
    const top = TOP[ratio];
    const bottom = BOTTOM[ratio];
    const tl = int(r, 2, 20);
    const bl = int(r, 2, 20);
    if (ratio !== 'tan' && tl >= bl) continue; // the hypotenuse is the longest side
    if (tl === 3 && bl === 4 && ratio === 'tan') continue; // the example in the notes
    const value = tl / bl;
    const angle = (ratio === 'sin' ? Math.asin(value) : ratio === 'cos' ? Math.acos(value) : Math.atan(value)) / RAD;
    if (TABLE_ANGLES.has(Math.round(angle * 1000) / 1000)) continue;
    const a = approx(angle);
    return {
      round: 'angles',
      prompt: `In a right-angled triangle, ${top === 'opposite' ? 'the side opposite θ' : 'the side adjacent to θ'} is ${tl} cm and ${bottom === 'hypotenuse' ? 'the hypotenuse' : 'the side adjacent to θ'} is ${bl} cm. Find the angle θ.`,
      steps: [
        { ...ratioStep(r, ratio), prompt: 'Which ratio uses the two sides you know? (SOH CAH TOA)' } as Step,
        { type: 'number', prompt: `Work out the ratio: ${ratio} θ = ${tl} ÷ ${bl} = ? (3 significant figures)`, ...approx(value), feedback: () => `Work out ${tl} ÷ ${bl}.` },
        {
          type: 'number',
          prompt: `Use the inverse function, ${ratio}^{−1}, on your calculator. What is θ, to 3 significant figures?`,
          ...a,
          unit: '°',
          feedback: () => `Press ${ratio}^{−1} (often shift, then ${ratio}) and enter ${tl} ÷ ${bl}. Check your calculator is in degrees.`,
        },
      ],
      workings: [`The ${top} and the ${bottom} are in the ${ratio} ratio.`, `${ratio} θ = ${tl} ÷ ${bl} = ${short(value)}.`, `θ = ${ratio}^{−1}(${short(value)}) = ${short(angle)}°.`],
      check: { kind: 'angle', a: top, aLength: tl, b: bottom, bLength: bl, answer: angle },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Pythagoras
// ---------------------------------------------------------------------------------------------

function pythagoras(r: () => number): Question {
  for (;;) {
    const hyp = r() < 0.6;
    const a = int(r, 2, 15);
    const b = int(r, 2, 15);
    // The 3, 4, 5 and 6, 8, 10 triangles from the page, in any arrangement.
    const set = [a, b, hyp ? Math.round(Math.sqrt(a * a + b * b)) : Math.round(Math.sqrt(Math.abs(b * b - a * a)))].sort((x, y) => x - y).join(',');
    if (set === '3,4,5' || set === '6,8,10') continue;
    if (!hyp && b <= a) continue; // finding a shorter side: the hypotenuse b is longer than a
    const exact = hyp ? Math.sqrt(a * a + b * b) : Math.sqrt(b * b - a * a);
    const inside = hyp ? a * a + b * b : b * b - a * a;
    const ans = Number.isInteger(exact) ? { answer: D(exact) } : approx(exact);
    const prompt = hyp
      ? `The two shorter sides of a right-angled triangle are ${a} cm and ${b} cm. How long is the hypotenuse?`
      : `A right-angled triangle has a hypotenuse of ${b} cm and one shorter side of ${a} cm. How long is the other shorter side?`;
    const options = shuffle(r, ['Add them', 'Take the smaller from the larger']);
    const right = hyp ? 'Add them' : 'Take the smaller from the larger';
    const correct = options.indexOf(right);
    return {
      round: 'pythagoras',
      prompt,
      steps: [
        { type: 'number', prompt: `Square ${hyp ? 'one shorter side' : 'the shorter side you know'}: ${a}^{2} = ?`, answer: D(a * a), feedback: () => `${a} × ${a}.` },
        { type: 'number', prompt: `Square ${hyp ? 'the other shorter side' : 'the hypotenuse'}: ${b}^{2} = ?`, answer: D(b * b), feedback: () => `${b} × ${b}.` },
        {
          type: 'choice',
          prompt: `a^{2} + b^{2} = c^{2}, where c is the hypotenuse. ${hyp ? 'You want the hypotenuse.' : 'You want a shorter side.'} What do you do with the two squares?`,
          options,
          correct,
          why: whyAll(options, correct, () => (hyp ? 'The hypotenuse squared is the sum of the other two squares.' : 'The hypotenuse squared is the biggest. Take the other square away from it.')),
        },
        { type: 'number', prompt: `So what is ${hyp ? `${a * a} + ${b * b}` : `${b * b} − ${a * a}`}?`, answer: D(inside), feedback: () => (hyp ? 'Add the two squares.' : 'Take the smaller square from the larger.') },
        {
          type: 'number',
          prompt: `Take the square root. How long is the side? ${Number.isInteger(exact) ? '' : 'Give 3 significant figures.'}`.trim(),
          ...ans,
          unit: 'cm',
          feedback: (g) => (Math.abs(toNumber(g) - (hyp ? a + b : b - a)) < 1e-9 ? `That ${hyp ? 'adds' : 'subtracts'} the sides themselves. Square them first, then take the square root at the end.` : `Find √${inside}.`),
        },
      ],
      workings: [`${a}^{2} = ${a * a} and ${b}^{2} = ${b * b}.`, hyp ? `${a * a} + ${b * b} = ${inside}.` : `${b * b} − ${a * a} = ${inside}.`, `√${inside} = ${Number.isInteger(exact) ? exact : short(exact)} cm${Number.isInteger(exact) ? '' : ' to 3 significant figures'}.`],
      check: { kind: 'pythagoras', a, b, hypotenuse: hyp, answer: exact },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'angles') return findAngle(r);
  if (round === 'pythagoras') return pythagoras(r);
  return findSide(r);
}

export const trigonometryQuiz: LessonQuiz<TrigCheck> = {
  lesson: 'trigonometry',
  storageKey: 'stella-quiz-trigonometry-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
