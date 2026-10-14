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
    lesson: 'multiplication', where: 'textbookContent: ISS orbits, 365 × 10', expectNotesIncludes: 'goes round the Earth about 16 times a day',
    stated: '$365 \\times 16 = (365 \\times 10) + (365 \\times 6) = 3{,}650 + 2{,}190 = 5{,}840$', pick: 6, compute: () => 365 * 10, expected: 3650, tolerance: 0, unit: 'orbits',
  },
  {
    lesson: 'multiplication', where: 'textbookContent: ISS orbits, 365 × 6', expectNotesIncludes: 'goes round the Earth about 16 times a day',
    stated: '$365 \\times 16 = (365 \\times 10) + (365 \\times 6) = 3{,}650 + 2{,}190 = 5{,}840$', pick: 7, compute: () => 365 * 6, expected: 2190, tolerance: 0, unit: 'orbits',
  },
  {
    lesson: 'multiplication', where: 'textbookContent: ISS orbits in a year', expectNotesIncludes: 'goes round the Earth about 16 times a day',
    stated: '$365 \\times 16 = (365 \\times 10) + (365 \\times 6) = 3{,}650 + 2{,}190 = 5{,}840$', pick: 8,
    compute: () => 365 * ISS_ORBITS_PER_DAY_LESSON, expected: 5840, tolerance: 0, unit: 'orbits',
    note: 'With the true figure of about 15.5 orbits a day the year has about 5,660; the lesson says "about 16" and "roughly".',
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
    lesson: 'fractions', where: 'solvedExample.steps[2] (top)', expectQuestionIncludes: 'total mass of $10\\,000$ kg, and $7500$ kg of it is fuel',
    stated: '$7500 \\div 2500 = 3$', pick: 2, compute: () => 7500 / 2500, expected: 3, tolerance: 0, unit: '',
  },
  {
    lesson: 'fractions', where: 'solvedExample.steps[2] (bottom)', expectQuestionIncludes: 'total mass of $10\\,000$ kg, and $7500$ kg of it is fuel',
    stated: '$10\\,000 \\div 2500 = 4$', pick: 2, compute: () => 10000 / 2500, expected: 4, tolerance: 0, unit: '',
  },
  {
    lesson: 'fractions', where: 'solvedExample.steps[2] (2500 is the biggest common factor)', expectQuestionIncludes: 'total mass of $10\\,000$ kg, and $7500$ kg of it is fuel',
    stated: 'dividing the top and the bottom by 2500', compute: () => gcd(7500, 10000), expected: 2500, tolerance: 0, unit: '',
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
    claimIncludes: 'the bottom is 1½ times the top',
    verify: () => ({ holds: 3 / 2 === 1.5, detail: 'in 2/3 the bottom is 3 ÷ 2 = 1.5 times the top, and scaling keeps that' }),
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

export const ENTRIES: Entry[] = [...ARITHMETIC, ...NEGATIVE_NUMBERS, ...MULTIPLICATION, ...FRACTIONS];
