'use client';

import { useAccessibility } from '@/lib/store';
import { Settings, X, RotateCcw, Check, Sparkles, Type, Eye } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close on Escape key or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      {/* Trigger Button inside Navigation Bar */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all duration-200 ${
          isOpen
            ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.25)] font-semibold'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
        aria-label="Display Settings"
      >
        <Settings className={`w-3.5 h-3.5 ${isOpen ? 'text-indigo-300 rotate-45' : 'text-slate-400'} transition-transform duration-300`} />
        <span>Display</span>
      </button>

      {/* Popover Dropdown aligned to Menu Button */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-[330px] sm:w-[370px] z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          {/* Top Liquid Glass Pointer Arrow */}
          <div className="absolute -top-2 right-5 w-4 h-4 rotate-45 bg-slate-950 border-t border-l border-white/15" />

          {/* Liquid Glass Container Box */}
          <div className="relative rounded-3xl bg-slate-950/90 border border-white/15 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden p-5 text-center">
            {/* Top Shine Accent */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold font-fraunces text-white">Display Settings</h3>
              </div>

              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {/* Text Sizing */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 space-y-2.5 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                    <Type className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Text Scale</span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 font-bold">
                    {Math.round(fontSizeScale * 100)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0.8" max="2.0" step="0.05"
                  value={fontSizeScale}
                  onChange={(e) => setFontSizeScale(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg border border-white/10"
                />
              </div>

              {/* Font Style */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 space-y-2 text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>Typography</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'sans', label: 'Sans' },
                    { id: 'serif', label: 'Serif' },
                    { id: 'mono', label: 'Mono' },
                    { id: 'dyslexic', label: 'Dyslexic' },
                  ].map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => setFontFamily(font.id as any)}
                      className={`py-1.5 px-2 text-xs rounded-xl border text-center font-medium transition-all ${
                        fontFamily === font.id 
                          ? 'bg-indigo-500/20 border-indigo-400/60 text-indigo-200 font-semibold shadow-sm' 
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                      }`}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 text-left">
                {/* Pause Motion */}
                <div 
                  onClick={() => setReduceMotion(!reduceMotion)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Pause Motion</div>
                      <div className="text-[10px] text-slate-400">Stops APOD drift</div>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center shrink-0">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={reduceMotion}
                      onChange={(e) => setReduceMotion(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500 border border-white/10"></div>
                  </div>
                </div>

                {/* Solid Mode */}
                <div 
                  onClick={() => setReduceTransparency(!reduceTransparency)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Solid Mode</div>
                      <div className="text-[10px] text-slate-400 font-mono">Disables backdrop blur</div>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center shrink-0">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={reduceTransparency}
                      onChange={(e) => setReduceTransparency(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 border border-white/10"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={resetDefaults}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 font-mono transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
