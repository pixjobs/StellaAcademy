'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import LessonDiagram from '@/components/LessonDiagram';
import { useJourney, useJourneyDone } from '@/lib/journey';
import { LEVELS, type LessonSummary } from '@/lib/levels';
import { PAPER_SUBJECT } from '@/lib/paper';
import { track } from '@/lib/track';

const levelName = (lesson: LessonSummary) => LEVELS.find((l) => l.id === lesson.level)!.label;

/** One mission's lessons in order, showing which are done and which comes next. */
export function MissionSteps({ steps }: { steps: LessonSummary[] }) {
  const done = useJourneyDone();
  const nextIndex = steps.findIndex((s) => !done[s.id]);

  return (
    <ol className="space-y-3">
      {steps.map((lesson, i) => {
        const subject = PAPER_SUBJECT[lesson.category];
        const isDone = Boolean(done[lesson.id]);
        const isNext = i === nextIndex;
        return (
          <li key={lesson.id}>
            <Link
              href={`/study/${lesson.id}`}
              className={`flex items-center gap-4 rounded-2xl border bg-[var(--sheet)] p-3 pr-5 hover:border-[var(--ink)]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--action)] ${
                isNext ? 'border-[var(--action)] shadow-[0_10px_26px_-14px_rgba(165,180,252,0.55)]' : 'border-[var(--rule)]'
              }`}
            >
              <span
                className="grid h-16 w-16 shrink-0 place-items-center rounded-xl"
                style={{ backgroundColor: subject.tint, color: 'var(--ink)', '--diagram-accent': subject.ink } as CSSProperties}
              >
                <LessonDiagram id={lesson.id} size={42} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-[var(--ink-soft)]">
                  Step {i + 1}, {levelName(lesson)}, {lesson.minutes} min
                </span>
                <span className="block font-fraunces text-xl font-semibold leading-snug text-[var(--ink)]">{lesson.title}</span>
              </span>
              {isDone ? (
                <span className="shrink-0 rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-300">Done</span>
              ) : isNext ? (
                <span className="shrink-0 rounded-full bg-[var(--action)] px-3 py-1 text-sm font-semibold text-[var(--on-action)]">Up next</span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/** A small "Done" mark for lesson cards elsewhere on the site. */
export function DoneBadge({ lesson }: { lesson: string }) {
  const done = useJourneyDone();
  if (!done[lesson]) return null;
  return <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-sm font-semibold text-emerald-300">Done</span>;
}

/** The control at the end of a lesson: tick it off, or take the tick back. */
export function MarkDone({ lesson }: { lesson: string }) {
  const done = useJourneyDone();
  const toggle = useJourney((state) => state.toggle);
  const isDone = Boolean(done[lesson]);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        aria-pressed={isDone}
        onClick={() => {
          if (!isDone) track('lesson_marked_done', { lesson });
          toggle(lesson);
        }}
        className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--action)] ${
          isDone ? 'border-2 border-emerald-400 bg-emerald-400/10 text-emerald-300' : 'bg-[var(--action)] text-[var(--on-action)] hover:bg-[var(--action-hover)]'
        }`}
      >
        {isDone && (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5 L10 17.5 L19 7" />
          </svg>
        )}
        {isDone ? 'Done' : 'Mark this lesson as done'}
      </button>
      <p className="text-[15px] text-[var(--ink-soft)]" aria-live="polite">
        {isDone ? 'Saved on your journey. Select again to undo.' : 'Tick it off once the practice questions make sense.'}
      </p>
    </div>
  );
}

/** Clears saved progress, after asking. */
export function ResetJourney() {
  const done = useJourneyDone();
  const reset = useJourney((state) => state.reset);
  if (Object.keys(done).length === 0) return null;
  return (
    <button
      type="button"
      onClick={() => {
        if (window.confirm('Clear all your journey progress on this device?')) reset();
      }}
      className="font-semibold text-[var(--action)] underline decoration-2 underline-offset-4 hover:text-[var(--action-hover)]"
    >
      Start the journey again
    </button>
  );
}
