'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { track } from '@/lib/track';
import { useReadableLabels } from './useReadableLabels';

// Stage geometry (SVG units) and the physical scale it represents.
const W = 560;
const H = 210;
const TRACK_Y = 160;
const TRACK_L = 10;
const TRACK_R = 550;
const PX_PER_M = 40;
const ARROW_PX = 10; // arrow length for each 1 m/s
const MEET_X = 280; // where the trolleys touch
const LEAD = 1.2; // seconds of travel shown before they touch
const AFTER = 3; // seconds shown after they touch (or in total if they never meet)
const A_COLOUR = '#a5b4fc';
const B_COLOUR = '#5eead4';

type Mode = 'stick' | 'bounce';

const trolleyWidth = (mass: number) => 36 + 6 * mass;

/** Up to two decimal places, no trailing zeros, with a proper minus sign. */
function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return r < 0 ? `−${Math.abs(r)}` : `${Math.abs(r)}`;
}

function inWords(v: number): string {
  if (Math.abs(v) < 0.005) return 'at rest';
  return `moving ${v > 0 ? 'right' : 'left'} at ${fmt(Math.abs(v))} metres per second`;
}

function collide(mA: number, uA: number, mB: number, uB: number, mode: Mode) {
  const meets = uA > uB; // A must be closing on B
  if (!meets) return { meets, vA: uA, vB: uB };
  const total = mA + mB;
  if (mode === 'stick') {
    const v = (mA * uA + mB * uB) / total;
    return { meets, vA: v, vB: v };
  }
  return {
    meets,
    vA: ((mA - mB) * uA + 2 * mB * uB) / total,
    vB: ((mB - mA) * uB + 2 * mA * uA) / total,
  };
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

function Arrow({ cx, v, colour, anchor }: { cx: number; v: number; colour: string; anchor: 'start' | 'end' }) {
  const moving = Math.abs(v) >= 0.005;
  const s = v > 0 ? 1 : -1;
  const len = s * Math.max(10, Math.abs(v) * ARROW_PX);
  const tip = cx + len / 2;
  return (
    <>
      {moving && (
        <>
          <line x1={cx - len / 2} y1="96" x2={tip - s * 6} y2="96" stroke={colour} strokeWidth="3" strokeLinecap="round" />
          <polygon points={`${tip},96 ${tip - s * 8},90.5 ${tip - s * 8},101.5`} fill={colour} />
        </>
      )}
      <text x={cx + (anchor === 'end' ? 14 : -14)} y="80" textAnchor={anchor} fill={colour} fontSize="13" fontWeight="600">
        {fmt(v)} m/s
      </text>
    </>
  );
}

function Trolley(props: {
  name: 'A' | 'B';
  x: number;
  mass: number;
  before: number;
  after: number;
  gRef: RefObject<SVGGElement | null>;
  beforeRef: RefObject<SVGGElement | null>;
  afterRef: RefObject<SVGGElement | null>;
}) {
  const { name, x, mass, before, after, gRef, beforeRef, afterRef } = props;
  const w = trolleyWidth(mass);
  const colour = name === 'A' ? A_COLOUR : B_COLOUR;
  const left = name === 'A' ? -w : 0; // A is placed by its front edge, B by its back edge
  const cx = left + w / 2;
  const anchor = name === 'A' ? 'end' : 'start';
  return (
    <g ref={gRef} transform={`translate(${x.toFixed(1)} 0)`}>
      <rect x={left} y="114" width={w} height="34" rx="6" fill={colour} fillOpacity="0.2" stroke={colour} strokeWidth="2.5" />
      <circle cx={left + 11} cy="153" r="6" fill="#0b1026" stroke={colour} strokeWidth="2.5" />
      <circle cx={left + w - 11} cy="153" r="6" fill="#0b1026" stroke={colour} strokeWidth="2.5" />
      <text x={cx} y="136" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="600">
        {mass} kg
      </text>
      <text x={cx} y="184" textAnchor="middle" fill={colour} fontSize="15" fontWeight="600">
        {name}
      </text>
      <g ref={beforeRef}>
        <Arrow cx={cx} v={before} colour={colour} anchor={anchor} />
      </g>
      <g ref={afterRef} display="none">
        <Arrow cx={cx} v={after} colour={colour} anchor={anchor} />
      </g>
    </g>
  );
}

function Slider(props: { label: string; shown: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm text-slate-200">
      <span className="flex justify-between">
        <span>{props.label}</span>
        <span className="font-semibold text-white">{props.shown}</span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={0.5}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="mt-2 w-full cursor-pointer accent-[#f6c453]"
      />
    </label>
  );
}

/**
 * Two trolleys on a straight track. Whatever the masses, velocities and kind
 * of collision, the total momentum before equals the total momentum after.
 */
/** `bare`: inside a Try it panel that already has its frame (the Explore tab on a quiz lesson). */
export default function MomentumTrack({ placement = 'lesson', bare = false }: { placement?: string; bare?: boolean }) {
  const labelsRef = useReadableLabels();
  const [mA, setMA] = useState(2);
  const [uA, setUA] = useState(3);
  const [mB, setMB] = useState(1);
  const [uB, setUB] = useState(0);
  const [mode, setMode] = useState<Mode>('stick');
  const [status, setStatus] = useState<'ready' | 'running' | 'done'>('ready');
  const [stillNote, setStillNote] = useState(false);
  const [epoch, setEpoch] = useState(0); // a new key redraws the trolleys at their starting places
  const aRef = useRef<SVGGElement>(null);
  const bRef = useRef<SVGGElement>(null);
  const aBefore = useRef<SVGGElement>(null);
  const aAfter = useRef<SVGGElement>(null);
  const bBefore = useRef<SVGGElement>(null);
  const bAfter = useRef<SVGGElement>(null);
  const frame = useRef(0);
  const touched = useRef(false);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const { meets, vA, vB } = collide(mA, uA, mB, uB, mode);
  const wA = trolleyWidth(mA);
  const wB = trolleyWidth(mB);
  // If they meet, start each trolley LEAD seconds of travel away from the meeting point.
  const xA0 = meets ? MEET_X - uA * LEAD * PX_PER_M : 200;
  const xB0 = meets ? MEET_X - uB * LEAD * PX_PER_M : 360;
  const pBefore = mA * uA + mB * uB;
  const pAfter = mA * vA + mB * vB;

  const onUse = () => {
    if (touched.current) return;
    touched.current = true;
    track('momentum_model_used', { placement });
  };

  const toStart = () => {
    cancelAnimationFrame(frame.current);
    setEpoch((n) => n + 1);
    setStatus('ready');
    setStillNote(false);
  };

  const change = (apply: () => void) => {
    apply();
    toStart();
    onUse();
  };

  const run = () => {
    onUse();
    cancelAnimationFrame(frame.current);
    const still =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('reduce-motion');
    // With motion reduced, the static "before" picture stays and the numbers tell the rest.
    if (still) {
      setStillNote(true);
      return;
    }
    setStatus('running');
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const hit = meets && t >= LEAD;
      const xA = hit ? MEET_X + vA * (t - LEAD) * PX_PER_M : xA0 + uA * t * PX_PER_M;
      const xB = hit ? MEET_X + vB * (t - LEAD) * PX_PER_M : xB0 + uB * t * PX_PER_M;
      aRef.current?.setAttribute('transform', `translate(${xA.toFixed(1)} 0)`);
      bRef.current?.setAttribute('transform', `translate(${xB.toFixed(1)} 0)`);
      aBefore.current?.setAttribute('display', hit ? 'none' : 'inline');
      bBefore.current?.setAttribute('display', hit ? 'none' : 'inline');
      aAfter.current?.setAttribute('display', hit ? 'inline' : 'none');
      bAfter.current?.setAttribute('display', hit ? 'inline' : 'none');
      const offTrack = xA - wA < TRACK_L || xA > TRACK_R || xB < TRACK_L || xB + wB > TRACK_R;
      if (t >= (meets ? LEAD + AFTER : AFTER) || ((hit || !meets) && offTrack)) {
        setStatus('done');
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const sum = (a: number, b: number) => `(${fmt(mA)} × ${fmt(a)}) + (${fmt(mB)} × ${fmt(b)})`;
  const pill = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-semibold ${active ? 'border-white bg-white text-[#0b1026]' : 'border-white/30 text-white hover:border-white'}`;

  const Frame = bare ? 'div' : 'figure';
  const Caption = bare ? 'p' : 'figcaption';
  return (
    <Frame className={bare ? '' : 'night-window overflow-hidden rounded-3xl p-4 shadow-[0_30px_60px_-20px_rgba(11,16,38,0.55)] sm:p-6'}>
      <Caption className="flex items-baseline justify-between gap-3">
        <span className="font-fraunces text-xl font-semibold text-white">Collisions: momentum before and after</span>
      </Caption>

      <svg
        ref={labelsRef}
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 w-full rounded-2xl bg-black/25 ring-1 ring-white/10"
        role="img"
        aria-label={`A straight track before the collision. Trolley A, ${fmt(mA)} kilograms, is ${inWords(uA)}. Trolley B, ${fmt(mB)} kilograms, is ${inWords(uB)}. ${
          meets
            ? `They ${mode === 'stick' ? 'stick together' : 'bounce apart'}: afterwards A is ${inWords(vA)} and B is ${inWords(vB)}.`
            : 'A never catches B, so they do not collide.'
        }`}
      >
        {/* the track, with a mark every metre */}
        {Array.from({ length: 14 }, (_, i) => (
          <line key={i} x1={i * PX_PER_M + 20} y1={TRACK_Y} x2={i * PX_PER_M + 20} y2={TRACK_Y + 7} stroke="#ffffff" strokeOpacity="0.3" strokeWidth="2" />
        ))}
        <line x1={TRACK_L} y1={TRACK_Y} x2={TRACK_R} y2={TRACK_Y} stroke="#ffffff" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
        <text x={W - 14} y={H - 10} textAnchor="end" fill="#cbd5e1" fontSize="13">
          marks are 1 m apart
        </text>
        <text x="14" y="24" fill="#f6c453" fontSize="15" fontWeight="600">
          momentum = mass × velocity
        </text>

        <g key={epoch}>
          <Trolley name="A" x={xA0} mass={mA} before={uA} after={vA} gRef={aRef} beforeRef={aBefore} afterRef={aAfter} />
          <Trolley name="B" x={xB0} mass={mB} before={uB} after={vB} gRef={bRef} beforeRef={bBefore} afterRef={bAfter} />
        </g>
      </svg>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Readout label="Total momentum before" value={`${fmt(pBefore)} kg m/s`} />
        <Readout label="Total momentum after" value={`${fmt(pAfter)} kg m/s`} note="always equal to before" />
        <Readout label="Velocity of A after" value={`${fmt(vA)} m/s`} />
        <Readout label="Velocity of B after" value={`${fmt(vB)} m/s`} />
      </div>

      <p className="mt-3 text-sm text-slate-200" aria-live="polite">
        {meets ? (
          <>
            Before: {sum(uA, uB)} = {fmt(pBefore)} kg m/s. After: {sum(vA, vB)} = {fmt(pAfter)} kg m/s. Momentum is
            conserved{mode === 'stick' ? ', though some kinetic energy is transferred to other stores' : ''}.
          </>
        ) : (
          <>
            Trolley A never catches trolley B, so there is no collision and the velocities do not change. Total momentum
            stays at {sum(uA, uB)} = {fmt(pBefore)} kg m/s.
          </>
        )}
        {stillNote && ' Motion is reduced on this device, so the picture stays on the moment before the collision.'}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" aria-pressed={mode === 'stick'} onClick={() => change(() => setMode('stick'))} className={pill(mode === 'stick')}>
          Stick together
        </button>
        <button type="button" aria-pressed={mode === 'bounce'} onClick={() => change(() => setMode('bounce'))} className={pill(mode === 'bounce')}>
          Bounce apart
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Slider label="Mass of A" shown={`${fmt(mA)} kg`} min={1} max={5} value={mA} onChange={(v) => change(() => setMA(v))} />
        <Slider label="Velocity of A before" shown={`${fmt(uA)} m/s`} min={0} max={4} value={uA} onChange={(v) => change(() => setUA(v))} />
        <Slider label="Mass of B" shown={`${fmt(mB)} kg`} min={1} max={5} value={mB} onChange={(v) => change(() => setMB(v))} />
        <Slider label="Velocity of B before" shown={`${fmt(uB)} m/s`} min={-2} max={2} value={uB} onChange={(v) => change(() => setUB(v))} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={run} className="rounded-full border border-[#f6c453] bg-[#f6c453] px-4 py-1.5 text-sm font-semibold text-[#0b1026] hover:bg-[#f8d27a]">
          {status === 'ready' ? 'Run the collision' : 'Run the collision again'}
        </button>
        <button type="button" onClick={() => { toStart(); onUse(); }} className={pill(false)}>
          Reset
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Friction is ignored. Velocities to the right are positive, so a negative velocity means moving left. Values are
        rounded to 2 decimal places. The trolleys start {LEAD} seconds of travel away from where they meet.
      </p>
    </Frame>
  );
}
