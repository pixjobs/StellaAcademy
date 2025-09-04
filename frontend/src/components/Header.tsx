// components/Header.tsx
'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Header() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <header
      ref={ref}
      // --- MODIFICATION ---
      // Added `relative` and `z-50` to ensure the header is on top.
      className="relative z-50 w-full bg-ink text-gold shadow-pixel font-pixel px-4 py-3 flex items-center justify-between"
    >
      {/* Logo / Title */}
      <Link href="/" className="text-lg tracking-wider hover:text-mint transition-colors">
        ✨ Stella Academy
      </Link>

      {/* Nav Links */}
      <nav className="flex gap-4 text-xs">
        <Link href="/missions" className="hover:text-sky transition-colors">
          Missions
        </Link>
        <Link href="/about" className="hover:text-sky transition-colors">
          About
        </Link>
        <Link href="/settings" className="hover:text-sky transition-colors">
          ⚙ Settings
        </Link>
      </nav>
    </header>
  );
}