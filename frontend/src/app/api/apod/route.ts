export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getApod } from '@/lib/apod';

export async function GET() {
  const data = await getApod();
  const res = NextResponse.json({ ok: !!data, data });
  res.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  return res;
}
