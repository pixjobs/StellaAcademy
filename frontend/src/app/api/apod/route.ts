// app/api/apod/route.ts
import { NextResponse } from 'next/server';
import { getApod } from '@/lib/apod';

// Keep this route Node.js (or 'edge' if you prefer)
export const runtime = 'nodejs';
// Avoid static segment config; we’ll control caching via headers
export const dynamic = 'force-dynamic';

const DEFAULT_SMAXAGE = 60 * 60 * 24; // 24h
const DEFAULT_SWR = 300;              // 5m

function getSMaxAge(): number {
  const raw = process.env.APOD_REVALIDATE_SEC;
  const n = raw ? Number(raw) : DEFAULT_SMAXAGE;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_SMAXAGE;
}

export async function GET() {
  const apod = await getApod().catch(() => null);

  const sMaxAge = getSMaxAge();
  const headers = new Headers({
    // Control CDN/edge caching explicitly
    'Cache-Control': `public, s-maxage=${sMaxAge}, stale-while-revalidate=${DEFAULT_SWR}`,
  });

  return NextResponse.json(
    { bgUrl: apod?.bgUrl ?? null },
    { headers }
  );
}
