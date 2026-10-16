/**
 * Quiz for "Gravity and Newton's Law of Gravitation" (KAN-93): weight, the inverse square law, Newton's law
 * with r from the centre, and circular orbits. Key stage 3 to A-level. The weight and inverse square rounds
 * use exact numbers; the A-level rounds are calculator answers to 3 significant figures, in standard form.
 */
import { D, approxStd, fmt, pick, shuffle, toNumber, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';
import type { Digits } from '@/lib/measures';

export type Round = 'weight' | 'inverse' | 'newton' | 'orbit';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  weight: { label: 'Weight', blurb: 'W = mg. Mass stays the same everywhere; weight depends on the field strength.' },
  inverse: { label: 'Inverse square', blurb: 'Double the distance and the force falls to a quarter. Double a mass and the force doubles.' },
  newton: { label: 'Newton’s law', blurb: 'F = GMm/r² and g = GM/r², with r from the centre. Use a calculator; give 3 significant figures.' },
  orbit: { label: 'Orbits', blurb: 'v = √(GM/r) for a circular orbit, and one lap is 2πr. Use a calculator; give 3 significant figures.' },
};

export type GravityCheck =
  | { kind: 'weight'; m: string; g: string; W: string }
  | { kind: 'weight2'; W1: string; g1: string; g2: string; m: string; W2: string }
  | { kind: 'inverse'; F0: number; k: number; n: number; F: number }
  | { kind: 'force' | 'field'; body: string; GM: number; M: number; Rkm: number; hkm: number; m?: number; r: number; answer: number }
  | { kind: 'orbit'; body: string; GM: number; Rkm: number; hkm: number; r: number; v: number; periodMin?: number };
type Question = Q<GravityCheck>;

const G = 6.67e-11;
/** 5.97 × 10^{24}: a value in standard form, drawn with a raised index. */
const std = (x: number) => approxStd(x).shown;
const near = (g: Digits, x: number, rel = 0.01) => Math.abs(toNumber(g) - x) <= rel * Math.abs(x);

// ---------------------------------------------------------------------------------------------
// Weight
// ---------------------------------------------------------------------------------------------

/** Field strengths at the surface, rounded as key stage 3 books give them. */
const WORLDS: { name: string; on: string; g: string }[] = [
  { name: 'Earth', on: 'on Earth', g: '9.8' },
  { name: 'the Moon', on: 'on the Moon', g: '1.6' },
  { name: 'Mars', on: 'on Mars', g: '3.7' },
  { name: 'Venus', on: 'on Venus', g: '8.9' },
];
/** Things and realistic masses in kg. */
const THINGS: { what: string; masses: number[] }[] = [
  { what: 'An astronaut in a spacesuit', masses: [110, 120, 130, 140, 150] },
  { what: 'A rover', masses: [180, 200, 500, 900, 1000] },
  { what: 'A bag of rock samples', masses: [2, 4, 5, 8, 10, 12, 20] },
  { what: 'A lander', masses: [300, 400, 600, 800] },
];
const mult = (a: string, b: string) => {
  // Exact product of two short decimals, as a string.
  const da = (a.split('.')[1] ?? '').length;
  const db = (b.split('.')[1] ?? '').length;
  const p = BigInt(a.replace('.', '')) * BigInt(b.replace('.', ''));
  return fmt({ ...D(String(p)), top: D(String(p)).top - da - db });
};

function weightQuestion(r: () => number): Question {
  const thing = pick(r, THINGS);
  const m = String(pick(r, thing.masses));
  const place = pick(r, WORLDS);
  if (r() < 0.5) {
    const W = mult(m, place.g);
    const options = shuffle(r, ['W = m × g', 'W = m ÷ g', 'W = g ÷ m']);
    const correct = options.indexOf('W = m × g');
    return {
      round: 'weight',
      prompt: `${thing.what} has a mass of ${m} kg. What is its weight ${place.on}, where g = ${place.g} N/kg?`,
      steps: [
        { type: 'choice', prompt: 'Which equation gives the weight?', options, correct, why: whyAll(options, correct, () => 'The field strength is the pull on each kilogram, so the weight is the mass times g.') },
        {
          type: 'number',
          prompt: 'So what is its weight?',
          answer: D(W.replace(/,/g, '')),
          unit: 'N',
          feedback: (g) => (near(g, Number(m) / Number(place.g)) ? 'That divides. Each kilogram is pulled with g newtons, so multiply.' : sameValue(g, Number(m)) ? 'That is the mass in kilograms. Weight is a force, in newtons.' : 'Multiply the mass in kg by g in N/kg.'),
        },
      ],
      workings: [`W = m × g = ${m} × ${place.g} = ${W} N.`],
      check: { kind: 'weight', m, g: place.g, W: W.replace(/,/g, '') },
    };
  }
  const other = pick(r, WORLDS.filter((w) => w !== place));
  const W1 = mult(m, place.g);
  const W2 = mult(m, other.g);
  const options = shuffle(r, ['It stays the same', 'It gets smaller', 'It gets bigger']);
  const correct = options.indexOf('It stays the same');
  return {
    round: 'weight',
    prompt: `${thing.what} weighs ${W1} N ${place.on}, where g = ${place.g} N/kg. What does it weigh ${other.on}, where g = ${other.g} N/kg?`,
    steps: [
      { type: 'choice', prompt: `What happens to its mass when it goes from ${place.name} to ${other.name}?`, options, correct, why: whyAll(options, correct, () => 'Mass is the amount of matter, so it is the same everywhere. Only the weight changes.') },
      { type: 'number', prompt: 'What is its mass?', answer: D(m), unit: 'kg', feedback: (g) => (near(g, Number(W1.replace(/,/g, '')) * Number(place.g)) ? 'That multiplies. Mass = weight ÷ g.' : 'Mass = weight ÷ g.') },
      {
        type: 'number',
        prompt: `So what does it weigh ${other.on}?`,
        answer: D(W2.replace(/,/g, '')),
        unit: 'N',
        feedback: (g) => (near(g, Number(W1.replace(/,/g, '')) * Number(other.g)) ? 'That multiplies the weight, not the mass. Use the mass you found.' : `Multiply the mass by ${other.name}’s g.`),
      },
    ],
    workings: [`Its mass is ${W1} ÷ ${place.g} = ${m} kg, the same everywhere.`, `${cap(other.on)}: W = ${m} × ${other.g} = ${W2} N.`],
    check: { kind: 'weight2', W1: W1.replace(/,/g, ''), g1: place.g, g2: other.g, m, W2: W2.replace(/,/g, '') },
  };
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const sameValue = (g: Digits, x: number) => Math.abs(toNumber(g) - x) < 1e-9;

// ---------------------------------------------------------------------------------------------
// Inverse square
// ---------------------------------------------------------------------------------------------

const PULLS = [
  { start: (F: number) => `The pull of gravity between Earth and a satellite is ${fmt(D(F))} N.`, far: (k: string) => `The satellite moves to an orbit ${k} from Earth’s centre`, mass: (n: string) => `and a satellite with ${n} the mass takes its place` },
  { start: (F: number) => `Two asteroids pull on each other with a force of ${fmt(D(F))} N.`, far: (k: string) => `They drift until they are ${k} apart`, mass: (n: string) => `and one of them is replaced by an asteroid with ${n} the mass` },
];
const TIMES: Record<number, string> = { 2: 'twice', 3: 'three times', 4: 'four times', 5: 'five times', 10: 'ten times', 0.5: 'half' };
const AS_BIG: Record<number, string> = { 2: 'twice as big', 3: 'three times as big', 4: 'four times as big', 5: 'five times as big', 10: 'ten times as big', 0.5: 'half as big' };
const FARTHER: Record<number, string> = { 2: 'twice as far', 3: 'three times as far', 4: 'four times as far', 5: 'five times as far', 10: 'ten times as far', 0.5: 'half as far' };

function inverseQuestion(r: () => number): Question {
  for (;;) {
    const k = pick(r, [2, 3, 4, 5, 10, 0.5]);
    const n = r() < 0.5 ? 1 : pick(r, [2, 3, 4, 0.5]);
    // The page shows tripling the distance, doubling the distance, and doubling a mass, each on its own.
    if (n === 1 && (k === 3 || k === 2)) continue;
    const F0 = pick(r, [400, 720, 900, 1200, 1800, 3600, 4000]);
    const F = (F0 * n) / (k * k);
    // Each slip must give its own number, different from the answer, so its feedback can be named.
    const slips = [(F0 * n) / k, ...(n !== 1 ? [F0 / (k * k)] : [])];
    if (!Number.isInteger(F * 10) || new Set([F, ...slips]).size < slips.length + 1) continue;
    const P = pick(r, PULLS);
    const kk = k * k;
    const distWord = k < 1 ? 'multiplied by 4' : `divided by ${kk}`;
    const distOptions = shuffle(r, [...new Set([distWord, k < 1 ? 'divided by 4' : `multiplied by ${kk}`, k < 1 ? 'multiplied by 2' : `divided by ${k}`, k < 1 ? 'divided by 2' : `multiplied by ${k}`])]);
    const distRight = distOptions.indexOf(distWord);
    const steps: Step[] = [
      {
        type: 'choice',
        prompt: `When the distance between the centres becomes ${AS_BIG[k]}, the force is…`,
        options: distOptions,
        correct: distRight,
        why: whyAll(distOptions, distRight, (o) => (o.includes(`${k}`) && !o.includes(`${kk}`) && k >= 1 ? 'Gravity follows an inverse square law: square the change in distance.' : 'Further apart means a weaker pull, and the change is squared.')),
      },
    ];
    if (n !== 1) {
      const massWord = n < 1 ? 'divided by 2' : `multiplied by ${n}`;
      const massOptions = shuffle(r, [...new Set([massWord, n < 1 ? 'divided by 4' : `multiplied by ${n * n}`, n < 1 ? 'multiplied by 2' : `divided by ${n}`])]);
      const massRight = massOptions.indexOf(massWord);
      steps.push({ type: 'choice', prompt: `And when one mass becomes ${TIMES[n]} as big, the force is…`, options: massOptions, correct: massRight, why: whyAll(massOptions, massRight, () => 'The force is proportional to each mass: the same change, not squared.') });
    }
    steps.push({
      type: 'number',
      prompt: 'So what is the new force?',
      answer: D(F),
      unit: 'N',
      feedback: (g) =>
        near(g, (F0 * n) / k, 0.005)
          ? 'That divides by the change in distance, not its square. Gravity follows an inverse square law.'
          : n !== 1 && near(g, F0 / kk, 0.005)
            ? 'That leaves out the change in mass.'
            : `Start from ${fmt(D(F0))} N and apply each change in turn.`,
    });
    const change = n === 1 ? `${P.far(FARTHER[k])}.` : `${P.far(FARTHER[k])}, ${P.mass(TIMES[n])}.`;
    return {
      round: 'inverse',
      prompt: `${P.start(F0)} ${change} What is the new force?`,
      steps,
      workings: [
        `The distance becomes ${AS_BIG[k]}, so the force is ${distWord}.`,
        ...(n !== 1 ? [`One mass becomes ${TIMES[n]} as big, so the force is ${n < 1 ? 'divided by 2' : `multiplied by ${n}`}.`] : []),
        `${fmt(D(F0))}${n === 1 ? '' : n < 1 ? ' ÷ 2' : ` × ${n}`}${k < 1 ? ' × 4' : ` ÷ ${kk}`} = ${fmt(D(F))} N.`,
      ],
      check: { kind: 'inverse', F0, k, n, F },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Newton's law and field strength, with r from the centre
// ---------------------------------------------------------------------------------------------

/** Heights in km: low orbits in steps, plus the GPS and geostationary heights for Earth. */
const steps = (lo: number, hi: number, by: number) => Array.from({ length: Math.floor((hi - lo) / by) + 1 }, (_, i) => lo + i * by);
const BODIES = [
  { name: 'Earth', of: 'Earth', M: 5.97e24, GM: 3.98e14, Rkm: 6370, heights: [...steps(300, 2000, 50), 20200, 35800] },
  { name: 'the Moon', of: 'the Moon', M: 7.35e22, GM: 4.9e12, Rkm: 1740, heights: steps(20, 500, 10) },
  { name: 'Mars', of: 'Mars', M: 6.42e23, GM: 4.28e13, Rkm: 3390, heights: steps(250, 2000, 50) },
];
/** Shown on the page: Earth at r = 6.7, 6.77 and 7.0 × 10^6 m, the surface, and one radius up. */
const SHOWN_EARTH_HEIGHTS = new Set([0, 330, 400, 630, 6370]);

/** The distance-from-the-centre step: the height is above the surface, so add the radius, then change km to m. */
function centreStep(body: (typeof BODIES)[number], h: number, r: number): Step {
  return {
    type: 'number',
    prompt: `What is r, the distance from the centre of ${body.of}, in metres? (${cap(body.of)}’s radius is ${fmt(D(body.Rkm))} km.)`,
    ...approxStd(r),
    unit: 'm',
    feedback: (g) =>
      near(g, h * 1000) ? `That is the height above the surface. r is measured from the centre, so add the radius.` : near(g, body.Rkm + h) ? 'That is in kilometres. Multiply by 1,000 to get metres.' : `Add the radius and the height, then change kilometres to metres.`,
  };
}

function newtonQuestion(r: () => number): Question {
  for (;;) {
    const body = pick(r, BODIES);
    const h = pick(r, body.heights);
    if (body.name === 'Earth' && SHOWN_EARTH_HEIGHTS.has(h)) continue;
    const rm = (body.Rkm + h) * 1000;
    const field = r() < 0.4;
    const m = pick(r, [500, 800, 1500, 2000, 4000]);
    const answer = field ? (G * body.M) / rm ** 2 : (G * body.M * m) / rm ** 2;
    const noSquare = field ? (G * body.M) / rm : (G * body.M * m) / rm;
    const fromSurface = field ? (G * body.M) / (h * 1000) ** 2 : (G * body.M * m) / (h * 1000) ** 2;
    const unit = field ? 'N/kg' : 'N';
    const what = field ? 'the gravitational field strength' : 'the gravitational force on it';
    const formula = field ? 'g = GM/r^{2}' : 'F = GMm/r^{2}';
    return {
      round: 'newton',
      prompt: field
        ? `What is the gravitational field strength ${fmt(D(h))} km above the surface of ${body.of}? Use G = 6.67 × 10^{−11} N m^{2} kg^{−2} and M = ${std(body.M)} kg.`
        : `A ${fmt(D(m))} kg satellite orbits ${fmt(D(h))} km above the surface of ${body.of}. Find ${what}. Use G = 6.67 × 10^{−11} N m^{2} kg^{−2} and M = ${std(body.M)} kg.`,
      steps: [
        centreStep(body, h, rm),
        { type: 'number', prompt: 'What is r^{2}?', ...approxStd(rm * rm), unit: 'm²', feedback: (g) => (near(g, 2 * rm) ? 'That doubles r. Squaring means r × r.' : 'Multiply r by itself.') },
        {
          type: 'number',
          prompt: `So what is ${what}? Give 3 significant figures.`,
          ...approxStd(answer),
          unit,
          tolerance: 0.005,
          feedback: (g) =>
            near(g, noSquare) ? 'That divides by r, not r^{2}. Gravity follows an inverse square law.' : near(g, fromSurface) ? 'That uses the height, not the distance from the centre.' : `Put the values into ${formula}.`,
        },
      ],
      workings: [
        `r = ${fmt(D(body.Rkm))} + ${fmt(D(h))} = ${fmt(D(body.Rkm + h))} km = ${approxStd(rm).shown} m.`,
        `r^{2} = ${approxStd(rm * rm).shown} m^{2}.`,
        `${formula}: ${field ? 'g' : 'F'} = ${approxStd(answer).shown} ${unit}.`,
      ],
      check: { kind: field ? 'field' : 'force', body: body.name, GM: body.GM, M: body.M, Rkm: body.Rkm, hkm: h, ...(field ? {} : { m }), r: rm, answer },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Circular orbits
// ---------------------------------------------------------------------------------------------

function orbitQuestion(r: () => number): Question {
  for (;;) {
    const body = pick(r, BODIES);
    const h = pick(r, body.heights);
    if (body.name === 'Earth' && SHOWN_EARTH_HEIGHTS.has(h)) continue;
    const rm = (body.Rkm + h) * 1000;
    const gmr = body.GM / rm;
    const v = Math.sqrt(gmr);
    const askPeriod = r() < 0.4;
    const periodMin = (2 * Math.PI * rm) / v / 60;
    const steps: Step[] = [
      centreStep(body, h, rm),
      { type: 'number', prompt: 'What is GM ÷ r?', ...approxStd(gmr), feedback: (g) => (near(g, body.GM / rm ** 2) ? 'That divides by r^{2}. Here it is r, not r^{2}.' : 'Divide GM by r in metres.') },
      {
        type: 'number',
        prompt: 'So what is the orbital speed? Give 3 significant figures.',
        ...approxStd(v),
        unit: 'm/s',
        tolerance: 0.005,
        feedback: (g) => (near(g, gmr) ? 'That is GM ÷ r. The speed is its square root.' : near(g, Math.sqrt(body.GM / (h * 1000))) ? 'That uses the height, not the distance from the centre.' : 'Take the square root of GM ÷ r.'),
      },
    ];
    if (askPeriod)
      steps.push({
        type: 'number',
        prompt: 'How long does one lap take, in minutes? Give 3 significant figures.',
        ...approxStd(periodMin),
        unit: 'minutes',
        tolerance: 0.006,
        feedback: (g) => (near(g, periodMin * 60) ? 'That is in seconds. Divide by 60.' : near(g, rm / v / 60) ? 'One lap is the whole circumference, 2πr, not r.' : 'Time = distance ÷ speed, with the distance 2πr.'),
      });
    return {
      round: 'orbit',
      prompt: `A satellite is in a circular orbit ${fmt(D(h))} km above the surface of ${body.of}. Find its orbital speed${askPeriod ? ' and the time for one lap' : ''}. Take GM = ${std(body.GM)} m^{3} s^{−2}.`,
      steps,
      workings: [
        `r = ${fmt(D(body.Rkm))} + ${fmt(D(h))} = ${fmt(D(body.Rkm + h))} km = ${approxStd(rm).shown} m.`,
        `GM ÷ r = ${approxStd(gmr).shown}, so v = √(GM ÷ r) = ${approxStd(v).shown} m/s.`,
        ...(askPeriod ? [`One lap: 2πr ÷ v = ${approxStd(periodMin * 60).shown} s, which is ${approxStd(periodMin).shown} minutes.`] : []),
      ],
      check: { kind: 'orbit', body: body.name, GM: body.GM, Rkm: body.Rkm, hkm: h, r: rm, v, ...(askPeriod ? { periodMin } : {}) },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'inverse') return inverseQuestion(r);
  if (round === 'newton') return newtonQuestion(r);
  if (round === 'orbit') return orbitQuestion(r);
  return weightQuestion(r);
}

export const gravityQuiz: LessonQuiz<GravityCheck> = {
  lesson: 'gravity',
  storageKey: 'stella-quiz-gravity-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
