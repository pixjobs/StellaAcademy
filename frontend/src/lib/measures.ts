/**
 * Metric units and exact decimal arithmetic for the Measures lesson.
 *
 * Numbers are kept as decimal strings and multiplied by powers of ten by moving the decimal point,
 * so 2.3 km is exactly 2300 m (floating point would give 2299.9999999999995).
 */

export type MeasureKind = 'length' | 'mass' | 'capacity';

export type MetricUnit = {
  symbol: string;
  name: string;
  plural: string;
  /** Power of ten relative to the base unit (metre, gram, litre). */
  power: number;
  /** One colour per prefix, the same everywhere in the lesson: kilo green, base cyan, centi amber, milli rose. */
  colour: string;
};

const KILO = '#34d399';
const BASE = '#22d3ee';
const CENTI = '#fbbf24';
const MILLI = '#fb7185';

export const MEASURES: Record<MeasureKind, { label: string; units: MetricUnit[] }> = {
  length: {
    label: 'Length',
    units: [
      { symbol: 'km', name: 'kilometre', plural: 'kilometres', power: 3, colour: KILO },
      { symbol: 'm', name: 'metre', plural: 'metres', power: 0, colour: BASE },
      { symbol: 'cm', name: 'centimetre', plural: 'centimetres', power: -2, colour: CENTI },
      { symbol: 'mm', name: 'millimetre', plural: 'millimetres', power: -3, colour: MILLI },
    ],
  },
  mass: {
    label: 'Mass',
    units: [
      { symbol: 'kg', name: 'kilogram', plural: 'kilograms', power: 3, colour: KILO },
      { symbol: 'g', name: 'gram', plural: 'grams', power: 0, colour: BASE },
    ],
  },
  capacity: {
    label: 'Capacity',
    units: [
      { symbol: 'l', name: 'litre', plural: 'litres', power: 0, colour: BASE },
      { symbol: 'ml', name: 'millilitre', plural: 'millilitres', power: -3, colour: MILLI },
    ],
  },
};

/** A decimal written as its digits and the place value of the first one. `neg` marks a negative number (quizzes only). */
export type Digits = { digits: string; top: number; neg?: boolean };

/** Parses "2.5", "0.005", "8,849" or "3500" into significant digits; null if it is not a non-negative decimal. */
export function parseDecimal(text: string): Digits | null {
  const raw = text.trim();
  // Commas only between groups of three: 1,234 and 2,500,000, not 1,2,3.
  if (raw.includes(',') && !/^\d{1,3}(,\d{3})+(\.\d*)?$/.test(raw)) return null;
  const t = raw.replace(/,/g, '');
  if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  const [whole, fraction = ''] = t.split('.');
  const all = (whole + fraction).replace(/^0+/, '');
  if (!all) return { digits: '0', top: 0 };
  const lead = (whole + fraction).length - all.length;
  const digits = all.replace(/0+$/, '') || '0';
  return { digits, top: whole.length - 1 - lead };
}

/** Multiplies by 10 to the power `places`, exactly. */
export function shift(d: Digits, places: number): Digits {
  return d.digits === '0' ? d : { digits: d.digits, top: d.top + places };
}

/** Place value of the last significant digit. */
export function bottom(d: Digits): number {
  return d.top - d.digits.length + 1;
}

/** The digit in the place with value 10^place (0 where there is none). */
export function digitAt(d: Digits, place: number): number {
  const i = d.top - place;
  return i >= 0 && i < d.digits.length ? Number(d.digits[i]) : 0;
}

/** Plain decimal text with commas between groups of three from 1,000 up, as in UK primary schools: 2,500,000 and 0.005. */
export function formatDecimal(d: Digits): string {
  if (d.digits === '0') return '0';
  const hi = Math.max(d.top, 0);
  const lo = Math.min(bottom(d), 0);
  let whole = '';
  let fraction = '';
  for (let p = hi; p >= lo; p--) {
    if (p >= 0) whole += digitAt(d, p);
    else fraction += digitAt(d, p);
  }
  whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (d.neg ? '−' : '') + (fraction ? `${whole}.${fraction}` : whole);
}

/** 10^n as text with commas: 1,000 or 1,000,000. */
export function powerOfTen(n: number): string {
  return formatDecimal({ digits: '1', top: n });
}
