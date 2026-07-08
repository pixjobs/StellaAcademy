'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useGame } from '@/lib/store';

// Granular Types
import type { RocketConfig, LaunchTelemetry, LaunchStatus } from '@/types/rocket';

// Physics Module
import { 
  calculateDeltaV, 
  getWetMass, 
  calculateTelemetryFrame, 
  TARGET_DELTAV 
} from '@/lib/physics/rocket';

// Modular UI Components
import MissionControls from '@/components/missions/MissionControls';
import TelemetryMonitor from '@/components/missions/TelemetryMonitor';
import ConsoleLogs from '@/components/missions/ConsoleLogs';
import SocraticQuiz from '@/components/missions/SocraticQuiz';

export default function RocketLabPage() {
  const { addStars, stars, level } = useGame();

  // Assembly State Config
  const [config, setConfig] = useState<RocketConfig>({
    dryMass: 12000,
    fuelMass: 45000,
    isp: 320,
    payloadMass: 500,
  });

  // Launch Simulation State
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);
  const [statusText, setStatusText] = useState<LaunchStatus>('Standby');
  const [log, setLog] = useState<string[]>([]);
  const [simulationSuccess, setSimulationSuccess] = useState<boolean | null>(null);

  // Live telemetry state
  const [telemetry, setTelemetry] = useState<LaunchTelemetry>({
    progress: 0,
    altitude: 0,
    velocity: 0,
    fuelRemaining: 45000,
    thrust: 0,
    acceleration: 0,
  });

  // Calculate Delta-V constraints
  const deltaV = calculateDeltaV(config);
  const totalWetMass = getWetMass(config);
  const isOrbitAchieved = deltaV >= TARGET_DELTAV;

  const appendLog = useCallback((msg: string, time: number) => {
    setLog(prev => [...prev, `[T+${(time / 10).toFixed(1)}s] ${msg}`]);
  }, []);

  const startLaunch = () => {
    setIsLaunching(true);
    setLaunchProgress(0);
    setSimulationSuccess(null);
    setLog([]);
    setTelemetry({
      progress: 0,
      altitude: 0,
      velocity: 0,
      fuelRemaining: config.fuelMass,
      thrust: 0,
      acceleration: 0,
    });
    setStatusText('Ignition Sequence Started...');
  };

  useEffect(() => {
    if (!isLaunching) return;

    if (launchProgress === 0) {
      appendLog("Ignition command received. Cryogenic valves open.", 0);
      appendLog(`Wet Mass: ${totalWetMass.toLocaleString()} kg | Target Delta-V: ${TARGET_DELTAV} m/s`, 0);
    }

    const timer = setTimeout(() => {
      const nextProgress = launchProgress + 2;
      setLaunchProgress(nextProgress);

      // Compute granular telemetry frame using physics library
      const frame = calculateTelemetryFrame(nextProgress, config, deltaV, isOrbitAchieved);
      setTelemetry(frame);

      if (nextProgress === 10) {
        setStatusText('Liftoff!');
        appendLog("Tower cleared. Pitch and roll program initiated.", nextProgress);
      } else if (nextProgress === 30) {
        setStatusText('Passing Max-Q');
        appendLog("Maximum Aerodynamic Pressure (Max-Q) reached. Telemetry nominal.", nextProgress);
      } else if (nextProgress === 60) {
        setStatusText('Main Engine Cutoff (MECO)');
        appendLog("Main Engine Cutoff (MECO). Stage separation confirmed.", nextProgress);
      } else if (nextProgress === 80) {
        setStatusText('Orbit Insertion Burn');
        appendLog("Upper stage engine ignited. Circularizing orbit...", nextProgress);
      } else if (nextProgress >= 100) {
        setIsLaunching(false);
        if (isOrbitAchieved) {
          setStatusText('Orbit Achieved');
          setSimulationSuccess(true);
          appendLog(`✅ Success! Satellite deployed at ${frame.altitude}km orbit. Final Velocity: ${frame.velocity} m/s.`, nextProgress);
          addStars(50);
        } else {
          setStatusText('Sub-orbital / Burn Up');
          setSimulationSuccess(false);
          appendLog(`❌ Failure: Insufficient Delta-V (${deltaV} m/s). Rocket fell back into the atmosphere.`, nextProgress);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isLaunching, launchProgress, appendLog, deltaV, isOrbitAchieved, totalWetMass, config, addStars]);

  const handleCorrectAnswer = (starsReward: number) => {
    addStars(starsReward);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500/30">
      {/* Stars Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Header */}
      <nav className="relative z-10 border-b border-white/5 bg-slate-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            ✨ Stella Academy
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.1)]">
              <span>⭐</span> {stars} Stars
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs font-semibold text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.1)]">
              <span>🛡️</span> Level {level}
            </div>
            <Link href="/missions" className="text-sm text-slate-300 hover:text-white transition-colors ml-2">
              ← Back to Missions
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Grid */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
        
        {/* Left Panel: Physics Configuration */}
        <div className="md:col-span-1">
          <MissionControls
            config={config}
            onChangeConfig={setConfig}
            isLaunching={isLaunching}
            onLaunch={startLaunch}
          />
        </div>

        {/* Center Panel: Simulation Visual & Telemetry */}
        <div className="md:col-span-2 space-y-6">
          <TelemetryMonitor
            telemetry={telemetry}
            status={statusText}
            isLaunching={isLaunching}
            success={simulationSuccess}
          />

          <div className="grid md:grid-cols-2 gap-6">
            <ConsoleLogs logs={log} />
            <SocraticQuiz onCorrectAnswer={handleCorrectAnswer} />
          </div>
        </div>

      </div>
    </main>
  );
}
