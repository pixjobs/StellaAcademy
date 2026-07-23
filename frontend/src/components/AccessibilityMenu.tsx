'use client';

import { useAccessibility } from '@/lib/store';
import { Settings, X, RotateCcw, Check, Sparkles, Type, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    fontSizeScale, 
    fontFamily, 
    reduceTransparency,
    reduceMotion,
    setFontSizeScale, 
    setFontFamily, 
    setReduceTransparency,
    setReduceMotion,
    resetDefaults
  } = useAccessibility();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-md transition-all duration-200 shadow-sm"
        aria-label="Accessibility Settings"
      >
        <Settings className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-xs font-mono font-medium">Display</span>
      </button>

      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 sm:p-6 animate-in fade-in duration-300"
        >
          {/* Ambient background glow for liquid glass effect */}
          <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-indigo-600/30 via-cyan-500/20 to-violet-600/30 blur-[100px] pointer-events-none" />

          {/* Liquid Glass Modal Box */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-3xl bg-slate-950/70 border border-white/15 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden flex flex-col max-h-[90vh] text-center"
          >
            {/* Liquid Shine Top Highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" />

            {/* Header - Centered */}
            <div className="relative pt-6 pb-4 px-6 border-b border-white/10 bg-white/[0.02]">
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
                aria-label="Close Settings"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <Settings className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-bold font-fraunces text-white tracking-tight">
                Display &amp; Accessibility
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">Customize text sizing, typography, and motion effects</p>
            </div>

            {/* Scrollable Body - Centered Alignment */}
            <div className="p-6 sm:p-7 space-y-7 overflow-y-auto">
              
              {/* 1. Text Size Sizing */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-md">
                <div className="flex items-center justify-center gap-2">
                  <Type className="w-4 h-4 text-indigo-400" />
                  <label className="text-sm font-semibold text-slate-200">Text Scaling</label>
                  <span className="ml-1 text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 font-bold">
                    {Math.round(fontSizeScale * 100)}%
                  </span>
                </div>

                <div className="px-2">
                  <input 
                    type="range" 
                    min="0.8" max="2.0" step="0.05"
                    value={fontSizeScale}
                    onChange={(e) => setFontSizeScale(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-900 rounded-lg border border-white/10"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-2">
                    <span>Small (80%)</span>
                    <span>Standard (115%)</span>
                    <span>Large (200%)</span>
                  </div>
                </div>
              </div>

              {/* 2. Font Selection Grid */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-md">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <label className="text-sm font-semibold text-slate-200">Font Family</label>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'sans', label: 'Default (Sans)' },
                    { id: 'serif', label: 'Serif (Fraunces)' },
                    { id: 'mono', label: 'Monospace' },
                    { id: 'dyslexic', label: 'Dyslexia Friendly' },
                  ].map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => setFontFamily(font.id as any)}
                      className={`py-2.5 px-3 text-xs sm:text-sm rounded-xl border text-center font-medium transition-all duration-200 ${
                        fontFamily === font.id 
                          ? 'bg-indigo-500/20 border-indigo-400/60 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.25)] scale-[1.02]' 
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                      }`}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Toggles - Glass Cards */}
              <div className="space-y-3">
                {/* Reduce Motion / Pause Animations */}
                <div 
                  onClick={() => setReduceMotion(!reduceMotion)}
                  className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all cursor-pointer backdrop-blur-md text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                        Pause Background Motion
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Stops the slow APOD space drift &amp; pulsing effects.
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative inline-flex items-center shrink-0">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={reduceMotion}
                      onChange={(e) => setReduceMotion(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 border border-white/10"></div>
                  </div>
                </div>

                {/* Reduce Transparency */}
                <div 
                  onClick={() => setReduceTransparency(!reduceTransparency)}
                  className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all cursor-pointer backdrop-blur-md text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                        Solid Background Mode
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Disables backdrop blur for higher visual contrast.
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative inline-flex items-center shrink-0">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={reduceTransparency}
                      onChange={(e) => setReduceTransparency(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 border border-white/10"></div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer - Centered Actions */}
            <div className="p-5 border-t border-white/10 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={resetDefaults}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-mono py-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:shadow-[0_0_35px_rgba(99,102,241,0.6)] hover:-translate-y-0.5"
              >
                <Check className="w-4 h-4" />
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
