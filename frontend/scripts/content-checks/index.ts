/**
 * `npm run check:content`: the automatic content checks from docs/content-workflow.md,
 * run together. Default: the lessons of Mission 2 ("Get to orbit"). Options:
 *   --lessons=a,b   check only these lessons
 *   --all           check every lesson
 * Exits 1 if any check fails. Warnings and info do not fail the run.
 */
import { MISSIONS } from '../../src/lib/missions';
import { studyModules } from '../../src/lib/study-modules';
import { runAnswerChecks } from './answers';
import { runCurriculumChecks } from './curriculum';
import { runQuizChecks } from './quiz';
import { runStyleChecks } from './style';

type Finding = { check: string; lesson: string; where: string; excerpt: string; message: string; level: 'fail' | 'warn' | 'info' };

const args = process.argv.slice(2);
const listed = args.find((a) => a.startsWith('--lessons='))?.slice('--lessons='.length).split(',').filter(Boolean);
const orbit = MISSIONS.find((m) => m.id === 'orbit')!.lessons as string[];
const lessons = listed ?? (args.includes('--all') ? studyModules.map((m) => m.id as string) : orbit);

const unknown = lessons.filter((id) => !studyModules.some((m) => m.id === id));
if (unknown.length) {
  console.error(`Unknown lesson id: ${unknown.join(', ')}`);
  process.exit(2);
}

const groups: Array<[string, Finding[]]> = [
  ['answers', runAnswerChecks(lessons)],
  ['style', runStyleChecks(lessons)],
  ['curriculum', runCurriculumChecks(lessons)],
  // The Measures quiz is generated, so its questions are checked by generating thousands of them.
  ...(lessons.includes('measures') ? ([['quiz', runQuizChecks()]] as Array<[string, Finding[]]>) : []),
];

let fails = 0;
let warns = 0;
for (const [name, findings] of groups) {
  const problems = findings.filter((f) => f.level !== 'info');
  fails += problems.filter((f) => f.level === 'fail').length;
  warns += problems.filter((f) => f.level === 'warn').length;
  console.log(`\n== ${name}: ${problems.length ? `${problems.length} problem(s)` : 'clean'}`);
  for (const f of problems) {
    console.log(`  ${f.level.toUpperCase()}  ${f.lesson}  ${f.where}: ${f.message}`);
    if (f.excerpt) console.log(`        "${f.excerpt.length > 120 ? `${f.excerpt.slice(0, 117)}...` : f.excerpt}"`);
  }
}

console.log(`\ncheck:content (${lessons.length} lesson(s)): ${fails} failure(s), ${warns} warning(s)`);
process.exit(fails ? 1 : 0);
