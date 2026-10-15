'use client';

import { useEffect, useImperativeHandle, useRef, useState, type RefObject } from 'react';
import { track } from '@/lib/track';
import { makeQuestion, markNumber, rng, ROUNDS, type Question, type Round } from '@/lib/measures-quiz';

const QUESTIONS_PER_QUIZ = 10;

type Result = { question: Question; firstTime: boolean; note?: string };

export type QuizHandle = { interrupt: () => void };

/** Ten new questions from a fresh random seed. Called only from click handlers. */
function newQuestions(round: Round): Question[] {
  const random = rng(Math.floor(Math.random() * 2 ** 31));
  return Array.from({ length: QUESTIONS_PER_QUIZ }, () => makeQuestion(round, random));
}

/** One question, answered step by step. Later steps stay hidden until the one before is right. */
function QuestionCard({
  question,
  number,
  onDone,
  onFinished,
  announce,
}: {
  question: Question;
  number: number;
  onDone: (firstTime: boolean, note?: string) => void;
  /** The last step is answered or the working is shown: leaving now no longer voids the question. */
  onFinished: () => void;
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
  const finished = step >= question.steps.length || shown;
  const current = question.steps[step];

  // Keep the keyboard where the work is: the current step's first choice or box, or "Next" when done.
  useEffect(() => {
    const target = box.current?.querySelector<HTMLElement>(finished ? '[data-next]' : `[data-step="${step}"] input, [data-step="${step}"] button:not([aria-disabled="true"])`);
    target?.focus({ preventScroll: true });
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
    }
  };

  const submit = () => {
    if (current?.type !== 'number') return;
    const m = markNumber(current, typed);
    if (m.ok) advance(`${typed.trim()}`);
    else {
      miss(m.feedback);
      if (typed.trim()) setSlips((s) => s + 1);
    }
  };

  const showMe = () => {
    setShown(true);
    onFinished();
    announce('Here is how it works. This one does not count.');
  };

  return (
    <div ref={box}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Question {number} of {QUESTIONS_PER_QUIZ}
      </p>
      <p className="mt-1 font-fraunces text-xl font-semibold leading-snug text-white">{question.prompt}</p>

      <ol className="mt-4 space-y-3">
        {question.steps.slice(0, finished ? question.steps.length : step + 1).map((s, i) => {
          const done = i < step;
          return (
            <li key={i} data-step={i} className={`rounded-xl px-3 py-3 ring-1 ${done ? 'bg-emerald-400/[0.07] ring-emerald-300/30' : 'bg-white/[0.05] ring-white/15'}`}>
              <p className="text-sm text-slate-100">
                <span className="mr-1.5 font-semibold text-slate-400">Step {i + 1}.</span>
                {s.prompt}
              </p>
              {done ? (
                <p className="mt-1.5 text-sm font-semibold text-emerald-200">
                  <span aria-hidden>✓ </span>
                  {answers[i]}
                  {s.type === 'number' && s.unit && !/[a-z]/i.test(answers[i]) ? ` ${s.unit}` : ''}
                </p>
              ) : shown ? null : s.type === 'choice' ? (
                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={`Step ${i + 1} choices`}>
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
                  <input
                    inputMode="decimal"
                    autoComplete="off"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    aria-label={`Step ${i + 1} answer${s.unit ? ` in ${s.unit}` : ''}`}
                    className="w-32 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-lg font-semibold text-white focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                  />
                  {s.unit && <span className="text-sm font-semibold text-slate-200">{s.unit}</span>}
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
            {number === QUESTIONS_PER_QUIZ ? 'See your score' : 'Next question'}
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
 * The Measures quiz: 10 generated questions, each answered in steps. A question counts as right only if
 * every step is right first time, without looking at the working or the explore tools.
 */
export default function MeasuresQuiz({ handle }: { handle: RefObject<QuizHandle | null> }) {
  const [round, setRound] = useState<Round | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [notice, setNotice] = useState('');
  const [cardDone, setCardDone] = useState(false);
  const [said, setSaid] = useState('');

  // Leaving for the explore tools mid-question ends that question: it does not count, and the next one is shown.
  useImperativeHandle(
    handle,
    () => ({
      interrupt: () => {
        // A finished question (answered, or working shown) is not affected.
        if (!round || cardDone || results.length >= QUESTIONS_PER_QUIZ || !questions[results.length]) return;
        const next = [...results, { question: questions[results.length], firstTime: false, note: 'You opened the explore tools' }];
        setResults(next);
        setNotice('You opened the explore tools during that question, so it does not count. Here is the next one.');
        if (next.length >= QUESTIONS_PER_QUIZ) track('measures_quiz_finished', { round, score: next.filter((x) => x.firstTime).length });
      },
    }),
    [round, cardDone, results, questions],
  );

  const start = (r: Round) => {
    setRound(r);
    setQuestions(newQuestions(r));
    setResults([]);
    setNotice('');
    setCardDone(false);
    track('measures_quiz_started', { round: r });
  };

  // One live region that is always there, so screen readers hear each "Correct" and the score.
  const live = (
    <p className="sr-only" aria-live="polite">
      {said}
    </p>
  );

  if (!round) {
    return (
      <div>
        {live}
        <p className="text-sm text-slate-200">
          Ten questions, each in steps. A question counts only if every step is right first time. New numbers every time.
        </p>
        <div className="mt-4 grid gap-2.5">
          {(Object.keys(ROUNDS) as Round[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => start(r)}
              className="rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-left hover:border-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              <span className="block font-semibold text-white">{ROUNDS[r].label}</span>
              <span className="block text-sm text-slate-300">{ROUNDS[r].blurb}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (results.length >= QUESTIONS_PER_QUIZ) {
    const score = results.filter((x) => x.firstTime).length;
    return (
      <div>
        {live}
        <p className="font-fraunces text-2xl font-semibold text-white">
          {score} out of {QUESTIONS_PER_QUIZ} right first time
        </p>
        <p className="mt-1 text-sm text-slate-300">{ROUNDS[round].label} round</p>
        {score < QUESTIONS_PER_QUIZ && (
          <>
            <p className="mt-4 text-sm font-semibold text-white">Worth another look:</p>
            <ul className="mt-2 space-y-2">
              {results
                .filter((x) => !x.firstTime)
                .map((x, i) => (
                  <li key={i} className="rounded-xl bg-white/[0.05] px-3 py-2.5 text-sm ring-1 ring-white/10">
                    <p className="font-semibold text-white">{x.question.prompt}</p>
                    {x.note && <p className="text-xs text-slate-400">{x.note}</p>}
                    <p className="mt-1 text-slate-200">{x.question.workings[x.question.workings.length - 1]}</p>
                  </li>
                ))}
            </ul>
          </>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => start(round)} className="rounded-lg bg-[#f6c453] px-4 py-2 text-sm font-bold text-[#0b1026] hover:bg-[#f8d27a]">
            Another {ROUNDS[round].label.toLowerCase()} round
          </button>
          <button type="button" onClick={() => setRound(null)} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-cyan-300">
            Choose a different round
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
        <span>{ROUNDS[round].label} round</span>
        <span>
          Right first time: <strong className="text-white">{results.filter((x) => x.firstTime).length}</strong>
        </span>
      </div>
      {notice && <p className="mb-3 rounded-lg bg-amber-400/10 px-3 py-2 text-sm text-amber-100 ring-1 ring-amber-300/30">{notice}</p>}
      <QuestionCard
        key={n}
        question={questions[n]}
        number={n + 1}
        announce={setSaid}
        onFinished={() => setCardDone(true)}
        onDone={(firstTime, note) => {
          setNotice('');
          setCardDone(false);
          const next = [...results, { question: questions[n], firstTime, note }];
          setResults(next);
          if (next.length >= QUESTIONS_PER_QUIZ) {
            const score = next.filter((x) => x.firstTime).length;
            setSaid(`${score} out of ${QUESTIONS_PER_QUIZ} right first time.`);
            track('measures_quiz_finished', { round, score });
          }
        }}
      />
    </div>
  );
}
