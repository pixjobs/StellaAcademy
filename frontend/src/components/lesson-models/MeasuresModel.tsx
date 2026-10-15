'use client';

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { track } from '@/lib/track';
import {
  MEASURES,
  bottom,
  formatDecimal,
  parseDecimal,
  powerOfTen,
  shift,
  type Digits,
  type MeasureKind,
  type MetricUnit,
} from '@/lib/measures';
import { useQuizActive } from '@/lib/quiz/active';
import { useReadableLabels } from './useReadableLabels';

/** Place-value headings, as taught in primary school. */
const PLACE_LABEL: Record<number, string> = {
  6: 'M', 5: 'HTh', 4: 'TTh', 3: 'Th', 2: 'H', 1: 'T', 0: 'O', [-1]: 't', [-2]: 'h', [-3]: 'th',
};
const MAX_COLUMNS = 10;
const COL = 24; // px per place-value column

function useOnce(event: string) {
  const done = useRef(false);
  return () => {
    if (done.current) return;
    done.current = true;
    track(event);
  };
}

// ---------------------------------------------------------------------------------------------
// The metric ladder
// ---------------------------------------------------------------------------------------------

function Ladder({ units, from, to, onPick }: { units: MetricUnit[]; from: number; to: number; onPick: (i: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const keyed = useRef(false);

  // After an arrow key, move focus to the rung that is now chosen (a radio group moves focus with the choice).
  useEffect(() => {
    if (!keyed.current) return;
    keyed.current = false;
    buttons.current[to]?.focus();
  }, [to]);

  const step = (d: number) => {
    keyed.current = true;
    onPick(Math.max(0, Math.min(units.length - 1, to + d)));
  };

  const pickAt = (e: ReactPointerEvent) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    const i = Math.floor(((e.clientY - rect.top) / rect.height) * units.length);
    onPick(Math.max(0, Math.min(units.length - 1, i)));
  };

  return (
    <div
      ref={box}
      className="relative mx-auto w-full max-w-[13rem] touch-none select-none sm:max-w-none"
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        pickAt(e);
      }}
      onPointerMove={(e) => dragging.current && pickAt(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      {/* the two rails */}
      <div aria-hidden className="absolute inset-y-2 left-3 w-1 rounded bg-white/15" />
      <div aria-hidden className="absolute inset-y-2 right-3 w-1 rounded bg-white/15" />
      <ol className="relative" role="radiogroup" aria-label="Convert to">
        {units.map((u, i) => {
          const isTo = i === to;
          const isFrom = i === from;
          const next = units[i + 1];
          return (
            <li key={u.symbol} role="none" className="relative h-16">
              <button
                ref={(el) => { buttons.current[i] = el; }}
                type="button"
                role="radio"
                aria-checked={isTo}
                aria-label={`${u.plural}${isFrom ? ', your starting unit' : ''}`}
                onClick={() => onPick(i)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); step(1); }
                  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
                }}
                tabIndex={isTo ? 0 : -1}
                className="absolute inset-x-0 top-3 mx-1 flex h-10 items-center justify-between rounded-lg border-2 px-3 text-base font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{
                  borderColor: isTo || isFrom ? u.colour : 'rgba(255,255,255,0.15)',
                  background: isTo ? `${u.colour}33` : 'rgba(11,16,38,0.85)',
                  color: isTo || isFrom ? '#fff' : '#cbd5e1',
                }}
              >
                <span style={{ color: u.colour }}>{u.symbol}</span>
                <span className="text-xs font-medium text-slate-300">{isFrom ? 'start' : isTo ? 'convert to' : u.plural}</span>
              </button>
              {next && (
                <span aria-hidden className="absolute -bottom-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0b1026] px-2 text-xs font-semibold text-slate-200 ring-1 ring-white/15">
                  ↓ × {powerOfTen(u.power - next.power)} &nbsp; ↑ ÷ {powerOfTen(u.power - next.power)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** One row of place-value columns. Digits slide to their new places when the unit changes; the point stays still. */
function PlaceValue({ start, result, places, unit, unitsKey }: { start: Digits; result: Digits; places: number; unit: MetricUnit; unitsKey: string }) {
  // When a unit changes, draw the digits where the starting number has them, then let them slide to the answer.
  const [atStart, setAtStart] = useState(false);
  const lastKey = useRef(unitsKey);
  useLayoutEffect(() => {
    if (lastKey.current === unitsKey) return;
    lastKey.current = unitsKey;
    setAtStart(true);
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setAtStart(false));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [unitsKey]);
  const shown = atStart ? start : result;
  const hi = Math.max(start.top, result.top, 0);
  const lo = Math.min(bottom(start), bottom(result), 0);
  const columns = Array.from({ length: hi - lo + 1 }, (_, i) => hi - i);
  const x = (place: number) => (hi - place) * COL + (place < 0 ? 10 : 0); // 10px gap for the decimal point
  const width = columns.length * COL + (lo < 0 ? 10 : 0);
  // Zeros that hold places: between the result's digits and the point.
  const holders: number[] = [];
  for (let p = Math.max(result.top, 0); p >= Math.min(bottom(result), 0); p--) {
    if (p > result.top || p < bottom(result)) holders.push(p);
  }

  return (
    <div className="overflow-x-auto">
      <div className="relative mx-auto font-mono" style={{ width, height: 64 }} aria-hidden>
        {columns.map((p) => (
          <div key={p} className="absolute top-0 text-center text-[11px] text-slate-400" style={{ left: x(p), width: COL }}>
            {PLACE_LABEL[p] ?? ''}
          </div>
        ))}
        {columns.map((p) => (
          <div key={`c${p}`} className="absolute top-5 h-9 rounded bg-white/[0.05] ring-1 ring-white/10" style={{ left: x(p) + 2, width: COL - 4 }} />
        ))}
        {lo < 0 && <div className="absolute top-[42px] h-2 w-2 rounded-full bg-white" style={{ left: x(0) + COL + 1 }} />}
        {!atStart && holders.map((p) => (
          <div key={`z${p}-${places}`} className="measures-fade absolute top-5 flex h-9 items-center justify-center text-xl text-slate-500" style={{ left: x(p), width: COL }}>
            0
          </div>
        ))}
        {start.digits.split('').map((digit, i) => (
          <div
            key={i}
            className={`absolute top-5 flex h-9 items-center justify-center text-xl font-bold ${atStart ? '' : 'measures-slide transition-[left] duration-700 ease-in-out motion-reduce:transition-none'}`}
            style={{ left: x(shown.top - i), width: COL, color: unit.colour }}
          >
            {digit}
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricLadder({ onUse }: { onUse: () => void }) {
  const [kind, setKind] = useState<MeasureKind>('length');
  const [text, setText] = useState('2.5');
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(1);
  const units = MEASURES[kind].units;
  const f = units[Math.min(from, units.length - 1)];
  const t = units[Math.min(to, units.length - 1)];
  const start = parseDecimal(text);
  const places = f.power - t.power;
  const result = start && shift(start, places);
  const columns = start && result ? Math.max(start.top, result.top, 0) - Math.min(bottom(start), bottom(result), 0) + 1 : 0;
  const tooManyDecimals = !!start && bottom(start) < -3;
  // Too wide: more columns than fit, or places beyond the headings (millions down to thousandths).
  const tooWide =
    !!start && !!result && (columns > MAX_COLUMNS || Math.max(start.top, result.top) > 6 || Math.min(bottom(start), bottom(result)) < -3);

  const changeKind = (k: MeasureKind) => {
    setKind(k);
    setFrom(0);
    setTo(1);
    onUse();
  };

  // The steps between the two rungs, each with its own factor.
  const lo = Math.min(from, to);
  const hiStep = Math.max(from, to);
  const steps = units.slice(lo, hiStep).map((u, i) => powerOfTen(u.power - units[lo + i + 1].power));
  if (places < 0) steps.reverse(); // going up, the first step is the one nearest the starting unit

  let sentence = '';
  if (start && result && !tooWide) {
    if (start.digits === '0') sentence = 'Zero is zero in any unit.';
    else if (places === 0) sentence = 'Same unit, so the number does not change.';
    else if (places > 0)
      sentence = `${t.plural[0].toUpperCase()}${t.plural.slice(1)} are smaller than ${f.plural}, so the number gets bigger. ${
        steps.length > 1 ? `Going down ${steps.length} steps: × ${steps.join(' × ')}, so × ${powerOfTen(places)} altogether. ` : ''
      }Multiply by ${powerOfTen(places)}: every digit moves ${places} place${places === 1 ? '' : 's'} to the left.`;
    else
      sentence = `${t.plural[0].toUpperCase()}${t.plural.slice(1)} are bigger than ${f.plural}, so the number gets smaller. ${
        steps.length > 1 ? `Going up ${steps.length} steps: ÷ ${steps.join(' ÷ ')}, so ÷ ${powerOfTen(-places)} altogether. ` : ''
      }Divide by ${powerOfTen(-places)}: every digit moves ${-places} place${places === -1 ? '' : 's'} to the right.`;
  }

  return (
    <section aria-labelledby="ladder-title">
      <h3 id="ladder-title" className="font-fraunces text-lg font-semibold text-white">The metric ladder</h3>
      <p className="mt-1 text-sm text-slate-300">Pick a starting measurement, then drag or tap the ladder to choose the unit to convert to.</p>

      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="What to measure">
        {(Object.keys(MEASURES) as MeasureKind[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={k === kind}
            onClick={() => changeKind(k)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
              k === kind ? 'border-cyan-300 bg-cyan-400/20 text-white' : 'border-white/15 bg-white/[0.04] text-slate-300 hover:text-white'
            }`}
          >
            {MEASURES[k].label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block text-sm text-slate-300">
          Starting number
          <input
            inputMode="decimal"
            value={text}
            maxLength={9}
            onChange={(e) => { setText(e.target.value); onUse(); }}
            aria-invalid={!start}
            className="mt-1.5 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-lg font-semibold text-white focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
          />
        </label>
        <label className="block text-sm text-slate-300">
          Starting unit
          <select
            value={from}
            onChange={(e) => { setFrom(Number(e.target.value)); onUse(); }}
            className="mt-1.5 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2.5 text-white focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
          >
            {units.map((u, i) => (
              <option key={u.symbol} value={i}>{u.plural} ({u.symbol})</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,11rem)_1fr] lg:grid-cols-1 xl:grid-cols-[minmax(0,11rem)_1fr]">
        <Ladder units={units} from={from} to={to} onPick={(i) => { setTo(i); onUse(); }} />
        <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          {!start ? (
            <p className="text-sm text-slate-200">Type a number such as 2.5 or 350. Use digits and one decimal point.</p>
          ) : tooManyDecimals ? (
            <p className="text-sm text-slate-200">Use up to 3 decimal places, such as 2.375.</p>
          ) : tooWide ? (
            <p className="text-sm text-slate-200">That answer needs more places than this chart has. Try a smaller number or a smaller jump.</p>
          ) : (
            <>
              <p className="font-fraunces text-2xl font-semibold leading-snug text-white" aria-live="polite">
                <span style={{ color: f.colour }}>{formatDecimal(start)} {f.symbol}</span>
                {' = '}
                <span style={{ color: t.colour }}>{formatDecimal(result!)} {t.symbol}</span>
              </p>
              <div className="mt-3">
                <PlaceValue start={start} result={result!} places={places} unit={t} unitsKey={`${kind}-${from}-${to}`} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">{sentence}</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------
// The zooming ruler
// ---------------------------------------------------------------------------------------------

/** Ruler lengths, in millimetres, from 10 km down to 1 cm. Whole numbers, so every reading is exact. */
const STOPS_MM = [
  10_000_000, 5_000_000, 2_000_000, 1_000_000, 500_000, 200_000, 100_000, 50_000, 20_000, 10_000, 5_000, 2_000, 1_000, 500, 200, 100, 50, 20, 10,
];
const LENGTH = MEASURES.length.units;
const RW = 560;
const RH = 116;
const PAD = 22;

/** The unit to label a ruler's marks in: the largest unit that the gap between big marks is at least 1 of. */
function labelUnit(majorMm: number): MetricUnit {
  return LENGTH.find((u) => majorMm >= 10 ** (u.power + 3)) ?? LENGTH[LENGTH.length - 1];
}

function mmIn(u: MetricUnit, mm: number): Digits {
  return shift(parseDecimal(String(mm))!, -(u.power + 3));
}

function ZoomRuler({ onUse }: { onUse: () => void }) {
  const labelsRef = useReadableLabels();
  const [stop, setStop] = useState(3); // 1 km
  const ticks = useRef<SVGGElement>(null);
  const previous = useRef(STOPS_MM[3]);

  const total = STOPS_MM[stop];
  // Big marks: 1, 2 or 5 × a power of ten, giving 5 to 10 gaps across the ruler.
  const major = [1, 2, 5].flatMap((m) => [0, 1, 2, 3, 4, 5, 6].map((k) => m * 10 ** k)).sort((a, b) => a - b).find((g) => total / g <= 10)!;
  const minor = major / (String(major)[0] === '2' ? 4 : String(major)[0] === '5' ? 5 : 10);
  const scale = (RW - 2 * PAD) / total;
  const unit = labelUnit(major);
  const majors = Array.from({ length: Math.round(total / major) + 1 }, (_, i) => i * major);
  // Never finer than 1 mm, the smallest marks on a real ruler.
  const minors = minor >= 1 && minor * scale >= 4 ? Array.from({ length: Math.round(total / minor) + 1 }, (_, i) => i * minor).filter((m) => m % major !== 0) : [];

  // Zoom effect: the marks start at the old scale and settle at the new one.
  useLayoutEffect(() => {
    const g = ticks.current;
    if (!g || previous.current === total) return;
    const from = previous.current / total;
    previous.current = total;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('reduce-motion')) return;
    g.style.transition = 'none';
    g.style.transform = `scaleX(${Math.min(Math.max(1 / from, 0.2), 5)})`;
    void g.getBoundingClientRect();
    g.style.transition = 'transform 450ms ease-out';
    g.style.transform = 'scaleX(1)';
  }, [total]);

  const readings = LENGTH.map((u) => ({ u, text: formatDecimal(mmIn(u, total)) }));

  return (
    <section aria-labelledby="ruler-title" className="border-t border-white/10 pt-5">
      <h3 id="ruler-title" className="font-fraunces text-lg font-semibold text-white">Zoom the ruler</h3>
      <p className="mt-1 text-sm text-slate-300">Zoom from 10 kilometres down to 1 centimetre. The marks change unit as you go.</p>

      <svg
        ref={labelsRef}
        viewBox={`0 0 ${RW} ${RH}`}
        className="mt-3 w-full rounded-2xl bg-black/25 ring-1 ring-white/10"
        role="img"
        aria-label={`A ruler ${readings[LENGTH.indexOf(unit)].text} ${unit.plural} long, with big marks every ${formatDecimal(mmIn(unit, major))} ${unit.symbol}.`}
      >
        <rect x={PAD - 8} y="18" width={RW - 2 * PAD + 16} height="58" rx="6" fill="#fef3c7" fillOpacity="0.08" stroke="#fef3c7" strokeOpacity="0.35" />
        <g ref={ticks} style={{ transformOrigin: `${PAD}px 0`, transformBox: 'view-box' }}>
          {minors.map((m) => (
            <line key={`n${m}`} x1={PAD + m * scale} x2={PAD + m * scale} y1="18" y2="34" stroke="#e2e8f0" strokeOpacity="0.55" strokeWidth="1.2" />
          ))}
          {majors.map((m) => (
            <line key={`j${m}`} x1={PAD + m * scale} x2={PAD + m * scale} y1="18" y2="48" stroke={unit.colour} strokeWidth="2.4" />
          ))}
        </g>
        <g fontSize="14" fontWeight="600" textAnchor="middle">
          {majors.map((m, i) => (
            <text key={`t${m}`} x={PAD + m * scale} y="66" fill="#f8fafc" className="measures-fade" textAnchor={i === 0 ? 'start' : i === majors.length - 1 ? 'end' : 'middle'}>
              {i === majors.length - 1 || i % (majors.length > 8 ? 2 : 1) === 0 ? formatDecimal(mmIn(unit, m)) : ''}
            </text>
          ))}
        </g>
        <text x={RW / 2} y="100" textAnchor="middle" fontSize="15" fontWeight="700" fill={unit.colour}>
          marks labelled in {unit.plural}
        </text>
      </svg>

      <label className="mt-4 block text-sm text-slate-200">
        <span className="flex justify-between gap-3">
          <span>Zoom out ← → zoom in</span>
          <span className="font-semibold text-white">{readings[LENGTH.indexOf(unit)].text} {unit.symbol} long</span>
        </span>
        <input
          type="range"
          min={0}
          max={STOPS_MM.length - 1}
          step={1}
          value={stop}
          aria-label="Zoom"
          aria-valuetext={`${readings[LENGTH.indexOf(unit)].text} ${unit.plural}`}
          onChange={(e) => { setStop(Number(e.target.value)); onUse(); }}
          className="mt-2 w-full cursor-pointer accent-[#f6c453]"
        />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {readings.map(({ u, text }) => (
          <div key={u.symbol} className="rounded-lg bg-white/[0.05] px-3 py-2 ring-1 ring-white/10" style={{ boxShadow: u === unit ? `inset 0 0 0 2px ${u.colour}` : undefined }}>
            <div className="text-xs text-slate-400">The ruler in {u.plural}</div>
            <div className="font-semibold" style={{ color: u.colour }}>{text} {u.symbol}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** The model for the Measures lesson: a metric ladder and a zooming ruler. It pauses while a quiz question is in progress. */
export default function MeasuresModel() {
  const onUse = useOnce('measures_model_used');
  const paused = useQuizActive((s) => !!s.active.measures);

  return (
    <figure className="night-window overflow-hidden rounded-3xl p-4 shadow-[0_30px_60px_-20px_rgba(11,16,38,0.55)] sm:p-6">
      <figcaption className="font-fraunces text-xl font-semibold text-white">Try it</figcaption>
      {paused && (
        <p className="mt-4 rounded-xl bg-amber-400/10 px-4 py-3 text-sm text-amber-100 ring-1 ring-amber-300/30" role="status">
          The ladder and ruler are paused while you answer a quiz question. They come back when you finish it.
        </p>
      )}
      {/* Kept mounted while paused, so your place on the ladder is still there afterwards. */}
      <div className="mt-4 space-y-5" hidden={paused}>
        <MetricLadder onUse={onUse} />
        <ZoomRuler onUse={onUse} />
        <p className="text-xs text-slate-400">Each unit keeps its colour everywhere in this lesson: kilo green, metres, grams and litres blue, centi amber, milli pink.</p>
      </div>
    </figure>
  );
}
