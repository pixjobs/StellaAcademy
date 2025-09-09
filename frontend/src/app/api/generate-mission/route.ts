// app/api/generate-mission/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import type { Role, MissionType } from '@/types/llm';

// Use the shared helpers that resolve queue/redis at runtime (no static llmQueue import)
import {
  hashId,
  queueStats,
  redisPing,
  enqueueIdempotent,
  withJobHeaders,
  pollJobResponse,
} from '@/lib/api/queueHttp';
import { getQueue } from '@/lib/queue';

type RequestPayload = { missionType: MissionType; role?: Role };

/* ---------------------------- POST (enqueue) ---------------------------- */
export async function POST(req: NextRequest) {
  const started = Date.now();
  let jobId = 'unknown';

  try {
    // Parse body safely
    let body: Partial<RequestPayload> = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON body.' }, { status: 400 });
    }

    const missionType = String(body.missionType ?? '').trim();
    const role: Role = (body.role as Role) ?? 'explorer';

    if (!missionType) {
      return NextResponse.json({ error: "Missing 'missionType'." }, { status: 400 });
    }

    // Stable id for idempotency: same payload → same jobId
    jobId = hashId({ type: 'mission', payload: { missionType, role } });

    // Pre-flight observability that won't crash if queue/redis aren't ready yet
    const [ping, statsBefore] = await Promise.all([redisPing(), queueStats()]);
    console.log('[generate-mission][POST] enqueuing', {
      jobId, missionType, role, redis: ping, statsBefore, pid: process.pid, time: new Date().toISOString(),
    });

    // Idempotent add (ignore "already exists" race)
    const { state } = await enqueueIdempotent(
      'llm',
      { type: 'mission', payload: { missionType, role }, cacheKey: jobId },
      jobId
    );

    const statsAfter = await queueStats();

    const res = NextResponse.json(
      {
        accepted: true,
        jobId,
        state,
        queue: { before: statsBefore, after: statsAfter },
        redis: await redisPing(),
        message: 'Poll GET ?id=<jobId> (optionally &debug=1) for status/result.',
        server: { pid: process.pid, now: new Date().toISOString(), durationMs: Date.now() - started },
      },
      { status: 202 }
    );
    return withJobHeaders(res, jobId, state);
  } catch (err) {
    const msg = (err as Error)?.message || String(err);
    console.error('[generate-mission][POST] error', { jobId, error: msg });

    const res = NextResponse.json(
      {
        error: 'Failed to enqueue mission.',
        details: msg,
        queue: await queueStats().catch(() => ({ error: 'queue-stats-failed' })),
        redis: await redisPing().catch(() => ({ ok: false, error: 'redis-ping-failed' })),
      },
      { status: 500 }
    );
    return withJobHeaders(res, jobId, 'error');
  }
}

/* ---------------- GET (status / debug / list / stats) ---------------- */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const debug = req.nextUrl.searchParams.get('debug') === '1';
  const statsOnly = req.nextUrl.searchParams.get('stats') === '1';
  const list = req.nextUrl.searchParams.get('list') === '1';

  if (statsOnly) {
    const [ping, stats] = await Promise.all([redisPing(), queueStats()]);
    return NextResponse.json(
      { queue: stats, redis: ping, server: { pid: process.pid, now: new Date().toISOString() } },
      { status: 200 }
    );
  }

  if (list) {
    // Resolve the queue at runtime; don’t use a static llmQueue
    const q = await getQueue();
    const [waiting, active, delayed] = await Promise.all([
      q.getJobs(['waiting'], 0, 20),
      q.getJobs(['active'], 0, 20),
      q.getJobs(['delayed'], 0, 20),
    ]);
    return NextResponse.json(
      {
        waiting: waiting.map((j) => j.id),
        active: active.map((j) => j.id),
        delayed: delayed.map((j) => j.id),
      },
      { status: 200 }
    );
  }

  if (!id) return NextResponse.json({ error: 'Missing ?id=' }, { status: 400 });

  // ✅ Return the poller’s response directly (it handles 200/404/500 + debug meta)
  return pollJobResponse(id, debug);
}
