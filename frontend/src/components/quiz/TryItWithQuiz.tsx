'use client';

import { useState, type ReactNode } from 'react';
import QuizPanel from '@/components/quiz/QuizPanel';
import { useQuizActive } from '@/lib/quiz/active';
import type { ConceptId } from '@/lib/study-modules';

/**
 * A lesson's Try it panel with Explore and Quiz tabs (docs/quiz-pattern.md). While a quiz question is in
 * progress, Explore pauses: its content is hidden, kept mounted so nothing is lost, and a note says why.
 */
export default function TryItWithQuiz({ lesson, explore, pausedNote }: { lesson: ConceptId; explore: ReactNode; pausedNote?: string }) {
  const paused = useQuizActive((s) => !!s.active[lesson]);
  const [tab, setTab] = useState<'explore' | 'quiz'>('explore');
  return (
    <figure className="night-window overflow-hidden rounded-3xl p-4 shadow-[0_30px_60px_-20px_rgba(11,16,38,0.55)] ring-1 ring-white/10 sm:p-6">
      <figcaption className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-fraunces text-xl font-semibold text-white">Try it</span>
        <span className="flex rounded-xl bg-white/[0.06] p-1 ring-1 ring-white/10" role="tablist" aria-label="Explore or quiz">
          {(['explore', 'quiz'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`${lesson}-tab-${t}`}
              aria-selected={tab === t}
              aria-controls={`${lesson}-panel-${t}`}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
                tab === t ? 'bg-cyan-400/20 text-white ring-1 ring-cyan-300' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t === 'explore' ? 'Explore' : 'Quiz'}
            </button>
          ))}
        </span>
      </figcaption>
      <div id={`${lesson}-panel-explore`} role="tabpanel" aria-labelledby={`${lesson}-tab-explore`} hidden={tab !== 'explore'} className="mt-4">
        {paused && (
          <p className="rounded-xl bg-amber-400/10 px-4 py-3 text-sm text-amber-100 ring-1 ring-amber-300/30" role="status">
            {pausedNote ?? 'Explore is paused while you answer a quiz question. Finish the question in the Quiz tab and it comes back.'}
          </p>
        )}
        <div hidden={paused}>{explore}</div>
      </div>
      <div data-quiz id={`${lesson}-panel-quiz`} role="tabpanel" aria-labelledby={`${lesson}-tab-quiz`} hidden={tab !== 'quiz'} className="mt-4">
        <QuizPanel lesson={lesson} />
      </div>
    </figure>
  );
}
