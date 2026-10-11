import Link from 'next/link';
import { LogoMark } from '@/components/Logo';
import SupportLink from '@/components/SupportLink';

const LINKS = [
  { href: '/journey', label: 'Journey' },
  { href: '/study', label: 'Lessons' },
  { href: '/gallery', label: 'NASA gallery' },
  { href: '/about', label: 'About' },
];

export default function Footer() {
  return (
    <footer className="night-window border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <span className="flex items-center gap-3">
            <LogoMark size={32} />
            <span className="font-fraunces text-xl font-semibold text-white">Stella Academy</span>
          </span>
          <p className="mt-4 leading-relaxed text-slate-300">
            Free interactive physics and maths lessons for ages 9 to 18 and beyond.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Lessons are written with AI assistance. Check formulas and figures against your textbook or exam
            board&rsquo;s specification before relying on them in assessed work.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="font-semibold text-slate-100 underline decoration-white/30 decoration-2 underline-offset-4 hover:decoration-white">
              {link.label}
            </Link>
          ))}
          <SupportLink placement="footer" />
        </nav>
      </div>
    </footer>
  );
}
