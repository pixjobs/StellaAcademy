/**
 * Quiz for "Radians, Arc Length and Sector Area" (KAN-85). GCSE to A-level; calculator answers to 3 s.f.
 * Angles in radians as multiples of π are asked as the fraction in front of π (2/3 for 2π/3).
 */
import { D, F, approx, fracText, gcd, int, pick, sf3, shuffle, simplify, toNumber, whyAll, type LessonQuiz, type Question as Q } from '@/lib/quiz/core';

export type Round = 'convert' | 'arc' | 'sector';

export const ROUNDS: Record<Round, { label: string; blurb: string }> = {
  convert: { label: 'Degrees and radians', blurb: '180° is π radians. Use a calculator; give 3 significant figures where needed.' },
  arc: { label: 'Arc length', blurb: 's = rθ in radians, or θ/360 of the circumference in degrees.' },
  sector: { label: 'Sector area', blurb: 'A = ½r²θ in radians, or θ/360 of the circle in degrees.' },
};

export type AnglesCheck =
  | { kind: 'to-rad'; degrees: number; answer: string }
  | { kind: 'to-deg'; num: number; den: number; answer: number }
  | { kind: 'arc' | 'sector'; r: number; theta: number; radians: boolean; answer: number };
type Question = Q<AnglesCheck>;

/** Examples shown on the lesson page. The quiz never asks these. */
// The page's arcs and sectors use π/2 and π/3; the quiz uses decimal radians, so they cannot repeat.
const SHOWN = new Set(['to-rad 90', 'to-rad 180', 'to-rad 360', 'to-rad 60', 'arc 5 2', 'arc 10 72']);

/** θ as kπ written for a pupil: π/3, 2π/3, 5π/4. */
const piText = (num: number, den: number) => `${num === 1 ? '' : num}π${den === 1 ? '' : `/${den}`}`;

function convert(r: () => number): Question {
  for (;;) {
    if (r() < 0.6) {
      const degrees = pick(r, [15, 20, 30, 36, 40, 45, 72, 120, 135, 150, 210, 225, 240, 270, 300, 315, 330]);
      if (SHOWN.has(`to-rad ${degrees}`)) continue;
      const f = simplify(F(degrees, 180));
      return {
        round: 'convert',
        prompt: `Convert ${degrees}° to radians. Give your answer as a fraction of π.`,
        steps: [
          { type: 'fraction', prompt: `180° is π radians. What fraction of 180° is ${degrees}°?`, answer: F(degrees, 180), simplest: false, feedback: () => 'Put the angle over 180.' },
          {
            type: 'fraction',
            prompt: `Simplify it. ${degrees}° is how many π radians? (Type the number in front of π, such as 2/3 for 2π/3.)`,
            answer: f,
            simplest: true,
            feedback: () => `Divide the top and bottom of ${degrees}/180 by the biggest number that goes into both.`,
          },
        ],
        workings: [`${degrees}° is ${degrees}/180 of 180°.`, `${degrees}/180 = ${fracText(f)}, so ${degrees}° = ${piText(Number(f.n), Number(f.d))} radians: the number in front of π is ${fracText(f)}.`],
        check: { kind: 'to-rad', degrees, answer: fracText(f) },
      };
    }
    const den = pick(r, [2, 3, 4, 5, 6, 9, 10, 12]);
    const num = int(r, 1, 2 * den - 1);
    if (gcd(BigInt(num), BigInt(den)) !== 1n) continue;
    const degrees = (180 * num) / den;
    if (!Number.isInteger(degrees) || SHOWN.has(`to-rad ${degrees}`)) continue;
    const options = shuffle(r, ['Multiply by 180/π', 'Multiply by π/180', 'Multiply by 360']);
    const correct = options.indexOf('Multiply by 180/π');
    return {
      round: 'convert',
      prompt: `Convert ${piText(num, den)} radians to degrees.`,
      steps: [
        { type: 'choice', prompt: 'Radians to degrees: what do you do?', options, correct, why: whyAll(options, correct, () => 'π radians is 180°, so each π becomes 180: multiply by 180/π.') },
        { type: 'number', prompt: `So what is ${piText(num, den)} in degrees?`, answer: D(degrees), unit: '°', feedback: () => `Replace π with 180°: ${num === 1 ? '' : `${num} × `}180 ÷ ${den}.` },
      ],
      workings: [`π radians = 180°.`, `${piText(num, den)} = ${num === 1 ? '' : `${num} × `}180° ÷ ${den} = ${degrees}°.`],
      check: { kind: 'to-deg', num, den, answer: degrees },
    };
  }
}

function arcOrSector(r: () => number, kind: 'arc' | 'sector'): Question {
  for (;;) {
    const radius = int(r, 2, 15);
    const radians = r() < 0.6;
    // In radians: a decimal angle such as 1.2 (no π, so the pupil uses the formula directly). In degrees: a whole angle.
    const theta = radians ? int(r, 3, 30) / 10 : pick(r, [20, 30, 40, 45, 50, 60, 80, 100, 120, 135, 150, 210, 240, 270]);
    if (SHOWN.has(`${kind} ${radius} ${theta}`)) continue;
    const exact = kind === 'arc' ? (radians ? radius * theta : (theta / 360) * 2 * Math.PI * radius) : radians ? 0.5 * radius * radius * theta : (theta / 360) * Math.PI * radius * radius;
    const thetaText = radians ? `${theta} radian${theta === 1 ? '' : 's'}` : `${theta}°`;
    const unit = kind === 'arc' ? 'cm' : 'cm²';
    const rightRule = kind === 'arc' ? (radians ? 's = rθ' : 's = θ/360 × 2πr') : radians ? 'A = ½r²θ' : 'A = θ/360 × πr²';
    const wrongRules = kind === 'arc' ? (radians ? ['s = θ/360 × 2πr', 's = 2πrθ'] : ['s = rθ, with θ in degrees', 's = θ/360 × πr²']) : radians ? ['A = r²θ', 'A = ½rθ'] : ['A = ½r²θ, with θ in degrees', 'A = θ/360 × 2πr'];
    const options = shuffle(r, [rightRule, ...wrongRules]);
    const correct = options.indexOf(rightRule);
    // The slips the feedback names.
    const degreesIn = radians ? null : kind === 'arc' ? radius * theta : 0.5 * radius * radius * theta;
    const noHalf = kind === 'sector' && radians ? radius * radius * theta : null;
    const notSquared = kind === 'sector' && radians ? 0.5 * radius * theta : null;
    const a = approx(exact);
    return {
      round: kind,
      prompt: `A sector of a circle has radius ${radius} cm and angle ${thetaText} at the centre. Find its ${kind === 'arc' ? 'arc length' : 'area'}.`,
      steps: [
        {
          type: 'choice',
          prompt: `The angle is in ${radians ? 'radians' : 'degrees'}. Which formula do you use?`,
          options,
          correct,
          why: whyAll(options, correct, (o) =>
            o.includes('with θ in degrees') ? `${o.split(',')[0]} only works with θ in radians.` : kind === 'arc' ? 'The arc is the radius times the angle in radians, or that fraction of the circumference in degrees.' : 'The sector is half the radius squared times the angle in radians, or that fraction of the circle’s area in degrees.',
          ),
        },
        {
          type: 'number',
          prompt: `So what is the ${kind === 'arc' ? 'arc length' : 'area'}? Give 3 significant figures.`,
          ...a,
          unit,
          feedback: (g) => {
            const v = toNumber(g);
            const close = (x: number | null) => x !== null && Math.abs(v - x) <= Math.abs(x) * 0.003;
            if (close(degreesIn)) return 'That uses the angle in degrees in a radians formula. With degrees, use the fraction θ/360 of the whole circle.';
            if (close(noHalf)) return 'Remember the half: A = ½r²θ.';
            if (close(notSquared)) return 'Square the radius: A = ½r²θ.';
            return `Put r = ${radius} and θ = ${radians ? theta : `${theta}°`} into ${rightRule}.`;
          },
        },
      ],
      workings: [`${rightRule} with r = ${radius} and θ = ${thetaText}.`, `${kind === 'arc' ? 'Arc length' : 'Area'} = ${sf3(exact)} ${unit} to 3 significant figures.`],
      check: { kind, r: radius, theta, radians, answer: exact },
    };
  }
}

export function makeQuestion(round: Round, r: () => number): Question {
  if (round === 'arc') return arcOrSector(r, 'arc');
  if (round === 'sector') return arcOrSector(r, 'sector');
  return convert(r);
}

export const anglesQuiz: LessonQuiz<AnglesCheck> = {
  lesson: 'angles',
  storageKey: 'stella-quiz-angles-v1',
  rounds: ROUNDS,
  make: (round, r) => makeQuestion(round as Round, r),
};
