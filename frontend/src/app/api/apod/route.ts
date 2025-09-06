// app/api/apod/route.ts
import { NextResponse } from 'next/server';
import { getApod } from '@/lib/apod';

export const revalidate = Number(process.env.APOD_REVALIDATE_SEC ?? 60 * 60 * 24);

export async function GET() {
  const apod = await getApod().catch(() => null);
  return NextResponse.json(
    { bgUrl: apod?.bgUrl ?? null },
    { headers: { 'Cache-Control': `s-maxage=${revalidate}, stale-while-revalidate=300` } }
  );
}
