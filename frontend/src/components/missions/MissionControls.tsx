'use client';

import type { RocketConfig } from '@/types/rocket';
import { calculateDeltaV, getWetMass, getMassRatio, TARGET_DELTAV } from '@/lib/physics/rocket';

interface MissionControlsProps {
  config: RocketConfig;
  onChangeConfig: (newConfig: RocketConfig) => void;
  isLaunching: boolean;
  onLaunch: () => void;
}

export default function MissionControls({
  config,
  onChangeConfig,
  isLaunching,
  onLaunch,
}: MissionControlsProps) {
  const deltaV = calculateDeltaV(config);
  const wetMass = getWetMass(config);
  const R = getMassRatio(config);
  const isOrbitAchieved = deltaV >= TARGET_DELTAV;

  const updateParam = (key: keyof RocketConfig, value: number) => {
    onChangeConfig({
      ...config,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Assembly Panel */}
      <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
        <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
          <span>🛠️</span> Rocket Assembly
        </h2>
        
        <p className="text-xs text-slate-400 mb-6">
          Configure the booster parameters below to optimize the Delta-V for stable orbit insertion.
        </p>

        {/* Parameter: Fuel Mass */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">Fuel Mass</span>
            <span className="font-semibold text-purple-400">{config.fuelMass.toLocaleString()} kg</span>
          </div>
          <input 
            type="range" 
            min={10000} 
            max={80000} 
            step={1000}
            value={config.fuelMass} 
            disabled={isLaunching}
            onChange={(e) => updateParam('fuelMass', Number(e.target.value))}
            className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-2"
          />
          <span className="text-[10px] text-slate-500 block">Heavy fuel increases drag but provides burn duration.</span>
        </div>

        {/* Parameter: Dry Mass */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">Booster Dry Mass</span>
            <span className="font-semibold text-purple-400">{config.dryMass.toLocaleString()} kg</span>
          </div>
          <input 
            type="range" 
            min={4000} 
            max={20000} 
            step={500}
            value={config.dryMass} 
            disabled={isLaunching}
            onChange={(e) => updateParam('dryMass', Number(e.target.value))}
            className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-2"
          />
          <span className="text-[10px] text-slate-500 block">Structure, engines, and shielding. Lighter is better.</span>
        </div>

        {/* Parameter: Specific Impulse */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">Specific Impulse (Isp)</span>
            <span className="font-semibold text-purple-400">{config.isp} seconds</span>
          </div>
          <input 
            type="range" 
            min={260} 
            max={460} 
            step={5}
            value={config.isp} 
            disabled={isLaunching}
            onChange={(e) => updateParam('isp', Number(e.target.value))}
            className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-2"
          />
          <span className="text-[10px] text-slate-500 block">Engine efficiency. Solid fuel ~280s, Hydrolox ~450s.</span>
        </div>

        {/* Readout Specifications */}
        <div className="border-t border-white/5 pt-4 mt-6 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Payload Mass</span>
            <span>{config.payloadMass} kg (Fixed)</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Total Wet Mass</span>
            <span>{wetMass.toLocaleString()} kg</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Mass Ratio (R)</span>
            <span>{R.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Delta-V Budget Gauge */}
      <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
        <h3 className="text-lg font-semibold text-slate-300">Delta-V Budget</h3>
        
        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {deltaV.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 ml-1">m/s</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Target</span>
            <p className="text-sm font-semibold text-emerald-400">{TARGET_DELTAV.toLocaleString()} m/s</p>
          </div>
        </div>

        {/* Budget Bar */}
        <div className="w-full bg-slate-850 h-3 rounded-full overflow-hidden border border-white/5">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${isOrbitAchieved ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-gradient-to-r from-amber-500 to-red-500'}`}
            style={{ width: `${Math.min((deltaV / TARGET_DELTAV) * 100, 100)}%` }}
          />
        </div>

        <div className="text-xs text-slate-400">
          {isOrbitAchieved 
            ? '✅ Orbit capability verified. Launch ready.' 
            : '⚠️ Insufficient Delta-V budget. Increase Isp or add fuel.'
          }
        </div>

        <button 
          onClick={onLaunch}
          disabled={isLaunching}
          className={`w-full py-3 rounded-xl font-bold cursor-pointer transition-all ${
            isLaunching 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-cyan-500 hover:scale-[1.02] shadow-lg shadow-purple-500/20 text-white'
          }`}
        >
          🚀 Launch Rocket
        </button>
      </div>
    </div>
  );
}
