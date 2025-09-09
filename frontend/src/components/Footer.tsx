'use client';

import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { useGame } from '@/lib/store';

const QUOTES = [
  "That's one small step for [a] man, one giant leap for mankind. — Neil Armstrong",
  'The Earth is the cradle of humanity, but mankind cannot stay in the cradle forever. — Konstantin Tsiolkovsky',
  'The important achievement of Apollo was demonstrating that humanity is not forever chained to this planet. — Neil Armstrong',
  'For small creatures such as we, the vastness is bearable only through love. — Carl Sagan',
  'Exploration is really the essence of the human spirit. — Frank Borman',
  "I don't know what you could say about a day in which you have seen four beautiful sunsets. — John Glenn",
  'To confine our attention to terrestrial matters would be to limit the human spirit. — Stephen Hawking',
  'The nitrogen in our DNA, the calcium in our teeth, the iron in our blood, the carbon in our apple pies were made in the interiors of collapsing stars. — Carl Sagan',
  'Across the sea of space, the stars are other suns. — Carl Sagan',
  'The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself. — Carl Sagan',
  'Somewhere, something incredible is waiting to be known. — Carl Sagan',
  'Look up at the stars and not down at your feet. Try to make sense of what you see, and wonder about what makes the universe exist. — Stephen Hawking',
  'Curiosity is the essence of our existence. — Gene Cernan',
  'We are all connected; to each other, biologically. To the earth, chemically. To the rest of the universe atomically. — Neil deGrasse Tyson',
];

export default function Footer() {
  const { stars, level } = useGame();
  const rootRef = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLSpanElement>(null);
  const levelRef = useRef<HTMLSpanElement>(null);

  const year = useMemo(() => new Date().getFullYear(), []);
  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Initial slide-in (footer)
  useEffect(() => {
    if (!rootRef.current || prefersReducedMotion) return;
    const tween = gsap.fromTo(
      rootRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.15 }
    );
    return () => { tween.kill(); };
  }, [prefersReducedMotion]);

  // Star-Trek style quote animation: “materialize” characters + LCARS sweep bar
  useEffect(() => {
    const el = quoteRef.current;
    const sweep = sweepRef.current;
    if (!el) return;

    // helper: set quote text into spans
    const setQuote = (text: string) => {
      const safe = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      el.innerHTML = safe
        .split('')
        .map((ch) => `<span class="inline-block will-change-transform quote-ch">${ch === ' ' ? '&nbsp;' : ch}</span>`)
        .join('');
    };

    if (prefersReducedMotion) {
      let i = 0;
      setQuote(QUOTES[i]);
      const id = setInterval(() => {
        i = (i + 1) % QUOTES.length;
        setQuote(QUOTES[i]);
      }, 6000);
      return () => { clearInterval(id); };
    }

    // Animated version
    let i = 0;
    setQuote(QUOTES[i]);

    const makeCycle = () => {
      const chars = el.querySelectorAll<HTMLSpanElement>('.quote-ch');

      // timeline per cycle
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: () => {
          // next quote after a pause
          i = (i + 1) % QUOTES.length;
          setQuote(QUOTES[i]);
          // schedule next cycle
          cycle = makeCycle();
        },
      });

      // LCARS-style sweep bar pass
      if (sweep) {
        tl.fromTo(
          sweep,
          { xPercent: -110, opacity: 0.0 },
          { xPercent: 110, opacity: 0.35, duration: 0.55, ease: 'power3.inOut' },
          0
        ).to(sweep, { opacity: 0, duration: 0.15 }, 0.55);
      }

      // characters “materialize” (subtle skew + blur + fade)
      tl.fromTo(
        chars,
        { opacity: 0, y: 6, skewX: -8, filter: 'blur(2px)' },
        { opacity: 1, y: 0, skewX: 0, filter: 'blur(0px)', duration: 0.45, stagger: { each: 0.01, from: 'start' } },
        0.05
      );

      // hold, then “de-phase” out
      tl.to(
        chars,
        { opacity: 0, y: -4, skewX: 6, filter: 'blur(1.5px)', duration: 0.28, stagger: { each: 0.008, from: 'end' }, delay: 4.2 }
      );

      return tl;
    };

    let cycle = makeCycle();
    return () => {
      if (cycle) cycle.kill();
    };
  }, [prefersReducedMotion]);

  // Stars tween (safe cleanup)
  useEffect(() => {
    const el = starsRef.current;
    if (!el) return;
    const from = Number(el.dataset.val ?? 0);
    const to = Number(stars);
    el.dataset.val = String(to);

    if (prefersReducedMotion) {
      el.textContent = String(to);
      return;
    }

    const obj = { n: from };
    const tween = gsap.to(obj, {
      n: to,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(obj.n).toString(); },
      onComplete: () => { el.textContent = String(to); },
    });
    return () => { tween.kill(); };
  }, [stars, prefersReducedMotion]);

  // Level tween + pop (safe cleanup)
  useEffect(() => {
    const el = levelRef.current;
    if (!el) return;
    const from = Number(el.dataset.val ?? 0);
    const to = Number(level);
    el.dataset.val = String(to);

    if (prefersReducedMotion) {
      el.textContent = `Level ${to}`;
      return;
    }

    const obj = { n: from };
    const tl = gsap.timeline();
    tl.to(el, { scale: 1.08, duration: 0.12, ease: 'power1.out' })
      .to(el, { scale: 1, duration: 0.2, ease: 'back.out(2)' }, '+=0.02');

    const tween = gsap.to(obj, {
      n: to,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => { el.textContent = `Level ${Math.round(obj.n)}`; },
      onComplete: () => { el.textContent = `Level ${to}`; },
    });

    return () => { tl.kill(); tween.kill(); };
  }, [level, prefersReducedMotion]);

  return (
    <footer
      ref={rootRef}
      className="w-full bg-ink text-sky shadow-pixel font-pixel text-xs px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
      aria-live="polite"
    >
      {/* Left: live game stats */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          ★ <span ref={starsRef} data-val="0" className="text-gold">0</span>
        </span>
        <span className="flex items-center gap-1">
          🚀 <span ref={levelRef} data-val="0" className="text-mint">Level 0</span>
        </span>
      </div>

      {/* Center: rotating quote + LCARS sweep */}
      <div className="relative flex-1 hidden sm:block">
        <div
          ref={quoteRef}
          className="italic text-candy text-center px-6"
          aria-label="Inspirational tip"
        />
        <div
          ref={sweepRef}
          className="pointer-events-none absolute top-1/2 left-0 h-5 w-24 -translate-y-1/2 rounded-full"
          style={{
            background:
              'linear-gradient(90deg, rgba(125,211,252,0) 0%, rgba(125,211,252,0.7) 40%, rgba(125,211,252,0) 100%)',
            filter: 'blur(2px)',
          }}
        />
      </div>

      {/* Right: version & NASA credit */}
      <div className="text-slate-400 text-right">
        <div>© {year} Stella Academy</div>
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
