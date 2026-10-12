'use client';

import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/track';

// Stage geometry (SVG units). Both layouts share the same outer loop of wire.
const W = 560;
const H = 300;
const LEFT = 70;
const RIGHT = 490;
const TOP = 60;
const BOTTOM = 240;
const MIDX = 280; // the middle branch in the parallel layout
const MIDY = 150;
const PX_PER_AMP = 36; // dot speed in SVG units per second for each amp of current
const DOT_GAP = 30;
const WIRE = '#cbd5e1';
const C1 = '#a5b4fc';
const C2 = '#5eead4';

type Layout = 'series' | 'parallel';
type Point = [number, number];
type Segment = { pts: Point[]; len: number; n: number };

function segment(pts: Point[]): Segment {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
  return { pts, len, n: Math.round(len / DOT_GAP) };
}

// Each stretch of wire runs in the direction of conventional current (out of the + terminal).
const SEGMENTS: Record<Layout, Segment[]> = {
  series: [segment([[LEFT, BOTTOM], [LEFT, TOP], [RIGHT, TOP], [RIGHT, BOTTOM], [LEFT, BOTTOM]])],
  parallel: [
    segment([[MIDX, BOTTOM], [LEFT, BOTTOM], [LEFT, TOP], [MIDX, TOP]]), // through the battery: total current
    segment([[MIDX, TOP], [MIDX, BOTTOM]]), // branch with R1
    segment([[MIDX, TOP], [RIGHT, TOP], [RIGHT, BOTTOM], [MIDX, BOTTOM]]), // branch with R2
  ],
};

function pointAt(pts: Point[], distance: number): Point {
  let d = distance;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const l = Math.abs(x1 - x0) + Math.abs(y1 - y0);
    if (d <= l) return [x0 + ((x1 - x0) * d) / l, y0 + ((y1 - y0) * d) / l];
    d -= l;
  }
  return pts[pts.length - 1];
}

// Two decimal places, dropping trailing zeros: 6, 4.5, 2.67.
const num = (x: number) => String(Number(x.toFixed(2)));
// Amps to two decimal places; a third is kept below 1 A when it is not zero (0.094 A).
const amps = (x: number) => (x >= 1 || x.toFixed(3).endsWith('0') ? x.toFixed(2) : x.toFixed(3));

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
 * Two resistors and a battery, wired in series or in parallel. Dots drift round
 * the wires at a speed in proportion to the current, and every label obeys V = IR.
 */
export default function CircuitBoard({ placement = 'lesson' }: { placement?: string }) {
  const [layout, setLayout] = useState<Layout>('series');
  const [voltage, setVoltage] = useState(6);
  const [r1, setR1] = useState(4);
  const [r2, setR2] = useState(8);
  const dotsRef = useRef<SVGGElement>(null);
  const touched = useRef(false);

  const series = layout === 'series';
  // Series: one current, shared p.d. Parallel: one p.d., shared current.
  const i1 = series ? voltage / (r1 + r2) : voltage / r1;
  const i2 = series ? i1 : voltage / r2;
  const total = series ? i1 : i1 + i2;
  const resistance = voltage / total;
  const v1 = i1 * r1;
  const v2 = i2 * r2;

  const live = useRef({ layout, currents: [total, i1, i2] });
  // The animation loop starts once and reads the latest values from here.
  useEffect(() => {
    live.current = { layout, currents: [total, i1, i2] };
  }, [layout, total, i1, i2]);

  useEffect(() => {
    const still =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('reduce-motion');
    // With motion reduced, React's own render of the dots is the picture.
    if (still) return;
    let frame = 0;
    let last = performance.now();
    const phases = [0, 0, 0];
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const dots = dotsRef.current?.children;
      let i = 0;
      SEGMENTS[live.current.layout].forEach((s, j) => {
        const gap = s.len / s.n;
        phases[j] = (phases[j] + PX_PER_AMP * live.current.currents[j] * dt) % gap;
        for (let k = 0; k < s.n; k++) {
          const [x, y] = pointAt(s.pts, k * gap + phases[j]);
          const dot = dots?.[i++];
          dot?.setAttribute('cx', x.toFixed(1));
          dot?.setAttribute('cy', y.toFixed(1));
        }
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const onUse = () => {
    if (touched.current) return;
    touched.current = true;
    track('circuit_model_used', { placement });
  };

  const dots = SEGMENTS[layout].flatMap((s) => Array.from({ length: s.n }, (_, k) => pointAt(s.pts, (k * s.len) / s.n)));
  const arrowX = series ? MIDX : (LEFT + MIDX) / 2;
  const resistors = [
    { name: 'R₁', r: r1, i: i1, v: v1, colour: C1, x: series ? 200 : MIDX, y: series ? TOP : MIDY },
    { name: 'R₂', r: r2, i: i2, v: v2, colour: C2, x: series ? 360 : RIGHT, y: series ? TOP : MIDY },
  ];
  const sliders = [
    { name: 'Battery potential difference', value: voltage, set: setVoltage, min: 1.5, max: 12, step: 1.5, unit: 'V' },
    { name: 'Resistor R₁', value: r1, set: setR1, min: 2, max: 20, step: 1, unit: 'Ω' },
    { name: 'Resistor R₂', value: r2, set: setR2, min: 2, max: 20, step: 1, unit: 'Ω' },
  ];
  const describe = series
    ? `Series circuit: a ${num(voltage)} volt battery with resistors of ${r1} and ${r2} ohms in one loop. Total resistance ${num(resistance)} ohms, current ${amps(total)} amps, ${num(v1)} volts across R1 and ${num(v2)} volts across R2.`
    : `Parallel circuit: a ${num(voltage)} volt battery with resistors of ${r1} and ${r2} ohms on separate branches. ${amps(i1)} amps through R1, ${amps(i2)} amps through R2, ${amps(total)} amps from the battery, total resistance ${num(resistance)} ohms.`;

  return (
    <figure className="night-window overflow-hidden rounded-3xl p-4 shadow-[0_30px_60px_-20px_rgba(11,16,38,0.55)] sm:p-6">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-fraunces text-xl font-semibold text-white">Circuits: series and parallel</span>
      </figcaption>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full rounded-2xl bg-black/25 ring-1 ring-white/10" role="img" aria-label={describe}>
        {/* wires: the outer loop, broken at the battery, plus the middle branch in parallel */}
        <g fill="none" stroke={WIRE} strokeWidth="2.5" strokeLinejoin="round">
          <path d={`M${LEFT} 170V${BOTTOM}H${RIGHT}V${TOP}H${LEFT}V140`} />
          {!series && <line x1={MIDX} y1={TOP} x2={MIDX} y2={BOTTOM} />}
        </g>
        {!series && (
          <g fill={WIRE}>
            <circle cx={MIDX} cy={TOP} r="4.5" />
            <circle cx={MIDX} cy={BOTTOM} r="4.5" />
          </g>
        )}

        {/* moving charge: speed in proportion to the current in that wire */}
        <g ref={dotsRef} fill="#f6c453">
          {dots.map(([x, y], k) => (
            <circle key={`${layout}-${k}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r="3.5" />
          ))}
        </g>

        {/* battery: two cells, the long line of each is the positive side */}
        <g stroke="#7dd3fc" strokeLinecap="round">
          <line x1={LEFT - 16} y1="140" x2={LEFT + 16} y2="140" strokeWidth="2.5" />
          <line x1={LEFT - 8} y1="150" x2={LEFT + 8} y2="150" strokeWidth="4" />
          <line x1={LEFT - 16} y1="160" x2={LEFT + 16} y2="160" strokeWidth="2.5" />
          <line x1={LEFT - 8} y1="170" x2={LEFT + 8} y2="170" strokeWidth="4" />
        </g>
        <g fill="#7dd3fc" fontSize="15" fontWeight="600">
          <text x={LEFT - 34} y="138">+</text>
          <text x={LEFT - 34} y="182">−</text>
          <text x={LEFT + 26} y="152">battery</text>
          <text x={LEFT + 26} y="171">{num(voltage)} V</text>
        </g>

        {/* resistors: rectangles, labelled with resistance, current and p.d. */}
        {resistors.map((q) => (
          <g key={q.name} fill={q.colour} fontSize="14" fontWeight="600" textAnchor={series ? 'middle' : 'end'}>
            <rect
              x={q.x - (series ? 40 : 14)}
              y={q.y - (series ? 14 : 40)}
              width={series ? 80 : 28}
              height={series ? 28 : 80}
              rx="2"
              fill="#10142e"
              stroke={q.colour}
              strokeWidth="3"
            />
            {[`${q.name} = ${q.r} Ω`, `${amps(q.i)} A`, `${num(q.v)} V`].map((line, k) => (
              <text key={k} x={series ? q.x : q.x - 24} y={(series ? 100 : 136) + k * 18}>
                {line}
              </text>
            ))}
          </g>
        ))}

        {/* current from the battery, with an arrow in the direction of conventional current */}
        <path d={`M${arrowX - 9} ${BOTTOM}l16 -8v16z`} fill="#f6c453" />
        <text x={arrowX} y={BOTTOM - 16} fill="#f6c453" fontSize="15" fontWeight="600" textAnchor="middle">
          I = {amps(total)} A
        </text>
        <text x={W / 2} y={H - 22} fill="#cbd5e1" fontSize="13" textAnchor="middle">
          dots show conventional current, from + round to −
        </text>
      </svg>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Readout label="Total resistance, R" value={`${num(resistance)} Ω`} note={series ? 'R = R₁ + R₂' : 'R = V ÷ I'} />
        <Readout label="Current from battery, I" value={`${amps(total)} A`} note={series ? 'I = V ÷ R' : 'I = I₁ + I₂'} />
        {series ? (
          <>
            <Readout label="p.d. across R₁" value={`${num(v1)} V`} note="V₁ = I × R₁" />
            <Readout label="p.d. across R₂" value={`${num(v2)} V`} note="V₂ = I × R₂" />
          </>
        ) : (
          <>
            <Readout label="Current through R₁" value={`${amps(i1)} A`} note="I₁ = V ÷ R₁" />
            <Readout label="Current through R₂" value={`${amps(i2)} A`} note="I₂ = V ÷ R₂" />
          </>
        )}
      </div>

      <p className="mt-3 text-sm text-slate-200" aria-live="polite">
        {series
          ? `In series the resistances add: R = R₁ + R₂ = ${r1} Ω + ${r2} Ω = ${num(resistance)} Ω. So I = V ÷ R = ${num(voltage)} V ÷ ${num(resistance)} Ω = ${amps(total)} A, the same current everywhere in the loop. Using V = I × R for each resistor, V₁ = ${num(v1)} V and V₂ = ${num(v2)} V, which add up to the battery's ${num(voltage)} V.`
          : `In parallel each resistor has the full ${num(voltage)} V across it: I₁ = V ÷ R₁ = ${num(voltage)} V ÷ ${r1} Ω = ${amps(i1)} A and I₂ = V ÷ R₂ = ${num(voltage)} V ÷ ${r2} Ω = ${amps(i2)} A. The battery supplies both, I = I₁ + I₂ = ${amps(total)} A, so R = V ÷ I = ${num(resistance)} Ω (the same as R₁ × R₂ ÷ (R₁ + R₂)), less than either resistor alone.`}{' '}
        Adding a resistor in series raises the total resistance; adding one in parallel lowers it, because the current
        has an extra path.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(['series', 'parallel'] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={layout === option}
            onClick={() => {
              setLayout(option);
              onUse();
            }}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${layout === option ? 'border-white bg-white text-[#0b1026]' : 'border-white/30 text-white hover:border-white'}`}
          >
            {option === 'series' ? 'Series' : 'Parallel'}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {sliders.map((s) => (
          <label key={s.name} className="block text-sm text-slate-200">
            <span className="flex justify-between">
              <span>{s.name}</span>
              <span className="font-semibold text-white">
                {num(s.value)} {s.unit}
              </span>
            </span>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={s.value}
              onChange={(e) => {
                s.set(Number(e.target.value));
                onUse();
              }}
              className="mt-2 w-full cursor-pointer accent-[#f6c453]"
            />
          </label>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-400">
        The battery and wires are treated as having no resistance of their own. Dot speed is in proportion to the
        current in that wire, and values are rounded.
      </p>
    </figure>
  );
}
