'use client';

import Link from 'next/link';
import { useGame } from '@/lib/store';

interface MissionCardProps {
  title: string;
  description: string;
  status: 'active' | 'development';
  requiredLevel: number;
  userLevel: number;
  href: string;
  icon: string;
  colorClass: string;
}

function MissionCard({ title, description, status, requiredLevel, userLevel, href, icon, colorClass }: MissionCardProps) {
  const isUnlocked = userLevel >= requiredLevel;
  const isActive = status === 'active' && isUnlocked;
  
  return (
    <div className={`p-6 rounded-2xl border bg-slate-900/60 backdrop-blur-md backdrop-filter transition-all ${
      isUnlocked 
        ? isActive
          ? 'border-white/10 hover:border-white/20 hover:scale-[1.02] shadow-lg hover:shadow-purple-500/5' 
          : 'border-white/10 opacity-75'
        : 'border-white/5 opacity-40 select-none'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-4xl">{icon}</span>
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
          !isUnlocked 
            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
            : isActive 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        }`}>
          {!isUnlocked 
            ? `🔒 Locked (Level ${requiredLevel})` 
            : isActive 
            ? 'Available Now' 
            : 'In Development'
          }
        </span>
      </div>
      
      <h3 className={`text-xl font-bold mb-2 bg-gradient-to-r ${colorClass} bg-clip-text text-transparent`}>
        {title}
      </h3>
      
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">
        {description}
      </p>

      {!isUnlocked ? (
        <span className="text-sm text-red-500 font-medium">
          Requires Academy Level {requiredLevel}
        </span>
      ) : isActive ? (
        <Link 
          href={href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors group"
        >
          Begin Mission <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      ) : (
        <div className="space-y-3">
          <span className="text-xs text-amber-400 font-medium block">
            🔓 Unlocked! Ready for launch as soon as construction completes.
          </span>
          <span className="text-xs text-slate-500 block">
            Under telemetry testing.
          </span>
        </div>
      )}
    </div>
  );
}

export default function MissionsPage() {
  const { stars, level, levelUp, role } = useGame();
  
  const canLevelUp = stars >= 100;

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Navigation */}
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

            {canLevelUp && (
              <button
                onClick={levelUp}
                className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:scale-105 transition-transform text-white rounded-full text-xs font-bold shadow-md cursor-pointer"
              >
                ⚡ Level Up! (Costs 100 ⭐)
              </button>
            )}

            <Link href="/" className="text-sm text-slate-300 hover:text-white transition-colors ml-2">
              ← Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-bold text-purple-300 mb-2 uppercase tracking-wide">
            Pathway: {role.toUpperCase()}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Space Learning Missions
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Scaffolded interactive simulations, telemetry logs, and physics challenges. Earn stars by completing active missions, then spend them to level up and unlock newer projects.
          </p>
        </div>

        {/* Level Up Banner Alert */}
        {canLevelUp && (
          <div className="max-w-md mx-auto mb-10 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.1)] animate-bounce">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-emerald-300">Promotion Available!</h4>
              <p className="text-[10px] text-slate-400">You collected {stars} stars. Level up your academy rank.</p>
            </div>
            <button
              onClick={levelUp}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              ⚡ Level Up
            </button>
          </div>
        )}

        {/* Missions Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <MissionCard
            title="Rocket Lab"
            description="Configure booster fuel capacity, dry structure mass, and Specific Impulse to calculate Delta-V. Conduct launch simulations into LEO orbit."
            status="active"
            requiredLevel={1}
            userLevel={level}
            href="/missions/rocket-lab"
            icon="🚀"
            colorClass="from-purple-400 to-pink-400"
          />
          
          <MissionCard
            title="Mars Rover Lab"
            description="Analyze spectroscopic imagery and diagnostic logs returned by Curiosity and Perseverance. Solve rock chemical stoichiometry challenges."
            status="development"
            requiredLevel={2}
            userLevel={level}
            href="/missions/mars-rover"
            icon="🤖"
            colorClass="from-orange-400 to-amber-400"
          />

          <MissionCard
            title="Earth Observer"
            description="Map cyclones, cloud structures, and atmospheric trends using live NASA planetary datasets. Complete weather speed velocity calculations."
            status="development"
            requiredLevel={2}
            userLevel={level}
            href="/missions/earth-observer"
            icon="🌍"
            colorClass="from-cyan-400 to-emerald-400"
          />
        </div>

        {/* Footer info */}
        <div className="mt-16 text-center text-xs text-slate-600">
          * Missions are grounded in real mathematical models, Tsiolkovsky Rocket Equations, and Keplerian orbital dynamics.
        </div>
      </div>
    </main>
  );
}
