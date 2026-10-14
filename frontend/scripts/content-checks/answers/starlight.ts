import type { Entry } from '../answers';

/**
 * Answer checks for the "starlight" mission's lessons (see MISSIONS in src/lib/missions.ts).
 * Same format and rules as the Mission 2 table in ../answers.ts: one entry per numeric
 * answer, worked-example step or numeric claim, each pinned to a verbatim fragment.
 */

const DEG = Math.PI / 180;
const asinDeg = (x: number) => Math.asin(x) / DEG;
const sinDeg = (a: number) => Math.sin(a * DEG);

const L = {
  // prism
  N_AIR: 1.0,
  N_GLASS: 1.5,
  N_WATER: 1.33,
};

const PRISM: Entry[] = [
  {
    lesson: 'prism', where: 'conceptSteps[0] (two thirds)', expectQuestionIncludes: 'in glass $n$ is about 1.5',
    kind: 'claim', claimIncludes: 'about two thirds of its speed in a vacuum',
    verify: () => ({ holds: Math.abs(1 / L.N_GLASS - 2 / 3) < 1e-9, detail: `1 / 1.5 = ${(1 / L.N_GLASS).toFixed(4)}` }),
  },
  {
    lesson: 'prism', where: 'solvedExample.steps[1]', expectQuestionIncludes: 'into glass ($n_2 = 1.5$) at $30^\\circ$ to the normal',
    stated: '$\\sin 30^\\circ = 0.5$', pick: 1, compute: () => sinDeg(30), expected: 0.5, tolerance: 1e-9, unit: '',
  },
  {
    lesson: 'prism', where: 'solvedExample.steps[2]', expectQuestionIncludes: 'into glass ($n_2 = 1.5$) at $30^\\circ$ to the normal',
    stated: '= 0.333', compute: () => (L.N_AIR * sinDeg(30)) / L.N_GLASS, expected: 1 / 3, tolerance: 0.0005, unit: '',
  },
  {
    lesson: 'prism', where: 'solvedExample.resultFormula', expectQuestionIncludes: 'into glass ($n_2 = 1.5$) at $30^\\circ$ to the normal',
    note: '"≈ 19.5": ±0.05.',
    compute: () => asinDeg((L.N_AIR * sinDeg(30)) / L.N_GLASS), expected: 19.471, tolerance: 0.05, unit: '°',
  },
  {
    lesson: 'prism', where: 'practiceProblems[0]', kind: 'qualitative', expectQuestionIncludes: 'passes from air into glass',
    expectAnswerIncludes: 'It slows down.',
  },
  {
    lesson: 'prism', where: 'practiceProblems[1]', kind: 'qualitative', expectQuestionIncludes: 'Light enters a glass block at an angle',
    expectAnswerIncludes: 'Towards the normal.',
    verify: () => {
      const r = asinDeg((L.N_AIR * sinDeg(40)) / L.N_GLASS);
      return { holds: r < 40, detail: `40° in air gives ${r.toFixed(1)}° in glass, closer to the normal` };
    },
  },
  {
    lesson: 'prism', where: 'practiceProblems[2]', kind: 'qualitative', expectQuestionIncludes: 'Light leaves a glass block into air at an angle',
    expectAnswerIncludes: 'Away from the normal.',
    verify: () => {
      const r = asinDeg((L.N_GLASS * sinDeg(20)) / L.N_AIR);
      return { holds: r > 20, detail: `20° in glass gives ${r.toFixed(1)}° in air, further from the normal` };
    },
  },
  {
    lesson: 'prism', where: 'practiceProblems[3]', kind: 'qualitative', expectQuestionIncludes: 'meets a glass block along the normal',
    expectAnswerIncludes: 'It does not change direction',
    verify: () => ({ holds: asinDeg((L.N_AIR * sinDeg(0)) / L.N_GLASS) === 0, detail: '0° in air gives 0° in glass' }),
  },
  {
    lesson: 'prism', where: 'practiceProblems[4]', kind: 'qualitative', expectQuestionIncludes: 'Why does a prism split white light into colours?',
    expectAnswerIncludes: 'violet slows the most and bends the most, red the least',
  },
  {
    lesson: 'prism', where: 'practiceProblems[5]', expectQuestionIncludes: 'into water (n = 1.33) at 45° to the normal',
    note: 'sin 45° = 0.7071; ÷ 1.33 = 0.5317; inverse sine 32.12°. "About 32.1": ±0.05.',
    compute: () => asinDeg((L.N_AIR * sinDeg(45)) / L.N_WATER), expected: 32.12, tolerance: 0.05, unit: '°',
  },
];

export const ENTRIES: Entry[] = [...PRISM];
