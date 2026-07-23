'use client';

import { useCallback } from 'react';
import { Lightbulb, Check, ChevronDown } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ConceptStep {
  stepNumber: number;
  title: string;
  content: string;
  keyInsight: string;
  relatedVariables: string[];
}

export interface ConceptStepperProps {
  steps: ConceptStep[];
  activeStep: number;
  onStepChange: (step: number) => void;
  accentColor: 'indigo' | 'amber' | 'emerald' | 'violet' | 'rose' | 'cyan';
  activeVariable: string | null;
}

/* ------------------------------------------------------------------ */
/*  Accent‑colour map                                                  */
/* ------------------------------------------------------------------ */

const ACCENT = {
  indigo: {
    line: 'bg-indigo-500/30',
    circleFilled: 'bg-indigo-500 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.45)]',
    circleOutline: 'border-indigo-500/40',
    title: 'text-indigo-300',
    insightBg: 'bg-indigo-500/10 border-indigo-500/20',
    insightIcon: 'text-indigo-400',
    pillActive: 'bg-indigo-500/25 text-indigo-300 border-indigo-400/50 shadow-[0_0_8px_rgba(99,102,241,0.5)]',
    pillDefault: 'bg-white/5 text-slate-400 border-white/10',
  },
  amber: {
    line: 'bg-amber-500/30',
    circleFilled: 'bg-amber-500 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.45)]',
    circleOutline: 'border-amber-500/40',
    title: 'text-amber-300',
    insightBg: 'bg-amber-500/10 border-amber-500/20',
    insightIcon: 'text-amber-400',
    pillActive: 'bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    pillDefault: 'bg-white/5 text-slate-400 border-white/10',
  },
  emerald: {
    line: 'bg-emerald-500/30',
    circleFilled: 'bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.45)]',
    circleOutline: 'border-emerald-500/40',
    title: 'text-emerald-300',
    insightBg: 'bg-emerald-500/10 border-emerald-500/20',
    insightIcon: 'text-emerald-400',
    pillActive: 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    pillDefault: 'bg-white/5 text-slate-400 border-white/10',
  },
  violet: {
    line: 'bg-violet-500/30',
    circleFilled: 'bg-violet-500 border-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.45)]',
    circleOutline: 'border-violet-500/40',
    title: 'text-violet-300',
    insightBg: 'bg-violet-500/10 border-violet-500/20',
    insightIcon: 'text-violet-400',
    pillActive: 'bg-violet-500/25 text-violet-300 border-violet-400/50 shadow-[0_0_8px_rgba(139,92,246,0.5)]',
    pillDefault: 'bg-white/5 text-slate-400 border-white/10',
  },
  rose: {
    line: 'bg-rose-500/30',
    circleFilled: 'bg-rose-500 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.45)]',
    circleOutline: 'border-rose-500/40',
    title: 'text-rose-300',
    insightBg: 'bg-rose-500/10 border-rose-500/20',
    insightIcon: 'text-rose-400',
    pillActive: 'bg-rose-500/25 text-rose-300 border-rose-400/50 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
    pillDefault: 'bg-white/5 text-slate-400 border-white/10',
  },
  cyan: {
    line: 'bg-cyan-500/30',
    circleFilled: 'bg-cyan-500 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.45)]',
    circleOutline: 'border-cyan-500/40',
    title: 'text-cyan-300',
    insightBg: 'bg-cyan-500/10 border-cyan-500/20',
    insightIcon: 'text-cyan-400',
    pillActive: 'bg-cyan-500/25 text-cyan-300 border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.5)]',
    pillDefault: 'bg-white/5 text-slate-400 border-white/10',
  },
} as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ConceptStepper({
  steps,
  activeStep,
  onStepChange,
  accentColor,
  activeVariable,
}: ConceptStepperProps) {
  const palette = ACCENT[accentColor];

  const getStepState = useCallback(
    (stepNumber: number): 'completed' | 'active' | 'upcoming' => {
      if (stepNumber < activeStep) return 'completed';
      if (stepNumber === activeStep) return 'active';
      return 'upcoming';
    },
    [activeStep],
  );

  return (
    <div className="relative flex flex-col">
      {/* Vertical timeline line */}
      <div
        aria-hidden
        className={`absolute left-[15px] top-4 bottom-4 w-px ${palette.line}`}
      />

      {steps.map((step) => {
        const state = getStepState(step.stepNumber);
        const isExpanded = state === 'active';

        return (
          <div key={step.stepNumber} className="relative pl-10 pb-6 last:pb-0">
            {/* ── Timeline circle ── */}
            <button
              type="button"
              onClick={() => onStepChange(step.stepNumber)}
              aria-label={`Go to step ${step.stepNumber}`}
              className={`
                absolute left-0 top-0.5 z-10 flex h-[31px] w-[31px] items-center justify-center
                rounded-full border-2 transition-all duration-300 cursor-pointer
                ${
                  state === 'completed'
                    ? `${palette.circleFilled} scale-90`
                    : state === 'active'
                    ? `${palette.circleFilled} scale-100`
                    : `bg-slate-950/80 ${palette.circleOutline}`
                }
              `}
            >
              {state === 'completed' ? (
                <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
              ) : (
                <span
                  className={`font-mono text-[11px] font-bold leading-none ${
                    state === 'active' ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {step.stepNumber}
                </span>
              )}
            </button>

            {/* ── Step header (clickable) ── */}
            <button
              type="button"
              onClick={() => onStepChange(step.stepNumber)}
              className={`
                group flex w-full items-center gap-2 text-left transition-colors duration-200 cursor-pointer
                ${state === 'completed' ? 'opacity-60 hover:opacity-90' : ''}
              `}
            >
              <h4
                className={`
                  text-sm font-semibold leading-snug transition-colors duration-200
                  ${state === 'active' ? palette.title : 'text-slate-300 group-hover:text-white'}
                `}
              >
                {step.title}
              </h4>

              <ChevronDown
                className={`
                  ml-auto h-4 w-4 flex-shrink-0 text-slate-600 transition-transform duration-300
                  ${isExpanded ? 'rotate-180' : 'rotate-0'}
                `}
              />
            </button>

            {/* ── Expandable content area (CSS grid‑rows trick) ── */}
            <div
              className="grid transition-[grid-template-rows] duration-500 ease-out"
              style={{
                gridTemplateRows: isExpanded ? '1fr' : '0fr',
              }}
            >
              <div className="overflow-hidden">
                {/* Explanation */}
                <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
                  {step.content}
                </p>

                {/* Variable pills */}
                {step.relatedVariables.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {step.relatedVariables.map((v) => {
                      const isHighlighted = activeVariable === v;
                      return (
                        <span
                          key={v}
                          className={`
                            inline-flex items-center rounded-full border px-2.5 py-0.5
                            font-mono text-[10px] uppercase tracking-widest
                            transition-all duration-300
                            ${isHighlighted ? palette.pillActive : palette.pillDefault}
                          `}
                        >
                          {v}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Key Insight callout */}
                <div
                  className={`
                    mt-4 flex items-start gap-2.5 rounded-lg border p-3
                    ${palette.insightBg}
                  `}
                >
                  <Lightbulb
                    className={`mt-0.5 h-4 w-4 flex-shrink-0 ${palette.insightIcon}`}
                  />
                  <div>
                    <span
                      className={`
                        block font-mono text-[9px] uppercase tracking-widest mb-1
                        ${palette.insightIcon}
                      `}
                    >
                      Key Insight
                    </span>
                    <p className="text-xs leading-relaxed text-slate-300">
                      {step.keyInsight}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
