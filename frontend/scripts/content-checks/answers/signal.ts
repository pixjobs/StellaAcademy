import type { Entry } from '../answers';

/**
 * Answer checks for the "signal" mission's lessons (see MISSIONS in src/lib/missions.ts).
 * Same format and rules as the Mission 2 table in ../answers.ts: one entry per numeric
 * answer, worked-example step or numeric claim, each pinned to a verbatim fragment.
 */

const MILLI = 1e-3;
const MEGA = 1e6;
const GIGA = 1e9;
/** Speed of radio waves and light, as the waves lesson gives it (m/s). */
const C_LESSON = 3.0e8;

/** A binary numeral (as a digit string) to its value. */
const fromBin = (s: string): number => parseInt(s, 2);
/** A value to its binary digits, read as a number so it compares with the stated numeral: toBin(13) = 1101. */
const toBin = (n: number): number => Number(n.toString(2));

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

  // ======================================================================================== waves
  {
    lesson: 'waves', where: 'solvedExample.steps[0]', expectQuestionIncludes: 'A radio station broadcasts at $100$ MHz',
    stated: '= 1.0 \\times 10^8\\text{ Hz}', compute: () => 100 * MEGA, expected: 1e8, relTolerance: 1e-9, unit: 'Hz',
  },
  {
    lesson: 'waves', where: 'solvedExample.resultFormula', expectQuestionIncludes: 'A radio station broadcasts at $100$ MHz',
    compute: () => C_LESSON / (100 * MEGA), expected: 3.0, tolerance: 1e-9, unit: 'm',
  },
  {
    lesson: 'waves', where: 'practiceProblems[0]', expectQuestionIncludes: 'A sound wave travels at 343 m/s and has a frequency of 343 Hz',
    compute: () => 343 / 343, expected: 1, tolerance: 1e-9, unit: 'm',
  },
  {
    lesson: 'waves', where: 'practiceProblems[1]', expectQuestionIncludes: 'A wave has a frequency of 4 Hz. What is its period?',
    compute: () => 1 / 4, expected: 0.25, tolerance: 1e-9, unit: 's',
  },
  {
    lesson: 'waves', where: 'practiceProblems[2]', expectQuestionIncludes: 'wavelength of 1.5 m and a frequency of 2 Hz',
    compute: () => 2 * 1.5, expected: 3, tolerance: 1e-9, unit: 'm/s',
  },
  {
    lesson: 'waves', where: 'practiceProblems[3]', kind: 'qualitative', expectQuestionIncludes: 'a 2 GHz Wi-Fi signal or a 5 GHz Wi-Fi signal',
    expectAnswerIncludes: 'The 5 GHz signal',
    verify: () => {
      const l2 = C_LESSON / (2 * GIGA);
      const l5 = C_LESSON / (5 * GIGA);
      return { holds: l5 < l2, detail: `${l5} m at 5 GHz against ${l2} m at 2 GHz` };
    },
  },
  {
    lesson: 'waves', where: 'practiceProblems[4]', kind: 'qualitative', expectQuestionIncludes: 'Is sound a transverse or a longitudinal wave',
    expectAnswerIncludes: 'Longitudinal',
  },
  {
    lesson: 'waves', where: 'practiceProblems[5] (m)', expectQuestionIncludes: 'A spacecraft sends a radio signal at 8.4 GHz',
    stated: 'About 0.036 m', note: '0.0357 m; 2 s.f., so ±0.0005.',
    compute: () => C_LESSON / (8.4 * GIGA), expected: 0.03571, tolerance: 0.0005, unit: 'm',
  },
  {
    lesson: 'waves', where: 'practiceProblems[5] (cm)', expectQuestionIncludes: 'A spacecraft sends a radio signal at 8.4 GHz',
    stated: '3.6 cm', note: '3.57 cm; 2 s.f., so ±0.05.',
    compute: () => (C_LESSON / (8.4 * GIGA)) * 100, expected: 3.571, tolerance: 0.05, unit: 'cm',
  },

  // ======================================================================================== binary
  // Binary numerals are compared as their digit strings read as numbers: toBin(22) = 10110.
  {
    lesson: 'binary', where: 'solvedExample.steps[2]', expectQuestionIncludes: 'Convert the binary number $10110$ to denary',
    stated: '= 22', compute: () => fromBin('10110'), expected: 22, tolerance: 0, unit: '',
  },
  {
    lesson: 'binary', where: 'solvedExample.resultFormula', expectQuestionIncludes: 'Convert the binary number $10110$ to denary',
    stated: '= 22', compute: () => fromBin('10110'), expected: 22, tolerance: 0, unit: '',
  },
  {
    lesson: 'binary', where: 'practiceProblems[0]', expectQuestionIncludes: 'What is the binary number 100 in denary?',
    compute: () => fromBin('100'), expected: 4, tolerance: 0, unit: '',
  },
  {
    lesson: 'binary', where: 'practiceProblems[1]', expectQuestionIncludes: 'What is the binary number 1011 in denary?',
    compute: () => fromBin('1011'), expected: 11, tolerance: 0, unit: '',
  },
  {
    lesson: 'binary', where: 'practiceProblems[2]', expectQuestionIncludes: 'Write 13 in binary.',
    compute: () => toBin(13), expected: 1101, tolerance: 0, unit: '(binary digits)',
  },
  {
    lesson: 'binary', where: 'practiceProblems[3]', expectQuestionIncludes: 'Write 25 in binary.',
    compute: () => toBin(25), expected: 11001, tolerance: 0, unit: '(binary digits)',
  },
  {
    lesson: 'binary', where: 'practiceProblems[4] (sum)', expectQuestionIncludes: 'Add the binary numbers 101 and 11.',
    stated: '1000', compute: () => toBin(fromBin('101') + fromBin('11')), expected: 1000, tolerance: 0, unit: '(binary digits)',
  },
  {
    lesson: 'binary', where: 'practiceProblems[4] (check)', expectQuestionIncludes: 'Add the binary numbers 101 and 11.',
    stated: '5 + 3 = 8', pick: [0, 1, 2], combine: (n) => (n[0] === fromBin('101') && n[1] === fromBin('11') ? n[2] : NaN),
    compute: () => fromBin('101') + fromBin('11'), expected: 8, tolerance: 0, unit: '',
  },
  {
    lesson: 'binary', where: 'practiceProblems[5] (sum)', expectQuestionIncludes: 'Add the binary numbers 1101 and 111.',
    stated: '10100', compute: () => toBin(fromBin('1101') + fromBin('111')), expected: 10100, tolerance: 0, unit: '(binary digits)',
  },
  {
    lesson: 'binary', where: 'practiceProblems[5] (check)', expectQuestionIncludes: 'Add the binary numbers 1101 and 111.',
    stated: '13 + 7 = 20', combine: (n) => (n[0] === fromBin('1101') && n[1] === fromBin('111') ? n[2] : NaN),
    compute: () => fromBin('1101') + fromBin('111'), expected: 20, tolerance: 0, unit: '',
  },
  {
    lesson: 'binary', where: 'textbookContent: byte', expectNotesIncludes: 'Eight bits make a **byte**',
    stated: 'any whole number from 0 to 255', pick: 1, compute: () => 2 ** 8 - 1, expected: 255, tolerance: 0, unit: '',
  },
  {
    lesson: 'binary', where: 'textbookContent: place values', kind: 'claim', expectNotesIncludes: '| 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |',
    claimIncludes: '| 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |',
    verify: () => {
      const row = [7, 6, 5, 4, 3, 2, 1, 0].map((i) => 2 ** i).join(' | ');
      return { holds: row === '128 | 64 | 32 | 16 | 8 | 4 | 2 | 1', detail: `powers of 2 from 2^7 down: ${row}` };
    },
  },
  {
    lesson: 'binary', where: 'textbookContent: 19 to binary', expectNotesIncludes: 'So $19 = 10011$ in binary',
    stated: 'So $19 = 10011$', pick: 1, compute: () => toBin(19), expected: 10011, tolerance: 0, unit: '(binary digits)',
  },
  {
    lesson: 'binary', where: 'textbookContent: 19 to binary, step 1', expectNotesIncludes: '16 fits into 19: write 1 in the 16s place, leaving 3',
    stated: '16 fits into 19: write 1 in the 16s place, leaving 3', pick: 4, compute: () => 19 - 16, expected: 3, tolerance: 0, unit: '',
  },
  {
    lesson: 'binary', where: 'textbookContent: 19 to binary, step 4', expectNotesIncludes: '2 fits into 3: write 1 in the 2s place, leaving 1',
    stated: '2 fits into 3: write 1 in the 2s place, leaving 1', pick: 4, compute: () => 19 - 16 - 2, expected: 1, tolerance: 0, unit: '',
  },
  {
    lesson: 'binary', where: 'textbookContent: 110 + 11', expectNotesIncludes: 'For $110 + 11$',
    stated: 'The answer is $1001$', compute: () => toBin(fromBin('110') + fromBin('11')), expected: 1001, tolerance: 0, unit: '(binary digits)',
  },
  {
    lesson: 'binary', where: 'textbookContent: 110 + 11, check', expectNotesIncludes: 'For $110 + 11$',
    stated: 'Check in denary: $6 + 3 = 9$', combine: (n) => (n[0] === fromBin('110') && n[1] === fromBin('11') ? n[2] : NaN),
    compute: () => fromBin('110') + fromBin('11'), expected: 9, tolerance: 0, unit: '',
  },
];
