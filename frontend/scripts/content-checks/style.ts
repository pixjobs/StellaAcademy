/**
 * Style checks for lesson content (see docs/content-workflow.md, "The automatic content checks").
 *
 * Checks house style, repeated content and broken lesson links in src/lib/study-modules.ts.
 *
 * Run:
 *   npx tsx scripts/content-checks/style.ts                  # lessons in the 'orbit' mission
 *   npx tsx scripts/content-checks/style.ts --lessons=gears,units
 *   npx tsx scripts/content-checks/style.ts --all
 *
 * Exit code 1 if any check fails, 0 otherwise. Lesson titles are reported as info only.
 */
import { studyModules, type StudyModule } from '../../src/lib/study-modules';
import { MISSIONS } from '../../src/lib/missions';

export type Finding = {
  check: string;
  lesson: string;
  where: string;
  excerpt: string;
  message: string;
  level: 'fail' | 'info';
};

// ---------------------------------------------------------------------------
// Allowlists and word lists (edit these, not the logic below)
// ---------------------------------------------------------------------------

/** Capitalised words allowed after the first word of a heading (proper nouns and names). */
const PROPER_NOUNS: string[] = [
  // People
  'Newton', 'Celsius', 'Boltzmann', 'Boyle', 'Charles', 'Avogadro', 'Hohmann', 'Pythagoras',
  'Kepler', 'Galileo', 'Einstein', 'Ohm', 'Joule', 'Watt', 'Faraday', 'Maxwell', 'Planck',
  'Bohr', 'Broglie', 'Schrödinger', 'Heisenberg', 'Hooke', 'Euler', 'Leibniz', 'Doppler',
  'Fourier', 'Fleming', 'Lenz', 'Coulomb', 'Ampère', 'Volta', 'Hertz', 'Tsiolkovsky', 'Bernoulli',
  'Descartes', 'Pythagorean', 'Gauss', 'Pascal', 'Fahrenheit', 'Rayleigh', 'Snell', 'Hubble', 'Wien', 'Stefan',
  'Carnot', 'Bayes', 'Boole',
  // Places, bodies, organisations, missions and craft
  'Earth', 'Mars', 'Moon', 'Sun', 'Jupiter', 'Saturn', 'Venus', 'Mercury', 'Neptune', 'Uranus',
  'Pluto', 'Titan', 'Europa', 'Milky', 'Way', 'Solar', 'System',
  'NASA', 'ESA', 'ISS', 'International', 'Space', 'Station', 'Department', 'Education', 'England',
  'UK', 'USA', 'Perseverance', 'Curiosity', 'Jezero', 'Artemis', 'Orion', 'Apollo', 'Shuttle',
  'Discovery', 'Mars', 'Climate', 'Orbiter', 'Falcon', 'Voyager', 'Hubble', 'Webb', 'James',
  'Saturn', 'Cassini', 'Rosetta', 'Gemini', 'Starship',
  // Qualifications, standards, acronyms
  'SI', 'GCSE', 'GCSEs', 'A-level', 'A-levels', 'DfE', 'LEO', 'GEO', 'GPS', 'DNA', 'RPM',
  'X-ray', 'X-rays', 'AC', 'DC', 'LED', 'LEDs',
];

/** Words of 3+ capital letters that are acronyms, not emphasis. */
const ACRONYMS: string[] = [
  'NASA', 'SLS', 'ISS', 'LEO', 'GEO', 'GCSE', 'GCSEs', 'SI', 'DNA', 'RPM', 'ESA', 'UK', 'USA', 'GPS', 'DfE',
  'LED', 'LEDs', 'GCE', 'LDR', 'LDRs', 'ACS', 'VIP', 'SOH', 'CAH', 'TOA', 'SOHCAHTOA', 'BIDMAS', 'BODMAS', 'AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR',
  'ASCII', 'CPU', 'RAM', 'ROM', 'USB', 'HTML', 'JPL', 'GMT', 'UTC', 'EMF', 'FM', 'AM', 'UV', 'SUVAT',
  'CMB', 'LHC', 'CERN', 'JWST', 'MRI', 'PET', 'CT', 'ECG', 'III', 'II', 'IV', 'VI',
];
/**
 * Logic-gate names are acronyms only in a lesson about logic; everywhere else "AND" in capitals is
 * emphasis. These are allowed only in the lessons listed.
 */
const LOGIC_WORDS = new Set(['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR']);
const LOGIC_LESSONS = new Set(['binary']);

/** American spelling -> British spelling. Patterns are matched as whole words, case-insensitive. */
const AMERICAN_SPELLINGS: Array<{ pattern: RegExp; british: string }> = [
  { pattern: /\bcolor(?:s|ed|ful|ing)?\b/gi, british: 'colour' },
  { pattern: /\bcenter(?:s|ed|ing)?\b/gi, british: 'centre' },
  { pattern: /\b(?:kilo|centi|milli|micro|nano)?meters?\b/gi, british: 'metre' },
  { pattern: /\b(?:milli|centi)?liters?\b/gi, british: 'litre' },
  { pattern: /\banalyz(?:e|es|ed|ing)\b/gi, british: 'analyse' },
  { pattern: /\bbehaviors?\b|\bbehavioral\b/gi, british: 'behaviour' },
  { pattern: /\bfibers?\b/gi, british: 'fibre' },
  { pattern: /\bgray(?:s|er|ish)?\b/gi, british: 'grey' },
  { pattern: /\bmaneuver(?:s|ed|ing|able)?\b/gi, british: 'manoeuvre' },
  { pattern: /\baluminum\b/gi, british: 'aluminium' },
];

// ---------------------------------------------------------------------------
// Text extraction
// ---------------------------------------------------------------------------

type Kind = 'plain' | 'heading' | 'latex' | 'markdown';
type Field = { where: string; text: string; kind: Kind };

/** The text fields a learner reads. Never includes colour classes, symbols or formula layouts. */
function textFields(m: StudyModule): Field[] {
  const f: Field[] = [];
  f.push({ where: 'subtitle', text: m.subtitle, kind: 'plain' });
  m.variables.forEach((v, i) => {
    f.push({ where: `variables[${i}].name`, text: v.name, kind: 'plain' });
    f.push({ where: `variables[${i}].description`, text: v.description, kind: 'plain' });
  });
  m.conceptSteps.forEach((s, i) => {
    f.push({ where: `conceptSteps[${i}].title`, text: s.title, kind: 'heading' });
    f.push({ where: `conceptSteps[${i}].content`, text: s.content, kind: 'plain' });
    f.push({ where: `conceptSteps[${i}].keyInsight`, text: s.keyInsight, kind: 'plain' });
  });
  f.push({ where: 'solvedExample.problem', text: m.solvedExample.problem, kind: 'plain' });
  m.solvedExample.steps.forEach((s, i) => f.push({ where: `solvedExample.steps[${i}]`, text: s, kind: 'plain' }));
  f.push({ where: 'solvedExample.resultFormula', text: m.solvedExample.resultFormula, kind: 'latex' });
  m.practiceProblems.forEach((p, i) => {
    f.push({ where: `practiceProblems[${i}].question`, text: p.question, kind: 'plain' });
    f.push({ where: `practiceProblems[${i}].hint`, text: p.hint, kind: 'plain' });
    f.push({ where: `practiceProblems[${i}].answer`, text: p.answer, kind: 'plain' });
  });
  f.push({ where: 'realWorldConnection', text: m.realWorldConnection, kind: 'plain' });
  return f;
}

/** Every field, with textbookContent split into one field per line (title is handled separately). */
function lineFields(m: StudyModule): Field[] {
  const f = textFields(m);
  (m.textbookContent ?? '').split('\n').forEach((line, i) => {
    if (line.trim()) f.push({ where: `textbookContent line ${i + 1}`, text: line, kind: 'markdown' });
  });
  return f;
}

/** Replace a match with spaces so positions in the string are kept. */
const blank = (s: string) => s.replace(/[^\n]/g, ' ');

/**
 * Hide maths ($$...$$, $...$, \(...\)), inline code and link targets, keeping positions.
 * Used for the capital, heading and spelling checks. A pure-LaTeX field is hidden completely.
 */
function maskNonProse(text: string, kind: Kind): string {
  if (kind === 'latex') return blank(text);
  let t = text;
  t = t.replace(/\$\$[\s\S]*?\$\$/g, blank);
  t = t.replace(/\$[^$\n]*\$/g, blank);
  t = t.replace(/\\\([\s\S]*?\\\)/g, blank);
  t = t.replace(/`[^`\n]*`/g, blank);
  t = t.replace(/\]\([^)\s]*\)/g, (s) => ']' + blank(s.slice(1)));
  t = t.replace(/https?:\/\/\S+/g, blank);
  // Any LaTeX command left outside maths (should be rare) must not count as a word.
  t = t.replace(/\\[A-Za-z]+/g, blank);
  return t;
}

/** Math over multi-line $$ blocks in textbookContent: mask the whole markdown first, then split. */
function maskedTextbookLines(m: StudyModule): Map<number, string> {
  const masked = maskNonProse(m.textbookContent ?? '', 'markdown');
  const out = new Map<number, string>();
  masked.split('\n').forEach((line, i) => out.set(i + 1, line));
  return out;
}

function excerptAt(text: string, index: number, length: number, pad = 30): string {
  const start = Math.max(0, index - pad);
  const end = Math.min(text.length, index + length + pad);
  return (start > 0 ? '...' : '') + text.slice(start, end).replace(/\s+/g, ' ').trim() + (end < text.length ? '...' : '');
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

const properNouns = new Set(PROPER_NOUNS);
const acronyms = new Set(ACRONYMS);

/** Words after the first that are capitalised but are not proper nouns or acronyms. */
function sentenceCaseProblems(heading: string): string[] {
  const words = heading.match(/[\p{L}][\p{L}\p{N}'’-]*/gu) ?? [];
  const bad: string[] = [];
  words.slice(1).forEach((w) => {
    const base = w.replace(/['’]s$/u, '').replace(/['’]$/u, '');
    if (!/^\p{Lu}/u.test(base)) return;
    if (properNouns.has(base) || properNouns.has(w) || acronyms.has(base)) return;
    if (/^\p{Lu}$/u.test(base) && base !== 'A') return; // single-letter symbols such as N or F
    if (/^[\p{Lu}\p{N}]{2,}$/u.test(base)) return; // all capitals: the capitals check reports these
    if (/\p{N}/u.test(base)) return; // e.g. CO2, H2O
    // Hyphenated proper nouns such as Earth-Moon
    if (base.includes('-') && base.split('-').every((p) => !/^\p{Lu}/u.test(p) || properNouns.has(p) || acronyms.has(p))) return;
    bad.push(w);
  });
  return bad;
}

function checkSentenceCase(lesson: string, fields: Field[], tbLines: Map<number, string>, push: (f: Finding) => void) {
  for (const f of fields) {
    if (f.kind === 'heading') {
      const bad = sentenceCaseProblems(maskNonProse(f.text, 'plain'));
      if (bad.length) push({ check: 'sentence-case', lesson, where: f.where, excerpt: f.text, level: 'fail', message: `Heading not in sentence case: ${bad.map((b) => `"${b}"`).join(', ')} should be lower case.` });
    } else if (f.kind === 'markdown') {
      const n = Number(f.where.replace('textbookContent line ', ''));
      const masked = tbLines.get(n) ?? '';
      const h = /^\s{0,3}(#{1,3})\s+(.*)$/.exec(masked);
      if (!h) continue;
      const bad = sentenceCaseProblems(h[2]);
      if (bad.length) push({ check: 'sentence-case', lesson, where: f.where, excerpt: f.text.trim(), level: 'fail', message: `Heading not in sentence case: ${bad.map((b) => `"${b}"`).join(', ')} should be lower case.` });
    }
  }
}

function checkDashes(lesson: string, fields: Field[], push: (f: Finding) => void) {
  for (const f of fields) {
    for (const m of f.text.matchAll(/—/g)) {
      push({ check: 'dashes', lesson, where: f.where, excerpt: excerptAt(f.text, m.index!, 1), level: 'fail', message: 'Em dash (—): use a full stop, comma, colon or brackets.' });
    }
    for (const m of f.text.matchAll(/–/g)) {
      const i = m.index!;
      if (/\d/.test(f.text[i - 1] ?? '') && /\d/.test(f.text[i + 1] ?? '')) continue; // number range
      push({ check: 'dashes', lesson, where: f.where, excerpt: excerptAt(f.text, i, 1), level: 'fail', message: 'En dash (–) outside a number range: use a hyphen, comma or colon.' });
    }
  }
}

function checkCapitals(lesson: string, fields: Field[], tbLines: Map<number, string>, push: (f: Finding) => void) {
  for (const f of fields) {
    const masked = f.kind === 'markdown' ? tbLines.get(Number(f.where.replace('textbookContent line ', ''))) ?? '' : maskNonProse(f.text, f.kind);
    for (const m of masked.matchAll(/\bKelvin\b/g)) {
      // A capital at the start of a sentence or heading is correct English.
      if (/(?:^|[.!?:]\s+|^\s*#{1,6}\s+|^\s*[*-]\s+)$/.test(masked.slice(0, m.index!))) continue;
      push({ check: 'capitals', lesson, where: f.where, excerpt: excerptAt(f.text, m.index!, 6), level: 'fail', message: 'Unit names are lower case: "kelvin", not "Kelvin".' });
    }
    for (const m of masked.matchAll(/(?<![\p{L}\p{N}-])\p{Lu}{3,}s?(?![\p{L}\p{N}-])/gu)) {
      const w = m[0];
      const base = w.endsWith('s') && !acronyms.has(w) ? w.slice(0, -1) : w;
      const isLogic = LOGIC_WORDS.has(base);
      if (isLogic ? LOGIC_LESSONS.has(lesson) : acronyms.has(w) || acronyms.has(base)) continue;
      push({ check: 'capitals', lesson, where: f.where, excerpt: excerptAt(f.text, m.index!, w.length), level: 'fail', message: `"${w}" in capitals: do not use capitals for emphasis (add it to ACRONYMS if it is an acronym).` });
    }
  }
}

function checkUnits(lesson: string, fields: Field[], push: (f: Finding) => void) {
  for (const f of fields) {
    // Not masked: units inside LaTeX are still displayed.
    for (const m of f.text.matchAll(/(?<![A-Za-z])Nm(?![A-Za-z])/g)) {
      push({ check: 'units', lesson, where: f.where, excerpt: excerptAt(f.text, m.index!, 2), level: 'fail', message: 'Write newton metres as "N m" (with a space), not "Nm".' });
    }
    for (const m of f.text.matchAll(/kg\s*(?:[·⋅•]|\\cdot)\s*(?:\\text\{\s*)?m\s*\/\s*s/g)) {
      push({ check: 'units', lesson, where: f.where, excerpt: excerptAt(f.text, m.index!, m[0].length), level: 'fail', message: 'Write momentum units as "kg m/s" (as in the notes), not with a middle dot.' });
    }
  }
}

function checkSpelling(lesson: string, fields: Field[], tbLines: Map<number, string>, push: (f: Finding) => void) {
  for (const f of fields) {
    const masked = f.kind === 'markdown' ? tbLines.get(Number(f.where.replace('textbookContent line ', ''))) ?? '' : maskNonProse(f.text, f.kind);
    for (const { pattern, british } of AMERICAN_SPELLINGS) {
      for (const m of masked.matchAll(pattern)) {
        push({ check: 'spelling', lesson, where: f.where, excerpt: excerptAt(f.text, m.index!, m[0].length), level: 'fail', message: `American spelling "${m[0]}": use the British form (${british}).` });
      }
    }
  }
}

/** Numbers as whole tokens: "12-tooth" gives 12; "15" does not contain 5. Thousands separators removed. */
function numbersIn(text: string): Set<string> {
  const t = text
    .replace(/[_^]\{?-?\d+\}?/g, ' ') // LaTeX subscripts and powers such as r_1, 10^{24}
    .replace(/(\d)\{?,\}?(?=\d{3}\b)/g, '$1');
  return new Set((t.match(/\d+(?:\.\d+)?/g) ?? []).map((n) => String(Number(n))));
}

function checkRepeatedExample(lesson: string, m: StudyModule, push: (f: Finding) => void) {
  const problem = m.solvedExample.problem;
  const wanted = numbersIn(problem);
  if (wanted.size < 2 || !m.textbookContent) return;
  const lines = m.textbookContent.split('\n');
  // Blocks: a section under a heading containing "worked example", or from an "Example:" /
  // "Worked example" paragraph marker to the next heading.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeading = /^\s{0,3}#{1,6}\s+.*worked example/i.test(line);
    const isMarker = !/^\s{0,3}#/.test(line) && /^\s*[*_]{0,2}(?:worked\s+)?example\b/i.test(line);
    if (!isHeading && !isMarker) continue;
    let j = i + 1;
    while (j < lines.length && !/^\s{0,3}#{1,6}\s/.test(lines[j]) && !(isMarker && /^\s*[*_]{0,2}(?:worked\s+)?example\b/i.test(lines[j]))) j++;
    const block = lines.slice(i, j).join('\n');
    const have = numbersIn(block);
    if ([...wanted].every((n) => have.has(n))) {
      push({ check: 'repeats', lesson, where: `textbookContent line ${i + 1}`, excerpt: problem.length > 120 ? problem.slice(0, 117) + '...' : problem, level: 'fail', message: `Worked example appears twice: all the numbers of solvedExample.problem (${[...wanted].join(', ')}) appear in this worked example of the notes.` });
    }
  }
}

function normaliseSentence(s: string): string {
  return s
    .replace(/\$\$|\$|\\\(|\\\)|\\\[|\\\]/g, ' ')
    .replace(/\]\([^)]*\)/g, ' ')
    .replace(/[*_#>`[\]]/g, ' ')
    .replace(/^\s*(?:\d+\.|-)\s+/, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.!?:;,\s]+$/, '')
    .trim();
}

function checkRepeatedSentences(lesson: string, fields: Field[], push: (f: Finding) => void) {
  const seen = new Map<string, Array<{ where: string; original: string }>>();
  for (const f of fields) {
    if (f.kind === 'latex') continue;
    // Sentence ends: . ! ? followed by space (not decimals such as 3.0).
    const parts = f.text.split(/(?<=[.!?])\s+(?=[^a-z0-9])/);
    for (const p of parts) {
      const n = normaliseSentence(p);
      if (n.split(' ').filter((w) => /[a-z0-9]/.test(w)).length < 8) continue;
      const list = seen.get(n) ?? [];
      if (!list.some((x) => x.where === f.where)) list.push({ where: f.where, original: p.trim() });
      seen.set(n, list);
    }
  }
  for (const list of seen.values()) {
    if (list.length < 2) continue;
    push({ check: 'repeats', lesson, where: list.map((x) => x.where).join(' and '), excerpt: list[0].original, level: 'fail', message: `Same sentence appears in ${list.length} places.` });
  }
}

/** Collect every string anywhere in a lesson, with a path, for the link check. */
function allStrings(value: unknown, path: string, out: Array<{ where: string; text: string }>) {
  if (typeof value === 'string') out.push({ where: path, text: value });
  else if (Array.isArray(value)) value.forEach((v, i) => allStrings(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) allStrings(v, path ? `${path}.${k}` : k, out);
}

function checkLinks(push: (f: Finding) => void) {
  const ids = new Set(studyModules.map((m) => m.id as string));
  for (const m of studyModules) {
    const strings: Array<{ where: string; text: string }> = [];
    allStrings(m, '', strings);
    for (const s of strings) {
      const lines = s.text.split('\n');
      lines.forEach((line, li) => {
        for (const l of line.matchAll(/\]\(\s*\/study\/([^)\s#?/]*)[^)]*\)/g)) {
          if (ids.has(l[1])) continue;
          const where = s.where === 'textbookContent' ? `textbookContent line ${li + 1}` : s.where;
          push({ check: 'links', lesson: m.id, where, excerpt: excerptAt(line, l.index!, l[0].length, 40), level: 'fail', message: `Link to /study/${l[1]}, but there is no lesson with id "${l[1]}".` });
        }
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

export function runStyleChecks(lessonIds: string[]): Finding[] {
  const findings: Finding[] = [];
  const push = (f: Finding) => findings.push(f);
  for (const id of lessonIds) {
    const m = studyModules.find((x) => x.id === id);
    if (!m) {
      push({ check: 'lessons', lesson: id, where: '-', excerpt: id, level: 'fail', message: `No lesson with id "${id}".` });
      continue;
    }
    const fields = lineFields(m);
    const tbLines = maskedTextbookLines(m);
    checkSentenceCase(id, fields, tbLines, push);
    checkDashes(id, [{ where: 'title', text: m.title, kind: 'plain' }, ...fields], push);
    checkCapitals(id, [{ where: 'title', text: m.title, kind: 'plain' }, ...fields], tbLines, push);
    checkUnits(id, fields, push);
    checkSpelling(id, [{ where: 'title', text: m.title, kind: 'plain' }, ...fields], tbLines, push);
    checkRepeatedExample(id, m, push);
    checkRepeatedSentences(id, fields, push);
    // Lesson titles: sentence case not yet decided, so report only.
    const bad = sentenceCaseProblems(maskNonProse(m.title, 'plain'));
    push({ check: 'lesson-title', lesson: id, where: 'title', excerpt: m.title, level: 'info', message: bad.length ? `Not sentence case (${bad.join(', ')}); not a failure until the title style is decided.` : 'Sentence case.' });
  }
  // Links are checked across every lesson, whatever the filter.
  checkLinks(push);
  return findings;
}

function lessonsFromArgs(argv: string[]): string[] {
  if (argv.includes('--all')) return studyModules.map((m) => m.id);
  const arg = argv.find((a) => a.startsWith('--lessons='));
  if (arg) return arg.slice('--lessons='.length).split(',').map((s) => s.trim()).filter(Boolean);
  const orbit = MISSIONS.find((m) => m.id === 'orbit');
  return orbit ? [...orbit.lessons] : [];
}

function main() {
  const lessons = lessonsFromArgs(process.argv.slice(2));
  const findings = runStyleChecks(lessons);
  const fails = findings.filter((f) => f.level === 'fail');
  const infos = findings.filter((f) => f.level === 'info');

  console.log(`Style checks for ${lessons.length} lesson(s): ${lessons.join(', ')}\n`);
  const lessonOrder = [...lessons, ...new Set(fails.map((f) => f.lesson).filter((l) => !lessons.includes(l)))];
  for (const lesson of lessonOrder) {
    const mine = fails.filter((f) => f.lesson === lesson);
    const extra = lessons.includes(lesson) ? '' : ' (links check, all lessons)';
    if (!mine.length) {
      console.log(`== ${lesson}: ok\n`);
      continue;
    }
    console.log(`== ${lesson}${extra}: ${mine.length} failure(s)`);
    for (const check of [...new Set(mine.map((f) => f.check))]) {
      console.log(`  -- ${check}`);
      for (const f of mine.filter((x) => x.check === check)) {
        console.log(`     ${f.where}: ${f.message}`);
        console.log(`        "${f.excerpt}"`);
      }
    }
    console.log('');
  }
  if (infos.length) {
    console.log('Info (not failures):');
    for (const f of infos) console.log(`  ${f.lesson} ${f.where}: "${f.excerpt}" - ${f.message}`);
    console.log('');
  }
  console.log(`style: ${fails.length} failures, ${infos.length} info`);
  process.exit(fails.length ? 1 : 0);
}

const entry = process.argv[1] ?? '';
if (/content-checks[\\/]style\.(?:ts|js|mjs|cjs)$/.test(entry)) main();
