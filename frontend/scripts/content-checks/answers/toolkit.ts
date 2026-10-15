import type { Entry, NumericEntry } from '../answers';

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

const ISS_ORBITS_PER_DAY_LESSON = 16; // the lesson's round figure; the true value is about 15.5 (period about 93 min)

const MULTIPLICATION: Entry[] = [
  // Worked example: 24 × 13
  {
    lesson: 'multiplication', where: 'solvedExample.steps[0]', expectQuestionIncludes: 'Work out $24 \\times 13$',
    stated: '$13 = 10 + 3$', combine: (n) => n[1] + n[2], compute: () => 13, expected: 13, tolerance: 0, unit: '',
  },
  {
    lesson: 'multiplication', where: 'solvedExample.steps[1]', expectQuestionIncludes: 'Work out $24 \\times 13$',
    stated: '$24 \\times 3 = 72$', pick: 2, compute: () => 24 * 3, expected: 72, tolerance: 0, unit: '',
  },
  {
    lesson: 'multiplication', where: 'solvedExample.steps[2]', expectQuestionIncludes: 'Work out $24 \\times 13$',
    stated: '$24 \\times 10 = 240$', pick: 2, compute: () => 24 * 10, expected: 240, tolerance: 0, unit: '',
  },
  {
    lesson: 'multiplication', where: 'solvedExample.steps[3]', expectQuestionIncludes: 'Work out $24 \\times 13$',
    stated: '$72 + 240 = 312$', pick: 2, compute: () => 72 + 240, expected: 312, tolerance: 0, unit: '',
  },
  {
    lesson: 'multiplication', where: 'solvedExample.resultFormula', expectQuestionIncludes: 'Work out $24 \\times 13$',
    stated: '= 312', compute: () => 24 * 13, expected: 312, tolerance: 0, unit: '',
  },
  // Practice: the answer and both partial products
  ...(
    [
      [0, 'Work out 15 × 12.', 15, 12, null, null],
      [1, 'Work out 23 × 14.', 23, 14, '(92 + 230)', [23 * 4, 23 * 10]],
      [2, 'Work out 47 × 36.', 47, 36, '(282 + 1,410)', [47 * 6, 47 * 30]],
      [3, 'Work out 325 × 18.', 325, 18, '(2,600 + 3,250)', [325 * 8, 325 * 10]],
      [4, 'Work out 2,406 × 15.', 2406, 15, '(12,030 + 24,060)', [2406 * 5, 2406 * 10]],
      [5, 'burn 1,250 kg of fuel every second', 1250, 24, '(5,000 + 25,000)', [1250 * 4, 1250 * 20]],
    ] as const
  ).flatMap(([i, q, x, y, parts, partials]): Entry[] => {
    const out: Entry[] = [
      {
        lesson: 'multiplication', where: `practiceProblems[${i}]`, expectQuestionIncludes: q,
        compute: () => x * y, expected: x * y, tolerance: 0, unit: '',
      },
    ];
    if (parts && partials) {
      partials.forEach((v, k) =>
        out.push({
          lesson: 'multiplication', where: `practiceProblems[${i}] (partial product ${k + 1})`, expectQuestionIncludes: q,
          stated: parts, pick: k, compute: () => v, expected: v, tolerance: 0, unit: '',
        }),
      );
      out.push({
        lesson: 'multiplication', where: `practiceProblems[${i}] (partials add up)`, expectQuestionIncludes: q,
        stated: parts, combine: (n) => n[0] + n[1], compute: () => x * y, expected: x * y, tolerance: 0, unit: '',
      });
    }
    return out;
  }),
  // Notes
  {
    lesson: 'multiplication', where: 'textbookContent: 31 × 12', expectNotesIncludes: 'For $31 \\times 12$, use $12 = 10 + 2$.',
    stated: '$31 \\times 12 = (31 \\times 10) + (31 \\times 2) = 310 + 62 = 372$', pick: 8, compute: () => 31 * 12, expected: 372, tolerance: 0, unit: '',
  },
  {
    lesson: 'multiplication', where: 'textbookContent: 31 × 10', expectNotesIncludes: 'For $31 \\times 12$, use $12 = 10 + 2$.',
    stated: '$31 \\times 12 = (31 \\times 10) + (31 \\times 2) = 310 + 62 = 372$', pick: 6, compute: () => 31 * 10, expected: 310, tolerance: 0, unit: '',
  },
  {
    lesson: 'multiplication', where: 'textbookContent: 31 × 2', expectNotesIncludes: 'For $31 \\times 12$, use $12 = 10 + 2$.',
    stated: '$31 \\times 12 = (31 \\times 10) + (31 \\times 2) = 310 + 62 = 372$', pick: 7, compute: () => 31 * 2, expected: 62, tolerance: 0, unit: '',
  },
  {
    lesson: 'multiplication', where: 'textbookContent: carrying, 8 × 7', expectNotesIncludes: 'For $38 \\times 7$:',
    stated: '$8 \\times 7 = 56$. Write 6 and carry 5.', pick: [2], compute: () => 8 * 7, expected: 56, tolerance: 0, unit: '',
  },
  {
    lesson: 'multiplication', where: 'textbookContent: carrying, 3 × 7 + 5', expectNotesIncludes: 'For $38 \\times 7$:',
    stated: '$3 \\times 7 = 21$, plus the 5 carried, is 26.', pick: 4, compute: () => 3 * 7 + 5, expected: 26, tolerance: 0, unit: '',
  },
  {
    lesson: 'multiplication', where: 'textbookContent: carrying, 38 × 7', expectNotesIncludes: 'For $38 \\times 7$:',
    stated: 'The answer is 266.', compute: () => 38 * 7, expected: 266, tolerance: 0, unit: '',
  },
  {
    lesson: 'multiplication', where: 'textbookContent: 1,234 × 5', expectNotesIncludes: 'For $1{,}234 \\times 25$:',
    stated: '$1{,}234 \\times 5 = 6{,}170$', pick: 2, compute: () => 1234 * 5, expected: 6170, tolerance: 0, unit: '',
  },
  {
    lesson: 'multiplication', where: 'textbookContent: 1,234 × 20', expectNotesIncludes: 'For $1{,}234 \\times 25$:',
    stated: '$1{,}234 \\times 20 = 24{,}680$', pick: 2, compute: () => 1234 * 20, expected: 24680, tolerance: 0, unit: '',
  },
  {
    lesson: 'multiplication', where: 'textbookContent: 1,234 × 25', expectNotesIncludes: 'For $1{,}234 \\times 25$:',
    stated: '$6{,}170 + 24{,}680 = 30{,}850$', pick: 2, compute: () => 1234 * 25, expected: 30850, tolerance: 0, unit: '',
  },
  {
    lesson: 'multiplication', where: 'textbookContent: estimate', expectNotesIncludes: '$1{,}234$ is about $1{,}200$',
    stated: '$1{,}200 \\times 25 = 30{,}000$', pick: 2, compute: () => 1200 * 25, expected: 30000, tolerance: 0, unit: '',
  },
  {
    lesson: 'multiplication', where: 'textbookContent: ten times too small', expectNotesIncludes: 'An answer of $3{,}085$ would be ten times too small.',
    stated: 'An answer of $3{,}085$', compute: () => (1234 * 25) / 10, expected: 3085, tolerance: 0, unit: '',
  },
  {
    lesson: 'multiplication', where: 'textbookContent: ISS orbits, 365 × 10', expectNotesIncludes: 'goes round the Earth nearly 16 times a day',
    stated: '$365 \\times 16 = (365 \\times 10) + (365 \\times 6) = 3{,}650 + 2{,}190 = 5{,}840$', pick: 6, compute: () => 365 * 10, expected: 3650, tolerance: 0, unit: 'orbits',
  },
  {
    lesson: 'multiplication', where: 'textbookContent: ISS orbits, 365 × 6', expectNotesIncludes: 'goes round the Earth nearly 16 times a day',
    stated: '$365 \\times 16 = (365 \\times 10) + (365 \\times 6) = 3{,}650 + 2{,}190 = 5{,}840$', pick: 7, compute: () => 365 * 6, expected: 2190, tolerance: 0, unit: 'orbits',
  },
  {
    lesson: 'multiplication', where: 'textbookContent: ISS orbits in a year', expectNotesIncludes: 'goes round the Earth nearly 16 times a day',
    stated: '$365 \\times 16 = (365 \\times 10) + (365 \\times 6) = 3{,}650 + 2{,}190 = 5{,}840$', pick: 8,
    compute: () => 365 * ISS_ORBITS_PER_DAY_LESSON, expected: 5840, tolerance: 0, unit: 'orbits',
    note: 'With the true figure of about 15.5 orbits a day the year has about 5,660; the lesson says "nearly 16" and "a little under".',
  },
];

/** Read "a/b" or \dfrac{a}{b} as a value: the i-th and (i+1)-th numbers of the stated text. */
const frac = (i: number) => (n: number[]) => n[i] / n[i + 1];
const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));

// Approximate published masses, tonnes (propellant, gross at lift-off).
const SATURN_V = { propellant: 2630, gross: 2950 }; // Apollo-era Saturn V, about 89% propellant
const FALCON_9 = { propellant: 518, gross: 549 }; // Falcon 9 Full Thrust, about 94% propellant

const FRACTIONS: Entry[] = [
  // Worked example: 7500 kg of fuel in a 10 000 kg rocket
  {
    lesson: 'fractions', where: 'solvedExample.steps[1]', expectQuestionIncludes: 'total mass of $10\\,000$ kg, and $7500$ kg of it is fuel',
    stated: '$P = \\dfrac{7500}{10\\,000}$', combine: frac(0), compute: () => 7500 / 10000, expected: 0.75, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'fractions', where: 'solvedExample.steps[2] (top ÷ 100)', expectQuestionIncludes: 'total mass of $10\\,000$ kg, and $7500$ kg of it is fuel',
    stated: '$7500 \\div 100 = 75$', pick: 2, compute: () => 7500 / 100, expected: 75, tolerance: 0, unit: '',
  },
  {
    lesson: 'fractions', where: 'solvedExample.steps[2] (bottom ÷ 100)', expectQuestionIncludes: 'total mass of $10\\,000$ kg, and $7500$ kg of it is fuel',
    stated: '$10\\,000 \\div 100 = 100$', pick: 2, compute: () => 10000 / 100, expected: 100, tolerance: 0, unit: '',
  },
  {
    lesson: 'fractions', where: 'solvedExample.steps[2] (75/100)', expectQuestionIncludes: 'total mass of $10\\,000$ kg, and $7500$ kg of it is fuel',
    stated: 'which gives $\\dfrac{75}{100}$', combine: frac(0), compute: () => 7500 / 10000, expected: 0.75, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'fractions', where: 'solvedExample.steps[2] (top ÷ 25)', expectQuestionIncludes: 'total mass of $10\\,000$ kg, and $7500$ kg of it is fuel',
    stated: '$75 \\div 25 = 3$', pick: 2, compute: () => 75 / 25, expected: 3, tolerance: 0, unit: '',
  },
  {
    lesson: 'fractions', where: 'solvedExample.steps[2] (bottom ÷ 25)', expectQuestionIncludes: 'total mass of $10\\,000$ kg, and $7500$ kg of it is fuel',
    stated: '$100 \\div 25 = 4$', pick: 2, compute: () => 100 / 25, expected: 4, tolerance: 0, unit: '',
  },
  {
    lesson: 'fractions', where: 'solvedExample.steps[2] (100 × 25 is the biggest common factor)', expectQuestionIncludes: 'total mass of $10\\,000$ kg, and $7500$ kg of it is fuel',
    stated: 'divide both by 25', compute: () => gcd(7500, 10000) / 100, expected: 25, tolerance: 0, unit: '',
  },
  {
    lesson: 'fractions', where: 'solvedExample.resultFormula', expectQuestionIncludes: 'total mass of $10\\,000$ kg, and $7500$ kg of it is fuel',
    combine: frac(0), compute: () => 7500 / 10000, expected: 0.75, tolerance: 1e-9, unit: '',
  },
  // Practice
  {
    lesson: 'fractions', where: 'practiceProblems[0] (4/6)', expectQuestionIncludes: 'Write two fractions that are equivalent to 2/3.',
    stated: '4/6', combine: frac(0), compute: () => 2 / 3, expected: 2 / 3, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'fractions', where: 'practiceProblems[0] (6/9)', expectQuestionIncludes: 'Write two fractions that are equivalent to 2/3.',
    stated: '6/9', combine: frac(0), compute: () => 2 / 3, expected: 2 / 3, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'fractions', where: 'practiceProblems[0] (rule)', kind: 'claim', expectQuestionIncludes: 'Write two fractions that are equivalent to 2/3.',
    claimIncludes: 'multiply the top and bottom of 2/3 by the same number',
    verify: () => ({ holds: (2 * 2) / (3 * 2) === 2 / 3 && (2 * 3) / (3 * 3) === 2 / 3, detail: '4/6 is 2/3 times 2/2 and 6/9 is 2/3 times 3/3' }),
  },
  {
    lesson: 'fractions', where: 'practiceProblems[1]', expectQuestionIncludes: 'Write 3/10 as a number of hundredths.',
    stated: '30/100', pick: 0, compute: () => (3 / 10) * 100, expected: 30, tolerance: 1e-9, unit: 'hundredths',
  },
  {
    lesson: 'fractions', where: 'practiceProblems[2]', expectQuestionIncludes: 'Write 12/16 in its simplest form.',
    stated: '3/4', combine: frac(0), compute: () => 12 / 16, expected: 0.75, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'fractions', where: 'practiceProblems[2] (divide by)', expectQuestionIncludes: 'Write 12/16 in its simplest form.',
    stated: '(divide both by 4)', compute: () => gcd(12, 16), expected: 4, tolerance: 0, unit: '',
  },
  {
    lesson: 'fractions', where: 'practiceProblems[3]', expectQuestionIncludes: 'A satellite has a mass of 500 kg. One fifth of it',
    compute: () => 500 / 5, expected: 100, tolerance: 0, unit: 'kg',
  },
  {
    lesson: 'fractions', where: 'practiceProblems[4]', expectQuestionIncludes: 'A lander has a mass of 800 kg, and 200 kg of that is fuel.',
    stated: '= 1/4', combine: frac(0), compute: () => 200 / 800, expected: 0.25, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'fractions', where: 'practiceProblems[5]', expectQuestionIncludes: 'What is 3/4 of 60?',
    compute: () => (60 / 4) * 3, expected: 45, tolerance: 0, unit: '',
  },
  // Notes
  ...(
    [
      ['equivalent, 2/4', '\\dfrac{2}{4}', 1 / 2],
      ['equivalent, 4/8', '\\dfrac{4}{8}', 1 / 2],
      ['equivalent, 50/100', '\\dfrac{50}{100}', 1 / 2],
      ['tenths, 70/100', '$\\dfrac{7}{10} = \\dfrac{70}{100}$', 7 / 10],
      ['tenths, 90/100', '$\\dfrac{9}{10} = \\dfrac{90}{100}$', 9 / 10],
      ['hundredths, 25/100', '$\\dfrac{1}{4} = \\dfrac{25}{100}$', 1 / 4],
      ['hundredths, 20/100', '$\\dfrac{1}{5} = \\dfrac{20}{100}$', 1 / 5],
      ['simplest form, 2/3', '$\\dfrac{10}{15} = \\dfrac{2}{3}$', 10 / 15],
      ['fraction of another, 1/3', '$\\dfrac{300}{900} = \\dfrac{1}{3}$', 300 / 900],
      ['bigger than 1, 3/2', '$\\dfrac{15}{10} = \\dfrac{3}{2}$', 15 / 10],
    ] as const
  ).map(([label, stated, value]): Entry => {
    const twoFractions = stated.split('dfrac').length - 1 === 2;
    return {
      lesson: 'fractions', where: `textbookContent: ${label}`, expectNotesIncludes: stated,
      // Where a line equates two fractions, compare the second with the value of the first.
      stated, combine: twoFractions ? frac(2) : frac(0), compute: () => value, expected: value, tolerance: 1e-9, unit: '',
    };
  }),
  {
    lesson: 'fractions', where: 'textbookContent: simplest form, divide by', expectNotesIncludes: '$\\dfrac{10}{15} = \\dfrac{2}{3}$ (dividing both by 5)',
    stated: '(dividing both by 5)', compute: () => gcd(10, 15), expected: 5, tolerance: 0, unit: '',
  },
  {
    lesson: 'fractions', where: 'textbookContent: 900 kg satellite', expectNotesIncludes: 'A satellite of 900 kg carrying 300 kg of fuel is',
    stated: '$\\dfrac{300}{900} = \\dfrac{1}{3}$', combine: frac(0), compute: () => 300 / 900, expected: 1 / 3, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'fractions', where: 'textbookContent: 2/3 of 90, one third', expectNotesIncludes: 'For $\\dfrac{2}{3}$ of 90 kg:',
    stated: '$90 \\div 3 = 30$, so one third is 30 kg.', pick: 2, compute: () => 90 / 3, expected: 30, tolerance: 0, unit: 'kg',
  },
  {
    lesson: 'fractions', where: 'textbookContent: 2/3 of 90, two thirds', expectNotesIncludes: 'For $\\dfrac{2}{3}$ of 90 kg:',
    stated: '$30 \\times 2 = 60$, so two thirds is 60 kg.', pick: 2, compute: () => (90 / 3) * 2, expected: 60, tolerance: 0, unit: 'kg',
  },
  {
    lesson: 'fractions', where: 'textbookContent: rockets are mostly fuel', kind: 'claim', expectNotesIncludes: 'A large rocket on the launch pad is mostly fuel.',
    claimIncludes: 'more than four fifths of the mass at launch is fuel',
    verify: () => {
      const s = SATURN_V.propellant / SATURN_V.gross;
      const f = FALCON_9.propellant / FALCON_9.gross;
      return { holds: s > 0.8 && f > 0.8, detail: `Saturn V about ${(s * 100).toFixed(0)}%, Falcon 9 about ${(f * 100).toFixed(0)}% propellant at lift-off` };
    },
  },
];

/** A mixed number "w a/b" (three numbers from index i) as a value. */
const mixed = (i: number) => (n: number[]) => n[i] + n[i + 1] / n[i + 2];
const lcm = (x: number, y: number) => (x * y) / gcd(x, y);

/** One fraction-valued entry: `read` turns the numbers of `stated` into the value to compare. */
const fv = (
  lesson: string, where: string, fragment: string, stated: string, read: (n: number[]) => number, value: number,
): NumericEntry => ({
  lesson, where,
  ...(where.startsWith('textbookContent') ? { expectNotesIncludes: fragment } : { expectQuestionIncludes: fragment }),
  stated, combine: read, compute: () => value, expected: value, tolerance: 1e-9, unit: '',
});

const FO = 'fraction-ops';
const FO_SOLVED = 'Work out $\\dfrac{1}{3} + \\dfrac{1}{4}$.';
const FRACTION_OPS: Entry[] = [
  // Worked example: 1/3 + 1/4
  {
    lesson: FO, where: 'solvedExample.steps[0]', expectQuestionIncludes: FO_SOLVED,
    stated: 'Find a number that 3 and 4 both divide into: 12.', pick: 2, compute: () => lcm(3, 4), expected: 12, tolerance: 0, unit: '',
  },
  fv(FO, 'solvedExample.steps[1] (1/3)', FO_SOLVED, '$\\dfrac{1}{3} = \\dfrac{4}{12}$', frac(2), 1 / 3),
  fv(FO, 'solvedExample.steps[1] (1/4)', FO_SOLVED, '$\\dfrac{1}{4} = \\dfrac{3}{12}$', frac(2), 1 / 4),
  fv(FO, 'solvedExample.steps[2]', FO_SOLVED, '$\\dfrac{4}{12} + \\dfrac{3}{12} = \\dfrac{7}{12}$', frac(4), 4 / 12 + 3 / 12),
  fv(FO, 'solvedExample.resultFormula', FO_SOLVED, '= \\frac{7}{12}', frac(0), 1 / 3 + 1 / 4),
  // Practice
  fv(FO, 'practiceProblems[0]', 'Work out 1/2 + 1/3.', '5/6', frac(0), 1 / 2 + 1 / 3),
  fv(FO, 'practiceProblems[1]', 'Work out 5/6 − 1/4.', '7/12', frac(0), 5 / 6 - 1 / 4),
  fv(FO, 'practiceProblems[1] (5/6 in twelfths)', 'Work out 5/6 − 1/4.', '(10/12 − 3/12)', frac(0), 5 / 6),
  fv(FO, 'practiceProblems[1] (1/4 in twelfths)', 'Work out 5/6 − 1/4.', '(10/12 − 3/12)', frac(2), 1 / 4),
  fv(FO, 'practiceProblems[2]', 'Work out 2 1/4 + 1 2/3.', '3 11/12', mixed(0), 2 + 1 / 4 + 1 + 2 / 3),
  fv(FO, 'practiceProblems[3]', 'Work out 2/3 × 3/4', '1/2', frac(0), (2 / 3) * (3 / 4)),
  fv(FO, 'practiceProblems[3] (before simplifying)', 'Work out 2/3 × 3/4', '(6/12 simplified)', frac(0), (2 * 3) / (3 * 4)),
  fv(FO, 'practiceProblems[4]', 'Work out 3/5 × 1/2.', '3/10', frac(0), (3 / 5) * (1 / 2)),
  fv(FO, 'practiceProblems[5]', 'Two thirds of a water supply is shared equally between 4 astronauts.', '1/6', frac(0), 2 / 3 / 4),
  fv(FO, 'practiceProblems[5] (before simplifying)', 'Two thirds of a water supply is shared equally between 4 astronauts.', '(2/12 simplified)', frac(0), 2 / (3 * 4)),
  // Notes
  fv(FO, 'textbookContent: 2/7 + 3/7', 'When the denominators are the same', '$\\dfrac{2}{7} + \\dfrac{3}{7} = \\dfrac{5}{7}$', frac(4), 2 / 7 + 3 / 7),
  fv(FO, 'textbookContent: 1/2 in tenths', 'called a **common multiple**', '$\\dfrac{1}{2} + \\dfrac{1}{5} = \\dfrac{5}{10} + \\dfrac{2}{10} = \\dfrac{7}{10}$', frac(4), 1 / 2),
  fv(FO, 'textbookContent: 1/5 in tenths', 'called a **common multiple**', '$\\dfrac{1}{2} + \\dfrac{1}{5} = \\dfrac{5}{10} + \\dfrac{2}{10} = \\dfrac{7}{10}$', frac(6), 1 / 5),
  fv(FO, 'textbookContent: 1/2 + 1/5', 'called a **common multiple**', '$\\dfrac{1}{2} + \\dfrac{1}{5} = \\dfrac{5}{10} + \\dfrac{2}{10} = \\dfrac{7}{10}$', frac(8), 1 / 2 + 1 / 5),
  fv(FO, 'textbookContent: 3/4 in twelfths', 'Subtracting works the same way', '$\\dfrac{3}{4} - \\dfrac{1}{3} = \\dfrac{9}{12} - \\dfrac{4}{12} = \\dfrac{5}{12}$', frac(4), 3 / 4),
  fv(FO, 'textbookContent: 1/3 in twelfths', 'Subtracting works the same way', '$\\dfrac{3}{4} - \\dfrac{1}{3} = \\dfrac{9}{12} - \\dfrac{4}{12} = \\dfrac{5}{12}$', frac(6), 1 / 3),
  fv(FO, 'textbookContent: 3/4 - 1/3', 'Subtracting works the same way', '$\\dfrac{3}{4} - \\dfrac{1}{3} = \\dfrac{9}{12} - \\dfrac{4}{12} = \\dfrac{5}{12}$', frac(8), 3 / 4 - 1 / 3),
  fv(FO, 'textbookContent: mixed, 1/2 in sixths', 'To add mixed numbers', '$1\\tfrac{1}{2} + 2\\tfrac{1}{3} = 3 + \\dfrac{3}{6} + \\dfrac{2}{6} = 3\\tfrac{5}{6}$', frac(7), 1 / 2),
  fv(FO, 'textbookContent: mixed, 1/3 in sixths', 'To add mixed numbers', '$1\\tfrac{1}{2} + 2\\tfrac{1}{3} = 3 + \\dfrac{3}{6} + \\dfrac{2}{6} = 3\\tfrac{5}{6}$', frac(9), 1 / 3),
  fv(FO, 'textbookContent: mixed, sum', 'To add mixed numbers', '$1\\tfrac{1}{2} + 2\\tfrac{1}{3} = 3 + \\dfrac{3}{6} + \\dfrac{2}{6} = 3\\tfrac{5}{6}$', mixed(11), 1 + 1 / 2 + 2 + 1 / 3),
  fv(FO, 'textbookContent: 3 1/4 as quarters', 'turn each mixed number into an **improper fraction**', '$3\\tfrac{1}{4} - 1\\tfrac{1}{2} = \\dfrac{13}{4} - \\dfrac{6}{4} = \\dfrac{7}{4} = 1\\tfrac{3}{4}$', frac(6), 3 + 1 / 4),
  fv(FO, 'textbookContent: 1 1/2 as quarters', 'turn each mixed number into an **improper fraction**', '$3\\tfrac{1}{4} - 1\\tfrac{1}{2} = \\dfrac{13}{4} - \\dfrac{6}{4} = \\dfrac{7}{4} = 1\\tfrac{3}{4}$', frac(8), 1 + 1 / 2),
  fv(FO, 'textbookContent: 13/4 - 6/4', 'turn each mixed number into an **improper fraction**', '$3\\tfrac{1}{4} - 1\\tfrac{1}{2} = \\dfrac{13}{4} - \\dfrac{6}{4} = \\dfrac{7}{4} = 1\\tfrac{3}{4}$', frac(10), 3 + 1 / 4 - (1 + 1 / 2)),
  fv(FO, 'textbookContent: 1 3/4', 'turn each mixed number into an **improper fraction**', '$3\\tfrac{1}{4} - 1\\tfrac{1}{2} = \\dfrac{13}{4} - \\dfrac{6}{4} = \\dfrac{7}{4} = 1\\tfrac{3}{4}$', mixed(12), 7 / 4),
  fv(FO, 'textbookContent: 4/5 × 1/2', 'To multiply two fractions, multiply the numerators', '$\\dfrac{4}{5} \\times \\dfrac{1}{2} = \\dfrac{4}{10} = \\dfrac{2}{5}$', frac(4), (4 / 5) * (1 / 2)),
  fv(FO, 'textbookContent: 4/5 × 1/2 simplified', 'To multiply two fractions, multiply the numerators', '$\\dfrac{4}{5} \\times \\dfrac{1}{2} = \\dfrac{4}{10} = \\dfrac{2}{5}$', frac(6), (4 / 5) * (1 / 2)),
  fv(FO, 'textbookContent: half of a quarter', 'Half of a quarter is', '$\\dfrac{1}{2} \\times \\dfrac{1}{4} = \\dfrac{1}{8}$', frac(4), (1 / 2) * (1 / 4)),
  fv(FO, 'textbookContent: 1/2 ÷ 3', 'Half a bar shared between 3 people', '$\\dfrac{1}{2} \\div 3 = \\dfrac{1}{6}$', frac(3), 1 / 2 / 3),
  fv(FO, 'textbookContent: 3/4 ÷ 2', 'Keep the numerator and multiply the denominator', '$\\dfrac{3}{4} \\div 2 = \\dfrac{3}{8}$', frac(3), 3 / 4 / 2),
  fv(FO, 'textbookContent: battery, two drives', 'Each drive uses $\\dfrac{1}{8}$ of a full battery', '$\\dfrac{3}{4} - \\dfrac{2}{8}', frac(2), 2 * (1 / 8)),
  fv(FO, 'textbookContent: battery, 3/4 in eighths', 'Each drive uses $\\dfrac{1}{8}$ of a full battery', '= \\dfrac{6}{8} - \\dfrac{2}{8}', frac(0), 3 / 4),
  fv(FO, 'textbookContent: battery, 4/8', 'Each drive uses $\\dfrac{1}{8}$ of a full battery', '= \\dfrac{4}{8} = \\dfrac{1}{2}$', frac(0), 3 / 4 - 2 / 8),
  fv(FO, 'textbookContent: battery, half', 'Each drive uses $\\dfrac{1}{8}$ of a full battery', '= \\dfrac{4}{8} = \\dfrac{1}{2}$', frac(2), 3 / 4 - 2 / 8),
];

const DP = 'decimals-percentages';
const DP_SOLVED = 'A £40 shirt is on sale with 25% off.';
/** A plain numeric entry. */
const nv = (
  lesson: string, where: string, fragment: string, stated: string, pick: number, value: number, unit = '', tolerance = 1e-9,
): NumericEntry => ({
  lesson, where,
  ...(where.startsWith('textbookContent') || where.startsWith('conceptSteps') ? { expectNotesIncludes: fragment, expectQuestionIncludes: fragment } : { expectQuestionIncludes: fragment }),
  stated, pick, compute: () => value, expected: value, tolerance, unit,
});

const DECIMALS_PERCENTAGES: Entry[] = [
  // Concept steps
  nv(DP, 'conceptSteps[0] (3 ÷ 4)', 'To turn a fraction into a decimal', '$3 \\div 4 = 0.75$', 2, 3 / 4),
  nv(DP, 'conceptSteps[2] (20% of 50)', 'Build the percentage up from easy ones', '$0.2 \\times 50 = 10$', 2, 0.2 * 50),
  nv(DP, 'conceptSteps[2] (20% as a decimal)', 'Build the percentage up from easy ones', '$0.2 \\times 50 = 10$', 0, 20 / 100),
  // Worked example
  nv(DP, 'solvedExample.steps[0]', DP_SOLVED, '$25\\% = 0.25$', 1, 25 / 100),
  nv(DP, 'solvedExample.steps[1]', DP_SOLVED, '$40 \\times 0.25 = 10$', 2, 40 * 0.25, '£'),
  nv(DP, 'solvedExample.steps[2]', DP_SOLVED, '$40 - 10 = 30$', 2, 40 - 40 * 0.25, '£'),
  nv(DP, 'solvedExample.resultFormula (discount)', DP_SOLVED, '\\text{Discount} = \\pounds 10', 0, 40 * 0.25, '£'),
  nv(DP, 'solvedExample.resultFormula (sale price)', DP_SOLVED, '\\text{ sale price} = \\pounds 30', 0, 40 * 0.75, '£'),
  // Practice
  nv(DP, 'practiceProblems[0]', 'Write 4/5 as a percentage.', '80% (4/5 = 80/100)', 0, (4 / 5) * 100, '%'),
  fv(DP, 'practiceProblems[0] (hundredths)', 'Write 4/5 as a percentage.', '(4/5 = 80/100)', frac(2), 4 / 5),
  nv(DP, 'practiceProblems[1] (percentage)', 'Write 0.35 as a percentage', '35%', 0, 0.35 * 100, '%'),
  fv(DP, 'practiceProblems[1] (fraction)', 'Write 0.35 as a percentage', '7/20', frac(0), 0.35),
  {
    lesson: DP, where: 'practiceProblems[1] (simplest form)', kind: 'claim', expectQuestionIncludes: 'Write 0.35 as a percentage',
    claimIncludes: '7/20', verify: () => ({ holds: gcd(7, 20) === 1 && gcd(35, 100) === 5, detail: '35/100 ÷ 5 = 7/20, and 7 and 20 share no factor' }),
  },
  nv(DP, 'practiceProblems[2]', 'What is 15% of 200?', '30 (20 + 10)', 0, 0.15 * 200),
  nv(DP, 'practiceProblems[2] (10%)', 'What is 15% of 200?', '(20 + 10)', 0, 0.1 * 200),
  nv(DP, 'practiceProblems[2] (5%)', 'What is 15% of 200?', '(20 + 10)', 1, 0.05 * 200),
  {
    lesson: DP, where: 'practiceProblems[3]', kind: 'qualitative', expectQuestionIncludes: 'Which is largest: 0.6, 5/8 or 62%?',
    expectAnswerIncludes: '5/8, which is 62.5%',
    verify: () => ({ holds: 5 / 8 > 0.6 && 5 / 8 > 0.62 && 5 / 8 === 0.625, detail: '0.625 > 0.62 > 0.6' }),
  },
  nv(DP, 'practiceProblems[3] (hint)', 'Which is largest: 0.6, 5/8 or 62%?', '5/8, which is 62.5%', 2, (5 / 8) * 100, '%'),
  nv(DP, 'practiceProblems[4]', 'A fuel tank holds 800 litres and is 25% full.', '200 litres', 0, 800 * 0.25, 'litres'),
  nv(DP, 'practiceProblems[5]', 'A probe sends 20 pictures and 9 of them show clouds.', '45% (9/20 = 45/100)', 0, (9 / 20) * 100, '%'),
  fv(DP, 'practiceProblems[5] (hundredths)', 'A probe sends 20 pictures and 9 of them show clouds.', '(9/20 = 45/100)', frac(2), 9 / 20),
  // Notes
  fv(DP, 'textbookContent: 37%', '$37\\% = \\dfrac{37}{100} = 0.37$', '$37\\% = \\dfrac{37}{100} = 0.37$', (n) => n[3], 37 / 100),
  ...(
    [
      ['1/2', '| $\\dfrac{1}{2}$ | 0.5 | 50% |', 1 / 2],
      ['1/4', '| $\\dfrac{1}{4}$ | 0.25 | 25% |', 1 / 4],
      ['3/4', '| $\\dfrac{3}{4}$ | 0.75 | 75% |', 3 / 4],
      ['1/5', '| $\\dfrac{1}{5}$ | 0.2 | 20% |', 1 / 5],
      ['1/10', '| $\\dfrac{1}{10}$ | 0.1 | 10% |', 1 / 10],
      ['1/100', '| $\\dfrac{1}{100}$ | 0.01 | 1% |', 1 / 100],
    ] as const
  ).flatMap(([label, row, value]): Entry[] => [
    fv(DP, `textbookContent: table ${label}, fraction`, row, row, frac(0), value),
    fv(DP, `textbookContent: table ${label}, decimal`, row, row, (n) => n[2], value),
    fv(DP, `textbookContent: table ${label}, percentage`, row, row, (n) => n[3] / 100, value),
  ]),
  fv(DP, 'textbookContent: 3/5 in hundredths', '**Fraction to percentage:**', '$\\dfrac{3}{5} = \\dfrac{60}{100} = 60\\%$', frac(2), 3 / 5),
  fv(DP, 'textbookContent: 3/5 as a percentage', '**Fraction to percentage:**', '$\\dfrac{3}{5} = \\dfrac{60}{100} = 60\\%$', (n) => n[4] / 100, 3 / 5),
  nv(DP, 'textbookContent: 3/8 as a decimal', '**Fraction to decimal:**', '$\\dfrac{3}{8} = 3 \\div 8 = 0.375$', 4, 3 / 8),
  nv(DP, 'textbookContent: 0.65 as a percentage', '**Decimal to percentage:**', '$0.65 \\times 100 = 65\\%$', 2, 0.65 * 100, '%'),
  nv(DP, 'textbookContent: 42% as a decimal', '**Percentage to decimal:**', '$42\\% = 42 \\div 100 = 0.42$', 3, 42 / 100),
  nv(DP, 'textbookContent: 15% of 60, 10%', 'For 15% of 60:', '10% is 6 and 5% is 3', 1, 0.1 * 60),
  nv(DP, 'textbookContent: 15% of 60, 5%', 'For 15% of 60:', '10% is 6 and 5% is 3', 3, 0.05 * 60),
  nv(DP, 'textbookContent: 15% of 60', 'For 15% of 60:', '$6 + 3 = 9$', 2, 0.15 * 60),
  {
    lesson: DP, where: 'textbookContent: comparing', kind: 'claim', expectNotesIncludes: 'Which is biggest: 0.3, $\\dfrac{1}{4}$ or 28%?',
    claimIncludes: 'As percentages they are 30%, 25% and 28%, so 0.3 is the biggest.',
    verify: () => ({ holds: 0.3 * 100 === 30 && (1 / 4) * 100 === 25 && 0.3 > 0.28 && 0.3 > 0.25, detail: '0.3 = 30%, 1/4 = 25%, 30% > 28% > 25%' }),
  },
  fv(DP, 'textbookContent: 75% as a fraction', 'A tank showing 75% is', 'A tank showing 75% is $\\dfrac{3}{4}$ full', frac(1), 0.75),
  nv(DP, 'textbookContent: 75% of 600 litres', 'If the full tank holds 600 litres', '$600 \\div 4 \\times 3 = 450$', 3, 0.75 * 600, 'litres'),
];

const PR = 'proportions';
const PR_SOLVED = 'A car travels 150 miles on 15 litres of petrol.';
const MARS_WEIGHT_RATIO = 3.71 / 9.81; // surface gravity of Mars over Earth's, about 0.378

const PROPORTIONS: Entry[] = [
  // Worked example
  nv(PR, 'solvedExample.steps[1]', PR_SOLVED, '$150 \\div 15 = 10$ miles', 2, 150 / 15, 'miles per litre'),
  nv(PR, 'solvedExample.steps[2]', PR_SOLVED, '$10 \\times 24 = 240$ miles', 2, (150 / 15) * 24, 'miles'),
  nv(PR, 'solvedExample.resultFormula', PR_SOLVED, '\\text{Distance} = 240', 0, (150 * 24) / 15, 'miles'),
  // Practice
  fv(PR, 'practiceProblems[0]', 'Write the ratio 12 : 18 in its simplest form.', '2 : 3', frac(0), 12 / 18),
  {
    lesson: PR, where: 'practiceProblems[0] (simplest)', kind: 'claim', expectQuestionIncludes: 'Write the ratio 12 : 18 in its simplest form.',
    claimIncludes: '2 : 3', verify: () => ({ holds: gcd(12, 18) === 6 && gcd(2, 3) === 1, detail: '12 : 18 ÷ 6 = 2 : 3' }),
  },
  nv(PR, 'practiceProblems[1] (first share)', 'Share £60 in the ratio 2 : 3.', '£24 and £36', 0, (60 / 5) * 2, '£'),
  nv(PR, 'practiceProblems[1] (second share)', 'Share £60 in the ratio 2 : 3.', '£24 and £36', 1, (60 / 5) * 3, '£'),
  nv(PR, 'practiceProblems[2]', '3 apples cost £2. How much do 9 apples cost?', '£6', 0, (2 / 3) * 9, '£'),
  nv(PR, 'practiceProblems[3]', 'A map uses 1 cm for every 10 km.', '4.5 cm', 0, 45 / 10, 'cm'),
  nv(PR, 'practiceProblems[4]', 'Food for 4 astronauts lasts 30 days.', '20 days', 0, (4 * 30) / 6, 'days'),
  nv(PR, 'practiceProblems[4] (astronaut-days)', 'Food for 4 astronauts lasts 30 days.', '4 × 30 = 120 astronaut-days', 2, 4 * 30, 'astronaut-days'),
  nv(PR, 'practiceProblems[5]', 'A rover weighs 9,000 N on Earth.', '3,420 N', 0, 0.38 * 9000, 'N'),
  {
    lesson: PR, where: 'practiceProblems[5] (0.38)', kind: 'claim', expectQuestionIncludes: 'Weight on Mars is 0.38 times weight on Earth.',
    claimIncludes: '3,420 N',
    verify: () => ({ holds: Math.abs(MARS_WEIGHT_RATIO - 0.38) < 0.005, detail: `g on Mars ÷ g on Earth = 3.71 ÷ 9.81 = ${MARS_WEIGHT_RATIO.toFixed(3)}` }),
  },
  // Notes
  fv(PR, 'textbookContent: 15 : 25', 'To write a ratio in its **simplest form**', '$$15 : 25 = 3 : 5', frac(2), 15 / 25),
  nv(PR, 'textbookContent: 15 : 25, divide by', 'To write a ratio in its **simplest form**', '(dividing both by 5)', 0, gcd(15, 25)),
  fv(PR, 'textbookContent: 2 : 3, first part of the whole', 'In $2 : 3$ there are $2 + 3 = 5$ parts', 'the first quantity is $\\dfrac{2}{5}$ of the total', frac(0), 2 / (2 + 3)),
  fv(PR, 'textbookContent: 2 : 3, second part of the whole', 'In $2 : 3$ there are $2 + 3 = 5$ parts', 'the second is $\\dfrac{3}{5}$', frac(0), 3 / (2 + 3)),
  fv(PR, 'textbookContent: 2 : 3, first of second', 'In $2 : 3$ there are $2 + 3 = 5$ parts', 'The first is $\\dfrac{2}{3}$ of the second.', frac(0), 2 / 3),
  nv(PR, 'textbookContent: share £40, parts', 'To share £40 in the ratio $3 : 5$', '$3 + 5 = 8$ parts', 2, 3 + 5),
  nv(PR, 'textbookContent: share £40, one part', 'To share £40 in the ratio $3 : 5$', '$40 \\div 8 = 5$', 2, 40 / 8, '£'),
  nv(PR, 'textbookContent: share £40, first', 'To share £40 in the ratio $3 : 5$', '$3 \\times 5 = £15$', 2, (40 / 8) * 3, '£'),
  nv(PR, 'textbookContent: share £40, second', 'To share £40 in the ratio $3 : 5$', '$5 \\times 5 = £25$', 2, (40 / 8) * 5, '£'),
  nv(PR, 'textbookContent: paint, one litre', 'If 5 litres of paint cover 30 m²', '$30 \\div 5 = 6$ m²', 2, 30 / 5, 'm²'),
  nv(PR, 'textbookContent: paint, 8 litres', 'If 5 litres of paint cover 30 m²', '$6 \\times 8 = 48$ m²', 2, (30 / 5) * 8, 'm²'),
  nv(PR, 'textbookContent: journey at 50 km/h', 'At 50 km/h a journey takes 6 hours', 'Speed × time is 300 each time.', 0, 50 * 6, 'km'),
  nv(PR, 'textbookContent: journey at 100 km/h', 'At 50 km/h a journey takes 6 hours', 'at 100 km/h it takes 3 hours', 1, 300 / 100, 'hours'),
  {
    lesson: PR, where: 'textbookContent: Mars weight ratio', kind: 'claim', expectNotesIncludes: 'Your weight on Mars is directly proportional',
    claimIncludes: 'it is about $0.38$ times as much',
    verify: () => ({ holds: Math.abs(MARS_WEIGHT_RATIO - 0.38) < 0.005, detail: `3.71 ÷ 9.81 = ${MARS_WEIGHT_RATIO.toFixed(3)}` }),
  },
  nv(PR, 'textbookContent: astronaut on Mars', 'An astronaut who weighs 800 N on Earth', '$0.38 \\times 800 = 304$ N', 2, 0.38 * 800, 'N'),
];

const BG = 'basic-geometry';
const BG_SOLVED = 'A rectangular garden is $l = 8$ metres long and $w = 3$ metres wide.';
const rectP = (l: number, w: number) => 2 * l + 2 * w;
/** Perimeter of an l by w rectangle with a cl by cw rectangle cut from one corner, adding all six sides. */
const lShapeP = (l: number, w: number, cl: number, cw: number) => l + w + (l - cl) + cw + cl + (w - cw);

const BASIC_GEOMETRY: Entry[] = [
  // Worked example
  nv(BG, 'solvedExample.steps[1]', BG_SOLVED, '$A = 8 \\times 3 = 24$', 2, 8 * 3, 'm²'),
  nv(BG, 'solvedExample.steps[1] (in words)', BG_SOLVED, 'The area is 24 square metres.', 0, 8 * 3, 'm²'),
  nv(BG, 'solvedExample.steps[3] (two lengths)', BG_SOLVED, '= 16 + 6 = 22$', 0, 2 * 8, 'm'),
  nv(BG, 'solvedExample.steps[3] (two widths)', BG_SOLVED, '= 16 + 6 = 22$', 1, 2 * 3, 'm'),
  nv(BG, 'solvedExample.steps[3]', BG_SOLVED, '= 16 + 6 = 22$', 2, rectP(8, 3), 'm'),
  nv(BG, 'solvedExample.steps[3] (in words)', BG_SOLVED, 'The perimeter is 22 metres.', 0, rectP(8, 3), 'm'),
  nv(BG, 'solvedExample.resultFormula (area)', BG_SOLVED, 'A = 24', 0, 8 * 3, 'm²'),
  nv(BG, 'solvedExample.resultFormula (perimeter)', BG_SOLVED, 'P = 22', 0, rectP(8, 3), 'm'),
  // Practice
  nv(BG, 'practiceProblems[0]', 'A square has sides 4 cm long.', '16 cm²', 0, 4 * 4, 'cm²'),
  nv(BG, 'practiceProblems[1]', 'A rectangle has a perimeter of 20 m and a length of 6 m.', '4 m', 0, (20 - 2 * 6) / 2, 'm'),
  nv(BG, 'practiceProblems[2] (area)', 'A rectangle is 7 cm long and 5 cm wide.', 'Area 35 cm²', 0, 7 * 5, 'cm²'),
  nv(BG, 'practiceProblems[2] (perimeter)', 'A rectangle is 7 cm long and 5 cm wide.', 'perimeter 24 cm', 0, rectP(7, 5), 'cm'),
  nv(BG, 'practiceProblems[3] (area)', 'A rectangle 10 m by 6 m has a 4 m by 2 m rectangle cut from one corner', 'Area 52 m² (60 − 8)', 0, 10 * 6 - 4 * 2, 'm²'),
  nv(BG, 'practiceProblems[3] (big area)', 'A rectangle 10 m by 6 m has a 4 m by 2 m rectangle cut from one corner', '(60 − 8)', 0, 10 * 6, 'm²'),
  nv(BG, 'practiceProblems[3] (cut-out)', 'A rectangle 10 m by 6 m has a 4 m by 2 m rectangle cut from one corner', '(60 − 8)', 1, 4 * 2, 'm²'),
  nv(BG, 'practiceProblems[3] (perimeter)', 'A rectangle 10 m by 6 m has a 4 m by 2 m rectangle cut from one corner', 'perimeter 32 m', 0, lShapeP(10, 6, 4, 2), 'm'),
  nv(BG, 'practiceProblems[4] (4 by 6 area)', 'two rectangles that each have an area of 24 cm²', '4 cm by 6 cm', 0, 24 / 6, 'cm'),
  nv(BG, 'practiceProblems[4] (4 by 6 perimeter)', 'two rectangles that each have an area of 24 cm²', '(perimeter 20 cm)', 0, rectP(4, 6), 'cm'),
  nv(BG, 'practiceProblems[4] (3 by 8 area)', 'two rectangles that each have an area of 24 cm²', '3 cm by 8 cm', 0, 24 / 8, 'cm'),
  nv(BG, 'practiceProblems[4] (3 by 8 perimeter)', 'two rectangles that each have an area of 24 cm²', '(perimeter 22 cm)', 0, rectP(3, 8), 'cm'),
  nv(BG, 'practiceProblems[5]', 'Each solar panel on a space station is 3 m by 2 m.', '5 panels', 0, 30 / (3 * 2), 'panels'),
  nv(BG, 'practiceProblems[5] (one panel)', 'Each solar panel on a space station is 3 m by 2 m.', '(each is 6 m²)', 0, 3 * 2, 'm²'),
  // Notes
  nv(BG, 'textbookContent: 5 by 3 rectangle', 'A rectangle 5 squares long and 3 squares wide', '$A = l \\times w = 5 \\times 3 = 15$ cm²', 2, 5 * 3, 'cm²'),
  nv(BG, 'textbookContent: L shape, big area', 'Take a rectangle 8 m by 6 m with a 3 m by 2 m corner removed', '$8 \\times 6 = 48$', 2, 8 * 6, 'm²'),
  nv(BG, 'textbookContent: L shape, cut-out', 'Take a rectangle 8 m by 6 m with a 3 m by 2 m corner removed', 'take away $3 \\times 2 = 6$', 2, 3 * 2, 'm²'),
  nv(BG, 'textbookContent: L shape, area', 'Take a rectangle 8 m by 6 m with a 3 m by 2 m corner removed', 'The area is 42 m².', 0, 8 * 6 - 3 * 2, 'm²'),
  nv(BG, 'textbookContent: L shape, perimeter', 'Take a rectangle 8 m by 6 m with a 3 m by 2 m corner removed', '$2 \\times 8 + 2 \\times 6 = 28$ m', 4, lShapeP(8, 6, 3, 2), 'm'),
  ...(
    [
      [4, 4, '| 4 cm by 4 cm | 16 cm² | 16 cm |'],
      [2, 8, '| 2 cm by 8 cm | 16 cm² | 20 cm |'],
      [1, 16, '| 1 cm by 16 cm | 16 cm² | 34 cm |'],
    ] as const
  ).flatMap(([l, w, row]): Entry[] => [
    nv(BG, `textbookContent: ${l} by ${w}, area`, row, row, 2, l * w, 'cm²'),
    nv(BG, `textbookContent: ${l} by ${w}, perimeter`, row, row, 3, rectP(l, w), 'cm'),
  ]),
  nv(BG, 'textbookContent: same perimeter, 3 by 3', 'A 3 cm by 3 cm square and a 1 cm by 5 cm rectangle', 'both have a perimeter of 12 cm', 0, rectP(3, 3), 'cm'),
  nv(BG, 'textbookContent: same perimeter, 1 by 5', 'A 3 cm by 3 cm square and a 1 cm by 5 cm rectangle', 'both have a perimeter of 12 cm', 0, rectP(1, 5), 'cm'),
  nv(BG, 'textbookContent: same perimeter, 3 by 3 area', 'A 3 cm by 3 cm square and a 1 cm by 5 cm rectangle', 'their areas are 9 cm² and 5 cm²', 0, 3 * 3, 'cm²'),
  nv(BG, 'textbookContent: same perimeter, 1 by 5 area', 'A 3 cm by 3 cm square and a 1 cm by 5 cm rectangle', 'their areas are 9 cm² and 5 cm²', 1, 1 * 5, 'cm²'),
  nv(BG, 'textbookContent: solar panel', 'A panel 4 m long and 2 m wide', '$4 \\times 2 = 8$ m²', 2, 4 * 2, 'm²'),
  nv(BG, 'textbookContent: ten panels', 'A panel 4 m long and 2 m wide', 'so ten of them cover 80 m²', 0, 10 * 4 * 2, 'm²'),
  nv(BG, 'textbookContent: 5 m square', 'A square with sides of 5 m has an area of', '$5 \\times 5 = 25$ m²', 2, 5 * 5, 'm²'),
];

const ER = 'exponents-roots';
const ER_SOLVED = 'Write $2^3 \\times 2^4$ as a single power of 2';
const SPEED_OF_LIGHT = 299792458; // m/s, exact by definition of the metre
const claim = (where: string, fragment: string, claimIncludes: string, holds: boolean, detail: string): Entry => ({
  lesson: ER, where, kind: 'claim',
  ...(where.startsWith('textbookContent') ? { expectNotesIncludes: fragment } : { expectQuestionIncludes: fragment }),
  claimIncludes, verify: () => ({ holds, detail }),
});
const powersOf = (b: number, k: number) => Array.from({ length: k }, (_, i) => b ** (i + 1));
const sameList = (x: number[], y: number[]) => x.length === y.length && x.every((v, i) => v === y[i]);

const EXPONENTS_ROOTS: Entry[] = [
  // Concept steps
  nv(ER, 'conceptSteps[0] (2^4)', 'In $a^n$, the base $a$ appears $n$ times', '$2^4 = 2 \\times 2 \\times 2 \\times 2 = 16$', 5, 2 ** 4),
  claim('conceptSteps[1] (square root of 9)', 'A root undoes a power.', 'The square root of 9 is 3, because $3^2 = 9$.', Math.sqrt(9) === 3 && 3 ** 2 === 9, '3 × 3 = 9'),
  claim('conceptSteps[1] (cube root of 8)', 'A root undoes a power.', 'The cube root of 8 is 2, because $2^3 = 8$.', Math.cbrt(8) === 2 && 2 ** 3 === 8, '2 × 2 × 2 = 8'),
  claim('conceptSteps[1] (root 2)', 'A root undoes a power.', 'A decimal such as 1.41 for $\\sqrt{2}$ is only close', Math.abs(Math.SQRT2 - 1.41) < 0.005 && 1.41 ** 2 !== 2, `√2 = ${Math.SQRT2.toFixed(5)}, 1.41² = ${(1.41 ** 2).toFixed(4)}`),
  nv(ER, 'conceptSteps[2] (3000)', 'So 3000 is $3 \\times 10^3$.', 'So 3000 is $3 \\times 10^3$.', 1, 3000),
  // Worked example
  claim('solvedExample.steps[0]', ER_SOLVED, '$2^3 \\times 2^4 = 2^{3+4} = 2^7$', 2 ** 3 * 2 ** 4 === 2 ** 7, '2³ × 2⁴ = 8 × 16 = 128 = 2⁷'),
  nv(ER, 'solvedExample.steps[1]', ER_SOLVED, '$2^7 = 128$', 1, 2 ** 7),
  nv(ER, 'solvedExample.steps[2] (2^3)', ER_SOLVED, '$2^3 = 8$', 1, 2 ** 3),
  nv(ER, 'solvedExample.steps[2] (2^4)', ER_SOLVED, '$2^4 = 16$', 1, 2 ** 4),
  nv(ER, 'solvedExample.steps[2] (8 × 16)', ER_SOLVED, '$8 \\times 16 = 128$', 2, 8 * 16),
  nv(ER, 'solvedExample.resultFormula', ER_SOLVED, '= 128', 0, 2 ** 3 * 2 ** 4),
  // Practice
  nv(ER, 'practiceProblems[0]', 'What is $3^2$?', '9', 0, 3 ** 2),
  nv(ER, 'practiceProblems[1]', 'What is $2^5$?', '32', 0, 2 ** 5),
  nv(ER, 'practiceProblems[2]', 'What is $\\sqrt{144}$?', '12', 0, Math.sqrt(144)),
  nv(ER, 'practiceProblems[3]', 'What is the cube root of 64?', '4, because 4 × 4 × 4 = 64', 0, Math.cbrt(64)),
  nv(ER, 'practiceProblems[3] (check)', 'What is the cube root of 64?', '4, because 4 × 4 × 4 = 64', 4, 4 ** 3),
  { ...nv(ER, 'practiceProblems[4]', 'The Sun is about 150,000,000 km from Earth.', '$1.5 \\times 10^8$ km', 0, 150000000, 'km'), relTolerance: 1e-9 },
  { ...nv(ER, 'practiceProblems[5]', 'Write 0.0031 in standard form.', '$3.1 \\times 10^{-3}$', 0, 0.0031), relTolerance: 1e-9 },
  {
    lesson: ER, where: 'practiceProblems[6]', kind: 'qualitative', expectQuestionIncludes: 'Which is larger: $4.2 \\times 10^5$ or $9.8 \\times 10^4$?',
    expectAnswerIncludes: '$4.2 \\times 10^5$, which is 420,000',
    verify: () => ({ holds: 4.2e5 > 9.8e4, detail: '420,000 > 98,000' }),
  },
  nv(ER, 'practiceProblems[6] (420,000)', 'Which is larger: $4.2 \\times 10^5$ or $9.8 \\times 10^4$?', 'which is 420,000', 0, 4.2e5),
  nv(ER, 'practiceProblems[6] (98,000)', 'Which is larger: $4.2 \\times 10^5$ or $9.8 \\times 10^4$?', 'The other is 98,000.', 0, 9.8e4),
  // Notes
  nv(ER, 'textbookContent: 3^4', 'In $3^4$, the 3 is the **base**', '$3^4 = 3 \\times 3 \\times 3 \\times 3 = 81$', 5, 3 ** 4),
  ...(
    [
      [2, '| 2 | 2, 4, 8, 16, 32, 64 |', 6],
      [3, '| 3 | 3, 9, 27, 81 |', 4],
      [4, '| 4 | 4, 16, 64 |', 3],
      [5, '| 5 | 5, 25, 125 |', 3],
    ] as const
  ).map(([b, row, k]) => {
    const listed = row.split('|')[2].split(',').map((t) => Number(t.trim()));
    return claim(`textbookContent: powers of ${b}`, 'It helps to recognise the first few powers', row, sameList(listed, powersOf(b, k)), `${b}¹ to ${b}^${k}: ${powersOf(b, k).join(', ')}`);
  }),
  claim('textbookContent: square root of 49', 'A root undoes a power.', '$\\sqrt{49} = 7$', Math.sqrt(49) === 7, '7 × 7 = 49'),
  claim('textbookContent: cube root of 27', 'A root undoes a power.', '$\\sqrt[3]{27} = 3$', Math.cbrt(27) === 3, '3 × 3 × 3 = 27'),
  { ...nv(ER, 'textbookContent: root 2', 'Most roots do not come out as whole numbers.', '$\\sqrt{2}$ is 1.41421...', 1, Math.SQRT2), tolerance: 1e-5 },
  claim('textbookContent: multiplying rule', '| Multiplying: add the indices |', '$3^2 \\times 3^3 = 3^5$', 3 ** 2 * 3 ** 3 === 3 ** 5, '9 × 27 = 243 = 3⁵'),
  claim('textbookContent: dividing rule', '| Dividing: subtract the indices |', '$\\dfrac{5^6}{5^2} = 5^4$', 5 ** 6 / 5 ** 2 === 5 ** 4, '15,625 ÷ 25 = 625 = 5⁴'),
  claim('textbookContent: power of a power', '| Power of a power: multiply the indices |', '$(3^2)^3 = 3^6$', (3 ** 2) ** 3 === 3 ** 6, '9³ = 729 = 3⁶'),
  claim('textbookContent: power of zero', '| Power of zero (when $a$ is not 0) |', '$7^0 = 1$', 7 ** 0 === 1, '7⁰ = 1'),
  { ...nv(ER, 'textbookContent: negative index', '| Negative index |', '$10^{-3} = \\dfrac{1}{1000}$', 0, 1 / 1000), relTolerance: 1e-9 },
  { ...fv(ER, 'textbookContent: negative index (fraction)', '| Negative index |', '$10^{-3} = \\dfrac{1}{1000}$', frac(1), 10 ** -3), tolerance: 1e-12 },
  { ...nv(ER, 'textbookContent: 93,000,000', 'A large number has a positive power of ten', '$93{,}000{,}000 = 9.3 \\times 10^7$', 0, 9.3e7), pick: [0, 1], relTolerance: 1e-9 },
  { ...nv(ER, 'textbookContent: 0.00056', 'A number smaller than 1 has a negative power of ten', '$0.00056 = 5.6 \\times 10^{-4}$', 0, 5.6e-4), pick: [0, 1], relTolerance: 1e-9 },
  claim('textbookContent: comparing', 'To compare two numbers in standard form', '$2 \\times 10^8$ is larger than $9 \\times 10^7$', 2e8 > 9e7, '200,000,000 > 90,000,000'),
  { ...nv(ER, 'textbookContent: speed of light', 'Scientists use standard form for numbers like these.', 'Light travels about $3 \\times 10^8$ metres every second.', 0, SPEED_OF_LIGHT, 'm/s'), relTolerance: 0.01 },
];

/** A claim in any lesson. */
const claim2 = (lesson: string, where: string, fragment: string, claimIncludes: string, holds: boolean, detail: string): Entry => ({
  lesson, where, kind: 'claim',
  ...(where.startsWith('textbookContent') || where.startsWith('conceptSteps') ? { expectNotesIncludes: fragment, expectQuestionIncludes: fragment } : { expectQuestionIncludes: fragment }),
  claimIncludes, verify: () => ({ holds, detail }),
});

const ME = 'measures';
const ME_SOLVED = 'The International Space Station flies about 400 km above the Earth.';
// Exact definitions (Weights and Measures Act 1985, Schedule 1): yard = 0.9144 m, pound = 0.45359237 kg,
// gallon = 4.54609 litres, pint = gallon / 8.
const INCH_CM = 2.54;
const MILE_KM = (1760 * 0.9144) / 1000;
const POUND_KG = 0.45359237;
const PINT_L = 4.54609 / 8;
const MEASURES: Entry[] = [
  // Concept steps
  nv(ME, 'conceptSteps[0] (door)', 'A door 2 m tall is also 200 cm tall.', 'A door 2 m tall is also 200 cm tall.', 1, 2 * 100),
  { ...nv(ME, 'conceptSteps[3] (inch)', 'Before metric units, Britain used imperial units', '1 inch is about 2.5 cm', 1, INCH_CM), tolerance: 0.05 },
  { ...nv(ME, 'conceptSteps[3] (kg in pounds)', 'Before metric units, Britain used imperial units', '1 kg is about 2.2 pounds', 1, 1 / POUND_KG), tolerance: 0.01 },
  { ...nv(ME, 'conceptSteps[3] (5 miles)', 'Before metric units, Britain used imperial units', '5 miles is about 8 km', 1, 5 * MILE_KM), tolerance: 0.1 },
  claim2(ME, 'conceptSteps[3] (pint)', 'Before metric units, Britain used imperial units', '1 pint is a little more than half a litre', PINT_L > 0.5 && PINT_L < 0.6, `1 pint = ${PINT_L} litres`),
  claim2(ME, 'conceptSteps[4] (mile longer than km)', 'A mile is longer than a kilometre', 'A mile is longer than a kilometre', MILE_KM > 1, `1 mile = ${MILE_KM} km`),
  // Worked example
  nv(ME, 'solvedExample.steps[0] (400 × 1,000)', ME_SOLVED, '$400 \\times 1{,}000 = 400{,}000$', 2, 400 * 1000),
  nv(ME, 'solvedExample.steps[0] (400,000 m)', ME_SOLVED, 'so that is 400,000 m', 0, 400 * 1000, 'm'),
  nv(ME, 'solvedExample.steps[1]', ME_SOLVED, '$400 \\div 8 = 50$', 2, 400 / 8),
  nv(ME, 'solvedExample.steps[2]', ME_SOLVED, '$50 \\times 5 = 250$', 2, (400 / 8) * 5),
  nv(ME, 'solvedExample.resultFormula (m)', ME_SOLVED, '= 400{,}000\\text{ m}', 0, 400 * 1000, 'm'),
  { ...nv(ME, 'solvedExample.resultFormula (miles, against the exact mile)', ME_SOLVED, '\\approx 250\\text{ miles}', 0, 400 / MILE_KM, 'miles'), tolerance: 2 },
  // Practice
  nv(ME, 'practiceProblems[0]', 'Convert 3.5 km to metres.', '3,500 m', 0, 3.5 * 1000, 'm'),
  nv(ME, 'practiceProblems[1]', 'A pencil is 17 cm long.', '170 mm', 0, 17 * 10, 'mm'),
  nv(ME, 'practiceProblems[2]', 'Convert 45 mm to centimetres.', '4.5 cm', 0, 45 / 10, 'cm'),
  {
    lesson: ME, where: 'practiceProblems[3]', kind: 'qualitative', expectQuestionIncludes: 'Which is longer: 1.2 km or 1,150 m?',
    expectAnswerIncludes: '1.2 km, which is 1,200 m',
    verify: () => ({ holds: 1.2 * 1000 > 1150, detail: '1,200 m > 1,150 m' }),
  },
  nv(ME, 'practiceProblems[3] (1,200 m)', 'Which is longer: 1.2 km or 1,150 m?', '1.2 km, which is 1,200 m', 1, 1.2 * 1000, 'm'),
  nv(ME, 'practiceProblems[4]', 'A bag of potatoes has a mass of 2,750 g.', '2.75 kg', 0, 2750 / 1000, 'kg'),
  nv(ME, 'practiceProblems[5]', 'A water bottle holds 1.5 litres.', '1,500 ml', 0, 1.5 * 1000, 'ml'),
  nv(ME, 'practiceProblems[6]', 'Mount Everest is 8,849 m high.', '8.849 km', 0, 8849 / 1000, 'km'),
  nv(ME, 'practiceProblems[7]', 'A road sign says it is 15 miles to the next town.', 'About 24 km', 0, (15 / 5) * 8, 'km'),
  { ...nv(ME, 'practiceProblems[7] (against the exact mile)', 'A road sign says it is 15 miles to the next town.', 'About 24 km', 0, 15 * MILE_KM, 'km'), tolerance: 0.5 },
  nv(ME, 'practiceProblems[8]', 'A ruler is 30 cm long.', 'About 12 inches', 0, 30 / 2.5, 'inches'),
  { ...nv(ME, 'practiceProblems[8] (against the exact inch)', 'A ruler is 30 cm long.', 'About 12 inches', 0, 30 / INCH_CM, 'inches'), tolerance: 0.5 },
  nv(ME, 'practiceProblems[9]', 'An airline lets you take a 20 kg suitcase.', 'About 44 pounds', 0, 20 * 2.2, 'pounds'),
  { ...nv(ME, 'practiceProblems[9] (against the exact pound)', 'An airline lets you take a 20 kg suitcase.', 'About 44 pounds', 0, 20 / POUND_KG, 'pounds'), tolerance: 0.5 },
  // Notes
  nv(ME, 'textbookContent: 6 km', '6 km to metres', '$6 \\times 1{,}000 = 6{,}000$', 2, 6 * 1000),
  nv(ME, 'textbookContent: 6 km (result)', '6 km to metres', 'so 6 km = 6,000 m', 1, 6 * 1000, 'm'),
  nv(ME, 'textbookContent: 250 cm', '250 cm to metres', '$250 \\div 100 = 2.5$', 2, 250 / 100),
  nv(ME, 'textbookContent: 250 cm (result)', '250 cm to metres', 'so 250 cm = 2.5 m', 1, 250 / 100, 'm'),
  nv(ME, 'textbookContent: 4.2 cm', '4.2 cm to millimetres', '$4.2 \\times 10 = 42$', 2, 4.2 * 10),
  nv(ME, 'textbookContent: 4.2 cm (result)', '4.2 cm to millimetres', 'so 4.2 cm = 42 mm', 1, 4.2 * 10, 'mm'),
  nv(ME, 'textbookContent: m to mm factor', 'From metres to millimetres is two steps down', 'which is $\\times 1{,}000$ altogether', 0, 100 * 10),
  nv(ME, 'textbookContent: 3 m', 'From metres to millimetres is two steps down', 'So 3 m = 3,000 mm.', 1, 3 * 1000, 'mm'),
  nv(ME, 'textbookContent: 3.4 kg', 'They work like length.', '3.4 kg = 3,400 g', 1, 3.4 * 1000, 'g'),
  nv(ME, 'textbookContent: 750 ml', 'They work like length.', '750 ml = 0.75 l', 1, 750 / 1000, 'l'),
  nv(ME, 'textbookContent: 1,234 m', 'Dividing by 1,000 can give three decimal places.', 'A path 1,234 m long is 1.234 km.', 1, 1234 / 1000, 'km'),
  nv(ME, 'textbookContent: 5 m', 'Dividing by 1,000 can give three decimal places.', 'A 5 m rope is 0.005 km', 1, 5 / 1000, 'km'),
  { ...nv(ME, 'textbookContent: inch', '| Imperial unit | Roughly in metric |', '| 1 inch | 2.5 cm |', 1, INCH_CM, 'cm'), tolerance: 0.05 },
  { ...nv(ME, 'textbookContent: mile', '| Imperial unit | Roughly in metric |', '| 1 mile | 1.6 km |', 1, MILE_KM, 'km'), tolerance: 0.01 },
  { ...nv(ME, 'textbookContent: pound', '| Imperial unit | Roughly in metric |', '| 1 pound (lb) | 0.45 kg', 1, POUND_KG, 'kg'), tolerance: 0.005 },
  { ...nv(ME, 'textbookContent: kg in pounds', '| Imperial unit | Roughly in metric |', 'so 1 kg is about 2.2 pounds', 1, 1 / POUND_KG, 'pounds'), tolerance: 0.01 },
  { ...nv(ME, 'textbookContent: pint', '| Imperial unit | Roughly in metric |', '| 1 pint | 0.57 litres', 1, PINT_L, 'litres'), tolerance: 0.005 },
  claim2(ME, 'textbookContent: exact inch', 'Some imperial units are now defined exactly', '1 inch is exactly 2.54 cm', Math.abs(0.9144 / 36 - 0.0254) < 1e-12, 'yard 0.9144 m ÷ 36 = 0.0254 m'),
  { ...nv(ME, 'textbookContent: exact mile', 'Some imperial units are now defined exactly', '1 mile is exactly 1.609344 km', 1, MILE_KM, 'km'), tolerance: 1e-9 },
  { ...nv(ME, 'textbookContent: exact pound', 'Some imperial units are now defined exactly', '1 pound is exactly 0.45359237 kg', 1, POUND_KG, 'kg'), tolerance: 1e-12 },
  nv(ME, 'textbookContent: 20 miles (lots)', '20 miles to kilometres', '$20 \\div 5 = 4$', 2, 20 / 5),
  nv(ME, 'textbookContent: 20 miles (km)', '20 miles to kilometres', '$4 \\times 8 = 32$', 2, (20 / 5) * 8),
  { ...nv(ME, 'textbookContent: 20 miles (against the exact mile)', '20 miles to kilometres', 'so about 32 km', 0, 20 * MILE_KM, 'km'), tolerance: 0.5 },
  nv(ME, 'textbookContent: 40 km (lots)', '40 km to miles', '$40 \\div 8 = 5$', 2, 40 / 8),
  nv(ME, 'textbookContent: 40 km (miles)', '40 km to miles', '$5 \\times 5 = 25$', 2, (40 / 8) * 5),
  { ...nv(ME, 'textbookContent: 40 km (against the exact mile)', '40 km to miles', 'so about 25 miles', 0, 40 / MILE_KM, 'miles'), tolerance: 0.5 },
  claim2(ME, 'textbookContent: kg heavier than pound', 'A kilogram is heavier than a pound', 'A kilogram is heavier than a pound', 1 > POUND_KG, `1 pound = ${POUND_KG} kg`),
];

export const ENTRIES: Entry[] = [
  ...ARITHMETIC, ...NEGATIVE_NUMBERS, ...MULTIPLICATION, ...FRACTIONS, ...FRACTION_OPS, ...DECIMALS_PERCENTAGES,
  ...PROPORTIONS, ...BASIC_GEOMETRY, ...EXPONENTS_ROOTS, ...MEASURES,
];
