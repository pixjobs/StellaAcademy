'use client';

import type { LaunchTelemetry, LaunchStatus } from '@/types/rocket';

interface TelemetryMonitorProps {
  telemetry: LaunchTelemetry;
  status: LaunchStatus;
  isLaunching: boolean;
  success: boolean | null;
}

export default function TelemetryMonitor({
  telemetry,
  status,
  isLaunching,
  success,
}: TelemetryMonitorProps) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col h-[400px] relative overflow-hidden">
      <h2 className="text-xl font-bold text-cyan-400 z-10 flex items-center gap-2">
        <span>📡</span> Launch Complex Telemetry
      </h2>
      
      {/* Status Bar */}
      <div className="mt-2 px-3 py-1 bg-slate-950/70 border border-white/5 rounded-full text-xs text-slate-300 w-fit z-10">
        Status: <span className={`font-semibold ${success === true ? 'text-emerald-400' : success === false ? 'text-red-400' : 'text-cyan-400'}`}>{status}</span>
      </div>

      {/* Launch Animation Viewport */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Stars Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.05)_1px,_transparent_1px)] bg-[size:32px_32px] opacity-20" />

        {/* LEO Orbit Target Line */}
        {isLaunching && (
          <div className="absolute w-full border-t border-dashed border-cyan-400/40 text-cyan-400/60 text-[10px] text-right pr-4 pt-1" style={{ bottom: '80%' }}>
            Low Earth Orbit (LEO) - 400km
          </div>
        )}

        {/* Animated SVG Rocket */}
        <div 
          className={`absolute transition-all duration-300 ${isLaunching ? 'scale-75' : ''}`}
          style={{
            bottom: isLaunching ? `${Math.min(telemetry.progress * 0.8, 85)}%` : '10%',
            transform: `translateY(50%)`
          }}
        >
          <svg width="40" height="120" viewBox="0 0 40 120" className="drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]">
            {/* Nose Cone */}
            <path d="M20 5 L32 35 L8 35 Z" fill="#e2e8f0" />
            {/* Payload Section */}
            <rect x="10" y="35" width="20" height="15" fill="#94a3b8" />
            {/* Booster Body */}
            <rect x="10" y="50" width="20" height="50" fill="#f8fafc" />
            {/* Stripes */}
            <rect x="10" y="60" width="20" height="4" fill="#6366f1" />
            <rect x="10" y="80" width="20" height="4" fill="#6366f1" />
            {/* Fins */}
            <path d="M10 90 L2 105 L10 105 Z" fill="#475569" />
            <path d="M30 90 L38 105 L30 105 Z" fill="#475569" />
            {/* Engine Nozzle */}
            <rect x="15" y="100" width="10" height="6" fill="#1e293b" />
            
            {/* Plume Animation */}
            {isLaunching && telemetry.progress < 100 && (
              <path 
                d={`M15 106 L20 ${106 + (20 + Math.random() * 20)} L25 106 Z`} 
                fill="url(#fireGradient)"
                className="animate-pulse"
              />
            )}
            
            {/* Definitions */}
            <defs>
              <linearGradient id="fireGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Ground Line */}
        {!isLaunching && telemetry.progress === 0 && (
          <div className="absolute w-full h-[2px] bg-slate-700 bottom-[10%] left-0" />
        )}
      </div>

      {/* Realtime Telemetry readouts */}
      <div className="grid grid-cols-4 gap-2 bg-slate-950/80 border border-white/10 p-4 rounded-xl z-10 backdrop-blur-md">
        <div>
          <span className="text-[9px] text-slate-400 block uppercase font-semibold">Altitude</span>
          <span className="text-md font-bold text-cyan-400">{telemetry.altitude} km</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block uppercase font-semibold">Velocity</span>
          <span className="text-md font-bold text-purple-400">{telemetry.velocity.toLocaleString()} m/s</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block uppercase font-semibold">Acceleration</span>
          <span className="text-md font-bold text-pink-400">{telemetry.acceleration} m/s²</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block uppercase font-semibold">Fuel Load</span>
          <span className="text-md font-bold text-amber-400">{telemetry.fuelRemaining.toLocaleString()} kg</span>
        </div>
      </div>
    </div>
  );
}
