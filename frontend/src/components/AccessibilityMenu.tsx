'use client';

import { useAccessibility, type FontSizePreset, type FontPreset } from '@/lib/store';
import { Settings, X, RotateCcw, Check, Sparkles, Eye } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const FONT_SIZE_OPTIONS: { id: FontSizePreset; label: string; rootPx: string }[] = [
  { id: 'compact', label: 'Compact', rootPx: 'Root 14px' },
  { id: 'default', label: 'Default', rootPx: 'Root 16px' },
  { id: 'comfortable', label: 'Comfortable', rootPx: 'Root 18px' },
  { id: 'large', label: 'Large', rootPx: 'Root 20px' },
];

const TYPEFACE_OPTIONS: { id: FontPreset; label: string; sample: string; fontFamilyStyle: string }[] = [
  { id: 'inclusive', label: 'Inclusive Sans', sample: 'Aa Bb Cc 123', fontFamilyStyle: "'Inclusive Sans', sans-serif" },
  { id: 'system', label: 'System', sample: 'Aa Bb Cc 123', fontFamilyStyle: 'ui-sans-serif, system-ui, sans-serif' },
  { id: 'serif', label: 'Serif', sample: 'Aa Bb Cc 123', fontFamilyStyle: "'Fraunces', Georgia, serif" },
  { id: 'mono', label: 'Mono', sample: 'Aa Bb Cc 123', fontFamilyStyle: 'ui-monospace, monospace' },
];

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { 
    fontSizePreset, 
    fontFamily, 
    reduceTransparency,
    reduceMotion,
    setFontSizePreset, 
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
        <div className="absolute right-0 top-full mt-3 w-[340px] sm:w-[380px] z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          {/* Top Liquid Glass Pointer Arrow */}
          <div className="absolute -top-2 right-5 w-4 h-4 rotate-45 bg-slate-950 border-t border-l border-white/15" />

          {/* Liquid Glass Container Box */}
          <div className="relative rounded-3xl bg-slate-950/95 border border-white/15 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden p-5 text-left">
            {/* Top Shine Accent */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" />

            {/* Header */}
            <div className="flex items-start justify-between pb-3 mb-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold font-fraunces text-white">Display Settings</h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                  Customise font size and typeface. Changes are saved automatically.
                </p>
              </div>

              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 ml-2"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Options Body */}
            <div className="space-y-5">
              
              {/* SECTION 1: Font Size */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300">
                  Font Size
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FONT_SIZE_OPTIONS.map((opt) => {
                    const isSelected = fontSizePreset === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFontSizePreset(opt.id)}
                        className={`p-2.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-400/60 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)] ring-1 ring-indigo-400/30'
                            : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        <div className="text-xs font-semibold">{opt.label}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">{opt.rootPx}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: Typeface */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300">
                  Typeface
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPEFACE_OPTIONS.map((tf) => {
                    const isSelected = fontFamily === tf.id;
                    return (
                      <button
                        key={tf.id}
                        type="button"
                        onClick={() => setFontFamily(tf.id)}
                        className={`p-2.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-400/60 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)] ring-1 ring-indigo-400/30'
                            : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        <div className="text-xs font-semibold">{tf.label}</div>
                        <div 
                          className="text-xs mt-1 text-slate-300"
                          style={{ fontFamily: tf.fontFamilyStyle }}
                        >
                          {tf.sample}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: Toggles */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div 
                  onClick={() => setReduceMotion(!reduceMotion)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-200">Pause Background Motion</span>
                  </div>
                  <input 
                    type="checkbox" 
                    className="accent-indigo-500 cursor-pointer"
                    checked={reduceMotion}
                    onChange={(e) => setReduceMotion(e.target.checked)}
                  />
                </div>

                <div 
                  onClick={() => setReduceTransparency(!reduceTransparency)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-200">Solid Background Mode</span>
                  </div>
                  <input 
                    type="checkbox" 
                    className="accent-cyan-500 cursor-pointer"
                    checked={reduceTransparency}
                    onChange={(e) => setReduceTransparency(e.target.checked)}
                  />
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
