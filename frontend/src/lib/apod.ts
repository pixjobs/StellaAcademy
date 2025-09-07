// src/lib/apod.ts
import 'server-only';
import { getSecret } from './secrets';

export type Apod = {
  date: string;
  title: string;
  explanation: string;
  mediaType: string;
  bgUrl: string | null;
  credit: string;
};

const REVALIDATE_SECONDS =
  Number(process.env.APOD_REVALIDATE_SEC ?? 60 * 60 * 24);

// Enable with DEBUG_APOD=1 (server env). You can also flip at runtime via process.env.
const DEBUG =
  process.env.DEBUG_APOD === '1' ||
  process.env.NEXT_DEBUG_APOD === '1' ||
  false;

function maskKey(k?: string) {
  if (!k) return '(none)';
  if (k.length <= 6) return `${k[0]}***`;
  return `${k.slice(0, 3)}***${k.slice(-2)}`;
}

function dbg(...args: any[]) {
  if (DEBUG) console.log('[APOD]', ...args);
}
function warn(...args: any[]) {
  console.warn('[APOD]', ...args);
}

/**
 * Fetch APOD for today (default) or a specific date (YYYY-MM-DD).
 * Keeps the original return type so existing code continues to work.
 */
export async function getApod(date?: string): Promise<Apod | null> {
  const started = Date.now();
  dbg('getApod(): start', date ? `date=${date}` : '(today)');

  // Get key via Secret Manager helper; fall back to DEMO_KEY if unresolved.
  let key = await getSecret('nasa-api-key');
  if (!key) {
    warn('No NASA API key resolved from Secret Manager/env; falling back to DEMO_KEY (rate-limited).');
    key = 'DEMO_KEY';
  }
  dbg('API key:', maskKey(key));

  // Build URL
  const params = new URLSearchParams({
    api_key: key,
    thumbs: 'true',
  });
  if (date) params.set('date', date);

  const url = `https://api.nasa.gov/planetary/apod?${params.toString()}`;
  dbg('fetch:', url, 'revalidate=', REVALIDATE_SECONDS, 'runtime=', process.env.NEXT_RUNTIME || 'node');

  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  } catch (e: any) {
    warn('fetch() network error:', e?.message || e);
    return null;
  }

  if (!res.ok) {
    let bodyPreview = '';
    try {
      bodyPreview = (await res.text()).slice(0, 300);
    } catch {}
    warn('HTTP', res.status, res.statusText, 'bodyPreview=', bodyPreview);
    return null;
  }

  let apod: any;
  try {
    apod = await res.json();
  } catch (e: any) {
    warn('JSON parse error:', e?.message || e);
    return null;
  }

  // Defensive normalization
  const mediaTypeRaw = String(apod?.media_type ?? '').toLowerCase();
  const mediaType = mediaTypeRaw === 'video' ? 'video' : mediaTypeRaw === 'image' ? 'image' : '';
  const title = sanitizeText(apod?.title) || 'Astronomy Picture of the Day';
  const explanation = sanitizeText(apod?.explanation) || '';
  const credit = sanitizeText(apod?.copyright) || 'NASA/APOD';
  const dateOut = String(apod?.date ?? '');

  // Choose the best background URL we can
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
  // APOD text is usually plain, but normalize whitespace just in case
  return v.replace(/\s+\n/g, '\n').trim();
}

function pickBestMediaUrl(apod: any, mediaType: string): string | null {
  if (mediaType === 'image') {
    // Prefer HD if present; fall back to standard URL
    return apod?.hdurl || apod?.url || null;
  }

  if (mediaType === 'video') {
    // APOD returns youtube/vimeo links in `url` and sometimes a `thumbnail_url`.
    // Prefer provided thumbnail; otherwise try to build a YouTube thumbnail.
    const thumb = apod?.thumbnail_url || youtubeThumbFromUrl(apod?.url) || null;
    return thumb;
  }

  return null;
}

function youtubeThumbFromUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'm.youtube.com') {
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
