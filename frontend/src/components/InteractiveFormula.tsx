'use client';

import { useEffect, useState } from 'react';
import katex from 'katex';

interface InteractiveFormulaProps {
  conceptId: 'gravity' | 'prism' | 'gears' | 'trajectory' | 'circuit' | 'waves';
  activeVar: string | null;
  setActiveVar: (v: string | null) => void;
  accentClass: string; // text-indigo-400, text-amber-400, text-emerald-400
}

interface TermProps {
  id: string;
  math: string;
  activeVar: string | null;
  setActiveVar: (v: string | null) => void;
  accentClass: string;
}

function HoverTerm({ id, math, activeVar, setActiveVar, accentClass }: TermProps) {
  const [html, setHtml] = useState('');
  const isActive = activeVar === id;

  useEffect(() => {
    try {
      const rendered = katex.renderToString(math, {
        displayMode: false,
        throwOnError: false,
      });
      setHtml(rendered);
    } catch {
      setHtml(math);
    }
  }, [math]);

  return (
    <span
      onMouseEnter={() => setActiveVar(id)}
      onMouseLeave={() => setActiveVar(null)}
      dangerouslySetInnerHTML={{ __html: html }}
      className={`inline-block px-1 rounded transition-all cursor-crosshair duration-150 ${
        isActive
          ? `${accentClass} scale-110 bg-slate-900/80 shadow-[0_0_10px_rgba(255,255,255,0.1)] font-bold`
          : 'text-slate-200 hover:text-white'
      }`}
    />
  );
}

export default function InteractiveFormula({
  conceptId,
  activeVar,
  setActiveVar,
  accentClass,
}: InteractiveFormulaProps) {
  
  const term = (id: string, math: string) => (
    <HoverTerm
      id={id}
      math={math}
      activeVar={activeVar}
      setActiveVar={setActiveVar}
      accentClass={accentClass}
    />
  );

  return (
    <div className="flex items-center justify-center gap-1.5 py-4 px-6 bg-slate-950/60 rounded-xl border border-white/5 shadow-inner text-xl md:text-2xl select-none">
      
      {/* 1. Gravity: F_g = G * M * m / r^2 */}
      {conceptId === 'gravity' && (
        <div className="flex items-center">
          {term('Fg', 'F_g')}
          <span className="mx-2 text-slate-500">=</span>
          {term('G', 'G')}
          
          {/* Fraction layout */}
          <div className="inline-flex flex-col items-center align-middle mx-2">
            <div className="border-b border-slate-600 pb-1 px-1 flex gap-1 items-center">
              {term('M', 'M')}
              <span className="text-slate-500 text-xs">•</span>
              {term('m', 'm')}
            </div>
            <div className="pt-1 px-1">
              {term('r', 'r^2')}
            </div>
          </div>
        </div>
      )}

      {/* 2. Prism: n_1 sin(theta_i) = n_2 sin(theta_r) */}
      {conceptId === 'prism' && (
        <div className="flex items-center flex-wrap justify-center">
          {term('n1', 'n_1')}
          <span className="mx-0.5 text-slate-500">•</span>
          {term('thetaI', '\\sin(\\theta_i)')}
          <span className="mx-2 text-slate-500">=</span>
          {term('n2', 'n_2')}
          <span className="mx-0.5 text-slate-500">•</span>
          {term('thetaR', '\\sin(\\theta_r)')}
        </div>
      )}

      {/* 3. Gears: Gear Ratio = N_driven / N_driver = omega_driver / omega_driven */}
      {conceptId === 'gears' && (
        <div className="flex items-center flex-wrap justify-center text-lg md:text-xl">
          {term('ratio', '\\text{Gear Ratio}')}
          <span className="mx-2 text-slate-500">=</span>
          
          <div className="inline-flex flex-col items-center align-middle mx-1">
            <div className="border-b border-slate-600 pb-1 px-2">
              {term('Ndriven', 'N_{\\text{driven}}')}
            </div>
            <div className="pt-1 px-2">
              {term('Ndriver', 'N_{\\text{driver}}')}
            </div>
          </div>

          <span className="mx-2 text-slate-500">=</span>

          <div className="inline-flex flex-col items-center align-middle mx-1">
            <div className="border-b border-slate-600 pb-1 px-2">
              {term('omegaDriver', '\\omega_{\\text{driver}}')}
            </div>
            <div className="pt-1 px-2">
              {term('omegaDriven', '\\omega_{\\text{driven}}')}
            </div>
          </div>
        </div>
      )}

      {/* 4. Trajectory: a = (r_1 + r_2) / 2 */}
      {conceptId === 'trajectory' && (
        <div className="flex items-center">
          {term('a', 'a')}
          <span className="mx-2 text-slate-500">=</span>
          
          <div className="inline-flex flex-col items-center align-middle mx-1">
            <div className="border-b border-slate-600 pb-1 px-2">
              {term('r1', 'r_1')}
              <span className="mx-1 text-slate-500">+</span>
              {term('r2', 'r_2')}
            </div>
            <div className="pt-1 px-2">
              {term('two', '2')}
            </div>
          </div>
        </div>
      )}

      {/* 5. Circuit: I = V / R */}
      {conceptId === 'circuit' && (
        <div className="flex items-center flex-wrap justify-center">
          {term('I', 'I')}
          <span className="mx-2 text-slate-500">=</span>
          
          <div className="inline-flex flex-col items-center align-middle mx-1">
            <div className="border-b border-slate-600 pb-1 px-2">
              {term('V', 'V')}
            </div>
            <div className="pt-1 px-2">
              {term('R', 'R')}
            </div>
          </div>

          <span className="mx-3 text-slate-600">|</span>

          {term('P', 'P')}
          <span className="mx-2 text-slate-500">=</span>
          {term('I', 'I^2')}
          <span className="mx-1 text-slate-500">•</span>
          {term('R', 'R')}
        </div>
      )}

      {/* 6. Waves: lambda = v / f */}
      {conceptId === 'waves' && (
        <div className="flex items-center">
          {term('lambda', '\\lambda')}
          <span className="mx-2 text-slate-500">=</span>
          
          <div className="inline-flex flex-col items-center align-middle mx-1">
            <div className="border-b border-slate-600 pb-1 px-2">
              {term('v', 'v')}
            </div>
            <div className="pt-1 px-2">
              {term('f', 'f')}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
