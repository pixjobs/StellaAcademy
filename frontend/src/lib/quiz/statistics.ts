/**
 * Quiz for "Mean, Variance and Standard Deviation" (KAN-84): averages and range, a missing value, standard
 * deviation from data and from summary statistics. Key stage 3 to A-level; calculator answers to 3 s.f.
 */
import { D, approx, sf3, fmt, int, pick, sameNumber, shuffle, toNumber, whyAll, type LessonQuiz, type Question as Q } from '@/lib/quiz/core';

export type Round = 'averages' | 'missing' | 'spread';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  averages: { label: 'Averages and range', blurb: 'Mean, median and range, one step at a time.' },
  missing: { label: 'A missing value', blurb: 'Work back from the mean to a value you do not know.' },
  spread: { label: 'Standard deviation', blurb: 'From the data, or from n, Σx and Σx². Use a calculator; give 3 significant figures.' },
};

export type StatisticsCheck =
  | { kind: 'mean' | 'median' | 'range'; data: number[]; answer: number }
  | { kind: 'missing'; mean: number; known: number[]; answer: number }
  | { kind: 'sd'; data: number[]; answer: number }
  | { kind: 'summary'; n: number; sx: number; sxx: number; answer: number };
type Question = Q<StatisticsCheck>;

/** Data shown on the lesson page. The quiz never asks these. */
const SHOWN = new Set(['2,4,4,4,5,5,7,9', '99,100,100,101', '50,80,120,150', '3,7,7,9,12,15', '2,4,6,8', '-22,-21,-20,-19,-18', 'summary 10 50 290', 'summary 8 40 232', 'missing 80 70,75,85,90']);

const key = (xs: number[]) => [...xs].sort((a, b) => a - b).join(',');
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
/** An exact value to 2 decimal places where there is one (15.25), else 3 s.f.; either way 3 s.f. typed is right. */
const exactOr3sf = (x: number) => (Number.isInteger(Math.round(x * 1e6) / 1e4) ? { ...approx(x), answer: D(Number(x.toFixed(2))), shown: fmt(D(Number(x.toFixed(2)))) } : approx(x));
const CONTEXTS = ['Find the', 'A sensor records these readings. Find the', 'These are the times, in seconds, for a ball to roll down a ramp. Find the', 'These are the numbers of goals scored in some matches. Find the'];
const show = (x: number) => (Number.isInteger(x * 100) ? fmt(D(Number(x.toFixed(2)))) : sf3(x));

// ---------------------------------------------------------------------------------------------
// Averages and range
// ---------------------------------------------------------------------------------------------

function averages(r: () => number): Question {
  for (;;) {
    const n = int(r, 5, 8);
    const data = Array.from({ length: n }, () => int(r, 1, 30));
    if (SHOWN.has(key(data))) continue;
    const sorted = [...data].sort((a, b) => a - b);
    const list = data.join(', ');
    const kind = pick(r, ['mean', 'median', 'range'] as const);
    if (kind === 'mean') {
      const total = sum(data);
      const mean = total / n;
      return {
        round: 'averages',
        prompt: `${pick(r, CONTEXTS)} mean of ${list}.`,
        steps: [
          { type: 'number', prompt: 'Add up all the values.', answer: D(total), feedback: () => 'Add every value in the list.' },
          { type: 'number', prompt: 'How many values are there?', answer: D(n), feedback: () => 'Count the values.' },
          { type: 'number', prompt: `So what is the mean? (Exact, or 3 significant figures.)`, ...exactOr3sf(mean), feedback: () => `${total} ÷ ${n}.` },
        ],
        workings: [`Total: ${total}. There are ${n} values.`, `Mean = ${total} ÷ ${n} = ${show(mean)}.`],
        check: { kind: 'mean', data, answer: mean },
      };
    }
    if (kind === 'median') {
      const odd = n % 2 === 1;
      const median = odd ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
      const asWritten = odd ? data[(n - 1) / 2] : (data[n / 2 - 1] + data[n / 2]) / 2; // the slip: not putting them in order
      const options = shuffle(r, ['Put them in order', 'Take the middle one as they are written', 'Add them up']);
      const correct = options.indexOf('Put them in order');
      return {
        round: 'averages',
        prompt: `${pick(r, CONTEXTS)} median of ${list}.`,
        steps: [
          { type: 'choice', prompt: 'What do you do first?', options, correct, why: whyAll(options, correct, () => 'The median is the middle value of the data in order, smallest to largest.') },
          { type: 'number', prompt: `There are ${n} values. Which position is the middle? (For an even number, it is halfway between two positions, such as 3.5.)`, answer: D((n + 1) / 2), feedback: () => `(${n} + 1) ÷ 2.` },
          {
            type: 'number',
            prompt: `So what is the median?`,
            answer: D(median),
            feedback: (g) => (asWritten !== median && sameNumber(g, asWritten) ? 'That is the middle of the list as written. Put the values in order first.' : odd ? 'Count to the middle of the ordered list.' : 'Halfway between the two middle values of the ordered list.'),
          },
        ],
        workings: [`In order: ${sorted.join(', ')}.`, odd ? `The middle value is number ${(n + 1) / 2}: ${median}.` : `The middle two are ${sorted[n / 2 - 1]} and ${sorted[n / 2]}, so the median is ${fmt(D(median))}.`],
        check: { kind: 'median', data, answer: median },
      };
    }
    const range = sorted[n - 1] - sorted[0];
    return {
      round: 'averages',
      prompt: `${pick(r, CONTEXTS)} range of ${list}.`,
      steps: [
        { type: 'number', prompt: 'What is the largest value?', answer: D(sorted[n - 1]), feedback: () => 'Look for the biggest number.' },
        { type: 'number', prompt: 'What is the smallest value?', answer: D(sorted[0]), feedback: () => 'Look for the smallest number.' },
        { type: 'number', prompt: 'So what is the range?', answer: D(range), feedback: (g) => (sameNumber(g, data[n - 1] - data[0]) && data[n - 1] - data[0] !== range ? 'That is the last value take away the first. Use the largest and the smallest.' : 'Largest take away smallest.') },
      ],
      workings: [`Largest ${sorted[n - 1]}, smallest ${sorted[0]}.`, `Range = ${sorted[n - 1]} − ${sorted[0]} = ${range}.`],
      check: { kind: 'range', data, answer: range },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// A missing value
// ---------------------------------------------------------------------------------------------

function missing(r: () => number): Question {
  for (;;) {
    const n = int(r, 4, 7);
    const tests = r() < 0.5;
    // Every value, the missing one too, is drawn from the same spread; the mean must then be a whole number.
    const centre = tests ? int(r, 40, 85) : int(r, 10, 90);
    const all = Array.from({ length: n }, () => Math.min(tests ? 100 : 999, int(r, centre - 15, centre + 15)));
    const total = sum(all);
    if (total % n !== 0 || all.some((x) => x < 1)) continue;
    const mean = total / n;
    const answer = all[n - 1];
    const known = all.slice(0, -1);
    if (SHOWN.has(`missing ${mean} ${key(known)}`)) continue;
    const ctx = tests ? `The mean of ${n} test scores (out of 100) is ${mean}. ${n - 1} of them are ${known.join(', ')}.` : `A sensor takes ${n} readings with a mean of ${mean}. ${n - 1} of them are ${known.join(', ')}.`;
    return {
      round: 'missing',
      prompt: `${ctx} What is the other one?`,
      steps: [
        { type: 'number', prompt: `What must all ${n} values add up to?`, answer: D(total), feedback: () => 'Multiply the mean by the number of values.' },
        { type: 'number', prompt: `What do the ${n - 1} values you know add up to?`, answer: D(sum(known)), feedback: () => 'Add them.' },
        { type: 'number', prompt: 'So what is the missing value?', answer: D(answer), feedback: () => 'Take the known total from the total of all of them.' },
      ],
      workings: [`All ${n} add up to ${mean} × ${n} = ${total}.`, `The others add up to ${sum(known)}.`, `So the missing value is ${total} − ${sum(known)} = ${answer}.`],
      check: { kind: 'missing', mean, known, answer },
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Standard deviation
// ---------------------------------------------------------------------------------------------

function spread(r: () => number): Question {
  for (;;) {
    if (r() < 0.5) {
      // From data, with a whole-number mean so the distances are easy.
      const n = int(r, 4, 6);
      const mean = int(r, 8, 20); // so no value goes below zero
      const data = Array.from({ length: n - 1 }, () => mean + int(r, -6, 6));
      data.push(mean * n - sum(data));
      if (data[n - 1] < 0 || Math.abs(data[n - 1] - mean) > 10 || SHOWN.has(key(data))) continue;
      const ss = sum(data.map((x) => (x - mean) ** 2));
      if (ss === 0) continue;
      const variance = ss / n;
      const sd = Math.sqrt(variance);
      const sdSample = Math.sqrt(ss / (n - 1));
      return {
        round: 'spread',
        prompt: `${pick(r, ['A sensor records these readings.', 'These are the lengths, in cm, of some leaves.', 'These are the marks of a small group in a short test.'])} Find their standard deviation: ${data.join(', ')}.`,
        steps: [
          { type: 'number', prompt: 'What is the mean?', answer: D(mean), feedback: () => `Add them and divide by ${n}.` },
          { type: 'number', prompt: `Square each distance from the mean, and add them up. Σ(x − x̄)^{2} = ?`, answer: D(ss), feedback: () => `For each value, take away ${mean}, square it, then add the squares.` },
          {
            type: 'number',
            prompt: 'Divide by n, the number of values. What is the variance? (Exact, or 3 significant figures.)',
            ...exactOr3sf(variance),
            feedback: (g) => (Math.abs(toNumber(g) - ss / (n - 1)) <= (ss / (n - 1)) * 0.003 ? `That divides by ${n - 1}. This lesson divides by n, the number of values.` : `Divide ${ss} by the number of values.`),
          },
          {
            type: 'number',
            prompt: 'Take the square root. What is the standard deviation, σ? (3 significant figures, or exact.)',
            ...(Number.isInteger(sd) ? { answer: D(sd) } : approx(sd)),
            feedback: (g) => (Math.abs(toNumber(g) - variance) < 0.006 * Math.max(1, variance) ? 'That is the variance. The standard deviation is its square root.' : Math.abs(toNumber(g) - sdSample) < 0.006 * sdSample ? `That divides by ${n - 1}. This lesson divides by n, ${n}.` : `√${show(variance)}.`),
          },
        ],
        workings: [`Mean = ${mean}.`, `Σ(x − x̄)^{2} = ${ss}, so the variance is ${ss} ÷ ${n} = ${show(variance)}.`, `σ = √${show(variance)} = ${Number.isInteger(sd) ? sd : show(sd)}.`],
        check: { kind: 'sd', data, answer: sd },
      };
    }
    // From summary statistics.
    const n = pick(r, [5, 8, 10, 20, 25]);
    const mean = int(r, 2, 15);
    const variance = int(r, 1, 20);
    const sx = mean * n;
    const sxx = n * (variance + mean * mean);
    if (SHOWN.has(`summary ${n} ${sx} ${sxx}`)) continue;
    const sd = Math.sqrt(variance);
    const notSquared = sxx / n - mean;
    return {
      round: 'spread',
      prompt: `For ${n} readings, Σx = ${fmt(D(sx))} and Σx^{2} = ${fmt(D(sxx))}. Find the mean and the standard deviation.`,
      steps: [
        { type: 'number', prompt: 'What is the mean, x̄?', answer: D(mean), feedback: () => `Σx ÷ n: ${sx} ÷ ${n}.` },
        { type: 'number', prompt: 'What is Σx^{2} ÷ n?', answer: D(sxx / n), feedback: () => `${sxx} ÷ ${n}.` },
        {
          type: 'number',
          prompt: 'The variance is Σx^{2} ÷ n − x̄^{2}. What is it?',
          answer: D(variance),
          feedback: (g) => (sameNumber(g, notSquared) ? 'Square the mean before taking it away.' : `${sxx / n} − ${mean}^{2}.`),
        },
        {
          type: 'number',
          prompt: 'So what is the standard deviation, σ? (3 significant figures, or exact.)',
          ...(Number.isInteger(sd) ? { answer: D(sd) } : approx(sd)),
          feedback: (g) => (sameNumber(g, variance) ? 'That is the variance. The standard deviation is its square root.' : `√${variance}.`),
        },
      ],
      workings: [`x̄ = ${sx} ÷ ${n} = ${mean}.`, `Variance = ${fmt(D(sxx))} ÷ ${n} − ${mean}^{2} = ${sxx / n} − ${mean * mean} = ${variance}.`, `σ = √${variance} = ${Number.isInteger(sd) ? sd : show(sd)}.`],
      check: { kind: 'summary', n, sx, sxx, answer: sd },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'missing') return missing(r);
  if (round === 'spread') return spread(r);
  return averages(r);
}

export const statisticsQuiz: LessonQuiz<StatisticsCheck> = {
  lesson: 'statistics',
  storageKey: 'stella-quiz-statistics-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
