'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="relative z-50 w-full bg-slate-900/80 backdrop-blur-md text-slate-200 border-b border-white/10 px-4 py-3 flex items-center justify-between">
      {/* Logo / Title */}
      <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
        Stella Academy
      </Link>

      {/* Nav Links */}
      <nav className="flex gap-6 text-sm text-slate-300">
        <Link href="/" className="hover:text-cyan-400 transition-colors">
          Home
        </Link>
        <Link href="/about" className="hover:text-cyan-400 transition-colors">
          About
        </Link>
      </nav>
    </header>
  );
}
