'use client';

import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/track';
import { useReadableLabels } from './useReadableLabels';

// Physical constants (SI).
const R_GAS = 8.31; // molar gas constant, J/(mol K)
const K_B = 1.38e-23; // Boltzmann constant, J/K
const N_A = 6.02e23; // Avogadro constant, per mole

// Stage geometry (SVG units).
const W = 560;
const H = 250;
const X0 = 40; // inside face of the fixed left wall
const TOP = 56;
const BOT = 196;
const PX_PER_LITRE = 8.8; // 50 litres fills 440 units
const PISTON_W = 14;
const DOT_R = 4;
const PER_MOLE = 14; // particles drawn for each mole of gas
const MAX_DOTS = PER_MOLE * 3;
const BASE_SPEED = 90; // drawn speed at 300 K, in SVG units per second

type Particle = { u: number; v: number; dx: number; dy: number };

/** Seeded, so the server and the browser draw the same starting picture. */
function makeParticles(count: number): Particle[] {
  let seed = 20261012;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: count }, () => {
    const angle = rand() * 2 * Math.PI;
    const pace = 0.7 + rand() * 0.6;
    return { u: rand(), v: rand(), dx: Math.cos(angle) * pace, dy: Math.sin(angle) * pace };
  });
}

const START = makeParticles(MAX_DOTS);

// A particle's place is stored as a fraction (0 to 1) of the gas region, so it stays inside when the piston moves.
const dotX = (u: number, volume: number) => X0 + DOT_R + u * (volume * PX_PER_LITRE - 2 * DOT_R);
const dotY = (v: number) => TOP + DOT_R + v * (BOT - TOP - 2 * DOT_R);

function sig3(x: number): string {
  const r = Number(x.toPrecision(3));
  if (r >= 100) return r.toFixed(0);
  return r >= 10 ? r.toFixed(1) : r.toFixed(2);
}

function Readout({ label, value, unit, note }: { label: string; value: string; unit: string; note?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.06] px-3 py-2.5 ring-1 ring-white/10">
      <div className="text-xs text-slate-300">{label}</div>
      <div className="mt-0.5 font-fraunces text-2xl font-semibold leading-none text-white">
        {value} <span className="text-sm font-semibold text-slate-200">{unit}</span>
      </div>
      {note && <div className="mt-1 text-xs leading-tight text-slate-400">{note}</div>}
    </div>
  );
}

function Slider(props: { name: string; shown: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm text-slate-200">
      <span className="flex justify-between gap-3">
        <span>{props.name}</span>
        <span className="text-right font-semibold text-white">{props.shown}</span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="mt-2 w-full cursor-pointer accent-[#f6c453]"
      />
    </label>
  );
}

/**
 * An ideal gas in a cylinder with a piston: particles that speed up with
 * temperature, and readouts that obey pV = nRT as the sliders move.
 */
export default function GasPiston({ placement = 'lesson' }: { placement?: string }) {
  const labelsRef = useReadableLabels();
  const [temperature, setTemperature] = useState(300); // kelvin
  const [volume, setVolume] = useState(25); // litres
  const [amount, setAmount] = useState(1); // moles
  const dotsRef = useRef<SVGGElement>(null);
  const live = useRef({ temperature, volume });
  const touched = useRef(false);

  // The animation loop starts once and reads the latest slider values from here.
  useEffect(() => {
    live.current = { temperature, volume };
  }, [temperature, volume]);

  useEffect(() => {
    const still =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('reduce-motion');
    // With motion reduced, React's own render of the particles at their starting places is the picture.
    if (still) return;
    const sim = START.map((p) => ({ ...p }));
    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const { temperature: T, volume: V } = live.current;
      const speed = BASE_SPEED * Math.sqrt(T / 300);
      const spanX = V * PX_PER_LITRE - 2 * DOT_R;
      const spanY = BOT - TOP - 2 * DOT_R;
      // Only the circles React has drawn are moved, so a change in the amount of gas needs no new loop.
      const circles = dotsRef.current?.children;
      for (let i = 0; circles && i < circles.length; i++) {
        const p = sim[i];
        p.u += (p.dx * speed * dt) / spanX;
        p.v += (p.dy * speed * dt) / spanY;
        if (p.u < 0) { p.u = -p.u; p.dx = Math.abs(p.dx); }
        if (p.u > 1) { p.u = Math.max(0, 2 - p.u); p.dx = -Math.abs(p.dx); }
        if (p.v < 0) { p.v = -p.v; p.dy = Math.abs(p.dy); }
        if (p.v > 1) { p.v = Math.max(0, 2 - p.v); p.dy = -Math.abs(p.dy); }
        circles[i].setAttribute('cx', dotX(p.u, V).toFixed(1));
        circles[i].setAttribute('cy', dotY(p.v).toFixed(1));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const use = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    if (touched.current) return;
    touched.current = true;
    track('gas_model_used', { placement });
  };

  const volumeM3 = volume / 1000;
  const pressure = (amount * R_GAS * temperature) / volumeM3; // pascals
  const pV = pressure * volumeM3; // joules
  const kinetic = 1.5 * K_B * temperature; // joules per molecule
  const molecules = amount * N_A;
  const power = Math.floor(Math.log10(molecules));
  const mantissa = Number((molecules / 10 ** power).toFixed(3));
  const powerText = power === 24 ? '× 10²⁴' : '× 10²³';
  const count = Math.round(amount * PER_MOLE);
  const pistonX = X0 + volume * PX_PER_LITRE;
  const kPa = sig3(pressure / 1000);
  const m3 = volumeM3.toFixed(3);

  return (
    <figure className="night-window overflow-hidden rounded-3xl p-4 shadow-[0_30px_60px_-20px_rgba(11,16,38,0.55)] sm:p-6">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-fraunces text-xl font-semibold text-white">A gas in a cylinder: pressure, volume, temperature</span>
      </figcaption>

      <svg
        ref={labelsRef}
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 w-full rounded-2xl bg-black/25 ring-1 ring-white/10"
        role="img"
        aria-label={`A cylinder seen from the side, holding ${amount.toFixed(1)} moles of gas at ${temperature} kelvin. The piston is set to a volume of ${volume} litres and the pressure is ${kPa} kilopascals.`}
      >
        {/* the gas, then the cylinder walls: open on the right, where the piston rod comes out */}
        <rect x={X0} y={TOP} width={pistonX - X0} height={BOT - TOP} fill="#a5b4fc" fillOpacity="0.1" />
        <path d={`M${W - 40} ${TOP} H${X0} V${BOT} H${W - 40}`} fill="none" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="3" strokeLinejoin="round" />

        <g ref={dotsRef} fill="#5eead4">
          {START.slice(0, count).map((p, i) => (
            <circle key={i} cx={dotX(p.u, volume).toFixed(1)} cy={dotY(p.v).toFixed(1)} r={DOT_R} />
          ))}
        </g>

        {/* the piston and its rod */}
        <line x1={pistonX + PISTON_W} y1={(TOP + BOT) / 2} x2={W - 12} y2={(TOP + BOT) / 2} stroke="#f6c453" strokeWidth="4" strokeLinecap="round" />
        <rect x={pistonX} y={TOP + 2} width={PISTON_W} height={BOT - TOP - 4} rx="2" fill="#f6c453" />
        <text x={pistonX + PISTON_W / 2} y={TOP - 10} fill="#f6c453" fontSize="14" fontWeight="600" textAnchor="middle">
          piston
        </text>
        <text x={X0} y="22" fill="#5eead4" fontSize="14" fontWeight="600">
          gas at {temperature} K, pressure {kPa} kPa
        </text>

        {/* volume: a ruler from the fixed wall to the piston */}
        <g stroke="#c4b5fd" strokeWidth="2.5" strokeLinecap="round">
          <line x1={X0} y1="214" x2={pistonX} y2="214" />
          <line x1={X0} y1="208" x2={X0} y2="220" />
          <line x1={pistonX} y1="208" x2={pistonX} y2="220" />
        </g>
        <text x={X0} y="238" fill="#c4b5fd" fontSize="14" fontWeight="600">
          volume {volume} litres
        </text>
      </svg>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Readout label="Pressure, p" value={kPa} unit="kPa" note="p = nRT ÷ V" />
        <Readout label="p × V" value={sig3(pV)} unit="J" note="changes only with n or T" />
        <Readout label="Average kinetic energy" value={(kinetic / 1e-21).toFixed(2)} unit="× 10⁻²¹ J" note="(3/2)kT for each molecule" />
        <Readout label="Molecules, N" value={String(mantissa)} unit={powerText} note="N = n × 6.02 × 10²³" />
      </div>

      <p className="mt-3 text-sm text-slate-200" aria-live="polite">
        pV = nRT: p × {m3} m³ = {amount.toFixed(1)} mol × {R_GAS} J/(mol K) × {temperature} K, so p = {kPa} kPa. The
        pressure comes from particles hitting the walls: more frequent or harder collisions mean a higher pressure.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Slider name="Temperature, T" shown={`${temperature} K (${temperature - 273} °C)`} min={100} max={600} step={25} value={temperature} onChange={use(setTemperature)} />
        <Slider name="Volume, V" shown={`${volume} litres = ${m3} m³`} min={10} max={50} step={5} value={volume} onChange={use(setVolume)} />
        <Slider name="Amount of gas, n" shown={`${amount.toFixed(1)} mol`} min={0.5} max={3} step={0.5} value={amount} onChange={use(setAmount)} />
      </div>

      <p className="mt-3 text-xs text-slate-400">
        The particles are a picture, not a simulation of real molecular speeds: each dot stands for a vast number of
        molecules, and its speed on screen rises with the square root of the temperature. An ideal gas is assumed. The
        average kinetic energy is proportional to the temperature in kelvin, so it would fall to zero at absolute zero,
        0 K (−273 °C). pV = nRT and pV = NkT are the same equation, since N × k = n × R.
      </p>
    </figure>
  );
}
