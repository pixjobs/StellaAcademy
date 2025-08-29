'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Link from 'next/link';
import Image from 'next/image';
import { useGame } from '@/lib/store';

type Role = 'explorer' | 'cadet' | 'scholar';

const roles: { id: Role; label: string; blurb: string }[] = [
  { id: 'explorer', label: 'Explorer (Kid)',  blurb: 'Stories & simple math' },
  { id: 'cadet',    label: 'Cadet (Teen)',    blurb: 'Practice + equations' },
  { id: 'scholar',  label: 'Scholar (Uni)',   blurb: 'Deeper reasoning' },
];

const missions = [
  { id: 'rocket-lab',   title: 'Rocket Lab',    desc: 'See launches & make a 3-step checklist', href: '/missions/rocket-lab' },
  { id: 'rover-cam',    title: 'Rover Cam',     desc: 'Peek at Mars & ask Stella what you see', href: '/missions/rover-cam' },
  { id: 'space-poster', title: 'Space Poster',  desc: 'Use APOD to make a poster + caption',    href: '/missions/space-poster' },
];

export default function Home() {
  const role = useGame((s) => s.role);
  const setRole = useGame((s) => s.setRole);
  const [started, setStarted] = useState(false);

  // Animate mission grid on reveal
  useEffect(() => {
    if (!started) return;
    gsap.fromTo(
      '.mission-card',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.075 }
    );
  }, [started]);

  return (
    <>
      {!started && <IntroOverlay onStart={() => {
        // trigger your WarpDrive background
        window.dispatchEvent(new Event('stella:warp'));
        setStarted(true);
        window.scrollTo({ top: 0, behavior: 'instant' as any });
      }} />}

      {started && (
        <section className="container mx-auto px-4 py-10 max-w-5xl">
          {/* Title */}
          <div className="rounded-2xl bg-slate-900/60 p-6 shadow-pixel mb-8 border border-white/10 backdrop-blur-md">
            <h1 className="font-pixel text-2xl text-gold mb-2">Stella Academy 🌟</h1>
            <p className="text-slate-300">
              Pick a role and a mission. Big NASA pictures + tiny quizzes, powered by <span className="text-mint">gpt-oss:20b</span>.
            </p>
          </div>

          {/* Role Picker */}
          <div className="rounded-2xl bg-slate-900/60 p-6 shadow-pixel mb-8 border border-white/10 backdrop-blur-md">
            <h2 className="font-pixel text-xl text-sky mb-4">Choose your path</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`rounded-xl border-2 px-4 py-3 text-left transition
                    ${role === r.id
                      ? 'border-mint bg-slate-800/80'
                      : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/40'}`}
                >
                  <div className="font-pixel text-sm">{r.label}</div>
                  <div className="text-xs text-slate-400">{r.blurb}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Missions */}
          <div className="rounded-2xl bg-slate-900/60 p-6 shadow-pixel mb-8 border border-white/10 backdrop-blur-md">
            <h2 className="font-pixel text-xl text-sky mb-4">Pick a mission</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {missions.map((m) => (
                <div key={m.id} className="mission-card rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                  <div className="font-pixel text-sm text-gold mb-1">{m.title}</div>
                  <p className="text-xs text-slate-300 mb-3">{m.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">★ Earn stars</span>
                    <Link href={m.href} className="btn-pixel font-pixel text-xs" aria-label={`Open ${m.title}`}>
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hint */}
          <div className="rounded-2xl bg-slate-900/60 p-4 shadow-pixel border border-white/10 backdrop-blur-md">
            <p className="text-[11px] text-slate-400">
              Tip: The background warps in and lands on NASA’s APOD. Ask Stella inside each mission for role-level help.
            </p>
          </div>
        </section>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Intro Overlay Component
────────────────────────────────────────────────────────── */
function IntroOverlay({ onStart }: { onStart: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const blobA = useRef<HTMLDivElement>(null);
  const blobB = useRef<HTMLDivElement>(null);
  const stellaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.set(rootRef.current, { opacity: 0 })
      .to(rootRef.current, { opacity: 1, duration: 0.4, ease: 'power2.out' })
      .fromTo(panelRef.current, { y: 20, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }, '<0.1')
      .from([titleRef.current, textRef.current, btnRef.current], { opacity: 0, y: 10, stagger: 0.08, duration: 0.45, ease: 'power2.out' }, '-=0.2');

    // Subtle float for Stella portrait
    gsap.to(stellaRef.current, { y: -6, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    // Liquid blobs slow drift
    gsap.to(blobA.current, { x: 40, y: -20, scale: 1.1, rotate: 8, duration: 8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to(blobB.current, { x: -50, y: 30, scale: 0.95, rotate: -10, duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') handleStart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleStart = () => {
    // exit animation, then call onStart
    const tl = gsap.timeline({
      onComplete: onStart,
    });
    tl.to(btnRef.current, { scale: 0.96, duration: 0.08, ease: 'power1.out' })
      .to(panelRef.current, { y: -20, opacity: 0, scale: 0.98, duration: 0.35, ease: 'power2.in' }, '<')
      .to(rootRef.current, { opacity: 0, duration: 0.35, ease: 'power2.in' }, '<0.05');
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-30 flex items-center justify-center px-4 py-6 pointer-events-auto"
      aria-modal
      role="dialog"
    >
      {/* Deep vignette so warp peeks behind */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.2),_rgba(0,0,0,0.75)_70%)]" />

      {/* Liquid background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          ref={blobA}
          className="absolute -top-12 -left-8 w-80 h-80 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle at 30% 30%, rgba(99,179,237,0.6), rgba(99,179,237,0) 60%)' }}
        />
        <div
          ref={blobB}
          className="absolute -bottom-10 -right-6 w-96 h-96 rounded-full opacity-35 blur-3xl"
          style={{ background: 'radial-gradient(circle at 60% 40%, rgba(16,185,129,0.55), rgba(16,185,129,0) 60%)' }}
        />
      </div>

      {/* Glass panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl
                   shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden"
      >
        <div className="grid md:grid-cols-[180px_1fr] gap-4 p-5 md:p-7">
          {/* Stella portrait slot */}
          <div ref={stellaRef} className="relative flex items-center justify-center">
            <div className="relative w-[150px] h-[150px] rounded-2xl border border-white/25 bg-slate-700/20 overflow-hidden shadow-lg">
              {/* Put your Stella image at public/stella.png */}
              <Image
                src="/stella.png"
                alt="Stella"
                fill
                className="object-cover"
                sizes="150px"
                priority
              />
            </div>
          </div>

          {/* Copy + CTA */}
          <div>
            <h1 ref={titleRef} className="font-pixel text-2xl text-gold">Welcome, Cadet!</h1>
            <p ref={textRef} className="mt-2 text-slate-200 text-sm leading-relaxed">
              I’m <span className="text-sky">Stella</span> — your mission guide. We’ll explore rockets, rovers, and today’s space pic.
              Pick a path that fits you, then I’ll quiz and help you — fast and fun.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
              <span className="px-2 py-1 rounded bg-slate-800/70 border border-white/10">Rocket Lab</span>
              <span className="px-2 py-1 rounded bg-slate-800/70 border border-white/10">Rover Cam</span>
              <span className="px-2 py-1 rounded bg-slate-800/70 border border-white/10">Space Poster</span>
            </div>

            <div className="mt-5">
              <button
                ref={btnRef}
                onClick={handleStart}
                className="btn-pixel font-pixel text-sm px-4 py-2"
                aria-label="Press Start"
                title="Press Start"
              >
                ▶ Press Start
              </button>
              <div className="mt-2 text-[11px] text-slate-400">Tip: Press <kbd className="px-1 bg-slate-800/70 rounded border border-white/10">Enter</kbd> to start</div>
            </div>
          </div>
        </div>

        {/* Subtle glass sheen */}
        <div className="pointer-events-none absolute inset-0 opacity-40"
             style={{ background: 'linear-gradient(120deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04) 30%, rgba(255,255,255,0) 60%)' }} />
      </div>
    </div>
  );
}
