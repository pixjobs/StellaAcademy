import 'server-only';
import { getSecret } from './secrets';

// FIX 1: Define a custom RequestInit type that includes the Next.js-specific 'next' property.
// This teaches the TypeScript compiler about the special property, resolving the static analysis error.
interface NextRequestInit extends RequestInit {
  next?: {
    revalidate: number;
  };
}

export type Apod = {
  date: string;
  title: string;
  explanation: string;
  mediaType: 'image' | 'video' | '';
  bgUrl: string | null;
  credit: string;
};

type NasaApodResponse = {
  date: string;
  title: string;
  explanation: string;
  copyright?: string;
  media_type: 'image' | 'video' | string;
  hdurl?: string;
  url?: string;
  thumbnail_url?: string;
};

const REVALIDATE_SECONDS = Number(process.env.APOD_REVALIDATE_SEC ?? 60 * 60 * 24);

const DEBUG =
  process.env.DEBUG_APOD === '1' || process.env.NEXT_DEBUG_APOD === '1' || false;

function maskKey(k?: string): string {
  if (!k) return '(none)';
  if (k.length <= 6) return `${k[0]}***`;
  return `${k.slice(0, 3)}***${k.slice(-2)}`;
}

function dbg(...args: unknown[]): void {
  if (DEBUG) console.log('[APOD]', ...args);
}
function warn(...args: unknown[]): void {
  console.warn('[APOD]', ...args);
}

/**
 * Fetch APOD for today (default) or a specific date (YYYY-MM-DD).
 */
export async function getApod(date?: string): Promise<Apod | null> {
  const started = Date.now();
  dbg('getApod(): start', date ? `date=${date}` : '(today)');

  let key = await getSecret('nasa-api-key');
  if (!key) {
    warn('No NASA API key resolved; falling back to DEMO_KEY (rate-limited).');
    key = 'DEMO_KEY';
  }
  dbg('API key:', maskKey(key));

  const params = new URLSearchParams({
    api_key: key,
    thumbs: 'true',
  });
  if (date) params.set('date', date);

  const url = `https://api.nasa.gov/planetary/apod?${params.toString()}`;
  dbg('fetch:', url, 'revalidate=', REVALIDATE_SECONDS, 'runtime=', process.env.NEXT_RUNTIME || 'node');

  // FIX 2: Use our new custom type for the options object.
  const fetchOptions: NextRequestInit = {};
  if (process.env.NEXT_RUNTIME) {
    // This assignment is now valid because NextRequestInit knows about 'next'.
    fetchOptions.next = { revalidate: REVALIDATE_SECONDS };
  }

  let res: Response;
  try {
    // Use the conditionally-built, now type-safe, options object.
    res = await fetch(url, fetchOptions);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    warn('fetch() network error:', message);
    return null;
  }

  if (!res.ok) {
    let bodyPreview = '';
    try {
      bodyPreview = (await res.text()).slice(0, 300);
    } catch {
      // ignore
    }
    warn('HTTP', res.status, res.statusText, 'bodyPreview=', bodyPreview);
    return null;
  }

  let apod: NasaApodResponse;
  try {
    // FIX 3: Use a type assertion `as` to fix the `unknown` type error.
    apod = (await res.json()) as NasaApodResponse;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    warn('JSON parse error:', message);
    return null;
  }

  const mediaTypeRaw = String(apod?.media_type ?? '').toLowerCase();
  const mediaType = mediaTypeRaw === 'video' ? 'video' : mediaTypeRaw === 'image' ? 'image' : ('' as const);
  const title = sanitizeText(apod?.title) || 'Astronomy Picture of the Day';
  const explanation = sanitizeText(apod?.explanation) || '';
  const credit = sanitizeText(apod?.copyright) || 'NASA/APOD';
  const dateOut = String(apod?.date ?? '');
  const bgUrl = pickBestMediaUrl(apod, mediaType);

  dbg('payload:', {
    date: dateOut,
    title,
    mediaType,
    hasHdurl: Boolean(apod?.hdurl),
    hasUrl: Boolean(apod?.url),
    hasThumb: Boolean(apod?.thumbnail_url),
    selectedBgUrl: bgUrl ?? '(null)',
  });

  const out: Apod = {
    date: dateOut,
    title,
    explanation,
    mediaType,
    bgUrl,
    credit,
  };

  dbg('getApod(): done in', `${Date.now() - started}ms`);
  return out;
}

/* ------------------------------ Helpers ------------------------------ */

function sanitizeText(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v.replace(/\s+\n/g, '\n').trim();
}

function pickBestMediaUrl(apod: NasaApodResponse, mediaType: Apod['mediaType']): string | null {
  if (mediaType === 'image') {
    return apod?.hdurl || apod?.url || null;
  }
  if (mediaType === 'video') {
    return apod?.thumbnail_url || youtubeThumbFromUrl(apod?.url) || null;
  }
  return null;
}

function youtubeThumbFromUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host.endsWith('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }
  } catch {
    /* ignore */
  }
  return null;
}