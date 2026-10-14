'use client';

import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/track';
import { useReadableLabels } from './useReadableLabels';

// Stage geometry (SVG units).
const W = 560;
const H = 272;
const CY = 160;
const SLOW = 0.25; // the animation runs at quarter speed so single teeth are easy to follow
const GOLD = '#f6c453';
const MINT = '#5eead4';

/** Trims a number to at most two decimal places: 2.5, 12, 3.33. */
function fmt(x: number): string {
  return String(Number(x.toFixed(2)));
}

/**
 * Pixels of pitch radius per tooth. Both gears share it, so their teeth are the same size and mesh.
 * Chosen so the pair always fits the stage whatever the tooth counts.
 */
function scaleFor(driver: number, driven: number): number {
  return Math.min(9, 260 / (driver + driven + 2), 100 / (Math.max(driver, driven) + 2));
}

/**
 * Outline of a toothed wheel centred on the origin. Pitch radius = k × teeth.
 * `offset` (radians) is the angle of the centre of the first tooth.
 */
function gearPath(teeth: number, k: number, offset: number): string {
  const pitch = (2 * Math.PI) / teeth;
  const tip = k * (teeth + 1.6);
  const root = k * (teeth - 2.2);
  const at = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  let d = '';
  for (let i = 0; i < teeth; i += 1) {
    const c = offset + i * pitch;
    // root arc into the tooth, up the flank, across the tip, down the other flank
    d += i === 0 ? `M${at(root, c - 0.3 * pitch)}` : `A${root.toFixed(2)} ${root.toFixed(2)} 0 0 1 ${at(root, c - 0.3 * pitch)}`;
    d += `L${at(tip, c - 0.15 * pitch)}A${tip.toFixed(2)} ${tip.toFixed(2)} 0 0 1 ${at(tip, c + 0.15 * pitch)}L${at(root, c + 0.3 * pitch)}`;
  }
  return `${d}A${root.toFixed(2)} ${root.toFixed(2)} 0 0 1 ${at(root, offset - 0.3 * pitch)}Z`;
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

function Gear({ teeth, k, offset, colour, innerRef }: { teeth: number; k: number; offset: number; colour: string; innerRef: React.RefObject<SVGGElement | null> }) {
  const root = k * (teeth - 2.2);
  return (
    // React never sets a transform on this group: the animation loop owns it.
    <g ref={innerRef}>
      <path d={gearPath(teeth, k, offset)} fill={colour} fillOpacity="0.16" stroke={colour} strokeWidth="2.5" strokeLinejoin="round" />
      {/* the mark that shows the turning: a spoke with a dot at its end */}
      <line x1="0" y1="0" x2="0" y2={-(root - 5)} stroke={colour} strokeWidth="3" strokeLinecap="round" />
      <circle cx="0" cy={-(root - 5)} r={Math.min(5, root * 0.22)} fill="#ffffff" />
      <circle cx="0" cy="0" r={Math.min(7, root * 0.3)} fill="#0b1026" stroke={colour} strokeWidth="2.5" />
    </g>
  );
}

/**
 * Two meshing gears: the tooth counts set the gear ratio, and the ratio trades
 * speed of turning for turning effect (moment) while their product stays the same.
 */
export default function GearTrain({ placement = 'lesson' }: { placement?: string }) {
  const labelsRef = useReadableLabels();
  const [driver, setDriver] = useState(16);
  const [driven, setDriven] = useState(40);
  const [speed, setSpeed] = useState(30);
  const [moment, setMoment] = useState(4);
  const driverRef = useRef<SVGGElement>(null);
  const drivenRef = useRef<SVGGElement>(null);
  const live = useRef({ driver, driven, speed });
  const touched = useRef(false);

  // The animation loop starts once and reads the latest slider values from here.
  useEffect(() => {
    live.current = { driver, driven, speed };
  }, [driver, driven, speed]);

  useEffect(() => {
    const still =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('reduce-motion');
    // With motion reduced, React's own render (both gears unturned, teeth in mesh) is the picture.
    if (still) return;
    let frame = 0;
    let last = performance.now();
    let turns = 0; // how far the driver has turned, in whole turns
    const tick = (now: number) => {
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      const v = live.current;
      turns += (v.speed / 60) * SLOW * dt;
      // The driven gear turns the other way, by the same number of teeth.
      driverRef.current?.setAttribute('transform', `rotate(${(turns * 360).toFixed(2)})`);
      drivenRef.current?.setAttribute('transform', `rotate(${((-turns * 360 * v.driver) / v.driven).toFixed(2)})`);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const onUse = () => {
    if (touched.current) return;
    touched.current = true;
    track('gears_model_used', { placement });
  };

  const ratio = driven / driver;
  const drivenSpeed = speed / ratio;
  const drivenMoment = moment * ratio;
  const product = speed * moment;

  const k = scaleFor(driver, driven);
  const left = (W - k * (2 * driver + 2 * driven + 4)) / 2;
  const cx1 = left + k * (driver + 2);
  const contact = cx1 + k * driver;
  const cx2 = contact + k * driven;

  let sentence: string;
  if (driven > driver) {
    sentence = `The driven gear has ${fmt(ratio)} times as many teeth, so it turns ${fmt(ratio)} times slower and with ${fmt(ratio)} times the turning effect.`;
  } else if (driven < driver) {
    const inv = fmt(driver / driven);
    sentence = `The driver has ${inv} times as many teeth as the driven gear, so the driven gear turns ${inv} times faster, with less turning effect: the turning effect is divided by ${inv}.`;
  } else {
    sentence = `Both gears have ${driver} teeth, so the driven gear turns at the same speed and with the same turning effect, in the opposite direction.`;
  }

  const sliders = [
    { name: 'Teeth on the driver', value: driver, set: setDriver, min: 8, max: 40, step: 4, unit: 'teeth' },
    { name: 'Teeth on the driven gear', value: driven, set: setDriven, min: 8, max: 40, step: 4, unit: 'teeth' },
    { name: 'Speed of the driver', value: speed, set: setSpeed, min: 10, max: 60, step: 5, unit: 'turns per minute' },
    { name: 'Turning effect on the driver', value: moment, set: setMoment, min: 1, max: 10, step: 1, unit: 'N m' },
  ];

  return (
    <figure className="night-window overflow-hidden rounded-3xl p-4 shadow-[0_30px_60px_-20px_rgba(11,16,38,0.55)] sm:p-6">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-fraunces text-xl font-semibold text-white">Gears: trading speed for turning effect</span>
      </figcaption>

      <svg
        ref={labelsRef}
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 w-full rounded-2xl bg-black/25 ring-1 ring-white/10"
        role="img"
        aria-label={`A driver gear with ${driver} teeth turning clockwise at ${speed} turns per minute, meshed with a driven gear with ${driven} teeth turning anticlockwise at ${fmt(drivenSpeed)} turns per minute. The gear ratio is ${fmt(ratio)} to 1.`}
      >
        {/* Driver: a tooth points at the contact point. */}
        <g transform={`translate(${cx1.toFixed(2)} ${CY})`}>
          <Gear teeth={driver} k={k} offset={0} colour={GOLD} innerRef={driverRef} />
        </g>
        {/* Driven: a gap between two teeth faces the contact point, so the driver's tooth sits in it. */}
        <g transform={`translate(${cx2.toFixed(2)} ${CY})`}>
          <Gear teeth={driven} k={k} offset={Math.PI + Math.PI / driven} colour={MINT} innerRef={drivenRef} />
        </g>

        <g fontSize="14" fontWeight="600">
          <text x={contact - 10} y="22" textAnchor="end" fill={GOLD}>
            Driver: {driver} teeth
          </text>
          <text x={contact - 10} y="40" textAnchor="end" fill={GOLD} fontSize="13" fontWeight="400">
            {speed} turns per minute
          </text>
          <text x={contact + 10} y="22" fill={MINT}>
            Driven: {driven} teeth
          </text>
          <text x={contact + 10} y="40" fill={MINT} fontSize="13" fontWeight="400">
            {fmt(drivenSpeed)} turns per minute
          </text>
        </g>
      </svg>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Readout label="Gear ratio" value={`${fmt(ratio)} : 1`} note="driven teeth ÷ driver teeth" />
        <Readout label="Driven speed, turns per minute" value={fmt(drivenSpeed)} note="driver speed ÷ ratio" />
        <Readout label="Driven turning effect" value={`${fmt(drivenMoment)} N m`} note="driver turning effect × ratio" />
        <Readout label="Driver turning effect" value={`${moment} N m`} note="set by you" />
      </div>

      <div className="mt-2.5 rounded-xl bg-white/[0.06] px-3 py-2.5 text-sm text-slate-200 ring-1 ring-white/10">
        <div className="text-xs text-slate-300">Speed × turning effect is the same for both gears</div>
        <div className="mt-1 grid gap-x-4 gap-y-1 font-semibold sm:grid-cols-2">
          <span style={{ color: GOLD }}>
            Driver: {speed} × {moment} = {fmt(product)}
          </span>
          <span style={{ color: MINT }}>
            Driven: {fmt(drivenSpeed)} × {fmt(drivenMoment)} = {fmt(product)}
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-200" aria-live="polite">
        {sentence}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {sliders.map((s) => (
          <label key={s.name} className="block text-sm text-slate-200">
            <span className="flex justify-between gap-3">
              <span>{s.name}</span>
              <span className="text-right font-semibold text-white">
                {s.value} {s.unit}
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
        Friction is ignored, so nothing is lost between the gears. The two gears always turn in opposite directions. The
        animation runs at a quarter of real speed so you can follow the teeth, and the numbers shown are rounded to two
        decimal places.
      </p>
    </figure>
  );
}
