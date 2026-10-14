import type { NextRequest } from 'next/server';

/**
 * The caller's address as Google's front end saw it. Cloud Run appends that
 * address to X-Forwarded-For, so only the LAST entry can be trusted; anything
 * before it is whatever the caller chose to send. (If a load balancer is ever
 * put in front, the last entry becomes the balancer's address and every caller
 * shares one allowance: stricter, never looser. Revisit this then.)
 */
export function clientAddress(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const entries = forwarded ? forwarded.split(',').map((part) => part.trim()).filter(Boolean) : [];
  return entries[entries.length - 1] || 'unknown';
}

const MAX_TRACKED = 5000; // hard ceiling on remembered callers, so a table cannot grow without bound

/**
 * Best-effort per-instance rate limit (Cloud Run instances each keep their own
 * window). Returns a function that is true once a caller has gone over
 * `max` requests in `windowMs`.
 */
export function createRateLimiter(windowMs: number, max: number) {
  const hits = new Map<string, { count: number; reset: number }>();

  return function rateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = hits.get(ip);
    if (entry && entry.reset >= now) {
      entry.count += 1;
      return entry.count > max;
    }

    if (hits.size >= MAX_TRACKED) {
      for (const [key, value] of hits) if (value.reset < now) hits.delete(key);
      // Still full of live entries: drop the oldest (a Map iterates in insertion order).
      for (const key of hits.keys()) {
        if (hits.size < MAX_TRACKED) break;
        hits.delete(key);
      }
    }
    hits.delete(ip); // re-insert so this caller counts as the newest entry
    hits.set(ip, { count: 1, reset: now + windowMs });
    return false;
  };
}
