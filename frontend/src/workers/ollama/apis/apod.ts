/* eslint-disable no-console */

import { fetchJson } from './http';
import type { ApodItem } from '@/types/llm'; // Assuming ApodItem is your canonical type
import { logger } from '../utils/logger';

const APOD_ROOT = 'https://api.nasa.gov/planetary/apod';

/**
 * Normalizes the raw response from the APOD API into the ApodItem format.
 * This includes creating a useful `bgUrl` for UI backgrounds.
 * @param raw The raw response object from the NASA API.
 * @returns A normalized ApodItem object.
 */
function normalizeApod(raw: Record<string, any>): ApodItem {
  const bgUrl =
    raw.media_type === 'image'
      ? raw.hdurl || raw.url
      : raw.thumbnail_url || raw.url;

  return {
    date: raw.date,
    title: raw.title,
    explanation: raw.explanation,
    url: raw.url,
    hdurl: raw.hdurl,
    bgUrl: bgUrl ?? undefined,
    copyright: raw.copyright,
    media_type: raw.media_type,
  };
}

/**
 * Fetches the Astronomy Picture of the Day for a specific date or the latest if no date is provided.
 *
 * @param apiKey The NASA API key to use for the request.
 * @param date An optional date string in YYYY-MM-DD format.
 * @returns A promise that resolves to the normalized APOD item.
 * @throws {HttpError} If the network request fails.
 */
export async function fetchAPOD(apiKey: string, date?: string): Promise<ApodItem> {
  const params = new URLSearchParams({ thumbs: 'true' });
  if (date) {
    params.set('date', date);
  }
  const url = `${APOD_ROOT}?${params.toString()}`;
  logger.debug('Fetching APOD for date:', date || 'latest');

  try {
    // Pass the apiKey down to the fetch utility. fetchJson will throw on non-2xx responses.
    const raw = await fetchJson<Record<string, any>>(url, { apiKey });
    return normalizeApod(raw);
  } catch (e) {
    // Log the error but re-throw it so the calling function (e.g., in a retry block)
    // knows that the request failed and can act accordingly.
    logger.error('[apod] fetch failed:', e);
    throw e;
  }
}

/**
 * Thin wrapper to fetch the latest APOD, for backward compatibility.
 * @param apiKey The NASA API key.
 * @returns A promise that resolves to the APOD item.
 */
export async function getApod(apiKey: string): Promise<ApodItem> {
  return fetchAPOD(apiKey);
}