/* eslint-disable no-console */

import { fetchJson } from './http';
import type { MarsPhoto } from '@/types/mission'; // Assuming this is the canonical location now
import { logger } from '../utils/logger';

const MARS_ROOT = 'https://api.nasa.gov/mars-photos/api/v1';

export type Rover = 'curiosity' | 'opportunity' | 'spirit';

interface MarsApiResponse {
  latest_photos?: unknown;
}

// --- Validation and Coercion Helpers (Preserved from original) ---

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
  // Prefer HTTPS for known NASA domains
  for (const p of out) {
    try {
      const u = new URL(p.img_src);
      if (u.protocol === 'http:' && /(^|\.)nasa\.gov$/i.test(u.hostname)) {
        u.protocol = 'https:';
        p.img_src = u.toString();
      }
    } catch { /* ignore bad URLs */ }
  }
  return out;
}

// --- Patched API Fetching Logic ---

/**
 * Fetches the raw 'latest_photos' data for a given rover.
 * @param rover The name of the rover.
 * @param apiKey The NASA API key.
 * @returns The raw API response.
 * @throws {HttpError} If the network request fails.
 */
async function fetchLatestRaw(rover: Rover, apiKey: string): Promise<MarsApiResponse> {
  const url = `${MARS_ROOT}/rovers/${rover}/latest_photos`;
  logger.debug(`Fetching latest Mars photos for: ${rover}`);
  try {
    // Pass the apiKey down to the robust fetchJson utility
    return await fetchJson<MarsApiResponse>(url, { apiKey });
  } catch (e) {
    logger.error(`[mars] fetch failed for ${rover}:`, e);
    // Re-throw to allow retry logic to catch it
    throw e;
  }
}

/**
 * Returns latest photos for a rover (validated & truncated).
 *
 * @param rover The rover to query.
 * @param apiKey The NASA API key to use for all requests.
 * @param limit The maximum number of photos to return.
 * @param opts Options, including whether to fall back to Curiosity for retired rovers.
 * @returns A promise that resolves to an array of MarsPhoto objects.
 * @throws {HttpError} If network requests fail.
 */
export async function fetchLatestMarsPhotos(
  rover: Rover,
  apiKey: string,
  limit = 50,
  opts?: { fallbackToCuriosity?: boolean },
): Promise<MarsPhoto[]> {
  const { fallbackToCuriosity = true } = opts ?? {};
  const data = await fetchLatestRaw(rover, apiKey);
  let photos = coercePhotos(data.latest_photos, limit);

  // Preserve the fallback logic
  if (photos.length === 0 && rover !== 'curiosity' && fallbackToCuriosity) {
    logger.info(`[mars] No photos for ${rover}, falling back to Curiosity.`);
    const alt = await fetchLatestRaw('curiosity', apiKey);
    photos = coercePhotos(alt.latest_photos, limit);
  }
  return photos;
}