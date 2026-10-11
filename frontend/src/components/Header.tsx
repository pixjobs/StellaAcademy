'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LogoMark } from '@/components/Logo';
import AccessibilityMenu from '@/components/AccessibilityMenu';
import SupportLink from '@/components/SupportLink';

const NAV = [
  { href: '/journey', label: 'Journey' },
  { href: '/study', label: 'Lessons' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/about', label: 'About' },
];

/** The top of the sky: the same deep navy the page's opening band continues from. */
export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <header className="theme-night relative z-50 w-full">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" aria-label="Stella Academy home" className="flex shrink-0 items-center gap-3">
          <LogoMark size={36} className="shrink-0" />
          <span>
            <span className="block whitespace-nowrap font-fraunces text-xl font-semibold leading-none tracking-[-0.015em] text-white sm:text-2xl">
              Stella Academy
            </span>
            <span className="mt-1 hidden text-sm leading-none text-slate-300 sm:block">Physics and maths you can play with</span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 text-[15px] font-semibold md:flex">
          <nav aria-label="Main" className="flex items-center gap-1">
            {NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`rounded-full px-4 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f6c453] ${
                  isActive(link.href) ? 'bg-white/15 text-white' : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <AccessibilityMenu />
          <SupportLink placement="header" />
        </div>

        <button
          type="button"
          className="rounded-lg border border-white/20 bg-white/5 p-2.5 text-white md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className="flex w-5 flex-col gap-1">
            <span className={`block h-0.5 bg-current transition-transform duration-200 ${menuOpen ? 'translate-y-1.5 rotate-45' : ''}`} />
            <span className={`block h-0.5 bg-current transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-current transition-transform duration-200 ${menuOpen ? '-translate-y-1.5 -rotate-45' : ''}`} />
          </span>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 px-4 py-4 md:hidden">
          <nav aria-label="Main" className="flex flex-col gap-1 text-lg font-semibold">
            {NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`rounded-xl px-4 py-2.5 ${isActive(link.href) ? 'bg-white/15 text-white' : 'text-slate-200 hover:bg-white/10'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <AccessibilityMenu />
            <SupportLink placement="header_mobile" />
          </div>
        </div>
      )}
    </header>
  );
}
