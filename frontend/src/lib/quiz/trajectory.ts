/**
 * Quiz for "Orbits and Hohmann Transfers" (KAN-97): orbital speed, the transfer ellipse, how the period
 * scales with the radius, and the coast time. Worked in kilometres with GM = 3.986 × 10^5 km³ s⁻², as the
 * lesson does. Calculator answers to 3 significant figures; every answer is worked from the values shown.
 */
import { D, approx, approxStd, fmt, pick, shuffle, toNumber, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';
import type { Digits } from '@/lib/measures';

export type Round = 'speed' | 'transfer' | 'period' | 'coast';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  speed: { label: 'Orbital speed', blurb: 'v = √(GM/r), with r from Earth’s centre. Give 3 significant figures.' },
  transfer: { label: 'The transfer ellipse', blurb: 'The semi-major axis is the average of the two orbit radii.' },
  period: { label: 'Period and radius', blurb: 'T = 2π√(r³/GM): the period grows faster than the radius.' },
  coast: { label: 'The coast', blurb: 'Going further: half an orbit of the ellipse, t = π√(a³/GM). Give 3 significant figures.' },
};

export type TrajectoryCheck =
  | { kind: 'speed'; hA: number; hB: number; asked: 'A' | 'B'; v: number }
  | { kind: 'transfer'; h1: number; h2: number; a: number }
  | { kind: 'period'; k: number; T0: number; unit: string; T: number }
  | { kind: 'coast'; h1: number; h2: number; a: number; seconds: number; hours: number };
type Question = Q<TrajectoryCheck>;

const GM = 3.986e5; // km³ s⁻²
const R = 6370; // km
/** An exact value shown as it is (27, 1.728), or 3 s.f. with the exact value for marking when it is long. */
function exactOr3(x: number) {
  const clean = parseFloat(x.toPrecision(10));
  const d = D(String(clean));
  return d.digits.length <= 4 ? { answer: d, shown: fmt(d), exact: clean } : approx(x);
}
const near = (g: Digits, x: number, rel = 0.01) => Math.abs(toNumber(g) - x) <= rel * Math.abs(x);
const km = (x: number) => `${fmt(D(x))} km`;
/** Heights above the ground in km: low orbits in steps of 50 km, then GPS and geostationary heights. */
const HEIGHTS = [...Array.from({ length: 35 }, (_, i) => 300 + i * 50), 20200, 35800];
const NAMED: Record<number, string> = { 20200: ' (the height of GPS satellites)', 35800: ' (geostationary orbit)' };
/** Shown on the page, as radii: 6,700 to 42,000; 10,000 and 20,000; 7,000 and 13,000; and 300 km up to geostationary. */
const SHOWN_PAIRS = new Set(['6700 42000', '10000 20000', '7000 13000', '7000 42000', '300 35800']);
const pairKey = (a: number, b: number) => [a, b].sort((x, y) => x - y).join(' ');

// ---------------------------------------------------------------------------------------------
// Orbital speed
// ---------------------------------------------------------------------------------------------

function speedQuestion(r: () => number): Question {
  for (;;) {
    const [hA, hB] = shuffle(r, [...HEIGHTS]).slice(0, 2);
    if (Math.abs(hA - hB) < 200 || SHOWN_PAIRS.has(pairKey(hA + R, hB + R))) continue;
    const asked = pick(r, ['A', 'B'] as const);
    const h = asked === 'A' ? hA : hB;
    const rr = h + R;
    const gmr = GM / rr;
    const v = Math.sqrt(gmr);
    const fasterOptions = shuffle(r, ['Satellite A', 'Satellite B']);
    const fasterRight = fasterOptions.indexOf(hA < hB ? 'Satellite A' : 'Satellite B');
    return {
      round: 'speed',
      prompt: `Satellite A orbits ${km(hA)} above the ground${NAMED[hA] ?? ''}, and satellite B ${km(hB)} above it${NAMED[hB] ?? ''}. Earth’s radius is 6,370 km, and GM = 3.986 × 10^{5} km^{3} s^{−2}. Which is faster, and how fast does satellite ${asked} move?`,
      steps: [
        { type: 'choice', prompt: 'Which satellite moves faster?', options: fasterOptions, correct: fasterRight, why: { [1 - fasterRight]: 'The lower the orbit, the faster the satellite: gravity is stronger closer in.' } },
        { type: 'number', prompt: `What is r for satellite ${asked}, its distance from Earth’s centre?`, answer: D(rr), unit: 'km', feedback: (g) => (near(g, h, 1e-9) ? 'That is its height above the ground. r is measured from the centre: add Earth’s radius.' : 'Add Earth’s radius, 6,370 km, to the height.') },
        { type: 'number', prompt: 'What is GM ÷ r? Give 3 significant figures.', ...approxStd(gmr), feedback: (g) => (near(g, GM / h) ? 'That divides by the height. Use r from the centre.' : 'Divide 3.986 × 10^{5} by r in km.') },
        {
          type: 'number',
          prompt: 'So what is its speed, in km/s? Give 3 significant figures.',
          ...approx(v),
          unit: 'km/s',
          tolerance: 0.005,
          feedback: (g) => (near(g, gmr) ? 'That is GM ÷ r. The speed is its square root.' : near(g, Math.sqrt(GM / h)) ? 'That uses the height, not the distance from the centre.' : 'Take the square root of GM ÷ r.'),
        },
      ],
      workings: [`${hA < hB ? 'A' : 'B'} is lower, so it is faster.`, `r = ${fmt(D(h))} + 6,370 = ${km(rr)}.`, `GM ÷ r = ${approxStd(gmr).shown}, so v = √(GM ÷ r) = ${approx(v).shown} km/s.`],
      check: { kind: 'speed', hA, hB, asked, v },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// The transfer ellipse
// ---------------------------------------------------------------------------------------------

function radiusSteps(h1: number, h2: number): Step[] {
  return [
    { type: 'number', prompt: 'What is r₁, the radius of the lower orbit?', answer: D(h1 + R), unit: 'km', feedback: (g) => (near(g, h1, 1e-9) ? 'That is the height above the ground. Add Earth’s radius, 6,370 km.' : 'Add Earth’s radius to the height.') },
    { type: 'number', prompt: 'And r₂, the radius of the higher orbit?', answer: D(h2 + R), unit: 'km', feedback: (g) => (near(g, h2, 1e-9) ? 'That is the height above the ground. Add Earth’s radius, 6,370 km.' : 'Add Earth’s radius to the height.') },
  ];
}
function semiMajor(h1: number, h2: number): Step {
  const r1 = h1 + R;
  const r2 = h2 + R;
  const a = (r1 + r2) / 2;
  return {
    type: 'number',
    prompt: 'What is the semi-major axis of the transfer ellipse?',
    answer: D(String(a)),
    unit: 'km',
    feedback: (g) => (near(g, r1 + r2, 1e-9) ? 'That is the full length of the ellipse, end to end. The semi-major axis is half of it.' : near(g, (r2 - r1) / 2, 1e-9) ? 'That halves the difference. Add the two radii, then halve.' : near(g, (h1 + h2) / 2, 1e-9) ? 'That uses the heights. Use the radii from Earth’s centre.' : 'Add the two radii, then halve the total.'),
  };
}

function lowHigh(r: () => number): [number, number] {
  for (;;) {
    const [x, y] = shuffle(r, [...HEIGHTS]).slice(0, 2);
    const [h1, h2] = x < y ? [x, y] : [y, x];
    if (h2 - h1 < 500 || SHOWN_PAIRS.has(`${h1} ${h2}`) || SHOWN_PAIRS.has(pairKey(h1 + R, h2 + R))) continue;
    return [h1, h2];
  }
}

function transferQuestion(r: () => number): Question {
  const [h1, h2] = lowHigh(r);
  const a = (h1 + R + h2 + R) / 2;
  return {
    round: 'transfer',
    prompt: `A spacecraft climbs from a circular orbit ${km(h1)} above the ground to one ${km(h2)} above it${NAMED[h2] ?? ''}, by a Hohmann transfer. Earth’s radius is 6,370 km. What is the semi-major axis of the transfer ellipse?`,
    steps: [...radiusSteps(h1, h2), semiMajor(h1, h2)],
    workings: [`r₁ = ${fmt(D(h1))} + 6,370 = ${km(h1 + R)}, and r₂ = ${fmt(D(h2))} + 6,370 = ${km(h2 + R)}.`, `a = (${fmt(D(h1 + R))} + ${fmt(D(h2 + R))}) ÷ 2 = ${fmt(D(String(a)))} km.`],
    check: { kind: 'transfer', h1, h2, a },
  };
}

// ---------------------------------------------------------------------------------------------
// Period and radius
// ---------------------------------------------------------------------------------------------

/** Radius factors whose 1.5 power comes out exactly. The page shows 4 (period × 8). */
const FACTORS = [9, 16, 25, 0.25, 0.36, 1.44, 2.25, 6.25];
const PERIODS: { T0: number; unit: string; what: string }[] = [
  ...[90, 95, 100, 105, 110, 120].map((T0) => ({ T0, unit: 'minutes', what: `A satellite in a low orbit takes ${T0} minutes to go round once.` })),
  ...[2, 3, 4, 6, 8, 10, 12, 24].map((T0) => ({ T0, unit: 'hours', what: `A satellite takes ${T0} hours to go round once.` })),
];
const TIMES: Record<number, string> = { 9: '9 times', 16: '16 times', 25: '25 times', 0.25: 'a quarter of', 0.36: '0.36 times', 1.44: '1.44 times', 2.25: '2.25 times', 6.25: '6.25 times' };

function periodQuestion(r: () => number): Question {
  const k = pick(r, FACTORS);
  const P = pick(r, PERIODS);
  // Calculator answers: the exact value or 3 s.f. are both right (1.44³ = 2.985984, shown as 2.99).
  const k3n = k ** 3;
  const k15n = k ** 1.5;
  const T = P.T0 * k15n;
  const k3 = exactOr3(k3n);
  const k15 = exactOr3(k15n);
  const Ts = exactOr3(T);
  const options = shuffle(r, ['Longer', 'Shorter']);
  const correct = options.indexOf(k > 1 ? 'Longer' : 'Shorter');
  return {
    round: 'period',
    prompt: `${P.what} It moves to a circular orbit with a radius ${TIMES[k]} ${k < 1 ? 'the old one' : 'as big'}. How long does one orbit take now?`,
    steps: [
      { type: 'choice', prompt: 'Will one orbit take longer or shorter?', options, correct, why: { [1 - correct]: 'A higher orbit is longer and slower, so it takes more time; a lower one takes less.' } },
      { type: 'number', prompt: 'T = 2π√(r^{3}/GM). By what number is r^{3} multiplied?', ...k3, feedback: (g) => (near(g, k) ? 'That is the change in r. Cube it.' : near(g, k * k) ? 'That squares it. r^{3} means cubing.' : `Multiply ${k} by itself three times.`) },
      { type: 'number', prompt: 'So by what number is T multiplied?', ...k15, feedback: (g) => (near(g, k3n) ? 'That is the change in r^{3}. T depends on its square root.' : 'Take the square root of the change in r^{3}.') },
      {
        type: 'number',
        prompt: `So how long does one orbit take now, in ${P.unit}?`,
        ...Ts,
        unit: P.unit,
        tolerance: 0.005,
        feedback: (g) =>
          near(g, P.T0 * k) ? 'That changes the period by the same factor as the radius. It grows faster: the factor is √(k^{3}).' : near(g, P.T0 * k3n) ? 'That uses the change in r^{3}. Take its square root first.' : near(g, P.T0 * k * k) ? 'That squares the change in radius. The factor is √(k^{3}).' : 'Multiply the old period by the change in T.',
      },
    ],
    workings: [`r is multiplied by ${k}, so r^{3} is multiplied by ${k3.shown}.`, `T is multiplied by √${k3.shown} = ${k15.shown}.`, `${P.T0} × ${k15.shown} = ${Ts.shown} ${P.unit}.`],
    check: { kind: 'period', k, T0: P.T0, unit: P.unit, T },
  };
}

// ---------------------------------------------------------------------------------------------
// The coast
// ---------------------------------------------------------------------------------------------

function coastQuestion(r: () => number): Question {
  const [h1, h2] = lowHigh(r);
  const a = (h1 + R + h2 + R) / 2;
  const a3 = approxStd(a ** 3);
  // Worked from a³ as shown, as a pupil carrying 3 s.f. would.
  const seconds = Math.PI * Math.sqrt(toNumber(a3.answer) / GM);
  const hours = seconds / 3600;
  const exactSeconds = Math.PI * Math.sqrt(a ** 3 / GM);
  return {
    round: 'coast',
    prompt: `A spacecraft makes a Hohmann transfer from a circular orbit ${km(h1)} above the ground to one ${km(h2)} above it${NAMED[h2] ?? ''}. Earth’s radius is 6,370 km, and GM = 3.986 × 10^{5} km^{3} s^{−2}. How long does the coast take?`,
    steps: [
      semiMajor(h1, h2),
      { type: 'number', prompt: 'What is a^{3}? Give 3 significant figures.', ...a3, unit: 'km³', feedback: (g) => (near(g, a * a) ? 'That squares it. a^{3} means a × a × a.' : 'Multiply a by itself three times.') },
      {
        type: 'number',
        prompt: 'The coast is half an orbit of the ellipse: t = π√(a^{3}/GM). How long is that, in seconds? Give 3 significant figures.',
        ...approxStd(seconds),
        exact: exactSeconds,
        unit: 's',
        tolerance: 0.006,
        feedback: (g) => (near(g, 2 * exactSeconds) ? 'That is 2π, a whole orbit. The coast is only half way round: π.' : near(g, (Math.PI * toNumber(a3.answer)) / GM) ? 'Take the square root of a^{3} ÷ GM before multiplying by π.' : 'Divide a^{3} by GM, take the square root, then multiply by π.'),
      },
      {
        type: 'number',
        prompt: 'And in hours? Give 3 significant figures.',
        ...approx(hours),
        exact: exactSeconds / 3600,
        unit: 'hours',
        tolerance: 0.008,
        feedback: (g) => (near(g, exactSeconds / 60) ? 'That is in minutes. Divide by 60 again for hours.' : near(g, exactSeconds) ? 'That is still in seconds. There are 3,600 seconds in an hour.' : 'Divide the seconds by 3,600.'),
      },
    ],
    workings: [
      `a = (${fmt(D(h1 + R))} + ${fmt(D(h2 + R))}) ÷ 2 = ${fmt(D(String(a)))} km.`,
      `a^{3} = ${a3.shown} km^{3}.`,
      `t = π × √(${a3.shown} ÷ (3.986 × 10^{5})) = ${approxStd(seconds).shown} s, which is ${approx(hours).shown} hours.`,
    ],
    check: { kind: 'coast', h1, h2, a, seconds: exactSeconds, hours: exactSeconds / 3600 },
  };
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'transfer') return transferQuestion(r);
  if (round === 'period') return periodQuestion(r);
  if (round === 'coast') return coastQuestion(r);
  return speedQuestion(r);
}

export const trajectoryQuiz: LessonQuiz<TrajectoryCheck> = {
  lesson: 'trajectory',
  storageKey: 'stella-quiz-trajectory-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
