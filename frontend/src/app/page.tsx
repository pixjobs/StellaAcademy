'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import Link from 'next/link';
import { useGame } from '@/lib/store';

const roles = [
  { id: 'explorer', label: 'Explorer (Kid)', blurb: 'Stories & simple math' },
  { id: 'cadet',    label: 'Cadet (GCSE)',  blurb: 'Practice + equations' },
  { id: 'scholar',  label: 'Scholar (Uni)', blurb: 'Derivations & proofs' },
] as const;

const missions = [
  { id: 'optics101',  title: 'Optics 101',  desc: 'Build a telescope & magnification', reward: 10 },
  { id: 'keplerLaw',  title: 'Kepler’s Law', desc: 'Relate period and semi-major axis', reward: 12 },
  { id: 'gravityRun', title: 'Gravity Run', desc: 'Orbits, energy, escape speed',      reward: 8  },
];

export default function Home() {
  const role      = useGame((s) => s.role);
  const setRole   = useGame((s) => s.setRole);
  const addStars  = useGame((s) => s.addStars);
  const levelUp   = useGame((s) => s.levelUp);

  useEffect(() => {
    gsap.fromTo(
      '.hero',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );
    gsap.fromTo(
      '.mission-card',
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.08, delay: 0.1 }
    );
  }, []);

  return (
    <section className="hero container mx-auto px-4 py-10 max-w-5xl">
      {/* Title / Intro */}
      <div className="rounded-2xl bg-slate-900/60 p-6 shadow-pixel mb-8">
        <h1 className="font-pixel text-2xl text-gold mb-3">Stella Academy 🌟</h1>
        <p className="text-slate-300">
          Meet <span className="text-sky">Stella</span>, your starry mentor. Choose your path, pick a mission, and
          learn space STEM through interactive challenges.
        </p>
      </div>

      {/* Role Picker */}
      <div className="rounded-2xl bg-slate-900/60 p-6 shadow-pixel mb-8">
        <h2 className="font-pixel text-xl text-sky mb-4">Choose your path</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id as any)}
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

      {/* Mission Select */}
      <div className="rounded-2xl bg-slate-900/60 p-6 shadow-pixel mb-8">
        <h2 className="font-pixel text-xl text-sky mb-4">Mission Select</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {missions.map((m) => (
            <div key={m.id} className="mission-card rounded-xl border border-slate-700 bg-slate-800/40 p-4">
              <div className="font-pixel text-sm text-gold mb-1">{m.title}</div>
              <p className="text-xs text-slate-300 mb-3">{m.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Reward: ★ {m.reward}</span>
                <button
                  onClick={() => addStars(m.reward)}
                  className="btn-pixel font-pixel text-xs"
                  aria-label={`Start ${m.title}`}
                  title={`Start ${m.title}`}
                >
                  Start
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick demo actions */}
      <div className="rounded-2xl bg-slate-900/60 p-6 shadow-pixel">
        <h3 className="font-pixel text-sm text-sky mb-3">Quick Actions (demo)</h3>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => addStars(5)} className="btn-pixel font-pixel text-xs">+5 ★</button>
          <button onClick={() => addStars(20)} className="btn-pixel font-pixel text-xs">+20 ★</button>
          <button onClick={levelUp} className="btn-pixel font-pixel text-xs">Level Up</button>
          <Link href="/missions" className="btn-pixel font-pixel text-xs">Go to Missions</Link>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          Tip: Stars & level update live in the footer via the Zustand store.
        </p>
      </div>
    </section>
  );
}
