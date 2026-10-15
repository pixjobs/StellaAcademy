/**
 * Quiz for "Area and Perimeter" (KAN-76): rectangles, missing sides and L shapes. Years 5 and 6.
 * Built on lib/quiz/core.ts; every length is a whole number.
 */
import { D, int, pick, sameNumber, shuffle, whyAll, type LessonQuiz, type Question as Q, type Step } from '@/lib/quiz/core';

export type Round = 'rectangles' | 'missing' | 'shapes';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  rectangles: { label: 'Rectangles', blurb: 'Area is length × width. Perimeter is all the way round.' },
  missing: { label: 'Missing sides', blurb: 'Work back from the perimeter or the area to a missing side.' },
  shapes: { label: 'L shapes', blurb: 'A rectangle with a corner cut out: its area and its perimeter.' },
};

export type GeometryCheck =
  | { kind: 'rect'; l: number; w: number; area: number; perimeter: number }
  | { kind: 'compare'; a: [number, number]; b: [number, number]; longer: string }
  | { kind: 'width-from-p'; l: number; p: number; w: number }
  | { kind: 'width-from-a'; l: number; a: number; w: number }
  | { kind: 'L'; L: number; W: number; cl: number; cw: number; area: number; perimeter: number }
  | { kind: 'notch'; L: number; W: number; nw: number; nd: number; area: number; perimeter: number };
type Question = Q<GeometryCheck>;

/** Examples shown on the lesson page, and the earlier practice questions. The quiz never asks these. */
const SHOWN = new Set(['rect 8 3', 'rect 5 3', 'rect 4 4', 'rect 8 2', 'rect 16 1', 'rect 3 3', 'rect 5 1', 'rect 4 2', 'rect 5 5', 'rect 7 5', 'rect 3 2', 'rect 6 4', 'L 8 6 3 2', 'L 10 6 4 2', 'p 20 6']);

const UNITS = [
  { len: 'cm', area: 'cm²', thing: (l: number, w: number) => `A photo is ${l} cm long and ${w} cm wide.` },
  { len: 'm', area: 'm²', thing: (l: number, w: number) => `A patio is ${l} m long and ${w} m wide.` },
  { len: 'm', area: 'm²', thing: (l: number, w: number) => `A garden is ${l} m long and ${w} m wide.` },
];

function areaRuleStep(r: () => number): Step {
  const options = shuffle(r, ['length × width', 'length + width', '2 × length + 2 × width']);
  const correct = options.indexOf('length × width');
  return { type: 'choice', prompt: 'Which rule gives the area of a rectangle?', options, correct, why: whyAll(options, correct, (o) => (o.startsWith('2 ×') ? 'That is the perimeter, the distance round the edge. Area is the space inside: rows of squares.' : 'Area counts the squares inside: there are width rows of length squares.')) };
}
function perimeterRuleStep(r: () => number): Step {
  const options = shuffle(r, ['2 × length + 2 × width', 'length + width', 'length × width']);
  const correct = options.indexOf('2 × length + 2 × width');
  return { type: 'choice', prompt: 'Which rule gives the perimeter?', options, correct, why: whyAll(options, correct, (o) => (o === 'length + width' ? 'That is only two of the four sides.' : 'That is the area. The perimeter is the distance all the way round: two lengths and two widths.')) };
}

function rectangle(r: () => number): Question {
  for (;;) {
    const l = int(r, 3, 15);
    const w = int(r, 2, l - 1);
    const u = pick(r, UNITS);
    if (SHOWN.has(`rect ${l} ${w}`)) continue;
    // Year 6: sometimes two rectangles with the same area, comparing their perimeters.
    if (r() < 0.3) {
      const area = l * w;
      const other = [...Array(area).keys()].map((k) => k + 1).filter((x) => area % x === 0 && x !== l && x !== w && x >= area / x && x <= 24);
      if (!other.length) continue;
      const l2 = pick(r, other);
      const w2 = area / l2;
      if (SHOWN.has(`rect ${l2} ${w2}`)) continue;
      const p1 = 2 * l + 2 * w;
      const p2 = 2 * l2 + 2 * w2;
      if (p1 === p2) continue;
      const A = `${l} ${u.len} by ${w} ${u.len}`;
      const B = `${l2} ${u.len} by ${w2} ${u.len}`;
      const longer = p1 > p2 ? A : B;
      const options = shuffle(r, [A, B]);
      return {
        round: 'rectangles',
        prompt: `Two rectangles both have an area of ${area} ${u.area}: ${A}, and ${B}. Which has the longer perimeter?`,
        steps: [
          { type: 'number', prompt: `What is the perimeter of the ${A} rectangle?`, answer: D(p1), unit: u.len, feedback: () => `Two lengths and two widths: 2 × ${l} + 2 × ${w}.` },
          { type: 'number', prompt: `What is the perimeter of the ${B} rectangle?`, answer: D(p2), unit: u.len, feedback: () => `Two lengths and two widths: 2 × ${l2} + 2 × ${w2}.` },
          { type: 'choice', prompt: 'So which has the longer perimeter?', options, correct: options.indexOf(longer), why: whyAll(options, options.indexOf(longer), () => `Compare ${p1} ${u.len} and ${p2} ${u.len}. The same area can have different perimeters.`) },
        ],
        workings: [`${A}: perimeter ${p1} ${u.len}.`, `${B}: perimeter ${p2} ${u.len}.`, `So the ${longer} rectangle has the longer perimeter, ${longer === A ? p1 : p2} ${u.len}, though both have an area of ${area} ${u.area}.`],
        check: { kind: 'compare', a: [l, w], b: [l2, w2], longer },
      };
    }
    const area = l * w;
    const perimeter = 2 * l + 2 * w;
    return {
      round: 'rectangles',
      prompt: `${u.thing(l, w)} Find its area and its perimeter.`,
      steps: [
        areaRuleStep(r),
        { type: 'number', prompt: `So what is the area? ${l} × ${w} = ?`, answer: D(area), unit: u.area, feedback: (g) => (sameNumber(g, perimeter) ? 'That is the perimeter. The area is length × width.' : `Work out ${l} × ${w}.`) },
        perimeterRuleStep(r),
        {
          type: 'number',
          prompt: `So what is the perimeter?`,
          answer: D(perimeter),
          unit: u.len,
          feedback: (g) => (sameNumber(g, l + w) ? `That is only two sides. Add all four: ${l} + ${w} + ${l} + ${w}.` : sameNumber(g, area) ? 'That is the area. The perimeter is the distance round the edge.' : `2 × ${l} + 2 × ${w}.`),
        },
      ],
      workings: [`Area: ${l} × ${w} = ${area} ${u.area}.`, `Perimeter: 2 × ${l} + 2 × ${w} = ${2 * l} + ${2 * w} = ${perimeter} ${u.len}.`, `So the area is ${area} ${u.area} and the perimeter is ${perimeter} ${u.len}.`],
      check: { kind: 'rect', l, w, area, perimeter },
    };
  }
}

function missing(r: () => number): Question {
  for (;;) {
    const l = int(r, 4, 20);
    const w = int(r, 2, l - 1);
    const u = pick(r, UNITS);
    if (r() < 0.6) {
      const p = 2 * l + 2 * w;
      if (SHOWN.has(`p ${p} ${l}`)) continue;
      return {
        round: 'missing',
        prompt: `A rectangle has a perimeter of ${p} ${u.len} and a length of ${l} ${u.len}. What is its width?`,
        steps: [
          { type: 'number', prompt: `The perimeter has two lengths. What do the two lengths add up to?`, answer: D(2 * l), unit: u.len, feedback: () => `2 × ${l}.` },
          {
            type: 'number',
            prompt: `So what is left of the perimeter for the two widths?`,
            answer: D(2 * w),
            unit: u.len,
            feedback: (g) => (sameNumber(g, p - l) ? `There are two lengths in the perimeter, so take away ${2 * l}, not ${l}.` : `Work out ${p} − ${2 * l}.`),
          },
          {
            type: 'number',
            prompt: `So what is one width?`,
            answer: D(w),
            unit: u.len,
            feedback: (g) => (sameNumber(g, 2 * w) ? 'That is both widths together. Halve it.' : sameNumber(g, (p - l) / 2) ? `There are two lengths: take ${2 * l} off, then halve.` : `Halve ${2 * w}.`),
          },
        ],
        workings: [`Two lengths: 2 × ${l} = ${2 * l} ${u.len}.`, `Two widths: ${p} − ${2 * l} = ${2 * w} ${u.len}.`, `One width: ${2 * w} ÷ 2 = ${w} ${u.len}.`],
        check: { kind: 'width-from-p', l, p, w },
      };
    }
    if (l > 12 || SHOWN.has(`rect ${l} ${w}`)) continue; // dividing by 12 or less keeps it to the times tables
    const a = l * w;
    const options = shuffle(r, [`${a} ÷ ${l}`, `${a} − ${l}`, `${a} × ${l}`]);
    const correct = options.indexOf(`${a} ÷ ${l}`);
    return {
      round: 'missing',
      prompt: `A rectangle has an area of ${a} ${u.area} and a length of ${l} ${u.len}. What is its width?`,
      steps: [
        { type: 'choice', prompt: `Area = length × width. So which calculation gives the width?`, options, correct, why: whyAll(options, correct, () => `${l} × width = ${a}, so the width is ${a} shared into ${l}: divide.`) },
        { type: 'number', prompt: `So what is the width?`, answer: D(w), unit: u.len, feedback: () => `Work out ${a} ÷ ${l}.` },
      ],
      workings: [`Area = length × width, so ${l} × width = ${a}.`, `Width = ${a} ÷ ${l} = ${w} ${u.len}.`, `Check: ${l} × ${w} = ${a}.`],
      check: { kind: 'width-from-a', l, a, w },
    };
  }
}

/** A rectangle with a notch cut into the middle of one long side: the perimeter gets longer by both notch sides. */
function notch(r: () => number): Question {
  for (;;) {
    const L = int(r, 8, 16);
    const W = int(r, 5, Math.min(L - 1, 10));
    const nw = int(r, 2, L - 4);
    const nd = int(r, 1, W - 2);
    const u = pick(r, UNITS);
    const area = L * W - nw * nd;
    const perimeter = 2 * L + 2 * W + 2 * nd;
    const options = shuffle(r, ['The same', 'Shorter', 'Longer']);
    const correct = options.indexOf('Longer');
    return {
      round: 'shapes',
      prompt: `A rectangle ${L} ${u.len} by ${W} ${u.len} has a notch cut into the middle of one long side. The notch is ${nw} ${u.len} wide and ${nd} ${u.len} deep. Find the area and perimeter of the new shape.`,
      steps: [
        { type: 'number', prompt: `What is the area of the whole ${L} ${u.len} by ${W} ${u.len} rectangle?`, answer: D(L * W), unit: u.area, feedback: () => `${L} × ${W}.` },
        { type: 'number', prompt: `What is the area of the notch that is cut out?`, answer: D(nw * nd), unit: u.area, feedback: () => `${nw} × ${nd}.` },
        { type: 'number', prompt: `So what is the area of the new shape?`, answer: D(area), unit: u.area, feedback: () => `Take the notch away from the whole rectangle.` },
        {
          type: 'choice',
          prompt: 'Compared with the whole rectangle, is the perimeter of the new shape the same, shorter or longer?',
          options,
          correct,
          why: whyAll(options, correct, () => `The bottom of the notch replaces the ${nw} ${u.len} of edge it cuts out, but the notch also has two sides going in, each ${nd} ${u.len} deep. Those are extra.`),
        },
        { type: 'number', prompt: `So what is the perimeter of the new shape?`, answer: D(perimeter), unit: u.len, feedback: (g) => (sameNumber(g, 2 * L + 2 * W) ? `That is the whole rectangle's perimeter. Add the two sides of the notch, ${nd} ${u.len} each.` : `The rectangle's perimeter, plus the two sides of the notch.`) },
      ],
      workings: [`Area: ${L} × ${W} = ${L * W}, take away ${nw} × ${nd} = ${nw * nd}, which leaves ${area} ${u.area}.`, `The notch adds its two sides, each ${nd} ${u.len}, to the edge.`, `So the perimeter is 2 × ${L} + 2 × ${W} + 2 × ${nd} = ${perimeter} ${u.len}, and the area is ${area} ${u.area}.`],
      check: { kind: 'notch', L, W, nw, nd, area, perimeter },
    };
  }
}

function lShape(r: () => number): Question {
  if (r() < 0.35) return notch(r);
  for (;;) {
    const L = int(r, 6, 16);
    const W = int(r, 4, L - 1);
    const cl = int(r, 2, L - 2);
    const cw = int(r, 1, W - 2);
    const u = pick(r, UNITS);
    if (SHOWN.has(`L ${L} ${W} ${cl} ${cw}`)) continue;
    const big = L * W;
    const corner = cl * cw;
    const area = big - corner;
    const perimeter = 2 * L + 2 * W;
    const options = shuffle(r, ['The same', 'Shorter', 'Longer']);
    const correct = options.indexOf('The same');
    const shorter = perimeter - (2 * cl + 2 * cw);
    return {
      round: 'shapes',
      prompt: `A rectangle ${L} ${u.len} long and ${W} ${u.len} wide has a piece ${cl} ${u.len} long and ${cw} ${u.len} wide cut from one corner, making an L shape. Find the area and perimeter of the L shape.`,
      steps: [
        { type: 'number', prompt: `What is the area of the whole ${L} ${u.len} by ${W} ${u.len} rectangle?`, answer: D(big), unit: u.area, feedback: () => `${L} × ${W}.` },
        { type: 'number', prompt: `What is the area of the corner that is cut out?`, answer: D(corner), unit: u.area, feedback: () => `${cl} × ${cw}.` },
        { type: 'number', prompt: `So what is the area of the L shape?`, answer: D(area), unit: u.area, feedback: () => `Take the corner away: ${big} − ${corner}.` },
        {
          type: 'choice',
          prompt: 'Compared with the whole rectangle, is the perimeter of the L shape the same, shorter or longer?',
          options,
          correct,
          why: whyAll(options, correct, () => `The two new edges of the cut-out add up to the same as the two edges they replace, so the distance round is the same.`),
        },
        {
          type: 'number',
          prompt: `So what is the perimeter of the L shape?`,
          answer: D(perimeter),
          unit: u.len,
          feedback: (g) =>
            sameNumber(g, shorter) || sameNumber(g, perimeter - cl - cw)
              ? `Cutting out a corner does not shorten the perimeter: the new edges replace the old ones. Use 2 × ${L} + 2 × ${W}.`
              : `2 × ${L} + 2 × ${W}.`,
        },
      ],
      workings: [`Area: ${L} × ${W} = ${big}, take away ${cl} × ${cw} = ${corner}, which leaves ${area} ${u.area}.`, `The cut-out's two edges add up to the same as the edges they replace.`, `So the perimeter is 2 × ${L} + 2 × ${W} = ${perimeter} ${u.len}, and the area is ${area} ${u.area}.`],
      check: { kind: 'L', L, W, cl, cw, area, perimeter },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'missing') return missing(r);
  if (round === 'shapes') return lShape(r);
  return rectangle(r);
}

export const basicGeometryQuiz: LessonQuiz<GeometryCheck> = {
  lesson: 'basic-geometry',
  storageKey: 'stella-quiz-basic-geometry-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
