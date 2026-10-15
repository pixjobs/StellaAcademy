'use client';

import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/track';
import { answerText, markTyped, rng, type LessonQuiz, type Question } from '@/lib/quiz/core';
import { QUIZZES } from '@/lib/quiz';
import { useQuizActive } from '@/lib/quiz/active';
import { dueNow, roundsToday, useSavedProgress, type RoundRecord } from '@/lib/quiz/progress';
import type { ConceptId } from '@/lib/study-modules';

const QUESTIONS_PER_QUIZ = 10;

/** A question with the round and seed that make it, so a missed one can be made again for review. */
type Item = { round: string; seed: number; question: Question };
type Result = { item: Item; firstTime: boolean; note?: string };
/** A round's id, or 'review'. */
type Mode = string;

const itemFor = (quiz: LessonQuiz, round: string, seed: number): Item => ({ round, seed, question: quiz.make(round, rng(seed)) });

/** Ten new questions, each from its own random seed. Called only from click handlers. */
function newItems(quiz: LessonQuiz, round: string): Item[] {
  return Array.from({ length: QUESTIONS_PER_QUIZ }, () => itemFor(quiz, round, Math.floor(Math.random() * 2 ** 31)));
}

const labelFor = (quiz: LessonQuiz) => (mode: Mode) => (mode === 'review' ? 'Review' : (quiz.rounds[mode]?.label ?? mode));

function dayLabel(at: number, now: number): string {
  const d = new Date(at);
  const today = new Date(now);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return 'today';
  const yesterday = new Date(now - 24 * 60 * 60 * 1000);
  if (sameDay(d, yesterday)) return 'yesterday';
  if (sameDay(d, new Date(now + 24 * 60 * 60 * 1000))) return 'tomorrow';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function History({ rounds, now, label }: { rounds: RoundRecord[]; now: number; label: (mode: Mode) => string }) {
  if (!rounds.length) return null;
  return (
    <ul className="mt-2 space-y-1 text-sm text-slate-200">
      {rounds
        .slice(-6)
        .reverse()
        .map((r) => (
          <li key={r.at} className="flex justify-between gap-3">
            <span>
              {label(r.round)}, {dayLabel(r.at, now)}
            </span>
            <span className="font-semibold text-white">
              {r.score} out of {r.out}
              {r.done === false ? ' (not finished)' : ''}
            </span>
          </li>
        ))}
    </ul>
  );
}

/** One question, answered step by step. Later steps stay hidden until the one before is right. */
function QuestionCard({
  question,
  number,
  total,
  onDone,
  onFinished,
  onSlip,
  announce,
}: {
  question: Question;
  number: number;
  total: number;
  onDone: (firstTime: boolean, note?: string) => void;
  /** The last step is answered or the working is shown: leaving now no longer voids the question. */
  onFinished: () => void;
  /** The first slip, or "show me how": the question is saved as missed at once, so leaving cannot hide it. */
  onSlip: () => void;
  announce: (text: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]); // wrong options tried on this step
  const [feedback, setFeedback] = useState('');
  const [typed, setTyped] = useState('');
  const [slips, setSlips] = useState(0);
  const [shown, setShown] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const slipped = useRef(false);
  const slip = () => {
    if (slipped.current) return;
    slipped.current = true;
    onSlip();
  };
  const finished = step >= question.steps.length || shown;
  const current = question.steps[step];

  // Keep the keyboard where the work is: the current step's first choice or box, or "Next" when done.
  useEffect(() => {
    const target = box.current?.querySelector<HTMLElement>(finished ? '[data-next]' : `[data-step="${step}"] input, [data-step="${step}"] button:not([aria-disabled="true"])`);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'nearest' });
  }, [step, finished]);

  const advance = (given: string) => {
    setAnswers((a) => [...a, given]);
    setStep((s) => s + 1);
    setWrong([]);
    setFeedback('');
    setTyped('');
    if (step + 1 >= question.steps.length) {
      onFinished();
      announce(slips ? 'Correct. Done, with a little help.' : 'Correct. Right first time!');
    } else announce(`Correct. Step ${step + 2}.`);
  };

  const miss = (text: string) => {
    setFeedback(text);
    announce(text);
  };

  const choose = (k: number) => {
    if (current?.type !== 'choice' || wrong.includes(k)) return;
    if (k === current.correct) advance(current.options[k]);
    else {
      setWrong((w) => [...w, k]);
      miss(current.why[k] ?? 'Not quite. Try again.');
      setSlips((s) => s + 1);
      slip();
    }
  };

  const submit = () => {
    if (current?.type !== 'number' && current?.type !== 'fraction') return;
    const m = markTyped(current, typed);
    if (m.ok) advance(answerText(current));
    else {
      miss(m.feedback);
      if (typed.trim()) {
        setSlips((s) => s + 1);
        slip();
      }
    }
  };

  const showMe = () => {
    setShown(true);
    slip();
    onFinished();
    announce('Here is how it works. This one does not count.');
  };

  return (
    <div ref={box}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Question {number} of {total}
      </p>
      <p className="mt-1 font-fraunces text-xl font-semibold leading-snug text-white">{question.prompt}</p>

      <ol className="mt-4 space-y-3">
        {question.steps.slice(0, finished ? question.steps.length : step + 1).map((s, i) => {
          const done = i < step;
          return (
            <li key={i} data-step={i} className={`rounded-xl px-3 py-3 ring-1 ${done ? 'bg-emerald-400/[0.07] ring-emerald-300/30' : 'bg-white/[0.05] ring-white/15'}`}>
              <p id={`q${number}-s${i}`} className="text-sm text-slate-100">
                <span className="mr-1.5 font-semibold text-slate-400">Step {i + 1}.</span>
                {s.prompt}
              </p>
              {done ? (
                <p className="mt-1.5 text-sm font-semibold text-emerald-200">
                  <span aria-hidden>✓ </span>
                  {answers[i]}
                </p>
              ) : shown ? null : s.type === 'choice' ? (
                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={`Step ${i + 1} choices`} aria-describedby={`q${number}-s${i}`}>
                  {s.options.map((o, k) => (
                    <button
                      key={o}
                      type="button"
                      aria-disabled={wrong.includes(k)}
                      onClick={() => choose(k)}
                      className="rounded-lg border border-white/20 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white hover:border-cyan-300 aria-disabled:cursor-not-allowed aria-disabled:border-rose-400/40 aria-disabled:bg-rose-500/10 aria-disabled:text-rose-200 aria-disabled:line-through focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                    >
                      {o}
                    </button>
                  ))}
                </div>
              ) : (
                <form
                  className="mt-2 flex flex-wrap items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                  }}
                >
                  {s.type === 'number' && s.unit === '£' && <span className="text-lg font-semibold text-slate-200">£</span>}
                  <input
                    inputMode={s.type === 'fraction' ? 'text' : 'decimal'}
                    autoComplete="off"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder={s.type === 'fraction' ? 'for example 7/20' : undefined}
                    aria-describedby={`q${number}-s${i}`}
                    aria-label={`Step ${i + 1} answer${s.type === 'number' && s.unit ? ` in ${s.unit === '%' ? 'per cent' : s.unit}` : ''}`}
                    className="w-32 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-lg font-semibold text-white focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                  />
                  {s.type === 'number' && s.unit && s.unit !== '£' && <span className="text-sm font-semibold text-slate-200">{s.unit}</span>}
                  <button type="submit" className="rounded-lg bg-[#f6c453] px-3 py-2 text-sm font-bold text-[#0b1026] hover:bg-[#f8d27a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    Check
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-3 min-h-[1.25rem] text-sm text-rose-200">
        {!finished && feedback}
      </p>

      {finished ? (
        <div className="mt-2 rounded-xl border border-cyan-300/30 bg-cyan-400/[0.08] p-3">
          <p className="text-sm font-semibold text-white">
            {shown ? 'Here is how it works. This one does not count.' : slips ? 'Done. You got there with a little help.' : 'Right first time!'}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-100">
            {question.workings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <button
            type="button"
            data-next
            onClick={() => onDone(!shown && slips === 0, shown ? 'You looked at the working' : slips ? 'Needed another try' : undefined)}
            className="mt-3 rounded-lg bg-[#f6c453] px-4 py-2 text-sm font-bold text-[#0b1026] hover:bg-[#f8d27a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {number === total ? 'See your score' : 'Next question'}
          </button>
        </div>
      ) : (
        <button type="button" onClick={showMe} className="mt-1 text-sm text-slate-300 underline underline-offset-2 hover:text-white">
          Show me how (this question will not count)
        </button>
      )}
    </div>
  );
}

/**
 * A lesson's quiz: 10 generated questions, each answered in steps. A question counts as right only if
 * every step is right first time, without looking at the working. Scores and missed questions are saved
 * in this browser (lib/quiz/progress.ts); missed ones come back for review. While a question is in
 * progress the lesson's explore model pauses (lib/quiz/active.ts).
 */
export default function QuizPanel({ lesson }: { lesson: ConceptId }) {
  const quiz = QUIZZES[lesson]!;
  const label = labelFor(quiz);
  const saved = useSavedProgress(quiz.storageKey);
  const setActive = useQuizActive((s) => s.set);
  const [mode, setMode] = useState<Mode | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [roundAt, setRoundAt] = useState(0);
  const [saved1, setSaved1] = useState<number[]>([]); // questions already saved as missed, by number
  const [cardDone, setCardDone] = useState(false);
  const [said, setSaid] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [confirmClear, setConfirmClear] = useState(false);
  const total = items.length;

  // Announce, even when the same words come twice in a row.
  const announce = (text: string) => setSaid((old) => (old === text ? `${text}\u00a0` : text));

  const finishRound = (all: Result[]) => {
    const t = Date.now();
    setNow(t);
    const score = all.filter((x) => x.firstTime).length;
    saved.end(roundAt);
    setSaid(`${score} out of ${all.length} right first time.`);
    track('quiz_finished', { lesson, round: mode!, score });
  };

  // A question is in progress: pause the explore model so it cannot work the answer out.
  const inProgress = !!mode && results.length < total && !cardDone;
  useEffect(() => {
    setActive(lesson, inProgress);
  }, [lesson, inProgress, setActive]);
  useEffect(() => () => setActive(lesson, false), [lesson, setActive]);

  const start = (m: Mode) => {
    const t = Date.now();
    setNow(t);
    const next = m === 'review' ? dueNow(saved.review, t).filter((x) => x.round in quiz.rounds).slice(0, QUESTIONS_PER_QUIZ).map((x) => itemFor(quiz, x.round, x.seed)) : newItems(quiz, m);
    if (!next.length) return;
    setMode(m);
    setItems(next);
    setResults([]);
    setSaved1([]);
    setRoundAt(t);
    saved.begin(m, t);
    setCardDone(false);
    setConfirmClear(false);
    track('quiz_started', { lesson, round: m });
  };

  // One live region that is always there, so screen readers hear each "Correct" and the score.
  const live = (
    <p className="sr-only" aria-live="polite">
      {said}
    </p>
  );

  if (!mode) {
    const due = dueNow(saved.review, now).filter((x) => x.round in quiz.rounds);
    const later = saved.review.filter((x) => x.due > now).sort((a, b) => a.due - b.due);
    return (
      <div>
        {live}
        <p className="text-sm text-slate-200">
          Ten questions, each in steps. A question counts only if every step is right first time. New numbers every time.
        </p>
        <div className="mt-4 grid gap-2.5">
          {due.length > 0 && (
            <button
              type="button"
              onClick={() => start('review')}
              className="rounded-xl border border-amber-300/50 bg-amber-400/10 px-4 py-3 text-left hover:border-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
            >
              <span className="block font-semibold text-white">Review: {Math.min(due.length, QUESTIONS_PER_QUIZ)} question{due.length === 1 ? '' : 's'} to try again</span>
              <span className="block text-sm text-slate-200">Questions you missed before. Get one right and it comes back less often.</span>
            </button>
          )}
          {Object.keys(quiz.rounds).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => start(r)}
              className="rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-left hover:border-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              <span className="block font-semibold text-white">{quiz.rounds[r].label}</span>
              <span className="block text-sm text-slate-300">{quiz.rounds[r].blurb}</span>
            </button>
          ))}
        </div>
        {!due.length && later.length > 0 && (
          <p className="mt-3 text-sm text-slate-300">
            {later.length} question{later.length === 1 ? '' : 's'} saved for review. The next one comes back {dayLabel(later[0].due, now)}.
          </p>
        )}
        {saved.rounds.length > 0 && (
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-sm font-semibold text-white">Your recent rounds</p>
            <History rounds={saved.rounds} now={now} label={label} />
            <p className="mt-3 text-xs text-slate-400">
              Saved in this browser only, never sent to us.{' '}
              {confirmClear ? (
                <button type="button" onClick={() => { saved.clear(); setConfirmClear(false); }} className="font-semibold text-rose-200 underline underline-offset-2">
                  Yes, clear my scores and review list
                </button>
              ) : (
                <button type="button" onClick={() => setConfirmClear(true)} className="underline underline-offset-2 hover:text-white">
                  Clear saved progress
                </button>
              )}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (results.length >= total) {
    const score = results.filter((x) => x.firstTime).length;
    const today = roundsToday(saved.rounds, now);
    return (
      <div>
        {live}
        <p className="font-fraunces text-2xl font-semibold text-white">
          {score} out of {total} right first time
        </p>
        <p className="mt-1 text-sm text-slate-300">{label(mode)} round</p>
        {today.length > 1 && (
          <p className="mt-2 text-sm text-slate-200">
            Your rounds today: {today.map((r) => `${r.score} out of ${r.out}${r.done === false && r.at !== roundAt ? ' (not finished)' : ''}`).join(', ')}
          </p>
        )}
        {score < total && (
          <>
            <p className="mt-4 text-sm font-semibold text-white">Worth another look:</p>
            <p className="text-xs text-slate-400">These come back for review tomorrow.</p>
            <ul className="mt-2 space-y-2">
              {results
                .filter((x) => !x.firstTime)
                .map((x, i) => (
                  <li key={i} className="rounded-xl bg-white/[0.05] px-3 py-2.5 text-sm ring-1 ring-white/10">
                    <p className="font-semibold text-white">{x.item.question.prompt}</p>
                    {x.note && <p className="text-xs text-slate-400">{x.note}</p>}
                    <p className="mt-1 text-slate-200">{x.item.question.workings[x.item.question.workings.length - 1]}</p>
                  </li>
                ))}
            </ul>
          </>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {mode !== 'review' && (
            <button type="button" onClick={() => start(mode)} className="rounded-lg bg-[#f6c453] px-4 py-2 text-sm font-bold text-[#0b1026] hover:bg-[#f8d27a]">
              Another {label(mode).toLowerCase()} round
            </button>
          )}
          <button type="button" onClick={() => { setNow(Date.now()); setMode(null); }} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-cyan-300">
            {mode === 'review' ? 'Back to the rounds' : 'Choose a different round'}
          </button>
        </div>
      </div>
    );
  }

  const n = results.length;
  return (
    <div>
      {live}
      <div className="mb-3 flex items-center justify-between gap-3 text-sm text-slate-300">
        <span>{label(mode)} round</span>
        <span>
          Right first time: <strong className="text-white">{results.filter((x) => x.firstTime).length}</strong>
        </span>
      </div>
      <QuestionCard
        key={n}
        question={items[n].question}
        number={n + 1}
        total={total}
        announce={announce}
        onFinished={() => setCardDone(true)}
        onSlip={() => {
          saved.answer(roundAt, { round: items[n].round, seed: items[n].seed, firstTime: false });
          setSaved1((x) => [...x, n]);
        }}
        onDone={(firstTime, note) => {
          saved.answer(roundAt, { round: items[n].round, seed: items[n].seed, firstTime }, Date.now(), saved1.includes(n));
          setCardDone(false);
          const next = [...results, { item: items[n], firstTime, note }];
          setResults(next);
          if (next.length >= total) finishRound(next);
        }}
      />
    </div>
  );
}
