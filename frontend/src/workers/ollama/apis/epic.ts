/* eslint-disable no-console */
// workers/ollama/apis/epic.ts
import { fetchJson } from './http';

export type EpicKind = 'natural' | 'enhanced' | 'aerosol' | 'cloud';
export type EpicImageType = 'jpg' | 'png' | 'thumbs';

export interface EpicMeta {
  identifier?: string;
  image: string;                 // base name (no extension)
  caption?: string;
  date: string;                  // ISO
  centroid_coordinates?: { lat?: number; lon?: number };
  dscovr_j2000_position?: unknown;
  lunar_j2000_position?: unknown;
  sun_j2000_position?: unknown;
  attitude_quaternions?: unknown;
}

export interface EpicRichItem {
  kind: EpicKind;
  date: string;                  // ISO
  href: string;                  // built archive URL
  caption?: string;
  lat?: number;
  lon?: number;
}

export type FetchEpicRichOpts = {
  kinds: EpicKind[];
  preferRecent?: boolean;
  sampleDatesPerKind?: number;   // default 2
  itemsPerDate?: number;         // default 6
  seed?: number;                 // for pseudo-random sampling
  imageType?: EpicImageType;     // 'jpg' | 'png' | 'thumbs' (thumbs always jpg)
};

const API_KEY = process.env.NASA_API_KEY?.trim();
const USE_MIRROR = !!API_KEY; // api.nasa.gov mirror needs key; GSFC doesn’t
const HOST_API = USE_MIRROR ? 'https://api.nasa.gov/EPIC/api' : 'https://epic.gsfc.nasa.gov/api';
const HOST_ARCHIVE = USE_MIRROR ? 'https://api.nasa.gov/EPIC/archive' : 'https://epic.gsfc.nasa.gov/archive';

// --- HELPER TYPE FOR THE FIX ---
// The NASA API returns an array of objects, not an array of strings.
type ApiDateEntry = { date: string };

function seededShuffle<T>(arr: T[], seed = 1): T[] {
  // Mulberry32 PRNG
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

export function buildArchiveHref(
  kind: EpicKind,
  dateIso: string,
  baseName: string,
  imageType: EpicImageType,
): string {
  const d = new Date(dateIso);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');

  const dirType = imageType === 'thumbs' ? 'thumbs' : imageType; // thumbs are jpgs
  const ext = imageType === 'png' ? 'png' : 'jpg';
  const key = USE_MIRROR && API_KEY ? `?api_key=${encodeURIComponent(API_KEY)}` : '';

  return `${HOST_ARCHIVE}/${kind}/${yyyy}/${mm}/${dd}/${dirType}/${baseName}.${ext}${key}`;
}

// --- FIXED FUNCTION ---
// This function was incorrectly assuming the API returned string[].
// It now correctly handles the { date: string }[] structure.
async function listAvailableDates(kind: EpicKind): Promise<string[]> {
  const key = USE_MIRROR && API_KEY ? `?api_key=${encodeURIComponent(API_KEY)}` : '';
  const url = `${HOST_API}/${kind}/available${key}`;
  try {
    const dateEntries = await fetchJson<ApiDateEntry[]>(url);
    // Extract the 'date' string from each object in the array
    return Array.isArray(dateEntries) ? dateEntries.map(entry => entry.date) : [];
  } catch {
    // Fallback for older API versions that might use '/all'
    const alt = `${HOST_API}/${kind}/all${key}`;
    const dateEntries = await fetchJson<ApiDateEntry[]>(alt);
    return Array.isArray(dateEntries) ? dateEntries.map(entry => entry.date) : [];
  }
}

// --- This function is now correct because listAvailableDates provides the right data ---
async function fetchDay(kind: EpicKind, date: string): Promise<EpicMeta[]> {
  const key = USE_MIRROR && API_KEY ? `?api_key=${encodeURIComponent(API_KEY)}` : '';
  // The .slice(0, 10) is important here to trim the time part (e.g., '2025-09-14 12:30:00')
  // from the date string, as the API endpoint requires only 'YYYY-MM-DD'.
  const url = `${HOST_API}/${kind}/date/${date.slice(0, 10)}${key}`;
  const metas = await fetchJson<EpicMeta[]>(url);
  return Array.isArray(metas) ? metas : [];
}

export async function fetchEpicRich(opts: FetchEpicRichOpts): Promise<EpicRichItem[]> {
  const {
    kinds,
    preferRecent = true,
    sampleDatesPerKind = 2,
    itemsPerDate = 6,
    seed = Date.now(),
    imageType = 'jpg',
  } = opts;

  const out: EpicRichItem[] = [];

  for (const kind of kinds) {
    let dates: string[] = [];
    try {
      // This call now correctly returns an array of date strings
      dates = await listAvailableDates(kind);
    } catch (e) {
      console.warn(`[epic] failed to list dates for ${kind}`, e);
      continue;
    }
    if (!Array.isArray(dates) || dates.length === 0) continue;

    const chosenDates = (() => {
      const sorted = [...dates].sort(); // ISO dates sort lexicographically
      const count = Math.max(0, Math.min(sampleDatesPerKind, sorted.length));
      if (count === 0) return [] as string[];
      if (preferRecent) return sorted.slice(-count);
      const shuffled = seededShuffle(sorted, seed ^ kind.length);
      return shuffled.slice(0, count);
    })();

    for (const date of chosenDates) {
      let metas: EpicMeta[] = [];
      try {
        // 'date' is now correctly a string, so this call will succeed
        metas = await fetchDay(kind, date);
      } catch (e) {
        console.warn(`[epic] fetch day failed for ${kind}/${date}`, e);
        continue;
      }
      if (!Array.isArray(metas) || metas.length === 0) continue;

      const subset = metas.slice(0, Math.max(0, Math.min(itemsPerDate, metas.length)));
      for (const m of subset) {
        if (!m?.image || !m?.date) continue;
        const lat = m.centroid_coordinates?.lat;
        const lon = m.centroid_coordinates?.lon;
        const href = buildArchiveHref(kind, m.date, m.image, imageType);
        out.push({ kind, date: m.date, href, caption: m.caption, lat, lon });
      }
    }
  }

  return out;
}