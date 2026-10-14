import type { Entry } from '../answers';

/**
 * Answer checks for the "signal" mission's lessons (see MISSIONS in src/lib/missions.ts).
 * Same format and rules as the Mission 2 table in ../answers.ts: one entry per numeric
 * answer, worked-example step or numeric claim, each pinned to a verbatim fragment.
 */

const MILLI = 1e-3;

export const ENTRIES: Entry[] = [
  // ======================================================================================== circuit
  {
    lesson: 'circuit', where: 'solvedExample.steps[2] (A)', expectQuestionIncludes: 'A $150$ Ω resistor is connected to a $12$ V battery',
    stated: '$I = 0.08$ A', compute: () => 12 / 150, expected: 0.08, tolerance: 1e-9, unit: 'A',
  },
  {
    lesson: 'circuit', where: 'solvedExample.steps[2] (mA)', expectQuestionIncludes: 'A $150$ Ω resistor is connected to a $12$ V battery',
    stated: 'so this is $80$ mA', compute: () => 12 / 150 / MILLI, expected: 80, tolerance: 1e-9, unit: 'mA',
  },
  {
    lesson: 'circuit', where: 'solvedExample.resultFormula (A)', expectQuestionIncludes: 'A $150$ Ω resistor is connected to a $12$ V battery',
    stated: 'I = 0.08', compute: () => 12 / 150, expected: 0.08, tolerance: 1e-9, unit: 'A',
  },
  {
    lesson: 'circuit', where: 'solvedExample.resultFormula (mA)', expectQuestionIncludes: 'A $150$ Ω resistor is connected to a $12$ V battery',
    stated: '80 \\text{ mA}', compute: () => 12 / 150 / MILLI, expected: 80, tolerance: 1e-9, unit: 'mA',
  },
  {
    lesson: 'circuit', where: 'practiceProblems[0] (A)', expectQuestionIncludes: 'The potential difference across a resistor is 5 V and its resistance is 100 Ω',
    stated: '0.05 A', compute: () => 5 / 100, expected: 0.05, tolerance: 1e-9, unit: 'A',
  },
  {
    lesson: 'circuit', where: 'practiceProblems[0] (mA)', expectQuestionIncludes: 'The potential difference across a resistor is 5 V and its resistance is 100 Ω',
    stated: '50 mA', compute: () => 5 / 100 / MILLI, expected: 50, tolerance: 1e-9, unit: 'mA',
  },
  {
    lesson: 'circuit', where: 'practiceProblems[1] (0.02 A in question)', expectQuestionIncludes: 'You want a current of 20 mA (0.02 A) from a 10 V supply',
    statedIn: 'question', stated: '20 mA (0.02 A)', pick: 1, compute: () => 20 * MILLI, expected: 0.02, tolerance: 1e-9, unit: 'A',
  },
  {
    lesson: 'circuit', where: 'practiceProblems[1]', expectQuestionIncludes: 'You want a current of 20 mA (0.02 A) from a 10 V supply',
    compute: () => 10 / (20 * MILLI), expected: 500, tolerance: 1e-9, unit: 'Ω',
  },
  {
    lesson: 'circuit', where: 'practiceProblems[2]', expectQuestionIncludes: 'A current of 2 A flows for 30 seconds',
    compute: () => 2 * 30, expected: 60, tolerance: 0, unit: 'C',
  },
  {
    lesson: 'circuit', where: 'practiceProblems[3] (current)', expectQuestionIncludes: 'A 4 Ω resistor and an 8 Ω resistor are connected in series to a 12 V battery',
    stated: '1 A', compute: () => 12 / (4 + 8), expected: 1, tolerance: 1e-9, unit: 'A',
  },
  {
    lesson: 'circuit', where: 'practiceProblems[3] (total resistance)', expectQuestionIncludes: 'A 4 Ω resistor and an 8 Ω resistor are connected in series to a 12 V battery',
    stated: 'the total resistance is 12 Ω', compute: () => 4 + 8, expected: 12, tolerance: 0, unit: 'Ω',
  },
  {
    lesson: 'circuit', where: 'practiceProblems[4] (8 Ω)', expectQuestionIncludes: 'what is the potential difference across the 8 Ω resistor',
    stated: '8 V', compute: () => (12 / (4 + 8)) * 8, expected: 8, tolerance: 1e-9, unit: 'V',
  },
  {
    lesson: 'circuit', where: 'practiceProblems[4] (4 Ω)', expectQuestionIncludes: 'what is the potential difference across the 8 Ω resistor',
    stated: 'the other 4 V', compute: () => (12 / (4 + 8)) * 4, expected: 4, tolerance: 1e-9, unit: 'V',
  },
  {
    lesson: 'circuit', where: 'practiceProblems[5]', kind: 'qualitative', expectQuestionIncludes: 'A second identical lamp is added in parallel with it',
    expectAnswerIncludes: 'The total resistance goes down, so the current from the battery goes up',
    verify: () => {
      const r = 10; // any lamp resistance
      const parallel = 1 / (1 / r + 1 / r);
      return { holds: parallel < r, detail: `two ${r} Ω lamps in parallel give ${parallel} Ω, less than ${r} Ω` };
    },
  },
  {
    lesson: 'circuit', where: 'textbookContent: worked example, total resistance', expectNotesIncludes: 'A 100 $\\Omega$ resistor and a 200 $\\Omega$ resistor are in series with a 6 V battery',
    stated: 'Total resistance: $100 + 200 = 300', pick: 2, compute: () => 100 + 200, expected: 300, tolerance: 0, unit: 'Ω',
  },
  {
    lesson: 'circuit', where: 'textbookContent: worked example, current', expectNotesIncludes: 'A 100 $\\Omega$ resistor and a 200 $\\Omega$ resistor are in series with a 6 V battery',
    stated: '\\dfrac{6}{300} = 0.02$ A', pick: 2, compute: () => 6 / 300, expected: 0.02, tolerance: 1e-9, unit: 'A',
  },
  {
    lesson: 'circuit', where: 'textbookContent: worked example, 100 Ω', expectNotesIncludes: 'A 100 $\\Omega$ resistor and a 200 $\\Omega$ resistor are in series with a 6 V battery',
    stated: '$V = IR = 0.02 \\times 100 = 2$ V', pick: 2, compute: () => (6 / 300) * 100, expected: 2, tolerance: 1e-9, unit: 'V',
  },
  {
    lesson: 'circuit', where: 'textbookContent: worked example, 200 Ω', expectNotesIncludes: 'A 100 $\\Omega$ resistor and a 200 $\\Omega$ resistor are in series with a 6 V battery',
    stated: '$0.02 \\times 200 = 4$ V', pick: 2, compute: () => (6 / 300) * 200, expected: 4, tolerance: 1e-9, unit: 'V',
  },
  {
    lesson: 'circuit', where: 'textbookContent: worked example, sum', expectNotesIncludes: 'A 100 $\\Omega$ resistor and a 200 $\\Omega$ resistor are in series with a 6 V battery',
    stated: 'The two add up to the 6 V of the battery', pick: 0, compute: () => (6 / 300) * (100 + 200), expected: 6, tolerance: 1e-9, unit: 'V',
  },
];
