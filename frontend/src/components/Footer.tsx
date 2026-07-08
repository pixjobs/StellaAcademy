'use client';

const QUOTES = [
  "That's one small step for mankind, one giant leap for humanity. — Neil Armstrong",
  'The Earth is the cradle of humanity, but mankind cannot stay in the cradle forever. — Konstantin Tsiolkovsky',
  'The cosmos is within us. We are made of star-stuff. — Carl Sagan',
  'Look up at the stars and not down at your feet. — Stephen Hawking',
  'Somewhere, something incredible is waiting to be known. — Carl Sagan',
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-slate-900/50 px-4 py-8">
      <div className="max-w-6xl mx-auto text-center text-slate-400">
        <p className="text-sm mb-4">Quote of the Day</p>
        <blockquote className="text-slate-300 italic mb-4 text-lg">
          "{QUOTES[Math.floor(Math.random() * QUOTES.length)]}"
        </blockquote>
        <div className="mt-8">
          <p>&copy; {year} Stella Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
