'use client';

import Link from 'next/link';
import { LogoMark } from '@/components/Logo';
import { useJourneyDone } from '@/lib/journey';
import { MISSIONS } from '@/lib/missions';

// Stops sit on a gentle zigzag across the sky; these are the circle tops in pixels.
const TOPS = [118, 22, 118, 22, 118];
const HEIGHT = 300;
const CIRCLE = 64;

/** The curve joining stop i to stop i + 1, in a 1000-wide box that stretches to the container. */
function segment(i: number): string {
  const x1 = 100 + i * 200;
  const x2 = x1 + 200;
  const y1 = TOPS[i] + CIRCLE / 2;
  const y2 = TOPS[i + 1] + CIRCLE / 2;
  return `M${x1} ${y1} C${x1 + 100} ${y1} ${x2 - 100} ${y2} ${x2} ${y2}`;
}

function Stop({ state, number }: { state: 'done' | 'here' | 'ahead'; number: number }) {
  if (state === 'here')
    return (
      <span className="grid h-16 w-16 place-items-center rounded-full bg-[#0b1026] ring-4 ring-[#f6c453]/45">
        <LogoMark size={56} />
      </span>
    );
  if (state === 'done')
    return (
      <span className="grid h-16 w-16 place-items-center rounded-full bg-[#f6c453] text-[#0b1026]">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5 L10 17.5 L19 7" />
        </svg>
      </span>
    );
  return (
    <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-white/45 bg-[#0b1026] font-fraunces text-2xl font-semibold text-white">
      {number}
    </span>
  );
}

/**
 * Stella's journey as a route across the sky: five missions, with the star
 * resting on the one you are working through.
 */
export default function JourneyPath() {
  const done = useJourneyDone();
  const stats = MISSIONS.map((m) => ({ ...m, count: m.lessons.filter((l) => done[l]).length }));
  const hereIndex = stats.findIndex((m) => m.count < m.lessons.length);
  const stateOf = (i: number) => (hereIndex === -1 || i < hereIndex ? 'done' : i === hereIndex ? 'here' : 'ahead');
  const label = (m: (typeof stats)[number], i: number) => {
    const state = stateOf(i);
    const progress = state === 'done' ? 'complete' : `${m.count} of ${m.lessons.length} lessons done`;
    return `Mission ${i + 1}, ${m.title}: ${progress}${state === 'here' ? ' (you are here)' : ''}`;
  };

  return (
    <nav aria-label="Stella's journey">
      {/* Wide screens: the route. */}
      <div className="relative hidden md:block" style={{ height: HEIGHT }}>
        <svg viewBox={`0 0 1000 ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full">
          {MISSIONS.slice(0, -1).map((m, i) => (
            <path
              key={m.id}
              d={segment(i)}
              fill="none"
              stroke={stateOf(i) === 'done' ? '#f6c453' : '#ffffff'}
              strokeOpacity={stateOf(i) === 'done' ? 0.9 : 0.4}
              strokeWidth="2.5"
              strokeDasharray={stateOf(i) === 'done' ? undefined : '3 9'}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <ol>
          {stats.map((m, i) => (
            <li key={m.id} className="absolute w-44 -translate-x-1/2" style={{ left: `${10 + i * 20}%`, top: TOPS[i] }}>
              <Link
                href={`/journey#${m.id}`}
                aria-label={label(m, i)}
                className="group flex flex-col items-center rounded-2xl text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f6c453]"
              >
                <Stop state={stateOf(i)} number={i + 1} />
                <span className="mt-3 font-fraunces text-lg font-semibold leading-tight text-white group-hover:underline">{m.title}</span>
                <span className="mt-1 text-sm text-slate-300">
                  {m.count} of {m.lessons.length} done
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>

      {/* Narrow screens: the same route, top to bottom. */}
      <ol className="space-y-5 md:hidden">
        {stats.map((m, i) => (
          <li key={m.id}>
            <Link href={`/journey#${m.id}`} aria-label={label(m, i)} className="flex items-center gap-4">
              <Stop state={stateOf(i)} number={i + 1} />
              <span>
                <span className="block font-fraunces text-xl font-semibold leading-tight text-white">{m.title}</span>
                <span className="mt-0.5 block text-sm text-slate-300">
                  {m.count} of {m.lessons.length} done
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
