/**
 * Curriculum check: every DfE statement quoted in src/lib/curriculum.ts must occur in the plain-text
 * copy of its source document in content-sources/dfe/<source>.txt (see content-sources/dfe/SOURCES.md
 * for where each text came from and how it was made).
 *
 * Run:  npx tsx scripts/content-checks/curriculum.ts            (lessons in the 'orbit' mission)
 *       npx tsx scripts/content-checks/curriculum.ts --all      (every lesson)
 *       npx tsx scripts/content-checks/curriculum.ts --lessons=units,gears
 *
 * NORMALISATIONS. These, and only these, are applied to both the statement and the source text:
 *   1. Whitespace: every run of whitespace (spaces, tabs, line breaks, page breaks, no-break and
 *      zero-width spaces) becomes one space; leading and trailing whitespace is dropped.
 *   2. Hyphenation across line breaks: in the source, a hyphen at the end of a line followed by the
 *      next line is a "line-end hyphen". It may match a hyphen with no space ("multi-digit"), a hyphen
 *      followed by a space ("one- or two-digit"), or nothing at all (a word split by hyphenation,
 *      "calcu-lation" = "calculation").
 *   3. Quotes and apostrophes: ‘ ’ ‚ ‛ ′ ` and ' are one character; “ ” „ ‟ ″ and " are one character.
 *   4. Dashes: hyphen-minus, ‐ ‑ ‒ – — ― and the minus sign − are one character.
 *   5. Superscripts and subscripts: ⁰-⁹ ⁺ ⁻ ⁼ ⁽ ⁾ ⁿ ⁱ and ₀-₉ ₊ ₋ ₌ ₍ ₎ are read as their ordinary
 *      characters (so "cm²" = "cm2", "10⁻³" = "10-3"), and because PDF text extraction often sets a
 *      raised or lowered character apart, whitespace is allowed before and after a character that is a
 *      superscript or subscript in the statement.
 *   6. Brackets: PDF text extraction sets formulas apart ("f ( x )"), so whitespace just inside a
 *      bracket and just before an opening bracket is ignored on both sides: "f(x)" = "f ( x )".
 * Nothing else is normalised: case, punctuation, symbols (x and ×, ≤ and <=), spelling and word order
 * must match exactly.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURRICULUM, CURRICULUM_SOURCES, type CurriculumSource } from '../../src/lib/curriculum';
import { MISSIONS } from '../../src/lib/missions';

export type Finding = {
  check: string;
  lesson: string;
  where: string;
  excerpt: string;
  message: string;
  level: 'fail' | 'warn' | 'info';
};

const CHECK = 'curriculum';
const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCES_DIR = resolve(HERE, '../../content-sources/dfe');

/** Marks a line-end hyphen in the normalised source text (normalisation 2). */
const LINE_HYPHEN = '\u0001';

const SUPERS: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')', 'ⁿ': 'n', 'ⁱ': 'i',
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')',
};
const SINGLE_QUOTES = /[\u2018\u2019\u201a\u201b\u2032`]/g; // ‘ ’ ‚ ‛ ′ `
const DOUBLE_QUOTES = /[\u201c\u201d\u201e\u201f\u2033]/g; // “ ” „ ‟ ″
const DASHES = /[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g; // ‐ ‑ ‒ – — ― −
const WHITESPACE = /[\s\u00a0\u200b\u2028\u2029\ufeff]+/g;

/** Normalisations 3 and 4 (and the character part of 5). */
function normaliseChars(s: string): string {
  return s
    .replace(SINGLE_QUOTES, "'")
    .replace(DOUBLE_QUOTES, '"')
    .replace(DASHES, '-')
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎]/g, (c) => SUPERS[c]);
}

/** The source text, normalised; line-end hyphens become LINE_HYPHEN. */
/** Normalisation 6. */
function tightenBrackets(s: string): string {
  return s.replace(/\s*\(\s*/g, '(').replace(/\s*\)/g, ')');
}

function normaliseSource(raw: string): string {
  const chars = tightenBrackets(normaliseChars(raw));
  return chars
    .replace(/-[ \t\u00a0]*(?:\r?\n|\f)[\s\u00a0]*/g, LINE_HYPHEN)
    .replace(WHITESPACE, ' ')
    .trim();
}

function escapeRe(c: string): string {
  return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * A regular expression for the statement that applies normalisations 1 to 5 on the statement side,
 * matched against the normalised source text.
 */
function statementPattern(text: string): RegExp {
  const raw = tightenBrackets(text.replace(WHITESPACE, ' ').trim());
  const isScript = [...raw].map((c) => c in SUPERS);
  const chars = [...normaliseChars(raw)];
  let re = '';
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const next = chars[i + 1];
    if (c === '-') {
      if (next === ' ') {
        // "one- or": hyphen + space, or a line-end hyphen.
        re += `(?:- |${LINE_HYPHEN})`;
        i++;
      } else {
        re += `[-${LINE_HYPHEN}]`;
      }
    } else if (c === ' ') {
      re += ' ';
    } else {
      if (isScript[i] && i > 0 && chars[i - 1] !== ' ') re += ' ?';
      re += escapeRe(c);
      if (isScript[i] && next !== undefined && next !== ' ') re += ' ?';
    }
    // A word split by hyphenation at a line end: allow a line-end hyphen between two letters.
    if (next !== undefined && /\p{L}/u.test(c) && /\p{L}/u.test(next) && c !== '-') re += `${LINE_HYPHEN}?`;
  }
  return new RegExp(re, 'u');
}

const sourceCache = new Map<CurriculumSource, { raw: string; norm: string } | null>();
function loadSource(source: CurriculumSource): { raw: string; norm: string } | null {
  if (!sourceCache.has(source)) {
    const file = join(SOURCES_DIR, `${source}.txt`);
    if (!existsSync(file)) sourceCache.set(source, null);
    else {
      const raw = readFileSync(file, 'utf8');
      sourceCache.set(source, { raw, norm: normaliseSource(raw) });
    }
  }
  return sourceCache.get(source)!;
}

/**
 * The closest passage in the source: the window of as many words as the statement that shares the
 * most words with it (ties go to the earliest). Shown only to help a person judge a failure.
 */
function closestPassage(norm: string, statement: string): { passage: string; shared: number; total: number } {
  const display = norm.replaceAll(LINE_HYPHEN, '-');
  const words = display.split(' ');
  const target = normaliseChars(statement.replace(WHITESPACE, ' ').trim()).split(' ');
  const want = new Map<string, number>();
  for (const w of target) want.set(w, (want.get(w) ?? 0) + 1);
  const n = target.length;
  const have = new Map<string, number>();
  let shared = 0;
  const add = (w: string, d: 1 | -1) => {
    const before = have.get(w) ?? 0;
    const after = before + d;
    have.set(w, after);
    const cap = want.get(w) ?? 0;
    shared += Math.min(after, cap) - Math.min(before, cap);
  };
  let best = -1;
  let bestAt = 0;
  for (let i = 0; i < words.length; i++) {
    add(words[i], 1);
    if (i >= n) add(words[i - n], -1);
    if (i >= n - 1 && shared > best) {
      best = shared;
      bestAt = i - n + 1;
    }
  }
  return { passage: words.slice(bestAt, bestAt + n).join(' '), shared: Math.max(best, 0), total: n };
}

function excerptOf(text: string): string {
  const t = text.replace(WHITESPACE, ' ').trim();
  return t.length > 80 ? t.slice(0, 80) : t;
}

export function orbitLessons(): string[] {
  const orbit = MISSIONS.find((m) => m.id === 'orbit');
  return orbit ? [...orbit.lessons] : [];
}

export function runCurriculumChecks(lessonIds?: string[]): Finding[] {
  const ids = lessonIds ?? orbitLessons();
  const findings: Finding[] = [];
  for (const lesson of ids) {
    const place = (CURRICULUM as Record<string, (typeof CURRICULUM)[keyof typeof CURRICULUM] | undefined>)[lesson];
    if (!place) {
      findings.push({ check: CHECK, lesson, where: '', excerpt: '', message: `unknown lesson "${lesson}"`, level: 'fail' });
      continue;
    }
    for (const s of place.statements) {
      const base = { check: CHECK, lesson, where: `${s.source} / ${s.where}`, excerpt: excerptOf(s.text) };
      if (!(s.source in CURRICULUM_SOURCES)) {
        findings.push({ ...base, message: `unknown source "${s.source}"`, level: 'fail' });
        continue;
      }
      const src = loadSource(s.source);
      if (!src) {
        findings.push({ ...base, message: `source text missing: content-sources/dfe/${s.source}.txt`, level: 'fail' });
        continue;
      }
      if (statementPattern(s.text).test(src.norm)) {
        findings.push({ ...base, message: 'found in source', level: 'info' });
      } else {
        const near = closestPassage(src.norm, s.text);
        findings.push({
          ...base,
          message:
            `not found in source.\n      statement: ${normaliseChars(s.text.replace(WHITESPACE, ' ').trim())}\n` +
            `      closest  : ${near.passage}  [${near.shared}/${near.total} words shared]`,
          level: 'fail',
        });
      }
    }
  }
  return findings;
}

function main(argv: string[]): number {
  let ids: string[] | undefined;
  for (const a of argv) {
    if (a === '--all') ids = Object.keys(CURRICULUM);
    else if (a.startsWith('--lessons=')) ids = a.slice('--lessons='.length).split(',').map((x) => x.trim()).filter(Boolean);
    else {
      console.error(`unknown argument: ${a}`);
      return 2;
    }
  }
  const findings = runCurriculumChecks(ids);
  let failures = 0;
  for (const f of findings) {
    const tag = f.level === 'info' ? 'PASS' : f.level === 'fail' ? 'FAIL' : 'WARN';
    if (f.level === 'fail') failures++;
    console.log(`${tag}  ${f.lesson}  [${f.where}]  "${f.excerpt}"`);
    if (f.level !== 'info') console.log(`      ${f.message}`);
  }
  const statements = findings.filter((f) => !f.message.startsWith('unknown lesson')).length;
  console.log(`curriculum: ${statements} statements, ${failures} failures`);
  return failures > 0 ? 1 : 0;
}

const invokedAs = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedAs === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
