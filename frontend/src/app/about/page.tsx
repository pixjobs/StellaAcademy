'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrainCircuit, Telescope, Compass, Cpu } from 'lucide-react';

interface ApodData {
  bgUrl: string | null;
  title?: string;
}

export default function AboutPage() {
  const [mounted, setMounted] = useState(false);
  const [systemTime, setSystemTime] = useState('');

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setSystemTime(new Date().toISOString().slice(11, 19));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative min-h-[calc(100vh-135px)] text-slate-100 font-hanken overflow-hidden bg-transparent flex flex-col pt-4 pb-12"
    >
      {/* Decorative Grid Scanlines */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,24,38,0)_95%,rgba(168,85,247,0.015)_95%),linear-gradient(90deg,rgba(18,24,38,0)_95%,rgba(168,85,247,0.015)_95%)] bg-[size:30px_30px] z-0" />

      {/* Content Overlay */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 w-full space-y-6 mt-4">
        
        {/* HERO TITLE */}
        <div className="text-center space-y-3">
          <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase block">
            Academy Manual // Core Directives
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-wider font-fraunces text-white">
            Academy Manual
          </h1>
          <p className="text-xs text-slate-400 max-w-lg mx-auto font-mono uppercase tracking-wide">
            Interactive, high-fidelity space sciences and telemetry simulations.
          </p>
        </div>

        {/* MISSION & VISION SECTIONS */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Mission Card */}
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-400/20 hover:border-slate-300/50 hover:bg-slate-800/40 rounded-xl p-6 transition-all shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                  <Compass className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold font-fraunces text-white">Our Mission</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Our objective is to deliver interactive, textbook-grade space science coursework. We replace black-box AI generators and chat interfaces with stable, verified physical formulas, solved calculation steps, and real-time simulator controls.
              </p>
            </div>
            <div className="text-[9px] text-slate-500 font-mono">STATUS: UPLINK_ACTIVE</div>
          </div>

          {/* Vision Card */}
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-400/20 hover:border-slate-300/50 hover:bg-slate-800/40 rounded-xl p-6 transition-all shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                  <Cpu className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold font-fraunces text-white">Our Method</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                We believe in visual, hands-on calibration. By providing direct parameter controls (like mass, refractive index, and resistor loop values) alongside dynamic GSAP visualisations, we allow students to test physical laws experimentally and observe the mathematical results instantly.
              </p>
            </div>
            <div className="text-[9px] text-slate-500 font-mono">STATUS: CALIBRATION_ONLINE</div>
          </div>

        </div>

        {/* CORE PLATFORM ARCHITECTURE */}
        <div className="bg-slate-900/30 backdrop-blur-md border border-slate-400/20 rounded-xl p-6 space-y-6 shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <div className="border-b border-white/10 pb-3 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Astrometrics System Specifications</span>
            <span className="text-[9px] text-slate-500 font-mono">Ver: 4.2.0</span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Tech 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white font-fraunces">Math Typesetting</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                The platform integrates LaTeX formatting and KaTeX compilers to present textbook-accurate math models. All equations, calculations, and results are parsed locally, providing a clean, high-fidelity presentation.
              </p>
            </div>

            {/* Tech 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Telescope className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white font-fraunces">Attributed NASA Vault</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                Direct connection to NASA's astronomical archives. The Space Gallery allows students to query NASA's public repositories, inspect high-res image data, and follow direct backlinks back to NASA's details portal.
              </p>
            </div>

          </div>
        </div>

        {/* RETURN BUTTON */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/30 backdrop-blur-md border border-slate-400/20 rounded-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <div className="space-y-1 text-center sm:text-left font-mono text-[9px] text-slate-500 uppercase">
            <h4 className="text-sm font-bold text-white font-fraunces normal-case">Calibration Complete?</h4>
            <p>Return to the main console to explore active curriculum nodes.</p>
          </div>
          <Link
            href="/"
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:scale-[1.02] active:scale-[0.98] text-white text-xs font-mono rounded tracking-wider transition-all shadow-md font-semibold"
          >
            Return to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
