// app/api/ask/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { Job } from 'bullmq';
import { llmQueue, connection as redis } from '@/lib/queue';
import type { LlmJobResult, Role } from '@/types/llm';

type AskPayload = {
  prompt: string;
  context?: string;
  role?: Role;
  mission?: string;
};

function hashId(o: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
}

async function queueStats() {
  const [waiting, active, delayed, failed, completed, isPaused] = await Promise.all([
    llmQueue.getWaitingCount(),
    llmQueue.getActiveCount(),
    llmQueue.getDelayedCount(),
    llmQueue.getFailedCount(),
    llmQueue.getCompletedCount(),
    llmQueue.isPaused(),
  ]);
  return { waiting, active, delayed, failed, completed, isPaused };
}

async function redisPing() {
  try {
    const pong = await redis.ping();
    return { ok: pong === 'PONG', pong };
  } catch (e: unknown) {
    return { ok: false, error: String((e as Error)?.message || e) };
  }
}

// ---------------------------- POST (enqueue) ----------------------------
export async function POST(req: NextRequest) {
  const started = Date.now();
  let jobId = 'unknown';

  try {
    // Robust body parsing: handle empty/malformed JSON
    const raw = await req.text();
    if (!raw) {
      return NextResponse.json({ error: 'Empty request body; expected JSON.' }, { status: 400 });
    }

    let body: AskPayload;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON body.' }, { status: 400 });
    }

    const role: Role = (body.role as Role) ?? 'explorer';
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt || prompt.length > 4000) {
      return NextResponse.json(
        { error: "Invalid 'prompt'. Provide a non-empty string up to 4000 chars." },
        { status: 400 }
      );
    }
    if (body.context && (typeof body.context !== 'string' || body.context.length > 20000)) {
      return NextResponse.json(
        { error: "Invalid 'context'. Must be a string up to 20000 chars." },
        { status: 400 }
      );
    }
    if (role !== 'explorer' && role !== 'cadet' && role !== 'scholar') {
      return NextResponse.json({ error: "Invalid 'role'. Use explorer|cadet|scholar." }, { status: 400 });
    }

    // Stable ID → include normalized role
    jobId = hashId({ type: 'ask', payload: { ...body, role } });

    const [ping, statsBefore] = await Promise.all([redisPing(), queueStats()]);
    console.log('[ask][POST] enqueuing', {
      jobId,
      role,
      hasContext: Boolean(body.context),
      mission: body.mission ?? 'general',
      redis: ping,
      statsBefore,
      pid: process.pid,
      time: new Date().toISOString(),
    });

    // Idempotent add (ignore duplicates)
    try {
      await llmQueue.add(
        'llm',
        { type: 'ask', payload: { ...body, role }, cacheKey: jobId },
        {
          jobId,
          attempts: 2,
          backoff: { type: 'exponential', delay: 1500 },
          // keep jobs around briefly to avoid 404s while polling
          removeOnComplete: { age: 120, count: 1000 }, // keep completed for 2 minutes
          removeOnFail: { age: 600, count: 1000 },     // keep failed for 10 minutes
        }
      );
    } catch (e: unknown) {
      const msg = String((e as Error)?.message || e);
      if (!/already exists/i.test(msg)) throw e;
    }

    // Report existing state if it was already enqueued/processed
    const job = await Job.fromId(llmQueue, jobId);
    const state = job ? await job.getState() : 'missing';
    const statsAfter = await queueStats();

    const res = NextResponse.json(
      {
        accepted: true,
        jobId,
        state,
        queue: { before: statsBefore, after: statsAfter },
        redis: await redisPing(),
        message: 'Poll /api/llm/enqueue?id=<jobId> for unified status, or GET this route with ?id=<jobId>&debug=1',
        server: { pid: process.pid, now: new Date().toISOString(), durationMs: Date.now() - started },
      },
      { status: 202 }
    );
    res.headers.set('x-job-id', jobId);
    res.headers.set('x-queue-state', state);
    return res;
  } catch (err: unknown) {
    console.error('[ask][POST] error', { jobId, error: String((err as Error)?.message || err) });
    const res = NextResponse.json(
      { error: 'Failed to enqueue ask.', details: String((err as Error)?.message || err) },
      { status: 500 }
    );
    res.headers.set('x-job-id', jobId);
    res.headers.set('x-queue-state', 'error');
    return res;
  }
}

// ---------------------------- GET (status / debug / list / stats) ----------------------------
export async function GET(req: NextRequest) {
  const started = Date.now();
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
    const [waiting, active, delayed] = await Promise.all([
      llmQueue.getJobs(['waiting'], 0, 20),
      llmQueue.getJobs(['active'], 0, 20),
      llmQueue.getJobs(['delayed'], 0, 20),
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

  try {
    const job = await Job.fromId(llmQueue, id);
    if (!job) {
      // Helpful 404 that explains likely causes
      return NextResponse.json(
        {
          error: 'Job not found',
          id,
          likely: [
            'Polled the wrong jobId',
            'Job was removed quickly after completion (raise removeOnComplete.age during debug)',
            'Different queue name/REDIS_URL between API and worker',
          ],
          queue: await queueStats(),
          redis: await redisPing(),
        },
        { status: 404 }
      );
    }

    const state = await job.getState();
    const progress = job.progress ?? 0;

    const meta = debug
      ? {
          id: job.id,
          name: job.name,
          state,
          progress,
          attemptsMade: job.attemptsMade,
          opts: job.opts,
          dataPreviewBytes: (() => {
            try { return JSON.stringify(job.data).length; } catch { return -1; }
          })(),
          timestamps: { timestamp: job.timestamp, processedOn: job.processedOn, finishedOn: job.finishedOn },
          stacktrace: job.stacktrace,
          queue: await queueStats(),
          redis: await redisPing(),
          server: { pid: process.pid, now: new Date().toISOString(), durationMs: Date.now() - started },
        }
      : undefined;

    if (state === 'completed') {
      const result = job.returnvalue as LlmJobResult;
      if (result?.type !== 'ask') {
        const res = NextResponse.json(
          debug ? { state, progress, error: 'Job is not an ask result', debug: meta }
                : { state, progress, error: 'Job is not an ask result' },
          { status: 409 }
        );
        res.headers.set('x-job-id', id);
        res.headers.set('x-queue-state', state);
        return res;
      }
      const res = NextResponse.json(
        debug ? { state, progress, result: result.result, debug: meta }
              : { state, progress, result: result.result },
        { status: 200 }
      );
      res.headers.set('x-job-id', id);
      res.headers.set('x-queue-state', state);
      return res;
    }

    if (state === 'failed') {
      const res = NextResponse.json(
        debug ? { state, progress, error: job.failedReason, debug: meta }
              : { state, progress, error: job.failedReason },
        { status: 500 }
      );
      res.headers.set('x-job-id', id);
      res.headers.set('x-queue-state', state);
      return res;
    }

    const res = NextResponse.json(debug ? { state, progress, debug: meta } : { state, progress }, { status: 200 });
    res.headers.set('x-job-id', id);
    res.headers.set('x-queue-state', state);
    return res;
  } catch (err: unknown) {
    console.error('[ask][GET] error', String((err as Error)?.message || err));
    const res = NextResponse.json(
      {
        error: 'Failed to read job status.',
        details: String((err as Error)?.message || err),
        queue: await queueStats().catch(() => null),
        redis: await redisPing().catch(() => null),
      },
      { status: 500 }
    );
    res.headers.set('x-job-id', id ?? '');
    res.headers.set('x-queue-state', 'error');
    return res;
  }
}
