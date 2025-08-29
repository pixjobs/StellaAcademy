// src/app/api/llm/enqueue/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { Job } from 'bullmq';
import { llmQueue, connection as redis } from '@/lib/queue';
import type { LlmJobData, LlmJobResult } from '@/types/llm';

// ---------- Small in-memory cache (soft/hard TTL) ----------
type CacheVal<T> = { value: T; fetchedAt: number; soft: number; hard: number };
const CACHE = new Map<string, CacheVal<LlmJobResult>>();
const SOFT_MS = Number(process.env.LLM_CACHE_SOFT_MS ?? 5 * 60 * 1000);
const HARD_MS = Number(process.env.LLM_CACHE_HARD_MS ?? 30 * 60 * 1000);

function hashId(o: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
}
function getCached(id: string) {
  const v = CACHE.get(id);
  if (!v) return null;
  if (Date.now() > v.hard) {
    CACHE.delete(id);
    return null;
  }
  return v;
}
function setCached(id: string, value: LlmJobResult) {
  const now = Date.now();
  CACHE.set(id, { value, fetchedAt: now, soft: now + SOFT_MS, hard: now + HARD_MS });
}

// ---------- Helpers ----------
async function queueStats() {
  const [waiting, active, delayed, failed, completed, isPaused, counts] = await Promise.all([
    llmQueue.getWaitingCount(),
    llmQueue.getActiveCount(),
    llmQueue.getDelayedCount(),
    llmQueue.getFailedCount(),
    llmQueue.getCompletedCount(),
    llmQueue.isPaused(),
    llmQueue.getJobCounts('waiting', 'active', 'delayed', 'completed', 'failed'),
  ]);
  return { waiting, active, delayed, failed, completed, isPaused, counts };
}

async function redisPing() {
  try {
    const pong = await redis.ping();
    return { ok: pong === 'PONG', pong };
  } catch (e: unknown) {
    return { ok: false, error: String((e as Error)?.message || e) };
  }
}

function okJson(data: any, init?: number | ResponseInit) {
  return NextResponse.json(data, init);
}

function withStdHeaders(res: NextResponse, id: string, state: string) {
  res.headers.set('x-job-id', id);
  res.headers.set('x-queue-state', state);
  return res;
}

// ---------- POST (enqueue) ----------
export async function POST(req: NextRequest) {
  const started = Date.now();
  let jobId = 'unknown';

  try {
    // robust parse
    const raw = await req.text();
    if (!raw) return okJson({ error: 'Empty body; expected JSON.' }, { status: 400 });

    let body: LlmJobData;
    try {
      body = JSON.parse(raw);
    } catch {
      return okJson({ error: 'Malformed JSON.' }, { status: 400 });
    }

    // minimal validation
    if (body?.type !== 'mission' && body?.type !== 'ask') {
      return okJson({ error: "Invalid 'type' (use 'mission' or 'ask')." }, { status: 400 });
    }
    if (!body?.payload || typeof body.payload !== 'object') {
      return okJson({ error: "Invalid 'payload'." }, { status: 400 });
    }

    // stable id
    jobId = body.cacheKey || hashId({ type: body.type, payload: body.payload });

    // serve hot cache if within soft TTL
    const cached = getCached(jobId);
    if (cached && Date.now() < cached.soft) {
      const res = okJson(
        {
          accepted: true,
          jobId,
          state: 'completed',
          result: cached.value,
          cache: { status: 'fresh', ageSeconds: Math.floor((Date.now() - cached.fetchedAt) / 1000) },
        },
        { status: 200 }
      );
      return withStdHeaders(res, jobId, 'completed');
    }

    // visibility
    const [ping, statsBefore, workers] = await Promise.all([redisPing(), queueStats(), llmQueue.getWorkers()]);
    const isWorkerRunning = workers.length > 0;

    // idempotent enqueue
    try {
      await llmQueue.add(
        'llm',
        { ...body, cacheKey: jobId },
        {
          jobId,
          attempts: 2,
          backoff: { type: 'exponential', delay: 1500 },
          // keep around briefly during debug to avoid polling 404s
          removeOnComplete: { age: Number(process.env.LLM_KEEP_COMPLETE_AGE ?? 120), count: 1000 },
          removeOnFail: { age: Number(process.env.LLM_KEEP_FAIL_AGE ?? 600), count: 1000 },
        }
      );
    } catch (e: unknown) {
      const msg = String((e as Error)?.message || e);
      if (!/already exists/i.test(msg)) {
        console.error('[llm/enqueue][POST] add error:', msg);
        return okJson({ error: 'Failed to enqueue job.' }, { status: 500 });
      }
    }

    // read current state if pre-existed
    const job = await Job.fromId(llmQueue, jobId);
    const state = job ? await job.getState() : 'queued';

    const res = okJson(
      {
        accepted: true,
        jobId,
        state,
        workerStatus: { activeWorkers: workers.length, isPaused: statsBefore.isPaused },
        queue: { before: statsBefore },
        redis: ping,
        message: isWorkerRunning
          ? 'Poll this endpoint with GET ?id=<jobId>'
          : 'Job accepted, but no active workers were found; it will remain queued.',
      },
      { status: 202 }
    );
    return withStdHeaders(res, jobId, state);
  } catch (err: unknown) {
    console.error('[llm/enqueue][POST] error', { jobId, error: String((err as Error)?.message || err) });
    const res = okJson({ error: 'Failed to enqueue job.', details: String((err as Error)?.message || err) }, { status: 500 });
    return withStdHeaders(res, jobId, 'error');
  } finally {
    // optional log
    // console.log('[llm/enqueue][POST] ms=', Date.now() - started);
  }
}

// ---------- GET (status / debug / list / stats) ----------
export async function GET(req: NextRequest) {
  const started = Date.now();
  const id = req.nextUrl.searchParams.get('id');
  const debug = req.nextUrl.searchParams.get('debug') === '1';
  const list = req.nextUrl.searchParams.get('list') === '1';
  const statsOnly = req.nextUrl.searchParams.get('stats') === '1';

  try {
    if (statsOnly) {
      const [ping, stats, workers] = await Promise.all([redisPing(), queueStats(), llmQueue.getWorkers()]);
      const res = okJson(
        {
          queue: stats,
          workers: { activeWorkers: workers.length },
          redis: ping,
          server: { pid: process.pid, now: new Date().toISOString() },
        },
        { status: 200 }
      );
      return withStdHeaders(res, id ?? '', 'stats');
    }

    if (list) {
      const [waiting, active, delayed] = await Promise.all([
        llmQueue.getJobs(['waiting'], 0, 50),
        llmQueue.getJobs(['active'], 0, 50),
        llmQueue.getJobs(['delayed'], 0, 50),
      ]);
      const res = okJson(
        {
          waiting: waiting.map((j) => j.id),
          active: active.map((j) => j.id),
          delayed: delayed.map((j) => j.id),
        },
        { status: 200 }
      );
      return withStdHeaders(res, id ?? '', 'list');
    }

    if (!id) return okJson({ error: 'Missing ?id=' }, { status: 400 });

    const job = await Job.fromId(llmQueue, id);
    if (!job) {
      const [ping, stats, workers] = await Promise.all([redisPing(), queueStats(), llmQueue.getWorkers()]);
      const res = okJson(
        {
          error: 'Job not found',
          id,
          likely: [
            'Polled the wrong jobId',
            'Job was removed shortly after completion (increase removeOnComplete.age while debugging)',
            'Worker/route mismatch: different REDIS_URL or queue name',
          ],
          queue: stats,
          workers: { activeWorkers: workers.length },
          redis: ping,
        },
        { status: 404 }
      );
      return withStdHeaders(res, id, 'missing');
    }

    const state = await job.getState();
    const progress = job.progress ?? 0;

    if (state === 'completed') {
      const result = job.returnvalue as LlmJobResult;
      setCached(id, result);

      const payload = debug
        ? {
            state,
            progress,
            result,
            debug: {
              id: job.id,
              name: job.name,
              attemptsMade: job.attemptsMade,
              opts: job.opts,
              dataPreviewBytes: (() => {
                try {
                  return JSON.stringify(job.data).length;
                } catch {
                  return -1;
                }
              })(),
              timestamps: {
                queuedAtMs: job.timestamp,
                processedOnMs: job.processedOn,
                finishedOnMs: job.finishedOn,
              },
              stacktrace: job.stacktrace,
            },
          }
        : { state, progress, result };

      const res = okJson(payload, { status: 200 });
      return withStdHeaders(res, id, state);
    }

    if (state === 'failed') {
      const payload = debug
        ? { state, progress, error: job.failedReason, stacktrace: job.stacktrace }
        : { state, progress, error: job.failedReason };
      const res = okJson(payload, { status: 500 });
      return withStdHeaders(res, id, state);
    }

    // waiting | active | delayed | paused
    const [workers, counts] = await Promise.all([llmQueue.getWorkers(), llmQueue.getJobCounts('waiting', 'active')]);
    const res = okJson({ state, progress, workerStatus: { activeWorkers: workers.length, ...counts } }, { status: 200 });
    return withStdHeaders(res, id, state);
  } catch (err: unknown) {
    const res = okJson(
      {
        error: 'Failed to read job status.',
        details: String((err as Error)?.message || err),
      },
      { status: 500 }
    );
    return withStdHeaders(res, id ?? '', 'error');
  } finally {
    // console.log('[llm/enqueue][GET] ms=', Date.now() - started);
  }
}
