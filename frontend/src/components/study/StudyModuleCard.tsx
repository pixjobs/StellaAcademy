'use client';

import { useEffect, useState, useMemo } from 'react';
import katex from 'katex';
import { Clock } from 'lucide-react';

interface StudyModuleCardProps {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  difficulty: number; // 1-3
  estimatedMinutes: number;
  accentColor: 'indigo' | 'amber' | 'emerald' | 'violet' | 'rose' | 'cyan';
  formulaPreview: string; // LaTeX string for a small preview
  isActive: boolean;
  onClick: () => void;
}

const accentStyles = {
  indigo: {
    border: 'border-indigo-500/50',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    dot: 'bg-indigo-400',
    glow: 'shadow-[0_0_24px_rgba(99,102,241,0.25)]',
  },
  amber: {
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    glow: 'shadow-[0_0_24px_rgba(245,158,11,0.25)]',
  },
  emerald: {
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    glow: 'shadow-[0_0_24px_rgba(16,185,129,0.25)]',
  },
  violet: {
    border: 'border-violet-500/50',
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    dot: 'bg-violet-400',
    glow: 'shadow-[0_0_24px_rgba(139,92,246,0.25)]',
  },
  rose: {
    border: 'border-rose-500/50',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
    glow: 'shadow-[0_0_24px_rgba(244,63,94,0.25)]',
  },
  cyan: {
    border: 'border-cyan-500/50',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    dot: 'bg-cyan-400',
    glow: 'shadow-[0_0_24px_rgba(6,182,212,0.25)]',
  },
} as const;

export default function StudyModuleCard({
  id,
  title,
  subtitle,
  category,
  difficulty,
  estimatedMinutes,
  accentColor,
  formulaPreview,
  isActive,
  onClick,
}: StudyModuleCardProps) {
  const [formulaHtml, setFormulaHtml] = useState('');
  const accent = accentStyles[accentColor];

  useEffect(() => {
    try {
      const rendered = katex.renderToString(formulaPreview, {
        displayMode: false,
        throwOnError: false,
      });
      setFormulaHtml(rendered);
    } catch (err) {
      console.error('[StudyModuleCard] KaTeX error:', err);
      setFormulaHtml(formulaPreview);
    }
  }, [formulaPreview]);

  const difficultyDots = useMemo(() => {
    const clamped = Math.max(1, Math.min(3, difficulty));
    return Array.from({ length: 3 }, (_, i) => (
      <span
        key={i}
        className={`inline-block h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
          i < clamped ? accent.dot : 'bg-slate-700'
        }`}
      />
    ));
  }, [difficulty, accent.dot]);

  return (
    <button
      type="button"
      onClick={onClick}
      data-module-id={id}
      className={[
        // Base card
        'group relative flex flex-col gap-4 rounded-xl p-5 text-left',
        'bg-slate-950/70 backdrop-blur-md',
        'border transition-all duration-300 ease-out',
        'cursor-pointer select-none outline-none',
        // Focus ring
        'focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
        // Hover
        'hover:-translate-y-0.5 hover:border-white/20',
        // Active / selected state
        isActive
          ? `${accent.border} ${accent.glow} scale-[1.02]`
          : 'border-white/10',
      ].join(' ')}
    >
      {/* ── Top: category badge + difficulty ── */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ${accent.bg} ${accent.text}`}
        >
          {category}
        </span>

        <div className="flex items-center gap-1" aria-label={`Difficulty ${difficulty} of 3`}>
          {difficultyDots}
        </div>
      </div>

      {/* ── Middle: title + subtitle ── */}
      <div className="flex flex-col gap-1">
        <h3 className="font-fraunces text-lg font-semibold leading-snug text-white">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-slate-400">
          {subtitle}
        </p>
      </div>

      {/* ── Bottom: formula preview + time ── */}
      <div className="mt-auto flex items-end justify-between gap-3">
        {/* Formula preview */}
        <span
          dangerouslySetInnerHTML={{ __html: formulaHtml }}
          className={`inline-block text-sm ${accent.text} opacity-70 transition-opacity duration-200 group-hover:opacity-100`}
        />

        {/* Time badge */}
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5 font-mono text-[10px] text-slate-400 border border-white/5">
          <Clock size={10} className="opacity-60" />
          {estimatedMinutes}m
        </span>
      </div>
    </button>
  );
}
