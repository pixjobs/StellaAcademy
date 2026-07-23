'use client';

import { useAccessibility } from '@/lib/store';
import { Settings, X, RotateCcw, Check } from 'lucide-react';
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
        className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors p-2 rounded-md hover:bg-white/10"
        aria-label="Accessibility Settings"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">Settings</span>
      </button>

      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                Accessibility &amp; Display
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Close Settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
              {/* Text Size */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-200">Text Size</label>
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{Math.round(fontSizeScale * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.8" max="2.0" step="0.05"
                  value={fontSizeScale}
                  onChange={(e) => setFontSizeScale(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 font-mono">
                  <span>A (Small)</span>
                  <span>A (Large)</span>
                </div>
              </div>

              {/* Font Family */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-200 block">Font Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'sans', label: 'Default (Sans)' },
                    { id: 'serif', label: 'Serif' },
                    { id: 'mono', label: 'Monospace' },
                    { id: 'dyslexic', label: 'Dyslexia Friendly' },
                  ].map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setFontFamily(font.id as any)}
                      className={`py-2 px-3 text-sm rounded-lg border text-center transition-all ${
                        fontFamily === font.id 
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-4 border-t border-slate-800/80">
                {/* Reduce Motion / Pause Animations */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="pr-4">
                    <div className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">Reduce Motion / Pause Animations</div>
                    <div className="text-xs text-slate-400 mt-0.5">Disables background panning, APOD drift, and pulse effects.</div>
                  </div>
                  <div className="relative inline-flex items-center shrink-0 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={reduceMotion}
                      onChange={(e) => setReduceMotion(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 border border-slate-700"></div>
                  </div>
                </label>

                {/* Reduce Transparency */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="pr-4">
                    <div className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">Reduce Transparency</div>
                    <div className="text-xs text-slate-400 mt-0.5">Improves contrast by making translucent backgrounds solid.</div>
                  </div>
                  <div className="relative inline-flex items-center shrink-0 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={reduceTransparency}
                      onChange={(e) => setReduceTransparency(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 border border-slate-700"></div>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <button
                type="button"
                onClick={resetDefaults}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-mono"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md"
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
