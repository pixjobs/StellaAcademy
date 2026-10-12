'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { LessonCard } from '@/components/paper/LevelCards';
import { LEVELS, SUBJECT_LABEL, type LessonSummary, type LevelId, type SubjectId } from '@/lib/levels';

type LevelFilter = LevelId | 'all';
type SubjectFilter = SubjectId | 'all';

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-5 py-2 text-[15px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--action)] ${
        active
          ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
          : 'border-[var(--rule)] bg-[var(--sheet)] text-[var(--ink)] hover:border-[var(--ink)]/50'
      }`}
    >
      {children}
    </button>
  );
}

const noSubscription = () => () => {};

function levelFromUrl(): LevelId | null {
  const wanted = new URLSearchParams(window.location.search).get('level');
  return LEVELS.some((l) => l.id === wanted) ? (wanted as LevelId) : null;
}

export default function LessonIndex({ lessons }: { lessons: LessonSummary[] }) {
  // Honour links like /study?level=gcse without making the page dynamic on the server.
  const linked = useSyncExternalStore(noSubscription, levelFromUrl, () => null);
  const [chosen, setLevel] = useState<LevelFilter | null>(null);
  const level: LevelFilter = chosen ?? linked ?? 'all';
  const [subject, setSubject] = useState<SubjectFilter>('all');
  const [query, setQuery] = useState('');

  const chooseLevel = (next: LevelFilter) => {
    setLevel(next);
    const url = new URL(window.location.href);
    if (next === 'all') url.searchParams.delete('level');
    else url.searchParams.set('level', next);
    window.history.replaceState(null, '', url);
  };

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      lessons.filter(
        (l) =>
          (level === 'all' || l.level === level) &&
          (subject === 'all' || l.subject === subject) &&
          (!q || l.title.toLowerCase().includes(q) || l.subtitle.toLowerCase().includes(q)),
      ),
    [lessons, level, subject, q],
  );

  const reset = () => {
    chooseLevel('all');
    setSubject('all');
    setQuery('');
  };

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Level">
            <Chip active={level === 'all'} onClick={() => chooseLevel('all')}>All levels</Chip>
            {LEVELS.map((l) => (
              <Chip key={l.id} active={level === l.id} onClick={() => chooseLevel(l.id)}>{l.label}</Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Subject">
            <Chip active={subject === 'all'} onClick={() => setSubject('all')}>Both subjects</Chip>
            {(Object.keys(SUBJECT_LABEL) as SubjectId[]).map((s) => (
              <Chip key={s} active={subject === s} onClick={() => setSubject(s)}>{SUBJECT_LABEL[s]}</Chip>
            ))}
          </div>
        </div>

        <label className="block w-full lg:w-80">
          <span className="sr-only">Search lessons</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons, e.g. momentum"
            className="w-full rounded-full border border-[var(--rule)] bg-[var(--sheet)] px-5 py-3 text-[var(--ink)] placeholder-[var(--ink-soft)] focus:border-[var(--action)] focus:outline-none focus:ring-2 focus:ring-[var(--action)]/30"
          />
        </label>
      </div>

      <p className="mt-6 text-[var(--ink-soft)]" aria-live="polite">
        {visible.length === lessons.length ? `${lessons.length} lessons` : `${visible.length} of ${lessons.length} lessons`}
      </p>

      {visible.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-[var(--rule)] bg-[var(--sheet)] p-8 text-[var(--ink)]">
          <p>No lessons match those filters.</p>
          <button type="button" onClick={reset} className="mt-3 font-semibold text-[var(--action)] underline decoration-2 underline-offset-4 hover:text-[var(--action-hover)]">
            Show all lessons
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-12">
          {LEVELS.filter((l) => visible.some((v) => v.level === l.id)).map((l) => (
            <section key={l.id} aria-labelledby={`level-${l.id}`}>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-[var(--rule)] pb-3">
                <h2 id={`level-${l.id}`} className="font-fraunces text-3xl font-semibold text-[var(--ink)]">{l.label}</h2>
                <span className="text-[var(--ink-soft)]">
                  For {l.ages}. {l.blurb}
                </span>
              </div>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visible.filter((v) => v.level === l.id).map((lesson) => (
                  <li key={lesson.id} className="flex">
                    <LessonCard lesson={lesson} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
