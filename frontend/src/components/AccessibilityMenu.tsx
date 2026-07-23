'use client';

import { useAccessibility } from '@/lib/store';
import { Settings, X } from 'lucide-react';
import { useState } from 'react';

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    fontSizeScale, 
    fontFamily, 
    reduceTransparency, 
    setFontSizeScale, 
    setFontFamily, 
    setReduceTransparency 
  } = useAccessibility();

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/50">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                Accessibility & Display
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Text Size */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-300">Text Size</label>
                  <span className="text-xs font-mono text-indigo-400">{Math.round(fontSizeScale * 100)}%</span>
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
                <label className="text-sm font-semibold text-slate-300 block">Font Style</label>
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
                      className={`py-2 px-3 text-sm rounded-md border text-center transition-colors ${
                        fontFamily === font.id 
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transparency */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <div className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">Reduce Transparency</div>
                    <div className="text-xs text-slate-500 mt-0.5">Improves contrast by making backgrounds solid.</div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={reduceTransparency}
                      onChange={(e) => setReduceTransparency(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </div>
                </label>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
