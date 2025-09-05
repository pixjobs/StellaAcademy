// app/api/preFlight/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  hashId,
  queueStats,
  redisPing,
  enqueueIdempotent,
  withJobHeaders,
  pollJobResponse,
} from '@/lib/api/queueHttp';
import type { Role } from '@/types/llm';

type PreflightPayload = {
  mission: string;
  topicTitle: string;
  topicSummary: string;
  imageTitle?: string;
  role: Role;
};

export async function POST(req: NextRequest) {
  let jobId = 'unknown';
  try {
    const raw = await req.text();
    if (!raw) return NextResponse.json({ error: 'Empty request body; expected JSON.' }, { status: 400 });

    let body: PreflightPayload;
    try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Malformed JSON body.' }, { status: 400 }); }

    const { mission, topicTitle, topicSummary, imageTitle, role } = body;
    if (!mission || typeof mission !== 'string' || mission.length > 200)
      return NextResponse.json({ error: "Invalid 'mission'." }, { status: 400 });
    if (!topicTitle || typeof topicTitle !== 'string' || topicTitle.length > 500)
      return NextResponse.json({ error: "Invalid 'topicTitle'." }, { status: 400 });
    if (!topicSummary || typeof topicSummary !== 'string' || topicSummary.length > 5000)
      return NextResponse.json({ error: "Invalid 'topicSummary'." }, { status: 400 });
    if (imageTitle && (typeof imageTitle !== 'string' || imageTitle.length > 500))
      return NextResponse.json({ error: "Invalid 'imageTitle'." }, { status: 400 });
    if (role !== 'explorer' && role !== 'cadet' && role !== 'scholar')
      return NextResponse.json({ error: "Invalid 'role'. Use explorer|cadet|scholar." }, { status: 400 });

    const payloadForQueue = { mission, topicTitle, topicSummary, imageTitle, role };
    jobId = hashId({ type: 'tutor-preflight', payload: payloadForQueue });

    const [ping] = await Promise.all([redisPing()]); // keep a light log if you want
    console.log('[preFlight][POST] enqueuing', { jobId, role, mission, redis: ping });

    const { state } = await enqueueIdempotent(
      'llm',
      { type: 'tutor-preflight', payload: payloadForQueue, cacheKey: jobId },
      jobId,
    );

    const res = NextResponse.json({ accepted: true, jobId, state }, { status: 202 });
    return withJobHeaders(res, jobId, state);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[preFlight][POST] error', { jobId, error: msg });
    const res = NextResponse.json({ error: 'Failed to enqueue preFlight.', details: msg }, { status: 500 });
    return withJobHeaders(res, jobId, 'error');
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const debug = req.nextUrl.searchParams.get('debug') === '1';
  const statsOnly = req.nextUrl.searchParams.get('stats') === '1';
  const list = req.nextUrl.searchParams.get('list') === '1';

  if (statsOnly) {
    const [ping, stats] = await Promise.all([redisPing(), queueStats()]);
    return NextResponse.json(
      { queue: stats, redis: ping, server: { pid: process.pid, now: new Date().toISOString() } },
      { status: 200 },
    );
  }

  if (list) {
    // keep parity with /ask if you really need listing; otherwise you can omit
    return NextResponse.json({ error: 'List not supported on this endpoint.' }, { status: 400 });
  }

  if (!id) return NextResponse.json({ error: 'Missing ?id=' }, { status: 400 });
  return pollJobResponse(id, debug);
}
