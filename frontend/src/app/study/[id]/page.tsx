'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import GSAPSimulation from '@/components/GSAPSimulation';
import MathFormula, { RichText } from '@/components/MathFormula';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import VariableHighlighter from '@/components/study/VariableHighlighter';
import { studyModules, type ConceptId } from '@/lib/study-modules';

export default function StudyModulePage({ params }: { params: Promise<{ id: ConceptId }> }) {
  const resolvedParams = use(params);
  const currentSub = studyModules.find(m => m.id === resolvedParams.id);
  const [mounted, setMounted] = useState(false);

  // Interactive Sliders State
  const [mass, setMass] = useState(1);                     // Gravity: 1 to 4
  const [refractiveIndex, setRefractiveIndex] = useState(1.5); // Prism: 1 to 2.5
  const [gearRatio, setGearRatio] = useState(2);           // Gears: 1 to 3
  const [deltaV, setDeltaV] = useState(1);                 // Trajectory: 1 to 2.5
  const [resistance, setResistance] = useState(150);       // Circuit: 10 to 1000
  const [frequency, setFrequency] = useState(2);           // Waves: 1 to 5
  const [amplitude, setAmplitude] = useState(35);           // Waves: 10 to 60
  
  // Interactive Formula State
  const [activeVariable, setActiveVariable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'interactive' | 'textbook'>('interactive');
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // Calibration checklist states
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    sensorGrid: false,
    receiverAlign: false,
    coordsSync: false,
  });

  const toggleCheck = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!currentSub) {
    return <div className="text-white p-20 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-4xl font-bold font-fraunces mb-4">Module Not Found</h1>
        <Link href="/" className="text-purple-400 hover:text-purple-300 underline underline-offset-4">Return to Dashboard</Link>
    </div>;
  }

  // Dynamic Theme Styling depending on the selected curriculum category
  const getThemeStyles = () => {
    switch (currentSub.category) {
      case 'mechanics':
        return {
          textAccent: 'text-amber-400',
          borderAccent: 'border-amber-500/30',
          bgAccent: 'bg-amber-500/10',
          activeBtnClass: 'bg-amber-600/20 border-amber-400 text-amber-300',
        };
      case 'electronics':
        return {
          textAccent: 'text-emerald-400',
          borderAccent: 'border-emerald-500/30',
          bgAccent: 'bg-emerald-500/10',
          activeBtnClass: 'bg-emerald-600/20 border-emerald-400 text-emerald-300',
        };
      case 'mathematics':
        return {
          textAccent: 'text-rose-400',
          borderAccent: 'border-rose-500/30',
          bgAccent: 'bg-rose-500/10',
          activeBtnClass: 'bg-rose-600/20 border-rose-400 text-rose-300',
        };
      case 'physics':
      default:
        return {
          textAccent: 'text-indigo-400',
          borderAccent: 'border-indigo-500/30',
          bgAccent: 'bg-indigo-500/10',
          activeBtnClass: 'bg-indigo-600/20 border-indigo-400 text-indigo-300',
        };
    }
  };

  const { textAccent, borderAccent, bgAccent, activeBtnClass } = getThemeStyles();

  return (
    <div
      className="relative min-h-[calc(100vh-135px)] text-slate-100 font-hanken overflow-hidden bg-transparent flex flex-col pt-0 pb-12"
    >
      <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(18,24,38,0)_95%,rgba(168,85,247,0.012)_95%),linear-gradient(90deg,rgba(18,24,38,0)_95%,rgba(168,85,247,0.012)_95%)] bg-[size:30px_30px]" />

      <section className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 flex-1 flex flex-col justify-start">
        
        {/* Navigation Breadcrumb */}
        <div className="mt-6 mb-4 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-slate-400 hover:text-white font-mono text-xs uppercase tracking-widest transition-colors">
                &larr; Back to Dashboard
              </Link>
            </div>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
              {currentSub.category} Module
            </span>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-stretch mt-3 md:mt-5">
          
          {/* COLUMN 1 (Center, lg:7): INTERACTIVE VISUALISER & CONCEPT DIRECTIVE */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Tabs */}
            <div className="flex space-x-2 mb-4 px-2">
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

            <div className="bg-slate-950/70 border border-white/10 rounded-xl p-5 sm:p-8 backdrop-blur-md flex-1 flex flex-col justify-between space-y-6 font-sans">
              
              {activeTab === 'textbook' ? (
                <div className="textbook-content-wrapper">
                  <MarkdownRenderer>
                    {currentSub.textbookContent || "_The Academy Editorial Board is currently vetting the formal theoretical documentation for this module. Please use the Interactive Lab in the meantime._"}
                  </MarkdownRenderer>
                </div>
              ) : (
                <>
                  {/* GSAP Visualiser */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${textAccent} bg-current animate-pulse`} />
                        <span className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Interactive Simulation Screen</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">SYS_OK</span>
                    </div>

                    <div className="h-[400px] md:h-[500px] w-full font-sans">
                      <GSAPSimulation
                        conceptId={currentSub.id}
                        mass={mass}
                        refractiveIndex={refractiveIndex}
                        gearRatio={gearRatio}
                        deltaV={deltaV}
                        resistance={resistance}
                        frequency={frequency}
                        amplitude={amplitude}
                      />
                    </div>
                  </div>

                  {/* Concept Lesson */}
                  <div className="border-t border-white/10 pt-6 flex-1 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs uppercase font-mono tracking-wider ${textAccent}`}>
                        Lesson Directive // {currentSub.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">REF_CORE</span>
                    </div>

                    <div className="space-y-5">
                      <h3 className="text-xl font-bold text-white font-fraunces">{currentSub.conceptSteps[0].title}</h3>
                      
                      {/* Dynamic Beautiful LaTeX Formula Block */}
                      <VariableHighlighter
                        formula={currentSub.formula}
                        variables={currentSub.variables}
                        formulaLayout={currentSub.formulaLayout}
                        activeVariable={activeVariable}
                        onVariableChange={setActiveVariable}
                      />

                      <div className="space-y-6 text-sm text-slate-300 leading-relaxed pr-2 font-sans font-light">
                        {currentSub.conceptSteps.map((step, index) => (
                          <div key={index} className="space-y-3">
                            {index > 0 && <h4 className="font-bold text-white mt-4">{step.title}</h4>}
                            <p><RichText text={step.content} /></p>
                            <div className={`p-4 rounded-md ${bgAccent} border ${borderAccent} text-xs font-mono mt-2`}>
                                <span className="font-bold opacity-75 mr-2">INSIGHT:</span> {step.keyInsight}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* COLUMN 2 (Right, lg:5): DYNAMIC INTERACTIVE TELEMETRY CONTROL PANEL & EXAMPLES */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Mobile accordion toggle */}
            <button
              className="lg:hidden flex items-center justify-between w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-white/10 text-sm font-mono text-slate-300"
              onClick={() => setRightPanelOpen(o => !o)}
            >
              <span>Worked Example &amp; Controls</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${rightPanelOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`lg:block ${rightPanelOpen ? 'block' : 'hidden'}`}>
            <div className="bg-slate-950/70 border border-white/10 rounded-xl p-5 sm:p-6 backdrop-blur-md flex flex-col space-y-6 lg:sticky lg:top-24">
              
              {/* Controls Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${textAccent} font-bold animate-pulse`}>●</span>
                  <span className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Telemetry Control Console</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">CAL_SYS</span>
              </div>

              {/* Dynamic Interactive Sliders */}
              <div className="space-y-5">
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase block">Adjust Simulator Parameters</span>
                
                {/* 1. Gravity Concept Sliders */}
                {currentSub.id === 'gravity' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Attractor Mass:</span>
                        <span className={`${textAccent} font-bold`}>{mass}x Earth</span>
                      </div>
                      <input type="range" min="1" max="4" step="0.5" value={mass} onChange={(e) => setMass(Number(e.target.value))} className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg appearance-none"/>
                    </div>
                  </div>
                )}
                {currentSub.id === 'prism' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Refractive Index:</span>
                        <span className={`${textAccent} font-bold`}>n = {refractiveIndex.toFixed(2)}</span>
                      </div>
                      <input type="range" min="1.0" max="2.5" step="0.1" value={refractiveIndex} onChange={(e) => setRefractiveIndex(Number(e.target.value))} className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg appearance-none"/>
                    </div>
                  </div>
                )}
                {currentSub.id === 'gears' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Gear Teeth Ratio:</span>
                        <span className={`${textAccent} font-bold`}>{gearRatio}:1 Ratio</span>
                      </div>
                      <input type="range" min="1" max="3" step="1" value={gearRatio} onChange={(e) => setGearRatio(Number(e.target.value))} className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg appearance-none"/>
                    </div>
                  </div>
                )}
                {currentSub.id === 'trajectory' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Transfer Delta-V:</span>
                        <span className={`${textAccent} font-bold`}>{deltaV.toFixed(2)} km/s</span>
                      </div>
                      <input type="range" min="1.0" max="2.5" step="0.1" value={deltaV} onChange={(e) => setDeltaV(Number(e.target.value))} className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg appearance-none"/>
                    </div>
                  </div>
                )}
                {currentSub.id === 'circuit' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Resistor Value:</span>
                        <span className={`${textAccent} font-bold`}>{resistance} Ω</span>
                      </div>
                      <input type="range" min="50" max="1000" step="50" value={resistance} onChange={(e) => setResistance(Number(e.target.value))} className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg appearance-none"/>
                    </div>
                  </div>
                )}
                {currentSub.id === 'waves' && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">Frequency:</span>
                          <span className={`${textAccent} font-bold`}>{frequency} Hz</span>
                        </div>
                        <input type="range" min="1" max="5" step="1" value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg appearance-none"/>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">Amplitude:</span>
                          <span className={`${textAccent} font-bold`}>{amplitude} px</span>
                        </div>
                        <input type="range" min="10" max="60" step="5" value={amplitude} onChange={(e) => setAmplitude(Number(e.target.value))} className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg appearance-none"/>
                      </div>
                    </div>
                  </div>
                )}
                {['fractions', 'trigonometry', 'calculus'].includes(currentSub.id) && (
                    <div className="text-xs text-slate-500 italic py-2">Simulation telemetry controls are currently offline for theoretical mathematics.</div>
                )}
              </div>

              {/* Static Tried and Tested Solved Syllabus Example */}
              <div className="border-t border-white/10 pt-4 space-y-4">
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase block mb-2">
                  Syllabus Worked Example
                </span>
                
                <div className="bg-slate-900/50 border border-white/5 rounded-lg p-5 space-y-4 text-xs font-mono text-slate-300">
                  <div className="text-white font-bold leading-normal font-sans text-sm">
                    Q: <RichText text={currentSub.solvedExample.problem} />
                  </div>
                  <div className="space-y-3 text-slate-400 text-xs leading-relaxed flex flex-col pt-2">
                    {currentSub.solvedExample.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className="opacity-50 mt-0.5">{idx + 1}.</span>
                        <span><RichText text={step} /></span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/5 pt-4 mt-2 flex flex-wrap gap-3 items-center bg-slate-950/50 -mx-5 -mb-5 px-5 py-4 rounded-b-lg">
                    <span className="text-slate-400 font-bold">Result:</span>
                    <MathFormula math={currentSub.solvedExample.resultFormula} />
                  </div>
                </div>
              </div>

            </div>
            </div>{/* end mobile accordion wrapper */}
          </div>

        </div>
      </section>
    </div>
  );
}
