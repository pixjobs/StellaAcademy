import type { Entry } from '../answers';

/**
 * Answer checks for the "toolkit" mission's lessons (see MISSIONS in src/lib/missions.ts).
 * Same format and rules as the Mission 2 table in ../answers.ts: one entry per numeric
 * answer, worked-example step or numeric claim, each pinned to a verbatim fragment.
 */

const ARITHMETIC: Entry[] = [
  // Worked example: 8 - 4 ÷ 2 + (1 + 1)^2
  {
    lesson: 'arithmetic', where: 'solvedExample.steps[0]', expectQuestionIncludes: '$8 - 4 \\div 2 + (1 + 1)^2$',
    stated: '$1 + 1 = 2$', pick: 2, compute: () => 1 + 1, expected: 2, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'solvedExample.steps[1]', expectQuestionIncludes: '$8 - 4 \\div 2 + (1 + 1)^2$',
    stated: '$2^2 = 2 \\times 2 = 4$', pick: 3, compute: () => 2 ** 2, expected: 4, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'solvedExample.steps[2]', expectQuestionIncludes: '$8 - 4 \\div 2 + (1 + 1)^2$',
    stated: '$4 \\div 2 = 2$', pick: 2, compute: () => 4 / 2, expected: 2, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'solvedExample.steps[3] (8 - 2)', expectQuestionIncludes: '$8 - 4 \\div 2 + (1 + 1)^2$',
    stated: '$8 - 2 = 6$', pick: 2, compute: () => 8 - 2, expected: 6, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'solvedExample.steps[3] (6 + 4)', expectQuestionIncludes: '$8 - 4 \\div 2 + (1 + 1)^2$',
    stated: '$6 + 4 = 10$', pick: 2, compute: () => 6 + 4, expected: 10, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'solvedExample.resultFormula', expectQuestionIncludes: '$8 - 4 \\div 2 + (1 + 1)^2$',
    compute: () => 8 - 4 / 2 + (1 + 1) ** 2, expected: 10, tolerance: 0, unit: '',
  },
  // Practice
  {
    lesson: 'arithmetic', where: 'practiceProblems[0]', expectQuestionIncludes: 'Work out 6 + 4 × 5.',
    compute: () => 6 + 4 * 5, expected: 26, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'practiceProblems[1]', expectQuestionIncludes: 'Work out (6 + 4) × 5.',
    compute: () => (6 + 4) * 5, expected: 50, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'practiceProblems[2]', expectQuestionIncludes: 'Work out 18 ÷ 3 × 2.',
    compute: () => (18 / 3) * 2, expected: 12, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'practiceProblems[2] (first step)', expectQuestionIncludes: 'Work out 18 ÷ 3 × 2.',
    stated: '18 ÷ 3 = 6', pick: 2, compute: () => 18 / 3, expected: 6, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'practiceProblems[3]', expectQuestionIncludes: 'Work out 3² + 4 × 2.',
    compute: () => 3 ** 2 + 4 * 2, expected: 17, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'practiceProblems[3] (9)', expectQuestionIncludes: 'Work out 3² + 4 × 2.',
    stated: '(9 + 8)', compute: () => 3 ** 2, expected: 9, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'practiceProblems[3] (8)', expectQuestionIncludes: 'Work out 3² + 4 × 2.',
    stated: '(9 + 8)', pick: 1, compute: () => 4 * 2, expected: 8, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'practiceProblems[4]', expectQuestionIncludes: 'Put one pair of brackets into 2 + 3 × 4',
    stated: '(2 + 3) × 4 = 20', pick: 3, compute: () => (2 + 3) * 4, expected: 20, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'practiceProblems[5]', expectQuestionIncludes: 'A rover makes 4 trips of 3 km',
    stated: '= 14 km', compute: () => 4 * 3 + 2, expected: 14, tolerance: 0, unit: 'km',
  },
  // Notes
  {
    lesson: 'arithmetic', where: 'textbookContent: add first', expectNotesIncludes: 'What is $5 + 2 \\times 3$?',
    stated: 'If you add first you get 21.', compute: () => (5 + 2) * 3, expected: 21, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'textbookContent: multiply first', expectNotesIncludes: 'What is $5 + 2 \\times 3$?',
    stated: 'If you multiply first you get 11.', compute: () => 5 + 2 * 3, expected: 11, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'textbookContent: the answer', expectNotesIncludes: 'What is $5 + 2 \\times 3$?',
    stated: 'The answer is **11**.', compute: () => 5 + 2 * 3, expected: 11, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'textbookContent: 3 squared', expectNotesIncludes: 'For example, $3^2 = 3 \\times 3 = 9$.',
    stated: '$3^2 = 3 \\times 3 = 9$', pick: 3, compute: () => 3 ** 2, expected: 9, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'textbookContent: 16 ÷ 4 × 2', expectNotesIncludes: '$16 \\div 4 \\times 2 = 4 \\times 2 = 8$',
    stated: '$16 \\div 4 \\times 2 = 4 \\times 2 = 8$', pick: [5], compute: () => (16 / 4) * 2, expected: 8, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'textbookContent: 16 ÷ 4', expectNotesIncludes: '$16 \\div 4 \\times 2 = 4 \\times 2 = 8$',
    stated: '$16 \\div 4 \\times 2 = 4 \\times 2 = 8$', pick: 3, compute: () => 16 / 4, expected: 4, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'textbookContent: the wrong order', expectNotesIncludes: 'It is not $16 \\div 8 = 2$.',
    stated: '$16 \\div 8 = 2$', pick: 2, compute: () => 16 / (4 * 2), expected: 2, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'textbookContent: 10 - 4 + 3 (6)', expectNotesIncludes: '$10 - 4 + 3 = 6 + 3 = 9$',
    stated: '$10 - 4 + 3 = 6 + 3 = 9$', pick: 3, compute: () => 10 - 4, expected: 6, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'textbookContent: 10 - 4 + 3', expectNotesIncludes: '$10 - 4 + 3 = 6 + 3 = 9$',
    stated: '$10 - 4 + 3 = 6 + 3 = 9$', pick: 5, compute: () => 10 - 4 + 3, expected: 9, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'textbookContent: 5 + 2 × 3', expectNotesIncludes: '$5 + 2 \\times 3 = 5 + 6 = 11$',
    stated: '$5 + 2 \\times 3 = 5 + 6 = 11$', pick: [4, 5], combine: (n) => n[3] + n[4], compute: () => 5 + 2 * 3, expected: 11, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'textbookContent: 5 + 2 × 3 result', expectNotesIncludes: '$5 + 2 \\times 3 = 5 + 6 = 11$',
    stated: '$5 + 2 \\times 3 = 5 + 6 = 11$', pick: 5, compute: () => 5 + 2 * 3, expected: 11, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'textbookContent: (5 + 2) × 3', expectNotesIncludes: '$(5 + 2) \\times 3 = 7 \\times 3 = 21$',
    stated: '$(5 + 2) \\times 3 = 7 \\times 3 = 21$', pick: 5, compute: () => (5 + 2) * 3, expected: 21, tolerance: 0, unit: '',
  },
  {
    lesson: 'arithmetic', where: 'textbookContent: meals (30)', expectNotesIncludes: 'Three astronauts each eat 2 packed meals a day on a 5-day trip',
    stated: '$3 \\times 2 \\times 5 + 4 = 30 + 4 = 34$', pick: 4, compute: () => 3 * 2 * 5, expected: 30, tolerance: 0, unit: 'meals',
  },
  {
    lesson: 'arithmetic', where: 'textbookContent: meals', expectNotesIncludes: 'Three astronauts each eat 2 packed meals a day on a 5-day trip',
    stated: '$3 \\times 2 \\times 5 + 4 = 30 + 4 = 34$', pick: 6, compute: () => 3 * 2 * 5 + 4, expected: 34, tolerance: 0, unit: 'meals',
  },
  {
    lesson: 'arithmetic', where: 'textbookContent: meals, wrong order', expectNotesIncludes: 'If you added $5 + 4$ first',
    stated: '$3 \\times 2 \\times 9 = 54$', pick: 3, compute: () => 3 * 2 * (5 + 4), expected: 54, tolerance: 0, unit: 'meals',
  },
  {
    lesson: 'arithmetic', where: 'textbookContent: meals, difference', expectNotesIncludes: 'If you added $5 + 4$ first',
    stated: '20 more than the crew needs', compute: () => 3 * 2 * (5 + 4) - (3 * 2 * 5 + 4), expected: 20, tolerance: 0, unit: 'meals',
  },
];

/**
 * The number reader ignores minus signs, so a negative stated value is read through `combine`, negating
 * the number. The `stated` fragment always includes the minus sign, so the sign is pinned too.
 */
const neg = (i: number) => (n: number[]) => -n[i];

const NEGATIVE_NUMBERS: Entry[] = [
  {
    lesson: 'negative-numbers', where: 'conceptSteps[0]', kind: 'claim', expectQuestionIncludes: 'A number further to the right is bigger',
    claimIncludes: 'so $-2$ is bigger than $-5$',
    verify: () => ({ holds: -2 > -5, detail: '-2 > -5' }),
  },
  // Worked example: (-3) × (-4) + (-2)
  {
    lesson: 'negative-numbers', where: 'solvedExample.steps[0]', expectQuestionIncludes: 'Work out $(-3) \\times (-4) + (-2)$.',
    stated: '$(-3) \\times (-4) = 12$', pick: 2, compute: () => -3 * -4, expected: 12, tolerance: 0, unit: '',
  },
  {
    lesson: 'negative-numbers', where: 'solvedExample.steps[1]', expectQuestionIncludes: 'Work out $(-3) \\times (-4) + (-2)$.',
    stated: '$12 + (-2) = 12 - 2 = 10$', pick: 4, compute: () => 12 + -2, expected: 10, tolerance: 0, unit: '',
  },
  {
    lesson: 'negative-numbers', where: 'solvedExample.resultFormula', expectQuestionIncludes: 'Work out $(-3) \\times (-4) + (-2)$.',
    stated: '= 10', compute: () => -3 * -4 + -2, expected: 10, tolerance: 0, unit: '',
  },
  // Practice
  {
    lesson: 'negative-numbers', where: 'practiceProblems[0]', expectQuestionIncludes: 'Work out −5 + 8.',
    compute: () => -5 + 8, expected: 3, tolerance: 0, unit: '',
  },
  {
    lesson: 'negative-numbers', where: 'practiceProblems[1]', expectQuestionIncludes: 'Work out −3 − (−7).',
    compute: () => -3 - -7, expected: 4, tolerance: 0, unit: '',
  },
  {
    lesson: 'negative-numbers', where: 'practiceProblems[2]', expectQuestionIncludes: 'Work out −2.5 × 4.',
    stated: '−10', combine: neg(0), compute: () => -2.5 * 4, expected: -10, tolerance: 0, unit: '',
  },
  {
    lesson: 'negative-numbers', where: 'practiceProblems[3]', expectQuestionIncludes: 'Work out (−3) × (−7).',
    compute: () => -3 * -7, expected: 21, tolerance: 0, unit: '',
  },
  {
    lesson: 'negative-numbers', where: 'practiceProblems[4]', expectQuestionIncludes: 'Work out 36 ÷ (−4).',
    stated: '−9', combine: neg(0), compute: () => 36 / -4, expected: -9, tolerance: 0, unit: '',
  },
  {
    lesson: 'negative-numbers', where: 'practiceProblems[5]', expectQuestionIncludes: 'reaches about 120 °C in sunlight and falls to about −130 °C',
    compute: () => 120 - -130, expected: 250, tolerance: 0, unit: '°C',
  },
  // Notes
  {
    lesson: 'negative-numbers', where: 'textbookContent: -4 + 6', expectNotesIncludes: 'Adding a positive number moves you **right**',
    stated: '$-4 + 6 = 2$', pick: 2, compute: () => -4 + 6, expected: 2, tolerance: 0, unit: '',
  },
  {
    lesson: 'negative-numbers', where: 'textbookContent: 4 - 9', expectNotesIncludes: 'Subtracting a positive number moves you **left**',
    stated: '$4 - 9 = -5$', combine: neg(2), compute: () => 4 - 9, expected: -5, tolerance: 0, unit: '',
  },
  {
    lesson: 'negative-numbers', where: 'textbookContent: 6 + (-2)', expectNotesIncludes: 'Adding a negative number is the same as subtracting',
    stated: '$6 + (-2) = 6 - 2 = 4$', pick: 4, compute: () => 6 + -2, expected: 4, tolerance: 0, unit: '',
  },
  {
    lesson: 'negative-numbers', where: 'textbookContent: -2 - (-5)', expectNotesIncludes: 'Subtracting a negative number is the same as adding',
    stated: '$-2 - (-5) = -2 + 5 = 3$', pick: 4, compute: () => -2 - -5, expected: 3, tolerance: 0, unit: '',
  },
  {
    lesson: 'negative-numbers', where: 'textbookContent: -8 °C to 5 °C', expectNotesIncludes: 'From $-8$ °C to $5$ °C is 8 degrees up to 0 and 5 more',
    stated: 'a rise of 13 degrees', compute: () => 5 - -8, expected: 13, tolerance: 0, unit: '°C',
  },
  {
    lesson: 'negative-numbers', where: 'textbookContent: 5 - (-8)', expectNotesIncludes: 'From $-8$ °C to $5$ °C is 8 degrees up to 0 and 5 more',
    stated: '$5 - (-8) = 13$', pick: 2, compute: () => 5 - -8, expected: 13, tolerance: 0, unit: '°C',
  },
  {
    lesson: 'negative-numbers', where: 'textbookContent: sign table, 2 × 6', expectNotesIncludes: '| positive and positive | positive |',
    stated: '$2 \\times 6 = 12$', pick: 2, compute: () => 2 * 6, expected: 12, tolerance: 0, unit: '',
  },
  {
    lesson: 'negative-numbers', where: 'textbookContent: sign table, (-2) × (-6)', expectNotesIncludes: '| negative and negative | positive |',
    stated: '$(-2) \\times (-6) = 12$', pick: 2, compute: () => -2 * -6, expected: 12, tolerance: 0, unit: '',
  },
  {
    lesson: 'negative-numbers', where: 'textbookContent: sign table, 2 × (-6)', expectNotesIncludes: '| positive and negative | negative |',
    stated: '$2 \\times (-6) = -12$', combine: neg(2), compute: () => 2 * -6, expected: -12, tolerance: 0, unit: '',
  },
  {
    lesson: 'negative-numbers', where: 'textbookContent: (-12) ÷ (-4)', expectNotesIncludes: 'Division follows the same rules',
    stated: '$(-12) \\div (-4) = 3$', pick: 2, compute: () => -12 / -4, expected: 3, tolerance: 0, unit: '',
  },
  {
    lesson: 'negative-numbers', where: 'textbookContent: 12 ÷ (-4)', expectNotesIncludes: 'Division follows the same rules',
    stated: '$12 \\div (-4) = -3$', combine: neg(2), compute: () => 12 / -4, expected: -3, tolerance: 0, unit: '',
  },
  {
    lesson: 'negative-numbers', where: 'textbookContent: -1.5 × 4', expectNotesIncludes: 'The same rules apply to decimals and fractions',
    stated: '$-1.5 \\times 4 = -6$', combine: neg(2), compute: () => -1.5 * 4, expected: -6, tolerance: 0, unit: '',
  },
  {
    lesson: 'negative-numbers', where: 'textbookContent: (-1/2) × (-2/3)', expectNotesIncludes: 'The same rules apply to decimals and fractions',
    stated: '$\\left(-\\dfrac{1}{2}\\right) \\times \\left(-\\dfrac{2}{3}\\right) = \\dfrac{1}{3}$',
    combine: (n) => n[4] / n[5], compute: () => (-1 / 2) * (-2 / 3), expected: 1 / 3, tolerance: 1e-9, unit: '',
  },
];

export const ENTRIES: Entry[] = [...ARITHMETIC, ...NEGATIVE_NUMBERS];
