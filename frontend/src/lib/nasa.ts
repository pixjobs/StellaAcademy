/**
 * =========================================================================
 * NASA API CLIENT (Production-grade, Redis-optional, resilient)
 *
 * - No hard dependency on your Redis connection module.
 * - L1 (in-process) caches + optional L2 (Redis) via pluggable provider.
 * - Circuit breaker around Redis usage; per-command timeouts.
 * - Request coalescing for identical in-flight requests.
 * - Robust image reachability check: HEAD with 1-byte GET fallback.
 * - APOD/Mars require NASA_API_KEY; EPIC auto-falls back to public endpoint.
 * =========================================================================
 */

import crypto from 'node:crypto';
import type { Redis } from 'ioredis';
import { getNasaApiKey } from '@/lib/secrets';
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


/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

const REVALIDATE_DAY = 60 * 60 * 24;
const REVALIDATE_HOUR = 60 * 60;

// L1 cache TTLs (ms)
const JSON_SOFT_MS = intEnv('NASA_JSON_SOFT_MS', 10 * 60 * 1000);
const JSON_HARD_MS = intEnv('NASA_JSON_HARD_MS', 60 * 60 * 1000);
const HEAD_SOFT_MS = intEnv('NASA_HEAD_SOFT_MS', 30 * 60 * 1000);
const HEAD_HARD_MS = intEnv('NASA_HEAD_HARD_MS', 6 * 60 * 60);

// Optional L2 (Redis) TTLs (sec)
const REDIS_HEAD_TTL_SEC = intEnv('NASA_REDIS_HEAD_TTL_SEC', 3 * 60 * 60); // 3h
const REDIS_NIVL_BEST_TTL_SEC = intEnv('NASA_REDIS_NIVL_BEST_TTL_SEC', 24 * 60 * 60); // 24h
const REDIS_ENABLED = boolEnv('NASA_USE_REDIS_CACHE', false);
const REDIS_CMD_TIMEOUT_MS = intEnv('NASA_REDIS_CMD_TIMEOUT_MS', 1500);
const GETREDIS_TIMEOUT_MS = intEnv('NASA_REDIS_GET_TIMEOUT_MS', 400); // short, non-blocking

// Circuit breaker for Redis
const CB_BASE_MS = intEnv('NASA_REDIS_CB_BASE_MS', 5_000);
const CB_MAX_MS = intEnv('NASA_REDIS_CB_MAX_MS', 60_000);

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
/*                          Optional Redis provider                           */
/* -------------------------------------------------------------------------- */

type RedisProvider = () => Promise<Redis | null> | Redis | null;
let redisProvider: RedisProvider | null = null;

/**
 * Attach a provider to enable L2 caching. If you never call this, or
 * set env NASA_USE_REDIS_CACHE=0, the client remains Redis-free.
 */
export function setRedisProvider(provider: RedisProvider): void {
  redisProvider = provider;
}

/* -------------------------------------------------------------------------- */
/*                                L1 Cache Maps                               */
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
  if (!REDIS_ENABLED || !redisProvider) return null;
  if (circuitOpen()) return null;

  try {
    const p = Promise.resolve(redisProvider());
    const r = (await raceWithTimeout<Redis | null>(p, GETREDIS_TIMEOUT_MS, 'redis.get')) ?? null;
    if (!r) {
      tripCircuit();
      return null;
    }
    // ioredis exposes status; skip until ready
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

async function redisGetWithTimeout(r: Redis, key: string): Promise<string | null> {
  try {
    return await raceWithTimeout(r.get(key), REDIS_CMD_TIMEOUT_MS, `redis.get(${key})`);
  } catch {
    tripCircuit();
    return null;
  }
}
async function redisSetexWithTimeout(r: Redis, key: string, ttlSec: number, val: string): Promise<void> {
  try {
    await raceWithTimeout(r.setex(key, ttlSec, val), REDIS_CMD_TIMEOUT_MS, `redis.setex(${key})`);
  } catch {
    tripCircuit();
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Utils                                    */
/* -------------------------------------------------------------------------- */

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}
function boolEnv(name: string, def = false): boolean {
  const v = process.env[name];
  if (!v) return def;
  const t = v.trim().toLowerCase();
  return t === '1' || t === 'true' || t === 'yes';
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
async function raceWithTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let t: NodeJS.Timeout | null = null;
  try {
    return await Promise.race<T>([
      p,
      new Promise<T>((_, rej) => {
        t = setTimeout(() => rej(new Error(`${label} timed out in ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (t) clearTimeout(t);
  }
}

/* -------------------------------------------------------------------------- */
/*                                Fetch layer                                 */
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
  for (;;) {
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
/*                               URL utilities                                */
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

/** Robust reachability: HEAD first, fallback to GET Range: 0-0, with one retry */
async function headOrRangeCheck(url: string, attempt = 1): Promise<boolean> {
  const timeout = 7_000;
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(timeout) });
    if (res.ok) return true;
    // Some CDNs reject HEAD—probe with a 1-byte range GET:
    const res2 = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, signal: AbortSignal.timeout(timeout) });
    return res2.ok || res2.status === 206;
  } catch (e) {
    if (attempt < 2 && isTransientError(e)) {
      await new Promise((r) => setTimeout(r, expBackoffWithJitter(attempt, 1200)));
      return headOrRangeCheck(url, attempt + 1);
    }
    return false;
  }
}

/** HEAD reachability with L1 + optional Redis L2 + circuit breaker */
async function headReachable(url: string): Promise<boolean> {
  const keyL1 = `HEAD ${url}`;
  const l1 = getCached(headCache, keyL1);
  if (l1 && now() < l1.soft) return l1.value;

  const inFlight = inflight.get(keyL1);
  if (inFlight) return (await inFlight) as boolean;

  const p = (async () => {
    // Try Redis L2 read
    const r1 = await getRedisFast();
    if (r1) {
      const v = await redisGetWithTimeout(r1, redisKeyHead(url));
      if (v != null) {
        const ok = v === '1';
        setCached(headCache, keyL1, ok, HEAD_SOFT_MS, HEAD_HARD_MS);
        return ok;
      }
    }

    // Compute via network
    const ok = await headOrRangeCheck(url);
    setCached(headCache, keyL1, ok, HEAD_SOFT_MS, HEAD_HARD_MS);

    // Best-effort L2 write
    const r2 = await getRedisFast();
    if (r2 && ok != null) {
      await redisSetexWithTimeout(r2, redisKeyHead(url), REDIS_HEAD_TTL_SEC, ok ? '1' : '0');
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
  const r = await getRedisFast();
  if (!r) return null;
  return await redisGetWithTimeout(r, key);
}
async function cacheSetBestAsset(nasaId: string, prefer: 'orig' | 'large' | 'any', href: string | null): Promise<void> {
  if (!href) return;
  const key = redisKeyBest(nasaId, prefer);
  const r = await getRedisFast();
  if (!r) return;
  await redisSetexWithTimeout(r, key, REDIS_NIVL_BEST_TTL_SEC, href);
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
          .then((val) => { ret[i] = val; })
          .catch((e: unknown) => {
            const msg = e instanceof Error ? e.message : String(e);
            warn('NIVL asset expansion failed:', msg);
            (ret as (R | undefined)[])[i] = undefined as unknown as R;
          })
          .finally(() => { active--; next(); });
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

    // 3) Validate with reachability
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
  if (!apiKey) {
    warn('Mars Rover Photos skipped: NASA_API_KEY missing.');
    return [];
  }

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

// ---------------------------------------------------------------------------
// EPIC (Earth Polychromatic Imaging Camera)
// Spec: https://epic.gsfc.nasa.gov/about/api
// Primary: GSFC (no key)      -> https://epic.gsfc.nasa.gov/api/...
// Mirror:  api.nasa.gov (key) -> https://api.nasa.gov/EPIC/api/...
// ---------------------------------------------------------------------------

type EpicKind = 'natural' | 'enhanced' | 'aerosol' | 'cloud';
type EpicImageType = 'png' | 'jpg' | 'thumbs';

type EpicMeta = {
  image: string;                   // e.g. epic_1b_20161031074844
  date: string;                    // ISO
  caption?: string;
  centroid_coordinates?: { lat: number; lon: number };
  dscovr_j2000_position?: unknown;
  lunar_j2000_position?: unknown;
  sun_j2000_position?: unknown;
  attitude_quaternions?: unknown;
  coords?: unknown;
};

// --- URL builders -----------------------------------------------------------

function gsfcApiUrl(kind: EpicKind, path: 'latest' | 'available' | { date: string }): string {
  if (path === 'latest') return `https://epic.gsfc.nasa.gov/api/${kind}`;
  if (path === 'available') return `https://epic.gsfc.nasa.gov/api/${kind}/available`;
  return `https://epic.gsfc.nasa.gov/api/${kind}/date/${path.date}`;
}

function nasaMirrorApiUrl(kind: EpicKind, path: 'latest' | 'available' | { date: string }, apiKey: string): string {
  const base = `https://api.nasa.gov/EPIC/api/${kind}`;
  const q = `?api_key=${encodeURIComponent(apiKey)}`;
  if (path === 'latest') return `${base}${q}`;
  if (path === 'available') return `${base}/available${q}`;
  return `${base}/date/${path.date}${q}`;
}

function pad2(n: number): string { return String(n).padStart(2, '0'); }

function epicArchiveUrl(
  kind: EpicKind,
  isoDate: string,
  imageBase: string,
  imageType: EpicImageType = 'png',
): string {
  const d = new Date(isoDate);
  const yyyy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  const ext = imageType === 'png' ? 'png' : 'jpg';
  // thumbs are always jpg per spec
  const folder = imageType === 'thumbs' ? 'thumbs' : ext;
  return `https://epic.gsfc.nasa.gov/archive/${kind}/${yyyy}/${mm}/${dd}/${folder}/${imageBase}.${ext}`;
}

// --- Fetch helpers (reuse your retry/timeout layer if present) --------------

async function fetchJsonSafe<T>(url: string, revalidateSeconds: number): Promise<T | null> {
  try {
    // If you already have fetchWithRetry, prefer it; else fallback to simple fetch with timeout.

    const res: Response = typeof fetchWithRetry === 'function'
      ? await fetchWithRetry(url, revalidateSeconds)
      : await (async () => {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 15000);
          try { return await fetch(url, { signal: ctrl.signal }); }
          finally { clearTimeout(t); }
        })();

    if (!res.ok) return null;
    const j = (await res.json()) as T;
    return j;
  } catch {
    return null;
  }
}

// Try GSFC first (no key), then NASA mirror (if key available)
async function epicGet<T>(kind: EpicKind, path: 'latest' | 'available' | { date: string }): Promise<T | null> {
  // Prefer GSFC (doesn't require key, historically more stable)
  const primary = gsfcApiUrl(kind, path);

  const REVALIDATE_HOUR_SAFE: number = typeof REVALIDATE_HOUR === 'number' ? REVALIDATE_HOUR : 3600;
  const j1 = await fetchJsonSafe<T>(primary, REVALIDATE_HOUR_SAFE);
  if (j1) return j1;

  // Mirror (needs key)
  try {

    const apiKey: string = await getNasaApiKey();
    if (apiKey && apiKey.trim()) {
      const mirror = nasaMirrorApiUrl(kind, path, apiKey);
      const j2 = await fetchJsonSafe<T>(mirror, REVALIDATE_HOUR_SAFE);
      if (j2) return j2;
    }
  } catch {
    // ignore; we fail soft below
  }
  return null;
}

// --- Public, low-level EPIC calls -------------------------------------------

export async function epicAvailableDates(kind: EpicKind): Promise<string[]> {
  const dates = await epicGet<string[]>(kind, 'available');
  if (!Array.isArray(dates)) return [];
  // Normalize YYYY-MM-DD (the API already returns that, but be safe)
  return dates.map((d) => String(d).slice(0, 10)).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
}

export async function epicLatest(kind: EpicKind): Promise<EpicMeta[]> {
  const items = await epicGet<EpicMeta[]>(kind, 'latest');
  return Array.isArray(items) ? items : [];
}

export async function epicByDate(kind: EpicKind, date: string): Promise<EpicMeta[]> {
  const norm = String(date).slice(0, 10);
  const items = await epicGet<EpicMeta[]>(kind, { date: norm });
  return Array.isArray(items) ? items : [];
}

// --- Higher-level: variance-oriented image sampler --------------------------

function seededRng(seed: number) {
  // Mulberry32; deterministic per seed
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pickSome<T>(arr: readonly T[], count: number, rnd: () => number): T[] {
  if (count >= arr.length) return [...arr];
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

export type EpicSmartOptions = {
  kinds?: EpicKind[];           // which collections to include
  imageType?: EpicImageType;    // 'png' | 'jpg' | 'thumbs'
  sampleDatesPerKind?: number;  // how many dates to sample per kind
  itemsPerDate?: number;        // how many images per sampled date
  preferRecent?: boolean;       // bias towards most recent available dates
  seed?: number;                // stable randomness for dedupe resilience
};

export type EpicSmartItem = {
  kind: EpicKind;
  date: string;                 // YYYY-MM-DD
  href: string;                 // direct image url
  image: string;                // base name
  caption?: string;
};

export async function fetchEPICSmart(opts: EpicSmartOptions = {}): Promise<EpicSmartItem[]> {
  const {
    kinds = ['natural', 'enhanced'],
    imageType = 'jpg',
    sampleDatesPerKind = 2,
    itemsPerDate = 4,
    preferRecent = true,
    seed = Date.now(),
  } = opts;

  const rng = seededRng(seed);
  const out: EpicSmartItem[] = [];
  const seen = new Set<string>(); // dedupe by href

  for (const kind of kinds) {
    const dates = await epicAvailableDates(kind);
    if (dates.length === 0) continue;

    // Choose date set
    const chosenDates = (() => {
      if (preferRecent) {
        const recent = dates.slice(-Math.min(20, dates.length)); // cap search window
        return pickSome(recent, Math.min(sampleDatesPerKind, recent.length), rng);
      }
      return pickSome(dates, Math.min(sampleDatesPerKind, dates.length), rng);
    })();

    // Fetch per-date items
    for (const date of chosenDates) {
      const metas = await epicByDate(kind, date);
      if (!Array.isArray(metas) || metas.length === 0) continue;

      const chosen = pickSome(metas, Math.min(itemsPerDate, metas.length), rng);
      for (const m of chosen) {
        if (!m?.image || !m?.date) continue;
        const href = epicArchiveUrl(kind, m.date, m.image, imageType);
        if (seen.has(href)) continue;
        seen.add(href);
        out.push({ kind, date: date.slice(0, 10), href, image: m.image, caption: m.caption });
      }
    }
  }

  // Shuffle final result slightly for inter-kind variety
  return pickSome(out, out.length, rng);
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
