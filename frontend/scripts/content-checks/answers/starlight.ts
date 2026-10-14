import type { Entry } from '../answers';

/**
 * Answer checks for the "starlight" mission's lessons (see MISSIONS in src/lib/missions.ts).
 * Same format and rules as the Mission 2 table in ../answers.ts: one entry per numeric
 * answer, worked-example step or numeric claim, each pinned to a verbatim fragment.
 */

const DEG = Math.PI / 180;
const asinDeg = (x: number) => Math.asin(x) / DEG;
const sinDeg = (a: number) => Math.sin(a * DEG);

const L = {
  // prism
  N_AIR: 1.0,
  N_GLASS: 1.5,
  N_WATER: 1.33,
};

const PRISM: Entry[] = [
  {
    lesson: 'prism', where: 'conceptSteps[0] (two thirds)', expectQuestionIncludes: 'in glass $n$ is about 1.5',
    kind: 'claim', claimIncludes: 'about two thirds of its speed in a vacuum',
    verify: () => ({ holds: Math.abs(1 / L.N_GLASS - 2 / 3) < 1e-9, detail: `1 / 1.5 = ${(1 / L.N_GLASS).toFixed(4)}` }),
  },
  {
    lesson: 'prism', where: 'solvedExample.steps[1]', expectQuestionIncludes: 'into glass ($n_2 = 1.5$) at $30^\\circ$ to the normal',
    stated: '$\\sin 30^\\circ = 0.5$', pick: 1, compute: () => sinDeg(30), expected: 0.5, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'prism', where: 'solvedExample.steps[2]', expectQuestionIncludes: 'into glass ($n_2 = 1.5$) at $30^\\circ$ to the normal',
    stated: '= 0.333', compute: () => (L.N_AIR * sinDeg(30)) / L.N_GLASS, expected: 1 / 3, tolerance: 0.0005, unit: '',
  },
  {
    lesson: 'prism', where: 'solvedExample.resultFormula', expectQuestionIncludes: 'into glass ($n_2 = 1.5$) at $30^\\circ$ to the normal',
    note: '"≈ 19.5": ±0.05.',
    compute: () => asinDeg((L.N_AIR * sinDeg(30)) / L.N_GLASS), expected: 19.471, tolerance: 0.05, unit: '°',
  },
  {
    lesson: 'prism', where: 'practiceProblems[0]', kind: 'qualitative', expectQuestionIncludes: 'passes from air into glass',
    expectAnswerIncludes: 'It slows down.',
  },
  {
    lesson: 'prism', where: 'practiceProblems[1]', kind: 'qualitative', expectQuestionIncludes: 'Light enters a glass block at an angle',
    expectAnswerIncludes: 'Towards the normal.',
    verify: () => {
      const r = asinDeg((L.N_AIR * sinDeg(40)) / L.N_GLASS);
      return { holds: r < 40, detail: `40° in air gives ${r.toFixed(1)}° in glass, closer to the normal` };
    },
  },
  {
    lesson: 'prism', where: 'practiceProblems[2]', kind: 'qualitative', expectQuestionIncludes: 'Light leaves a glass block into air at an angle',
    expectAnswerIncludes: 'Away from the normal.',
    verify: () => {
      const r = asinDeg((L.N_GLASS * sinDeg(20)) / L.N_AIR);
      return { holds: r > 20, detail: `20° in glass gives ${r.toFixed(1)}° in air, further from the normal` };
    },
  },
  {
    lesson: 'prism', where: 'practiceProblems[3]', kind: 'qualitative', expectQuestionIncludes: 'meets a glass block along the normal',
    expectAnswerIncludes: 'It does not change direction',
    verify: () => ({ holds: asinDeg((L.N_AIR * sinDeg(0)) / L.N_GLASS) === 0, detail: '0° in air gives 0° in glass' }),
  },
  {
    lesson: 'prism', where: 'practiceProblems[4]', kind: 'qualitative', expectQuestionIncludes: 'Why does a prism split white light into colours?',
    expectAnswerIncludes: 'violet slows the most and bends the most, red the least',
  },
  {
    lesson: 'prism', where: 'practiceProblems[5]', expectQuestionIncludes: 'into water (n = 1.33) at 45° to the normal',
    note: 'sin 45° = 0.7071; ÷ 1.33 = 0.5317; inverse sine 32.12°. "About 32.1": ±0.05.',
    compute: () => asinDeg((L.N_AIR * sinDeg(45)) / L.N_WATER), expected: 32.12, tolerance: 0.05, unit: '°',
  },
];

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const variance = (xs: number[]) => mean(xs.map((x) => (x - mean(xs)) ** 2)); // divide by n, as the lesson does
const sd = (xs: number[]) => Math.sqrt(variance(xs));
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length / 2;
  return s.length % 2 ? s[Math.floor(m)] : (s[m - 1] + s[m]) / 2;
};

const STATS_EXAMPLE = [2, 4, 4, 4, 5, 5, 7, 9];
const TIGHT = [99, 100, 100, 101];
const WIDE = [50, 80, 120, 150];

const STATISTICS: Entry[] = [
  {
    lesson: 'statistics', where: 'conceptSteps[1] (tight mean)', expectQuestionIncludes: 'The readings 99, 100, 100, 101',
    stated: 'both have a mean of 100', compute: () => mean(TIGHT), expected: 100, tolerance: 0, unit: '',
  },
  {
    lesson: 'statistics', where: 'conceptSteps[1] (wide mean)', expectQuestionIncludes: 'the readings 50, 80, 120, 150',
    stated: 'both have a mean of 100', compute: () => mean(WIDE), expected: 100, tolerance: 0, unit: '',
  },
  {
    lesson: 'statistics', where: 'conceptSteps[1] (more spread)', kind: 'claim', expectQuestionIncludes: 'The readings 99, 100, 100, 101',
    claimIncludes: 'the second set is far more spread out',
    verify: () => ({ holds: sd(WIDE) > 10 * sd(TIGHT), detail: `σ = ${sd(TIGHT).toFixed(2)} and ${sd(WIDE).toFixed(1)}` }),
  },
  {
    lesson: 'statistics', where: 'solvedExample.steps[0]', expectQuestionIncludes: 'of the data $2, 4, 4, 4, 5, 5, 7, 9$',
    stated: '\\dfrac{40}{8} = 5', pick: 2, compute: () => mean(STATS_EXAMPLE), expected: 5, tolerance: 0, unit: '',
  },
  {
    lesson: 'statistics', where: 'solvedExample.steps[0] (total)', expectQuestionIncludes: 'of the data $2, 4, 4, 4, 5, 5, 7, 9$',
    stated: '\\dfrac{40}{8} = 5', pick: 0, compute: () => STATS_EXAMPLE.reduce((a, b) => a + b, 0), expected: 40, tolerance: 0, unit: '',
  },
  {
    lesson: 'statistics', where: 'solvedExample.steps[2]', expectQuestionIncludes: 'of the data $2, 4, 4, 4, 5, 5, 7, 9$',
    stated: '= 32', compute: () => STATS_EXAMPLE.reduce((a, x) => a + (x - 5) ** 2, 0), expected: 32, tolerance: 0, unit: '',
  },
  {
    lesson: 'statistics', where: 'solvedExample.steps[3]', expectQuestionIncludes: 'of the data $2, 4, 4, 4, 5, 5, 7, 9$',
    stated: '= 4', compute: () => variance(STATS_EXAMPLE), expected: 4, tolerance: 0, unit: '',
  },
  {
    lesson: 'statistics', where: 'solvedExample.resultFormula (mean)', expectQuestionIncludes: 'of the data $2, 4, 4, 4, 5, 5, 7, 9$',
    stated: '\\bar{x} = 5', compute: () => mean(STATS_EXAMPLE), expected: 5, tolerance: 0, unit: '',
  },
  {
    lesson: 'statistics', where: 'solvedExample.resultFormula (sd)', expectQuestionIncludes: 'of the data $2, 4, 4, 4, 5, 5, 7, 9$',
    stated: '\\sqrt{4} = 2', pick: 1, compute: () => sd(STATS_EXAMPLE), expected: 2, tolerance: 0, unit: '',
  },
  {
    lesson: 'statistics', where: 'practiceProblems[0]', expectQuestionIncludes: 'temperatures of −20, −18, −22, −19 and −21 °C',
    stated: '−20 °C', note: 'The number reader drops the minus sign, so this compares sizes; the stated fragment pins the sign.',
    compute: () => Math.abs(mean([-20, -18, -22, -19, -21])), expected: 20, tolerance: 0, unit: '°C below zero',
  },
  {
    lesson: 'statistics', where: 'practiceProblems[1] (median)', expectQuestionIncludes: 'Find the median and the range of 3, 7, 7, 9, 12, 15',
    stated: 'Median 8', compute: () => median([3, 7, 7, 9, 12, 15]), expected: 8, tolerance: 0, unit: '',
  },
  {
    lesson: 'statistics', where: 'practiceProblems[1] (range)', expectQuestionIncludes: 'Find the median and the range of 3, 7, 7, 9, 12, 15',
    stated: 'range 12', compute: () => 15 - 3, expected: 12, tolerance: 0, unit: '',
  },
  {
    lesson: 'statistics', where: 'practiceProblems[2]', expectQuestionIncludes: 'The mean of five test scores is 80',
    compute: () => 5 * 80 - (75 + 85 + 90 + 70), expected: 80, tolerance: 0, unit: '',
  },
  {
    lesson: 'statistics', where: 'practiceProblems[3] (hint mean)', expectQuestionIncludes: 'Find the standard deviation of 4, 8, 6 and 2',
    note: 'The hint gives the mean.', statedIn: 'question', stated: 'Find the standard deviation of 4, 8, 6 and 2',
    combine: (ns) => mean(ns), compute: () => mean([4, 8, 6, 2]), expected: 5, tolerance: 0, unit: '',
  },
  {
    lesson: 'statistics', where: 'practiceProblems[3]', expectQuestionIncludes: 'Find the standard deviation of 4, 8, 6 and 2',
    stated: '\\approx 2.24', note: 'Squares 1, 9, 1, 9; mean 5; √5 = 2.236.',
    compute: () => sd([4, 8, 6, 2]), expected: 2.2361, tolerance: 0.005, unit: '',
  },
  {
    lesson: 'statistics', where: 'practiceProblems[4] (mean)', expectQuestionIncludes: 'For 10 readings, $\\sum x = 50$ and $\\sum x^2 = 290$',
    stated: 'Mean 5', compute: () => 50 / 10, expected: 5, tolerance: 0, unit: '',
  },
  {
    lesson: 'statistics', where: 'practiceProblems[4] (variance)', expectQuestionIncludes: 'For 10 readings, $\\sum x = 50$ and $\\sum x^2 = 290$',
    stated: '29 − 25 = 4', pick: 2, compute: () => 290 / 10 - (50 / 10) ** 2, expected: 4, tolerance: 0, unit: '',
  },
  {
    lesson: 'statistics', where: 'practiceProblems[4] (sd)', expectQuestionIncludes: 'For 10 readings, $\\sum x = 50$ and $\\sum x^2 = 290$',
    stated: 'standard deviation 2', compute: () => Math.sqrt(290 / 10 - (50 / 10) ** 2), expected: 2, tolerance: 0, unit: '',
  },
  {
    lesson: 'statistics', where: 'practiceProblems[5]', kind: 'qualitative', expectQuestionIncludes: 'Which is more precise?',
    expectAnswerIncludes: 'A: its readings are spread out less.',
    verify: () => ({ holds: 0.1 < 0.5, detail: 'σ_A = 0.1 °C < σ_B = 0.5 °C' }),
  },
  {
    lesson: 'statistics', where: 'textbookContent: sum of squares', expectNotesIncludes: 'For the data in the worked example',
    stated: '$\\sum x^2 = 232$', compute: () => STATS_EXAMPLE.reduce((a, x) => a + x * x, 0), expected: 232, tolerance: 0, unit: '',
  },
  {
    lesson: 'statistics', where: 'textbookContent: summary-statistics variance', expectNotesIncludes: 'For the data in the worked example',
    stated: '\\dfrac{232}{8} - 5^2 = 29 - 25 = 4', pick: 5, compute: () => 232 / 8 - 25, expected: 4, tolerance: 0, unit: '',
  },
  {
    lesson: 'statistics', where: 'textbookContent: 232 / 8', expectNotesIncludes: 'For the data in the worked example',
    stated: '\\dfrac{232}{8} - 5^2 = 29 - 25 = 4', pick: 3, compute: () => 232 / 8, expected: 29, tolerance: 0, unit: '',
  },
];

const faradayEmf = (N: number, dPhi: number, dt: number) => -N * (dPhi / dt);

const ELECTROMAGNETISM: Entry[] = [
  {
    lesson: 'electromagnetism', where: 'solvedExample.steps[0]', expectQuestionIncludes: 'The flux through a 50-turn coil rises from $0.02$ Wb to $0.10$ Wb in $0.4$ s',
    stated: '= 0.08', compute: () => 0.10 - 0.02, expected: 0.08, tolerance: 1e-9, unit: 'Wb',
  },
  {
    lesson: 'electromagnetism', where: 'solvedExample.steps[1]', expectQuestionIncludes: 'The flux through a 50-turn coil rises from $0.02$ Wb to $0.10$ Wb in $0.4$ s',
    stated: '= 0.2', compute: () => 0.08 / 0.4, expected: 0.2, tolerance: 1e-9, unit: 'Wb/s',
  },
  {
    lesson: 'electromagnetism', where: 'solvedExample.steps[3] (size)', expectQuestionIncludes: 'The flux through a 50-turn coil rises from $0.02$ Wb to $0.10$ Wb in $0.4$ s',
    stated: 'Its size is 10 V', compute: () => Math.abs(faradayEmf(50, 0.10 - 0.02, 0.4)), expected: 10, tolerance: 1e-9, unit: 'V',
  },
  {
    lesson: 'electromagnetism', where: 'solvedExample.resultFormula', expectQuestionIncludes: 'The flux through a 50-turn coil rises from $0.02$ Wb to $0.10$ Wb in $0.4$ s',
    note: 'The number reader drops the minus sign; the sign is checked by the claim below.',
    compute: () => Math.abs(faradayEmf(50, 0.10 - 0.02, 0.4)), expected: 10, tolerance: 1e-9, unit: 'V',
  },
  {
    lesson: 'electromagnetism', where: 'solvedExample.resultFormula (sign)', kind: 'claim', expectQuestionIncludes: 'rises from $0.02$ Wb to $0.10$ Wb',
    claimIncludes: '= -10', verify: () => ({ holds: faradayEmf(50, 0.08, 0.4) < 0, detail: `−N ΔΦ/Δt = ${faradayEmf(50, 0.08, 0.4)} V for a rising flux` }),
  },
  {
    lesson: 'electromagnetism', where: 'practiceProblems[0]', expectQuestionIncludes: 'The number of turns on a coil is doubled',
    compute: () => faradayEmf(2, 1, 1) / faradayEmf(1, 1, 1), expected: 2, tolerance: 1e-9, unit: '× emf',
  },
  {
    lesson: 'electromagnetism', where: 'practiceProblems[1]', kind: 'qualitative', expectQuestionIncludes: 'A magnet rests next to a coil, and neither moves',
    expectAnswerIncludes: 'No. The flux through the coil is not changing.',
    verify: () => ({ holds: Math.abs(faradayEmf(100, 0, 1)) === 0, detail: 'ΔΦ = 0 gives emf = 0' }),
  },
  {
    lesson: 'electromagnetism', where: 'practiceProblems[2]', expectQuestionIncludes: 'A magnetic field of 0.2 T passes straight through a loop of area 0.05 m²',
    compute: () => 0.2 * 0.05, expected: 0.01, tolerance: 1e-9, unit: 'Wb',
  },
  {
    lesson: 'electromagnetism', where: 'practiceProblems[3]', expectQuestionIncludes: 'The flux through a 200-turn coil falls from 0.5 Wb to 0.1 Wb in 0.2 s',
    compute: () => Math.abs(faradayEmf(200, 0.1 - 0.5, 0.2)), expected: 400, tolerance: 1e-9, unit: 'V',
  },
  {
    lesson: 'electromagnetism', where: 'practiceProblems[4]', expectQuestionIncludes: 'A 100-turn coil of area 0.02 m² sits in a field that rises from 0 to 0.3 T in 0.1 s',
    compute: () => Math.abs(faradayEmf(100, 0.02 * (0.3 - 0), 0.1)), expected: 6, tolerance: 1e-9, unit: 'V',
  },
  {
    lesson: 'electromagnetism', where: 'practiceProblems[4] (flux change)', expectQuestionIncludes: 'A 100-turn coil of area 0.02 m² sits in a field that rises from 0 to 0.3 T in 0.1 s',
    stated: '$100 \\times 0.006 \\div 0.1$', pick: 1, compute: () => 0.02 * 0.3, expected: 0.006, tolerance: 1e-12, unit: 'Wb',
  },
  {
    lesson: 'electromagnetism', where: 'practiceProblems[5]', kind: 'qualitative', expectQuestionIncludes: 'The north pole of a magnet is pushed into a coil',
    expectAnswerIncludes: 'A north pole, which repels the magnet',
  },
  {
    lesson: 'electromagnetism', where: 'textbookContent: tether emf', expectNotesIncludes: 'In 1996 the Space Shuttle unreeled a conducting cable about 20 km long',
    kind: 'claim', claimIncludes: 'an emf of about 3,500 volts',
    note: 'Measured on STS-75 (TSS-1R), February 1996.',
    verify: () => {
      // emf = B v L for a conductor moving across a field. Orbital speed about 7.7 km/s, about 20 km of cable,
      // and the part of Earth's field across the motion at that height about 2 to 3 × 10^-5 T.
      const lo = 2e-5 * 7.7e3 * 2.0e4;
      const hi = 3e-5 * 7.7e3 * 2.0e4;
      return { holds: lo <= 3500 && 3500 <= hi, detail: `B v L gives ${Math.round(lo)} to ${Math.round(hi)} V` };
    },
  },
];

const Q = {
  H: 6.63e-34, // J s, the value the quantum lesson uses everywhere
  EV: 1.60e-19, // J per eV, as the lesson gives it
};

const QUANTUM: Entry[] = [
  {
    lesson: 'quantum', where: 'solvedExample.steps[1]', expectQuestionIncludes: 'frequency $f = 6.0 \\times 10^{14}$ Hz',
    stated: '= 3.98 \\times 10^{-19}', note: '6.63 × 6.0 = 39.78, so 3.978e-19 J; 3 s.f.',
    compute: () => Q.H * 6.0e14, expected: 3.978e-19, relTolerance: 0.002, unit: 'J',
  },
  {
    lesson: 'quantum', where: 'solvedExample.resultFormula (J)', expectQuestionIncludes: 'frequency $f = 6.0 \\times 10^{14}$ Hz',
    stated: 'E \\approx 3.98 \\times 10^{-19}', compute: () => Q.H * 6.0e14, expected: 3.978e-19, relTolerance: 0.002, unit: 'J',
  },
  {
    lesson: 'quantum', where: 'solvedExample.resultFormula (eV)', expectQuestionIncludes: 'frequency $f = 6.0 \\times 10^{14}$ Hz',
    stated: '\\approx 2.5 \\text{ eV}', note: '3.978e-19 / 1.60e-19 = 2.486; "2.5": ±0.05. ("Green": c / f = 500 nm, inside the 495 to 570 nm green band.)',
    compute: () => (Q.H * 6.0e14) / Q.EV, expected: 2.486, tolerance: 0.05, unit: 'eV',
  },
  {
    lesson: 'quantum', where: 'practiceProblems[0]', kind: 'qualitative', expectQuestionIncludes: 'twice the frequency of a green photon',
    expectAnswerIncludes: 'twice the energy',
    verify: () => ({ holds: Math.abs((Q.H * 2) / (Q.H * 1) - 2) < 1e-12, detail: 'E ∝ f' }),
  },
  {
    lesson: 'quantum', where: 'practiceProblems[1]', expectQuestionIncludes: 'Radio waves have frequencies around $10^8$ Hz and X-rays around $10^{18}$ Hz',
    stated: '$10^{10}$', compute: () => (Q.H * 1e18) / (Q.H * 1e8), expected: 1e10, relTolerance: 1e-9, unit: '× energy',
  },
  {
    lesson: 'quantum', where: 'practiceProblems[2]', expectQuestionIncludes: 'Find the energy of a photon of frequency $5.0 \\times 10^{14}$ Hz',
    note: '6.63e-34 × 5.0e14 = 3.315e-19; "about 3.3": 2 s.f.', compute: () => Q.H * 5.0e14, expected: 3.315e-19, relTolerance: 0.02, unit: 'J',
  },
  {
    lesson: 'quantum', where: 'practiceProblems[3]', expectQuestionIncludes: 'photons of 3.0 eV falls on a metal whose work function is 2.3 eV',
    compute: () => 3.0 - 2.3, expected: 0.7, tolerance: 1e-9, unit: 'eV',
  },
  {
    lesson: 'quantum', where: 'practiceProblems[4]', kind: 'qualitative', expectQuestionIncludes: 'Bright red light releases no electrons',
    expectAnswerIncludes: 'Each red photon has too little energy',
  },
  {
    lesson: 'quantum', where: 'practiceProblems[5]', expectQuestionIncludes: 'An electron has momentum $1.0 \\times 10^{-24}$ kg m/s',
    stated: 'About $6.6 \\times 10^{-10}$ m', note: '6.63e-34 / 1.0e-24 = 6.63e-10 m.',
    compute: () => Q.H / 1.0e-24, expected: 6.63e-10, relTolerance: 0.01, unit: 'm',
  },
  {
    lesson: 'quantum', where: 'practiceProblems[5] (atom spacing)', kind: 'claim', expectQuestionIncludes: 'An electron has momentum $1.0 \\times 10^{-24}$ kg m/s',
    claimIncludes: 'similar to the spacing of atoms in a crystal',
    note: 'Atom spacings in crystals are roughly 1e-10 to 5e-10 m (graphite layers 3.35e-10 m).',
    verify: () => {
      const lambda = Q.H / 1.0e-24;
      return { holds: lambda > 1e-10 && lambda < 1e-9, detail: `λ = ${lambda.toExponential(2)} m, same order as 1e-10 m` };
    },
  },
];

export const ENTRIES: Entry[] = [...PRISM, ...STATISTICS, ...ELECTROMAGNETISM, ...QUANTUM];
