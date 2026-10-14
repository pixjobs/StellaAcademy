'use client';

import { useRef, useState } from 'react';
import { track } from '@/lib/track';
import { useReadableLabels } from './useReadableLabels';

// Stage geometry (SVG units) and the physical scale it represents.
const W = 560;
const H = 330;
const PX_PER_M = 26; // fixed scale, so the longest side (10 m) always fits
const CX = 405; // the right-angle corner stays put; the triangle grows up and to the left
const CY = 290;

const GOLD = '#f6c453';
const MINT = '#5eead4';
const PERI = '#a5b4fc';

type Ratio = 'sin' | 'cos' | 'tan';
type Side = 'opposite' | 'adjacent' | 'hypotenuse';

// Which two sides each ratio compares: top of the fraction first, bottom second.
const RATIOS: Record<Ratio, [Side, Side]> = {
  sin: ['opposite', 'hypotenuse'],
  cos: ['adjacent', 'hypotenuse'],
  tan: ['opposite', 'adjacent'],
};

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
 * A right-angled triangle drawn to scale. The angle and the hypotenuse are set
 * by sliders; the other two sides follow from sine and cosine, and the readouts
 * show the chosen ratio and a Pythagoras check on the same numbers.
 *
 * Nothing here moves on its own, so there is no animation loop: React's render
 * is always the complete picture.
 */
export default function TrigTriangle({ placement = 'lesson' }: { placement?: string }) {
  const labelsRef = useReadableLabels();
  const [angle, setAngle] = useState(35); // degrees
  const [hyp, setHyp] = useState(8); // metres
  const [ratio, setRatio] = useState<Ratio>('sin');
  const touched = useRef(false);

  const onUse = () => {
    if (touched.current) return;
    touched.current = true;
    track('trig_model_used', { placement });
  };

  // Degrees everywhere except inside Math.sin and Math.cos.
  const rad = (angle * Math.PI) / 180;
  const opposite = hyp * Math.sin(rad);
  const adjacent = hyp * Math.cos(rad);
  const lengths: Record<Side, number> = { opposite, adjacent, hypotenuse: hyp };

  const [top, bottom] = RATIOS[ratio];
  const ratioValue = lengths[top] / lengths[bottom];

  // Pythagoras, shown so that the two squares add up exactly to the total on screen.
  const hypSq = hyp * hyp;
  const oppSq = Number((opposite * opposite).toFixed(2));
  const adjSq = hypSq - oppSq;

  // Corners: A holds the angle θ (bottom left), C the right angle (bottom right), B the top.
  const oppPx = opposite * PX_PER_M;
  const adjPx = adjacent * PX_PER_M;
  const ax = CX - adjPx;
  const by = CY - oppPx;
  const arcR = Math.min(30, adjPx * 0.6);
  const sq = Math.min(12, oppPx * 0.5, adjPx * 0.5);
  // The hypotenuse label sits just outside the sloping side, pushed off along its normal.
  const hypLabelX = (ax + CX) / 2 - 12 * Math.sin(rad);
  const hypLabelY = (CY + by) / 2 - 12 * Math.cos(rad);

  const active = (side: Side) => side === top || side === bottom;
  const strokeWidth = (side: Side) => (active(side) ? 5 : 2);
  const opacity = (side: Side) => (active(side) ? 1 : 0.35);

  const sentence = `${ratio} ${angle}° = ${top} ÷ ${bottom} = ${lengths[top].toFixed(2)} ÷ ${lengths[bottom].toFixed(2)} = ${ratioValue.toFixed(3)}`;

  return (
    <figure className="night-window overflow-hidden rounded-3xl p-4 shadow-[0_30px_60px_-20px_rgba(11,16,38,0.55)] sm:p-6">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-fraunces text-xl font-semibold text-white">Trigonometry: sides and angles</span>
      </figcaption>

      <svg
        ref={labelsRef}
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 w-full rounded-2xl bg-black/25 ring-1 ring-white/10"
        role="img"
        aria-label={`A right-angled triangle with an angle of ${angle} degrees. The hypotenuse is ${hyp.toFixed(2)} metres, the opposite side is ${opposite.toFixed(2)} metres and the adjacent side is ${adjacent.toFixed(2)} metres. The ${top} and the ${bottom} are highlighted for ${ratio}.`}
      >
        {/* scale bar */}
        <g stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round">
          <line x1="20" y1="24" x2={20 + PX_PER_M} y2="24" />
          <line x1="20" y1="19" x2="20" y2="29" />
          <line x1={20 + PX_PER_M} y1="19" x2={20 + PX_PER_M} y2="29" />
        </g>
        <text x={20 + PX_PER_M + 8} y="29" fill="#cbd5e1" fontSize="13">
          1 m
        </text>

        {/* right-angle mark and the angle arc */}
        <path d={`M${CX - sq} ${CY}L${CX - sq} ${CY - sq}L${CX} ${CY - sq}`} fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="2" />
        <path
          d={`M${(ax + arcR).toFixed(1)} ${CY}A${arcR.toFixed(1)} ${arcR.toFixed(1)} 0 0 0 ${(ax + arcR * Math.cos(rad)).toFixed(1)} ${(CY - arcR * Math.sin(rad)).toFixed(1)}`}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
        />
        <text x={ax - 8} y={CY + 4} fill="#ffffff" fontSize="15" fontWeight="600" textAnchor="end">
          θ = {angle}°
        </text>

        {/* the three sides */}
        <g strokeLinecap="round">
          <line x1={ax} y1={CY} x2={CX} y2={CY} stroke={PERI} strokeWidth={strokeWidth('adjacent')} strokeOpacity={opacity('adjacent')} />
          <line x1={CX} y1={CY} x2={CX} y2={by} stroke={MINT} strokeWidth={strokeWidth('opposite')} strokeOpacity={opacity('opposite')} />
          <line x1={ax} y1={CY} x2={CX} y2={by} stroke={GOLD} strokeWidth={strokeWidth('hypotenuse')} strokeOpacity={opacity('hypotenuse')} />
        </g>

        <text x={hypLabelX} y={hypLabelY} fill={GOLD} fillOpacity={opacity('hypotenuse')} fontSize="14" fontWeight="600" textAnchor="end">
          hypotenuse {hyp.toFixed(2)} m
        </text>
        {/* two lines, so the label still fits beside the triangle when phones enlarge it */}
        <text x={CX + 12} y={(CY + by) / 2 - 3} fill={MINT} fillOpacity={opacity('opposite')} fontSize="14" fontWeight="600">
          <tspan>opposite</tspan>
          <tspan x={CX + 12} dy="1.2em">
            {opposite.toFixed(2)} m
          </tspan>
        </text>
        <text x={(ax + CX) / 2} y={CY + 24} fill={PERI} fillOpacity={opacity('adjacent')} fontSize="14" fontWeight="600" textAnchor="middle">
          adjacent {adjacent.toFixed(2)} m
        </text>
      </svg>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Readout label="Opposite" value={`${opposite.toFixed(2)} m`} note="hypotenuse × sin θ" />
        <Readout label="Adjacent" value={`${adjacent.toFixed(2)} m`} note="hypotenuse × cos θ" />
        <Readout label={`${ratio} ${angle}°`} value={ratioValue.toFixed(3)} note={`${top} ÷ ${bottom}`} />
        <Readout
          label="Opposite² + adjacent²"
          value={`${hypSq.toFixed(2)} m²`}
          note={`${oppSq.toFixed(2)} + ${adjSq.toFixed(2)} = ${hyp.toFixed(2)}², the hypotenuse squared`}
        />
      </div>

      <p className="mt-3 text-sm text-slate-200" aria-live="polite">
        {sentence}. Change the hypotenuse and every side grows or shrinks together, so the ratio stays the same. Only the
        angle changes it.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Ratio to highlight">
        {(Object.keys(RATIOS) as Ratio[]).map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={ratio === r}
            onClick={() => {
              setRatio(r);
              onUse();
            }}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              ratio === r ? 'border-white bg-white text-[#0b1026]' : 'border-white/30 text-white hover:border-white'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-200">
          <span className="flex justify-between">
            <span>Angle θ</span>
            <span className="font-semibold text-white">{angle}°</span>
          </span>
          <input
            type="range"
            min={5}
            max={85}
            step={1}
            value={angle}
            onChange={(e) => {
              setAngle(Number(e.target.value));
              onUse();
            }}
            className="mt-2 w-full cursor-pointer accent-[#f6c453]"
          />
        </label>
        <label className="block text-sm text-slate-200">
          <span className="flex justify-between">
            <span>Hypotenuse</span>
            <span className="font-semibold text-white">{hyp.toFixed(1)} m</span>
          </span>
          <input
            type="range"
            min={2}
            max={10}
            step={0.5}
            value={hyp}
            onChange={(e) => {
              setHyp(Number(e.target.value));
              onUse();
            }}
            className="mt-2 w-full cursor-pointer accent-[#f6c453]"
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Lengths are rounded to 2 decimal places and ratios to 3, so working from the rounded numbers on a calculator can
        differ in the last digit.
      </p>
    </figure>
  );
}
