// src/lib/apod.ts
import 'server-only';
import { getNasaApiKey } from './secrets';

export type Apod = {
  date: string;
  title: string;
  explanation: string;
  mediaType: string;
  bgUrl: string | null;
  credit: string;
};

const REVALIDATE_SECONDS = 60 * 60 * 24;

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

export async function getApod(): Promise<Apod | null> {
  const started = Date.now();
  dbg('getApod(): start');

  let key: string;
  try {
    key = await getNasaApiKey();
    dbg('getNasaApiKey(): ok, key=', maskKey(key));
  } catch (e: any) {
    warn('getNasaApiKey(): FAILED →', e?.message || e);
    return null;
  }

  const url = `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(
    key
  )}&thumbs=true`;

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

  const mediaType = String(apod?.media_type ?? '');
  let bgUrl: string | null =
    mediaType === 'image'
      ? apod?.hdurl || apod?.url || null
      : apod?.thumbnail_url || null;

  dbg('payload:', {
    date: apod?.date,
    title: apod?.title,
    mediaType,
    hasHdurl: Boolean(apod?.hdurl),
    hasUrl: Boolean(apod?.url),
    hasThumb: Boolean(apod?.thumbnail_url),
  });
  dbg('selected bgUrl:', bgUrl ?? '(null)');

  const out: Apod = {
    date: apod?.date ?? '',
    title: apod?.title ?? 'Astronomy Picture of the Day',
    explanation: apod?.explanation ?? '',
    mediaType,
    bgUrl,
    credit: apod?.copyright || 'NASA/APOD',
  };

  dbg('getApod(): done in', `${Date.now() - started}ms`);
  return out;
}
