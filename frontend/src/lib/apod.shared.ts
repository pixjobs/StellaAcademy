// src/lib/apod.shared.ts
import 'server-only';
import dns from 'node:dns';
import { getSecret } from './secrets';

dns.setDefaultResultOrder?.('ipv4first'); // reduce IPv6 DNS hiccups on some hosts

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

/* ------------------------------ Fetch helpers ------------------------------ */

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch with timeout + retry/backoff. Retries on network errors (EAI_AGAIN, etc.) and 5xx.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
  attempts = 4
): Promise<Response> {
  const { timeoutMs = 8000, ...rest } = init;
  let lastErr: any;

  for (let i = 0; i < attempts; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      const res = await fetch(url, { ...rest, signal: ctrl.signal } as any);
      clearTimeout(timer);

      if (res.status >= 500) {
        // retry on 5xx
        lastErr = new Error(`HTTP ${res.status}`);
      } else {
        return res;
      }
    } catch (e: any) {
      clearTimeout(timer);
      lastErr = e;

      const code = e?.code || e?.cause?.code;
      const name = e?.name;
      const isAbort = name === 'AbortError';
      const transient =
        isAbort ||
        code === 'EAI_AGAIN' ||
        code === 'ECONNRESET' ||
        code === 'ETIMEDOUT' ||
        code === 'ENOTFOUND' ||
        e?.message?.includes('fetch failed');

      if (!transient) break;
    }

    // exponential backoff with jitter (caps at ~12s)
    const backoff = Math.min(2000 * 2 ** i, 12_000) + Math.random() * 400;
    await sleep(backoff);
  }

  throw lastErr;
}

/* ------------------------------ Public API ------------------------------ */

/**
 * Fetch APOD for today (default) or a specific date (YYYY-MM-DD).
 */
export async function getApod(date?: string): Promise<Apod | null> {
  const started = Date.now();
  dbg(
    'getApod(): start',
    date ? `date=${date}` : '(today)',
    'runtime=',
    process.env.NEXT_RUNTIME || 'node'
  );

  let key = await getSecret('nasa-api-key');
  if (!key) {
    warn('No NASA API key resolved; falling back to DEMO_KEY (rate-limited).');
    key = 'DEMO_KEY';
  }
  dbg('API key:', maskKey(key));

  const params = new URLSearchParams({ api_key: key, thumbs: 'true' });
  if (date) params.set('date', date);

  const url = `https://api.nasa.gov/planetary/apod?${params.toString()}`;
  dbg(
    'fetch:',
    url,
    'revalidate=',
    REVALIDATE_SECONDS,
    'runtime=',
    process.env.NEXT_RUNTIME || 'node'
  );

  let res: Response;
  try {
    // On Edge the `next` option is ignored; on Node it enables ISR revalidation.
    res = await fetchWithRetry(
      url,
      { next: { revalidate: REVALIDATE_SECONDS } as any, timeoutMs: 8000 },
      4
    );
  } catch (e: any) {
    warn('fetch() network error (after retries):', e?.code || e?.message || e);
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

  const mediaTypeRaw = String(apod?.media_type ?? '').toLowerCase();
  const mediaType =
    mediaTypeRaw === 'video' ? 'video' : mediaTypeRaw === 'image' ? 'image' : '';
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

function pickBestMediaUrl(apod: any, mediaType: string): string | null {
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
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = u.searchParams.get('v');
      if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }
  } catch {}
  return null;
}
