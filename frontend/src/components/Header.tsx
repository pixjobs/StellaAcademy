'use client';

import Link from 'next/link';
import { useGame } from '@/lib/store';
import { useState, useEffect } from 'react';
import AccessibilityMenu from '@/components/AccessibilityMenu';

const QUOTES = [
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "The cosmos is within us. We are made of star-stuff.", author: "Carl Sagan" },
  { text: "In mathematics you don't understand things. You just get used to them.", author: "John von Neumann" },
  { text: "The more I learn, the more I realise how much I don't know.", author: "Albert Einstein" },
  { text: "Somewhere, something incredible is waiting to be known.", author: "Carl Sagan" },
  { text: "Physics is the poetry of nature.", author: "Unknown" },
  { text: "Look up at the stars and not down at your feet.", author: "Stephen Hawking" },
];

export default function Header() {
  const { role } = useGame();
  const [mounted, setMounted] = useState(false);
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  const getRoleColors = () => {
    if (!mounted) return { text: 'text-indigo-400', bg: 'bg-indigo-500/10' };
    switch (role) {
      case 'cadet':   return { text: 'text-amber-400',   bg: 'bg-amber-500/10' };
      case 'scholar': return { text: 'text-emerald-400', bg: 'bg-emerald-500/10' };
      default:        return { text: 'text-indigo-400',  bg: 'bg-indigo-500/10' };
    }
  };

  const { text: themeText, bg: themeBg } = getRoleColors();

  return (
    <header className="relative z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      {/* ── Top bar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="shrink-0">
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full animate-pulse ${themeBg} border border-current ${themeText}`} />
            <Link
              href="/"
              className="text-base sm:text-lg font-bold tracking-wide font-fraunces text-white hover:text-slate-200 transition-colors"
            >
              Stella Academy
            </Link>
          </div>
          <p className="text-[9px] text-slate-600 tracking-[0.2em] font-mono uppercase mt-0.5 pl-4">
            Sol-Earth · Interactive Learning
          </p>
        </div>

        {/* Quote — desktop only, centred */}
        {quote && (
          <div className="hidden lg:flex flex-col items-center flex-1 px-8 min-w-0">
            <p className="text-[11px] text-slate-400 italic font-light leading-snug text-center truncate max-w-md">
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="text-[9px] text-slate-600 font-mono mt-0.5 tracking-widest uppercase">
              — {quote.author}
            </p>
          </div>
        )}

        {/* Nav — desktop */}
        <div className="hidden md:flex items-center gap-5 text-[11px] font-mono text-slate-400 shrink-0">
          <nav className="flex items-center gap-5">
            <Link href="/"        className="hover:text-white transition-colors">Home</Link>
            <Link href="/study"   className="hover:text-white transition-colors">Study Hub</Link>
            <Link href="/gallery" className="hover:text-white transition-colors">Gallery</Link>
            <Link href="/about"   className="hover:text-white transition-colors">About</Link>
          </nav>
          <div className="border-l border-white/10 pl-5">
            <AccessibilityMenu />
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <div className="w-5 flex flex-col gap-1">
            <span className={`block h-px bg-current transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block h-px bg-current transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-px bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-950/95 px-4 py-4 space-y-3">
          {/* Mobile quote */}
          {quote && (
            <div className="pb-3 border-b border-white/10">
              <p className="text-[11px] text-slate-400 italic font-light leading-relaxed">
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="text-[9px] text-slate-600 font-mono mt-1 tracking-widest uppercase">
                — {quote.author}
              </p>
            </div>
          )}
          <nav className="flex flex-col gap-2 text-sm font-mono text-slate-400">
            <Link href="/"        onClick={() => setMenuOpen(false)} className="py-1.5 hover:text-white transition-colors">Home</Link>
            <Link href="/study"   onClick={() => setMenuOpen(false)} className="py-1.5 hover:text-white transition-colors">Study Hub</Link>
            <Link href="/gallery" onClick={() => setMenuOpen(false)} className="py-1.5 hover:text-white transition-colors">Gallery</Link>
            <Link href="/about"   onClick={() => setMenuOpen(false)} className="py-1.5 hover:text-white transition-colors">About</Link>
          </nav>
          <div className="pt-2 border-t border-white/10">
            <AccessibilityMenu />
          </div>
        </div>
      )}
    </header>
  );
}
