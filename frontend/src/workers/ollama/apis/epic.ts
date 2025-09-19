/* eslint-disable no-console */

/**
 * EPIC (Earth Polychromatic Imaging Camera) client
 * - GSFC API is the primary (no key, historically more stable)
 * - api.nasa.gov mirror is a single-shot fallback (key used only there)
 * - Dates handled as YYYY-MM-DD strings (no JS Date parsing to avoid TZ drift)
 * - Archive links default to GSFC (no key required)
 */

import { fetchJson } from './http';
import { logger } from '../utils/logger';

/* ─────────────────────────────────────────────────────────
   Types
────────────────────────────────────────────────────────── */

export type EpicKind = 'natural' | 'enhanced' | 'aerosol' | 'cloud';
export type EpicImageType = 'jpg' | 'png' | 'thumbs';

export interface EpicMeta {
  identifier?: string;
  image: string;
  caption?: string;
  date: string; // ISO
  centroid_coordinates?: { lat?: number; lon?: number };
  // (other fields not used here)
}

export interface EpicRichItem {
  kind: EpicKind;
  date: string; // YYYY-MM-DD
  href: string; // direct archive image URL
  caption?: string;
  lat?: number;
  lon?: number;
}

export type FetchEpicRichOpts = {
  kinds: EpicKind[];
  /** If true, pick from the most recent dates; otherwise sample from all. */
  preferRecent?: boolean;
  /** Number of dates to sample per kind (clamped 1..10). */
  sampleDatesPerKind?: number;
  /** Items per chosen date (clamped 1..20). */
  itemsPerDate?: number;
  /** RNG seed for variety/dedupe resilience. */
  seed?: number;
  /** 'jpg' | 'png' | 'thumbs' */
  imageType?: EpicImageType;
  /**
   * How many past days (from the "available" dates list) to consider.
   * The API returns a full history; we cap it to reduce failures/latency.
   * Default: 10.
   */
  recentWindowDays?: number;
};

/* ─────────────────────────────────────────────────────────
   Constants & helpers
────────────────────────────────────────────────────────── */

const HOST_API_GSFC = 'https://epic.gsfc.nasa.gov/api';
const HOST_ARCHIVE_GSFC = 'https://epic.gsfc.nasa.gov/archive';
const HOST_API_NASA = 'https://api.nasa.gov/EPIC/api';
// We intentionally do NOT use the NASA archive mirror by default.
// The GSFC archive works without a key and is generally stable.

type AvailableDate = string | { date: string };

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Keep dates as YYYY-MM-DD; accept 'YYYY-MM-DD...' or {date: '...'} */
function normalizeDateEntry(x: AvailableDate): string | null {
  if (typeof x === 'string') {
    const s = x.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
  }
  if (x && typeof x === 'object' && typeof (x as { date?: unknown }).date === 'string') {
    const s = (x as { date: string }).date.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
  }
  return null;
}

/** Shuffle with a tiny seeded RNG (Mulberry32-ish) */
function seededShuffle<T>(arr: T[], seed = 1): T[] {
  let s = (seed >>> 0) || 1;
  const rand = () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Slices the last N days from an already-sorted list of YYYY-MM-DD strings. */
function lastNDays(datesAsc: string[], n: number): string[] {
  if (n <= 0) return [];
  const count = Math.min(n, datesAsc.length);
  return datesAsc.slice(-count);
}

/* ─────────────────────────────────────────────────────────
   Archive URL builder (GSFC archive by default)
────────────────────────────────────────────────────────── */

export function buildArchiveHref(
  kind: EpicKind,
  dateIso: string,      // expects 'YYYY-MM-DD' or ISO with date first
  baseName: string,     // e.g. 'epic_1b_20151031074844'
  imageType: EpicImageType,
  // NOTE: apiKey intentionally unused here; we keep archive on GSFC.
): string {
  // Avoid Date() to prevent timezone surprises; split the ISO date.
  const yyyy = dateIso.slice(0, 4);
  const mm = dateIso.slice(5, 7);
  const dd = dateIso.slice(8, 10);

  const ext = imageType === 'png' ? 'png' : 'jpg';
  const dirType = imageType === 'thumbs' ? 'thumbs' : ext;

  return `${HOST_ARCHIVE_GSFC}/${kind}/${yyyy}/${mm}/${dd}/${dirType}/${baseName}.${ext}`;
}

/* ─────────────────────────────────────────────────────────
   Low-level API helpers (GSFC-first, NASA mirror as fallback)
────────────────────────────────────────────────────────── */

async function fetchJsonGsfc<T>(path: string): Promise<T> {
  const url = `${HOST_API_GSFC}/${path}`;
  logger.debug(`[epic][GSFC] GET ${url}`);
  return fetchJson<T>(url);
}

async function fetchJsonNasa<T>(path: string, apiKey?: string): Promise<T> {
  if (!apiKey) throw new Error('NASA API key required for mirror call');
  const url = `${HOST_API_NASA}/${path}`;
  logger.debug(`[epic][NASA] GET ${url}`);
  // http.fetchJson will append ?api_key=... for api.nasa.gov hosts when apiKey is provided
  return fetchJson<T>(url, { apiKey });
}

/**
 * Get `/available` dates with GSFC primary; single NASA mirror fallback.
 * Returns ascending YYYY-MM-DD list.
 */
async function getAvailableDates(kind: EpicKind, apiKey?: string): Promise<string[]> {
  const path = `${kind}/available`;
  try {
    const arr = await fetchJsonGsfc<AvailableDate[]>(path);
    const dates = Array.isArray(arr)
      ? arr.map(normalizeDateEntry).filter((d): d is string => !!d)
      : [];
    return dates.sort();
  } catch (e) {
    logger.warn('[epic] GSFC /available failed; trying NASA mirror once', e);
  }
  try {
    const arr = await fetchJsonNasa<AvailableDate[]>(path, apiKey);
    const dates = Array.isArray(arr)
      ? arr.map(normalizeDateEntry).filter((d): d is string => !!d)
      : [];
    return dates.sort();
  } catch (e) {
    logger.warn('[epic] NASA mirror /available failed', e);
    return [];
  }
}

/**
 * Get `/date/{YYYY-MM-DD}` items with GSFC primary; single NASA mirror fallback.
 */
export async function epicByDate(kind: EpicKind, date: string, apiKey?: string): Promise<EpicMeta[]> {
  const ymd = String(date).slice(0, 10);
  const path = `${kind}/date/${ymd}`;
  try {
    const metas = await fetchJsonGsfc<EpicMeta[]>(path);
    return Array.isArray(metas) ? metas : [];
  } catch (e) {
    logger.warn(`[epic] GSFC byDate failed (${kind}/${ymd}); trying NASA mirror once`, e);
  }
  try {
    const metas = await fetchJsonNasa<EpicMeta[]>(path, apiKey);
    return Array.isArray(metas) ? metas : [];
  } catch (e) {
    logger.warn('[epic] NASA mirror byDate failed', e);
    return [];
  }
}

/**
 * Public helper: available dates (ascending).  Kept exported for callers that need it.
 */
export async function epicAvailableDates(kind: EpicKind, apiKey?: string): Promise<string[]> {
  return getAvailableDates(kind, apiKey);
}

export async function epicLatest(kind: EpicKind, apiKey?: string): Promise<EpicMeta[]> {
  const path = `${kind}`;
  try {
    const metas = await fetchJsonGsfc<EpicMeta[]>(path);
    return Array.isArray(metas) ? metas : [];
  } catch (e) {
    logger.warn(`[epic] GSFC latest failed (${kind}); trying NASA mirror once`, e);
  }
  try {
    const metas = await fetchJsonNasa<EpicMeta[]>(path, apiKey);
    return Array.isArray(metas) ? metas : [];
  } catch (e) {
    logger.warn('[epic] NASA mirror latest failed', e);
    return [];
  }
}

/* ─────────────────────────────────────────────────────────
   High-level: rich sampler
────────────────────────────────────────────────────────── */

export async function fetchEpicRich(opts: FetchEpicRichOpts, apiKey?: string): Promise<EpicRichItem[]> {
  const {
    kinds,
    preferRecent = true,
    sampleDatesPerKind = 2,
    itemsPerDate = 6,
    seed = Date.now(),
    imageType = 'jpg',
    recentWindowDays = 10,
  } = opts;

  const clampedSample = Math.max(1, Math.min(sampleDatesPerKind, 10));
  const clampedItems  = Math.max(1, Math.min(itemsPerDate, 20));
  const clampedWindow = Math.max(1, Math.min(recentWindowDays, 60));

  const out: EpicRichItem[] = [];
  const seenHref = new Set<string>();

  for (const kind of kinds) {
    let allDates: string[] = [];
    try {
      allDates = await getAvailableDates(kind, apiKey);
    } catch (e) {
      logger.warn(`[epic] failed to get dates for ${kind}`, e);
    }

    // Choose dates (or none if the API is down)
    const targetPool =
      preferRecent && allDates.length
        ? lastNDays(allDates, clampedWindow)
        : allDates;

    const chosenDates =
      targetPool.length <= clampedSample
        ? targetPool
        : seededShuffle(targetPool, seed ^ (kind.length * 0x9e3779b1)).slice(0, clampedSample);

    let addedForKind = 0;

    // 1) Try by-date path (preferred)
    for (const date of chosenDates) {
      const metas = await epicByDate(kind, date, apiKey);
      if (!metas?.length) continue;

      for (const m of metas.slice(0, clampedItems)) {
        const ymd = String(m.date ?? '').slice(0, 10);
        if (!m.image || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) continue;

        const href = buildArchiveHref(kind, ymd, m.image, imageType);
        if (seenHref.has(href)) continue;

        seenHref.add(href);
        out.push({
          kind,
          date: ymd,
          href,
          caption: m.caption,
          lat: m.centroid_coordinates?.lat,
          lon: m.centroid_coordinates?.lon,
        });
        addedForKind += 1;
      }
    }

    // 2) Fallback to "latest" if by-date yielded nothing
    if (addedForKind === 0) {
      const latest = await epicLatest(kind, apiKey);
      if (latest?.length) {
        for (const m of latest.slice(0, clampedItems)) {
          const ymd = String(m.date ?? '').slice(0, 10);
          if (!m.image || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) continue;

          const href = buildArchiveHref(kind, ymd, m.image, imageType);
          if (seenHref.has(href)) continue;

          seenHref.add(href);
          out.push({
            kind,
            date: ymd,
            href,
            caption: m.caption,
            lat: m.centroid_coordinates?.lat,
            lon: m.centroid_coordinates?.lon,
          });
        }
      } else {
        logger.warn(`[epic] no data via by-date or latest for kind=${kind}`);
      }
    }
  }

  return out;
}