'use client';

import { useState, useMemo, useEffect } from 'react';
import { studyModules, type ConceptId } from '@/lib/study-modules';
import StudyModuleCard from '@/components/study/StudyModuleCard';
import VariableHighlighter from '@/components/study/VariableHighlighter';
import ConceptStepper from '@/components/study/ConceptStepper';
import GSAPSimulation from '@/components/GSAPSimulation';
import MathFormula, { RichText } from '@/components/MathFormula';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { ArrowLeft, BookOpen, Search, Sparkles, ChevronDown, Filter } from 'lucide-react';
import Link from 'next/link';

const ACCENT_STYLES = {
  indigo: {
    dot: 'bg-indigo-400',
    badge: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    formulaBadge: 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10',
  },
  amber: {
    dot: 'bg-amber-400',
    badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    formulaBadge: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
  },
  emerald: {
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    formulaBadge: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
  },
  violet: {
    dot: 'bg-violet-400',
    badge: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    formulaBadge: 'border-violet-500/30 text-violet-300 bg-violet-500/10',
  },
  rose: {
    dot: 'bg-rose-400',
    badge: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    formulaBadge: 'border-rose-500/30 text-rose-300 bg-rose-500/10',
  },
  cyan: {
    dot: 'bg-cyan-400',
    badge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    formulaBadge: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10',
  },
} as const;

export default function StudyPage() {
  const [activeModuleId, setActiveModuleId] = useState<ConceptId>(studyModules[0].id);
  const [activeVariable, setActiveVariable] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'interactive' | 'textbook'>('interactive');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [mobileSelectorOpen, setMobileSelectorOpen] = useState(false);

  // Safely fallback if activeModuleId is somehow not in the array (e.g. during fast refresh)
  const activeModule = studyModules.find(m => m.id === activeModuleId) || studyModules[0];
  const activeAccent = ACCENT_STYLES[activeModule.accentColor] || ACCENT_STYLES.indigo;

  // Handle module change
  const handleModuleChange = (id: ConceptId) => {
    setActiveModuleId(id);
    setActiveVariable(null);
    setActiveStep(1);
    setActiveTab('interactive');
    setMobileSelectorOpen(false); // Auto close mobile drawer on select
  };

  // Dynamic Categories extracted from the modules list with counts
  const categories = useMemo(() => {
    const cats = Array.from(new Set(studyModules.map(m => m.category)));
    return ['all', ...cats];
  }, []);

  const getCategoryCount = (cat: string) => {
    if (cat === 'all') return studyModules.length;
    return studyModules.filter(m => m.category === cat).length;
  };

  // Filtered Modules
  const filteredModules = useMemo(() => {
    return studyModules.filter(module => {
      const matchesSearch = 
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        module.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || module.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-[calc(100vh-135px)] bg-transparent text-slate-100 p-4 md:p-6 lg:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-8xl mx-auto space-y-6">
        
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 font-mono">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back
            </Link>
            <h1 className="text-xl md:text-2xl font-fraunces font-bold text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400 shrink-0" />
              Study Hub
            </h1>
          </div>
          <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase hidden md:inline">
            Interactive Classroom Console
          </span>
        </div>

        {/* ── MOBILE MODULE SELECTOR DRAWER ── */}
        <div className="lg:hidden relative z-30">
          <button
            onClick={() => setMobileSelectorOpen(!mobileSelectorOpen)}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-sm font-semibold hover:bg-slate-800/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${activeAccent.dot} animate-pulse`} />
              <span className="text-slate-200">Module: {activeModule.title}</span>
            </div>
            <span className="text-xs text-indigo-400 font-mono flex items-center gap-1">
              Switch Module
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileSelectorOpen ? 'rotate-180' : ''}`} />
            </span>
          </button>
          
          {mobileSelectorOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 p-4 rounded-xl bg-slate-950 border border-white/10 shadow-2xl space-y-4 max-h-[75vh] overflow-y-auto backdrop-blur-xl">
              {/* Search */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 pl-9 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-500 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Category selector row */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`capitalize whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                      activeCategory === category 
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                        : 'bg-slate-900 text-slate-400 border-white/5 hover:text-slate-200'
                    }`}
                  >
                    {category.replace('-', ' ')} ({getCategoryCount(category)})
                  </button>
                ))}
              </div>

              {/* Modules list */}
              <div className="grid sm:grid-cols-2 gap-2">
                {filteredModules.length > 0 ? (
                  filteredModules.map(module => (
                    <button
                      key={module.id}
                      onClick={() => handleModuleChange(module.id as ConceptId)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        activeModule.id === module.id
                          ? 'bg-slate-900 border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                          : 'bg-slate-900/40 border-white/5 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{module.category}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{module.estimatedMinutes}m</span>
                      </div>
                      <h4 className="font-semibold text-xs text-white">{module.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{module.subtitle}</p>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full py-6 text-center text-slate-500 text-xs font-mono">
                    No modules match query.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── SIDEBAR LAYOUT (Desktop & Tablet) ── */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: MODULE DIRECTORY (Desktop Sidebar) */}
          <aside className="hidden lg:flex lg:col-span-3 xl:col-span-3 flex-col gap-4 sticky top-24 max-h-[calc(100vh-160px)]">
            
            {/* Search Box */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl py-2 pl-9 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-white font-bold"
                >
                  ×
                </button>
              )}
            </div>

            {/* Compact Category List */}
            <div className="bg-slate-900/30 border border-white/5 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase tracking-widest px-1">
                <Filter className="w-3.5 h-3.5" />
                Category Filters
              </div>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`capitalize whitespace-nowrap px-2.5 py-1 rounded-lg text-[10px] font-mono transition-colors border ${
                      activeCategory === category 
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-bold' 
                        : 'bg-slate-950/40 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {category.replace('-', ' ')} <span className="opacity-60">({getCategoryCount(category)})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable list of modules */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 max-h-[calc(100vh-320px)] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {filteredModules.length > 0 ? (
                filteredModules.map(module => {
                  const modAccent = ACCENT_STYLES[module.accentColor] || ACCENT_STYLES.indigo;
                  return (
                    <button
                      key={module.id}
                      onClick={() => handleModuleChange(module.id as ConceptId)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col gap-1.5 ${
                        activeModule.id === module.id
                          ? 'bg-slate-900/90 border-indigo-500/50 shadow-[0_4px_16px_rgba(99,102,241,0.12),inset_0_1px_1px_rgba(255,255,255,0.06)]'
                          : 'bg-slate-950/20 border-white/[0.04] hover:bg-slate-900/40 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-wider font-bold border ${modAccent.badge}`}>
                          LVL {module.difficulty}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">{module.estimatedMinutes} min</span>
                      </div>
                      <h3 className="font-semibold text-xs text-slate-100 group-hover:text-white transition-colors truncate w-full">
                        {module.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-light line-clamp-1 w-full leading-normal">
                        {module.subtitle}
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs font-mono">
                  No modules found.
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT COLUMN: MAIN ACTIVE WORKSPACE */}
          <main className="lg:col-span-9 xl:col-span-9 space-y-6">
            
            <div className="grid xl:grid-cols-12 gap-6 items-stretch">
              
              {/* Simulator & Guided Lesson (Left in main workspace, xl:7) */}
              <div className="xl:col-span-7 flex flex-col space-y-6">
                
                {/* Tabs */}
                <div className="flex space-x-2 px-2 border-b border-white/5 pb-2">
                  <button 
                    onClick={() => setActiveTab('interactive')} 
                    className={`pb-2 px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider font-mono transition-colors border-b-2 ${activeTab === 'interactive' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                  >
                    Interactive Lab
                  </button>
                  <button 
                    onClick={() => setActiveTab('textbook')} 
                    className={`pb-2 px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider font-mono transition-colors border-b-2 ${activeTab === 'textbook' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                  >
                    Vetted Theory
                  </button>
                </div>

                {activeTab === 'textbook' ? (
                  <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl textbook-content-wrapper min-h-[400px]">
                    <MarkdownRenderer>
                      {activeModule.textbookContent || "_The Academy Editorial Board is currently vetting the formal theoretical documentation for this module. Please use the Interactive Lab in the meantime._"}
                    </MarkdownRenderer>
                  </div>
                ) : (
                  <>
                    {/* Visualizer card */}
                    <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 md:p-6 backdrop-blur-md shadow-xl flex flex-col justify-between">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${activeAccent.dot} animate-pulse`} />
                          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Simulation Viewport</span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono">{activeModule.title}</span>
                      </div>

                      <div className="h-[400px] md:h-[480px] w-full rounded-xl overflow-hidden border border-white/5 bg-black/40 relative">
                        <GSAPSimulation conceptId={activeModule.id} />
                      </div>
                    </div>

                    {/* Stepper card */}
                    <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 md:p-6 backdrop-blur-md shadow-xl">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-mono text-xs uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-2">
                          <span className="text-indigo-400">01</span> Guided Lesson
                        </h3>
                      </div>
                      <ConceptStepper
                        steps={activeModule.conceptSteps}
                        activeStep={activeStep}
                        onStepChange={setActiveStep}
                        accentColor={activeModule.accentColor}
                        activeVariable={activeVariable}
                      />
                    </div>
                  </>
                )}

              </div>

              {/* Interactive Formula & Worked Example (Right in main workspace, xl:5) */}
              <div className="xl:col-span-5 space-y-6">
                
                <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 md:p-6 backdrop-blur-md shadow-xl xl:sticky xl:top-24 space-y-6">
                  
                  {/* Interactive Formula */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-mono text-xs uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-2">
                        <span className="text-indigo-400">02</span> Interactive Formula
                      </h3>
                      <span className={`text-[8px] uppercase font-mono px-2 py-0.5 rounded border ${activeAccent.formulaBadge}`}>
                        Hover symbols
                      </span>
                    </div>
                    
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 mb-4 overflow-x-auto">
                      <VariableHighlighter
                        formula={activeModule.formula}
                        variables={activeModule.variables}
                        formulaLayout={activeModule.formulaLayout}
                        activeVariable={activeVariable}
                        onVariableChange={setActiveVariable}
                      />
                    </div>
                  </div>

                  {/* Worked Example */}
                  <div className="pt-6 border-t border-white/10">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-slate-400 font-semibold mb-4 flex items-center gap-2">
                      <span className="text-indigo-400">03</span> Worked Practice
                    </h3>
                    
                    <p className="text-xs text-slate-400 italic leading-relaxed mb-4">
                      "{activeModule.realWorldConnection}"
                    </p>

                    <div className="bg-slate-950/60 rounded-xl p-4 border border-white/5 space-y-4">
                      <div className="text-xs font-semibold text-white leading-relaxed">
                        Q: <RichText text={activeModule.solvedExample.problem} />
                      </div>
                      
                      <ul className="space-y-2 text-[11px] text-slate-400 font-mono">
                        {activeModule.solvedExample.steps.map((step, idx) => (
                          <li key={idx} className="flex gap-2.5">
                            <span className="opacity-40 select-none">{idx + 1}.</span>
                            <span className="leading-relaxed"><RichText text={step} /></span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-3 border-t border-white/5 flex gap-2 items-center bg-indigo-500/5 -mx-4 -mb-4 px-4 py-3 rounded-b-xl">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Result:</span>
                        <div className="text-indigo-200 text-xs font-semibold">
                          <MathFormula math={activeModule.solvedExample.resultFormula} block={false} />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </main>

        </div>

      </div>
    </div>
  );
}
