import { Queue, JobsOptions, Job, JobState } from 'bullmq';
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import type { LlmJobData, LlmJobResult } from '@/types/llm';
import { getConnection } from '@/lib/queue';

/* ─────────────────────────────────────────────────────────
 * QUEUE DEFINITIONS & SINGLETONS
 * This is the single source of truth for queue names and instances.
 * ────────────────────────────────────────────────────────── */

// --- CORRECT QUEUE NAMES (from worker logs) ---
export const INTERACTIVE_QUEUE_NAME = 'llm-interactive-queue';
export const BACKGROUND_QUEUE_NAME = 'llm-background-queue';

// Type-safe Queue instances (note the 3rd generic for job name type)
let interactiveQueue: Queue<LlmJobData, LlmJobResult, string> | null = null;
let backgroundQueue: Queue<LlmJobData, LlmJobResult, string> | null = null;

/**
 * A singleton provider for BullMQ Queue instances.
 * This ensures we reuse the same queue objects and Redis connection
 * across the application, which is critical for performance.
 */
export async function getQueues() {
  if (interactiveQueue && backgroundQueue) {
    return { interactiveQueue, backgroundQueue };
  }

  const connection = await getConnection();

  if (!interactiveQueue) {
    interactiveQueue = new Queue<LlmJobData, LlmJobResult, string>(INTERACTIVE_QUEUE_NAME, { connection });
  }

  if (!backgroundQueue) {
    backgroundQueue = new Queue<LlmJobData, LlmJobResult, string>(BACKGROUND_QUEUE_NAME, { connection });
  }

  return { interactiveQueue, backgroundQueue };
}

/* ─────────────────────────────────────────────────────────
 * UTILS
 * ────────────────────────────────────────────────────────── */

export function hashId(o: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
}

const ALREADY_EXISTS_RE = /already exists/i;

/* ─────────────────────────────────────────────────────────
 * QUEUE OPERATIONS & HEALTH CHECKS
 * ────────────────────────────────────────────────────────── */

export async function queueStats() {
  try {
    const { interactiveQueue, backgroundQueue } = await getQueues();
    const [iStats, bStats] = await Promise.all([
      interactiveQueue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed'),
      backgroundQueue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed'),
    ]);
    return {
      [INTERACTIVE_QUEUE_NAME]: iStats,
      [BACKGROUND_QUEUE_NAME]: bStats,
    };
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

/* ─────────────────────────────────────────────────────────
 * JOB DEFAULTS & ENQUEUE LOGIC
 * ────────────────────────────────────────────────────────── */

export const DEFAULT_ADD_OPTS: JobsOptions = {
  attempts: 2,
  backoff: { type: 'exponential', delay: 1500 },
  removeOnComplete: { age: 3600, count: 5000 },
  removeOnFail: { age: 86400, count: 1000 },
};

export async function enqueueIdempotent(
  name: string,
  data: LlmJobData,
  jobId: string,
  q: Queue<LlmJobData, LlmJobResult, string>,
  opts: JobsOptions = DEFAULT_ADD_OPTS,
): Promise<{ job: Job<LlmJobData, LlmJobResult, string> | null; state: JobState | 'exists' | 'unknown' }> {
  try {
    await q.add(name, data, { ...opts, jobId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!ALREADY_EXISTS_RE.test(msg)) throw e;
  }

  const found = await Job.fromId<LlmJobData, LlmJobResult, string>(q, jobId);
  const state: JobState | 'exists' | 'unknown' = found ? await found.getState() : 'exists';
  return { job: found ?? null, state };
}

/* ─────────────────────────────────────────────────────────
 * HTTP HELPERS & ADAPTIVE POLLING
 * ────────────────────────────────────────────────────────── */

export type QueueStateHeader = JobState | 'exists' | 'missing' | 'error' | 'unknown';

const VALID_STATES: Set<string> = new Set([
  'waiting',
  'active',
  'delayed',
  'prioritized',
  'waiting-children',
  'completed',
  'failed',
  'paused',
  'exists',
  'missing',
  'error',
  'unknown',
]);

function normalizeState(state: string): QueueStateHeader {
  return VALID_STATES.has(state) ? (state as QueueStateHeader) : 'missing';
}

export function withJobHeaders(res: NextResponse, jobId: string, state: QueueStateHeader | string) {
  res.headers.set('x-job-id', jobId);
  res.headers.set('x-queue-state', normalizeState(String(state)));
  return res;
}

function suggestRetryAfterSec(state: JobState | 'missing' | 'unknown'): number {
  switch (state) {
    case 'completed':
    case 'failed':
      return 0; // stop polling
    case 'active':
      return 1;
    case 'waiting':
      return 3;
    case 'delayed':
      return 5;
    default:
      return 8;
  }
}

function withRetryAfter(res: NextResponse, seconds: number) {
  if (seconds > 0) {
    res.headers.set('Retry-After', String(seconds));
  }
  return res;
}

export async function pollJobResponse(id: string, debug = false) {
  const { interactiveQueue, backgroundQueue } = await getQueues();

  const jobInteractive = await Job.fromId<LlmJobData, LlmJobResult, string>(interactiveQueue, id);
  const jobBackground = await Job.fromId<LlmJobData, LlmJobResult, string>(backgroundQueue, id);
  const job = jobInteractive ?? jobBackground;

  if (!job) {
    const res = NextResponse.json({ error: 'Job not found in any queue', id }, { status: 404 });
    return withRetryAfter(withJobHeaders(res, id, 'missing'), 10);
  }

  const state: JobState | 'unknown' = await job.getState();
  const progress = (job as Job<LlmJobData, LlmJobResult, string>).progress ?? 0;
  const retryAfter = suggestRetryAfterSec(state);

  if (state === 'completed') {
    const body = debug
      ? { state, progress, result: job.returnvalue, job }
      : { state, progress, result: job.returnvalue };
    const res = NextResponse.json(body, { status: 200 });
    return withRetryAfter(withJobHeaders(res, id, state), 0);
  }

  if (state === 'failed') {
    const body = debug ? { state, progress, error: job.failedReason, job } : { state, progress, error: job.failedReason };
    const res = NextResponse.json(body, { status: 500 });
    return withRetryAfter(withJobHeaders(res, id, state), 0);
  }

  const body = debug ? { state, progress, job } : { state, progress };
  const res = NextResponse.json(body, { status: 202 }); // 202 Accepted for pending states
  return withRetryAfter(withJobHeaders(res, id, state), retryAfter);
}
