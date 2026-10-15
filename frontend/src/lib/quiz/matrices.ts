/**
 * Quiz for "Matrices and Rotations" (KAN-86): adding and scaling, multiplying, and transformations.
 * A-level further maths. Matrices are written [[a,b;c,d]] and drawn as grids by the quiz panel.
 */
import { D, int, pick, sameNumber, shuffle, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';

export type Round = 'add' | 'multiply' | 'transform';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  add: { label: 'Add, subtract and scale', blurb: 'Matching positions, or every entry times the number.' },
  multiply: { label: 'Multiply matrices', blurb: 'Each entry is a row of the first times a column of the second.' },
  transform: { label: 'Transformations', blurb: 'Where a matrix moves a point, and which transformation it is.' },
};

type M = [number, number, number, number]; // a, b, c, d: [[a, b], [c, d]]
export type MatricesCheck =
  | { kind: 'add' | 'sub' | 'scale'; a: M; b: M | null; k: number; answer: M }
  | { kind: 'mul'; a: M; b: M; answer: M }
  | { kind: 'apply'; m: M; p: [number, number]; answer: [number, number] }
  | { kind: 'name'; m: M; answer: string };
type Question = Q<MatricesCheck>;

/** Matrices shown on the lesson page and in its earlier practice questions. The quiz never asks these. */
const SHOWN = new Set(['2,1,0,3', '1,-1,4,2', '1,0,2,-1', '1,2,3,4', '0,1,1,0', '1,0,0,-1', '0,-1,1,0']);

const sn = (x: number) => (x < 0 ? `−${-x}` : String(x));
const mat = (m: M) => `[[${sn(m[0])},${sn(m[1])};${sn(m[2])},${sn(m[3])}]]`;
const vec = (v: [number, number]) => `[[${sn(v[0])};${sn(v[1])}]]`;
const rand = (r: () => number): M => [int(r, -4, 6), int(r, -4, 6), int(r, -4, 6), int(r, -4, 6)];
const POS = ['top left', 'top right', 'bottom left', 'bottom right'] as const;

/** Four number steps, one per entry. */
function entrySteps(answer: M, how: (i: number) => string, slip?: (i: number) => number | null, slipText?: string): Step[] {
  return POS.map((p, i) => ({
    type: 'number' as const,
    prompt: `What is the ${p} entry?`,
    answer: D(answer[i]),
    feedback: (g: Parameters<typeof sameNumber>[0]) => {
      const s = slip?.(i);
      return s !== null && s !== undefined && s !== answer[i] && sameNumber(g, s) && slipText ? slipText : how(i);
    },
  }));
}

function addScale(r: () => number): Question {
  for (;;) {
    const kind = pick(r, ['add', 'sub', 'scale'] as const);
    const a = rand(r);
    const b = kind === 'scale' ? null : rand(r);
    const k = kind === 'scale' ? pick(r, [2, 3, 4, -2, -3]) : 1;
    if (SHOWN.has(a.join(',')) || (b && SHOWN.has(b.join(',')))) continue;
    const answer = a.map((x, i) => (kind === 'scale' ? k * x : kind === 'add' ? x + b![i] : x - b![i])) as M;
    const expr = kind === 'scale' ? `${sn(k)}A` : kind === 'add' ? 'A + B' : 'A − B';
    const right = kind === 'scale' ? `Multiply every entry by ${sn(k)}` : `${kind === 'add' ? 'Add' : 'Take away'} the entries in matching positions`;
    const options = shuffle(r, [right, kind === 'scale' ? `Multiply only the top row by ${sn(k)}` : 'Multiply rows by columns', kind === 'scale' ? `Add ${sn(k)} to every entry` : 'Add all the entries together']);
    const correct = options.indexOf(right);
    return {
      round: 'add',
      prompt: kind === 'scale' ? `A = ${mat(a)}. Work out ${expr}.` : `A = ${mat(a)} and B = ${mat(b!)}. Work out ${expr}.`,
      steps: [
        { type: 'choice', prompt: `How do you work out ${expr}?`, options, correct, why: whyAll(options, correct, () => (kind === 'scale' ? 'Multiplying a matrix by a number multiplies every entry.' : 'Matrices of the same size are added or taken away position by position.')) },
        ...entrySteps(answer, (i) => (kind === 'scale' ? `${sn(k)} × ${sn(a[i])}.` : `${sn(a[i])} ${kind === 'add' ? '+' : '−'} ${b![i] < 0 ? `(${sn(b![i])})` : sn(b![i])}.`)),
      ],
      workings: [right + '.', `So ${expr} = ${mat(answer)}.`],
      check: { kind, a, b, k, answer },
    };
  }
}

function multiply(r: () => number): Question {
  for (;;) {
    const a: M = [int(r, -3, 5), int(r, -3, 5), int(r, -3, 5), int(r, -3, 5)];
    const b: M = [int(r, -3, 5), int(r, -3, 5), int(r, -3, 5), int(r, -3, 5)];
    if (SHOWN.has(a.join(',')) || SHOWN.has(b.join(','))) continue;
    const answer: M = [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3]];
    const pairwise = (i: number) => a[i] * b[i]; // the slip: multiplying matching positions
    const right = 'A row of A times a column of B, multiplied in pairs and added';
    const options = shuffle(r, [right, 'Multiply the numbers in matching positions', 'A column of A times a row of B']);
    const correct = options.indexOf(right);
    const row = (i: number) => (i < 2 ? 0 : 2);
    const colB = (i: number) => i % 2;
    const how = (i: number) => {
      const ra = [a[row(i)], a[row(i) + 1]];
      const cb = [b[colB(i)], b[colB(i) + 2]];
      return `Row ${row(i) / 2 + 1} of A times column ${colB(i) + 1} of B: ${sn(ra[0])} × ${cb[0] < 0 ? `(${sn(cb[0])})` : sn(cb[0])} + ${sn(ra[1])} × ${cb[1] < 0 ? `(${sn(cb[1])})` : sn(cb[1])}.`;
    };
    return {
      round: 'multiply',
      prompt: `A = ${mat(a)} and B = ${mat(b)}. Work out AB.`,
      steps: [
        { type: 'choice', prompt: 'How is each entry of AB made?', options, correct, why: whyAll(options, correct, () => 'Each entry of AB is a row of A times a column of B: multiply in pairs, then add.') },
        ...entrySteps(answer, how, pairwise, 'That multiplies the numbers in matching positions. Take a row of A and a column of B, multiply in pairs and add.'),
      ],
      workings: [`Top left: row 1 of A times column 1 of B = ${sn(answer[0])}. Top right: row 1 times column 2 = ${sn(answer[1])}.`, `Bottom left: row 2 times column 1 = ${sn(answer[2])}. Bottom right: row 2 times column 2 = ${sn(answer[3])}.`, `So AB = ${mat(answer)}.`],
      check: { kind: 'mul', a, b, answer },
    };
  }
}

const NAMED: { m: M; name: string }[] = [
  { m: [0, -1, 1, 0], name: 'Rotation 90° anticlockwise about the origin' },
  { m: [0, 1, -1, 0], name: 'Rotation 90° clockwise about the origin' },
  { m: [-1, 0, 0, -1], name: 'Rotation 180° about the origin' },
  { m: [1, 0, 0, -1], name: 'Reflection in the x-axis' },
  { m: [-1, 0, 0, 1], name: 'Reflection in the y-axis' },
  { m: [0, 1, 1, 0], name: 'Reflection in the line y = x' },
  { m: [2, 0, 0, 2], name: 'Enlargement, scale factor 2, centre the origin' },
  { m: [3, 0, 0, 3], name: 'Enlargement, scale factor 3, centre the origin' },
];

function transform(r: () => number): Question {
  for (;;) {
    if (r() < 0.5) {
      const m: M = r() < 0.5 ? pick(r, NAMED).m : rand(r);
      const p: [number, number] = [int(r, -5, 6), int(r, -5, 6)];
      if (p[0] === 0 && p[1] === 0) continue;
      const answer: [number, number] = [m[0] * p[0] + m[1] * p[1], m[2] * p[0] + m[3] * p[1]];
      return {
        round: 'transform',
        prompt: `The matrix ${mat(m)} acts on the point (${sn(p[0])}, ${sn(p[1])}). Where does the point go?`,
        steps: [
          { type: 'number', prompt: `Multiply the matrix by the position vector ${vec(p)}. What is the new x? (Row 1 times the vector.)`, answer: D(answer[0]), feedback: () => `${sn(m[0])} × ${p[0] < 0 ? `(${sn(p[0])})` : sn(p[0])} + ${sn(m[1])} × ${p[1] < 0 ? `(${sn(p[1])})` : sn(p[1])}.` },
          { type: 'number', prompt: 'And the new y? (Row 2 times the vector.)', answer: D(answer[1]), feedback: () => `${sn(m[2])} × ${p[0] < 0 ? `(${sn(p[0])})` : sn(p[0])} + ${sn(m[3])} × ${p[1] < 0 ? `(${sn(p[1])})` : sn(p[1])}.` },
        ],
        workings: [`${mat(m)} ${vec(p)} = ${vec(answer)}.`, `So the point goes to (${sn(answer[0])}, ${sn(answer[1])}).`],
        check: { kind: 'apply', m, p, answer },
      };
    }
    const target = pick(r, NAMED);
    if (SHOWN.has(target.m.join(','))) continue;
    const options = shuffle(r, [target.name, ...shuffle(r, NAMED.filter((x) => x.name !== target.name)).slice(0, 3).map((x) => x.name)]);
    const correct = options.indexOf(target.name);
    return {
      round: 'transform',
      prompt: `What transformation does the matrix ${mat(target.m)} do?`,
      steps: [
        { type: 'number', prompt: 'The first column is where (1, 0) goes. What is its x?', answer: D(target.m[0]), feedback: () => 'Read the top of the first column.' },
        { type: 'number', prompt: 'And its y?', answer: D(target.m[2]), feedback: () => 'Read the bottom of the first column.' },
        { type: 'number', prompt: 'The second column is where (0, 1) goes. What is its x?', answer: D(target.m[1]), feedback: () => 'Read the top of the second column.' },
        { type: 'number', prompt: 'And its y?', answer: D(target.m[3]), feedback: () => 'Read the bottom of the second column.' },
        { type: 'choice', prompt: `So (1, 0) goes to (${sn(target.m[0])}, ${sn(target.m[2])}) and (0, 1) goes to (${sn(target.m[1])}, ${sn(target.m[3])}). Which transformation is it?`, options, correct, why: whyAll(options, correct, () => 'Sketch where the two points go, and match the movement.') },
      ],
      workings: [`(1, 0) goes to (${sn(target.m[0])}, ${sn(target.m[2])}) and (0, 1) goes to (${sn(target.m[1])}, ${sn(target.m[3])}).`, `So it is: ${target.name}.`],
      check: { kind: 'name', m: target.m, answer: target.name },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'multiply') return multiply(r);
  if (round === 'transform') return transform(r);
  return addScale(r);
}

export const matricesQuiz: LessonQuiz<MatricesCheck> = {
  lesson: 'matrices',
  storageKey: 'stella-quiz-matrices-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};

