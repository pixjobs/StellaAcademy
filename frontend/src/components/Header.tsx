'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGame } from '@/lib/store';
import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
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
  const pathname = usePathname();
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

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/study', label: 'Study Hub' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/about', label: 'About' },
  ];

  return (
    <header className="relative z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-lg shadow-black/20">
      {/* Ambient glowing bar */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent pointer-events-none" />

      {/* ── Top bar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="shrink-0">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className={`p-1.5 rounded-xl ${themeBg} border border-white/10 group-hover:scale-105 transition-transform duration-300 relative shadow-[0_0_15px_rgba(99,102,241,0.25)]`}>
              <Sparkles className={`w-4 h-4 ${themeText} animate-spin-slow`} />
              <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-ping ${themeBg}`} />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-wide font-fraunces text-white group-hover:text-indigo-200 transition-colors">
                Stella Academy
              </span>
              <p className="text-[9px] text-slate-400 tracking-[0.2em] font-mono uppercase">
                Interactive Learning Hub
              </p>
            </div>
          </Link>
        </div>

        {/* Quote — desktop only, centred */}
        {quote && (
          <div className="hidden lg:flex flex-col items-center flex-1 px-8 min-w-0">
            <p className="text-[11px] text-slate-300 italic font-light leading-snug text-center truncate max-w-md">
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5 tracking-widest uppercase">
              — {quote.author}
            </p>
          </div>
        )}

        {/* Nav — desktop */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono shrink-0">
          <nav className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/[0.08]">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.25)] font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="border-l border-white/10 pl-1.5 ml-0.5">
              <AccessibilityMenu />
            </div>
          </nav>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-slate-400 hover:text-white transition-colors rounded-lg bg-white/5 border border-white/10"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <div className="w-5 flex flex-col gap-1">
            <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-950/95 px-4 py-4 space-y-4 backdrop-blur-2xl animate-in slide-in-from-top-2 duration-200">
          {/* Mobile quote */}
          {quote && (
            <div className="pb-3 border-b border-white/10">
              <p className="text-[11px] text-slate-300 italic font-light leading-relaxed">
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="text-[9px] text-slate-500 font-mono mt-1 tracking-widest uppercase">
                — {quote.author}
              </p>
            </div>
          )}
          <nav className="flex flex-col gap-1.5 text-sm font-mono">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="pt-3 border-t border-white/10">
            <AccessibilityMenu />
          </div>
        </div>
      )}
    </header>
  );
}
