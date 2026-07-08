'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useGame } from '@/lib/store';

// Constant parameters
const PAYLOAD_MASS = 500; // kg (CubeSat payload)
const GRAVITY = 9.81; // m/s^2
const TARGET_DELTAV = 9400; // m/s required for LEO orbit

type QuizQuestion = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Why is it more effective to increase Specific Impulse (Isp) than to simply add more fuel?",
    options: [
      "Fuel adds dead weight (mass ratio), whereas higher Isp increases exhaust velocity directly.",
      "Higher Isp makes the rocket lighter on the launchpad.",
      "Adding fuel increases atmospheric friction exponentially.",
      "Engines with lower Isp burn fuel too slowly to escape gravity."
    ],
    answerIndex: 0,
    explanation: "According to the Tsiolkovsky rocket equation, Delta-V increases linearly with Isp but only logarithmically with the mass ratio (wet mass / dry mass). Adding more fuel increases the wet mass, which requires even more fuel to lift itself!"
  },
  {
    question: "If a rocket's dry mass is 10,000 kg and fuel mass is 30,000 kg, what is its mass ratio (R)?",
    options: [
      "R = 3.0",
      "R = 4.0",
      "R = 1.33",
      "R = 0.25"
    ],
    answerIndex: 1,
    explanation: "Mass ratio (R) is calculated as Total Wet Mass divided by Dry Mass. Wet Mass = Dry Mass (10,000 kg) + Fuel Mass (30,000 kg) = 40,000 kg. R = 40,000 / 10,000 = 4.0."
  },
  {
    question: "What does Specific Impulse (Isp) physically represent?",
    options: [
      "The total payload capacity of the booster.",
      "The thrust produced per unit of propellant flow rate (efficiency).",
      "The aerodynamic coefficient of drag at Max-Q.",
      "The time it takes for a rocket to clear the tower."
    ],
    answerIndex: 1,
    explanation: "Specific Impulse is a measure of engine efficiency. It represents the thrust obtained per unit rate of fuel consumption, measured in seconds."
  }
];

export default function RocketLabPage() {
  const { addStars, stars, level } = useGame();

  // Rocket configuration state
  const [dryMass, setDryMass] = useState(12000); // kg
  const [fuelMass, setFuelMass] = useState(45000); // kg
  const [isp, setIsp] = useState(320); // seconds (kerolox booster)

  // Simulation state
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0); // 0 to 100
  const [altitude, setAltitude] = useState(0); // km
  const [velocity, setVelocity] = useState(0); // m/s
  const [statusText, setStatusText] = useState('Standby');
  const [log, setLog] = useState<string[]>([]);
  const [simulationSuccess, setSimulationSuccess] = useState<boolean | null>(null);

  // Quiz state
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Physics calculations
  const totalWetMass = dryMass + fuelMass + PAYLOAD_MASS;
  const dryTotalMass = dryMass + PAYLOAD_MASS;
  const massRatio = totalWetMass / dryTotalMass;
  const deltaV = Math.round(isp * GRAVITY * Math.log(massRatio));
  const isOrbitAchieved = deltaV >= TARGET_DELTAV;

  const appendLog = useCallback((msg: string, time: number) => {
    setLog(prev => [...prev, `[T+${(time / 10).toFixed(1)}s] ${msg}`]);
  }, []);

  const startLaunch = () => {
    setIsLaunching(true);
    setLaunchProgress(0);
    setAltitude(0);
    setVelocity(0);
    setSimulationSuccess(null);
    setLog([]);
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

      // Realtime telemetry ticks
      const progressFraction = nextProgress / 100;
      
      // Calculate animated telemetry based on physics output
      const currentVel = Math.round(deltaV * progressFraction * (isOrbitAchieved ? 1 : 0.75));
      const currentAlt = Math.round(400 * Math.pow(progressFraction, 2) * (isOrbitAchieved ? 1 : 0.3));

      setVelocity(currentVel);
      setAltitude(currentAlt);

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
          appendLog(`✅ Success! Satellite deployed at ${currentAlt}km orbit. Final Velocity: ${currentVel} m/s.`, nextProgress);
          addStars(50);
        } else {
          setStatusText('Sub-orbital / Burn Up');
          setSimulationSuccess(false);
          appendLog(`❌ Failure: Insufficient Delta-V (${deltaV} m/s). Rocket fell back into the atmosphere.`, nextProgress);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isLaunching, launchProgress, appendLog, deltaV, isOrbitAchieved, totalWetMass, addStars]);

  const handleAnswerSubmit = (index: number) => {
    setSelectedAnswer(index);
    setShowExplanation(true);
    if (index === QUIZ_QUESTIONS[currentQuizIndex].answerIndex) {
      setQuizScore(prev => prev + 1);
      addStars(15);
    }
  };

  const nextQuizQuestion = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    if (currentQuizIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizScore(0);
    setQuizCompleted(false);
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
        <div className="md:col-span-1 space-y-6">
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
                <span className="font-semibold text-purple-400">{fuelMass.toLocaleString()} kg</span>
              </div>
              <input 
                type="range" 
                min={10000} 
                max={80000} 
                step={1000}
                value={fuelMass} 
                disabled={isLaunching}
                onChange={(e) => setFuelMass(Number(e.target.value))}
                className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-2"
              />
              <span className="text-[10px] text-slate-500 block">Heavy fuel increases drag but provides burn duration.</span>
            </div>

            {/* Parameter: Dry Mass */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Booster Dry Mass</span>
                <span className="font-semibold text-purple-400">{dryMass.toLocaleString()} kg</span>
              </div>
              <input 
                type="range" 
                min={4000} 
                max={20000} 
                step={500}
                value={dryMass} 
                disabled={isLaunching}
                onChange={(e) => setDryMass(Number(e.target.value))}
                className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-2"
              />
              <span className="text-[10px] text-slate-500 block">Structure, engines, and shielding. Lighter is better.</span>
            </div>

            {/* Parameter: Specific Impulse */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Specific Impulse (Isp)</span>
                <span className="font-semibold text-purple-400">{isp} seconds</span>
              </div>
              <input 
                type="range" 
                min={260} 
                max={460} 
                step={5}
                value={isp} 
                disabled={isLaunching}
                onChange={(e) => setIsp(Number(e.target.value))}
                className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-2"
              />
              <span className="text-[10px] text-slate-500 block">Engine efficiency. Solid fuel ~280s, Hydrolox ~450s.</span>
            </div>

            {/* Readout Specifications */}
            <div className="border-t border-white/5 pt-4 mt-6 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Payload Mass</span>
                <span>{PAYLOAD_MASS} kg (Fixed)</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Total Wet Mass</span>
                <span>{totalWetMass.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Mass Ratio (R)</span>
                <span>{massRatio.toFixed(2)}</span>
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
              onClick={startLaunch}
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

        {/* Center Panel: Simulation Visual & Telemetry */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Main Visual Board */}
          <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col h-[400px] relative overflow-hidden">
            <h2 className="text-xl font-bold text-cyan-400 z-10 flex items-center gap-2">
              <span>📡</span> Launch Complex Telemetry
            </h2>
            
            {/* Status bar */}
            <div className="mt-2 px-3 py-1 bg-slate-950/70 border border-white/5 rounded-full text-xs text-slate-300 w-fit z-10">
              Status: <span className={`font-semibold ${simulationSuccess === true ? 'text-emerald-400' : simulationSuccess === false ? 'text-red-400' : 'text-cyan-400'}`}>{statusText}</span>
            </div>

            {/* Launch Animation Viewport */}
            <div className="flex-1 flex items-center justify-center relative">
              
              {/* Stars Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.05)_1px,_transparent_1px)] bg-[size:32px_32px] opacity-20" />

              {/* Orbital Target Line */}
              {isLaunching && (
                <div className="absolute w-full border-t border-dashed border-cyan-400/40 text-cyan-400/60 text-[10px] text-right pr-4 pt-1" style={{ bottom: '80%' }}>
                  Low Earth Orbit (LEO) - 400km
                </div>
              )}

              {/* Animated SVG Rocket */}
              <div 
                className={`absolute transition-all duration-300 ${isLaunching ? 'scale-75' : ''}`}
                style={{
                  bottom: isLaunching ? `${Math.min(launchProgress * 0.8, 85)}%` : '10%',
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
                  {isLaunching && launchProgress < 100 && (
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
              {!isLaunching && launchProgress === 0 && (
                <div className="absolute w-full h-[2px] bg-slate-700 bottom-[10%] left-0" />
              )}
            </div>

            {/* Realtime Telemetry Bar */}
            <div className="grid grid-cols-3 gap-4 bg-slate-950/80 border border-white/10 p-4 rounded-xl z-10 backdrop-blur-md">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Altitude</span>
                <span className="text-lg font-bold text-cyan-400">{altitude} km</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Velocity</span>
                <span className="text-lg font-bold text-purple-400">{velocity.toLocaleString()} m/s</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Engine Efficiency</span>
                <span className="text-lg font-bold text-pink-400">{isp}s (Isp)</span>
              </div>
            </div>
          </div>

          {/* Telemetry Logs & Socratic Quiz Box */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Logs Terminal */}
            <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col h-[280px]">
              <h3 className="text-md font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span> Telemetry Logs
              </h3>
              <div className="flex-1 bg-slate-950/80 p-3 rounded-lg overflow-y-auto font-mono text-[10px] text-slate-400 space-y-1">
                {log.length === 0 ? (
                  <span className="text-slate-600 italic">Waiting for launch ignition...</span>
                ) : (
                  log.map((entry, idx) => <div key={idx}>{entry}</div>)
                )}
              </div>
            </div>

            {/* Socratic Quiz Section */}
            <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col justify-between min-h-[280px]">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-md font-semibold text-purple-400 flex items-center gap-1.5">
                    <span>💡</span> Orbital Physics Quiz
                  </h3>
                  <span className="text-xs text-slate-500">Question {currentQuizIndex + 1}/{QUIZ_QUESTIONS.length}</span>
                </div>

                {!quizCompleted ? (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">
                      {QUIZ_QUESTIONS[currentQuizIndex].question}
                    </p>
                    
                    <div className="space-y-2">
                      {QUIZ_QUESTIONS[currentQuizIndex].options.map((opt, i) => (
                        <button
                          key={i}
                          disabled={showExplanation}
                          onClick={() => handleAnswerSubmit(i)}
                          className={`w-full p-2.5 text-left text-xs rounded-lg border transition-all cursor-pointer ${
                            selectedAnswer === i
                              ? i === QUIZ_QUESTIONS[currentQuizIndex].answerIndex
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                                : 'bg-red-500/10 border-red-500 text-red-300'
                              : showExplanation && i === QUIZ_QUESTIONS[currentQuizIndex].answerIndex
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                              : 'bg-slate-950/40 border-white/5 text-slate-300 hover:border-white/10 hover:bg-slate-950/70'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    {showExplanation && (
                      <div className="p-3 bg-slate-950/60 border-l-2 border-purple-500 rounded text-[10px] text-slate-400 leading-relaxed">
                        {QUIZ_QUESTIONS[currentQuizIndex].explanation}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <span className="text-4xl block">🏆</span>
                    <h4 className="text-md font-bold text-white">Quiz Completed!</h4>
                    <p className="text-xs text-slate-400">
                      You scored <span className="font-bold text-purple-400">{quizScore}</span> out of {QUIZ_QUESTIONS.length} correct.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2 border-t border-white/5 flex justify-end">
                {!quizCompleted ? (
                  showExplanation && (
                    <button 
                      onClick={nextQuizQuestion}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-all font-semibold"
                    >
                      {currentQuizIndex < QUIZ_QUESTIONS.length - 1 ? 'Next Question →' : 'Finish Quiz'}
                    </button>
                  )
                ) : (
                  <button 
                    onClick={resetQuiz}
                    className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition-all font-semibold"
                  >
                    Reset Quiz
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}
