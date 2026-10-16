/**
 * Quiz for "Refraction and Snell's Law" (KAN-94): which way light bends, Snell's law, speed and refractive
 * index, and colours. Key stage 3 and GCSE. Rays that leave a denser material stay below the critical angle,
 * so total internal reflection, which the lesson does not teach, never arises.
 */
import { D, approx, approxStd, fmt, int, pick, shuffle, toNumber, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';
import { shift, type Digits } from '@/lib/measures';

export type Round = 'bend' | 'snell' | 'speed' | 'colour';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  bend: { label: 'Which way it bends', blurb: 'Angles from the normal. Slowing down bends light towards the normal; speeding up bends it away.' },
  snell: { label: 'Snell’s law', blurb: 'n₁ sin θ₁ = n₂ sin θ₂. Use a calculator in degrees; give 3 significant figures.' },
  speed: { label: 'Speed of light', blurb: 'v = c ÷ n, with c = 3.00 × 10⁸ m/s in a vacuum.' },
  colour: { label: 'Colours', blurb: 'Violet has the highest frequency and bends the most. A filter only lets its own colour through.' },
};

export type PrismCheck =
  | { kind: 'bend'; from: string; to: string; n1: number; n2: number; angle: number; surface: boolean }
  | { kind: 'snell'; n1: number; n2: number; theta1: number; theta2: number }
  | { kind: 'speed'; n: number; v: number; ask: 'v' | 'n' }
  | { kind: 'crossing'; n: number; cm: number; t: number }
  | { kind: 'colours'; low: string; high: string; asks: ('higher' | 'lower' | 'more' | 'less' | 'bentMore' | 'bentLess')[]; answers: string[] }
  | { kind: 'filters'; first: string; second: string; out: string };
type Question = Q<PrismCheck>;

const MATERIALS: { name: string; n: number }[] = [
  { name: 'air', n: 1.0 },
  { name: 'water', n: 1.33 },
  { name: 'glass', n: 1.5 },
  { name: 'Perspex', n: 1.49 },
  { name: 'diamond', n: 2.42 },
];
/** Shown on the page: air into glass at 30°, and air into water at 45°. */
const SHOWN = new Set(['air glass 30', 'air water 45']);
const C = 3.0e8;
const deg = (x: number) => (x * Math.PI) / 180;
const near = (g: Digits, x: number, rel = 0.01) => Math.abs(toNumber(g) - x) <= rel * Math.abs(x);

/** Two different materials, with an angle that stays below the critical angle when light leaves the denser one. */
function pairAndAngle(r: () => number, lo: number, hi: number): { a: (typeof MATERIALS)[number]; b: (typeof MATERIALS)[number]; angle: number } {
  for (;;) {
    const [a, b] = shuffle(r, [...MATERIALS]).slice(0, 2);
    if (Math.abs(a.n - b.n) < 0.1) continue; // glass and Perspex are too alike to tell apart
    const angle = int(r, lo / 5, hi / 5) * 5;
    // Below the critical angle, with a margin, and with sin θ₂ at most 0.9 so the inverse sine is not too sensitive.
    if ((a.n * Math.sin(deg(angle))) / b.n > 0.9) continue;
    if (SHOWN.has(`${a.name} ${b.name} ${angle}`)) continue;
    return { a, b, angle };
  }
}

// ---------------------------------------------------------------------------------------------
// Which way it bends
// ---------------------------------------------------------------------------------------------

function bendQuestion(r: () => number): Question {
  const along = r() < 0.15;
  const { a, b, angle } = along ? { ...pairAndAngle(r, 10, 60), angle: 0 } : pairAndAngle(r, 10, 75);
  // At 45° the angle to the surface is also 45°, so that slip could not be told apart from the answer.
  const surface = !along && angle !== 45 && r() < 0.5;
  const slows = b.n > a.n;
  const steps: Step[] = [];
  if (surface)
    steps.push({
      type: 'number',
      prompt: 'Angles are measured from the normal, at right angles to the boundary. What is the angle of incidence?',
      answer: D(angle),
      unit: '°',
      feedback: (g) => (Math.abs(toNumber(g) - (90 - angle)) < 1e-9 ? 'That is the angle to the boundary. The normal is at right angles to it, so take this angle from 90°.' : 'The normal is at right angles to the boundary: 90° minus the angle to the boundary.'),
    });
  const speedOptions = shuffle(r, ['It slows down', 'It speeds up']);
  const speedRight = speedOptions.indexOf(slows ? 'It slows down' : 'It speeds up');
  steps.push({
    type: 'choice',
    prompt: `As the light passes from ${a.name} into ${b.name}, does it speed up or slow down?`,
    options: speedOptions,
    correct: speedRight,
    why: { [1 - speedRight]: `The refractive index of ${b.name} is ${slows ? 'higher' : 'lower'} than that of ${a.name}, so light travels more ${slows ? 'slowly' : 'quickly'} in it.` },
  });
  const bendRight = along ? 'It does not change direction' : slows ? 'Towards the normal' : 'Away from the normal';
  const bendOptions = shuffle(r, ['Towards the normal', 'Away from the normal', 'It does not change direction']);
  const bendCorrect = bendOptions.indexOf(bendRight);
  steps.push({
    type: 'choice',
    prompt: 'Which way does it bend?',
    options: bendOptions,
    correct: bendCorrect,
    why: whyAll(bendOptions, bendCorrect, (o) =>
      along ? 'A ray along the normal reaches the surface all at once, so it changes speed but not direction.' : o === 'It does not change direction' ? 'It meets the surface at an angle, so one side of the beam changes speed first and it swings round.' : 'Slowing down bends light towards the normal; speeding up bends it away.',
    ),
  });
  if (!along) {
    const sizeOptions = shuffle(r, ['Smaller', 'Bigger', 'The same']);
    const sizeRight = sizeOptions.indexOf(slows ? 'Smaller' : 'Bigger');
    steps.push({ type: 'choice', prompt: `So is the angle of refraction bigger or smaller than ${angle}°?`, options: sizeOptions, correct: sizeRight, why: whyAll(sizeOptions, sizeRight, () => `Bending ${slows ? 'towards' : 'away from'} the normal makes the angle to the normal ${slows ? 'smaller' : 'bigger'}.`) });
  }
  const given = along ? 'along the normal' : surface ? `at ${90 - angle}° to the boundary` : `at ${angle}° to the normal`;
  return {
    round: 'bend',
    prompt: `A ray of light passes from ${a.name} (n = ${a.n.toFixed(2)}) into ${b.name} (n = ${b.n.toFixed(2)}), meeting the boundary ${given}. What happens to it?`,
    steps,
    workings: [
      ...(surface ? [`The angle to the normal is 90° − ${90 - angle}° = ${angle}°.`] : []),
      `${cap(b.name)} has a ${slows ? 'higher' : 'lower'} refractive index, so the light ${slows ? 'slows down' : 'speeds up'}.`,
      along
        ? 'It does not change direction: a ray along the normal changes speed but not direction.'
        : `${slows ? 'Smaller' : 'Bigger'}: it bends ${slows ? 'towards' : 'away from'} the normal, so the angle of refraction is ${slows ? 'smaller' : 'bigger'} than ${angle}°.`,
    ],
    check: { kind: 'bend', from: a.name, to: b.name, n1: a.n, n2: b.n, angle, surface },
  };
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

// ---------------------------------------------------------------------------------------------
// Snell's law
// ---------------------------------------------------------------------------------------------

function snellQuestion(r: () => number): Question {
  const { a, b, angle } = pairAndAngle(r, 10, 75);
  const s1 = Math.sin(deg(angle));
  const s2 = (a.n * s1) / b.n;
  const theta2 = (Math.asin(s2) * 180) / Math.PI;
  const flipped = (b.n * s1) / a.n;
  return {
    round: 'snell',
    prompt: `Light passes from ${a.name} (n = ${a.n.toFixed(2)}) into ${b.name} (n = ${b.n.toFixed(2)}) at ${angle}° to the normal. Find the angle of refraction.`,
    steps: [
      { type: 'number', prompt: `What is sin ${angle}°? Give 3 significant figures.`, ...approx(s1), feedback: (g) => (near(g, Math.sin(angle)) ? 'That is in radians. Set your calculator to degrees.' : 'Use the sin key, with your calculator in degrees.') },
      {
        type: 'number',
        prompt: 'n₁ sin θ₁ = n₂ sin θ₂. What is sin θ₂?',
        ...approx(s2),
        tolerance: 0.006,
        feedback: (g) => (near(g, flipped) ? 'That has the refractive indices the wrong way round. sin θ₂ = n₁ sin θ₁ ÷ n₂.' : 'Multiply n₁ by sin θ₁, then divide by n₂.'),
      },
      {
        type: 'number',
        prompt: 'So what is θ₂, the angle of refraction? Give 3 significant figures.',
        ...approx(theta2),
        unit: '°',
        tolerance: 0.01,
        feedback: (g) => (near(g, s2, 0.02) ? 'That is sin θ₂. Use the inverse sine (sin^{−1}) to get the angle.' : near(g, Math.asin(s2), 0.02) ? 'That is in radians. Set your calculator to degrees.' : 'Use the inverse sine of sin θ₂.'),
      },
    ],
    workings: [`sin ${angle}° = ${approx(s1).shown}.`, `sin θ₂ = ${a.n.toFixed(2)} × ${approx(s1).shown} ÷ ${b.n.toFixed(2)} = ${approx(s2).shown}.`, `θ₂ = sin^{−1}(${approx(s2).shown}) = ${approx(theta2).shown}°.`],
    check: { kind: 'snell', n1: a.n, n2: b.n, theta1: angle, theta2 },
  };
}

// ---------------------------------------------------------------------------------------------
// Speed and refractive index
// ---------------------------------------------------------------------------------------------

const MEDIA: { name: string; n: number }[] = [
  { name: 'water', n: 1.33 },
  { name: 'ice', n: 1.31 },
  { name: 'ethanol', n: 1.36 },
  { name: 'olive oil', n: 1.47 },
  { name: 'Perspex', n: 1.49 },
  { name: 'crown glass', n: 1.52 },
  { name: 'quartz', n: 1.54 },
  { name: 'flint glass', n: 1.62 },
  { name: 'sapphire', n: 1.77 },
  { name: 'cubic zirconia', n: 2.15 },
  { name: 'diamond', n: 2.42 },
];

/** Real things light crosses, with a thickness range in cm. */
const range = (lo: number, hi: number, by: number) => Array.from({ length: Math.round((hi - lo) / by) + 1 }, (_, i) => Number((lo + i * by).toFixed(1)));
const CROSSINGS: { what: string; media: string[]; cm: number[] }[] = [
  { what: 'a window pane', media: ['crown glass'], cm: range(0.3, 1.2, 0.1) },
  { what: 'a glass block', media: ['crown glass', 'flint glass', 'Perspex'], cm: range(4, 20, 1) },
  { what: 'a fish tank full of water', media: ['water'], cm: range(20, 60, 5) },
  { what: 'a cut gem', media: ['diamond', 'cubic zirconia', 'sapphire'], cm: range(0.3, 1.5, 0.1) },
  { what: 'a block of ice', media: ['ice'], cm: range(5, 50, 5) },
];

function crossingQuestion(r: () => number): Question {
  const k = pick(r, CROSSINGS);
  const name = pick(r, k.media);
  const m = MEDIA.find((x) => x.name === name)!;
  const cm = pick(r, k.cm);
  const v = C / m.n;
  const t = cm / 100 / v;
  const metres = fmt(shift(D(String(cm)), -2)); // exact: 1.1 cm is 0.011 m
  return {
    round: 'speed',
    prompt: `Light crosses ${k.what}, ${fmtCm(cm)} thick, made of ${m.name} (n = ${m.n.toFixed(2)}). How long does it take? Light travels at 3.00 × 10^{8} m/s in a vacuum.`,
    steps: [
      { type: 'number', prompt: `First, how fast does light travel in ${m.name}? Give 3 significant figures.`, ...approxStd(v), unit: 'm/s', feedback: (g) => (near(g, C * m.n) ? 'That multiplies. Light is slower in the material: v = c ÷ n.' : 'Divide the speed in a vacuum by the refractive index.') },
      { type: 'number', prompt: `What is ${fmtCm(cm)} in metres?`, answer: D(metres), unit: 'm', feedback: () => 'There are 100 cm in a metre.' },
      {
        type: 'number',
        prompt: 'So how long does it take, in seconds? Give 3 significant figures.',
        ...approxStd(t),
        unit: 's',
        tolerance: 0.008,
        feedback: (g) => (near(g, cm / v) ? 'That uses the thickness in centimetres. Change it to metres first.' : near(g, cm / 100 / C) ? 'That uses the speed in a vacuum. Use the speed in the material.' : 'Time = distance ÷ speed.'),
      },
    ],
    workings: [`v = 3.00 × 10^{8} ÷ ${m.n.toFixed(2)} = ${approxStd(v).shown} m/s.`, `${fmtCm(cm)} = ${metres} m.`, `Time = ${metres} ÷ ${approxStd(v).shown} = ${approxStd(t).shown} s.`],
    check: { kind: 'crossing', n: m.n, cm, t },
  };
}
const fmtCm = (cm: number) => `${cm} cm`;

function speedQuestion(r: () => number): Question {
  if (r() < 0.4) return crossingQuestion(r);
  const m = pick(r, MEDIA);
  const ask: 'v' | 'n' = r() < 0.5 ? 'v' : 'n';
  if (ask === 'v') {
    const v = C / m.n;
    const options = shuffle(r, ['Slower', 'Faster', 'The same']);
    const correct = options.indexOf('Slower');
    return {
      round: 'speed',
      prompt: `The refractive index of ${m.name} is ${m.n.toFixed(2)}. How fast does light travel in ${m.name}? Light travels at 3.00 × 10^{8} m/s in a vacuum.`,
      steps: [
        { type: 'choice', prompt: 'Is light faster or slower in it than in a vacuum?', options, correct, why: whyAll(options, correct, () => 'A refractive index above 1 means light is slower than in a vacuum: n times slower.') },
        { type: 'number', prompt: 'So what is its speed? Give 3 significant figures.', ...approxStd(v), unit: 'm/s', feedback: (g) => (near(g, C * m.n) ? 'That multiplies. Light is slower in the material: v = c ÷ n.' : 'Divide the speed in a vacuum by the refractive index.') },
      ],
      workings: [`v = c ÷ n = 3.00 × 10^{8} ÷ ${m.n.toFixed(2)} = ${approxStd(v).shown} m/s.`],
      check: { kind: 'speed', n: m.n, v, ask },
    };
  }
  const vShown = approxStd(C / m.n);
  const v = toNumber(vShown.answer);
  const n = C / v;
  const options = shuffle(r, ['Bigger than 1', 'Smaller than 1', 'Exactly 1']);
  const correct = options.indexOf('Bigger than 1');
  return {
    round: 'speed',
    prompt: `Light travels at ${vShown.shown} m/s in ${m.name}, and at 3.00 × 10^{8} m/s in a vacuum. What is the refractive index of ${m.name}?`,
    steps: [
      { type: 'choice', prompt: 'Is the refractive index bigger or smaller than 1?', options, correct, why: whyAll(options, correct, () => 'Light is slower in the material than in a vacuum, so the refractive index is more than 1.') },
      { type: 'number', prompt: 'So what is the refractive index? Give 3 significant figures.', ...approx(n), feedback: (g) => (near(g, v / C) ? 'That is upside down. n = c ÷ v, the speed in a vacuum divided by the speed in the material.' : 'Divide the speed in a vacuum by the speed in the material.') },
    ],
    workings: [`n = c ÷ v = 3.00 × 10^{8} ÷ ${vShown.shown} = ${approx(n).shown}.`],
    check: { kind: 'speed', n, v, ask },
  };
}

// ---------------------------------------------------------------------------------------------
// Colours
// ---------------------------------------------------------------------------------------------

/** The spectrum, from the lowest frequency to the highest. */
const SPECTRUM = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
const ASKS = {
  higher: 'Which has the higher frequency?',
  lower: 'Which has the lower frequency?',
  more: 'Which slows down more in glass?',
  less: 'Which slows down less in glass?',
  bentMore: 'Which is bent more by the prism?',
  bentLess: 'Which is bent less by the prism?',
} as const;
const FILTERS = ['red', 'green', 'blue'];

function colourQuestion(r: () => number): Question {
  if (r() < 0.6) {
    const i = int(r, 0, 5);
    const j = int(r, i + 1, 6);
    const low = SPECTRUM[i];
    const high = SPECTRUM[j];
    const [where, made] = pick(r, [['a glass prism', 'glass'], ['a glass block', 'glass'], ['a raindrop', 'water']] as const);
    const asks = [pick(r, ['higher', 'lower'] as const), pick(r, ['more', 'less'] as const), pick(r, ['bentMore', 'bentLess'] as const)];
    const steps: Step[] = asks.map((a) => {
      const right = a === 'higher' || a === 'more' || a === 'bentMore' ? high : low;
      const options = shuffle(r, [`${cap(low)} light`, `${cap(high)} light`]);
      const correct = options.indexOf(`${cap(right)} light`);
      const why = a === 'higher' || a === 'lower' ? 'Frequency rises from red, the lowest, to violet, the highest.' : a === 'more' || a === 'less' ? `In ${made}, the higher the frequency, the more the light slows down.` : 'Light that slows down more is bent more, so violet bends the most and red the least.';
      return { type: 'choice' as const, prompt: ASKS[a].replace('in glass', `in ${made}`).replace('by the prism', `by ${where.replace(/^a /, 'the ')}`), options, correct, why: { [1 - correct]: why } };
    });
    const named = shuffle(r, [low, high]);
    return {
      round: 'colour',
      prompt: `A beam of ${named[0]} light and a beam of ${named[1]} light enter ${where} at the same angle.`,
      steps,
      workings: [
        `${cap(high)} light has a higher frequency than ${low} light.`,
        `In ${made} it slows down more, so it is bent more. That is how ${made === 'water' ? 'raindrops spread sunlight into a rainbow' : 'a prism spreads white light into a spectrum'}.`,
        `${cap(asks[2] === 'bentMore' ? high : low)} light is bent ${asks[2] === 'bentMore' ? 'more' : 'less'}.`,
      ],
      check: { kind: 'colours', low, high, asks, answers: steps.map((s) => (s.type === 'choice' ? s.options[s.correct] : '')) },
    };
  }
  const first = pick(r, FILTERS);
  const second = pick(r, FILTERS);
  const firstOptions = shuffle(r, [`${cap(first)} light`, 'White light', ...shuffle(r, FILTERS.filter((f) => f !== first)).slice(0, 1).map((f) => `${cap(f)} light`)]);
  const firstRight = firstOptions.indexOf(`${cap(first)} light`);
  const out = first === second ? `${cap(first)} light` : 'No light';
  const secondOptions = shuffle(r, [...new Set([`${cap(first)} light`, `${cap(second)} light`, 'No light', 'White light'])]);
  const secondRight = secondOptions.indexOf(out);
  // Sunlight is white light too: the first answer is the same whichever source it is.
  return {
    round: 'colour',
    prompt: `${pick(r, ['A stage lamp shines white light', 'A torch shines white light', 'Sunlight shines', 'A projector shines white light'])} through a ${first} filter, and then through a ${second} filter. What comes out of the second filter?`,
    steps: [
      { type: 'choice', prompt: `What comes out of the ${first} filter?`, options: firstOptions, correct: firstRight, why: whyAll(firstOptions, firstRight, () => `A ${first} filter transmits ${first} light and absorbs the other colours.`) },
      {
        type: 'choice',
        prompt: `That light reaches the ${second} filter. What comes out?`,
        options: secondOptions,
        correct: secondRight,
        why: whyAll(secondOptions, secondRight, (o) => (o === `${cap(second)} light` && first !== second ? `A filter cannot add a colour. Only ${first} light reaches it, and a ${second} filter absorbs that.` : first === second ? `${cap(first)} light passes through a ${second} filter.` : `Only ${first} light reaches the ${second} filter, which absorbs it.`)),
      },
    ],
    workings: [`The ${first} filter lets through only ${first} light.`, first === second ? `The ${second} filter lets that ${first} light through.` : `The ${second} filter absorbs ${first} light.`, `${out} comes out.`],
    check: { kind: 'filters', first, second, out },
  };
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'snell') return snellQuestion(r);
  if (round === 'speed') return speedQuestion(r);
  if (round === 'colour') return colourQuestion(r);
  return bendQuestion(r);
}

export const prismQuiz: LessonQuiz<PrismCheck> = {
  lesson: 'prism',
  storageKey: 'stella-quiz-prism-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};

