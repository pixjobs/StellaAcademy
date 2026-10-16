'use client';

import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/track';
import { useReadableLabels } from './useReadableLabels';

// Stage geometry (SVG units). The target orbit is always drawn at OUTER_PX, and
// everything else uses the same linear scale, so the picture is to scale.
const W = 560;
const H = 360;
const CX = 280;
const CY = 180;
const OUTER_PX = 150;

const EARTH_RADIUS = 6371; // km
const MU = 3.986e5; // GM for the Earth, km³/s²
const CYCLE = 16; // seconds of animation for one full route, unless the first lap would be too quick
const MIN_FIRST_LAP = 1.2; // seconds: the shortest the lap of the starting orbit may take on screen

const km = (n: number) => Math.round(n).toLocaleString('en-GB');
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Every number in the model, from the two altitudes (km). Speeds in km/s, times in s. */
function transfer(h1: number, h2: number) {
  const r1 = EARTH_RADIUS + h1;
  const r2 = EARTH_RADIUS + h2;
  const a = (r1 + r2) / 2; // semi-major axis of the transfer ellipse
  const circular = (r: number) => Math.sqrt(MU / r); // from GMm/r² = mv²/r
  const onEllipse = (r: number) => Math.sqrt(MU * (2 / r - 1 / a)); // vis-viva
  const period = (r: number) => 2 * Math.PI * Math.sqrt(r ** 3 / MU);
  return {
    r1,
    r2,
    a,
    b: Math.sqrt(r1 * r2), // semi-minor axis
    e: (r2 - r1) / (r2 + r1),
    v1: circular(r1),
    v2: circular(r2),
    burn1: onEllipse(r1) - circular(r1),
    burn2: circular(r2) - onEllipse(r2),
    lap1: period(r1),
    lap2: period(r2),
    time: Math.PI * Math.sqrt(a ** 3 / MU), // half the ellipse's period
    scale: OUTER_PX / r2, // SVG units per km
  };
}

/**
 * Where the spacecraft is drawn after `seconds` of animation: once round the
 * starting orbit, half the ellipse, once round the target orbit. One clock is
 * used for all three stages, so the speeds on screen are in true proportion.
 */
function craftAt(h1: number, h2: number, seconds: number): { x: number; y: number } {
  const o = transfer(h1, h2);
  const total = o.lap1 + o.time + o.lap2;
  const cycle = Math.max(CYCLE, (MIN_FIRST_LAP * total) / o.lap1);
  const t = ((seconds % cycle) / cycle) * total; // real seconds into the route
  let x: number;
  let y: number;
  if (t < o.lap1) {
    const angle = (2 * Math.PI * t) / o.lap1;
    x = o.r1 * Math.cos(angle);
    y = o.r1 * Math.sin(angle);
  } else if (t < o.lap1 + o.time) {
    // Kepler's equation M = E − e sin E, solved by Newton's method. This sweeps
    // out equal areas in equal times, so the craft slows as it climbs.
    const M = (Math.PI * (t - o.lap1)) / o.time;
    let E = M;
    for (let i = 0; i < 6; i++) E -= (E - o.e * Math.sin(E) - M) / (1 - o.e * Math.cos(E));
    x = o.a * (Math.cos(E) - o.e);
    y = o.b * Math.sin(E);
  } else {
    const angle = Math.PI + (2 * Math.PI * (t - o.lap1 - o.time)) / o.lap2;
    x = o.r2 * Math.cos(angle);
    y = o.r2 * Math.sin(angle);
  }
  return { x: CX + x * o.scale, y: CY - y * o.scale };
}

function formatTime(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 120) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

function Readout({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.06] px-3 py-2.5 ring-1 ring-white/10">
      <div className="text-xs text-slate-300">{label}</div>
      <div className="mt-0.5 font-fraunces text-2xl font-semibold leading-none text-white">{value}</div>
      {note && <div className="mt-1 text-xs leading-tight text-slate-400">{note}</div>}
    </div>
  );
}

/**
 * The Hohmann transfer as an instrument: two circular orbits, the ellipse that
 * joins them, and the two burns, with every readout following from v = √(GM/r)
 * and the vis-viva equation.
 */
/** `bare`: inside a Try it panel that already has its frame (the Explore tab on a quiz lesson). */
export default function TransferOrbit({ placement = 'lesson', bare = false }: { placement?: string; bare?: boolean }) {
  const labelsRef = useReadableLabels();
  const [h1, setH1] = useState(300);
  const [h2Wanted, setH2Wanted] = useState(35800);
  // The target must sit at least 1,000 km above the start, on the slider's 200 km steps.
  const minH2 = Math.ceil((h1 + 1000) / 200) * 200;
  const h2 = Math.max(h2Wanted, minH2);
  const craftRef = useRef<SVGCircleElement>(null);
  const live = useRef({ h1, h2 });
  const touched = useRef(false);

  // The animation loop starts once and reads the latest slider values from here.
  useEffect(() => {
    live.current = { h1, h2 };
  }, [h1, h2]);

  useEffect(() => {
    const still =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('reduce-motion');
    // With motion reduced, React's own render (the craft waiting at burn 1) is the picture.
    if (still) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = craftAt(live.current.h1, live.current.h2, (now - start) / 1000);
      craftRef.current?.setAttribute('cx', p.x.toFixed(1));
      craftRef.current?.setAttribute('cy', p.y.toFixed(1));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const onUse = () => {
    if (touched.current) return;
    touched.current = true;
    track('transfer_model_used', { placement });
  };

  const o = transfer(h1, h2);
  const innerPx = o.r1 * o.scale;
  const earthPx = EARTH_RADIUS * o.scale;
  const perigeeX = CX + innerPx;
  const apogeeX = CX - OUTER_PX;
  const rx = (o.a * o.scale).toFixed(1);
  const ry = (o.b * o.scale).toFixed(1);
  // The readouts and the sentence all use these rounded values, so the sums agree.
  const burn1 = round2(o.burn1);
  const burn2 = round2(o.burn2);
  const totalBurn = (burn1 + burn2).toFixed(2);

  const Frame = bare ? 'div' : 'figure';
  const Caption = bare ? 'p' : 'figcaption';
  return (
    <Frame className={bare ? '' : 'night-window overflow-hidden rounded-3xl p-4 shadow-[0_30px_60px_-20px_rgba(11,16,38,0.55)] sm:p-6'}>
      <Caption className="flex items-baseline justify-between gap-3">
        <span className="font-fraunces text-xl font-semibold text-white">Changing orbit: the Hohmann transfer</span>
      </Caption>

      <svg
        ref={labelsRef}
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 w-full rounded-2xl bg-black/25 ring-1 ring-white/10"
        role="img"
        aria-label={`The Earth seen from above, with a circular starting orbit ${km(h1)} kilometres up, a circular target orbit ${km(h2)} kilometres up, and a transfer ellipse that touches both. Burn 1 is where the ellipse touches the starting orbit, and burn 2 is on the opposite side where it touches the target orbit.`}
      >
        {/* the two circular orbits */}
        <circle cx={CX} cy={CY} r={OUTER_PX} fill="none" stroke="#5eead4" strokeWidth="2.5" />
        <circle cx={CX} cy={CY} r={innerPx} fill="none" stroke="#a5b4fc" strokeWidth="2.5" />

        {/* the transfer ellipse, with the Earth at one focus: the half that is flown, then the unused half */}
        <g fill="none" stroke="#f6c453" strokeDasharray="7 6" strokeLinecap="round">
          <path d={`M${perigeeX.toFixed(1)} ${CY}A${rx} ${ry} 0 0 0 ${apogeeX} ${CY}`} strokeWidth="3" />
          <path d={`M${apogeeX} ${CY}A${rx} ${ry} 0 0 0 ${perigeeX.toFixed(1)} ${CY}`} strokeWidth="2" strokeOpacity="0.35" />
        </g>

        <circle cx={CX} cy={CY} r={earthPx} fill="#7dd3fc" fillOpacity="0.4" />
        <text x={CX} y={CY + 5} fill="#ffffff" fontSize="13" fontWeight="600" textAnchor="middle">
          Earth
        </text>

        {/* the two burns */}
        <line x1={perigeeX + 8} y1={CY} x2="446" y2={CY} stroke="#fda4af" strokeOpacity="0.6" strokeWidth="2" />
        <g fill="#fda4af">
          <circle cx={perigeeX} cy={CY} r="5" />
          <circle cx={apogeeX} cy={CY} r="5" />
        </g>
        <g fill="#fda4af" fontSize="14" fontWeight="600">
          <text x="452" y={CY - 3}>
            Burn 1:
          </text>
          <text x="452" y={CY + 14}>
            speed up
          </text>
          <text x={apogeeX - 12} y={CY - 3} textAnchor="end">
            Burn 2:
          </text>
          <text x={apogeeX - 12} y={CY + 14} textAnchor="end">
            speed up
          </text>
        </g>

        {/* key */}
        <g fontSize="13" fontWeight="600">
          <text x="12" y="22" fill="#a5b4fc">
            Starting orbit
          </text>
          <text x="12" y="40" fill="#5eead4">
            Target orbit
          </text>
          <text x="12" y="58" fill="#f6c453">
            Transfer ellipse
          </text>
        </g>

        {/* the spacecraft, drawn at burn 1 until the animation moves it */}
        <circle ref={craftRef} cx={perigeeX.toFixed(1)} cy={CY} r="5.5" fill="#ffffff" stroke="#0b1026" strokeWidth="2" />
      </svg>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Readout label="Speed in starting orbit" value={`${o.v1.toFixed(2)} km/s`} note="v = √(GM ÷ r)" />
        <Readout label="Burn 1, Δv" value={`${burn1.toFixed(2)} km/s`} note="at the lowest point" />
        <Readout label="Burn 2, Δv" value={`${burn2.toFixed(2)} km/s`} note="at the highest point" />
        <Readout label="Time for the transfer" value={formatTime(o.time)} note="half the ellipse's period" />
      </div>

      <p className="mt-3 text-sm text-slate-200" aria-live="polite">
        Semi-major axis a = (r₁ + r₂) ÷ 2 = ({km(o.r1)} + {km(o.r2)}) ÷ 2 = {km(o.a)} km. Total Δv = {burn1.toFixed(2)} +{' '}
        {burn2.toFixed(2)} = {totalBurn} km/s. The spacecraft speeds up twice, yet it ends up moving more slowly, at{' '}
        {o.v2.toFixed(2)} km/s instead of {o.v1.toFixed(2)} km/s, because higher orbits are slower.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-200">
          <span className="flex justify-between">
            <span>Altitude of starting orbit</span>
            <span className="font-semibold text-white">{km(h1)} km</span>
          </span>
          <input
            type="range"
            min={200}
            max={2000}
            step={100}
            value={h1}
            onChange={(e) => {
              setH1(Number(e.target.value));
              onUse();
            }}
            className="mt-2 w-full cursor-pointer accent-[#f6c453]"
          />
        </label>
        <label className="block text-sm text-slate-200">
          <span className="flex justify-between">
            <span>Altitude of target orbit</span>
            <span className="font-semibold text-white">{km(h2)} km</span>
          </span>
          <input
            type="range"
            min={minH2}
            max={35800}
            step={200}
            value={h2}
            onChange={(e) => {
              setH2Wanted(Number(e.target.value));
              onUse();
            }}
            className="mt-2 w-full cursor-pointer accent-[#f6c453]"
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Both orbits are circular and in the same plane, and each burn is treated as instant. Distances are drawn to scale,
        with the target orbit always filling the view, so a low orbit really does hug the Earth. The animation is speeded
        up, but one clock runs the whole route, so the speeds you see are in true proportion. Uses Earth radius 6,371 km
        and GM = 3.986 × 10⁵ km³/s². The target orbit is kept at least 1,000 km above the start.
      </p>
    </Frame>
  );
}
