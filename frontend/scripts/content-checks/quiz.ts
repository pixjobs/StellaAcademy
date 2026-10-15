/**
 * Quiz check: generates thousands of questions for each round of the Measures quiz
 * (src/lib/measures-quiz.ts) and checks every one independently.
 *
 *   - Metric answers are recomputed with mathjs's unit converter.
 *   - Imperial answers must equal the starting value times the rough equivalent, and the rough
 *     equivalent must be within 3% of the exact UK definition.
 *   - Every step is well formed, the marker accepts the answer in the forms a pupil might type
 *     (with or without commas or a unit) and rejects it when it is 10 times too big or too small.
 *   - No text contains "undefined" or "NaN", and answers fit the lesson (at most 3 decimal places).
 *
 * Run:  npx tsx scripts/content-checks/quiz.ts      (also part of npm run check:content)
 */
import { create, all } from 'mathjs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { bottom, formatDecimal } from '../../src/lib/measures';
import { makeQuestion, markNumber, rng, ROUNDS, type NumberStep, type Round } from '../../src/lib/measures-quiz';

type Finding = { check: string; lesson: string; where: string; excerpt: string; message: string; level: 'fail' | 'warn' | 'info' };

const math = create(all);
const PER_ROUND = 3000;
const MATHJS_UNIT: Record<string, string> = { km: 'km', m: 'm', cm: 'cm', mm: 'mm', kg: 'kg', g: 'g', l: 'l', ml: 'ml' };

export function runQuizChecks(): Finding[] {
  const findings: Finding[] = [];
  const fail = (where: string, excerpt: string, message: string) => {
    if (findings.filter((f) => f.level === 'fail').length < 25) findings.push({ check: 'quiz', lesson: 'measures', where, excerpt, message, level: 'fail' });
  };
  let checked = 0;
  // How often the right option sits in each position: it must not always be in the same place.
  const position: Record<'factor' | 'other', Record<number, number>> = { factor: {}, other: {} };
  for (const round of Object.keys(ROUNDS) as Round[]) {
    const r = rng(20261015 + round.length);
    for (let n = 0; n < PER_ROUND; n++) {
      const q = makeQuestion(round, r);
      const where = `${round} #${n}`;
      const all = [q.prompt, ...q.workings, ...q.steps.flatMap((s) => [s.prompt, ...(s.type === 'choice' ? [...s.options, ...Object.values(s.why)] : [s.unit ?? ''])])].join(' | ');
      if (/undefined|NaN|\[object/.test(all)) fail(where, q.prompt, `bad text: ${all.slice(0, 200)}`);

      const answer = q.check.answer;
      const last = q.steps[q.steps.length - 1] as NumberStep;
      if (last.type !== 'number' || formatDecimal(last.answer) !== formatDecimal(answer)) fail(where, q.prompt, 'last step is not the answer');
      if (bottom(answer) < -3) fail(where, q.prompt, `answer ${formatDecimal(answer)} has more than 3 decimal places`);
      if (!q.workings.join(' ').includes(formatDecimal(answer))) fail(where, q.prompt, 'workings do not show the answer');

      const value = Number(q.check.value);
      const got = Number(formatDecimal(answer).replace(/,/g, ''));
      if (q.check.rough) {
        const want = value * Number(q.check.rough.factor);
        if (Math.abs(got - want) > 1e-9 * Math.max(1, want)) fail(where, q.prompt, `answer ${got}, expected ${value} × ${q.check.rough.factor} = ${want}`);
        const exact = value * q.check.rough.exactFactor;
        if (Math.abs(got - exact) / exact > 0.03) fail(where, q.prompt, `rough answer ${got} is more than 3% from the exact ${exact}`);
      } else {
        const want = math.unit(value, MATHJS_UNIT[q.check.from]).toNumber(MATHJS_UNIT[q.check.to]);
        if (Math.abs(got - want) > 1e-9 * Math.max(1, Math.abs(want))) fail(where, q.prompt, `answer ${got}, mathjs gives ${want}`);
      }

      for (const s of q.steps) {
        if (s.type === 'choice') {
          if (s.correct < 0 || s.correct >= s.options.length) fail(where, s.prompt, 'correct option missing');
          position[s.prompt.startsWith('Multiply by') || s.prompt.startsWith('Divide by') ? 'factor' : 'other'][s.correct] = (position[s.prompt.startsWith('Multiply by') || s.prompt.startsWith('Divide by') ? 'factor' : 'other'][s.correct] ?? 0) + 1;
          if (new Set(s.options).size !== s.options.length) fail(where, s.prompt, `repeated options: ${s.options.join(', ')}`);
          s.options.forEach((_, k) => {
            if (k !== s.correct && !s.why[k]) fail(where, s.prompt, `no feedback for wrong option "${s.options[k]}"`);
          });
        } else {
          const a = formatDecimal(s.answer);
          for (const typed of [a, a.replace(/,/g, ''), `${a} ${s.unit ?? ''}`.trim(), `about ${a}`]) {
            if (!markNumber(s, typed).ok) fail(where, s.prompt, `marker rejects "${typed}"`);
          }
          if (s.unit && markNumber(s, `${a} parsecs`).ok) fail(where, s.prompt, 'marker accepts a wrong unit');
          for (const k of [1, -1]) {
            const wrong = formatDecimal({ ...s.answer, top: s.answer.top + k });
            const m = markNumber(s, wrong);
            if (s.answer.digits !== '0' && !s.alsoAccept?.length && (m.ok || !m.feedback)) fail(where, s.prompt, `marker accepts or gives no feedback for "${wrong}"`);
          }
        }
      }
      checked++;
    }
  }
  const counts = Object.values(position.factor);
  const total = counts.reduce((x, y) => x + y, 0);
  if (counts.length < 4 || Math.max(...counts) / total > 0.35) fail('factor step', '', `the right factor is not spread across the four buttons: ${JSON.stringify(position.factor)}`);
  findings.push({ check: 'quiz', lesson: 'measures', where: '', excerpt: '', message: `${checked} generated questions checked`, level: 'info' });
  return findings;
}

const invokedAs = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedAs === fileURLToPath(import.meta.url)) {
  const f = runQuizChecks();
  for (const x of f) console.log(`${x.level.toUpperCase()}  ${x.where}: ${x.message}${x.excerpt ? `\n      "${x.excerpt}"` : ''}`);
  process.exit(f.some((x) => x.level === 'fail') ? 1 : 0);
}
