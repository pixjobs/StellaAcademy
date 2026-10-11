'use client';

import { useRef, useState } from 'react';
import type { LessonIntro as Intro } from '@/lib/intros';
import { track } from '@/lib/track';

/**
 * Real footage at the top of a lesson. Nothing is downloaded until the reader
 * presses play, and it never plays by itself.
 */
export default function LessonIntro({ id, intro }: { id: string; intro: Intro }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<'idle' | 'playing' | 'ended'>('idle');

  const play = () => {
    const video = videoRef.current;
    if (!video) return;
    if (state === 'idle') track('lesson_intro_played', { lesson: id });
    video.currentTime = 0;
    setState('playing');
    video.play().catch(() => setState('idle'));
  };

  return (
    <figure className="w-full lg:w-[26rem]">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-[0_24px_50px_-18px_rgba(0,0,0,0.8)] ring-1 ring-white/15">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          poster={`/intros/${id}-poster.jpg`}
          muted
          playsInline
          preload="none"
          aria-label={intro.alt}
          onEnded={() => setState('ended')}
        >
          <source src={`/intros/${id}.mp4`} type="video/mp4" />
          <source src={`/intros/${id}.webm`} type="video/webm" />
        </video>
        {state !== 'playing' && (
          <button
            type="button"
            onClick={play}
            className="absolute inset-0 grid place-items-center bg-black/25 hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#f6c453]"
          >
            <span className="flex items-center gap-2.5 rounded-full bg-[#f6c453] py-2.5 pl-4 pr-5 text-base font-semibold text-[#0b1026] shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
              </svg>
              {state === 'ended' ? 'Watch again' : 'See it for real'}
            </span>
          </button>
        )}
        <span className="pointer-events-none absolute bottom-2 left-3 text-xs text-white/75">Footage: {intro.credit}</span>
      </div>
      <figcaption className="mt-3 text-[15px] leading-relaxed text-slate-200">{intro.caption}</figcaption>
    </figure>
  );
}
