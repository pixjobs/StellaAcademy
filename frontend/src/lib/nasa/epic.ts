/* eslint-disable no-console */
// src/lib/nasa/epic.ts
//
// Robust EPIC v2 client: supports natural/enhanced/cloud/aerosol,
// fetches available dates, per-date metadata (with caption/coords),
// and builds correct archive URLs (jpg, png, or thumbs).
//
// No API key required when using epic.gsfc.nasa.gov. (The api.nasa.gov
// mirror works too if you need CORS in the browser.)

export type EpicKind = 'natural' | 'enhanced' | 'cloud' | 'aerosol';

type EpicMeta = {
  image: string;        // base file name (e.g., "epic_1b_20161031074844")
  date: string;         // ISO timestamp
  caption?: string;     // human-readable description
  centroid_coordinates?: { lat: number; lon: number };
  dscovr_j2000_position?: unknown;
  lunar_j2000_position?: unknown;
  sun_j2000_position?: unknown;
  attitude_quaternions?: unknown;
};

const EPIC_BASE = process.env.EPIC_BASE_URL?.trim() || 'https://epic.gsfc.nasa.gov';
const FETCH_TIMEOUT_MS = Number(process.env.EPIC_TIMEOUT_MS ?? 8000);

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function withTimeout<T>(p: Promise<T>, ms: number, tag: string): Promise<T> {
  let t: NodeJS.Timeout | null = null;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error(`${tag} timed out after ${ms}ms`)), ms);
    (t as unknown as { unref?: () => void }).unref?.();
  });
  return Promise.race([p, timeout]).finally(() => t && clearTimeout(t));
}

async function safeJson<T>(url: string, tag: string): Promise<T | null> {
  try {
    const res = await withTimeout(fetch(url, { cache: 'no-store' }), FETCH_TIMEOUT_MS, tag);
    if (!res.ok) {
      console.warn(`[epic] ${tag} HTTP ${res.status} for ${url}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[epic] ${tag} failed:`, e instanceof Error ? e.message : e);
    return null;
  }
}

export async function listEpicAvailableDates(kind: EpicKind): Promise<string[]> {
  const url = `${EPIC_BASE}/api/${kind}/available`;
  const data = await safeJson<string[]>(url, `available:${kind}`);
  return Array.isArray(data) ? data : [];
}

export async function fetchEpicByDate(kind: EpicKind, dateYYYYMMDD: string): Promise<EpicMeta[]> {
  const url = `${EPIC_BASE}/api/${kind}/date/${dateYYYYMMDD}`;
  const arr = await safeJson<EpicMeta[]>(url, `byDate:${kind}:${dateYYYYMMDD}`);
  return Array.isArray(arr) ? arr : [];
}

export function buildEpicArchiveUrl(
  kind: EpicKind,
  iso: string,     // from meta.date
  imageBase: string,
  type: 'jpg' | 'png' | 'thumbs' = 'jpg',
): string {
  // iso => YYYY-MM-DD
  const d = new Date(iso);
  const yyyy = String(d.getUTCFullYear());
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const file =
    type === 'png'
      ? `${imageBase}.png`
      : `${imageBase}.jpg`; // thumbs are .jpg with same base

  return `${EPIC_BASE}/archive/${kind}/${yyyy}/${mm}/${dd}/${type}/${file}`;
}

export function pickSeeded<T>(arr: T[], count: number, seed = 0): T[] {
  if (!Array.isArray(arr) || arr.length === 0 || count <= 0) return [];
  const out: T[] = [];
  let s = seed >>> 0;
  for (let i = 0; i < arr.length && out.length < count; i += 1) {
    s ^= (s << 13); s ^= (s >>> 17); s ^= (s << 5); // xorshift32
    const idx = Math.abs(s) % arr.length;
    const pick = arr[idx];
    if (!out.includes(pick)) out.push(pick);
  }
  return out;
}

export type EpicRichItem = {
  kind: EpicKind;
  date: string;           // ISO
  href: string;           // archive jpg (or thumbs/png if you choose)
  caption?: string;       // EPIC caption from API, if present
  lat?: number;
  lon?: number;
};

export type FetchEpicRichOpts = {
  kinds: EpicKind[];         // ['natural','enhanced','cloud','aerosol']
  preferRecent?: boolean;    // true = bias newest dates
  sampleDatesPerKind?: number; // how many distinct dates to sample
  itemsPerDate?: number;     // cap per date
  seed?: number;             // selection seed to reduce duplicates
  imageType?: 'jpg' | 'png' | 'thumbs';
};

export async function fetchEpicRich(opts: FetchEpicRichOpts): Promise<EpicRichItem[]> {
  const {
    kinds,
    preferRecent = true,
    sampleDatesPerKind = 2,
    itemsPerDate = 4,
    seed = Date.now() >>> 0,
    imageType = 'jpg',
  } = opts;

  const all: EpicRichItem[] = [];
  for (const kind of kinds) {
    const dates = await listEpicAvailableDates(kind);
    if (dates.length === 0) {
      console.warn(`[epic] No available dates for ${kind}`);
      continue;
    }

    const sorted = [...dates].sort((a, b) => (preferRecent ? b.localeCompare(a) : a.localeCompare(b)));
    const datePicks = pickSeeded(sorted, sampleDatesPerKind, seed ^ kind.length);

    for (const d of datePicks) {
      const metas = await fetchEpicByDate(kind, d);
      if (!Array.isArray(metas) || metas.length === 0) {
        console.warn(`[epic] No metadata for ${kind} @ ${d}`);
        continue;
      }

      const picks = pickSeeded(metas, itemsPerDate, seed ^ d.length);
      for (const m of picks) {
        if (!m?.image || !m?.date) continue;
        const href = buildEpicArchiveUrl(kind, m.date, m.image, imageType);
        all.push({
          kind,
          date: m.date,
          href,
          caption: m.caption?.trim(),
          lat: m.centroid_coordinates?.lat,
          lon: m.centroid_coordinates?.lon,
        });
      }

      // Tiny pause to be kind to the API (and help avoid rate spikes)
      await sleep(60);
    }
  }

  // De-dupe by href
  const seen = new Set<string>();
  const unique = all.filter((x) => {
    if (seen.has(x.href)) return false;
    seen.add(x.href);
    return true;
  });

  if (unique.length === 0) {
    console.warn('[epic] fetchEpicRich returned 0 items across all kinds.');
  } else {
    console.log(`[epic] fetchEpicRich -> ${unique.length} items (kinds=${kinds.join(',')})`);
  }

  return unique;
}
