/* eslint-disable no-console */

const DEBUG_NASA = process.env.DEBUG_NASA === '1';
const log = (...a: unknown[]) => { if (DEBUG_NASA) console.log('[NASA]', ...a); };

export class HttpError extends Error {
  constructor(public status: number, public url: string, public body?: string) {
    super(`HTTP ${status} for ${url}${body ? ` — ${body.slice(0, 160)}` : ''}`);
  }
}

export function withTimeout<T>(p: Promise<T>, ms: number, tag = 'fetch'): Promise<T> {
  let t: NodeJS.Timeout | null = null;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error(`${tag} timed out after ${ms}ms`)), ms);
    (t as unknown as { unref?: () => void }).unref?.();
  });
  return Promise.race([p, timeout]).finally(() => t && clearTimeout(t));
}

export async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = 8000): Promise<T> {
  log('GET', url);
  const res = await withTimeout(fetch(url, { ...init, method: init?.method ?? 'GET' }), timeoutMs, `GET ${url}`);
  if (!res.ok) throw new HttpError(res.status, url, await safeText(res));
  return res.json() as Promise<T>;
}

export async function fetchText(url: string, init?: RequestInit, timeoutMs = 8000): Promise<string> {
  log('GET', url);
  const res = await withTimeout(fetch(url, { ...init, method: init?.method ?? 'GET' }), timeoutMs, `GET ${url}`);
  if (!res.ok) throw new HttpError(res.status, url, await safeText(res));
  return res.text();
}

async function safeText(res: Response): Promise<string | undefined> {
  try { return await res.text(); } catch { return undefined; }
}
