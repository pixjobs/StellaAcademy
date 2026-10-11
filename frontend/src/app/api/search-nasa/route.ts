// /app/api/search-nasa/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Values (runtime):
import { searchNIVL } from '@/lib/nasa';

// Types only:
import type { NivlItem } from '@/lib/nasa';

type RequestPayload = {
  query: string;
  page?: number;
  limit?: number;
  expandAssets?: boolean;
};

/**
 * This route acts as a secure proxy to the searchNIVL function.
 * It allows client components to fetch NASA image data without
 * ever accessing server-only code or secrets.
 */
// Best-effort per-instance rate limit (Cloud Run instances each keep their own window).
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const MAX_TRACKED = 5000; // hard ceiling on remembered callers, so the table cannot grow without bound
const hits = new Map<string, { count: number; reset: number }>();

/**
 * The caller's address as Google's front end saw it. Cloud Run appends that
 * address to X-Forwarded-For, so only the LAST entry can be trusted; anything
 * before it is whatever the caller chose to send. (If a load balancer is ever
 * put in front, the last entry becomes the balancer's address and every caller
 * shares one allowance: stricter, never looser. Revisit this then.)
 */
function clientAddress(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const entries = forwarded ? forwarded.split(',').map((part) => part.trim()).filter(Boolean) : [];
  return entries[entries.length - 1] || 'unknown';
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (entry && entry.reset >= now) {
    entry.count += 1;
    return entry.count > MAX_REQUESTS;
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
  hits.set(ip, { count: 1, reset: now + WINDOW_MS });
  return false;
}

export async function POST(req: NextRequest) {
  const ip = clientAddress(req);
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
  }

  try {
    const body = (await req.json()) as RequestPayload;
    const query = typeof body.query === 'string' ? body.query.trim().slice(0, 200) : '';
    const page = Math.min(Math.max(Math.floor(Number(body.page) || 1), 1), 50);
    const limit = Math.min(Math.max(Math.floor(Number(body.limit) || 16), 1), 50);

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const items: NivlItem[] = await searchNIVL(query, { expandAssets: true, page, limit });
    return NextResponse.json(items);
  } catch (error: unknown) {
    // Full detail goes to the server log only; clients get a generic message.
    console.error('[search-nasa] API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data from NASA Image Library.' }, { status: 500 });
  }
}
