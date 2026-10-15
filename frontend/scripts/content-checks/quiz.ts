/**
 * Quiz check: for every lesson with a step-by-step quiz (src/lib/quiz/index.ts), generates thousands of
 * questions per round and checks every one.
 *
 *   - The lesson's own verifier (scripts/content-checks/quiz/<lesson>.ts) recomputes the answers by an
 *     independent route (mathjs units or fractions, exact UK definitions).
 *   - Every step is well formed. The marker accepts each answer in the forms a pupil might type (with or
 *     without commas, a unit or %) and rejects it when it is 10 times too big or too small, or in the
 *     wrong unit. Fractions that must be in simplest form reject an unsimplified equal fraction.
 *   - The common slips each lesson names are rejected with their feedback.
 *   - The same seed always makes the same question (review questions are made again from their seed).
 *   - No text contains "undefined" or "NaN".
 *
 * Run:  npx tsx scripts/content-checks/quiz.ts      (also part of npm run check:content)
 */
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { formatDecimal } from '../../src/lib/measures';
import { answerText, markTyped, rng, type Question } from '../../src/lib/quiz/core';
import { QUIZZES } from '../../src/lib/quiz';
import { arithmeticVerifier } from './quiz/arithmetic';
import { basicGeometryVerifier } from './quiz/basic-geometry';
import { binaryVerifier } from './quiz/binary';
import { decimalsPercentagesVerifier } from './quiz/decimals-percentages';
import { exponentsRootsVerifier } from './quiz/exponents-roots';
import { fractionOpsVerifier } from './quiz/fraction-ops';
import { fractionsVerifier } from './quiz/fractions';
import { measuresVerifier } from './quiz/measures';
import { multiplicationVerifier } from './quiz/multiplication';
import { negativeNumbersVerifier } from './quiz/negative-numbers';
import { probabilityVerifier } from './quiz/probability';
import { proportionsVerifier } from './quiz/proportions';
import { trigonometryVerifier } from './quiz/trigonometry';
import { vectorsVerifier } from './quiz/vectors';
import type { Verifier } from './quiz/types';

type Finding = { check: string; lesson: string; where: string; excerpt: string; message: string; level: 'fail' | 'warn' | 'info' };

const PER_ROUND = 3000;
const VERIFIERS: Record<string, Verifier> = {
  measures: measuresVerifier,
  'decimals-percentages': decimalsPercentagesVerifier,
  fractions: fractionsVerifier,
  'fraction-ops': fractionOpsVerifier,
  arithmetic: arithmeticVerifier,
  multiplication: multiplicationVerifier,
  'basic-geometry': basicGeometryVerifier,
  'negative-numbers': negativeNumbersVerifier,
  proportions: proportionsVerifier,
  'exponents-roots': exponentsRootsVerifier,
  binary: binaryVerifier,
  trigonometry: trigonometryVerifier,
  vectors: vectorsVerifier,
  probability: probabilityVerifier,
};

export function runQuizChecks(lessons?: string[]): Finding[] {
  const findings: Finding[] = [];
  for (const [lesson, quiz] of Object.entries(QUIZZES)) {
    if (!quiz || (lessons && !lessons.includes(lesson))) continue;
    let fails = 0;
    const fail = (where: string, excerpt: string, message: string) => {
      if (++fails <= 25) findings.push({ check: 'quiz', lesson, where, excerpt, message, level: 'fail' });
    };
    const verifier = VERIFIERS[lesson];
    if (!verifier) {
      fail('', '', 'no verifier in scripts/content-checks/quiz.ts');
      continue;
    }
    let checked = 0;
    const made: Question[] = [];
    for (const round of Object.keys(quiz.rounds)) {
      const r = rng(20261015 + round.length);
      for (let n = 0; n < PER_ROUND; n++) {
        const q = quiz.make(round, r);
        made.push(q);
        const where = `${round} #${n}`;
        const words = [q.prompt, ...q.workings, ...q.steps.flatMap((s) => [s.prompt, ...(s.type === 'choice' ? [...s.options, ...Object.values(s.why)] : [])])].join(' | ');
        if (/undefined|NaN|\[object|null/.test(words)) fail(where, q.prompt, `bad text: ${words.slice(0, 200)}`);

        const seed = 1000 + n;
        const a1 = quiz.make(round, rng(seed));
        const a2 = quiz.make(round, rng(seed));
        if (a1.prompt !== a2.prompt || JSON.stringify(a1.steps.map((s) => s.prompt)) !== JSON.stringify(a2.steps.map((s) => s.prompt))) fail(where, '', 'the same seed gave a different question');

        const problem = verifier.verify(q);
        if (problem) fail(where, q.prompt, problem);
        const last = q.steps[q.steps.length - 1];
        const final = answerText(last);
        // A fraction answer may be shown in the working as a mixed number (23/6 as 3 5/6).
        const mixed = last.type === 'fraction' && last.answer.n > last.answer.d ? `${last.answer.n / last.answer.d}${last.answer.n % last.answer.d ? ` ${last.answer.n % last.answer.d}/${last.answer.d}` : ''}` : final;
        const shown = q.workings.join(' ');
        if (!shown.includes(final.replace(/ (miles|inches|pounds|litres|km|cm|m|mm|g|kg|l|ml)$/, '')) && !shown.includes(mixed)) fail(where, q.prompt, `workings do not show the answer "${final}"`);

        q.steps.forEach((s, i) => {
          if (s.type === 'choice') {
            if (s.correct < 0 || s.correct >= s.options.length) fail(where, s.prompt, 'correct option missing');
            if (new Set(s.options).size !== s.options.length) fail(where, s.prompt, `repeated options: ${s.options.join(', ')}`);
            s.options.forEach((_, k) => {
              if (k !== s.correct && !s.why[k]) fail(where, s.prompt, `no feedback for wrong option "${s.options[k]}"`);
            });
          } else if (s.type === 'number') {
            const a = formatDecimal(s.answer);
            // A binary answer is typed as plain 0s and 1s, with or without leading zeros; commas are refused.
            const forms = s.plain ? [a.replace(/,/g, ''), `0${a.replace(/,/g, '')}`] : [a, a.replace(/,/g, ''), `about ${a}`];
            if (s.plain && markTyped(s, a.includes(',') ? a : `${a}2`).ok) fail(where, s.prompt, 'binary step accepts a non-binary answer');
            if (s.unit) forms.push(s.unit === '%' ? `${a}%` : s.unit === '£' ? `£${a}` : `${a} ${s.unit}`);
            if (s.unit === '£') forms.push(`£ ${a}`);
            for (const typed of forms) if (!markTyped(s, typed).ok) fail(where, s.prompt, `marker rejects "${typed}"`);
            if (s.unit && markTyped(s, `${a} parsecs`).ok) fail(where, s.prompt, 'marker accepts a wrong unit');
            if (s.unit === '£' && !/pence/.test(markTyped(s, `${a}p`).feedback)) fail(where, s.prompt, 'marker does not refuse pence');
            if (s.unit !== '£' && markTyped(s, `£${a}`).ok) fail(where, s.prompt, 'marker accepts £ on a step that is not money');
            for (const k of [1, -1]) {
              const wrong = formatDecimal({ ...s.answer, top: s.answer.top + k });
              const m = markTyped(s, wrong);
              if (s.answer.digits !== '0' && !s.alsoAccept?.length && (m.ok || !m.feedback)) fail(where, s.prompt, `step ${i + 1}: marker accepts or gives no feedback for "${wrong}"`);
            }
          } else {
            const a = answerText(s);
            if (!markTyped(s, a).ok) fail(where, s.prompt, `marker rejects "${a}"`);
            // An equal fraction, not simplified (as a mixed number where one is required).
            const { n: fn, d: fd } = s.answer;
            const doubled = s.requireMixed && fn > fd ? `${fn / fd} ${(fn % fd) * 2n}/${fd * 2n}` : `${fn * 2n}/${fd * 2n}`;
            const m = markTyped(s, doubled);
            const expectRejected = s.denominator ? /on the bottom/ : s.simplest ? /simplified/ : null;
            if (expectRejected ? m.ok || !expectRejected.test(m.feedback) : !m.ok) fail(where, s.prompt, `fraction marking wrong for "${doubled}": ${m.ok ? 'accepted' : m.feedback}`);
            if (markTyped(s, `${s.answer.n + 1n}/${s.answer.d}`).ok) fail(where, s.prompt, 'marker accepts a wrong fraction');
          }
        });

        for (const m of verifier.mistakes?.(q) ?? []) {
          const s = q.steps[m.step];
          if (!s) {
            fail(where, q.prompt, `slip refers to a missing step ${m.step + 1}`);
            continue;
          }
          if (s.type === 'choice') {
            // A wrong option: its own feedback must name the mistake.
            const k = s.options.indexOf(m.typed);
            if (k === -1 || k === s.correct || !(s.why[k] ?? '').includes(m.expect)) fail(where, q.prompt, `option "${m.typed}" at step ${m.step + 1} gave "${k === -1 ? 'no such option' : s.why[k]}", expected feedback with "${m.expect}"`);
            continue;
          }
          const res = markTyped(s, m.typed);
          if (res.ok || !res.feedback.includes(m.expect)) fail(where, q.prompt, `slip "${m.typed}" at step ${m.step + 1} gave "${res.ok ? 'accepted' : res.feedback}", expected feedback with "${m.expect}"`);
        }
        checked++;
      }
    }
    const agg = verifier.aggregate?.(made);
    if (agg) fail('all', '', agg);
    findings.push({ check: 'quiz', lesson, where: '', excerpt: '', message: `${checked} generated questions checked`, level: 'info' });
  }
  return findings;
}

const invokedAs = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedAs === fileURLToPath(import.meta.url)) {
  const f = runQuizChecks();
  for (const x of f) console.log(`${x.level.toUpperCase()}  ${x.lesson} ${x.where}: ${x.message}${x.excerpt ? `\n      "${x.excerpt}"` : ''}`);
  process.exit(f.some((x) => x.level === 'fail') ? 1 : 0);
}
