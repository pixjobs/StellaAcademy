'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Link from 'next/link';
import Image from 'next/image';
import { useGame, Role } from '@/lib/store'; // Assuming Role is exported from your store

const roles: { id: Role; label: string; blurb: string; persona: string }[] = [
  {
    id: 'explorer',
    label: 'Explorer (Kid)',
    blurb: 'Explore amazing space pictures with a friendly guide.',
    persona:
      'You are Stella, a cheerful and imaginative space guide for kids. Use simple words, fun facts, and storytelling.'
  },
  {
    id: 'cadet',
    label: 'Cadet (Teen)',
    blurb: 'Analyze mission data and form hypotheses with a co-pilot.',
    persona:
      'You are Stella, a sharp and encouraging mission co-pilot for teens. Provide scientific context and challenge the user to think critically.'
  },
  {
    id: 'scholar',
    label: 'Scholar (Uni)',
    blurb: 'Conduct deep analysis and collaborate with an AI research partner.',
    persona:
      'You are Stella, a sophisticated AI research assistant for university-level students. Engage in Socratic dialogue, analyze complex data, and discuss research methodologies.'
  }
];

const missions = [
  {
    id: 'rocket-lab',
    title: 'Rocket Lab',
    href: '/missions/rocket-lab',
    tasks: {
      explorer: 'Help Stella name 3 rocket parts for a pre-launch check!',
      cadet: 'Analyze launch conditions and decide if it’s a "Go" or "No Go".',
      scholar: 'Interpret simulated telemetry data to identify a launch anomaly.'
    }
  },
  {
    id: 'rover-cam',
    title: 'Rover Cam',
    href: '/missions/rover-cam',
    tasks: {
      explorer: 'Discover a cool rock on Mars and create a story about it.',
      cadet: 'Form a hypothesis about a Martian landscape for Stella to evaluate.',
      scholar: 'Propose and justify the next scientific target for the rover.'
    }
  },
  {
    id: 'space-poster',
    title: 'Space Poster',
    href: '/missions/space-poster',
    tasks: {
      explorer: 'Pick a space photo and ask Stella to write a cool poem about it.',
      cadet: 'Write a scientific caption for a NASA photo and have Stella edit it.',
      scholar: 'Co-write a research abstract about a cosmic event with Stella.'
    }
  }
];

export default function Home() {
  // NOTE: This component uses local state. Consider moving `started` to your global `useGame`
  // store to prevent the "hidden on refresh" hydration issue.
  const { role, setRole } = useGame();
  const [started, setStarted] = useState(false);

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
      {!started && (
        <IntroOverlay
          onStart={() => {
            window.dispatchEvent(new Event('stella:warp'));
            setStarted(true);
            window.scrollTo({ top: 0, behavior: 'instant' as any });
          }}
        />
      )}

      {started && (
        <section className="container mx-auto px-4 py-10 max-w-5xl">
          <div className="rounded-2xl bg-slate-900/60 p-6 shadow-pixel mb-8 border border-white/10 backdrop-blur-md">
            {/* RE-ADDED: `text-gold` for brand consistency with the intro screen. */}
            <h1 className="font-pixel text-2xl text-gold mb-2">Stella Academy 🌟</h1>
            <p className="text-slate-300">
              Welcome to <strong className="text-gold">Stella Academy</strong> — your interactive space tutor. Choose a role and a mission, and Stella will teach, quiz, and explore the cosmos with you — powered by <span className="text-mint">gpt-oss-20b</span>.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900/60 p-6 shadow-pixel mb-8 border border-white/10 backdrop-blur-md">
            {/* Using a different color for subheadings creates good visual hierarchy. `text-sky` is a good choice. */}
            <h2 className="font-pixel text-xl text-sky mb-4">Choose your learning path</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`rounded-xl border-2 px-4 py-3 text-left transition h-full
                    ${role === r.id
                      ? 'border-mint bg-slate-800/80 shadow-lg'
                      : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/40'}`}
                >
                  <div className={`font-pixel text-sm ${role === r.id ? 'text-white' : 'text-slate-200'}`}>{r.label}</div>
                  <div className="text-xs text-slate-400">{r.blurb}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/60 p-6 shadow-pixel mb-8 border border-white/10 backdrop-blur-md">
            {/* Using `text-sky` to match the other subheading. */}
            <h2 className="font-pixel text-xl text-sky mb-4">Select a Mission</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {missions.map((m) => (
                <div key={m.id} className="mission-card rounded-xl border border-slate-700 bg-slate-800/40 p-4 flex flex-col">
                  <div className="flex-grow">
                    {/* RE-ADDED: `text-gold` for the titles on the mission cards. */}
                    <div className="font-pixel text-base text-gold mb-2">{m.title}</div>
                    <p className="text-xs text-slate-300 mb-3">
                      <span className="font-bold text-sky">Your Task: </span>
                      {m.tasks[role || 'explorer']}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">★ Interactive AI Challenge</span>
                    <Link href={m.href} className="btn-pixel font-pixel text-xs" aria-label={`Open ${m.title}`}>
                      Launch
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/60 p-4 shadow-pixel border border-white/10 backdrop-blur-md">
            <p className="text-[11px] text-slate-400">
              <strong>How it works:</strong> Inside each mission, our AI guide, Stella, uses your chosen role to personalise challenges and help. This project shows how <span className="text-mint font-bold">gpt-oss</span> creates adaptive learning experiences.
            </p>
          </div>
        </section>
      )}
    </>
  );
}

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
      .fromTo(
        panelRef.current,
        { y: 20, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' },
        '<0.1'
      )
      .from(
        [titleRef.current, textRef.current, btnRef.current],
        { opacity: 0, y: 10, stagger: 0.08, duration: 0.45, ease: 'power2.out' },
        '-=0.2'
      );

    gsap.to(stellaRef.current, { y: -6, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to(blobA.current, { x: 40, y: -20, scale: 1.1, rotate: 8, duration: 8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to(blobB.current, { x: -50, y: 30, scale: 0.95, rotate: -10, duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') handleStart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleStart = () => {
    const tl = gsap.timeline({ onComplete: onStart });
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.2),_rgba(0,0,0,0.75)_70%)]" />
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
      <div
        ref={panelRef}
        className="relative w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden"
      >
        <div className="grid md:grid-cols-[180px_1fr] gap-4 p-5 md:p-7">
          <div ref={stellaRef} className="relative flex items-center justify-center">
            <div className="relative w-[150px] h-[150px] rounded-2xl border border-white/25 bg-slate-700/20 overflow-hidden shadow-lg">
              <Image src="/stella.png" alt="Stella" fill className="object-cover" sizes="150px" priority />
            </div>
          </div>
          <div>
            <h1 ref={titleRef} className="font-pixel text-2xl text-gold">Welcome to Stella Academy 🌟</h1>
            <p ref={textRef} className="mt-2 text-slate-200 text-sm leading-relaxed">
              I’m <span className="text-sky">Stella</span> — your interactive space tutor. We’ll explore rockets, rovers, and today’s space picture together. Pick the path that suits you and I’ll guide you with quick, friendly challenges.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
              <span className="px-2 py-1 rounded bg-slate-800/70 border border-white/10">Interactive Analysis</span>
              <span className="px-2 py-1 rounded bg-slate-800/70 border border-white/10">Creative Co-writing</span>
              <span className="px-2 py-1 rounded bg-slate-800/70 border border-white/10">Personalized Learning</span>
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
              <div className="mt-2 text-[11px] text-slate-400">
                Tip: Press <kbd className="px-1 bg-slate-800/70 rounded border border-white/10">Enter</kbd> to start
              </div>
            </div>
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: 'linear-gradient(120deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04) 30%, rgba(255,255,255,0) 60%)' }}
        />
      </div>
    </div>
  );
}