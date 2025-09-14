/* eslint-disable no-console */
import { fetchJson } from './http';

export interface MarsPhoto {
  id: number;
  sol: number;
  img_src: string;
  earth_date: string;
  camera: { id: number; name: string; full_name?: string };
  rover: { id: number; name: string; landing_date?: string; status?: string };
}

type Rover = 'curiosity' | 'opportunity' | 'spirit';

const API_KEY = (process.env.NASA_API_KEY?.trim() || 'DEMO_KEY');

/* ------------------------------- Type guards ------------------------------- */

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function isMarsPhoto(x: unknown): x is MarsPhoto {
  if (!isRecord(x)) return false;
  const cam = isRecord(x.camera) ? x.camera : null;
  const rov = isRecord(x.rover) ? x.rover : null;
  return (
    typeof x.id === 'number' &&
    typeof x.sol === 'number' &&
    typeof x.img_src === 'string' &&
    typeof x.earth_date === 'string' &&
    !!cam && typeof cam.id === 'number' && typeof cam.name === 'string' &&
    !!rov && typeof rov.id === 'number' && typeof rov.name === 'string'
  );
}

function coercePhotos(arr: unknown, limit: number): MarsPhoto[] {
  if (!Array.isArray(arr)) return [];
  const out: MarsPhoto[] = [];
  for (const item of arr) {
    if (isMarsPhoto(item)) out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

/* --------------------------------- Fetchers -------------------------------- */

async function fetchLatestRaw(rover: Rover) {
  const url =
    `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/latest_photos` +
    `?api_key=${encodeURIComponent(API_KEY)}`;
  try {
    return await fetchJson<{ latest_photos?: unknown }>(url);
  } catch (e) {
    console.warn(`[nasa/mars] fetch failed for ${rover}:`, e);
    return { latest_photos: [] };
  }
}

/**
 * Returns latest photos for a rover (validated & truncated).
 * - Never throws; returns [] on failure.
 * - If a retired rover returns none, optionally fall back to Curiosity.
 */
export async function fetchLatestMarsPhotos(
  rover: Rover,
  limit = 50,
  opts?: { fallbackToCuriosity?: boolean },
): Promise<MarsPhoto[]> {
  const { fallbackToCuriosity = true } = opts ?? {};

  const data = await fetchLatestRaw(rover);
  let photos = coercePhotos(data.latest_photos, limit);

  // Some rovers (Opportunity/Spirit) won’t have “latest” shots anymore.
  if (photos.length === 0 && rover !== 'curiosity' && fallbackToCuriosity) {
    const alt = await fetchLatestRaw('curiosity');
    photos = coercePhotos(alt.latest_photos, limit);
  }

  return photos;
}
