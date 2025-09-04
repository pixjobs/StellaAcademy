// components/AppBackground.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation'; // <-- Hook
import gsap from 'gsap';
import WarpDrive from '@/components/WarpDrive';

type Props = { url?: string; warpOnLoad?: boolean };

export default function AppBackground({ url, warpOnLoad = true }: Props) {
  // --- THIS IS THE FIX ---
  // 1. All hooks are called UNCONDITIONALLY at the top of the component.
  //    This ensures they are called in the same order on every render.
  const pathname = usePathname();
  const apodRef = useRef<HTMLDivElement>(null);
  const warpRef = useRef<HTMLDivElement>(null);

  // Preload APOD so we never fade to blank
  useEffect(() => {
    // We can have conditional logic *inside* a hook, but the hook itself must always be called.
    if (!url || pathname === '/about') return;
    const img = new Image();
    img.src = url;
  }, [url, pathname]); // Add pathname to the dependency array

  // Initial states + auto-kick the warp on mount
  useEffect(() => {
    // This hook also runs on every render, but we exit early if we're on the about page.
    if (pathname === '/about') return;

    const apod = apodRef.current!;
    const warp = warpRef.current!;
    gsap.set(apod, { opacity: 0 });
    gsap.set(warp, { opacity: warpOnLoad ? 1 : 0 });

    if (warpOnLoad) {
      const id = requestAnimationFrame(() =>
        window.dispatchEvent(new Event('stella:warp'))
      );
      return () => cancelAnimationFrame(id);
    }
  }, [warpOnLoad, pathname]); // Add pathname to the dependency array

  const revealApod = () => {
    const apod = apodRef.current!;
    const warp = warpRef.current!;
    gsap.timeline()
      .to(warp, { opacity: 0, duration: 1.0, ease: 'power2.out' })
      .to(apod, { opacity: 1, duration: 1.1, ease: 'power2.out' }, '<0.1');
  };

  // 2. The conditional return happens AFTER all hooks have been called.
  //    This satisfies the Rules of Hooks.
  if (pathname === '/about') {
    return null;
  }

  // 3. The JSX is returned for all other pages.
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none select-none" aria-hidden>
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
          respectReducedMotion={false}
          onCruise={revealApod}
        />
      </div>
    </div>
  );
}