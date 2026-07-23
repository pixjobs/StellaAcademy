/**
 * Simplified NASA API CLIENT for educational purposes
 * 
 * This is a minimal version for our educational website.
 * Complex features like caching, request coalescing, resilience, etc. 
 * have been removed for simplicity.
 */

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

interface NextRequestInit extends RequestInit { 
  next?: { revalidate: number };
}

// Types similar to the original but simplified
export type Apod = {
  date: string;
  title: string;
  explanation: string;
  mediaType: 'image' | 'video';
  bgUrl: string | null;
  credit: string;
};

export type NivlItem = {
  id: string;
  title: string;
  description?: string;
  sourceUrl?: string;
  thumbnailUrl?: string;
  dateCreated?: string;
  center?: string;
  keywords?: string[];
};

export type MarsPhoto = {
  id: string;
  img_src: string;
  earth_date: string;
  rover: string;
};

/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

const REVALIDATE_DAY = 60 * 60 * 24;
const REVALIDATE_HOUR = 60 * 60;

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                   */
/* -------------------------------------------------------------------------- */

function intEnv(name: string, fallback: number): number {
  return Number(process.env[name]) || fallback;
}

/* -------------------------------------------------------------------------- */
/*                     APOD (Astronomy Picture of the Day)                    */
/* -------------------------------------------------------------------------- */

export async function fetchAPOD(opts?: { date?: string }): Promise<Apod | null> {
  const apiKey = process.env.NASA_API_KEY || '';
  
  if (!apiKey) {
    console.warn('[NASA] No NASA_API_KEY configured');
    return null;
  }

  const params = new URLSearchParams({ api_key: apiKey, thumbs: "true" });
  if (opts?.date) params.set("date", opts.date);
  const url = `https://api.nasa.gov/planetary/apod?${params.toString()}`;

  console.log('[NASA] Fetching APOD:', url.slice(0, 60) + '...');
  
  try {
    const apod = await cachedJson<NasaApodResponse>(url, REVALIDATE_DAY, 10 * 60 * 1000, 60 * 60 * 1000);
    
    if (!apod) throw new Error('Failed to parse APOD response');

    return {
      date: apod.date,
      title: apod.title,
      explanation: apod.explanation,
      mediaType: apod.media_type,
      bgUrl: apod.url,
      credit: apod.copyright || 'Public',
    };
  } catch (error) {
    console.error('[NASA] Failed to fetch APOD:', error instanceof Error ? error.message : error);
    return null;
  }
}

interface NasaApodResponse {
  date: string;
  title: string;
  explanation: string;
  media_type: 'image' | 'video';
  url: string;
  copyright: string | null;
}

/* -------------------------------------------------------------------------- */
/*                         Mars Rover Latest Photos                           */
/* -------------------------------------------------------------------------- */

export async function fetchLatestMarsPhotos(rover = "curiosity"): Promise<MarsPhoto[]> {
  const apiKey = process.env.NASA_API_KEY || '';
  
  if (!apiKey) {
    console.warn('[NASA] No NASA_API_KEY configured for Mars');
    return [];
  }

  const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/latest_photos?api_key=${apiKey}`;
  console.log('[NASA] Fetching Mars photos:', url.slice(0, 60) + '...');

  try {
    const j = await cachedJson<MarsRoverApiResponse>(url, REVALIDATE_HOUR, 10 * 60 * 1000, 60 * 60 * 1000);
    if (!j?.latest_photos) {
      console.warn('[NASA] Mars API returned invalid response');
      return [];
    }
    return j.latest_photos;
  } catch (error) {
    console.error('[NASA] Failed to fetch Mars photos:', error instanceof Error ? error.message : error);
    return [];
  }
}

interface MarsRoverApiResponse {
  latest_photos: MarsPhoto[];
}

/* -------------------------------------------------------------------------- */
/*                   NASA Image & Video Library (search)                      */
/* -------------------------------------------------------------------------- */

export async function searchNIVL(
  q: string,
  opts?: { page?: number; limit?: number; expandAssets?: boolean; prefer?: "orig" | "large" | "any" }
): Promise<NivlItem[]> {
  const { page, limit } = opts || {};
  const params = new URLSearchParams();
  params.set('q', q);
  params.set('media_type', 'image'); // filter only images
  if (page) params.set('page', page.toString());
  
  const url = `https://images-api.nasa.gov/search?${params.toString()}`;

  console.log('[NASA] Search NIVL:', url.slice(0, 60) + '...');

  try {
    const data = await cachedJson<NivlSearchResponse>(url, REVALIDATE_DAY, 10 * 60 * 1000, 60 * 60 * 1000);
    
    if (!data?.collection?.items) {
      console.warn('[NASA] Search returned invalid response');
      return [];
    }

    // Flatten the collection items
    const results: NivlItem[] = data.collection.items.flatMap(item => {
      const media = (item.data || []).find(d => d.media_type === 'image');
      return media ? {
        id: item.data?.[0]?.nasa_id || item.href.split('/').pop() || '',
        title: media.title || '',
        description: media.description,
        sourceUrl: item.href,
        thumbnailUrl: item.links?.[0]?.href || undefined,
        dateCreated: media.date_created,
        center: media.center,
        keywords: media.keywords,
      } : [];
    });

    return results.slice(0, limit || 8);
  } catch { 
    return [];
  }
}

interface NivlSearchResponse {
  collection: {
    items: Array<{
      data: Array<{
        nasa_id: string;
        title: string;
        description: string;
        media_type: string;
        date_created?: string;
        center?: string;
        keywords?: string[];
      }>;
      links: Array<{ href: string }>;
      href: string;
    }>;
  };
}

/* -------------------------------------------------------------------------- */
/*                       Simple in-memory cache                                */
/* -------------------------------------------------------------------------- */

interface CacheVal<T> { 
  value: T; 
  fetchedAt: number; 
  soft: number; 
  hard: number;
}

const jsonCache = new Map<string, CacheVal<unknown>>();

async function cachedJson<T>(
  url: string,
  revalidateSeconds: number,
  softMs = 10 * 60 * 1000,
  hardMs = 60 * 60 * 1000
): Promise<T | null> {
  const key = url;
  const now = Date.now();
  
  // Check if we have a valid cached value
  const cached = jsonCache.get(key as string);
  if (cached) {
    if (now >= cached.fetchedAt + cached.soft) {
      // Soft expired - make a background refresh
      doFetch(url, revalidateSeconds).catch(() => {});
    }
    if (now >= cached.fetchedAt + cached.hard) {
      jsonCache.delete(key as string);
      const fresh = await doFetch<T>(url, revalidateSeconds);
      if (fresh !== null) {
        jsonCache.set(key as string, {
          value: fresh,
          fetchedAt: now,
          soft: softMs,
          hard: hardMs,
        });
        return fresh;
      }
    }
    return cached.value as T;
  }

  // No cache, fetch and store
  const fresh = await doFetch<T>(url, revalidateSeconds);
  if (fresh !== null) {
    jsonCache.set(key as string, {
      value: fresh,
      fetchedAt: now,
      soft: softMs,
      hard: hardMs,
    });
  }
  return fresh;
}

async function doFetch<T>(url: string, revalidateSeconds: number): Promise<T | null> {
  const timeoutMs = 15_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'StellaAcademy-Education',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error('[NASA] Fetch error:', error instanceof Error ? error.message : error);
    return null;
  }
}
