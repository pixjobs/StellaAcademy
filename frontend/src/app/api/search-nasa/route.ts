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
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  }
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
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
