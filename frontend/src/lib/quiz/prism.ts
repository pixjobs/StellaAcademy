/**
 * Quiz for "Refraction and Snell's Law" (KAN-94): which way light bends, Snell's law, speed and refractive
 * index, and colours. Key stage 3 and GCSE. Rays that leave a denser material stay below the critical angle,
 * so total internal reflection, which the lesson does not teach, never arises.
 */
import { D, approx, approxStd, int, pick, shuffle, toNumber, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';
import type { Digits } from '@/lib/measures';

export type Round = 'bend' | 'snell' | 'speed' | 'colour';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  bend: { label: 'Which way it bends', blurb: 'Angles are measured from the normal.' },
  snell: { label: 'Snell’s law', blurb: 'n₁ sin θ₁ = n₂ sin θ₂. Use a calculator in degrees; give 3 significant figures.' },
  speed: { label: 'Speed of light', blurb: 'The refractive index says how many times faster light is in a vacuum. Give 3 significant figures.' },
  colour: { label: 'Colours', blurb: 'Dispersion in a prism, and coloured filters.' },
};

export type PrismCheck =
  | { kind: 'bend'; from: string; to: string; n1: number; n2: number; angle: number; surface: boolean }
  | { kind: 'snell'; n1: number; n2: number; theta1: number; theta2: number }
  | { kind: 'speed'; ask: 'v'; n: number; than: string; thanN: number }
  | { kind: 'speed'; ask: 'n'; v: number; than: string; thanN: number }
  | { kind: 'colours'; low: string; high: string; asks: ('higher' | 'lower' | 'more' | 'less' | 'bentMore' | 'bentLess')[]; answers: string[] }
  | { kind: 'filters'; first: string; second: string; out: string };
type Question = Q<PrismCheck>;

type Material = { name: string; n: number };
const AIR = { name: 'air', n: 1.0 };
const WATER = { name: 'water', n: 1.33 };
const GLASS = { name: 'glass', n: 1.5 };
const PERSPEX = { name: 'Perspex', n: 1.49 };
const DIAMOND = { name: 'diamond', n: 2.42 };
/**
 * Boundaries light really crosses, either way. Air and glass are left out of the bending round: the page's
 * practice questions are about exactly that boundary. Diamond only meets air or water.
 */
const BEND_PAIRS: [Material, Material][] = [
  [AIR, WATER],
  [AIR, PERSPEX],
  [AIR, DIAMOND],
  [WATER, GLASS],
  [WATER, PERSPEX],
  [WATER, DIAMOND],
];
const SNELL_PAIRS: [Material, Material][] = [...BEND_PAIRS, [AIR, GLASS]];
/** Shown on the page: air into glass at 30°, and air into water at 45°. */
const SHOWN = new Set(['air glass 30', 'air water 45']);
const C = 3.0e8;
const deg = (x: number) => (x * Math.PI) / 180;
const near = (g: Digits, x: number, rel = 0.01) => Math.abs(toNumber(g) - x) <= rel * Math.abs(x);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** A boundary, either way round, with an angle that stays below the critical angle when light leaves the denser side. */
function pairAndAngle(r: () => number, pairs: [Material, Material][], lo: number, hi: number): { a: Material; b: Material; angle: number } {
  for (;;) {
    const [a, b] = shuffle(r, [...pick(r, pairs)]);
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
  const { a, b, angle } = along ? { ...pairAndAngle(r, BEND_PAIRS, 10, 60), angle: 0 } : pairAndAngle(r, BEND_PAIRS, 10, 75);
  // At 45° the angle to the surface is also 45°, so that slip could not be told apart from the answer.
  const surface = !along && angle !== 45 && r() < 0.5;
  const slows = b.n > a.n;
  const steps: Step[] = [];
  if (surface)
    steps.push({
      type: 'number',
      prompt: 'Angles are measured from the normal, at right angles to the surface. What is the angle of incidence?',
      answer: D(angle),
      unit: '°',
      feedback: (g) => (Math.abs(toNumber(g) - (90 - angle)) < 1e-9 ? 'That is the angle to the surface. The normal is at right angles to it, so take this angle from 90°.' : 'The normal is at right angles to the surface: 90° minus the angle to the surface.'),
    });
  const speedOptions = shuffle(r, ['It slows down', 'It speeds up']);
  const speedRight = speedOptions.indexOf(slows ? 'It slows down' : 'It speeds up');
  steps.push({
    type: 'choice',
    prompt: `As the light passes from ${a.name} into ${b.name}, does it speed up or slow down?`,
    options: speedOptions,
    correct: speedRight,
    why: { [1 - speedRight]: 'Compare the refractive indices: the higher the index, the more slowly light travels.' },
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
      along
        ? 'Think about whether one side of the beam reaches the surface before the other.'
        : o === 'It does not change direction'
          ? 'It meets the surface at an angle, so one side of the beam changes speed first and it swings round.'
          : 'Slowing down bends light towards the normal; speeding up bends it away.',
    ),
  });
  if (!along) {
    const sizeOptions = shuffle(r, ['Smaller', 'Bigger', 'The same']);
    const sizeRight = sizeOptions.indexOf(slows ? 'Smaller' : 'Bigger');
    steps.push({ type: 'choice', prompt: `So is the angle of refraction bigger or smaller than ${angle}°?`, options: sizeOptions, correct: sizeRight, why: whyAll(sizeOptions, sizeRight, () => 'Which way did it bend? Picture the ray moving towards or away from the normal, and what that does to the angle.') });
  }
  const given = along ? 'It travels along the normal.' : surface ? `It makes an angle of ${90 - angle}° with the surface.` : `It meets the surface at ${angle}° to the normal.`;
  return {
    round: 'bend',
    prompt: `A ray of light passes from ${a.name} (n = ${a.n.toFixed(2)}) into ${b.name} (n = ${b.n.toFixed(2)}). ${given} What happens to it?`,
    steps,
    workings: [
      ...(surface ? [`The angle to the normal is 90° − ${90 - angle}° = ${angle}°.`] : []),
      `${cap(b.name)} has a ${slows ? 'higher' : 'lower'} refractive index, so the light ${slows ? 'slows down' : 'speeds up'}.`,
      along
        ? 'It does not change direction: a ray along the normal reaches the surface all at once, so it changes speed but not direction.'
        : `${slows ? 'Smaller' : 'Bigger'}: it bends ${slows ? 'towards' : 'away from'} the normal, so the angle of refraction is ${slows ? 'smaller' : 'bigger'} than ${angle}°.`,
    ],
    check: { kind: 'bend', from: a.name, to: b.name, n1: a.n, n2: b.n, angle, surface },
  };
}

// ---------------------------------------------------------------------------------------------
// Snell's law
// ---------------------------------------------------------------------------------------------

function snellQuestion(r: () => number): Question {
  const { a, b, angle } = pairAndAngle(r, SNELL_PAIRS, 10, 75);
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
        tolerance: 0.005,
        feedback: (g) => (near(g, flipped) ? 'That has the refractive indices the wrong way round. sin θ₂ = n₁ sin θ₁ ÷ n₂.' : 'Multiply n₁ by sin θ₁, then divide by n₂.'),
      },
      {
        type: 'number',
        prompt: 'So what is θ₂, the angle of refraction? Give 3 significant figures.',
        ...approx(theta2),
        unit: '°',
        tolerance: 0.005,
        feedback: (g) => (near(g, s2, 0.02) ? 'That is sin θ₂. Use the inverse sine (sin^{−1}) to get the angle.' : near(g, Math.asin(s2), 0.02) ? 'That is in radians. Set your calculator to degrees.' : 'Use the inverse sine of sin θ₂.'),
      },
    ],
    workings: [`sin ${angle}° = ${approx(s1).shown}.`, `sin θ₂ = ${a.n.toFixed(2)} × sin ${angle}° ÷ ${b.n.toFixed(2)} = ${approx(s2).shown}.`, `θ₂ = sin^{−1}(${approx(s2).shown}) = ${approx(theta2).shown}°.`],
    check: { kind: 'snell', n1: a.n, n2: b.n, theta1: angle, theta2 },
  };
}

// ---------------------------------------------------------------------------------------------
// Speed and refractive index
// ---------------------------------------------------------------------------------------------

const MEDIA: Material[] = [
  WATER,
  { name: 'ice', n: 1.31 },
  { name: 'ethanol', n: 1.36 },
  { name: 'olive oil', n: 1.47 },
  PERSPEX,
  { name: 'crown glass', n: 1.52 },
  { name: 'quartz', n: 1.54 },
  { name: 'flint glass', n: 1.62 },
  { name: 'sapphire', n: 1.77 },
  { name: 'cubic zirconia', n: 2.15 },
  DIAMOND,
];
/** A material named in the table, or a sample with its own index, as a lab or a lens maker would quote it. */
function material(r: () => number): Material {
  if (r() < 0.4) return pick(r, MEDIA);
  const [what, lo, hi] = pick(r, [['a new kind of lens glass', 145, 195], ['a clear plastic', 140, 160], ['a gemstone', 160, 240]] as const);
  return { name: what, n: int(r, lo, hi) / 100 };
}
/** Materials to compare against, with an index far enough away to be clear. */
const REFERENCES = [WATER, GLASS, DIAMOND];

function speedQuestion(r: () => number): Question {
  for (;;) {
    const m = material(r);
    const ref = pick(r, REFERENCES);
    if (Math.abs(ref.n - m.n) < 0.05 || ref.name === m.name) continue;
    const the = (x: Material) => (x.name.startsWith('a ') ? x.name.replace(/^a /, 'the ') : x.name);
    if (r() < 0.5) {
      const v = C / m.n;
      const faster = m.n < ref.n ? m : ref;
      const options = shuffle(r, [`In ${the(m)}`, `In ${ref.name}`]);
      const correct = options.indexOf(`In ${the(faster)}`);
      return {
        round: 'speed',
        prompt: `The refractive index of ${the(m)} is ${m.n.toFixed(2)}. How fast does light travel in it? Light travels at 3.00 × 10^{8} m/s in a vacuum.`,
        steps: [
          { type: 'choice', prompt: `Is light faster in ${the(m)} or in ${ref.name} (n = ${ref.n.toFixed(2)})?`, options, correct, why: { [1 - correct]: 'The higher the refractive index, the more slowly light travels.' } },
          { type: 'number', prompt: 'So what is the speed of light in it? Give 3 significant figures.', ...approxStd(v), unit: 'm/s', feedback: (g) => (near(g, C * m.n) ? 'That multiplies. Light is slower in the material: v = c ÷ n.' : 'Divide the speed in a vacuum by the refractive index.') },
        ],
        workings: [`${cap(the(faster))} has the lower refractive index, so light is faster there.`, `v = c ÷ n = 3.00 × 10^{8} ÷ ${m.n.toFixed(2)} = ${approxStd(v).shown} m/s.`],
        check: { kind: 'speed', ask: 'v', n: m.n, than: ref.name, thanN: ref.n },
      };
    }
    const shown = approxStd(C / m.n);
    const v = toNumber(shown.answer);
    const n = C / v;
    const bigger = n > ref.n;
    const options = shuffle(r, [`Bigger than ${ref.name}’s`, `Smaller than ${ref.name}’s`]);
    const correct = options.indexOf(bigger ? `Bigger than ${ref.name}’s` : `Smaller than ${ref.name}’s`);
    return {
      round: 'speed',
      prompt: `Light travels at ${shown.shown} m/s in ${the(m)}, and at 3.00 × 10^{8} m/s in a vacuum. What is its refractive index?`,
      steps: [
        { type: 'choice', prompt: `Light travels at ${approxStd(C / ref.n).shown} m/s in ${ref.name} (n = ${ref.n.toFixed(2)}). Is this refractive index bigger or smaller than ${ref.name}’s?`, options, correct, why: { [1 - correct]: 'The slower light travels in a material, the higher its refractive index.' } },
        { type: 'number', prompt: 'So what is the refractive index? Give 3 significant figures.', ...approx(n), feedback: (g) => (near(g, v / C) ? 'That is upside down. n = c ÷ v, the speed in a vacuum divided by the speed in the material.' : 'Divide the speed in a vacuum by the speed in the material.') },
      ],
      workings: [`Light is ${bigger ? 'slower' : 'faster'} here than in ${ref.name}, so the index is ${bigger ? 'bigger' : 'smaller'}.`, `n = c ÷ v = 3.00 × 10^{8} ÷ ${shown.shown} = ${approx(n).shown}.`],
      check: { kind: 'speed', ask: 'n', v, than: ref.name, thanN: ref.n },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Colours
// ---------------------------------------------------------------------------------------------

/** The spectrum, from the lowest frequency to the highest. */
const SPECTRUM = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
const ASKS = {
  higher: 'Which has the higher frequency?',
  lower: 'Which has the lower frequency?',
  more: 'Which slows down more in the glass?',
  less: 'Which slows down less in the glass?',
  bentMore: 'Which is bent more?',
  bentLess: 'Which is bent less?',
} as const;
const FILTERS = ['red', 'green', 'blue'];

function colourQuestion(r: () => number): Question {
  if (r() < 0.6) {
    const i = int(r, 0, 5);
    const j = int(r, i + 1, 6);
    const low = SPECTRUM[i];
    const high = SPECTRUM[j];
    const where = pick(r, ['a glass prism', 'a glass block']);
    const asks = [pick(r, ['higher', 'lower'] as const), pick(r, ['more', 'less'] as const), pick(r, ['bentMore', 'bentLess'] as const)];
    const steps: Step[] = asks.map((a) => {
      const right = a === 'higher' || a === 'more' || a === 'bentMore' ? high : low;
      const options = shuffle(r, [`${cap(low)} light`, `${cap(high)} light`]);
      const correct = options.indexOf(`${cap(right)} light`);
      const why = a === 'higher' || a === 'lower' ? 'Frequency rises from red, the lowest, to violet, the highest.' : a === 'more' || a === 'less' ? 'In glass, the higher the frequency, the more the light slows down.' : 'Light that slows down more is bent more, so violet bends the most and red the least.';
      return { type: 'choice' as const, prompt: ASKS[a], options, correct, why: { [1 - correct]: why } };
    });
    const named = shuffle(r, [low, high]);
    return {
      round: 'colour',
      prompt: `A beam of ${named[0]} light and a beam of ${named[1]} light enter ${where} at the same angle.`,
      steps,
      workings: [
        `${cap(high)} light has a higher frequency than ${low} light.`,
        'In glass it slows down more, so it is bent more. That is how a prism spreads white light into a spectrum.',
        `${cap(asks[2] === 'bentMore' ? high : low)} light is bent ${asks[2] === 'bentMore' ? 'more' : 'less'}.`,
      ],
      check: { kind: 'colours', low, high, asks, answers: steps.map((s) => (s.type === 'choice' ? s.options[s.correct] : '')) },
    };
  }
  const first = pick(r, FILTERS);
  // The same colour about half the time, so "no light" is not a safe guess.
  const second = r() < 0.5 ? first : pick(r, FILTERS.filter((f) => f !== first));
  const absorbOptions = shuffle(r, [`Every colour except ${first}`, `Only ${first}`, 'None of them']);
  const absorbRight = absorbOptions.indexOf(`Every colour except ${first}`);
  const out = first === second ? `${cap(first)} light` : 'No light';
  const secondOptions = shuffle(r, [...new Set([`${cap(first)} light`, `${cap(second)} light`, 'No light', 'White light'])]);
  const secondRight = secondOptions.indexOf(out);
  const source = pick(r, ['A stage lamp shines white light', 'A torch shines white light', 'Sunlight shines', 'A projector shines white light']);
  return {
    round: 'colour',
    prompt: `${source} through a ${first} filter, and then through ${first === second ? `another ${second}` : `a ${second}`} filter. What comes out of the second filter?`,
    steps: [
      { type: 'choice', prompt: `Which colours does the ${first} filter absorb?`, options: absorbOptions, correct: absorbRight, why: whyAll(absorbOptions, absorbRight, () => 'A filter transmits its own colour and absorbs the rest.') },
      {
        type: 'choice',
        prompt: `So only ${first} light reaches the second filter. What comes out of it?`,
        options: secondOptions,
        correct: secondRight,
        why: whyAll(secondOptions, secondRight, (o) =>
          o === `${cap(second)} light` && first !== second ? 'A filter cannot add a colour: it can only absorb some of the light that reaches it.' : o === 'White light' ? 'A filter cannot add colours back.' : `Does a ${second} filter transmit ${first} light, or absorb it?`,
        ),
      },
    ],
    workings: [`The ${first} filter absorbs every colour except ${first}, so only ${first} light leaves it.`, first === second ? `The second ${second} filter transmits that ${first} light.` : `The ${second} filter absorbs ${first} light.`, `${out} comes out.`],
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
