// src/lib/api/queueHttp.ts
import crypto from 'node:crypto';
import { Job, JobsOptions, Queue } from 'bullmq';
import { NextResponse } from 'next/server';
import type { LlmJobData, LlmJobResult } from '@/types/llm';
import {
  getQueue,
  getConnection,
  INTERACTIVE_QUEUE_NAME,
  BACKGROUND_QUEUE_NAME,
} from '@/lib/queue';

/* ─────────────────────────────────────────────────────────
   Types & small utils
────────────────────────────────────────────────────────── */

type JobG = Job<LlmJobData, unknown, string>;
type QueueG = Queue<LlmJobData, unknown, string>;

export function hashId(o: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
}

function hasResultField(x: unknown): x is { result: unknown } {
  return !!x && typeof x === 'object' && 'result' in (x as Record<string, unknown>);
}

/* ─────────────────────────────────────────────────────────
   Queue stats / Redis ping
────────────────────────────────────────────────────────── */

export async function queueStats(q?: Queue | string) {
  try {
    const statsOf = async (queue: Queue): Promise<{
      waiting: number;
      active: number;
      delayed: number;
      failed: number;
      completed: number;
      isPaused: boolean;
    }> => {
      const [waiting, active, delayed, failed, completed, isPaused] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getDelayedCount(),
        queue.getFailedCount(),
        queue.getCompletedCount(),
        queue.isPaused(),
      ]);
      return { waiting, active, delayed, failed, completed, isPaused };
    };

    if (q instanceof Queue) return statsOf(q);
    if (typeof q === 'string' && q.trim().length > 0) return statsOf(await getQueue(q));

    // Aggregate over both queues by default
    const [iq, bq] = await Promise.all([
      getQueue(INTERACTIVE_QUEUE_NAME),
      getQueue(BACKGROUND_QUEUE_NAME),
    ]);
    const [is, bs] = await Promise.all([statsOf(iq), statsOf(bq)]);
    return {
      waiting: is.waiting + bs.waiting,
      active: is.active + bs.active,
      delayed: is.delayed + bs.delayed,
      failed: is.failed + bs.failed,
      completed: is.completed + bs.completed,
      isPaused: Boolean(is.isPaused || bs.isPaused),
      interactive: is,
      background: bs,
    };
  } catch (e) {
    return { error: String((e as Error)?.message || e) };
  }
}

export async function redisPing(): Promise<{ ok: boolean; pong?: string; error?: string }> {
  try {
    const conn = await getConnection();
    const pong = await conn.ping();
    return { ok: pong === 'PONG', pong };
  } catch (e: unknown) {
    return { ok: false, error: String((e as Error)?.message || e) };
  }
}

/* ─────────────────────────────────────────────────────────
   Enqueue (idempotent)
────────────────────────────────────────────────────────── */

export const DEFAULT_ADD_OPTS: JobsOptions = {
  attempts: 2,
  backoff: { type: 'exponential', delay: 1500 },
  removeOnComplete: { age: 3600, count: 5000 }, // 1h
  removeOnFail: { age: 86400, count: 1000 },    // 1d
};

export async function enqueueIdempotent(
  name: string,
  data: unknown,
  jobId: string,
  q?: Queue | string,
  opts: JobsOptions = DEFAULT_ADD_OPTS,
): Promise<{ job: JobG | null; state: string }> {
  const queue: Queue =
    q instanceof Queue
      ? q
      : await getQueue(typeof q === 'string' && q.length > 0 ? q : INTERACTIVE_QUEUE_NAME);

  try {
    await queue.add(name, data, { ...opts, jobId });
  } catch (e: unknown) {
    const msg = String((e as Error)?.message || e);
    if (!/already exists/i.test(msg)) throw e;
  }

  // Cast to typed Job to avoid `any` generics
  const job = (await Job.fromId(queue as unknown as QueueG, jobId)) as JobG | null;
  const state = job ? await job.getState() : 'missing';
  return { job: job ?? null, state };
}

/* ─────────────────────────────────────────────────────────
   Headers helper
────────────────────────────────────────────────────────── */

export function withJobHeaders(res: NextResponse, jobId: string, state: string): NextResponse {
  res.headers.set('x-job-id', jobId);
  res.headers.set('x-queue-state', state);
  return res;
}

/* ─────────────────────────────────────────────────────────
   Poll a job by ID (searches both queues).
   Returns inner `result` (unwrapped) when present.
────────────────────────────────────────────────────────── */

export async function pollJobResponse(id: string, debug = false): Promise<NextResponse> {
  const [iq, bq] = await Promise.all([
    getQueue(INTERACTIVE_QUEUE_NAME),
    getQueue(BACKGROUND_QUEUE_NAME),
  ]);

  const jobA = (await Job.fromId(iq as unknown as QueueG, id)) as JobG | null;
  const jobB = jobA ? null : ((await Job.fromId(bq as unknown as QueueG, id)) as JobG | null);
  const job = jobA ?? jobB;
  const queueUsed = jobA ? INTERACTIVE_QUEUE_NAME : jobB ? BACKGROUND_QUEUE_NAME : 'unknown';

  if (!job) {
    return NextResponse.json(
      {
        error: 'Job not found',
        id,
        likely: [
          'Polled wrong jobId',
          'Job expired / removed',
          'Queue/worker mismatch (different REDIS_URL or names)',
        ],
        queue: await queueStats(), // aggregate view
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
          try {
            return JSON.stringify(job.data).length;
          } catch {
            return -1;
          }
        })(),
        timestamps: {
          timestamp: job.timestamp,
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
        },
        queueUsed,
        queues: await queueStats(),
        redis: await redisPing(),
        server: { pid: process.pid, now: new Date().toISOString() },
      }
    : undefined;

  if (state === 'completed') {
    const full: unknown = job.returnvalue as LlmJobResult | unknown;
    const inner = hasResultField(full) ? full.result : full;

    const res = NextResponse.json(
      debug ? { state, progress, result: inner, debug: meta } : { state, progress, result: inner },
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
