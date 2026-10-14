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
];
