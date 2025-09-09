// app/api/llm/enqueue/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { Job, JobsOptions, JobState } from 'bullmq';
import type { LlmJobData, LlmJobResult, TutorPreflightOutput } from '@/types/llm';

import {
  enqueueIdempotent,
  queueStats as queueStatsHelper,
  redisPing as redisPingHelper,
  withJobHeaders,
} from '@/lib/api/queueHttp';
import { getQueue } from '@/lib/queue';

/* ─────────────────────────────────────────────────────────
  TYPE DEFINITIONS & VALIDATION
────────────────────────────────────────────────────────── */

interface QueueStats {
  isPaused?: boolean;
  [key: string]: unknown;
}

type EnqueueResult = {
  state: JobState | 'exists' | 'unknown';
};

/**
 * Type guard to validate that a job's return value matches the expected LlmJobResult shape.
 * This is the critical fix to prevent malformed data from reaching the frontend.
 */
function isValidLlmJobResult(value: unknown): value is LlmJobResult {
  if (typeof value !== 'object' || value === null) return false;

  // Use `in` operator for safe property checking
  if (!('type' in value) || !('result' in value)) return false;

  const data = value as LlmJobResult;

  if (data.type === 'tutor-preflight') {
    if (typeof data.result !== 'object' || data.result === null) return false;
    const result = data.result as TutorPreflightOutput;
    return (
      typeof result.systemPrompt === 'string' &&
      Array.isArray(result.starterMessages) &&
      typeof result.warmupQuestion === 'string'
    );
  }

  // Add more specific checks for 'mission' and 'ask' results if needed for robustness.
  // For now, a basic check is sufficient.
  if (data.type === 'mission' || data.type === 'ask') {
    return typeof data.result === 'object' && data.result !== null;
  }

  return false;
}

/* ─────────────────────────────────────────────────────────
  DEBUG FLAG & CACHING
────────────────────────────────────────────────────────── */
const DEBUG = process.env.DEBUG_LLM_ENQUEUE === '1';
const log = (msg: string, ctx: Record<string, unknown> = {}) => {
  if (DEBUG) console.log(`[llm/enqueue] ${msg}`, ctx);
};

type CacheVal<T> = { value: T; fetchedAt: number; soft: number; hard: number };
const CACHE = new Map<string, CacheVal<LlmJobResult>>();
const SOFT_MS = Number(process.env.LLM_CACHE_SOFT_MS ?? 5 * 60 * 1000);
const HARD_MS = Number(process.env.LLM_CACHE_HARD_MS ?? 30 * 60 * 1000);

type MissingInfo = { firstSeen: number; hits: number };
const MISSING_IDS = new Map<string, MissingInfo>();
const MISSING_TTL_MS = Number(process.env.LLM_MISSING_TTL_MS ?? 2 * 60 * 1000);
const MISSING_MAX_HITS = Number(process.env.LLM_MISSING_MAX_HITS ?? 5);

const POSTED_IDS = new Map<string, number>();
const POSTED_GRACE_MS = Number(process.env.LLM_POSTED_GRACE_MS ?? 10 * 60 * 1000);

log('Module config', {
  SOFT_MS,
  HARD_MS,
  MISSING_TTL_MS,
  MISSING_MAX_HITS,
  POSTED_GRACE_MS,
  LLM_KEEP_COMPLETE_AGE: process.env.LLM_KEEP_COMPLETE_AGE ?? '300 (default)',
  LLM_KEEP_FAIL_AGE: process.env.LLM_KEEP_FAIL_AGE ?? '1800 (default)',
});

/* ─────────────────────────────────────────────────────────
  Small utils
────────────────────────────────────────────────────────── */
function hashId(o: unknown) {
  return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
}

function getCached(id: string) {
  const v = CACHE.get(id);
  if (!v) return null;
  if (Date.now() > v.hard) {
    log('Cache hard TTL expired, purged', { jobId: id });
    CACHE.delete(id);
    return null;
  }
  return v;
}

function setCached(id: string, value: LlmJobResult) {
  const now = Date.now();
  CACHE.set(id, { value, fetchedAt: now, soft: now + SOFT_MS, hard: now + HARD_MS });
  log('Cache set', { jobId: id, softSec: SOFT_MS / 1000, hardSec: HARD_MS / 1000 });
}

function noteMissing(id: string): '404' | '410' {
  const now = Date.now();
  const cur = MISSING_IDS.get(id);
  if (!cur || now - cur.firstSeen > MISSING_TTL_MS) {
    MISSING_IDS.set(id, { firstSeen: now, hits: 1 });
    log('Missing id noted (new/expired)', { jobId: id });
    return '404';
  }
  cur.hits += 1;
  return cur.hits >= MISSING_MAX_HITS ? '410' : '404';
}

async function queueStats(): Promise<QueueStats> {
  try {
    return await queueStatsHelper();
  } catch (e) {
    return { error: String((e as Error)?.message || e) };
  }
}
async function redisPing() {
  return redisPingHelper();
}
async function getWorkersCount(): Promise<number> {
  try {
    const q = await getQueue();
    const workers = await q.getWorkers();
    return workers.length;
  } catch {
    return -1;
  }
}

function okJson(data: object, init?: number | ResponseInit) {
  const opts: ResponseInit | undefined = typeof init === 'number' ? { status: init } : init;
  return NextResponse.json(data, opts);
}

/* ─────────────────────────────────────────────────────────
  POST (enqueue)
────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  let jobId = 'unknown';
  try {
    const raw = await req.text();
    if (!raw) return withJobHeaders(okJson({ error: 'Empty body; expected JSON.' }, 400), jobId, 'error');

    let body: LlmJobData;
    try {
      body = JSON.parse(raw);
    } catch {
      return withJobHeaders(okJson({ error: 'Malformed JSON.' }, 400), jobId, 'error');
    }

    if (body?.type !== 'mission' && body?.type !== 'ask' && body?.type !== 'tutor-preflight') {
      return withJobHeaders(okJson({ error: "Invalid 'type' (use 'mission', 'ask', or 'tutor-preflight')." }, 400), jobId, 'error');
    }
    if (!body?.payload || typeof body.payload !== 'object') {
      return withJobHeaders(okJson({ error: "Invalid 'payload'." }, 400), jobId, 'error');
    }

    jobId = body.cacheKey || hashId({ type: body.type, payload: body.payload });
    log('POST received', { jobId, type: body.type, idSource: body.cacheKey ? 'cacheKey' : 'hash' });

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
        200
      );
      return withJobHeaders(res, jobId, 'completed');
    }

    const [ping, statsBefore, workerCount] = await Promise.all([redisPing(), queueStats(), getWorkersCount()]);
    log('Enqueuing...', { jobId, workerCount });

    const addOpts: JobsOptions = {
      jobId,
      attempts: 2,
      backoff: { type: 'exponential', delay: 1500 },
      removeOnComplete: { age: Number(process.env.LLM_KEEP_COMPLETE_AGE ?? 300), count: 1000 },
      removeOnFail: { age: Number(process.env.LLM_KEEP_FAIL_AGE ?? 1800), count: 1000 },
    };

    const { state } = (await enqueueIdempotent('llm', { ...body, cacheKey: jobId }, jobId, undefined, addOpts)) as EnqueueResult;

    POSTED_IDS.set(jobId, Date.now());
    log('Job recorded in POSTED_IDS', { jobId });

    let currentState: JobState | 'exists' | 'unknown' = state;
    try {
      const q = await getQueue();
      const job = await Job.fromId(q, jobId);
      currentState = job ? await job.getState() : state;
    } catch {
      // ignore; we still respond 202
    }

    const res = okJson(
      {
        accepted: true,
        jobId,
        state: currentState,
        workerStatus: { activeWorkers: workerCount, isPaused: statsBefore.isPaused ?? false },
        queue: { before: statsBefore },
        redis: ping,
        message:
          workerCount > 0
            ? 'Poll this endpoint with GET ?id=<jobId>'
            : 'Job accepted, but no active workers were found; it will remain queued.',
      },
      202
    );
    
    const headerState = currentState === 'unknown' ? 'waiting' : currentState;
    return withJobHeaders(res, jobId, headerState);

  } catch (err) {
    const msg = (err as Error)?.message || String(err);
    console.error('[llm/enqueue][POST] Unhandled error', { jobId, error: msg });
    const res = okJson({ error: 'Failed to enqueue job.', details: msg }, 500);
    return withJobHeaders(res, jobId, 'error');
  }
}

/* ─────────────────────────────────────────────────────────
  GET (status / debug / list / stats)
────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const debug = req.nextUrl.searchParams.get('debug') === '1';
  const list = req.nextUrl.searchParams.get('list') === '1';
  const statsOnly = req.nextUrl.searchParams.get('stats') === '1';

  try {
    if (statsOnly) {
      const [ping, stats, workers] = await Promise.all([redisPing(), queueStats(), getWorkersCount()]);
      return withJobHeaders(okJson({ queue: stats, workers: { activeWorkers: workers }, redis: ping }, 200), id ?? '', 'stats');
    }

    if (list) {
      const q = await getQueue();
      const [waiting, active, delayed] = await Promise.all([
        q.getJobs(['waiting'], 0, 50),
        q.getJobs(['active'], 0, 50),
        q.getJobs(['delayed'], 0, 50),
      ]);
      return withJobHeaders(
        okJson(
          { waiting: waiting.map((j) => j.id), active: active.map((j) => j.id), delayed: delayed.map((j) => j.id) },
          200
        ),
        id ?? '',
        'list'
      );
    }

    if (!id) return okJson({ error: 'Missing ?id=' }, 400);
    log('GET status', { id });

    const q = await getQueue();
    const job = await Job.fromId(q, id);
    if (!job) {
      log('Job not found in BullMQ', { id });
      const postedAt = POSTED_IDS.get(id);
      let status: 404 | 410 = 404;
      let reason = '';

      if (postedAt && Date.now() - postedAt < POSTED_GRACE_MS) {
        status = 410;
        reason = 'Job was recently created here but already gone (expired/removed).';
        log(reason, { id, postedAt: new Date(postedAt).toISOString() });
      } else {
        status = noteMissing(id) === '410' ? 410 : 404;
        reason =
          status === 410
            ? 'Unknown job ID requested too many times.'
            : 'Job not found in queue.';
      }

      const [ping, stats, workers] = await Promise.all([redisPing(), queueStats(), getWorkersCount()]);
      const res = okJson(
        {
          error: status === 410 ? 'Job expired or was removed' : 'Job not found',
          id,
          reason,
          likely: [
            'Polling the wrong jobId',
            'Job removed after completion (raise removeOnComplete.age while debugging)',
            'Worker/route mismatch: different REDIS_URL or queue name',
          ],
          queue: stats,
          workers: { activeWorkers: workers },
          redis: ping,
        },
        status
      );
      if (status === 410) res.headers.set('Retry-After', '30');
      return withJobHeaders(res, id, status === 410 ? 'gone' : 'missing');
    }

    const state = await job.getState();
    const progress = (typeof job.progress === 'number' ? job.progress : 0) ?? 0;
    log('Job found', { id, state });

    if (state === 'completed') {
      const result = job.returnvalue;

      // ===== THE FIX IS HERE =====
      // Validate the job's return value before sending it to the client.
      // If the data is malformed, treat the job as if it failed.
      if (!isValidLlmJobResult(result)) {
        console.error(`[llm/enqueue][GET] Job ${id} completed with malformed result.`, { result });
        const payload = {
          state: 'failed',
          progress: 100, // It finished, but incorrectly.
          error: 'Job completed but worker returned malformed or incomplete data. Check worker logs.',
          debug: debug ? { rawReturnValue: result } : undefined,
        };
        return withJobHeaders(okJson(payload, 500), id, 'failed');
      }
      // ===========================

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
      return withJobHeaders(okJson(payload, 200), id, state);
    }

    if (state === 'failed') {
      const payload = debug
        ? { state, progress, error: job.failedReason, stacktrace: job.stacktrace }
        : { state, progress, error: job.failedReason };
      return withJobHeaders(okJson(payload, 500), id, state);
    }

    const [workers, counts] = await Promise.all([
      getWorkersCount(),
      (await getQueue()).getJobCounts('waiting', 'active'),
    ]);
    return withJobHeaders(
      okJson({ state, progress, workerStatus: { activeWorkers: workers, ...counts } }, 200),
      id,
      state
    );
  } catch (err) {
    const msg = (err as Error)?.message || String(err);
    console.error('[llm/enqueue][GET] Unhandled error', { id: req.nextUrl.searchParams.get('id'), error: msg });
    const res = okJson({ error: 'Failed to read job status.', details: msg }, 500);
    return withJobHeaders(res, req.nextUrl.searchParams.get('id') ?? '', 'error');
  }
}