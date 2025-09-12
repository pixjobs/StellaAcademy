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
  TYPES & VALIDATION
────────────────────────────────────────────────────────── */

interface QueueStats {
  isPaused?: boolean;
  waiting?: number;
  active?: number;
  [key: string]: unknown;
}

type EnqueueResult = {
  state: JobState | 'exists' | 'unknown';
};

type CacheVal<T> = { value: T; fetchedAt: number; soft: number; hard: number };
type MissingInfo = { firstSeen: number; hits: number };

/**
 * Validate that a job's return value matches expected LlmJobResult shape.
 */
function isValidLlmJobResult(value: unknown): value is LlmJobResult {
  if (typeof value !== 'object' || value === null) return false;
  if (!('type' in value) || !('result' in value)) return false;

  const data = value as { type: unknown; result: unknown };
  const t = data.type;

  if (t === 'tutor-preflight') {
    const r = data.result;
    if (typeof r !== 'object' || r === null) return false;
    const rr = r as TutorPreflightOutput;
    return (
      typeof rr.systemPrompt === 'string' &&
      Array.isArray(rr.starterMessages) &&
      typeof rr.warmupQuestion === 'string'
    );
  }

  if (t === 'mission' || t === 'ask') {
    return typeof data.result === 'object' && data.result !== null;
  }

  return false;
}

/* ─────────────────────────────────────────────────────────
  DEBUG, CACHES, CONSTANTS
────────────────────────────────────────────────────────── */

const DEBUG = process.env.DEBUG_LLM_ENQUEUE === '1';
const log = (msg: string, ctx: Record<string, unknown> = {}) => {
  if (DEBUG) console.log(`[llm/enqueue] ${msg}`, ctx);
};

const CACHE = new Map<string, CacheVal<LlmJobResult>>();
const SOFT_MS = Number(process.env.LLM_CACHE_SOFT_MS ?? 5 * 60 * 1000);  // 5 min
const HARD_MS = Number(process.env.LLM_CACHE_HARD_MS ?? 30 * 60 * 1000); // 30 min

const MISSING_IDS = new Map<string, MissingInfo>();
const MISSING_TTL_MS = Number(process.env.LLM_MISSING_TTL_MS ?? 2 * 60 * 1000); // 2 min window
const MISSING_MAX_HITS = Number(process.env.LLM_MISSING_MAX_HITS ?? 5);

const POSTED_IDS = new Map<string, number>();
const POSTED_GRACE_MS = Number(process.env.LLM_POSTED_GRACE_MS ?? 10 * 60 * 1000); // 10 min grace

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
  SMALL UTILS
────────────────────────────────────────────────────────── */

function hashId(o: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function getCached(id: string): CacheVal<LlmJobResult> | null {
  const v = CACHE.get(id);
  if (!v) return null;
  if (Date.now() > v.hard) {
    log('Cache hard TTL expired, purged', { jobId: id });
    CACHE.delete(id);
    return null;
  }
  return v;
}

function setCached(id: string, value: LlmJobResult): void {
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

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Compute client polling delay with jitter, based on job state and queue pressure.
 * Uses a switch to avoid comparing against states not present in JobState types.
 */
function computePollAfterMs(
  state: JobState | 'exists' | 'unknown',
  opts: { workers: number; waiting?: number; active?: number }
): number {
  let base: number;
  switch (state) {
    case 'waiting':
      base = 1500;
      break;
    case 'active':
      base = 1200;
      break;
    case 'delayed':
      base = 2000;
      break;
    default:
      // completed/failed/prioritized/waiting-children/exists/unknown/etc.
      base = 1500;
      break;
  }

  // No workers → slow down
  if (opts.workers <= 0) base = Math.max(base, 5000);

  // Pressure-based backoff
  const w = typeof opts.waiting === 'number' ? opts.waiting : 0;
  const a = typeof opts.active === 'number' ? opts.active : 0;
  const ratio = a > 0 ? w / a : w;
  if (ratio > 10) base = Math.max(base, 4000);
  else if (ratio > 3) base = Math.max(base, 2500);

  // Jitter to de-sync many clients
  const jitter = base * (0.6 + Math.random() * 0.8); // 0.6x..1.4x
  return clamp(Math.round(jitter), 800, 8000);
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
      body = JSON.parse(raw) as LlmJobData;
    } catch {
      return withJobHeaders(okJson({ error: 'Malformed JSON.' }, 400), jobId, 'error');
    }

    if (body?.type !== 'mission' && body?.type !== 'ask' && body?.type !== 'tutor-preflight') {
      return withJobHeaders(
        okJson({ error: "Invalid 'type' (use 'mission', 'ask', or 'tutor-preflight')." }, 400),
        jobId,
        'error'
      );
    }
    if (!body?.payload || typeof body.payload !== 'object') {
      return withJobHeaders(okJson({ error: "Invalid 'payload'." }, 400), jobId, 'error');
    }

    jobId = body.cacheKey || hashId({ type: body.type, payload: body.payload });
    log('POST received', { jobId, type: body.type, idSource: body.cacheKey ? 'cacheKey' : 'hash' });

    // Fresh cache hit → return completed immediately
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

    // Optional diagnostics (avoid extra load when DEBUG is off)
    const [ping, statsBefore, workerCount] = DEBUG
      ? await Promise.all([redisPing(), queueStats(), getWorkersCount()])
      : [undefined, {} as QueueStats, -1];

    log('Enqueuing...', { jobId, workerCount });

    const addOpts: JobsOptions = {
      jobId,
      attempts: 2,
      backoff: { type: 'exponential', delay: 1500 },
      removeOnComplete: { age: Number(process.env.LLM_KEEP_COMPLETE_AGE ?? 300), count: 1000 },
      removeOnFail: { age: Number(process.env.LLM_KEEP_FAIL_AGE ?? 1800), count: 1000 },
    };

    const { state } = (await enqueueIdempotent(
      'llm',
      { ...body, cacheKey: jobId },
      jobId,
      undefined,
      addOpts
    )) as EnqueueResult;

    POSTED_IDS.set(jobId, Date.now());
    log('Job recorded in POSTED_IDS', { jobId });

    // Get current state if possible
    let currentState: JobState | 'exists' | 'unknown' = state;
    try {
      const q = await getQueue();
      const job = await Job.fromId(q, jobId);
      currentState = job ? await job.getState() : state;
    } catch {
      // ignore; still return 202
    }

    // Coerce 'exists' / 'unknown' to a concrete JobState for headers/backoff
    const headerState: JobState =
      currentState === 'unknown' || currentState === 'exists' ? 'waiting' : currentState;

    const res = okJson(
      {
        accepted: true,
        jobId,
        state: currentState,
        workerStatus: DEBUG ? { activeWorkers: workerCount, isPaused: statsBefore.isPaused ?? false } : undefined,
        queue: DEBUG ? { before: statsBefore } : undefined,
        redis: DEBUG ? ping : undefined,
        message:
          workerCount > 0 || !DEBUG
            ? 'Poll this endpoint with GET ?id=<jobId>'
            : 'Job accepted, but no active workers were found; it will remain queued.',
      },
      202
    );

    const pollAfterMs = computePollAfterMs(headerState, {
      workers: DEBUG ? workerCount : -1,
      waiting: DEBUG ? Number(statsBefore.waiting ?? 0) : undefined,
      active: DEBUG ? Number(statsBefore.active ?? 0) : undefined,
    });
    res.headers.set('Retry-After', String(Math.ceil(pollAfterMs / 1000)));
    res.headers.set('X-Poll-After-Ms', String(pollAfterMs));

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
  const lite = req.nextUrl.searchParams.get('lite') === '1';

  try {
    if (statsOnly) {
      const [ping, stats, workers] = await Promise.all([redisPing(), queueStats(), getWorkersCount()]);
      return withJobHeaders(
        okJson({ queue: stats, workers: { activeWorkers: workers }, redis: ping }, 200),
        id ?? '',
        'stats'
      );
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

      const payload: Record<string, unknown> = { error: status === 410 ? 'Job expired or was removed' : 'Job not found', id, reason };
      if (DEBUG) {
        const [ping, stats, workers] = await Promise.all([redisPing(), queueStats(), getWorkersCount()]);
        payload.queue = stats;
        payload.workers = { activeWorkers: workers };
        payload.redis = ping;
      }

      const res = okJson(payload, status);
      if (status === 410) res.headers.set('Retry-After', '30');
      return withJobHeaders(res, id, status === 410 ? 'gone' : 'missing');
    }

    const state = await job.getState();
    const progress = (typeof job.progress === 'number' ? job.progress : 0) ?? 0;
    log('Job found', { id, state });

    if (state === 'completed') {
      const result = job.returnvalue;

      // Validate result before returning
      if (!isValidLlmJobResult(result)) {
        console.error(`[llm/enqueue][GET] Job ${id} completed with malformed result.`, { result });
        const payload = {
          state: 'failed' as const,
          progress: 100,
          error: 'Job completed but worker returned malformed or incomplete data. Check worker logs.',
          debug: debug ? { rawReturnValue: result } as Record<string, unknown> : undefined,
        };
        return withJobHeaders(okJson(payload, 500), id, 'failed');
      }

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

    // Non-terminal states
    if (lite) {
      const resp = okJson({ state, progress }, 200);
      resp.headers.set('Retry-After', '2');
      resp.headers.set('X-Poll-After-Ms', '2000');
      return withJobHeaders(resp, id, state);
    }

    const [workers, counts] = await Promise.all([
      getWorkersCount(),
      q.getJobCounts('waiting', 'active'),
    ]);

    const pollAfterMs = computePollAfterMs(state, {
      workers,
      waiting: counts.waiting,
      active: counts.active,
    });

    const resp = okJson(
      { state, progress, workerStatus: { activeWorkers: workers, ...counts } },
      200
    );
    resp.headers.set('Retry-After', String(Math.ceil(pollAfterMs / 1000)));
    resp.headers.set('X-Poll-After-Ms', String(pollAfterMs));
    return withJobHeaders(resp, id, state);
  } catch (err) {
    const msg = (err as Error)?.message || String(err);
    console.error('[llm/enqueue][GET] Unhandled error', { id: req.nextUrl.searchParams.get('id'), error: msg });
    const res = okJson({ error: 'Failed to read job status.', details: msg }, 500);
    return withJobHeaders(res, req.nextUrl.searchParams.get('id') ?? '', 'error');
  }
}
