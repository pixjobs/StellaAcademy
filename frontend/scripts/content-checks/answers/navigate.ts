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
const K_DRAG = 2e-6; // per metre, the diffeq lesson's drag constant
/** A 2 × 1 column vector as the lessons write it in LaTeX. */
const col = (top: number, bottom: number) => `\\begin{pmatrix} ${top} \\\\ ${bottom} \\end{pmatrix}`;
/** Central-difference derivative, and Simpson's rule, as independent checks on hand differentiation and integration. */
const numDeriv = (f: (x: number) => number, x: number, h = 1e-4) => (f(x + h) - f(x - h)) / (2 * h);
const integrate = (f: (x: number) => number, a: number, b: number, n = 1000) => {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
};
/** 2 × 2 matrices as [a, b, c, d] for (a b; c d), and 2 × 1 vectors. */
type M2 = [number, number, number, number];
type V2 = [number, number];
const pm = ([a, b, c, d]: M2) => `\\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}`;
const add = (p: M2, q: M2): M2 => [p[0] + q[0], p[1] + q[1], p[2] + q[2], p[3] + q[3]];
const scale = (k: number, p: M2): M2 => [k * p[0], k * p[1], k * p[2], k * p[3]];
const mul = (p: M2, q: M2): M2 => [
  p[0] * q[0] + p[1] * q[2], p[0] * q[1] + p[1] * q[3],
  p[2] * q[0] + p[3] * q[2], p[2] * q[1] + p[3] * q[3],
];
const mulV = (p: M2, v: V2): V2 => [p[0] * v[0] + p[1] * v[1], p[2] * v[0] + p[3] * v[1]];

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
    lesson: 'trigonometry', where: 'practiceProblems[5]', expectQuestionIncludes: 'A star is 14.14 light-years away',
    note: '"About 10": ±0.5.',
    compute: () => 14.14 * sinD(45), expected: 9.9985, tolerance: 0.5, unit: 'light-years',
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

  // ======================================================================================== matrices
  {
    lesson: 'matrices', where: 'solvedExample.steps[0] (cos 30)', expectQuestionIncludes: 'by $30^\\circ$ anticlockwise about the origin',
    stated: '\\begin{pmatrix} 0.866 & -0.5', pick: 0, compute: () => cosD(30), expected: 0.86603, tolerance: 0.0005, unit: '',
  },
  {
    lesson: 'matrices', where: 'solvedExample.steps[0] (sin 30)', expectQuestionIncludes: 'by $30^\\circ$ anticlockwise about the origin',
    stated: '\\\\ 0.5 & 0.866 \\end{pmatrix}', pick: 0, compute: () => sinD(30), expected: 0.5, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'matrices', where: 'solvedExample.steps[1]', expectQuestionIncludes: 'by $30^\\circ$ anticlockwise about the origin',
    stated: '= 1.732', compute: () => cosD(30) * 2 - sinD(30) * 0, expected: 1.7321, tolerance: 0.0005, unit: '',
  },
  {
    lesson: 'matrices', where: 'solvedExample.steps[2]', expectQuestionIncludes: 'by $30^\\circ$ anticlockwise about the origin',
    stated: '= 1$', compute: () => sinD(30) * 2 + cosD(30) * 0, expected: 1, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'matrices', where: 'solvedExample.steps[3]', expectQuestionIncludes: 'by $30^\\circ$ anticlockwise about the origin',
    stated: '= 2$, the same', note: 'Length after the rotation, from the rounded 1.732.',
    compute: () => Math.hypot(1.732, 1), expected: 2.0, tolerance: 0.001, unit: '',
  },
  {
    lesson: 'matrices', where: 'solvedExample.resultFormula (x)', expectQuestionIncludes: 'by $30^\\circ$ anticlockwise about the origin',
    stated: '\\begin{pmatrix} 1.73', compute: () => 2 * cosD(30), expected: 1.7321, tolerance: 0.005, unit: '',
  },
  {
    lesson: 'matrices', where: 'solvedExample.resultFormula (y)', expectQuestionIncludes: 'by $30^\\circ$ anticlockwise about the origin',
    stated: '\\\\ 1 \\end{pmatrix}', compute: () => 2 * sinD(30), expected: 1, tolerance: 1e-9, unit: '',
  },
  // Matrix answers are checked as text built from the computed entries (the number reader drops minus signs).
  ...((): Entry[] => {
    const A: M2 = [1, 2, 3, 4], B: M2 = [0, 1, 1, 0];
    const R90: M2 = [0, -1, 1, 0], MX: M2 = [1, 0, 0, -1], YX: M2 = [0, 1, 1, 0], CW90: M2 = [0, 1, -1, 0];
    const rm = mul(R90, MX);
    const mr = mul(MX, R90);
    const cw = mulV(CW90, [0, 1]);
    return [
      {
        lesson: 'matrices', where: 'practiceProblems[0]', kind: 'qualitative', expectQuestionIncludes: 'Find $\\mathbf{A} + \\mathbf{B}$',
        expectAnswerIncludes: pm(add(A, B)), verify: () => ({ holds: true, detail: `A + B = (${add(A, B).join(', ')})` }),
      },
      {
        lesson: 'matrices', where: 'practiceProblems[1]', kind: 'qualitative', expectQuestionIncludes: 'Find $2\\mathbf{A}$',
        expectAnswerIncludes: pm(scale(2, A)), verify: () => ({ holds: true, detail: `2A = (${scale(2, A).join(', ')})` }),
      },
      {
        lesson: 'matrices', where: 'practiceProblems[2]', kind: 'qualitative', expectQuestionIncludes: 'Find $\\mathbf{AB}$',
        expectAnswerIncludes: pm(mul(A, B)), verify: () => ({ holds: true, detail: `AB = (${mul(A, B).join(', ')})` }),
      },
      {
        lesson: 'matrices', where: 'practiceProblems[3]', kind: 'qualitative', expectQuestionIncludes: 'multiplying a vector by the identity matrix',
        expectAnswerIncludes: 'the vector is unchanged',
        verify: () => {
          const out = mulV([1, 0, 0, 1], [3, -7]);
          return { holds: out[0] === 3 && out[1] === -7, detail: 'I × (3, −7) = (3, −7)' };
        },
      },
      {
        lesson: 'matrices', where: 'practiceProblems[4]', kind: 'qualitative', expectQuestionIncludes: 'by 90° clockwise',
        expectAnswerIncludes: col(cw[0], cw[1]),
        verify: () => {
          const f = mulV([cosD(-90), -sinD(-90), sinD(-90), cosD(-90)], [0, 1]);
          return { holds: near(f[0], cw[0]) && near(f[1], cw[1]), detail: `the hint's matrix is R(−90°); (0, 1) goes to (${cw.join(', ')})` };
        },
      },
      {
        lesson: 'matrices', where: 'practiceProblems[5] (matrix)', kind: 'qualitative', expectQuestionIncludes: 'a reflection in the x-axis followed by a rotation of 90° anticlockwise',
        expectAnswerIncludes: pm(rm), verify: () => ({ holds: true, detail: `RM = (${rm.join(', ')})` }),
      },
      {
        lesson: 'matrices', where: 'practiceProblems[5] (name)', kind: 'qualitative', expectQuestionIncludes: 'a reflection in the x-axis followed by a rotation of 90° anticlockwise',
        expectAnswerIncludes: 'a reflection in the line $y = x$',
        verify: () => ({ holds: rm.every((x, i) => x === YX[i]), detail: 'RM is the matrix that swaps x and y' }),
      },
      {
        lesson: 'matrices', where: 'textbookContent: adding', kind: 'qualitative', expectNotesIncludes: 'combining the numbers in matching positions',
        expectAnswerIncludes: `${pm([2, 1, 0, 3])} + ${pm([1, -1, 4, 2])} = ${pm(add([2, 1, 0, 3], [1, -1, 4, 2]))}`,
        verify: () => ({ holds: true, detail: 'a different sum from practice question 1' }),
      },
      {
        lesson: 'matrices', where: 'textbookContent: scalar', kind: 'qualitative', expectNotesIncludes: 'multiply every entry',
        expectAnswerIncludes: `$3${pm([1, 0, 2, -1])} = ${pm(scale(3, [1, 0, 2, -1]))}$`,
        verify: () => ({ holds: true, detail: 'a different product from practice question 2' }),
      },
      {
        lesson: 'matrices', where: 'textbookContent: rotate then reflect', kind: 'qualitative', expectNotesIncludes: 'Rotating 90° anticlockwise and then reflecting in the x-axis gives',
        expectAnswerIncludes: `${pm(MX)}${pm(R90)} = ${pm(mr)}`,
        verify: () => ({ holds: true, detail: `MR = (${mr.join(', ')})` }),
      },
      {
        lesson: 'matrices', where: 'textbookContent: rotate then reflect (name)', kind: 'qualitative', expectNotesIncludes: 'Rotating 90° anticlockwise and then reflecting in the x-axis gives',
        expectAnswerIncludes: 'which is a reflection in the line $y = -x$',
        verify: () => {
          const on = mulV(mr, [1, -1]), off = mulV(mr, [1, 1]);
          return { holds: on[0] === 1 && on[1] === -1 && off[0] === -1 && off[1] === -1, detail: 'points on y = −x stay put; (1, 1) goes to its mirror image (−1, −1)' };
        },
      },
      {
        lesson: 'matrices', where: 'textbookContent: order matters', kind: 'claim', expectNotesIncludes: 'Order matters',
        claimIncludes: 'the other way round and you get a different matrix',
        verify: () => ({ holds: !rm.every((x, i) => x === mr[i]), detail: `RM = (${rm.join(', ')}), MR = (${mr.join(', ')})` }),
      },
    ];
  })(),

  // ======================================================================================== calculus
  {
    lesson: 'calculus', where: 'solvedExample.steps[1] (5t² term)', expectQuestionIncludes: '$s(t) = 5t^2 + 10t$ metres',
    stated: '$5t^2$ gives $10t$', pick: 1, note: 'd/dt of 5t² is 2 × 5 t.', compute: () => 2 * 5, expected: 10, tolerance: 0, unit: '(coefficient of t)',
  },
  {
    lesson: 'calculus', where: 'solvedExample.steps[1] (10t term)', expectQuestionIncludes: '$s(t) = 5t^2 + 10t$ metres',
    stated: '$10t$ gives $10$', pick: 1, compute: () => 1 * 10, expected: 10, tolerance: 0, unit: 'm/s',
  },
  {
    lesson: 'calculus', where: 'solvedExample.steps[2]', expectQuestionIncludes: '$s(t) = 5t^2 + 10t$ metres',
    stated: '= 40$', compute: () => numDeriv((t) => 5 * t ** 2 + 10 * t, 3), expected: 40, tolerance: 1e-4, unit: 'm/s',
  },
  {
    lesson: 'calculus', where: 'solvedExample.resultFormula', expectQuestionIncludes: '$s(t) = 5t^2 + 10t$ metres',
    stated: '= 40', compute: () => numDeriv((t) => 5 * t ** 2 + 10 * t, 3), expected: 40, tolerance: 1e-4, unit: 'm/s',
  },
  {
    lesson: 'calculus', where: 'practiceProblems[0]', expectQuestionIncludes: 'If position is $s = 4t^3$, find the velocity $v$',
    stated: '$v = 12t^2$', note: 'Coefficient of t²; checked numerically at t = 2 (48 / 4).',
    compute: () => numDeriv((t) => 4 * t ** 3, 2) / 2 ** 2, expected: 12, tolerance: 1e-4, unit: '',
  },
  {
    lesson: 'calculus', where: 'practiceProblems[1]', expectQuestionIncludes: 'If velocity is $v = 20t$, what is the acceleration?',
    compute: () => numDeriv((t) => 20 * t, 5), expected: 20, tolerance: 1e-4, unit: 'm/s²',
  },
  {
    lesson: 'calculus', where: 'practiceProblems[2]', expectQuestionIncludes: "A probe's position is $s = 5t^2 + 10t$ metres. Find its acceleration.",
    compute: () => numDeriv((t) => numDeriv((u) => 5 * u ** 2 + 10 * u, t), 1.7), expected: 10, tolerance: 1e-3, unit: 'm/s²',
  },
  {
    lesson: 'calculus', where: 'practiceProblems[3]', expectQuestionIncludes: 'Find the gradient of the curve $y = x^2$ at the point where $x = 3$',
    compute: () => numDeriv((x) => x ** 2, 3), expected: 6, tolerance: 1e-4, unit: '',
  },
  {
    lesson: 'calculus', where: 'practiceProblems[4]', kind: 'qualitative', expectQuestionIncludes: 'the chord of $y = x^2$ from $x = 3$ to $x = 3 + h$',
    expectAnswerIncludes: '= 6 + h$, which tends to 6',
    verify: () => {
      const ok = [1, 0.5, 0.01].every((h) => near(((3 + h) ** 2 - 9) / h, 6 + h, 1e-9));
      return { holds: ok, detail: 'chord gradient equals 6 + h for h = 1, 0.5, 0.01' };
    },
  },
  {
    lesson: 'calculus', where: 'practiceProblems[5]', expectQuestionIncludes: "A rover's velocity is $v = 3t^2 + 2$ m/s",
    stated: '12 m', compute: () => integrate((t) => 3 * t ** 2 + 2, 0, 2), expected: 12, tolerance: 1e-6, unit: 'm',
  },
  {
    lesson: 'calculus', where: 'textbookContent: chord gradient', kind: 'qualitative', expectNotesIncludes: 'To find the gradient of $y = x^2$ at $x = 2$',
    expectAnswerIncludes: '\\frac{4h + h^2}{h} = 4 + h$$',
    verify: () => {
      const ok = [1, 0.5, 0.01].every((h) => near(((2 + h) ** 2 - 4) / h, 4 + h, 1e-9));
      return { holds: ok, detail: 'chord gradient equals 4 + h for h = 1, 0.5, 0.01' };
    },
  },
  {
    lesson: 'calculus', where: 'textbookContent: tangent gradient', expectNotesIncludes: 'To find the gradient of $y = x^2$ at $x = 2$',
    stated: 'its gradient gets closer to 4', compute: () => numDeriv((x) => x ** 2, 2), expected: 4, tolerance: 1e-4, unit: '',
  },
  {
    lesson: 'calculus', where: 'textbookContent: power rule example', kind: 'claim', expectNotesIncludes: 'Constants multiply through',
    claimIncludes: 'if $y = 2x^3 + 7x$, then $\\dfrac{dy}{dx} = 6x^2 + 7$',
    verify: () => {
      const ok = [-1, 0.5, 2].every((x) => near(numDeriv((u) => 2 * u ** 3 + 7 * u, x), 6 * x ** 2 + 7, 1e-4));
      return { holds: ok, detail: 'numerical derivative of 2x³ + 7x equals 6x² + 7 at x = −1, 0.5, 2' };
    },
  },

  // ======================================================================================== diffeq
  {
    lesson: 'diffeq', where: 'solvedExample.steps[0]', expectQuestionIncludes: 'A capsule is moving at $v = 5000$ m/s during re-entry',
    stated: '= 25{,}000{,}000', compute: () => 5000 ** 2, expected: 25e6, tolerance: 0, unit: '(m/s)²',
  },
  {
    lesson: 'diffeq', where: 'solvedExample.steps[1]', expectQuestionIncludes: 'A capsule is moving at $v = 5000$ m/s during re-entry',
    stated: '= 50$', compute: () => K_DRAG * 5000 ** 2, expected: 50, tolerance: 1e-9, unit: 'm/s²',
  },
  {
    lesson: 'diffeq', where: 'solvedExample.steps[2]', expectQuestionIncludes: 'A capsule is moving at $v = 5000$ m/s during re-entry',
    stated: 'losing 50 m/s of speed every second', compute: () => K_DRAG * 5000 ** 2, expected: 50, tolerance: 1e-9, unit: 'm/s²',
  },
  {
    lesson: 'diffeq', where: 'solvedExample.resultFormula', kind: 'qualitative', expectQuestionIncludes: 'A capsule is moving at $v = 5000$ m/s during re-entry',
    expectAnswerIncludes: '= -50 \\text{ m/s}^2', note: 'The minus sign is checked as text; the size by the steps.',
    verify: () => ({ holds: -K_DRAG * 5000 ** 2 === -50, detail: '−k v² = −2e-6 × 5000² = −50' }),
  },
  {
    lesson: 'diffeq', where: 'practiceProblems[0]', expectQuestionIncludes: 'If its speed triples, what happens to the deceleration?',
    compute: () => (K_DRAG * (3 * 100) ** 2) / (K_DRAG * 100 ** 2), expected: 9, tolerance: 1e-9, unit: '×',
  },
  {
    lesson: 'diffeq', where: 'practiceProblems[1]', kind: 'qualitative', expectQuestionIncludes: 'what happens to the deceleration as the capsule slows down?',
    expectAnswerIncludes: 'It gets smaller',
    verify: () => ({ holds: K_DRAG * 4000 ** 2 < K_DRAG * 5000 ** 2, detail: 'k v² at 4000 m/s is less than at 5000 m/s' }),
  },
  {
    lesson: 'diffeq', where: 'practiceProblems[2]', kind: 'qualitative', expectQuestionIncludes: 'Solve $\\frac{dy}{dx} = 2x$, given that $y = 3$ when $x = 0$',
    expectAnswerIncludes: '$y = x^2 + 3$',
    verify: () => {
      const y = (x: number) => x ** 2 + 3;
      const ok = y(0) === 3 && [-1, 0.5, 2].every((x) => near(numDeriv(y, x), 2 * x, 1e-6));
      return { holds: ok, detail: 'y(0) = 3 and dy/dx = 2x at x = −1, 0.5, 2' };
    },
  },
  {
    lesson: 'diffeq', where: 'practiceProblems[3]', kind: 'qualitative', expectQuestionIncludes: 'Solve $\\frac{dy}{dx} = y$, given that $y = 5$ when $x = 0$',
    expectAnswerIncludes: '$y = 5e^x$',
    verify: () => {
      const y = (x: number) => 5 * Math.exp(x);
      const ok = y(0) === 5 && [-1, 0.5, 2].every((x) => near(numDeriv(y, x), y(x), 1e-5 * y(x)));
      return { holds: ok, detail: 'y(0) = 5 and dy/dx = y at x = −1, 0.5, 2' };
    },
  },
  {
    lesson: 'diffeq', where: 'practiceProblems[4]', kind: 'qualitative', expectQuestionIncludes: 'grows at a rate proportional to its size',
    expectAnswerIncludes: '$\\frac{dP}{dt} = kP$, with $k > 0$',
  },
  {
    lesson: 'diffeq', where: 'practiceProblems[5] (k v0 t)', expectQuestionIncludes: 'A capsule enters the atmosphere at $v_0 = 5000$ m/s',
    stated: '$5000 \\div 1.1$', pick: 1, note: '1 + k v0 t with t = 10 s.', compute: () => 1 + K_DRAG * 5000 * 10, expected: 1.1, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'diffeq', where: 'practiceProblems[5] (speed)', expectQuestionIncludes: 'A capsule enters the atmosphere at $v_0 = 5000$ m/s',
    stated: 'About 4,545 m/s', compute: () => 5000 / (1 + K_DRAG * 5000 * 10), expected: 4545.45, tolerance: 0.5, unit: 'm/s',
  },
  {
    lesson: 'diffeq', where: 'practiceProblems[5] (solution solves the equation)', kind: 'qualitative', expectQuestionIncludes: 'Use $v = \\frac{v_0}{1 + kv_0 t}$',
    expectAnswerIncludes: '4,545',
    verify: () => {
      // Step dv/dt = -k v² forward with small time steps and compare with the formula at t = 10 s.
      let v = 5000;
      const dt = 1e-4;
      for (let t = 0; t < 10 - dt / 2; t += dt) v -= K_DRAG * v * v * dt;
      return { holds: Math.abs(v - 5000 / 1.1) < 0.1, detail: `stepping dv/dt = −kv² for 10 s gives ${v.toFixed(2)} m/s, the formula gives ${(5000 / 1.1).toFixed(2)}` };
    },
  },
  {
    lesson: 'diffeq', where: 'textbookContent: particular solution', kind: 'claim', expectNotesIncludes: '### Particular solutions',
    claimIncludes: 'If $y = 2$ when $x = 0$, then $A = 2$ and $y = 2e^{3x}$',
    verify: () => {
      const y = (x: number) => 2 * Math.exp(3 * x);
      const ok = y(0) === 2 && [-1, 0.5, 2].every((x) => near(numDeriv(y, x), 3 * y(x), 1e-5 * y(x)));
      return { holds: ok, detail: 'y(0) = 2 and dy/dx = 3y at x = −1, 0.5, 2; a different equation from practice question 4' };
    },
  },
  {
    lesson: 'diffeq', where: 'textbookContent: re-entry speed', expectNotesIncludes: 'A capsule returning from orbit hits the top of the atmosphere',
    stated: 'at nearly 8 km/s', note: 'Circular speed just above the atmosphere (about 120 km up) with GM = 3.986e14: 7.8 km/s. "Nearly 8": ±0.3.',
    compute: () => Math.sqrt(3.986e14 / ((6371 + 120) * 1e3)) / 1000, expected: 7.835, tolerance: 0.3, unit: 'km/s',
  },
];
