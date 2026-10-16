'use client';

import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/track';

// Stage geometry (SVG units) and the physical scale it represents.
const W = 560;
const H = 256;
const MID = 136;
const PX_PER_M = 120;
const SPEED = 2; // wave speed in m/s, held fixed so that wavelength = speed / frequency
const SLOW = 0.25; // the animation runs at quarter speed so crests are easy to follow
const BRACKET_X = 44;

function wavePath(frequency: number, amplitude: number, t: number): string {
  const wavelengthPx = (SPEED / frequency) * PX_PER_M;
  const ampPx = amplitude * PX_PER_M;
  let d = '';
  for (let x = 0; x <= W; x += 4) {
    // A wave travelling to the right: y = A sin(2π(x/λ − ft))
    const y = MID - ampPx * Math.sin(2 * Math.PI * (x / wavelengthPx - frequency * t));
    d += `${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`;
  }
  return d;
}

function Readout({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.06] px-3 py-2.5 ring-1 ring-white/10">
      <div className="text-xs text-slate-300">{label}</div>
      <div className="mt-0.5 font-fraunces text-2xl font-semibold leading-none text-white">{value}</div>
      {note && <div className="mt-1 text-[11px] leading-tight text-slate-400">{note}</div>}
    </div>
  );
}

/**
 * The wave model as an instrument: a bold trace, its wavelength and amplitude
 * marked on the stage, and readouts that obey v = fλ as the sliders move.
 */
/** `bare`: inside a Try it panel that already has its frame (the Explore tab on a quiz lesson). */
export default function WaveInstrument({ placement = 'hero', bare = false }: { placement?: string; bare?: boolean }) {
  const [frequency, setFrequency] = useState(2);
  const [amplitude, setAmplitude] = useState(0.4);
  const pathRef = useRef<SVGPathElement>(null);
  const live = useRef({ frequency, amplitude });
  const touched = useRef(false);

  // The animation loop starts once and reads the latest slider values from here.
  useEffect(() => {
    live.current = { frequency, amplitude };
  }, [frequency, amplitude]);

  useEffect(() => {
    const still =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('reduce-motion');
    // With motion reduced, React's own render of the path (at t = 0) is the picture.
    if (still) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = ((now - start) / 1000) * SLOW;
      pathRef.current?.setAttribute('d', wavePath(live.current.frequency, live.current.amplitude, t));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const onUse = () => {
    if (touched.current) return;
    touched.current = true;
    track('wave_instrument_used', { placement });
  };

  const wavelength = SPEED / frequency;
  const wavelengthPx = wavelength * PX_PER_M;
  const ampPx = amplitude * PX_PER_M;
  const period = 1 / frequency;

  const Frame = bare ? 'div' : 'figure';
  const Caption = bare ? 'p' : 'figcaption';
  return (
    <Frame className={bare ? '' : 'night-window overflow-hidden rounded-3xl p-4 shadow-[0_30px_60px_-20px_rgba(11,16,38,0.55)] sm:p-6'}>
      <Caption className="flex items-baseline justify-between gap-3">
        <span className="font-fraunces text-xl font-semibold text-white">Waves: change one thing, watch the rest</span>
      </Caption>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full rounded-2xl bg-black/25 ring-1 ring-white/10" role="img" aria-label={`A wave of frequency ${frequency} hertz and wavelength ${wavelength.toFixed(2)} metres`}>
        {/* metre grid */}
        {Array.from({ length: Math.floor(W / PX_PER_M) + 1 }, (_, i) => (
          <line key={i} x1={i * PX_PER_M + BRACKET_X} y1="0" x2={i * PX_PER_M + BRACKET_X} y2={H} stroke="#ffffff" strokeOpacity="0.07" />
        ))}
        <line x1="0" y1={MID} x2={W} y2={MID} stroke="#ffffff" strokeOpacity="0.22" strokeDasharray="4 6" />

        {/* the wave */}
        <path
          ref={pathRef}
          d={wavePath(frequency, amplitude, 0)}
          fill="none"
          stroke="#7de3d0"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 7px rgba(125,227,208,0.6))' }}
        />

        {/* wavelength: a fixed ruler the same length as one wave */}
        <g stroke="#f6c453" strokeWidth="2.5" strokeLinecap="round">
          <line x1={BRACKET_X} y1="24" x2={BRACKET_X + wavelengthPx} y2="24" />
          <line x1={BRACKET_X} y1="17" x2={BRACKET_X} y2="31" />
          <line x1={BRACKET_X + wavelengthPx} y1="17" x2={BRACKET_X + wavelengthPx} y2="31" />
        </g>
        <text x={BRACKET_X + wavelengthPx + 10} y="29" fill="#f6c453" fontSize="15" fontWeight="600">
          one wavelength, {wavelength.toFixed(2)} m
        </text>

        {/* amplitude: midline to crest height */}
        <g stroke="#c4b5fd" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1={MID} x2="18" y2={MID - ampPx} />
          <line x1="12" y1={MID - ampPx} x2="24" y2={MID - ampPx} />
        </g>
        <text x="8" y={H - 12} fill="#c4b5fd" fontSize="15" fontWeight="600">
          amplitude {amplitude.toFixed(2)} m
        </text>
      </svg>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Readout label="Frequency, f" value={`${frequency} Hz`} />
        <Readout label="Wavelength, λ" value={`${wavelength.toFixed(2)} m`} />
        <Readout label="Period, T" value={`${period.toFixed(2)} s`} note="T = 1 ÷ f" />
        <Readout label="Wave speed, v" value={`${SPEED} m/s`} note="held fixed" />
      </div>

      <p className="mt-3 text-sm text-slate-200" aria-live="polite">
        v = f × λ: {frequency} Hz × {wavelength.toFixed(2)} m = {(frequency * wavelength).toFixed(2)} m/s. Raise the
        frequency and the wavelength must shrink to keep the speed the same.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-200">
          <span className="flex justify-between">
            <span>Frequency</span>
            <span className="font-semibold text-white">{frequency} Hz</span>
          </span>
          <input
            type="range"
            min={1}
            max={5}
            step={0.5}
            value={frequency}
            onChange={(e) => {
              setFrequency(Number(e.target.value));
              onUse();
            }}
            className="mt-2 w-full cursor-pointer accent-[#f6c453]"
          />
        </label>
        <label className="block text-sm text-slate-200">
          <span className="flex justify-between">
            <span>Amplitude</span>
            <span className="font-semibold text-white">{amplitude.toFixed(2)} m</span>
          </span>
          <input
            type="range"
            min={0.1}
            max={0.7}
            step={0.05}
            value={amplitude}
            onChange={(e) => {
              setAmplitude(Number(e.target.value));
              onUse();
            }}
            className="mt-2 w-full cursor-pointer accent-[#f6c453]"
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-slate-400">The animation runs at a quarter of real speed so you can follow the crests.</p>
    </Frame>
  );
}
