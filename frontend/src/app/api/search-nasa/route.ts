// /app/api/search-nasa/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Values (runtime):
import { searchNIVL } from '@/lib/nasa';
import { clientAddress, createRateLimiter } from '@/lib/rate-limit';

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
const rateLimited = createRateLimiter(60_000, 30);

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
