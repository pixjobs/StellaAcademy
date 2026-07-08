'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGame } from '@/lib/store';
import type { Role } from '@/lib/store';

interface SpaceFact {
  id: string;
  title: string;
  description: string;
}

interface ApodData {
  bgUrl: string | null;
  title?: string;
  explanation?: string;
  credit?: string;
  mediaType?: 'image' | 'video';
}

const spaceFacts: SpaceFact[] = [
  { 
    id: '1', 
    title: 'The Moon is Drifting Away', 
    description: 'The Moon is currently moving away from Earth at about 3.8 cm per year. It will continue to do so for billions of years.'
  },
  { 
    id: '2', 
    title: 'Mars is Half the Size of Earth', 
    description: 'Mars has a diameter of about 6,779 km, about half that of Earth. This explains why it has such weak gravity.'
  },
  { 
    id: '3', 
    title: 'The Great Red Spot', 
    description: 'Jupiter\'s Great Red Spot is a storm that has been raging for at least 400 years. It is large enough to contain two or three Earths.'
  },
  { 
    id: '4', 
    title: 'There\'s Water on the Moon', 
    description: 'NASA discovered water ice in permanently shadowed craters on the Moon. This could be a valuable resource for future lunar missions.'
  },
];

export default function Home() {
  const { stars, level, role, setRole, addStars } = useGame();
  
  // Local states
  const [apod, setApod] = useState<ApodData | null>(null);
  const [loadingApod, setLoadingApod] = useState(true);
  const [selectedTrivia, setSelectedTrivia] = useState<number | null>(null);
  const [answeredTrivia, setAnsweredTrivia] = useState(false);
  const [triviaRewardClaimed, setTriviaRewardClaimed] = useState(false);
  
  // Load NASA APOD
  useEffect(() => {
    fetch('/api/apod')
      .then(res => res.json())
      .then(data => {
        setApod(data);
        setLoadingApod(false);
      })
      .catch(() => {
        setLoadingApod(false);
      });
  }, []);

  // Custom greeting messages based on selected role
  const getStellaMessage = () => {
    switch (role) {
      case 'cadet':
        return "System Check: propulsion and trajectory parameters online. Welcome, Cadet! Head over to the Rocket Lab and test your launch capabilities.";
      case 'scholar':
        return "Academic Database active. Welcome, Scholar! Dive into the Keplerian physics and chemical stoichiometry challenges to expand your research.";
      case 'explorer':
      default:
        return "Starchart view enabled. Welcome, Explorer! Feel free to browse cosmic findings, search NASA's catalog, or begin a learning mission.";
    }
  };

  const handleTriviaAnswer = (index: number) => {
    setSelectedTrivia(index);
    setAnsweredTrivia(true);
    if (index === 0 && !triviaRewardClaimed) {
      addStars(25);
      setTriviaRewardClaimed(true);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500/30">
      {/* Stars Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Floating HUD Navigation */}
      <nav className="relative z-10 border-b border-white/5 bg-slate-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            ✨ Stella Academy
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.1)]">
              <span>⭐</span> {stars} Stars
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs font-semibold text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.1)]">
              <span>🛡️</span> Level {level}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Stella Space Academy
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Gamified learning missions grounded in real-world physics, telemetry simulations, and astronomical data. Complete challenges to level up your status!
          </p>
          <div className="pt-4">
            <Link 
              href="/missions" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:scale-[1.02] transition-transform text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-purple-500/20"
            >
              🚀 Start Learning Campaign →
            </Link>
          </div>
        </div>
      </section>

      {/* Stella Chat & Pathway Choice */}
      <section className="max-w-6xl mx-auto px-4 mb-12 relative z-10">
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Pathway Selector */}
          <div className="md:col-span-1 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-1.5">
              <span>🛡️</span> Academy Pathway
            </h3>
            <p className="text-xs text-slate-400">
              Select your pathway to customize your educational feedback and dashboard controls.
            </p>
            
            <div className="space-y-2 pt-2">
              {(['explorer', 'cadet', 'scholar'] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`w-full p-3 text-left rounded-xl border transition-all cursor-pointer ${
                    role === r
                      ? 'bg-purple-600/10 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)] font-bold'
                      : 'bg-slate-950/40 border-white/5 text-slate-400 hover:border-white/10 hover:bg-slate-950/70'
                  }`}
                >
                  <div className="flex justify-between items-center text-sm">
                    <span>{r.toUpperCase()}</span>
                    {role === r && <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full font-bold">Selected</span>}
                  </div>
                  <span className="text-[10px] text-slate-500 block font-normal mt-1">
                    {r === 'explorer' && 'Visual mapping, stargazing & space poster missions.'}
                    {r === 'cadet' && 'Engine telemetry calculations & rocket launch physics.'}
                    {r === 'scholar' && 'Astrophysical stoichiometry & orbital mechanics.'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Socratic Assistant Dialogue */}
          <div className="md:col-span-2 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold text-white shadow-md">
                  ✨
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-200">Stella</h4>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Academy Guide</span>
                </div>
              </div>
              
              <div className="p-4 bg-slate-950/60 border border-white/5 rounded-xl text-sm text-slate-300 leading-relaxed italic">
                &ldquo;{getStellaMessage()}&rdquo;
              </div>
            </div>

            {/* Micro daily quiz */}
            <div className="mt-6 border-t border-white/5 pt-4">
              <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Daily Academy Challenge (+25 Stars)</h4>
              <p className="text-xs text-slate-200 mb-3">
                What does Kepler&apos;s Second Law (equal areas in equal time) imply about a planet&apos;s orbital speed?
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Planets move faster when they are closer to the Sun.",
                  "Planets maintain a perfectly constant speed in LEO.",
                  "The orbital speed is independent of the orbital path.",
                  "Outer planets orbit faster than inner planets."
                ].map((opt, idx) => (
                  <button
                    key={idx}
                    disabled={answeredTrivia}
                    onClick={() => handleTriviaAnswer(idx)}
                    className={`p-2.5 text-[10px] text-left rounded-lg border transition-all cursor-pointer ${
                      answeredTrivia
                        ? idx === 0
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                          : selectedTrivia === idx
                          ? 'bg-red-500/10 border-red-500 text-red-300'
                          : 'bg-slate-950/40 border-white/5 opacity-55'
                        : 'bg-slate-950/40 border-white/5 text-slate-300 hover:border-white/10 hover:bg-slate-950/70'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {answeredTrivia && (
                <p className="text-[9px] text-slate-400 mt-2 leading-relaxed">
                  {selectedTrivia === 0 
                    ? "Correct! As a planet moves closer to the Sun, gravity pulls harder, and it speeds up (achieving maximum velocity at perihelion) to sweep out equal area."
                    : "Not quite. The correct answer is that planets move faster when they are closer to the Sun (at perihelion)."
                  }
                </p>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Featured Section: Live APOD & Space Facts */}
      <section className="max-w-6xl mx-auto px-4 mb-16 relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-xl">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-6 tracking-tight text-white flex items-center gap-2">
            <span>📷</span> NASA Space Exploration
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Space Facts */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-cyan-400 border-b border-white/5 pb-2">Cosmic Facts</h3>
              <div className="space-y-4">
                {spaceFacts.map((fact) => (
                  <div key={fact.id} className="space-y-1 bg-slate-950/30 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-all">
                    <h4 className="font-bold text-sm text-cyan-400">{fact.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{fact.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live NASA APOD display */}
            <div className="border-l border-white/5 pl-0 md:pl-8">
              <h3 className="text-lg font-bold text-purple-400 mb-4">Astronomy Picture of the Day</h3>
              
              {loadingApod ? (
                <div className="w-full h-64 bg-slate-950 rounded-xl animate-pulse flex items-center justify-center border border-white/5">
                  <span className="text-xs text-slate-500">Retrieving APOD image...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {apod?.bgUrl ? (
                    <div className="rounded-xl overflow-hidden shadow-lg border border-white/10 relative group">
                      <img 
                        src={apod.bgUrl} 
                        alt={apod.title || 'Stunning cosmic landscape'}
                        className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4">
                        <h4 className="font-bold text-xs text-white">{apod.title}</h4>
                        <span className="text-[9px] text-slate-400 mt-1 block">Copyright: {apod.credit || 'NASA'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-56 bg-slate-950 rounded-xl flex items-center justify-center border border-white/5 text-center p-4">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        API rate limit reached or offline. Custom cosmic display activated.
                      </p>
                    </div>
                  )}
                  
                  {apod?.explanation && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
                      {apod.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Campaign Directory Grid */}
      <section className="max-w-6xl mx-auto px-4 py-8 relative z-10 border-t border-white/5">
        <h2 className="text-2xl font-bold mb-6 text-slate-200">Academy Hubs</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link 
            href="/about" 
            className="bg-slate-900/50 hover:bg-slate-900/80 border border-white/5 hover:border-white/10 rounded-xl p-6 transition-all shadow-md group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform w-fit">📚</div>
            <h3 className="font-bold text-md mb-1 text-purple-300">About Stella</h3>
            <p className="text-xs text-slate-400">Discover the educational pedagogy and goals of our platform.</p>
          </Link>
          
          <Link 
            href="/missions" 
            className="bg-slate-900/50 hover:bg-slate-900/80 border border-white/5 hover:border-white/10 rounded-xl p-6 transition-all shadow-md group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform w-fit">🚀</div>
            <h3 className="font-bold text-md mb-1 text-cyan-300">Space Missions</h3>
            <p className="text-xs text-slate-400">Engage in mathematical launch calculations and chemical spectrometry.</p>
          </Link>
          
          <Link 
            href="/gallery" 
            className="bg-slate-900/50 hover:bg-slate-900/80 border border-white/5 hover:border-white/10 rounded-xl p-6 transition-all shadow-md group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform w-fit">🖼️</div>
            <h3 className="font-bold text-md mb-1 text-pink-300">Media Library</h3>
            <p className="text-xs text-slate-400">Browse stunning high-resolution space imagery indexed from NASA.</p>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-16 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-500 text-xs space-y-2">
          <p>&copy; 2026 Stella Academy. Gamified physics campaign.</p>
        </div>
      </footer>
    </main>
  );
}
