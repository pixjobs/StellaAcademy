import type { Entry } from '../answers';

/**
 * Answer checks for the "navigate" mission's lessons (see MISSIONS in src/lib/missions.ts).
 * Same format and rules as the Mission 2 table in ../answers.ts: one entry per numeric
 * answer, worked-example step or numeric claim, each pinned to a verbatim fragment.
 */

const DEG = Math.PI / 180;
const sinD = (x: number) => Math.sin(x * DEG);
const cosD = (x: number) => Math.cos(x * DEG);
const tanD = (x: number) => Math.tan(x * DEG);
const R_EARTH_KM = 6371; // mean radius, used only to check the "treat the ground as flat" approximation
const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol;
/** A 2 × 1 column vector as the lessons write it in LaTeX. */
const col = (top: number, bottom: number) => `\\begin{pmatrix} ${top} \\\\ ${bottom} \\end{pmatrix}`;

export const ENTRIES: Entry[] = [
  // ======================================================================================== trigonometry
  {
    lesson: 'trigonometry', where: 'solvedExample.steps[2]', expectQuestionIncludes: 'straight-line distance to a climbing rocket as $12$ km',
    stated: '12 \\times 0.4226', pick: 1, note: 'sin 25° to 4 d.p.',
    compute: () => sinD(25), expected: 0.42262, tolerance: 0.00005, unit: '',
  },
  {
    lesson: 'trigonometry', where: 'solvedExample.resultFormula', expectQuestionIncludes: 'straight-line distance to a climbing rocket as $12$ km',
    note: '12 sin 25°. Flat ground is fine here: the ground 10.9 km away drops only about 9 m below the horizontal.',
    compute: () => 12 * sinD(25), expected: 5.0714, tolerance: 0.005, unit: 'km',
  },
  {
    lesson: 'trigonometry', where: 'solvedExample.resultFormula (flat ground)', kind: 'qualitative',
    expectQuestionIncludes: 'treat the ground as flat', expectAnswerIncludes: '5.07',
    verify: () => {
      const across = 12 * cosD(25);
      const drop = (across * across) / (2 * R_EARTH_KM);
      return { holds: drop / (12 * sinD(25)) < 0.01, detail: `Earth's curve drops ${(drop * 1000).toFixed(0)} m over ${across.toFixed(1)} km, under 1% of the height` };
    },
  },
  {
    lesson: 'trigonometry', where: 'practiceProblems[0]', expectQuestionIncludes: 'The hypotenuse of a right-angled triangle is 10 m and one angle is 30°',
    compute: () => 10 * 0.5, expected: 5, tolerance: 1e-9, unit: 'm',
  },
  {
    lesson: 'trigonometry', where: 'practiceProblems[1]', expectQuestionIncludes: 'A 5 m ladder leans against a wall and makes an angle of 60° with the ground',
    compute: () => 5 * cosD(60), expected: 2.5, tolerance: 1e-9, unit: 'm',
  },
  {
    lesson: 'trigonometry', where: 'practiceProblems[2]', expectQuestionIncludes: 'You stand 4 km from a launch pad',
    compute: () => 4 * tanD(45), expected: 4, tolerance: 1e-9, unit: 'km',
  },
  {
    lesson: 'trigonometry', where: 'practiceProblems[3]', expectQuestionIncludes: 'The two shorter sides of a right-angled triangle are 6 cm and 8 cm',
    compute: () => Math.hypot(6, 8), expected: 10, tolerance: 1e-9, unit: 'cm',
  },
  {
    lesson: 'trigonometry', where: 'practiceProblems[4]', expectQuestionIncludes: 'the side opposite an angle is 5 cm and the hypotenuse is 10 cm',
    compute: () => Math.asin(5 / 10) / DEG, expected: 30, tolerance: 1e-9, unit: '°',
  },
  {
    lesson: 'trigonometry', where: 'practiceProblems[5]', expectQuestionIncludes: 'A star is 1.414 light-years away',
    note: '"About 1.0": ±0.05.',
    compute: () => 1.414 * sinD(45), expected: 0.99985, tolerance: 0.05, unit: 'light-years',
  },
  {
    lesson: 'trigonometry', where: 'textbookContent: finding an angle, ratio', expectNotesIncludes: 'the opposite side is 3 cm and the adjacent side is 4 cm',
    stated: '$\\tan\\theta = \\dfrac{3}{4} = 0.75$', pick: 2, compute: () => 3 / 4, expected: 0.75, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'trigonometry', where: 'textbookContent: finding an angle, angle', expectNotesIncludes: 'the opposite side is 3 cm and the adjacent side is 4 cm',
    stated: '\\approx 36.9°', compute: () => Math.atan(0.75) / DEG, expected: 36.87, tolerance: 0.05, unit: '°',
  },
  {
    lesson: 'trigonometry', where: 'textbookContent: Pythagoras, c squared', expectNotesIncludes: 'the shorter sides are 3 cm and 4 cm',
    stated: '$c^2 = 9 + 16 = 25$', pick: 2, compute: () => 3 ** 2 + 4 ** 2, expected: 25, tolerance: 0, unit: 'cm²',
  },
  {
    lesson: 'trigonometry', where: 'textbookContent: Pythagoras, c', expectNotesIncludes: 'the shorter sides are 3 cm and 4 cm',
    stated: '$c = 5$ cm', compute: () => Math.hypot(3, 4), expected: 5, tolerance: 1e-9, unit: 'cm',
  },
  {
    lesson: 'trigonometry', where: 'textbookContent: exact values', kind: 'claim', expectNotesIncludes: '### Exact values worth knowing',
    claimIncludes: '| 30° | $\\dfrac{1}{2}$ | $\\dfrac{\\sqrt{3}}{2}$ | $\\dfrac{1}{\\sqrt{3}}$ |',
    verify: () => {
      const r3 = Math.sqrt(3), r2 = Math.sqrt(2);
      const ok =
        near(sinD(0), 0) && near(cosD(0), 1) && near(tanD(0), 0) &&
        near(sinD(30), 1 / 2) && near(cosD(30), r3 / 2) && near(tanD(30), 1 / r3) &&
        near(sinD(45), r2 / 2) && near(cosD(45), r2 / 2) && near(tanD(45), 1) &&
        near(sinD(60), r3 / 2) && near(cosD(60), 1 / 2) && near(tanD(60), r3) &&
        near(sinD(90), 1) && near(cosD(90), 0);
      return { holds: ok, detail: 'every sin, cos and tan in the table matches Math.sin/cos/tan (tan 90° is undefined)' };
    },
  },

  // ======================================================================================== vectors
  {
    lesson: 'vectors', where: 'solvedExample.steps[1] (3000 squared)', expectQuestionIncludes: 'horizontal velocity ($v_x$) of $3000$ m/s',
    stated: '$3000^2 = 9{,}000{,}000$', pick: 1, compute: () => 3000 ** 2, expected: 9e6, tolerance: 0, unit: '(m/s)²',
  },
  {
    lesson: 'vectors', where: 'solvedExample.steps[1] (4000 squared)', expectQuestionIncludes: 'horizontal velocity ($v_x$) of $3000$ m/s',
    stated: '$4000^2 = 16{,}000{,}000$', pick: 1, compute: () => 4000 ** 2, expected: 16e6, tolerance: 0, unit: '(m/s)²',
  },
  {
    lesson: 'vectors', where: 'solvedExample.steps[2]', expectQuestionIncludes: 'horizontal velocity ($v_x$) of $3000$ m/s',
    stated: '= 25{,}000{,}000', compute: () => 3000 ** 2 + 4000 ** 2, expected: 25e6, tolerance: 0, unit: '(m/s)²',
  },
  {
    lesson: 'vectors', where: 'solvedExample.steps[3]', expectQuestionIncludes: 'horizontal velocity ($v_x$) of $3000$ m/s',
    stated: '= 5000$ m/s', compute: () => Math.hypot(3000, 4000), expected: 5000, tolerance: 1e-9, unit: 'm/s',
  },
  {
    lesson: 'vectors', where: 'solvedExample.steps[4]', expectQuestionIncludes: 'horizontal velocity ($v_x$) of $3000$ m/s',
    stated: '\\approx 53.1°', compute: () => Math.atan2(4000, 3000) / DEG, expected: 53.13, tolerance: 0.05, unit: '°',
  },
  {
    lesson: 'vectors', where: 'solvedExample.resultFormula (speed)', expectQuestionIncludes: 'horizontal velocity ($v_x$) of $3000$ m/s',
    stated: '5000 \\text{ m/s', compute: () => Math.hypot(3000, 4000), expected: 5000, tolerance: 1e-9, unit: 'm/s',
  },
  {
    lesson: 'vectors', where: 'solvedExample.resultFormula (angle)', expectQuestionIncludes: 'horizontal velocity ($v_x$) of $3000$ m/s',
    stated: '53.1°', compute: () => Math.atan2(4000, 3000) / DEG, expected: 53.13, tolerance: 0.05, unit: '°',
  },
  ...([
    [0, 'Work out $\\mathbf{a} + \\mathbf{b}$', 3 + 1, 2 + -4, 'a + b'],
    [1, 'work out $\\mathbf{a} - \\mathbf{b}$', 3 - 1, 2 - -4, 'a − b'],
    [2, 'Work out $3\\mathbf{a}$', 3 * 3, 3 * 2, '3a'],
  ] as const).map(([i, q, top, bottom, label]): Entry => ({
    // The number reader drops minus signs, so the column vector is checked as text built from the computed values.
    lesson: 'vectors', where: `practiceProblems[${i}] (${label})`, kind: 'qualitative', expectQuestionIncludes: q,
    expectAnswerIncludes: col(top, bottom),
    verify: () => ({ holds: true, detail: `answer is the computed column ${col(top, bottom)}` }),
  })),
  {
    lesson: 'vectors', where: 'practiceProblems[3]', expectQuestionIncludes: 'A probe moves at 6 km/s in the x direction and 8 km/s in the y direction',
    compute: () => Math.hypot(6, 8), expected: 10, tolerance: 1e-9, unit: 'km/s',
  },
  {
    lesson: 'vectors', where: 'practiceProblems[4]', expectQuestionIncludes: 'Find the magnitude of $\\begin{pmatrix} -5 \\\\ 12 \\end{pmatrix}$',
    compute: () => Math.hypot(-5, 12), expected: 13, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'vectors', where: 'practiceProblems[5] (speed)', expectQuestionIncludes: 'A spacecraft moves at 4 km/s east and 3 km/s north',
    stated: '5 km/s', compute: () => Math.hypot(4, 3), expected: 5, tolerance: 1e-9, unit: 'km/s',
  },
  {
    lesson: 'vectors', where: 'practiceProblems[5] (angle)', expectQuestionIncludes: 'A spacecraft moves at 4 km/s east and 3 km/s north',
    stated: 'about 36.9° north of east', compute: () => Math.atan2(3, 4) / DEG, expected: 36.87, tolerance: 0.05, unit: '°',
  },
  {
    lesson: 'vectors', where: 'textbookContent: adding', kind: 'qualitative', expectNotesIncludes: 'In columns, add the matching numbers',
    expectAnswerIncludes: `${col(3, 2)} + ${col(2, -1)} = ${col(3 + 2, 2 + -1)}`,
    verify: () => ({ holds: true, detail: '(3, 2) + (2, −1) = (5, 1), a different sum from the practice question' }),
  },
  {
    lesson: 'vectors', where: 'textbookContent: sideways thrust', kind: 'claim', expectNotesIncludes: '### Steering with thrusters',
    claimIncludes: 'Firing sideways mostly changes its direction',
    verify: () => {
      // A 7.7 km/s spacecraft given 0.1 km/s at right angles to its motion.
      const v = 7.7, dv = 0.1;
      const turn = Math.atan2(dv, v) / DEG;
      const gain = Math.hypot(v, dv) - v;
      return { holds: gain < dv / 10, detail: `0.1 km/s sideways at 7.7 km/s turns it ${turn.toFixed(2)}° and adds only ${(gain * 1000).toFixed(2)} m/s of speed` };
    },
  },

  // ======================================================================================== angles
  {
    lesson: 'angles', where: 'solvedExample.steps[0]', expectQuestionIncludes: 'A sector has radius $r = 4$ m and angle $\\theta = \\dfrac{\\pi}{2}$',
    stated: '= 2\\pi$ m', note: 'The number before π.', compute: () => (4 * (Math.PI / 2)) / Math.PI, expected: 2, tolerance: 1e-9, unit: 'π m',
  },
  {
    lesson: 'angles', where: 'solvedExample.steps[1]', expectQuestionIncludes: 'A sector has radius $r = 4$ m and angle $\\theta = \\dfrac{\\pi}{2}$',
    stated: '\\approx 6.28', compute: () => 4 * (Math.PI / 2), expected: 6.2832, tolerance: 0.005, unit: 'm',
  },
  {
    lesson: 'angles', where: 'solvedExample.steps[2] (r squared)', expectQuestionIncludes: 'A sector has radius $r = 4$ m and angle $\\theta = \\dfrac{\\pi}{2}$',
    stated: '\\dfrac{1}{2} \\times 16 \\times', pick: 2, compute: () => 4 ** 2, expected: 16, tolerance: 0, unit: 'm²',
  },
  {
    lesson: 'angles', where: 'solvedExample.steps[2] (area)', expectQuestionIncludes: 'A sector has radius $r = 4$ m and angle $\\theta = \\dfrac{\\pi}{2}$',
    stated: '= 4\\pi$ m²', note: 'The number before π.', compute: () => (0.5 * 4 ** 2 * (Math.PI / 2)) / Math.PI, expected: 4, tolerance: 1e-9, unit: 'π m²',
  },
  {
    lesson: 'angles', where: 'solvedExample.steps[3]', expectQuestionIncludes: 'A sector has radius $r = 4$ m and angle $\\theta = \\dfrac{\\pi}{2}$',
    stated: '\\approx 12.6', compute: () => 0.5 * 4 ** 2 * (Math.PI / 2), expected: 12.566, tolerance: 0.05, unit: 'm²',
  },
  {
    lesson: 'angles', where: 'solvedExample.resultFormula (arc)', expectQuestionIncludes: 'A sector has radius $r = 4$ m and angle $\\theta = \\dfrac{\\pi}{2}$',
    stated: '\\approx 6.28', compute: () => 4 * (Math.PI / 2), expected: 6.2832, tolerance: 0.005, unit: 'm',
  },
  {
    lesson: 'angles', where: 'solvedExample.resultFormula (area)', expectQuestionIncludes: 'A sector has radius $r = 4$ m and angle $\\theta = \\dfrac{\\pi}{2}$',
    stated: '\\approx 12.6', compute: () => 0.5 * 4 ** 2 * (Math.PI / 2), expected: 12.566, tolerance: 0.05, unit: 'm²',
  },
  {
    lesson: 'angles', where: 'practiceProblems[0]', kind: 'qualitative', expectQuestionIncludes: 'Convert 180° to radians',
    expectAnswerIncludes: '$\\pi$ radians',
    verify: () => ({ holds: near(180 * DEG, Math.PI), detail: '180 × π/180 = π' }),
  },
  {
    lesson: 'angles', where: 'practiceProblems[1]', kind: 'qualitative', expectQuestionIncludes: 'Convert 60° to radians',
    expectAnswerIncludes: '$\\frac{\\pi}{3}$ radians',
    verify: () => ({ holds: near(60 * DEG, Math.PI / 3), detail: '60 × π/180 = π/3' }),
  },
  {
    lesson: 'angles', where: 'practiceProblems[2]', expectQuestionIncludes: 'An arc has length 10 cm on a circle of radius 5 cm',
    compute: () => 10 / 5, expected: 2, tolerance: 1e-9, unit: 'rad',
  },
  {
    lesson: 'angles', where: 'practiceProblems[3] (exact)', expectQuestionIncludes: 'area of a sector of radius 6 cm with an angle of $\\frac{\\pi}{3}$',
    stated: '$6\\pi', note: 'The number before π.', compute: () => (0.5 * 36 * (Math.PI / 3)) / Math.PI, expected: 6, tolerance: 1e-9, unit: 'π cm²',
  },
  {
    lesson: 'angles', where: 'practiceProblems[3] (decimal)', expectQuestionIncludes: 'area of a sector of radius 6 cm with an angle of $\\frac{\\pi}{3}$',
    stated: '\\approx 18.8', compute: () => 0.5 * 36 * (Math.PI / 3), expected: 18.850, tolerance: 0.05, unit: 'cm²',
  },
  {
    lesson: 'angles', where: 'practiceProblems[4] (exact)', expectQuestionIncludes: 'arc of angle 72° on a circle of radius 10 cm',
    stated: '$4\\pi', note: 'The number before π.', compute: () => ((72 / 360) * 2 * Math.PI * 10) / Math.PI, expected: 4, tolerance: 1e-9, unit: 'π cm',
  },
  {
    lesson: 'angles', where: 'practiceProblems[4] (decimal)', expectQuestionIncludes: 'arc of angle 72° on a circle of radius 10 cm',
    stated: '\\approx 12.6', compute: () => (72 / 360) * 2 * Math.PI * 10, expected: 12.566, tolerance: 0.05, unit: 'cm',
  },
  {
    lesson: 'angles', where: 'practiceProblems[5] (worked)', expectQuestionIncludes: 'A geostationary satellite orbits 42,164 km from the centre of the Earth',
    stated: '\\approx 11{,}040', compute: () => 42164 * (Math.PI / 12), expected: 11038.6, tolerance: 5, unit: 'km',
  },
  {
    lesson: 'angles', where: 'practiceProblems[5] (rounded)', expectQuestionIncludes: 'A geostationary satellite orbits 42,164 km from the centre of the Earth',
    stated: 'About 11,000 km', note: 'Also true with the sidereal day (23.93 h): 11,069 km.',
    compute: () => (42164 * 2 * Math.PI) / 23.9345, expected: 11068.6, tolerance: 500, unit: 'km',
  },
  {
    lesson: 'angles', where: 'textbookContent: degrees to radians', expectNotesIncludes: 'Degrees to radians: multiply by',
    stated: 'So $90° = \\dfrac{\\pi}{2}$', pick: 1, note: 'The denominator under π.', compute: () => Math.PI / (90 * DEG), expected: 2, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'angles', where: 'textbookContent: radians to degrees', expectNotesIncludes: 'Radians to degrees: multiply by',
    stated: 'So $2 \\text{ rad} \\approx 114.6°$', pick: 1, compute: () => 2 / DEG, expected: 114.59, tolerance: 0.05, unit: '°',
  },
  {
    lesson: 'angles', where: 'textbookContent: sidereal day', kind: 'claim', expectNotesIncludes: '### Satellites going round',
    claimIncludes: 'strictly 23 hours 56 minutes',
    verify: () => {
      const sidereal = 86164.1; // s
      const h = Math.floor(sidereal / 3600), m = Math.round((sidereal - h * 3600) / 60);
      return { holds: h === 23 && m === 56, detail: `Earth spins once in ${sidereal} s = ${h} h ${m} min` };
    },
  },
];
