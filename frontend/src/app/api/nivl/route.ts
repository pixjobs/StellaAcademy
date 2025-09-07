export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { searchNIVL } from '@/lib/nasa';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const limit = Number(searchParams.get('limit') || '6');
  if (!q) return NextResponse.json({ ok: false, error: 'Missing q' }, { status: 400 });

  try {
    const items = await searchNIVL(q, { limit });
    const images = items
      .filter(i => !!i.href)
      .map(i => ({ title: i.title, href: i.href! }));
    return NextResponse.json({ ok: true, images });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'fetch failed' }, { status: 500 });
  }
}
