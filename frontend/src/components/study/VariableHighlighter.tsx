'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import katex from 'katex';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FormulaElement =
  | { type: 'variable'; symbol: string }
  | { type: 'operator'; content: string } // '=', '·', '+', '−', etc.
  | { type: 'fraction'; numerator: FormulaElement[]; denominator: FormulaElement[] }
  | { type: 'static'; latex: string }; // non-interactive KaTeX like '\sin'

export interface VariableDefinition {
  symbol: string;   // LaTeX symbol like 'F_g'
  name: string;     // Human-readable name
  unit: string;     // SI unit
  description: string;
  color: string;    // Tailwind color class, e.g. 'text-indigo-400'
  range?: { min: number; max: number; default: number }; // For interactive sliders
}

export interface VariableHighlighterProps {
  /** Full LaTeX formula (used as a semantic label / fallback) */
  formula: string;
  /** Definitions for every interactive variable in the formula */
  variables: VariableDefinition[];
  /** Declarative layout tree that describes how to visually reconstruct the formula */
  formulaLayout: FormulaElement[];
  /** Currently active (hovered / selected) variable symbol, or null */
  activeVariable: string | null;
  /** Callback when the active variable changes */
  onVariableChange: (symbol: string | null) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render a LaTeX string to an HTML string via KaTeX. */
function renderKatex(latex: string): string {
  try {
    return katex.renderToString(latex, {
      displayMode: false,
      throwOnError: false,
    });
  } catch {
    return latex;
  }
}

/**
 * Derive a CSS shadow / glow colour from a Tailwind `text-*` class.
 * We extract the hue-family and map to an rgba value so the glow works
 * regardless of Tailwind config (the text colour itself is applied via the
 * class, but box-shadow needs an explicit colour value).
 */
function glowColorFromClass(twClass: string): string {
  const map: Record<string, string> = {
    indigo: '99,102,241',
    amber: '245,158,11',
    emerald: '52,211,153',
    sky: '56,189,248',
    rose: '251,113,133',
    violet: '139,92,246',
    cyan: '34,211,238',
    red: '248,113,113',
    blue: '96,165,250',
    green: '74,222,128',
    yellow: '250,204,21',
    orange: '251,146,60',
    pink: '244,114,182',
    teal: '45,212,191',
    fuchsia: '232,121,249',
    lime: '163,230,53',
    purple: '192,132,252',
  };
  for (const [key, rgb] of Object.entries(map)) {
    if (twClass.includes(key)) return rgb;
  }
  return '148,163,184'; // slate fallback
}

/**
 * Derive a Tailwind border-color class from a text-color class.
 * e.g. 'text-indigo-400' → 'border-indigo-400'
 */
function borderFromTextClass(twClass: string): string {
  return twClass.replace(/^text-/, 'border-');
}

/**
 * Derive a Tailwind bg-color class (with low opacity) from a text-color class.
 * e.g. 'text-indigo-400' → 'bg-indigo-400/10'
 */
function bgFromTextClass(twClass: string): string {
  return twClass.replace(/^text-/, 'bg-') + '/10';
}

// ---------------------------------------------------------------------------
// FormulaVariable — a single hoverable KaTeX term
// ---------------------------------------------------------------------------

export interface FormulaVariableProps {
  /** LaTeX source for this variable */
  latex: string;
  /** Whether this variable is currently active / highlighted */
  isActive: boolean;
  /** Tailwind text-color class used when active */
  colorClass: string;
  /** Called when the user hovers / un-hovers / clicks */
  onActivate: () => void;
  onDeactivate: () => void;
}

export function FormulaVariable({
  latex,
  isActive,
  colorClass,
  onActivate,
  onDeactivate,
}: FormulaVariableProps) {
  const html = useMemo(() => renderKatex(latex), [latex]);
  const rgb = useMemo(() => glowColorFromClass(colorClass), [colorClass]);

  return (
    <span
      role="button"
      tabIndex={0}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      onClick={onActivate}
      dangerouslySetInnerHTML={{ __html: html }}
      style={
        isActive
          ? { boxShadow: `0 0 12px rgba(${rgb},0.35), 0 0 4px rgba(${rgb},0.2)` }
          : undefined
      }
      className={[
        'inline-block px-1.5 py-0.5 rounded-md cursor-crosshair select-none',
        'transition-all duration-200 ease-out',
        isActive
          ? `${colorClass} scale-110 ${bgFromTextClass(colorClass)} font-bold`
          : 'text-slate-200 hover:text-white hover:scale-105',
      ].join(' ')}
    />
  );
}

// ---------------------------------------------------------------------------
// Internal element renderer (recursive for fractions)
// ---------------------------------------------------------------------------

interface ElementRendererProps {
  element: FormulaElement;
  variables: VariableDefinition[];
  activeVariable: string | null;
  onVariableChange: (symbol: string | null) => void;
}

function ElementRenderer({
  element,
  variables,
  activeVariable,
  onVariableChange,
}: ElementRendererProps) {
  if (element.type === 'operator') {
    const html = renderKatex(element.content);
    return (
      <span 
        dangerouslySetInnerHTML={{ __html: html }}
        className="mx-1.5 text-slate-500 select-none font-mono text-lg md:text-xl self-center flex items-center"
      />
    );
  }

  if (element.type === 'static') {
    const html = renderKatex(element.latex);
    return (
      <span
        dangerouslySetInnerHTML={{ __html: html }}
        className="inline-block px-1 text-slate-300 select-none self-center"
      />
    );
  }

  if (element.type === 'variable') {
    const def = variables.find((v) => v.symbol === element.symbol);
    const colorClass = def?.color ?? 'text-slate-300';

    return (
      <FormulaVariable
        latex={element.symbol}
        isActive={activeVariable === element.symbol}
        colorClass={colorClass}
        onActivate={() => onVariableChange(element.symbol)}
        onDeactivate={() => onVariableChange(null)}
      />
    );
  }

  if (element.type === 'fraction') {
    return (
      <span className="inline-flex flex-col items-center align-middle mx-1.5">
        {/* Numerator */}
        <span className="flex items-center gap-0.5 border-b border-slate-600 pb-1 px-1.5">
          {element.numerator.map((child, i) => (
            <ElementRenderer
              key={i}
              element={child}
              variables={variables}
              activeVariable={activeVariable}
              onVariableChange={onVariableChange}
            />
          ))}
        </span>
        {/* Denominator */}
        <span className="flex items-center gap-0.5 pt-1 px-1.5">
          {element.denominator.map((child, i) => (
            <ElementRenderer
              key={i}
              element={child}
              variables={variables}
              activeVariable={activeVariable}
              onVariableChange={onVariableChange}
            />
          ))}
        </span>
      </span>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Variable Inspector Panel
// ---------------------------------------------------------------------------

interface InspectorProps {
  variable: VariableDefinition | null;
  allVariables: VariableDefinition[];
}

function VariableInspector({ variable, allVariables }: InspectorProps) {
  const symbolHtml = useMemo(
    () => (variable ? renderKatex(variable.symbol) : ''),
    [variable],
  );

  return (
    <div className="mt-4 transition-all duration-300 ease-out">
      {variable ? (
        <div
          className={[
            'flex items-start gap-4 p-4 rounded-lg',
            'bg-slate-950/70 border border-white/10 backdrop-blur-sm',
            `border-l-2 ${borderFromTextClass(variable.color)}`,
          ].join(' ')}
        >
          {/* Symbol badge */}
          <div
            className={[
              'shrink-0 flex items-center justify-center w-12 h-12 rounded-md',
              bgFromTextClass(variable.color),
              'border border-white/5',
            ].join(' ')}
          >
            <span
              dangerouslySetInnerHTML={{ __html: symbolHtml }}
              className={`text-lg ${variable.color}`}
            />
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className={`font-semibold ${variable.color}`}>
                {variable.name}
              </span>
              <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                {variable.unit}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400 leading-relaxed">
              {variable.description}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 select-none">
            Hover over a variable in the formula above, or see glossary below:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allVariables.map((v) => (
              <div
                key={v.symbol}
                className={`flex items-start gap-3 p-3 rounded-lg bg-slate-950/40 border border-white/5 border-l-2 ${borderFromTextClass(
                  v.color
                )}`}
              >
                <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-md bg-slate-900 border border-white/5">
                  <span
                    dangerouslySetInnerHTML={{ __html: renderKatex(v.symbol) }}
                    className={v.color}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`font-semibold text-sm truncate ${v.color}`}>
                    {v.name}
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider truncate">
                    {v.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// VariableHighlighter — main component
// ---------------------------------------------------------------------------

export default function VariableHighlighter({
  formula,
  variables,
  formulaLayout,
  activeVariable,
  onVariableChange,
}: VariableHighlighterProps) {
  const activeDef = useMemo(
    () => variables.find((v) => v.symbol === activeVariable) ?? null,
    [variables, activeVariable],
  );

  return (
    <div className="w-full" role="figure" aria-label={`Interactive formula: ${formula}`}>
      {/* Formula display */}
      <div
        className={[
          'flex flex-wrap items-center justify-center gap-1',
          'py-5 px-6 rounded-xl',
          'bg-slate-950/60 border border-white/5 shadow-inner',
          'text-xl md:text-2xl select-none',
        ].join(' ')}
      >
        {formulaLayout.map((element, i) => (
          <ElementRenderer
            key={i}
            element={element}
            variables={variables}
            activeVariable={activeVariable}
            onVariableChange={onVariableChange}
          />
        ))}
      </div>

      {/* Inspector / Glossary */}
      <VariableInspector variable={activeDef} allVariables={variables} />
    </div>
  );
}
