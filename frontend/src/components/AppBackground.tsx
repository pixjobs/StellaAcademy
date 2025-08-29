'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import WarpDrive from '@/components/WarpDrive';

type Props = { url?: string; warpOnLoad?: boolean };

export default function AppBackground({ url, warpOnLoad = true }: Props) {
  const apodRef = useRef<HTMLDivElement>(null);
  const warpRef = useRef<HTMLDivElement>(null);

  // Preload APOD so we never fade to blank
  useEffect(() => {
    if (!url) return;
    const img = new Image();
    img.src = url;
  }, [url]);

  // Initial states + auto-kick the warp on mount
  useEffect(() => {
    const apod = apodRef.current!, warp = warpRef.current!;
    gsap.set(apod, { opacity: 0 });
    gsap.set(warp, { opacity: warpOnLoad ? 1 : 0 });

    if (warpOnLoad) {
      // kick on next paint to avoid race conditions
      const id = requestAnimationFrame(() =>
        window.dispatchEvent(new Event('stella:warp'))
      );
      return () => cancelAnimationFrame(id);
    }
  }, [warpOnLoad]);

  const revealApod = () => {
    const apod = apodRef.current!, warp = warpRef.current!;
    gsap.timeline()
      .to(warp, { opacity: 0, duration: 1.0, ease: 'power2.out' })
      .to(apod, { opacity: 1, duration: 1.1, ease: 'power2.out' }, '<0.1');
  };

  return (
    <div className="fixed inset-0 z-0 pointer-events-none select-none" aria-hidden>
      {/* APOD base (z-0) */}
      <div
        ref={apodRef}
        className="absolute inset-0 z-0 bg-center bg-cover bg-fixed"
        style={
          url
            ? {
                backgroundImage: `
                  linear-gradient(to bottom, rgba(0,0,0,.6), rgba(0,0,0,.3), rgba(0,0,0,.7)),
                  url(${url})
                `,
              }
            : {
                background:
                  'radial-gradient(ellipse at 50% 40%, rgba(31,64,104,.35), rgba(8,12,20,.85) 70%)',
              }
        }
      />

      {/* Warp overlay (z-10) */}
      <div ref={warpRef} className="absolute inset-0 z-10">
        <WarpDrive
          autoStart
          density={1100}
          respectReducedMotion={false}   // ⬅️ force warp even if OS has reduced motion
          onCruise={revealApod}
        />
      </div>
    </div>
  );
}
