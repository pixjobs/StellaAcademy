'use client';

import { useRef, useState } from 'react';
import { track } from '@/lib/track';

type Prefix = { symbol: string; name: string; power: number };

const PREFIXES: Prefix[] = [
  { symbol: 'G', name: 'giga', power: 9 },
  { symbol: 'M', name: 'mega', power: 6 },
  { symbol: 'k', name: 'kilo', power: 3 },
  { symbol: '', name: 'no prefix', power: 0 },
  { symbol: 'c', name: 'centi', power: -2 },
  { symbol: 'm', name: 'milli', power: -3 },
  { symbol: 'μ', name: 'micro', power: -6 },
  { symbol: 'n', name: 'nano', power: -9 },
];

const UNITS = [
  { symbol: 'm', name: 'metres' },
  { symbol: 'A', name: 'amperes' },
  { symbol: 'Hz', name: 'hertz' },
  { symbol: 'W', name: 'watts' },
  { symbol: 'g', name: 'grams' },
];

const SUPERSCRIPT: Record<string, string> = {
  '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};
const sup = (n: number) => String(n).split('').map((c) => SUPERSCRIPT[c] ?? c).join('');

/** A plain decimal, with long runs of digits split into threes by thin spaces (the SI convention). */
function plain(value: number): string {
  if (value === 0) return '0';
  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  const decimals = Math.min(Math.max(0, 9 - magnitude), 20);
  let [whole, fraction = ''] = value.toFixed(decimals).split('.');
  fraction = fraction.replace(/0+$/, '');
  // Four digits stay together (3200, 0.0975); longer runs are split into threes.
  if (whole.replace('-', '').length > 4) whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
  if (fraction.length > 4) fraction = fraction.replace(/(\d{3})(?=\d)/g, '$1\u2009');
  return fraction ? `${whole}.${fraction}` : whole;
}

/** a × 10ⁿ with 1 ≤ a < 10. */
function standardForm(value: number): string {
  if (value === 0) return '0';
  const [mantissa, exponent] = value.toExponential(9).split('e');
  const a = String(Number(mantissa));
  const n = Number(exponent);
  return n === 0 ? a : `${a} × 10${sup(n)}`;
}

function PrefixRow({ label, value, onChange, unit, options }: { label: string; value: string; onChange: (name: string) => void; unit: string; options: Prefix[] }) {
  return (
    <div>
      <div className="text-sm text-slate-300">{label}</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((p) => (
          <button
            key={p.name}
            type="button"
            aria-pressed={p.name === value}
            title={`${p.name}${p.power ? `, 10 to the power ${p.power}` : ''}`}
            onClick={() => onChange(p.name)}
            className={`min-w-[3.1rem] rounded-lg border px-2 py-1.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
              p.name === value
                ? 'border-cyan-300 bg-cyan-400/20 text-white'
                : 'border-white/15 bg-white/[0.04] text-slate-300 hover:border-white/35 hover:text-white'
            }`}
          >
            {p.symbol}
            {unit}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The model for the Converting Units lesson: change the prefix and watch the number and its power of ten respond. */
export default function UnitConverter() {
  const [text, setText] = useState('97.5');
  const [unit, setUnit] = useState(2); // Hz
  const [from, setFrom] = useState('mega');
  const [to, setTo] = useState('no prefix');
  const [kmh, setKmh] = useState(72);
  const used = useRef(false);

  const touch = () => {
    if (used.current) return;
    used.current = true;
    track('unit_converter_used');
  };

  const value = Number(text.replace(',', '.'));
  const valid = text.trim() !== '' && Number.isFinite(value);
  const u = UNITS[unit].symbol;
  // Centimetres are everyday; centi-anything-else is not, so only offer it for lengths.
  const options = PREFIXES.filter((p) => p.name !== 'centi' || u === 'm');
  const fromPrefix = options.find((p) => p.name === from) ?? PREFIXES[3];
  const toPrefix = options.find((p) => p.name === to) ?? PREFIXES[3];
  const shift = fromPrefix.power - toPrefix.power;
  // Build the result from the decimal string so 97.5 × 10⁶ is exactly 97 500 000, not 97 499 999.99…
  const asText = String(value);
  const result = !valid ? NaN : asText.includes('e') ? value * 10 ** shift : Number(`${asText}e${shift}`);
  const fromUnit = `${fromPrefix.symbol}${u}`;
  const toUnit = `${toPrefix.symbol}${u}`;

  let explanation: string;
  if (shift === 0) explanation = 'Same prefix on both sides, so the number does not change.';
  else if (shift > 0)
    explanation = `${toUnit} is a smaller unit than ${fromUnit}, so the number gets bigger: multiply by 10${sup(shift)} (move the decimal point ${shift} place${shift === 1 ? '' : 's'} to the right).`;
  else
    explanation = `${toUnit} is a bigger unit than ${fromUnit}, so the number gets smaller: divide by 10${sup(-shift)} (move the decimal point ${-shift} place${shift === -1 ? '' : 's'} to the left).`;

  const ms = kmh / 3.6;

  return (
    <div className="space-y-5 text-slate-100">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <label className="block text-sm text-slate-300">
          Number
          <input
            inputMode="decimal"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              touch();
            }}
            aria-invalid={!valid}
            className="mt-1.5 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-lg font-semibold text-white focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
          />
        </label>
        <label className="block text-sm text-slate-300">
          Measured in
          <select
            value={unit}
            onChange={(e) => {
              setUnit(Number(e.target.value));
              touch();
            }}
            className="mt-1.5 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2.5 text-white focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
          >
            {UNITS.map((x, i) => (
              <option key={x.symbol} value={i}>
                {x.name} ({x.symbol})
              </option>
            ))}
          </select>
        </label>
      </div>

      <PrefixRow label="Convert from" value={fromPrefix.name} onChange={(name) => { setFrom(name); touch(); }} unit={u} options={options} />
      <PrefixRow label="Convert to" value={toPrefix.name} onChange={(name) => { setTo(name); touch(); }} unit={u} options={options} />

      <div className="rounded-xl border border-cyan-300/30 bg-cyan-400/[0.08] p-4" aria-live="polite">
        {valid ? (
          <>
            <p className="font-fraunces text-2xl font-semibold leading-snug text-white">
              {plain(value)} {fromUnit} = {plain(result)} {toUnit}
            </p>
            <p className="mt-1 text-slate-200">
              In standard form: {standardForm(result)} {toUnit}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-200">{explanation}</p>
          </>
        ) : (
          <p className="text-slate-200">Type a number, such as 97.5, to convert it.</p>
        )}
      </div>

      <div className="border-t border-white/10 pt-4">
        <label className="block text-sm text-slate-300">
          <span className="flex justify-between">
            <span>A compound unit: speed</span>
            <span className="font-semibold text-white">{kmh} km/h</span>
          </span>
          <input
            type="range"
            min={0}
            max={130}
            step={1}
            value={kmh}
            onChange={(e) => {
              setKmh(Number(e.target.value));
              touch();
            }}
            className="mt-2 w-full cursor-pointer accent-cyan-300"
          />
        </label>
        <p className="mt-2 text-sm leading-relaxed text-slate-200" aria-live="polite">
          {kmh} km/h = {plain(kmh * 1000)} m ÷ 3600 s = <strong className="text-white">{plain(Number(ms.toFixed(2)))} m/s</strong>
        </p>
      </div>
    </div>
  );
}
