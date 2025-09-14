/* eslint-disable no-console */

/**
 * @file http.ts
 * Robust HTTP helpers (timeouts, short retries, optional NASA api_key injection)
 * NOTE: Avoids DOM types (no Headers), so it compiles under node-only tsconfigs.
 */

import { logger } from '../utils/logger';

/* Tuning via env */
const READ_TIMEOUT_MS = Number(process.env.HTTP_READ_MS ?? 10_000);
const RETRIES_MAX     = Number(process.env.HTTP_RETRIES ?? 1);   // total attempts = RETRIES_MAX + 1
const RETRY_BASE_MS   = Number(process.env.HTTP_RETRY_BASE_MS ?? 350);
const RETRY_MAX_MS    = Number(process.env.HTTP_RETRY_MAX_MS ?? 1_500);
const USER_AGENT      = process.env.HTTP_UA ?? 'StellaAcademy/1.0 (+stella-academy)';

export class HttpError extends Error {
  constructor(public status: number, public url: string, public body?: string) {
    super(`HTTP ${status} for ${url}${body ? ` — ${body.slice(0, 160)}` : ''}`);
  }
}

export function withTimeout<T>(p: Promise<T>, ms: number, tag = 'fetch'): Promise<T> {
  let t: NodeJS.Timeout | null = null;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error(`${tag} timed out after ${ms}ms`)), ms);
    (t as any).unref?.();
  });
  return Promise.race([p, timeout]).finally(() => t && clearTimeout(t));
}

export interface FetchOptions {
  init?: RequestInit;
  timeoutMs?: number;   // per-attempt
  apiKey?: string;      // only injected when host === api.nasa.gov
  retries?: number;     // overrides global
}

/** Normalize RequestInit.headers to a plain object without using DOM types */
function toHeaderObject(h?: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!h) return out;

  // Array<[string, string]>
  if (Array.isArray(h)) {
    for (const [k, v] of h as Array<[string, string]>) out[String(k)] = String(v);
    return out;
  }
  // Headers-like (iterator)
  if (typeof (h as any)?.forEach === 'function') {
    (h as any).forEach((v: string, k: string) => { out[String(k)] = String(v); });
    return out;
  }
  // Record<string, string | number | boolean>
  if (typeof h === 'object') {
    for (const [k, v] of Object.entries(h as Record<string, unknown>)) {
      out[String(k)] = String(v);
    }
    return out;
  }
  return out;
}

function mergeHeaders(init?: RequestInit): Record<string, string> {
  const base = toHeaderObject(init?.headers);
  if (!base['Accept'])     base['Accept'] = 'application/json, text/plain;q=0.8, */*;q=0.5';
  if (!base['User-Agent']) base['User-Agent'] = USER_AGENT;
  return base;
}

function injectApiKeyIfNeeded(url: string, apiKey?: string): string {
  if (!apiKey) return url;
  try {
    const u = new URL(url);
    if (u.hostname === 'api.nasa.gov') {
      u.searchParams.set('api_key', apiKey);
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

function backoffDelay(attempt: number): number {
  const base = Math.min(RETRY_BASE_MS * 2 ** (attempt - 1), RETRY_MAX_MS);
  return Math.floor(base * (0.4 + Math.random() * 0.6));
}

function isTransientStatus(code: number): boolean {
  return code === 502 || code === 503 || code === 504;
}
function isTransientError(e: unknown): boolean {
  const s = String(e ?? '');
  return /ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|fetch failed/i.test(s)
      || /network\s+timeout|socket hang up|connection (refused|reset)/i.test(s);
}

async function safeText(res: Response): Promise<string | undefined> {
  try { return await res.text(); } catch { return undefined; }
}

async function doFetch(finalUrl: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  return withTimeout(fetch(finalUrl, init), timeoutMs, `GET ${finalUrl}`);
}

async function fetchWithRetry(finalUrl: string, init: RequestInit, timeoutMs: number, retries: number): Promise<Response> {
  let lastErr: unknown = null;
  const total = Math.max(0, retries) + 1;
  for (let attempt = 1; attempt <= total; attempt += 1) {
    try {
      if (attempt > 1) logger.debug('[http] retry', { url: finalUrl, attempt });
      const res = await doFetch(finalUrl, init, timeoutMs);
      if (!res.ok && isTransientStatus(res.status) && attempt < total) {
        const d = backoffDelay(attempt);
        logger.warn('[http] transient status, retrying', { url: finalUrl, status: res.status, delay: d });
        await new Promise(r => setTimeout(r, d));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt >= total || !isTransientError(e)) throw e;
      const d = backoffDelay(attempt);
      logger.warn('[http] network error, retrying', { url: finalUrl, error: String(e), delay: d });
      await new Promise(r => setTimeout(r, d));
    }
  }
  throw lastErr ?? new Error('fetch failed');
}

export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const timeoutMs = options.timeoutMs ?? READ_TIMEOUT_MS;
  const retries   = options.retries ?? RETRIES_MAX;

  const finalUrl = injectApiKeyIfNeeded(url, options.apiKey);
  const init: RequestInit = {
    ...options.init,
    method: options.init?.method ?? 'GET',
    headers: mergeHeaders(options.init),
  };

  logger.debug('[http] GET', { url: finalUrl, timeoutMs, retries });

  const res = await fetchWithRetry(finalUrl, init, timeoutMs, retries);
  if (!res.ok) {
    const body = await safeText(res);
    logger.warn('[http] non-OK', { url: finalUrl, status: res.status });
    throw new HttpError(res.status, finalUrl, body);
  }
  try {
    return await res.json() as T;
  } catch (e) {
    const text = await safeText(res);
    logger.error('[http] JSON parse failed', { url: finalUrl, error: String(e) });
    throw new HttpError(res.status || 200, finalUrl, text);
  }
}

export async function fetchText(url: string, options: FetchOptions = {}): Promise<string> {
  const timeoutMs = options.timeoutMs ?? READ_TIMEOUT_MS;
  const retries   = options.retries ?? RETRIES_MAX;

  const finalUrl = injectApiKeyIfNeeded(url, options.apiKey);
  const init: RequestInit = {
    ...options.init,
    method: options.init?.method ?? 'GET',
    headers: mergeHeaders(options.init),
  };

  logger.debug('[http] GET(text)', { url: finalUrl, timeoutMs, retries });

  const res = await fetchWithRetry(finalUrl, init, timeoutMs, retries);
  if (!res.ok) {
    const body = await safeText(res);
    logger.warn('[http] non-OK(text)', { url: finalUrl, status: res.status });
    throw new HttpError(res.status, finalUrl, body);
  }
  return res.text();
}
