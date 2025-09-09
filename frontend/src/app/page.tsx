'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import Link from 'next/link';
import { useGame, Role } from '@/lib/store';
import IntroOverlay from '@/components/IntroOverlay';

const roles: { id: Role; label: string; blurb: string; persona: string }[] = [
  { id: 'explorer', label: 'Explorer (Kid)', blurb: 'Explore amazing space pictures with a friendly guide.', persona: 'You are Stella, a cheerful...' },
  { id: 'cadet', label: 'Cadet (Teen)', blurb: 'Analyze mission data and form hypotheses with a co-pilot.', persona: 'You are Stella, a sharp...' },
  { id: 'scholar', label: 'Scholar (Uni)', blurb: 'Conduct deep analysis and collaborate with an AI research partner.', persona: 'You are Stella, a sophisticated...' },
];

const missions = [
  { id: 'rocket-lab', title: 'Rocket Lab', href: '/missions/rocket-lab', tasks: { explorer: 'Help Stella name 3 rocket parts for a pre-launch check!', cadet: 'Analyze launch conditions and decide if it’s a "Go" or "No Go".', scholar: 'Interpret simulated telemetry data to identify a launch anomaly.' } },
  { id: 'earth-observer', title: 'Earth Observer', href: '/missions/earth-observer', tasks: { explorer: 'Find your home continent and ask Stella what the weather is like!', cadet: 'Identify a major storm system and ask Stella to explain its scientific name.', scholar: 'Analyze cloud patterns to deduce the season in a hemisphere and justify it.' } },
  { id: 'space-poster', title: 'Space Poster', href: '/missions/space-poster', tasks: { explorer: 'Pick a space photo and ask Stella to write a cool poem about it.', cadet: 'Write a scientific caption for a NASA photo and have Stella edit it.', scholar: 'Co-write a research abstract about a cosmic event with Stella.' } },
];

export default function Home() {
  const { role, setRole, started, setStarted } = useGame();

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
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior  });
          }}

          title="Welcome to Stella Academy 🌟"
          copy="You’re signed in — great! I’m Stella, your interactive space tutor. Choose a learning path and I’ll guide you with quick, friendly challenges."
          badges={['Interactive Analysis', 'Creative Co-writing', 'Personalised Learning']}
          ctaLabel="▶ Press Start"
          imageSrc="/stella.png"
        >

          <div className="grid grid-cols-3 gap-2">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`rounded border border-white/15 bg-white/5 px-3 py-2 text-left hover:bg-white/10 transition ${
                  role === r.id ? 'outline outline-1 outline-mint' : ''
                }`}
              >
                <div className="font-pixel text-xs text-white">{r.label}</div>
                <div className="text-[11px] text-slate-300">{r.blurb}</div>
              </button>
            ))}
          </div>
        </IntroOverlay>
      )}

      {started && (
        <section className="container mx-auto px-4 py-10 max-w-5xl">
          <div className="rounded-2xl bg-slate-900/60 p-6 shadow-pixel mb-8 border border-white/10 backdrop-blur-md">
            <h1 className="font-pixel text-2xl text-gold mb-2">Stella Academy 🌟</h1>
            <p className="text-slate-300">
              Welcome to <strong className="text-gold">Stella Academy</strong> — your interactive space tutor. Choose a role and a mission, and Stella will teach, quiz, and explore the cosmos with you — powered by <span className="text-mint">gpt-oss-20b</span>.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900/60 p-6 shadow-pixel mb-8 border border-white/10 backdrop-blur-md">
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
            <h2 className="font-pixel text-xl text-sky mb-4">Select a Mission</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {missions.map((m) => (
                <div key={m.id} className="mission-card rounded-xl border border-slate-700 bg-slate-800/40 p-4 flex flex-col">
                  <div className="flex-grow">
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
