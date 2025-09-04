/**
 * =========================================================================
 * NASA API CLIENT
 *
 * This module is SOLELY responsible for interacting with all NASA APIs.
 * It correctly gets its API key from our central configuration module.
 *
 * All Ollama-related logic has been intentionally removed from this file
 * and now lives in `ollama-client.ts`.
 * =========================================================================
 */

import { getNasaApiKey } from '@/workers/ollama/ollama-client';
import type { MarsPhoto } from '@/types/llm';

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type Apod = {
  date: string;
  title: string;
  explanation: string;
  mediaType: string;
  bgUrl: string | null;
  credit: string;
};

export type NivlItem = {
  nasaId: string;
  title: string;
  description?: string;
  date?: string;
  keywords: string[];
  href: string | null;
};

/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

const REVALIDATE_DAY = 60 * 60 * 24; // 1 day in seconds
const REVALIDATE_HOUR = 60 * 60; // 1 hour in seconds
const TIMEOUT_MS = Number(process.env.NASA_TIMEOUT_MS || 15_000);
const DEBUG = process.env.DEBUG_NASA === '1';

// A set of hostnames that should be automatically upgraded from http to https.
const HTTPS_UPGRADE_HOSTS = new Set([
  'apod.nasa.gov',
  'images-assets.nasa.gov',
  'images.nasa.gov',
  'mars.nasa.gov',
  'epic.gsfc.nasa.gov',
]);

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function log(...args: any[]) {
  if (DEBUG) console.log('[nasa]', ...args);
}
function warn(...args: any[]) {
  console.warn('[nasa]', ...args);
}

/**
 * A wrapper around fetch that includes a timeout.
 */
async function timeoutFetch(url: string, init: RequestInit = {}, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

/**
 * Upgrades a URL from http to https if its hostname is in the trusted set.
 */
function upgradeHttps(u: string | null | undefined): string | null {
  if (!u) return null;
  try {
    const url = new URL(u);
    if (url.protocol === 'http:' && HTTPS_UPGRADE_HOSTS.has(url.hostname)) {
      url.protocol = 'https:';
      return url.toString();
    }
    return u;
  } catch {
    return u; // Return original string if it's not a valid URL
  }
}

/**
 * Checks if a URL is reachable by making a HEAD request.
 */
async function headReachable(url: string) {
  try {
    const r = await timeoutFetch(url, { method: 'HEAD' }, 7_000);
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Heuristically finds the largest image from a list of URLs based on common naming conventions.
 */
function largestByNameGuess(list: string[]) {
  const score = (s: string) => {
    let sc = 0;
    if (/_orig|_large|_full|_hi|_2048|_4096/i.test(s)) sc += 3;
    const m = s.match(/(\d{3,5})[^\d]+(\d{3,5})/);
    if (m) sc += Math.max(parseInt(m[1], 10), parseInt(m[2], 10)) / 1000;
    return sc;
  };
  // Create a new sorted array without modifying the original
  return [...list].sort((a, b) => score(b) - score(a))[0];
}

/* -------------------------------------------------------------------------- */
/*                     APOD (Astronomy Picture of the Day)                    */
/* -------------------------------------------------------------------------- */

export async function fetchAPOD(opts?: { date?: string }): Promise<Apod> {
  const apiKey = getNasaApiKey();
  if (!apiKey) throw new Error('NASA API Key is not configured for APOD.');

  const params = new URLSearchParams({ api_key: apiKey, thumbs: 'true' });
  if (opts?.date) params.set('date', opts.date);
  const url = `https://api.nasa.gov/planetary/apod?${params.toString()}`;

  log('APOD GET', url);
  const r = await timeoutFetch(url, { next: { revalidate: REVALIDATE_DAY } });
  if (!r.ok) {
    warn('APOD HTTP', r.status);
    throw new Error(`APOD API request failed with status ${r.status}`);
  }

  const apod = await r.json();
  const media = String(apod.media_type || '');
  let bgUrl = media === 'image' ? apod.hdurl || apod.url : apod.thumbnail_url || null;

  // Verify the primary URL is reachable, otherwise try the alternative.
  bgUrl = upgradeHttps(bgUrl);
  if (bgUrl && !(await headReachable(bgUrl))) {
    const alt = upgradeHttps(bgUrl === apod.hdurl ? apod.url : apod.hdurl);
    if (alt && (await headReachable(alt))) {
      bgUrl = alt;
    } else {
      bgUrl = null; // Set to null if neither URL is reachable
    }
  }

  return {
    date: apod.date,
    title: apod.title,
    explanation: apod.explanation,
    mediaType: media,
    bgUrl,
    credit: apod.copyright || 'NASA/APOD',
  };
}

/* -------------------------------------------------------------------------- */
/*                   NASA Image & Video Library (search)                      */
/* -------------------------------------------------------------------------- */

export async function searchNIVL(
  q: string,
  opts?: { page?: number; limit?: number; expandAssets?: boolean; prefer?: 'orig' | 'large' | 'any' }
): Promise<NivlItem[]> {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 18;
  const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image&page=${page}`;

  log('NIVL search', { q, page, url });
  const r = await timeoutFetch(url, { next: { revalidate: REVALIDATE_HOUR } });
  if (!r.ok) {
    warn('NIVL HTTP Error', { status: r.status, statusText: r.statusText });
    throw new Error(`NASA Image Library search failed for "${q}" with status ${r.status}.`);
  }

  const j = await r.json();
  if (!j.collection || !Array.isArray(j.collection.items)) {
    warn('NIVL API returned an invalid response format.', j);
    return [];
  }

  const raw: NivlItem[] = j.collection.items
    .slice(0, limit)
    .map((it: any): NivlItem => {
      const data = it.data?.[0] || {};
      const link = it.links?.find((l: any) => l.render === 'image') || null;
      return {
        nasaId: data.nasa_id,
        title: data.title,
        description: data.description,
        date: data.date_created,
        keywords: data.keywords || [],
        href: upgradeHttps(link?.href),
      };
    });

  if (!opts?.expandAssets) return raw;

  // If expanding assets, find the best resolution for each image.
  const expanded = await Promise.allSettled(
    raw.map(async (it) => {
      if (!it.nasaId) return it;
      const best = await pickBestNivlAsset(it.nasaId, opts?.prefer);
      return { ...it, href: best || it.href };
    })
  );

  return expanded.map((p, i) => (p.status === 'fulfilled' ? p.value : raw[i]));
}

async function pickBestNivlAsset(nasaId: string, prefer: 'orig' | 'large' | 'any' = 'orig') {
  try {
    const url = `https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`;
    const r = await timeoutFetch(url, { next: { revalidate: REVALIDATE_HOUR } });
    if (!r.ok) {
      warn('NIVL asset HTTP Error', { nasaId, status: r.status });
      return null;
    }
    const j = await r.json();
    if (!j.collection || !Array.isArray(j.collection.items)) {
      warn('NIVL asset API returned an invalid format for', { nasaId });
      return null;
    }

    const hrefs = j.collection.items.map((x: any) => upgradeHttps(x.href)).filter(Boolean) as string[];
    const jpgs = hrefs.filter((h) => /\.jpe?g($|\?)/i.test(h));
    
    let pick = prefer === 'orig' ? jpgs.find((h) => /_orig\.jpe?g/i.test(h)) : null;
    pick = pick || largestByNameGuess(jpgs) || hrefs[0] || null;

    if (pick && (await headReachable(pick))) return pick;

    // Fallback: check other URLs if the preferred one is unreachable.
    for (const h of hrefs) {
      if (await headReachable(h)) return h;
    }
    return null;
  } catch (e) {
    warn(`NIVL asset error for nasaId "${nasaId}":`, String(e));
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                         Mars Rover Latest Photos                           */
/* -------------------------------------------------------------------------- */

export async function fetchLatestMarsPhotos(rover: string = 'curiosity'): Promise<MarsPhoto[]> {
    const apiKey = getNasaApiKey();
    if (!apiKey) throw new Error("NASA API Key is not configured for Mars Rover Photos.");
    
    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/latest_photos?api_key=${apiKey}`;
    log('Mars Latest GET', { rover, url });

    const r = await timeoutFetch(url, { next: { revalidate: REVALIDATE_HOUR } });
    if (!r.ok) {
        warn('Mars Latest HTTP Error', { status: r.status, statusText: r.statusText });
        throw new Error(`NASA Mars Rover API failed with status ${r.status}.`);
    }
    const j = await r.json();
    if (!j || !Array.isArray(j.latest_photos)) {
        warn('Mars Rover API returned an invalid response format.', j);
        return [];
    }

    const photos = j.latest_photos as any[];
    if (photos.length === 0) {
      warn(`Mars Rover API returned 0 photos for rover "${rover}".`);
      return [];
    }
    
    return photos.map((p): MarsPhoto => ({
        id: p.id,
        sol: p.sol,
        camera: p.camera,
        img_src: upgradeHttps(p.img_src) || p.img_src,
        earth_date: p.earth_date,
        rover: p.rover,
    }));
}

/* -------------------------------------------------------------------------- */
/*                 EPIC (Earth Polychromatic Imaging Camera)                  */
/* -------------------------------------------------------------------------- */

export async function fetchEPICImages({ count = 12 } = {}): Promise<{ date: string, href: string }[]> {
    const apiKey = getNasaApiKey();
    if (!apiKey) {
      throw new Error("NASA API Key is not configured for EPIC.");
    }

    // --- STRATEGY: TRY PRIMARY MIRROR, THEN FALL BACK TO DIRECT SOURCE ---
    const primaryUrl = `https://api.nasa.gov/EPIC/api/natural/images?api_key=${apiKey}`;
    const fallbackUrl = `https://epic.gsfc.nasa.gov/api/natural`; // Note: No API key needed for direct source

    let data: any[];
    try {
        log('EPIC GET (Primary)', { url: primaryUrl });
        const r = await timeoutFetch(primaryUrl, { next: { revalidate: REVALIDATE_HOUR } });
        if (!r.ok) {
            // If the primary mirror fails with a server error, throw to trigger the fallback.
            if (r.status >= 500) {
              throw new Error(`Primary EPIC API failed with server error: ${r.status}`);
            }
            // For client errors (4xx), fail immediately as the fallback won't help.
            warn('EPIC HTTP Error on Primary', { status: r.status, statusText: r.statusText });
            throw new Error(`The NASA EPIC API failed with status ${r.status}.`);
        }
        data = await r.json();
    } catch (primaryError) {
        warn('Primary EPIC API failed, trying direct fallback...', { error: (primaryError as Error).message });

        try {
            log('EPIC GET (Fallback)', { url: fallbackUrl });
            const r = await timeoutFetch(fallbackUrl, { next: { revalidate: REVALIDATE_HOUR } });
            if (!r.ok) {
                warn('EPIC HTTP Error on Fallback', { status: r.status, statusText: r.statusText });
                throw new Error(`The fallback EPIC API also failed with status ${r.status}.`);
            }
            data = await r.json();
        } catch (fallbackError) {
            // If the fallback also fails, throw the final, comprehensive error.
            console.error('[nasa] EPIC fetch failed on both primary and fallback endpoints.');
            throw fallbackError;
        }
    }

    // The rest of the logic is the same, as the data structure is identical.
    if (!Array.isArray(data) || data.length === 0) {
      warn('EPIC API returned an empty or invalid array.');
      return [];
    }
    
    return data.slice(0, count).map((img: any) => {
        const date = new Date(img.date);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        
        const href = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${img.image}.png`;
        
        return {
            date: img.date,
            href: upgradeHttps(href)!,
        };
    });
}


/* -------------------------------------------------------------------------- */
/*               Context Builders (for feeding info to the LLM)               */
/* -------------------------------------------------------------------------- */

export function buildContextFromNIVL(items: NivlItem[], limit = 8): string {
  return items
    .slice(0, limit)
    .map((im, i) => `#${i + 1} ${im.title || 'Untitled'} – ${im.href ?? ''}`)
    .join('\n');
}

export function buildContextFromMars(items: MarsPhoto[], limit = 8): string {
  return items
    .slice(0, limit)
    .map((p, i) => `#${i + 1} ${p.rover.name} • ${p.camera.full_name} (${p.earth_date}) – ${p.img_src}`)
    .join('\n');
}