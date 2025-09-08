// src/lib/api/queueHttp.ts
import crypto from 'node:crypto';
import { Job, JobsOptions, Queue, JobState } from 'bullmq';
import { NextResponse } from 'next/server';
import type { LlmJobResult } from '@/types/llm';
import { getQueue as _getQueue, getConnection } from '@/lib/queue';

/* -----------------------------------------------------------------------------
 * Utils & typed aliases (no `any`)
 * -------------------------------------------------------------------------- */

export function hashId(o: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
}

/** Generic aliases to avoid `any` in the implementation. */
type AnyQueue = Queue<unknown, unknown, string>;
type AnyJob = Job<unknown, unknown, string>;

/** Give the imported getQueue proper generics without redeclaring it. */
const getQueueTyped = _getQueue as unknown as <D, R, N extends string>() => Promise<Queue<D, R, N>>;

const ALREADY_EXISTS_RE = /already exists/i;

/* -----------------------------------------------------------------------------
 * Queue stats & Redis health
 * -------------------------------------------------------------------------- */

export async function queueStats(q?: Queue) {
  try {
    const queue = q ?? (await _getQueue());
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

export async function redisPing() {
  try {
    const conn = await getConnection();
    const pong = await conn.ping();
    return { ok: pong === 'PONG', pong };
  } catch (e: unknown) {
    return { ok: false, error: String((e as Error)?.message || e) };
  }
}

/* -----------------------------------------------------------------------------
 * Defaults for adding jobs
 * -------------------------------------------------------------------------- */

export const DEFAULT_ADD_OPTS: JobsOptions = {
  attempts: 2,
  backoff: { type: 'exponential', delay: 1500 },
  removeOnComplete: { age: 3600, count: 5000 }, // 1h
  removeOnFail: { age: 86400, count: 1000 },    // 1d
};

/* -----------------------------------------------------------------------------
 * Idempotent enqueue (overloads)
 * -------------------------------------------------------------------------- */

/**
 * Overload A: named-job map. DMap keys are job names; data matches DMap[N].
 */
export async function enqueueIdempotent<
  DMap extends Record<string, unknown>,
  R,
  N extends keyof DMap & string
>(
  name: N,
  data: DMap[N],
  jobId: string,
  q?: Queue<DMap, R, N>,
  opts?: JobsOptions,
): Promise<{ job: Job<DMap, R, N> | null; state: JobState | 'unknown' | 'missing' }>;

/**
 * Overload B: single-payload queues. Any string name + one payload type D.
 */
export async function enqueueIdempotent<
  D = unknown,
  R = unknown,
  N extends string = string
>(
  name: N,
  data: D,
  jobId: string,
  q?: Queue<D, R, N>,
  opts?: JobsOptions,
): Promise<{ job: Job<D, R, N> | null; state: JobState | 'unknown' | 'missing' }>;

/**
 * Implementation (uses `unknown` aliases, no `any`).
 */
export async function enqueueIdempotent(
  name: string,
  data: unknown,
  jobId: string,
  q?: AnyQueue,
  opts: JobsOptions = DEFAULT_ADD_OPTS,
): Promise<{ job: AnyJob | null; state: JobState | 'unknown' | 'missing' }> {
  const queue = (q as AnyQueue | undefined) ?? (await getQueueTyped<unknown, unknown, string>());

  try {
    // For AnyQueue, `.add` expects name:string, data:unknown
    await queue.add(name, data, { ...opts, jobId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!ALREADY_EXISTS_RE.test(msg)) throw e; // ignore duplicate jobId only
  }

  const found = await Job.fromId(queue, jobId); // infers AnyJob | undefined
  const job: AnyJob | null = (found as AnyJob | undefined) ?? null;
  const state: JobState | 'unknown' | 'missing' = job ? await job.getState() : 'missing';
  return { job, state };
}

/* -----------------------------------------------------------------------------
 * HTTP helpers + adaptive polling
 * -------------------------------------------------------------------------- */

export type QueueStateHeader = JobState | 'unknown' | 'missing' | 'error';

const VALID_STATES: Set<string> = new Set([
  'waiting',
  'active',
  'delayed',
  'prioritized',
  'waiting-children',
  'completed',
  'failed',
  'paused',
  'unknown',
  'missing',
  'error',
]);

function normalizeState(state: string): QueueStateHeader {
  return VALID_STATES.has(state) ? (state as QueueStateHeader) : 'unknown';
}

/** Standard JSON response with x-job-id / x-queue-state headers. */
export function withJobHeaders(
  res: NextResponse,
  jobId: string,
  state: QueueStateHeader | string,
) {
  const normalized = normalizeState(String(state));
  res.headers.set('x-job-id', jobId);
  res.headers.set('x-queue-state', normalized);
  if (normalized === 'unknown' && state !== normalized) {
    res.headers.set('x-queue-state-raw', String(state));
  }
  return res;
}

/** Suggest a client backoff based on state (seconds). */
function suggestRetryAfterSec(
  state: JobState | 'unknown' | 'missing',
  job?: Job,
): number {
  switch (state) {
    case 'completed':
    case 'failed':
      return 0; // stop polling
    case 'active':
      return 1;
    case 'waiting':
    case 'prioritized':
      return 3;
    case 'waiting-children':
      return 2;
    case 'delayed': {
      const ts = job?.timestamp ?? 0; // ms
      // `delay` is not in the public typings on some versions; read it structurally.
      const delayMs = (job as unknown as { delay?: number })?.delay ?? 0;
      const eta = ts + delayMs - Date.now();
      if (Number.isFinite(eta) && eta > 0) {
        return Math.min(30, Math.max(2, Math.ceil(eta / 1000) + 1));
      }
      return 5;
    }
    case 'unknown':
    case 'missing':
    default:
      return 8;
  }
}

/** Attach Retry-After headers (seconds + ms for client convenience). */
function withRetryAfter(res: NextResponse, seconds: number) {
  if (seconds > 0) {
    res.headers.set('Retry-After', String(seconds));
    res.headers.set('x-retry-after-ms', String(seconds * 1000));
  } else {
    res.headers.delete('Retry-After');
    res.headers.delete('x-retry-after-ms');
  }
  return res;
}

/* -----------------------------------------------------------------------------
 * Poll a job (debug-friendly + adaptive backoff)
 * -------------------------------------------------------------------------- */

export async function pollJobResponse(id: string, debug = false) {
  const queue = await _getQueue();
  const job = await Job.fromId(queue, id);

  if (!job) {
    // Only compute extras on miss (helps diagnose without burning ops every poll)
    const res = NextResponse.json(
      {
        error: 'Job not found',
        id,
        likely: ['Polled wrong jobId', 'Job expired', 'Queue/worker mismatch'],
        queue: await queueStats(queue),
        redis: await redisPing(),
      },
      { status: 404 },
    );
    return withRetryAfter(withJobHeaders(res, id, 'missing'), 10);
  }

  const state = (await job.getState()) as JobState | 'unknown';
  const progress = (typeof job.progress === 'number' ? job.progress : 0) ?? 0;

  const meta =
    debug
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

  const retryAfter = suggestRetryAfterSec(state, job);

  if (state === 'completed') {
    const result = job.returnvalue as LlmJobResult;
    const res = NextResponse.json(
      debug
        ? { state, progress, result: result?.result, debug: meta }
        : { state, progress, result: result?.result },
      { status: 200 },
    );
    return withRetryAfter(withJobHeaders(res, id, state), 0);
  }

  if (state === 'failed') {
    const res = NextResponse.json(
      debug
        ? { state, progress, error: job.failedReason, debug: meta }
        : { state, progress, error: job.failedReason },
      { status: 500 },
    );
    return withRetryAfter(withJobHeaders(res, id, state), 0);
  }

  // In-flight / pending states
  const res = NextResponse.json(
    debug ? { state, progress, debug: meta } : { state, progress },
    { status: 200 },
  );
  return withRetryAfter(withJobHeaders(res, id, state), retryAfter);
}
