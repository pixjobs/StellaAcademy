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

interface ErrorLike {
  name?: string;
  message?: string;
  stack?: string;
  code?: string | number;
}

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
const log = (reqId: string, msg: string, ctx: Record<string, unknown> = {}) => {
  if (DEBUG) console.log(`[llm/enqueue][${reqId}] ${msg}`, ctx);
};

const CACHE = new Map<string, CacheVal<LlmJobResult>>();
const SOFT_MS = Number(process.env.LLM_CACHE_SOFT_MS ?? 5 * 60 * 1000);  // 5 min
const HARD_MS = Number(process.env.LLM_CACHE_HARD_MS ?? 30 * 60 * 1000); // 30 min

const MISSING_IDS = new Map<string, MissingInfo>();
const MISSING_TTL_MS = Number(process.env.LLM_MISSING_TTL_MS ?? 2 * 60 * 1000); // 2 min window
const MISSING_MAX_HITS = Number(process.env.LLM_MISSING_MAX_HITS ?? 5);

const POSTED_IDS = new Map<string, number>();
const POSTED_GRACE_MS = Number(process.env.LLM_POSTED_GRACE_MS ?? 10 * 60 * 1000); // 10 min grace

/* ─────────────────────────────────────────────────────────
  SMALL UTILS
────────────────────────────────────────────────────────── */

function newReqId(): string {
  return crypto.randomUUID();
}

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
    CACHE.delete(id);
    return null;
  }
  return v;
}

function setCached(id: string, value: LlmJobResult): void {
  const now = Date.now();
  CACHE.set(id, { value, fetchedAt: now, soft: now + SOFT_MS, hard: now + HARD_MS });
}

function noteMissing(id: string): '404' | '410' {
  const now = Date.now();
  const cur = MISSING_IDS.get(id);
  if (!cur || now - cur.firstSeen > MISSING_TTL_MS) {
    MISSING_IDS.set(id, { firstSeen: now, hits: 1 });
    return '404';
  }
  cur.hits += 1;
  return cur.hits >= MISSING_MAX_HITS ? '410' : '404';
}

async function queueStats(): Promise<QueueStats> {
  try {
    return await queueStatsHelper();
  } catch (e) {
    return { error: String((e as ErrorLike)?.message || e) };
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

function toErrInfo(e: unknown): { name: string; message: string; stack?: string; code?: string | number } {
  const ee = (e ?? {}) as ErrorLike;
  return {
    name: ee.name ?? 'Error',
    message: ee.message ?? String(e),
    stack: ee.stack,
    code: ee.code,
  };
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
  SMART RETRY HELPERS (Redis LOADING)
────────────────────────────────────────────────────────── */

function isRedisLoadingError(e: unknown): boolean {
  const msg = (e instanceof Error ? e.message : String(e)).toUpperCase();
  // Redis presents this as: "LOADING Redis is loading the dataset in memory"
  return msg.includes('LOADING REDIS IS LOADING');
}

async function retry<T>(
  fn: () => Promise<T>,
  opts: { retries: number; baseMs?: number; maxMs?: number; onAttempt?: (i: number, e: unknown) => void }
): Promise<T> {
  const base = opts.baseMs ?? 400;
  const max = opts.maxMs ?? 3000;
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (e) {
      attempt += 1;
      opts.onAttempt?.(attempt, e);
      if (attempt > opts.retries || !isRedisLoadingError(e)) throw e;
      const backoff = Math.min(base * 2 ** (attempt - 1), max);
      const jitter = Math.round(backoff * (0.6 + Math.random() * 0.8)); // 0.6x..1.4x
      await new Promise((r) => setTimeout(r, jitter));
    }
  }
}

/* ─────────────────────────────────────────────────────────
  POST (enqueue)
────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const reqId = newReqId();
  let jobId = 'unknown';
  const t0 = Date.now();

  try {
    const raw = await req.text();
    log(reqId, 'POST start', {
      ua: req.headers.get('user-agent') ?? '',
      ip: req.headers.get('x-forwarded-for') ?? '',
      contentLength: raw.length,
    });

    if (!raw) {
      const res = okJson({ error: 'Empty body; expected JSON.' }, 400);
      return withJobHeaders(res, jobId, 'error');
    }

    let body: LlmJobData;
    const tParse0 = Date.now();
    try {
      body = JSON.parse(raw) as LlmJobData;
    } catch {
      const res = okJson({ error: 'Malformed JSON.' }, 400);
      return withJobHeaders(res, jobId, 'error');
    }
    log(reqId, 'Body parsed', { ms: Date.now() - tParse0, type: (body as { type?: string }).type });

    if (body?.type !== 'mission' && body?.type !== 'ask' && body?.type !== 'tutor-preflight') {
      const res = okJson({ error: "Invalid 'type' (use 'mission', 'ask', or 'tutor-preflight')." }, 400);
      return withJobHeaders(res, jobId, 'error');
    }
    if (!body?.payload || typeof body.payload !== 'object') {
      const res = okJson({ error: "Invalid 'payload'." }, 400);
      return withJobHeaders(res, jobId, 'error');
    }

    jobId = body.cacheKey || hashId({ type: body.type, payload: body.payload });
    log(reqId, 'Computed jobId', { jobId, cacheKeyProvided: Boolean(body.cacheKey) });

    // Fresh cache hit → return completed immediately
    const tCache0 = Date.now();
    const cached = getCached(jobId);
    if (cached && Date.now() < cached.soft) {
      log(reqId, 'Cache HIT (fresh)', {
        ageMs: Date.now() - cached.fetchedAt,
        softMsLeft: cached.soft - Date.now(),
      });
      const res = okJson(
        {
          accepted: true,
          jobId,
          state: 'completed',
          result: cached.value,
          cache: { status: 'fresh', ageSeconds: Math.floor((Date.now() - cached.fetchedAt) / 1000) },
          timings: DEBUG ? { totalMs: Date.now() - t0, parseMs: Date.now() - tParse0, cacheMs: Date.now() - tCache0 } : undefined,
        },
        200
      );
      return withJobHeaders(res, jobId, 'completed');
    }
    log(reqId, 'Cache MISS or soft-stale', { ms: Date.now() - tCache0 });

    // Optional diagnostics (avoid extra load when DEBUG is off)
    let ping: unknown = undefined;
    let statsBefore: QueueStats = {} as QueueStats;
    let workerCount = -1;
    if (DEBUG) {
      const tDiag0 = Date.now();
      [ping, statsBefore, workerCount] = await Promise.all([redisPing(), queueStats(), getWorkersCount()]);
      log(reqId, 'Diagnostics', { ms: Date.now() - tDiag0, workerCount, statsBefore });
    }

    const addOpts: JobsOptions = {
      jobId,
      attempts: 2,
      backoff: { type: 'exponential', delay: 1500 },
      removeOnComplete: { age: Number(process.env.LLM_KEEP_COMPLETE_AGE ?? 300), count: 1000 },
      removeOnFail: { age: Number(process.env.LLM_KEEP_FAIL_AGE ?? 1800), count: 1000 },
    };

    // Retry on Redis LOADING
    const tEnq0 = Date.now();
    let state: EnqueueResult['state'];
    try {
      const res = await retry(
        () =>
          enqueueIdempotent(
            'llm',
            { ...body, cacheKey: jobId },
            jobId,
            undefined,
            addOpts
          ) as Promise<EnqueueResult>,
        {
          retries: 5,
          baseMs: 300,
          maxMs: 2500,
          onAttempt: (i, e) => {
            const info = toErrInfo(e);
            log(reqId, 'enqueueIdempotent retry', { attempt: i, code: info.code, msg: info.message });
          },
        }
      );
      state = res.state;
      log(reqId, 'enqueueIdempotent ok', { state, ms: Date.now() - tEnq0 });
    } catch (e) {
      const info = toErrInfo(e);
      log(reqId, 'enqueueIdempotent failed', { code: info.code, msg: info.message, ms: Date.now() - tEnq0 });
      if (isRedisLoadingError(e)) {
        const resp = NextResponse.json(
          { error: 'Redis is loading its dataset, please retry shortly.' },
          { status: 503 }
        );
        resp.headers.set('Retry-After', '3');
        resp.headers.set('X-Poll-After-Ms', '3000');
        return withJobHeaders(resp, jobId, 'waiting');
      }
      throw e;
    }

    POSTED_IDS.set(jobId, Date.now());

    // Get current state if possible (best-effort)
    const tState0 = Date.now();
    let currentState: JobState | 'exists' | 'unknown' = state;
    try {
      const q = await getQueue();
      const job = await Job.fromId(q, jobId);
      currentState = job ? await job.getState() : state;
      log(reqId, 'State check', { ms: Date.now() - tState0, currentState });
    } catch (e) {
      const info = toErrInfo(e);
      log(reqId, 'State check failed (non-fatal)', { code: info.code, msg: info.message });
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
        timings: DEBUG
          ? {
              totalMs: Date.now() - t0,
              parseMs: Date.now() - tParse0,
              enqueueMs: Date.now() - tEnq0,
              stateCheckMs: Date.now() - tState0,
            }
          : undefined,
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
    res.headers.set('X-Req-Id', reqId);

    return withJobHeaders(res, jobId, headerState);
  } catch (err) {
    const info = toErrInfo(err);
    console.error('[llm/enqueue][POST] Unhandled error', { reqId, jobId, name: info.name, code: info.code, error: info.message, stack: info.stack });

    const payload: Record<string, unknown> = {
      error: 'Failed to enqueue job.',
      details: info.message,
      code: info.code,
    };
    if (DEBUG) {
      payload.reqId = reqId;
      payload.stack = info.stack;
      try {
        const [workers, stats, ping] = await Promise.all([getWorkersCount(), queueStats(), redisPing()]);
        payload.workers = { activeWorkers: workers };
        payload.queue = stats;
        payload.redis = ping;
      } catch {
        // ignore diag errors
      }
    }

    const res = okJson(payload, 500);
    res.headers.set('X-Req-Id', reqId);
    return withJobHeaders(res, jobId, 'error');
  }
}

/* ─────────────────────────────────────────────────────────
  GET (status / debug / list / stats)
────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const reqId = newReqId();
  const id = req.nextUrl.searchParams.get('id');
  const debug = req.nextUrl.searchParams.get('debug') === '1';
  const list = req.nextUrl.searchParams.get('list') === '1';
  const statsOnly = req.nextUrl.searchParams.get('stats') === '1';
  const lite = req.nextUrl.searchParams.get('lite') === '1';

  try {
    if (statsOnly) {
      const [ping, stats, workers] = await Promise.all([redisPing(), queueStats(), getWorkersCount()]);
      const r = okJson({ queue: stats, workers: { activeWorkers: workers }, redis: ping }, 200);
      r.headers.set('X-Req-Id', reqId);
      return withJobHeaders(r, id ?? '', 'stats');
    }

    if (list) {
      const q = await getQueue();
      const [waiting, active, delayed] = await Promise.all([
        q.getJobs(['waiting'], 0, 50),
        q.getJobs(['active'], 0, 50),
        q.getJobs(['delayed'], 0, 50),
      ]);
      const r = okJson(
        { waiting: waiting.map((j) => j.id), active: active.map((j) => j.id), delayed: delayed.map((j) => j.id) },
        200
      );
      r.headers.set('X-Req-Id', reqId);
      return withJobHeaders(r, id ?? '', 'list');
    }

    if (!id) {
      const r = okJson({ error: 'Missing ?id=' }, 400);
      r.headers.set('X-Req-Id', reqId);
      return r;
    }

    const q = await getQueue();
    const job = await Job.fromId(q, id);

    if (!job) {
      const postedAt = POSTED_IDS.get(id);
      let status: 404 | 410 = 404;
      let reason = '';

      if (postedAt && Date.now() - postedAt < POSTED_GRACE_MS) {
        status = 410;
        reason = 'Job was recently created here but already gone (expired/removed).';
      } else {
        status = noteMissing(id) === '410' ? 410 : 404;
        reason =
          status === 410
            ? 'Unknown job ID requested too many times.'
            : 'Job not found in queue.';
      }

      const payload: Record<string, unknown> = {
        error: status === 410 ? 'Job expired or was removed' : 'Job not found',
        id,
        reason,
      };
      if (DEBUG) {
        const [ping, stats, workers] = await Promise.all([redisPing(), queueStats(), getWorkersCount()]);
        payload.queue = stats;
        payload.workers = { activeWorkers: workers };
        payload.redis = ping;
      }

      const res = okJson(payload, status);
      if (status === 410) res.headers.set('Retry-After', '30');
      res.headers.set('X-Req-Id', reqId);
      return withJobHeaders(res, id, status === 410 ? 'gone' : 'missing');
    }

    const state = await job.getState();
    const progress = (typeof job.progress === 'number' ? job.progress : 0) ?? 0;

    if (state === 'completed') {
      const result = job.returnvalue;

      // Validate result before returning
      if (!isValidLlmJobResult(result)) {
        const payload = {
          state: 'failed' as const,
          progress: 100,
          error: 'Job completed but worker returned malformed or incomplete data. Check worker logs.',
          debug: debug ? ({ rawReturnValue: result } as Record<string, unknown>) : undefined,
        };
        const r = okJson(payload, 500);
        r.headers.set('X-Req-Id', reqId);
        return withJobHeaders(r, id, 'failed');
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

      const r = okJson(payload, 200);
      r.headers.set('X-Req-Id', reqId);
      return withJobHeaders(r, id, state);
    }

    if (state === 'failed') {
      const payload = debug
        ? { state, progress, error: job.failedReason, stacktrace: job.stacktrace }
        : { state, progress, error: job.failedReason };
      const r = okJson(payload, 500);
      r.headers.set('X-Req-Id', reqId);
      return withJobHeaders(r, id, state);
    }

    // Non-terminal states
    if (lite) {
      const r = okJson({ state, progress }, 200);
      r.headers.set('Retry-After', '2');
      r.headers.set('X-Poll-After-Ms', '2000');
      r.headers.set('X-Req-Id', reqId);
      return withJobHeaders(r, id, state);
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
    resp.headers.set('X-Req-Id', reqId);
    return withJobHeaders(resp, id, state);
  } catch (err) {
    const info = toErrInfo(err);
    console.error('[llm/enqueue][GET] Unhandled error', { reqId, id, name: info.name, code: info.code, error: info.message, stack: info.stack });
    const payload: Record<string, unknown> = { error: 'Failed to read job status.', details: info.message, code: info.code };
    if (DEBUG) {
      payload.reqId = reqId;
      payload.stack = info.stack;
    }
    const res = okJson(payload, 500);
    res.headers.set('X-Req-Id', reqId);
    return withJobHeaders(res, req.nextUrl.searchParams.get('id') ?? '', 'error');
  }
}
