'use client';

import Link from 'next/link';

interface MissionCardProps {
  title: string;
  description: string;
  status: 'active' | 'development';
  href: string;
  icon: string;
  colorClass: string;
}

function MissionCard({ title, description, status, href, icon, colorClass }: MissionCardProps) {
  const isActive = status === 'active';
  
  return (
    <div className={`p-6 rounded-2xl border bg-slate-900/60 backdrop-blur-md backdrop-filter transition-all ${
      isActive 
        ? 'border-white/10 hover:border-white/20 hover:scale-[1.02] shadow-lg hover:shadow-purple-500/5' 
        : 'border-white/5 opacity-60'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-4xl">{icon}</span>
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
          isActive 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        }`}>
          {isActive ? 'Available Now' : 'In Development'}
        </span>
      </div>
      
      <h3 className={`text-xl font-bold mb-2 bg-gradient-to-r ${colorClass} bg-clip-text text-transparent`}>
        {title}
      </h3>
      
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">
        {description}
      </p>

      {isActive ? (
        <Link 
          href={href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors group"
        >
          Begin Mission <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      ) : (
        <span className="text-sm text-slate-600 font-medium cursor-not-allowed">
          System Standby
        </span>
      )}
    </div>
  );
}

export default function MissionsPage() {
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
          <Link href="/" className="text-sm text-slate-300 hover:text-white transition-colors">
            ← Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Space Learning Missions
          </h1>
          <p className="text-slate-400 text-lg">
            Scaffolded interactive simulations, telemetry logs, and physics challenges designed to teach space science, orbital mechanics, and astronomy.
          </p>
        </div>

        {/* Missions Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <MissionCard
            title="Rocket Lab"
            description="Configure booster fuel capacity, dry structure mass, and Specific Impulse to calculate Delta-V. Conduct launch simulations into LEO orbit."
            status="active"
            href="/missions/rocket-lab"
            icon="🚀"
            colorClass="from-purple-400 to-pink-400"
          />
          
          <MissionCard
            title="Mars Rover Lab"
            description="Analyze spectroscopic imagery and diagnostic logs returned by Curiosity and Perseverance. Solve rock chemical stoichiometry challenges."
            status="development"
            href="/missions/mars-rover"
            icon="🤖"
            colorClass="from-orange-400 to-amber-400"
          />

          <MissionCard
            title="Earth Observer"
            description="Map cyclones, cloud structures, and atmospheric trends using live NASA planetary datasets. Complete weather speed velocity calculations."
            status="development"
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
