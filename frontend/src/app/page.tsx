'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles, Activity, Cpu, Calculator, ChevronRight,
  FlaskConical, BookOpen, Zap, Trophy, ArrowRight
} from 'lucide-react';
import { studyModules, type CategoryId } from '@/lib/study-modules';

/* ─── Category metadata ─────────────────────────────────────────────── */
const categories: {
  id: CategoryId;
  title: string;
  icon: React.ElementType;
  color: string;
  glow: string;
  badge: string;
}[] = [
  { id: 'physics',         title: 'Physics & Fields',          icon: FlaskConical, color: 'text-indigo-400',  glow: 'rgba(99,102,241,0.15)',  badge: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' },
  { id: 'mechanics',       title: 'Mechanics & Orbits',         icon: Activity,     color: 'text-amber-400',   glow: 'rgba(245,158,11,0.15)',  badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
  { id: 'electronics',     title: 'Electronics & Signals',      icon: Cpu,          color: 'text-emerald-400', glow: 'rgba(52,211,153,0.15)',  badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  { id: 'mathematics',     title: 'Theoretical Mathematics',    icon: Calculator,   color: 'text-rose-400',    glow: 'rgba(251,113,133,0.15)', badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400' },
  { id: 'elementary-math', title: 'Elementary Mathematics',     icon: BookOpen,     color: 'text-violet-400',  glow: 'rgba(167,139,250,0.15)', badge: 'bg-violet-500/10 border-violet-500/30 text-violet-400' },
];

/* ─── Animated floating orbs ─────────────────────────────────────────── */
function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[100px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
      <div className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] rounded-full bg-cyan-600/8 blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
    </div>
  );
}

/* ─── Stat counter ───────────────────────────────────────────────────── */
function StatCard({ value, label, icon: Icon, color }: { value: number | string; label: string; icon: React.ElementType; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm">
      <Icon className={`w-5 h-5 mb-1 ${color}`} />
      <span className={`text-3xl font-bold font-mono ${color}`}>{value}</span>
      <span className="text-xs text-slate-500 uppercase tracking-widest font-mono">{label}</span>
    </div>
  );
}

/* ─── Feature highlight card ─────────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, body, color }: { icon: React.ElementType; title: string; body: string; color: string }) {
  return (
    <div className="relative group flex gap-4 items-start p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300">
      <div className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-white/10 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-200 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

/* ─── Module card ────────────────────────────────────────────────────── */
function ModuleCard({ mod, cat }: { mod: (typeof studyModules)[0]; cat: typeof categories[0] }) {
  const Icon = cat.icon;
  return (
    <Link
      href={`/study/${mod.id}`}
      className="group relative flex flex-col bg-slate-900/40 backdrop-blur-md border border-slate-700/40 hover:border-slate-500/60 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.1)]"
      style={{ '--glow': cat.glow } as React.CSSProperties}
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${cat.glow} 0%, transparent 70%)` }} />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider border ${cat.badge}`}>
            LVL {mod.difficulty}
          </span>
          <span className="text-[10px] text-slate-600 font-mono">{mod.estimatedMinutes} MIN</span>
        </div>

        <h3 className={`text-lg font-bold text-white font-fraunces mb-1.5 group-hover:${cat.color} transition-colors`}>
          {mod.title}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-5 flex-1">{mod.subtitle}</p>

        <div className={`flex items-center gap-1.5 text-[11px] font-mono ${cat.color} opacity-70 group-hover:opacity-100 transition-opacity uppercase tracking-widest border-t border-white/[0.06] pt-4`}>
          Open Module <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [apodTitle, setApodTitle] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/apod')
      .then((res) => res.json())
      .then((data) => {
        if (data?.title) setApodTitle(data.title);
      })
      .catch(() => {});
  }, []);

  const totalModules = studyModules.length;
  const totalFlashcards = studyModules.filter(m =>
    ['arithmetic','basic-geometry','proportions','decimals-percentages','binary','multiplication','fraction-ops','negative-numbers','exponents-roots'].includes(m.id)
  ).length * 5;

  return (
    <div className="relative min-h-screen bg-transparent overflow-hidden">
      <FloatingOrbs />

      {/* ── Subtle grid ── */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">

        {/* ── HERO ── */}
        <section className="pt-10 sm:pt-16 pb-10 sm:pb-14 text-center max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] sm:text-xs font-mono uppercase tracking-widest">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Interactive Learning Platform
            </div>

            {apodTitle && (
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] sm:text-xs font-mono hover:bg-cyan-500/20 transition-all group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-slate-400">APOD:</span>
                <span className="font-medium truncate max-w-[200px] sm:max-w-xs">{apodTitle}</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold font-fraunces text-white mb-5 sm:mb-6 leading-[1.05] tracking-[-0.03em]">
            Explore Science &amp;<br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Mathematics
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 px-2">
            Interactive visual labs, concept guides, and practice modules — from basic arithmetic to orbital mechanics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/study"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all duration-200 shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:-translate-y-0.5 text-sm sm:text-base"
            >
              Open Study Hub
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/about"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold border border-white/10 hover:border-white/20 transition-all duration-200 text-sm sm:text-base"
            >
              Learn More
            </Link>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-14 sm:mb-20">
          <StatCard value={totalModules}    label="Modules"     icon={BookOpen}     color="text-indigo-400" />
          <StatCard value={5}               label="Disciplines" icon={FlaskConical}  color="text-violet-400" />
          <StatCard value={totalFlashcards} label="Flashcards"  icon={Zap}          color="text-amber-400" />
          <StatCard value="KaTeX"           label="Math Render" icon={Trophy}        color="text-emerald-400" />
        </section>

        {/* ── FEATURES ── */}
        <section className="mb-14 sm:mb-20">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold font-fraunces text-white mb-2 sm:mb-3">Study Features</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm px-2">Interactive visual tools, concept notes, and curated references to support your study.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <FeatureCard icon={Calculator}  color="text-indigo-400"  title="KaTeX Math Formatting"    body="All mathematical formulas rendered cleanly with LaTeX notation for clear readability." />
            <FeatureCard icon={Zap}         color="text-amber-400"   title="Interactive Practice"     body="Step through calculation steps manually or test your understanding with guided problem sets." />
            <FeatureCard icon={Activity}    color="text-emerald-400" title="Visual Simulations"       body="GSAP visual models for physics and mechanics — observe gravity, gear ratios, and wave behavior." />
            <FeatureCard icon={BookOpen}    color="text-violet-400"  title="Curated References"      body="Each module points to recommended reading and open academic resources for further study." />
            <FeatureCard icon={FlaskConical} color="text-rose-400"   title="5 Core Disciplines"       body="From elementary arithmetic and binary logic to differential calculus and astrophysics." />
            <FeatureCard icon={Trophy}      color="text-cyan-400"    title="Graded Difficulty"        body="Modules are labeled Level 1–3 to help you navigate topics at your preferred pace." />
          </div>
        </section>

        {/* ── CURRICULUM ── */}
        <section>
          <div className="flex items-start sm:items-center justify-between mb-8 sm:mb-10 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-fraunces text-white mb-1 sm:mb-2">Curriculum</h2>
              <p className="text-slate-500 text-sm">Browse all {totalModules} modules across 5 disciplines</p>
            </div>
            <Link
              href="/study"
              className="hidden sm:inline-flex shrink-0 items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-widest"
            >
              Browse All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-14">
            {categories.map(cat => {
              const modules = studyModules.filter(m => m.category === cat.id);
              if (!modules.length) return null;
              const Icon = cat.icon;

              return (
                <div key={cat.id}>
                  {/* Category header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 border border-white/10 ${cat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] font-mono text-slate-300">{cat.title}</h3>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-xs font-mono text-slate-600">{modules.length} modules</span>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {modules.map(mod => <ModuleCard key={mod.id} mod={mod} cat={cat} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
