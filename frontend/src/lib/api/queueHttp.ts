// src/lib/api/queueHttp.ts
import crypto from 'node:crypto';
import { Job, JobsOptions, Queue } from 'bullmq';
import { NextResponse } from 'next/server';
import type { LlmJobResult } from '@/types/llm';
import { getQueue, getConnection } from '@/lib/queue';

export function hashId(o: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
}

/** Basic stats for a queue (defaults to the shared LLM queue). Safe even if queue creation fails. */
export async function queueStats(q?: Queue) {
  try {
    const queue = q ?? (await getQueue());
    const [waiting, active, delayed, failed, completed, isPaused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getDelayedCount(),
      queue.getFailedCount(),
      queue.getCompletedCount(),
      queue.isPaused(),
    ]);
    return { waiting, active, delayed, failed, completed, isPaused };
  } catch (e) {
    return { error: String((e as Error)?.message || e) };
  }
}

/** Ping Redis using the shared connection. */
export async function redisPing() {
  try {
    const conn = await getConnection();
    const pong = await conn.ping();
    return { ok: pong === 'PONG', pong };
  } catch (e: unknown) {
    return { ok: false, error: String((e as Error)?.message || e) };
  }
}

export const DEFAULT_ADD_OPTS: JobsOptions = {
  attempts: 2,
  backoff: { type: 'exponential', delay: 1500 },
  removeOnComplete: { age: 3600, count: 5000 }, // 1h
  removeOnFail: { age: 86400, count: 1000 },    // 1d
};

/** Enqueue with idempotency; ignores "already exists". Returns current state. */
export async function enqueueIdempotent(
  name: string,
  data: any,
  jobId: string,
  q?: Queue,
  opts: JobsOptions = DEFAULT_ADD_OPTS,
) {
  const queue = q ?? (await getQueue());
  try {
    await queue.add(name, data, { ...opts, jobId });
  } catch (e: unknown) {
    const msg = String((e as Error)?.message || e);
    if (!/already exists/i.test(msg)) throw e;
  }
  const job = await Job.fromId(queue, jobId);
  const state = job ? await job.getState() : 'missing';
  return { job, state };
}

/** Standard JSON response with x-job-id / x-queue-state headers. */
export function withJobHeaders(res: NextResponse, jobId: string, state: string) {
  res.headers.set('x-job-id', jobId);
  res.headers.set('x-queue-state', state);
  return res;
}

/** Poll a job by id and return a DevTools-friendly response (supports debug). */
export async function pollJobResponse(id: string, debug = false) {
  const queue = await getQueue();
  const job = await Job.fromId(queue, id);
  if (!job) {
    return NextResponse.json(
      {
        error: 'Job not found',
        id,
        likely: ['Polled wrong jobId', 'Job expired', 'Queue/worker mismatch'],
        queue: await queueStats(queue),
        redis: await redisPing(),
      },
      { status: 404 },
    );
  }

  const state = await job.getState();
  const progress = (typeof job.progress === 'number' ? job.progress : 0) ?? 0;

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
        timestamps: {
          timestamp: job.timestamp,
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
        },
        stacktrace: job.stacktrace,
        queue: await queueStats(queue),
        redis: await redisPing(),
        server: { pid: process.pid, now: new Date().toISOString() },
      }
    : undefined;

  if (state === 'completed') {
    const result = job.returnvalue as LlmJobResult;
    const res = NextResponse.json(
      debug
        ? { state, progress, result: result?.result, debug: meta }
        : { state, progress, result: result?.result },
      { status: 200 },
    );
    return withJobHeaders(res, id, state);
  }

  if (state === 'failed') {
    const res = NextResponse.json(
      debug
        ? { state, progress, error: job.failedReason, debug: meta }
        : { state, progress, error: job.failedReason },
      { status: 500 },
    );
    return withJobHeaders(res, id, state);
  }

  const res = NextResponse.json(
    debug ? { state, progress, debug: meta } : { state, progress },
    { status: 200 },
  );
  return withJobHeaders(res, id, state);
}
