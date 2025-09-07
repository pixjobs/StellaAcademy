'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';

type IntroOverlayProps = {
  onStart: () => void;
  title?: string;
  copy?: string;
  badges?: string[];
  imageSrc?: string;
  ctaLabel?: string;
  children?: React.ReactNode;
};

export default function IntroOverlay({
  onStart,
  title = 'Welcome to Stella Academy 🌟',
  copy = `I’m Stella — your interactive space tutor. We’ll explore rockets, planets, and today’s space picture together. Pick the path that suits you and I’ll guide you with quick, friendly challenges.`,
  badges = ['Interactive Analysis', 'Creative Co-writing', 'Personalised Learning'],
  imageSrc = '/stella.png',
  ctaLabel = '▶ Press Start',
  children,
}: IntroOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const stellaRef = useRef<HTMLDivElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);
  const panelSweepRef = useRef<HTMLDivElement>(null);
  const starsNearRef = useRef<HTMLDivElement>(null);
  const starsFarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Hard-set readable defaults so text is never stuck grey/faded
    gsap.set(rootRef.current, { opacity: 1 });
    gsap.set([titleRef.current, textRef.current, btnRef.current], { opacity: 1, y: 0 });
    gsap.set(panelRef.current, { opacity: 1, y: 0, scale: 1 });

    if (reduce) return;

    const ctx = gsap.context((self) => {
      // Entrance timeline
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: () => {
          // Clear inline transforms/opacity to hand control back to Tailwind
          gsap.set([panelRef.current, titleRef.current, textRef.current, btnRef.current], {
            clearProps: 'opacity,transform',
          });
        },
      });

      tl.fromTo(
        panelRef.current,
        { opacity: 0, y: 24, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out', immediateRender: false }
      )
        .fromTo(
          panelSweepRef.current,
          { xPercent: -120, opacity: 0.0 },
          { xPercent: 120, opacity: 0.22, duration: 0.9, ease: 'power1.inOut' },
          '-=0.25'
        )
        .from(
          [titleRef.current, textRef.current, btnRef.current],
          { opacity: 0, y: 12, stagger: 0.08, duration: 0.45 },
          '-=0.3'
        );

      // Subtle float for portrait
      gsap.to(stellaRef.current, { y: -6, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });

      // CRT-style scanline over portrait
      gsap.fromTo(
        scanLineRef.current,
        { yPercent: -120, opacity: 0.0 },
        {
          yPercent: 120,
          opacity: 0.18,
          duration: 2.4,
          ease: 'power1.inOut',
          repeat: -1,
          repeatDelay: 1.2,
        }
      );

      // Parallax pixel starfield (two layers drifting at different speeds)
      gsap.to(starsFarRef.current, {
        backgroundPosition: '+=200px 0',
        duration: 30,
        ease: 'none',
        repeat: -1,
      });
      gsap.to(starsNearRef.current, {
        backgroundPosition: '+=400px 0',
        duration: 15,
        ease: 'none',
        repeat: -1,
      });

      // Pixel button pulse + shimmer
      const btnTl = gsap.timeline({ repeat: -1, repeatDelay: 0.8 });
      btnTl
        .to(btnRef.current, { scale: 1.03, duration: 0.24, ease: 'power1.out' })
        .to(btnRef.current, { scale: 1.0, duration: 0.3, ease: 'power1.in' })
        .fromTo(
          btnRef.current,
          { boxShadow: '0 0 0 0 rgba(255,255,255,0.0)' },
          { boxShadow: '0 0 24px 2px rgba(255,255,255,0.35)', duration: 0.35, yoyo: true, repeat: 1 },
          0
        );

      // If the tab becomes visible mid-refresh, finish entrance instantly to avoid faded text
      const onVis = () => {
        if (document.visibilityState === 'visible' && tl.progress() < 1) tl.progress(1);
      };
      document.addEventListener('visibilitychange', onVis);
      // ✅ register cleanup with the context's helper
      self.add(() => document.removeEventListener('visibilitychange', onVis));
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const handleStart = () => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      onStart();
      return;
    }
    const tl = gsap.timeline({ onComplete: onStart });
    tl.to(btnRef.current, { scale: 0.96, duration: 0.08, ease: 'power1.out' })
      .to(panelRef.current, { y: -20, opacity: 0, scale: 0.98, duration: 0.35, ease: 'power2.in' }, '<')
      .to(rootRef.current, { opacity: 0, duration: 0.35, ease: 'power2.in' }, '<0.05');
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-30 flex items-center justify-center px-4 py-6 pointer-events-auto opacity-0"
      aria-modal
      role="dialog"
    >
      {/* Pixel starfield background (two parallax layers). 
          Using tiny repeating gradients + image-rendering for a crisp pixel look. */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          ref={starsFarRef}
          className="absolute inset-0"
          style={{
            backgroundImage:
              // sparse pixels
              'radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.6) 0, transparent 2px),' +
              'radial-gradient(1px 1px at 80% 70%, rgba(255,255,255,0.5) 0, transparent 2px)',
            backgroundRepeat: 'repeat',
            backgroundSize: '12px 12px',
            opacity: 0.35,
            imageRendering: 'pixelated',
            filter: 'contrast(110%)',
          }}
        />
        <div
          ref={starsNearRef}
          className="absolute inset-0"
          style={{
            backgroundImage:
              // denser pixels
              'radial-gradient(1px 1px at 30% 60%, rgba(255,255,255,0.85) 0, transparent 2px),' +
              'radial-gradient(1px 1px at 60% 20%, rgba(255,255,255,0.8) 0, transparent 2px)',
            backgroundRepeat: 'repeat',
            backgroundSize: '8px 8px',
            opacity: 0.55,
            imageRendering: 'pixelated',
            filter: 'contrast(115%)',
          }}
        />
      </div>

      {/* Soft vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.18),_rgba(0,0,0,0.78)_70%)]" />

      {/* Main panel */}
      <div
        ref={panelRef}
        className="
          relative w-full max-w-3xl overflow-hidden text-white
          rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl
          shadow-[0_0_0_2px_rgba(255,255,255,0.08)_inset,0_20px_60px_rgba(0,0,0,0.45)]
        "
        style={{
          // subtle pixel frame highlights
          boxShadow:
            '0 0 0 2px rgba(255,255,255,0.08) inset, 0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Panel sweep highlight */}
        <div
          ref={panelSweepRef}
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.0), rgba(255,255,255,0.35), rgba(255,255,255,0.0))',
            mixBlendMode: 'screen',
          }}
        />

        {/* Light pixel grid glass (very subtle) */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to right, rgba(255,255,255,0.12) 0 1px, transparent 1px 8px),' +
              'repeating-linear-gradient(to bottom, rgba(255,255,255,0.12) 0 1px, transparent 1px 8px)',
            imageRendering: 'pixelated',
          }}
        />

        <div className="grid md:grid-cols-[180px_1fr] gap-4 p-5 md:p-7">
          {/* Portrait + scanline */}
          <div ref={stellaRef} className="relative flex items-center justify-center">
            <div
              className="
                relative w-[150px] h-[150px] overflow-hidden
                rounded-2xl border border-white/25 bg-slate-700/20 shadow-lg
              "
              style={{
                imageRendering: 'pixelated',
                boxShadow:
                  '0 0 0 2px rgba(255,255,255,0.06) inset, 0 6px 18px rgba(0,0,0,0.45)',
              }}
            >
              <Image
                src={imageSrc}
                alt="Stella"
                fill
                className="object-cover"
                sizes="150px"
                priority
              />
              {/* CRT scanline pass */}
              <div
                ref={scanLineRef}
                className="absolute left-0 right-0 h-1/4"
                style={{
                  top: 0,
                  background:
                    'linear-gradient( to bottom, rgba(255,255,255,0.18), rgba(255,255,255,0.04) 60%, rgba(255,255,255,0) )',
                  mixBlendMode: 'screen',
                }}
              />
              {/* Fine scanlines overlay */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to bottom, rgba(255,255,255,0.09) 0 1px, transparent 1px 3px)',
                }}
              />
            </div>
          </div>

          {/* Copy / content */}
          <div>
            <h1 ref={titleRef} className="font-pixel text-2xl text-gold">{title}</h1>
            <p ref={textRef} className="mt-2 text-white text-sm leading-relaxed">
              {copy}
            </p>

            {badges?.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-white">
                {badges.map((b) => (
                  <span
                    key={b}
                    className="px-2 py-1 rounded border border-white/10 bg-slate-800/70"
                    style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}

            {children && <div className="mt-4">{children}</div>}

            <div className="mt-5">
              <button
                ref={btnRef}
                onClick={handleStart}
                className="
                  btn-pixel font-pixel text-sm px-4 py-2 relative overflow-hidden
                  border border-white/25 bg-white/10
                  hover:bg-white/15 transition
                "
                aria-label="Press Start"
                title="Press Start"
                style={{
                  boxShadow:
                    '0 0 0 2px rgba(255,255,255,0.06) inset, 0 6px 16px rgba(0,0,0,0.35)',
                }}
              >
                {/* Button shimmer */}
                <span
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(120deg, rgba(255,255,255,0.18), rgba(255,255,255,0.0) 30%, rgba(255,255,255,0) 60%)',
                    mixBlendMode: 'screen',
                  }}
                />
                {ctaLabel}
              </button>
              <div className="mt-2 text-[11px] text-white">
                Tip: Press <kbd className="px-1 bg-slate-800/70 rounded border border-white/10">Enter</kbd> to start
              </div>
            </div>
          </div>
        </div>

        {/* Light glass streaks */}
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            background:
              'linear-gradient(120deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04) 30%, rgba(255,255,255,0) 60%)',
          }}
        />
      </div>
    </div>
  );
}
