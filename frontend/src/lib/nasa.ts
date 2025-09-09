/**
 * =========================================================================
 * NASA API CLIENT
 *
 * This module is SOLELY responsible for interacting with all NASA APIs.
 * It is hardened to run in both Next.js (web) and Node.js (worker) environments.
 * =========================================================================
 */

// FIX: Import from the generic secrets module, not a specific worker.
import { getNasaApiKey } from '@/lib/secrets';
import type { MarsPhoto } from '@/types/llm';

// FIX 1: Define a custom RequestInit type that includes the Next.js-specific 'next' property.
// This teaches the TypeScript compiler about this special property.
interface NextRequestInit extends RequestInit {
  next?: {
    revalidate: number;
  };
}

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

// Internal types for parsing raw API responses
type NasaApodResponse = {
  date: string;
  title: string;
  explanation: string;
  media_type: string;
  hdurl?: string;
  url?: string;
  thumbnail_url?: string;
  copyright?: string;
};

type NivlLink = {
  render: 'image' | string;
  href: string;
};

type NivlDataItem = {
  nasa_id: string;
  title: string;
  description?: string;
  date_created?: string;
  keywords?: string[];
};

type NivlSearchItem = {
  data?: NivlDataItem[];
  links?: NivlLink[];
};

type NivlSearchResponse = {
  collection: {
    items: NivlSearchItem[];
  };
};

type NivlAssetResponse = {
  collection: {
    items: { href: string }[];
  };
};

type MarsRoverApiResponse = {
  latest_photos: MarsPhoto[];
};

type EpicApiResponseItem = {
  date: string;
  image: string;
};

/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

const REVALIDATE_DAY = 60 * 60 * 24; // 1 day in seconds
const REVALIDATE_HOUR = 60 * 60; // 1 hour in seconds
const TIMEOUT_MS = Number(process.env.NASA_TIMEOUT_MS || 15_000);
const DEBUG = process.env.DEBUG_NASA === '1';

const HTTPS_UPGRADE_HOSTS = new Set(['apod.nasa.gov', 'images-assets.nasa.gov', 'images.nasa.gov', 'mars.nasa.gov', 'epic.gsfc.nasa.gov']);

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function log(...args: unknown[]): void {
  if (DEBUG) console.log('[nasa]', ...args);
}
function warn(...args: unknown[]): void {
  console.warn('[nasa]', ...args);
}

/**
 * A fetch wrapper that adds a timeout and conditionally applies Next.js caching.
 */
async function fetchWithCache(url: string, revalidateSeconds: number, timeout = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // FIX 2: Use our new custom type for the options object.
  const options: NextRequestInit = {
    signal: controller.signal,
  };
  if (process.env.NEXT_RUNTIME) {
    // This assignment is now valid because NextRequestInit knows about 'next'.
    options.next = { revalidate: revalidateSeconds };
  }

  try {
    return await fetch(url, options);
  } finally {
    clearTimeout(timeoutId);
  }
}

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
    return u;
  }
}

async function headReachable(url: string): Promise<boolean> {
  try {
    // Use HEAD method for a lighter check
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(7_000) });
    return res.ok;
  } catch {
    return false;
  }
}

function largestByNameGuess(list: string[]): string {
  const score = (s: string): number => {
    let sc = 0;
    if (/_orig|_large|_full|_hi|_2048|_4096/i.test(s)) sc += 3;
    const m = s.match(/(\d{3,5})[^\d]+(\d{3,5})/);
    if (m) sc += Math.max(parseInt(m[1], 10), parseInt(m[2], 10)) / 1000;
    return sc;
  };
  return [...list].sort((a, b) => score(b) - score(a))[0] ?? list[0] ?? '';
}

/* -------------------------------------------------------------------------- */
/*                     APOD (Astronomy Picture of the Day)                    */
/* -------------------------------------------------------------------------- */

export async function fetchAPOD(opts?: { date?: string }): Promise<Apod> {
  const apiKey = await getNasaApiKey();
  if (!apiKey) throw new Error('NASA API Key is not configured for APOD.');

  const params = new URLSearchParams({ api_key: apiKey, thumbs: 'true' });
  if (opts?.date) params.set('date', opts.date);
  const url = `https://api.nasa.gov/planetary/apod?${params.toString()}`;

  log('APOD GET', url);
  const r = await fetchWithCache(url, REVALIDATE_DAY);
  if (!r.ok) {
    warn('APOD HTTP', r.status);
    throw new Error(`APOD API request failed with status ${r.status}`);
  }

  // FIX 3: Add type assertion to resolve 'unknown' error
  const apod = (await r.json()) as NasaApodResponse;
  const media = String(apod.media_type || '');
  let bgUrl = media === 'image' ? apod.hdurl || apod.url : apod.thumbnail_url || null;

  bgUrl = upgradeHttps(bgUrl);
  if (bgUrl && !(await headReachable(bgUrl))) {
    const alt = upgradeHttps(bgUrl === apod.hdurl ? apod.url : apod.hdurl);
    if (alt && (await headReachable(alt))) {
      bgUrl = alt;
    } else {
      bgUrl = null;
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
  const r = await fetchWithCache(url, REVALIDATE_HOUR);
  if (!r.ok) {
    warn('NIVL HTTP Error', { status: r.status, statusText: r.statusText });
    throw new Error(`NASA Image Library search failed for "${q}" with status ${r.status}.`);
  }

  const j = (await r.json()) as NivlSearchResponse;
  if (!j.collection?.items) {
    warn('NIVL API returned an invalid response format.', j);
    return [];
  }

  const raw: NivlItem[] = j.collection.items
    .slice(0, limit)
    .flatMap((it: NivlSearchItem): NivlItem[] => {
      const data = it.data?.[0];
      const link = it.links?.find((l: NivlLink) => l.render === 'image');

      if (!data?.nasa_id || !data?.title) return []; // Skip invalid items

      return [{
        nasaId: data.nasa_id,
        title: data.title,
        description: data.description,
        date: data.date_created,
        keywords: data.keywords || [],
        href: upgradeHttps(link?.href) || null,
      }];
    });

  if (!opts?.expandAssets) return raw;

  const expanded = await Promise.allSettled(
    raw.map(async (it) => {
      if (!it.nasaId) return it;
      const best = await pickBestNivlAsset(it.nasaId, opts?.prefer);
      return { ...it, href: best || it.href };
    })
  );

  return expanded.map((p, i) => (p.status === 'fulfilled' ? p.value : raw[i]));
}

async function pickBestNivlAsset(nasaId: string, prefer: 'orig' | 'large' | 'any' = 'orig'): Promise<string | null> {
  try {
    const url = `https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`;
    const r = await fetchWithCache(url, REVALIDATE_HOUR);
    if (!r.ok) {
      warn('NIVL asset HTTP Error', { nasaId, status: r.status });
      return null;
    }

    const j = (await r.json()) as NivlAssetResponse;
    if (!j.collection?.items) {
      warn('NIVL asset API returned an invalid format for', { nasaId });
      return null;
    }

    const hrefs = j.collection.items.map((x) => upgradeHttps(x.href)).filter(Boolean) as string[];
    const jpgs = hrefs.filter((h) => /\.jpe?g($|\?)/i.test(h));

    let pick = prefer === 'orig' ? jpgs.find((h) => /_orig\.jpe?g/i.test(h)) : null;
    pick = pick || largestByNameGuess(jpgs) || hrefs[0] || null;

    if (pick && (await headReachable(pick))) return pick;

    for (const h of hrefs) {
      if (await headReachable(h)) return h;
    }
    return null;
  } catch (e) {
    warn(`NIVL asset error for nasaId "${nasaId}":`, e instanceof Error ? e.message : String(e));
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                         Mars Rover Latest Photos                           */
/* -------------------------------------------------------------------------- */

export async function fetchLatestMarsPhotos(rover = 'curiosity'): Promise<MarsPhoto[]> {
  const apiKey = await getNasaApiKey();
  if (!apiKey) throw new Error('NASA API Key is not configured for Mars Rover Photos.');

  const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/latest_photos?api_key=${apiKey}`;
  log('Mars Latest GET', { rover, url });

  const r = await fetchWithCache(url, REVALIDATE_HOUR);
  if (!r.ok) {
    warn('Mars Latest HTTP Error', { status: r.status, statusText: r.statusText });
    throw new Error(`NASA Mars Rover API failed with status ${r.status}.`);
  }

  const j = (await r.json()) as MarsRoverApiResponse;
  if (!j?.latest_photos) {
    warn('Mars Rover API returned an invalid response format.', j);
    return [];
  }

  const photos = j.latest_photos;
  if (photos.length === 0) {
    warn(`Mars Rover API returned 0 photos for rover "${rover}".`);
  }

  return photos.map((p: MarsPhoto): MarsPhoto => ({
    ...p,
    img_src: upgradeHttps(p.img_src) || p.img_src,
  }));
}

/* -------------------------------------------------------------------------- */
/*                 EPIC (Earth Polychromatic Imaging Camera)                  */
/* -------------------------------------------------------------------------- */

export async function fetchEPICImages({ count = 12 } = {}): Promise<{ date: string; href: string }[]> {
  const apiKey = await getNasaApiKey();
  if (!apiKey) throw new Error('NASA API Key is not configured for EPIC.');

  const primaryUrl = `https://api.nasa.gov/EPIC/api/natural/images?api_key=${apiKey}`;
  const fallbackUrl = `https://epic.gsfc.nasa.gov/api/natural`;

  let data: EpicApiResponseItem[];
  try {
    log('EPIC GET (Primary)', { url: primaryUrl });
    const r = await fetchWithCache(primaryUrl, REVALIDATE_HOUR);
    if (!r.ok) {
      if (r.status >= 500) throw new Error(`Primary EPIC API failed with server error: ${r.status}`);
      warn('EPIC HTTP Error on Primary', { status: r.status, statusText: r.statusText });
      throw new Error(`The NASA EPIC API failed with status ${r.status}.`);
    }

    data = (await r.json()) as EpicApiResponseItem[];
  } catch (primaryError) {
    warn('Primary EPIC API failed, trying direct fallback...', { error: (primaryError as Error).message });
    try {
      log('EPIC GET (Fallback)', { url: fallbackUrl });
      const r = await fetchWithCache(fallbackUrl, REVALIDATE_HOUR);
      if (!r.ok) throw new Error(`The fallback EPIC API also failed with status ${r.status}.`);

      data = (await r.json()) as EpicApiResponseItem[];
    } catch (fallbackError) {
      console.error('[nasa] EPIC fetch failed on both primary and fallback endpoints.');
      throw fallbackError;
    }
  }

  if (!Array.isArray(data) || data.length === 0) {
    warn('EPIC API returned an empty or invalid array.');
    return [];
  }

  return data.slice(0, count).map((img: EpicApiResponseItem) => {
    const date = new Date(img.date);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const href = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${img.image}.png`;
    return { date: img.date, href: upgradeHttps(href)! };
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