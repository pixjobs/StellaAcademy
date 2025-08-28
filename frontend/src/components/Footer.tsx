'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGame } from '@/lib/store'; // ← uses your Zustand store

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const { stars, level } = useGame(); // ← live values

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.2 }
      );
    }
  }, []);

  return (
    <footer
      ref={ref}
      className="w-full bg-ink text-sky shadow-pixel font-pixel text-xs px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
    >
      {/* Left: game stats from store */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          ★ <span className="text-gold">{stars}</span>
        </span>
        <span className="flex items-center gap-1">
          🚀 <span className="text-mint">Level {level}</span>
        </span>
      </div>

      {/* Center: Stella tip */}
      <div className="italic text-candy text-center flex-1 hidden sm:block">
        “Keep looking up — the stars are your classroom.”
      </div>

      {/* Right: version & NASA credit */}
      <div className="text-slate-400 text-right">
        <div>v0.1.0 © Stella Academy</div>
        <div>
          Images/Data courtesy of{' '}
          <a
            href="https://api.nasa.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-sky"
          >
            NASA Open API
          </a>
        </div>
      </div>
    </footer>
  );
}
