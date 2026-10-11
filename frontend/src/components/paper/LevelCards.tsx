'use client';

import Link from 'next/link';
import { useState, type CSSProperties } from 'react';
import { DoneBadge } from '@/components/journey/MissionSteps';
import LessonDiagram from '@/components/LessonDiagram';
import { LEVELS, SUBJECT_LABEL, type LessonSummary, type LevelId } from '@/lib/levels';
import { PAPER_SUBJECT } from '@/lib/paper';

export function LessonCard({ lesson }: { lesson: LessonSummary }) {
  const subject = PAPER_SUBJECT[lesson.category];
  return (
    <Link
      href={`/study/${lesson.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--rule)] bg-[var(--sheet)] hover:border-[var(--ink)]/45 hover:shadow-[0_16px_34px_-18px_rgba(0,0,0,0.9)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--action)]"
    >
      {/* Illustration slot: the diagram stands in until artwork is supplied. */}
      <span
        className="grid h-36 place-items-center"
        style={{ backgroundColor: subject.tint, color: 'var(--ink)', '--diagram-accent': subject.ink } as CSSProperties}
      >
        <LessonDiagram id={lesson.id} size={84} />
      </span>
      <span className="flex flex-1 flex-col p-5">
        <span className="flex items-center gap-2 text-sm">
          <span className="rounded-full px-2.5 py-0.5 font-semibold" style={{ backgroundColor: subject.tint, color: subject.ink }}>
            {SUBJECT_LABEL[lesson.subject]}
          </span>
          <span className="text-[var(--ink-soft)]">{lesson.minutes} min</span>
          <span className="ml-auto">
            <DoneBadge lesson={lesson.id} />
          </span>
        </span>
        <span className="mt-3 font-fraunces text-xl font-semibold leading-snug text-[var(--ink)]">{lesson.title}</span>
        <span className="mt-1.5 leading-relaxed text-[var(--ink-soft)]">{lesson.subtitle}</span>
      </span>
    </Link>
  );
}

/** Pick a level, see its lessons: the same idea as a reading-level switch. */
export default function LevelCards({ lessons }: { lessons: LessonSummary[] }) {
  const [level, setLevel] = useState<LevelId>('gcse');
  const shown = lessons.filter((l) => l.level === level);
  const current = LEVELS.find((l) => l.id === level)!;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Level">
        {LEVELS.map((l) => {
          const active = l.id === level;
          return (
            <button
              key={l.id}
              type="button"
              aria-pressed={active}
              onClick={() => setLevel(l.id)}
              className={`rounded-full border px-5 py-2 text-[15px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--action)] ${
                active
                  ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
                  : 'border-[var(--rule)] bg-[var(--sheet)] text-[var(--ink)] hover:border-[var(--ink)]/50'
              }`}
            >
              {l.label}
              <span className={`ml-2 font-normal ${active ? 'text-[var(--paper)]/70' : 'text-[var(--ink-soft)]'}`}>{l.ages}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-[var(--ink-soft)]">
        {current.blurb} {shown.length} lessons.
      </p>

      <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((lesson) => (
          <li key={lesson.id} className="flex">
            <LessonCard lesson={lesson} />
          </li>
        ))}
      </ul>
    </div>
  );
}
