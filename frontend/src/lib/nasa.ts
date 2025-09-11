// src/lib/nasa.ts
/**
 * =========================================================================
 * NASA API CLIENT (Hardened + L1/L2 Cached + Circuit Breaker for Redis)
 *
 * L1 (in-process): JSON cache + image HEAD results (soft/hard TTL).
 * L2 (shared Redis): IMAGE-ONLY
 *   - HEAD reachability of image URLs → nasa:img:head:<sha1(url)>
 *   - Best NIVL asset URL per (nasaId, prefer) → nasa:nivl:best:<id>:<prefer>
 *
 * Request coalescing, retries with jitter, concurrency limiting for NIVL assets,
 * and Next.js revalidate hints are included. Type-safe, lint-safe.
 * =========================================================================
 */

import crypto from 'node:crypto';
import type { Redis } from 'ioredis';
import { getNasaApiKey } from '@/lib/secrets';
import { getConnection as getRedisConnection } from '@/lib/queue';
import type { MarsPhoto } from '@/types/llm';

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

interface NextRequestInit extends RequestInit {
  next?: { revalidate: number };
}

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

// Raw API types
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

type NivlLink = { render: 'image' | string; href: string };
type NivlDataItem = {
  nasa_id: string;
  title: string;
  description?: string;
  date_created?: string;
  keywords?: string[];
};
type NivlSearchItem = { data?: NivlDataItem[]; links?: NivlLink[] };
type NivlSearchResponse = { collection: { items: NivlSearchItem[] } };
type NivlAssetResponse = { collection: { items: { href: string }[] } };
type MarsRoverApiResponse = { latest_photos: MarsPhoto[] };
type EpicApiResponseItem = { date: string; image: string };

/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

// Next.js revalidate hints (seconds)
const REVALIDATE_DAY = 60 * 60 * 24;
const REVALIDATE_HOUR = 60 * 60;

// In-process cache TTLs (milliseconds)
const JSON_SOFT_MS = intEnv('NASA_JSON_SOFT_MS', 10 * 60 * 1000);
const JSON_HARD_MS = intEnv('NASA_JSON_HARD_MS', 60 * 60 * 1000);
const HEAD_SOFT_MS = intEnv('NASA_HEAD_SOFT_MS', 30 * 60 * 1000);
const HEAD_HARD_MS = intEnv('NASA_HEAD_HARD_MS', 6 * 60 * 60);

// Shared Redis (L2) TTLs — IMAGE ONLY (seconds)
const REDIS_HEAD_TTL_SEC = intEnv('NASA_REDIS_HEAD_TTL_SEC', 3 * 60 * 60); // 3h
const REDIS_NIVL_BEST_TTL_SEC = intEnv('NASA_REDIS_NIVL_BEST_TTL_SEC', 24 * 60 * 60); // 24h

// Circuit breaker for Redis usage in this module
const CB_BASE_MS = intEnv('NASA_REDIS_CB_BASE_MS', 5_000);
const CB_MAX_MS = intEnv('NASA_REDIS_CB_MAX_MS', 60_000);
const GETREDIS_TIMEOUT_MS = intEnv('NASA_REDIS_GET_TIMEOUT_MS', 120); // very short, avoid blocking on Redis

// Networking & resilience
const TIMEOUT_MS = intEnv('NASA_TIMEOUT_MS', 15_000);
const MAX_RETRIES = intEnv('NASA_MAX_RETRIES', 3);
const RETRY_CAP_MS = intEnv('NASA_RETRY_CAP_MS', 8_000);
const NIVL_ASSET_CONCURRENCY = intEnv('NASA_NIVL_ASSET_CONCURRENCY', 4);

const DEBUG = process.env.DEBUG_NASA === '1';

const HTTPS_UPGRADE_HOSTS = new Set<string>([
  'apod.nasa.gov',
  'images-assets.nasa.gov',
  'images.nasa.gov',
  'mars.nasa.gov',
  'epic.gsfc.nasa.gov',
]);

/* -------------------------------------------------------------------------- */
/*                                   Logging                                  */
/* -------------------------------------------------------------------------- */

function log(...args: unknown[]): void {
  if (DEBUG) console.log('[nasa]', ...args);
}
function warn(...args: unknown[]): void {
  console.warn('[nasa]', ...args);
}

/* -------------------------------------------------------------------------- */
/*                                L1 Cache Maps                                */
/* -------------------------------------------------------------------------- */

type CacheVal<T> = { value: T; fetchedAt: number; soft: number; hard: number };
const jsonCache = new Map<string, CacheVal<unknown>>();
const headCache = new Map<string, CacheVal<boolean>>();
const inflight = new Map<string, Promise<unknown>>(); // request coalescing

/* -------------------------------------------------------------------------- */
/*                              Circuit Breaker                                */
/* -------------------------------------------------------------------------- */

let redisCircuitOpenUntil = 0;
let redisFailCount = 0;

function circuitOpen(): boolean {
  return Date.now() < redisCircuitOpenUntil;
}
function tripCircuit(): void {
  redisFailCount = Math.min(redisFailCount + 1, 8);
  const backoff = Math.min(CB_BASE_MS * 2 ** (redisFailCount - 1), CB_MAX_MS);
  redisCircuitOpenUntil = Date.now() + backoff;
  if (DEBUG) console.warn('[nasa] redis circuit OPEN for', backoff, 'ms');
}
function resetCircuit(): void {
  if (redisFailCount !== 0 || redisCircuitOpenUntil !== 0) {
    if (DEBUG) console.log('[nasa] redis circuit RESET');
  }
  redisFailCount = 0;
  redisCircuitOpenUntil = 0;
}

async function getRedisFast(): Promise<Redis | null> {
  if (circuitOpen()) return null;
  try {
    const p = getRedisConnection();
    // FIX: wrap resolve for correct typings
    const r = (await Promise.race<Redis | null>([
      p,
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), GETREDIS_TIMEOUT_MS);
      }),
    ]));
    if (!r) {
      tripCircuit();
      return null;
    }
    // ioredis exposes a status string; skip if not ready
    const status = (r as Redis & { status?: string }).status;
    if (status && status !== 'ready') {
      tripCircuit();
      return null;
    }
    resetCircuit();
    return r;
  } catch {
    tripCircuit();
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Utils                                     */
/* -------------------------------------------------------------------------- */

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}
function now(): number {
  return Date.now();
}
function sha1(s: string): string {
  return crypto.createHash('sha1').update(s).digest('hex');
}
function getCached<T>(map: Map<string, CacheVal<T>>, key: string): CacheVal<T> | null {
  const v = map.get(key);
  if (!v) return null;
  if (now() > v.hard) {
    map.delete(key);
    return null;
  }
  return v;
}
function setCached<T>(map: Map<string, CacheVal<T>>, key: string, value: T, softMs: number, hardMs: number): void {
  const t = now();
  map.set(key, { value, fetchedAt: t, soft: t + softMs, hard: t + hardMs });
}

function expBackoffWithJitter(times: number, capMs: number): number {
  const base = Math.min(500 * 2 ** times, capMs);
  return Math.floor(Math.random() * base);
}
function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500;
}
function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|network\s*error|fetch failed|aborted/i.test(msg);
}

/* -------------------------------------------------------------------------- */
/*                                Fetch layer                                  */
/* -------------------------------------------------------------------------- */

async function doFetch(url: string, revalidateSeconds: number, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const opts: NextRequestInit = { signal: controller.signal };
  if (process.env.NEXT_RUNTIME) {
    opts.next = { revalidate: revalidateSeconds };
  }
  try {
    return await fetch(url, opts);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry(url: string, revalidateSeconds: number): Promise<Response> {
  let attempt = 0;

  while (true) {
    try {
      const res = await doFetch(url, revalidateSeconds);
      if (!res.ok && shouldRetry(res.status) && attempt < MAX_RETRIES) {
        attempt++;
        const delay = expBackoffWithJitter(attempt, RETRY_CAP_MS);
        log(`retry ${attempt}/${MAX_RETRIES} after ${delay}ms for ${url} (status ${res.status})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt < MAX_RETRIES && isTransientError(err)) {
        attempt++;
        const delay = expBackoffWithJitter(attempt, RETRY_CAP_MS);
        log(`retry ${attempt}/${MAX_RETRIES} after ${delay}ms for ${url} (err)`, err);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                               URL utilities                                 */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                         L1 cached JSON (per-process)                        */
/* -------------------------------------------------------------------------- */

async function cachedJson<T>(
  url: string,
  revalidateSeconds: number,
  softMs = JSON_SOFT_MS,
  hardMs = JSON_HARD_MS
): Promise<T> {
  const key = `GET ${url}`;
  const cached = getCached(jsonCache as Map<string, CacheVal<T>>, key);
  if (cached && now() < cached.soft) return cached.value as T;

  const inFlight = inflight.get(key);
  if (inFlight) return (await inFlight) as T;

  const p = (async () => {
    const res = await fetchWithRetry(url, revalidateSeconds);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const dataUnknown: unknown = await res.json();
    setCached(jsonCache, key, dataUnknown, softMs, hardMs);
    return dataUnknown as T;
  })();

  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

/* -------------------------------------------------------------------------- */
/*                 L2 (Redis) image caches + L1 (process) fronts              */
/* -------------------------------------------------------------------------- */

function redisKeyHead(url: string): string {
  return `nasa:img:head:${sha1(url)}`;
}
function redisKeyBest(nasaId: string, prefer: 'orig' | 'large' | 'any'): string {
  return `nasa:nivl:best:${nasaId}:${prefer}`;
}

/** HEAD reachability with L1 + Redis L2 + circuit breaker */
async function headReachable(url: string): Promise<boolean> {
  const keyL1 = `HEAD ${url}`;
  const l1 = getCached(headCache, keyL1);
  if (l1 && now() < l1.soft) return l1.value;

  // Coalesce in L1
  const inFlight = inflight.get(keyL1);
  if (inFlight) return (await inFlight) as boolean;

  const p = (async () => {
    // Try Redis L2
    const redis1 = await getRedisFast();
    if (redis1) {
      try {
        const v = await redis1.get(redisKeyHead(url));
        if (v != null) {
          const ok = v === '1';
          setCached(headCache, keyL1, ok, HEAD_SOFT_MS, HEAD_HARD_MS);
          return ok;
        }
      } catch {
        tripCircuit();
      }
    }

    // Compute via HEAD if not in L2 (or Redis skipped)
    let ok = false;
    try {
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(7_000) });
      ok = res.ok;
    } catch {
      ok = false;
    }

    // Write-through to L1
    setCached(headCache, keyL1, ok, HEAD_SOFT_MS, HEAD_HARD_MS);

    // Write-through to L2 (if available)
    const redis2 = await getRedisFast();
    if (redis2) {
      try {
        await redis2.setex(redisKeyHead(url), REDIS_HEAD_TTL_SEC, ok ? '1' : '0');
      } catch {
        tripCircuit();
      }
    }
    return ok;
  })();

  inflight.set(keyL1, p);
  try {
    return await p;
  } finally {
    inflight.delete(keyL1);
  }
}

/** Shared cache helpers for NIVL best asset */
async function cacheGetBestAsset(nasaId: string, prefer: 'orig' | 'large' | 'any'): Promise<string | null> {
  const key = redisKeyBest(nasaId, prefer);
  const redis = await getRedisFast();
  if (!redis) return null;
  try {
    const v = await redis.get(key);
    return v ?? null;
  } catch {
    tripCircuit();
    return null;
  }
}
async function cacheSetBestAsset(nasaId: string, prefer: 'orig' | 'large' | 'any', href: string | null): Promise<void> {
  if (!href) return;
  const key = redisKeyBest(nasaId, prefer);
  const redis = await getRedisFast();
  if (!redis) return;
  try {
    await redis.setex(key, REDIS_NIVL_BEST_TTL_SEC, href);
  } catch {
    tripCircuit();
  }
}

/* -------------------------------------------------------------------------- */
/*                          Small helpers for NIVL                             */
/* -------------------------------------------------------------------------- */

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

async function mapWithConcurrency<T, R>(
  arr: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const ret: R[] = [];
  let idx = 0;
  let active = 0;

  return await new Promise<R[]>((resolve) => {
    const next = (): void => {
      if (idx >= arr.length && active === 0) return resolve(ret);
      while (active < limit && idx < arr.length) {
        const i = idx++;
        active++;
        void fn(arr[i])
          .then((val) => {
            ret[i] = val;
          })
          .catch((e: unknown) => {
            const msg = e instanceof Error ? e.message : String(e);
            warn('NIVL asset expansion failed:', msg);
            (ret as (R | undefined)[])[i] = undefined as unknown as R;
          })
          .finally(() => {
            active--;
            next();
          });
      }
    };
    next();
  });
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
  const apod = await cachedJson<NasaApodResponse>(url, REVALIDATE_DAY);

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
  const j = await cachedJson<NivlSearchResponse>(url, REVALIDATE_HOUR);

  if (!j.collection?.items) {
    warn('NIVL API returned an invalid response format.');
    return [];
  }

  const raw: NivlItem[] = j.collection.items
    .slice(0, limit)
    .flatMap((it: NivlSearchItem): NivlItem[] => {
      const data = it.data?.[0];
      const link = it.links?.find((l: NivlLink) => l.render === 'image');
      if (!data?.nasa_id || !data?.title) return [];
      return [
        {
          nasaId: data.nasa_id,
          title: data.title,
          description: data.description,
          date: data.date_created,
          keywords: data.keywords || [],
          href: upgradeHttps(link?.href) || null,
        },
      ];
    });

  if (!opts?.expandAssets) return raw;

  const expanded = await mapWithConcurrency(raw, NIVL_ASSET_CONCURRENCY, async (it) => {
    if (!it.nasaId) return it;
    const best = await pickBestNivlAsset(it.nasaId, opts?.prefer);
    return { ...it, href: best || it.href };
  });

  return expanded.map((v, i) => v ?? raw[i]);
}

async function pickBestNivlAsset(
  nasaId: string,
  prefer: 'orig' | 'large' | 'any' = 'orig'
): Promise<string | null> {
  // 1) Try shared cache first
  const cachedBest = await cacheGetBestAsset(nasaId, prefer);
  if (cachedBest) return cachedBest;

  // 2) Hit API (L1 JSON cache used under the hood)
  try {
    const url = `https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`;
    const j = await cachedJson<NivlAssetResponse>(url, REVALIDATE_HOUR);

    if (!j.collection?.items) {
      warn('NIVL asset API returned an invalid format for', { nasaId });
      return null;
    }

    const hrefs = j.collection.items.map((x) => upgradeHttps(x.href)).filter((h): h is string => Boolean(h));
    const jpgs = hrefs.filter((h) => /\.jpe?g($|\?)/i.test(h));

    let pick: string | null = prefer === 'orig' ? jpgs.find((h) => /_orig\.jpe?g/i.test(h)) ?? null : null;
    pick = pick || largestByNameGuess(jpgs) || hrefs[0] || null;

    // 3) Validate with shared HEAD cache
    if (pick && (await headReachable(pick))) {
      await cacheSetBestAsset(nasaId, prefer, pick);
      return pick;
    }

    for (const h of hrefs) {
      if (await headReachable(h)) {
        await cacheSetBestAsset(nasaId, prefer, h);
        return h;
      }
    }
    return null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    warn(`NIVL asset error for nasaId "${nasaId}":`, msg);
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

  const j = await cachedJson<MarsRoverApiResponse>(url, REVALIDATE_HOUR);
  if (!j?.latest_photos) {
    warn('Mars Rover API returned an invalid response format.');
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
    data = await cachedJson<EpicApiResponseItem[]>(primaryUrl, REVALIDATE_HOUR);
  } catch (primaryError) {
    const msg = primaryError instanceof Error ? primaryError.message : String(primaryError);
    warn('Primary EPIC API failed, trying direct fallback...', { error: msg });
    data = await cachedJson<EpicApiResponseItem[]>(fallbackUrl, REVALIDATE_HOUR);
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
