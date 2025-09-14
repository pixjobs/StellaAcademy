// src/app/api/llm/enqueue/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { Job, JobsOptions, JobState } from 'bullmq';
import type {
  LlmJobData,
  LlmJobResult,
  TutorPreflightOutput,
  MissionJobData,
} from '@/types/llm';
import { enqueueIdempotent, withJobHeaders } from '@/lib/api/queueHttp';
import {
  getQueue,
  INTERACTIVE_QUEUE_NAME,
  BACKGROUND_QUEUE_NAME,
} from '@/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type EnqueueResult = { state: JobState | 'exists' | 'unknown' };
type CacheVal<T> = { value: T; fetchedAt: number; soft: number; hard: number };
interface ErrorLike {
  name?: string;
  message?: string;
  stack?: string;
  code?: string | number;
}

const isDev = process.env.NODE_ENV !== 'production';

/* ─────────────────────────────────────────────────────────
  Validators
────────────────────────────────────────────────────────── */
function isValidLlmJobResult(value: unknown): value is LlmJobResult {
  if (typeof value !== 'object' || value === null) return false;
  if (!('type' in value) || !('result' in value)) return false;

  const v = value as { type: unknown; result: unknown };
  const t = v.type;

  if (t === 'tutor-preflight') {
    const r = v.result as TutorPreflightOutput | undefined;
    return (
      !!r &&
      typeof r.systemPrompt === 'string' &&
      Array.isArray(r.starterMessages) &&
      typeof r.warmupQuestion === 'string' &&
      typeof r.difficultyHints === 'object' &&
      r.difficultyHints !== null
    );
  }
  if (t === 'mission' || t === 'ask') {
    return typeof v.result === 'object' && v.result !== null;
  }
  return false;
}

/* ─────────────────────────────────────────────────────────
  Debug / cache
────────────────────────────────────────────────────────── */
const log = (reqId: string, msg: string, ctx: Record<string, unknown> = {}) => {
  try {
    console.log(`[llm/enqueue][${reqId}] ${msg}`, JSON.stringify(ctx));
  } catch {
    console.log(`[llm/enqueue][${reqId}] ${msg}`, ctx);
  }
};

const CACHE = new Map<string, CacheVal<LlmJobResult>>();
const SOFT_MS = Number(process.env.LLM_CACHE_SOFT_MS ?? 5 * 60 * 1000);
const HARD_MS = Number(process.env.LLM_CACHE_HARD_MS ?? 30 * 60 * 1000);

/* ─────────────────────────────────────────────────────────
  Small utils
────────────────────────────────────────────────────────── */
function newReqId(): string {
  return crypto.randomUUID();
}
function hashId(o: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
}
function okJson(data: object, init?: number | ResponseInit) {
  return NextResponse.json(
    data,
    typeof init === 'number' ? { status: init } : init,
  );
}
function toErrInfo(e: unknown): ErrorLike {
  const ee = (e ?? {}) as ErrorLike;
  return {
    name: ee.name ?? 'Error',
    message: ee.message ?? String(e),
    stack: ee.stack,
    code: ee.code,
  };
}
function getClientIp(req: NextRequest): string {
  const h = req.headers;
  const candidates = [
    h.get('x-forwarded-for'),
    h.get('x-real-ip'),
    h.get('cf-connecting-ip'),
    h.get('fastly-client-ip'),
    h.get('true-client-ip'),
    h.get('x-client-ip'),
    h.get('x-cluster-client-ip'),
    h.get('forwarded'),
  ].filter(Boolean) as string[];

  if (candidates.length > 0) {
    const fwd = candidates[0];
    if (fwd.includes(',')) return fwd.split(',')[0].trim();
    if (fwd.startsWith('for=')) {
      const m = /for="?([\[\]A-Fa-f0-9\.:]+)"?/i.exec(fwd);
      if (m?.[1]) return m[1];
    }
    return fwd;
  }
  return 'unknown';
}
function getCached(id: string): CacheVal<LlmJobResult> | null {
  const v = CACHE.get(id);
  if (!v || Date.now() > v.hard) {
    if (v) CACHE.delete(id);
    return null;
  }
  return v;
}
function setCached(id: string, value: LlmJobResult): void {
  const now = Date.now();
  CACHE.set(id, {
    value,
    fetchedAt: now,
    soft: now + SOFT_MS,
    hard: now + HARD_MS,
  });
}

/* ─────────────────────────────────────────────────────────
  POST (enqueue)
────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const reqId = newReqId();
  let jobId = 'unknown';

  console.log(`[llm/enqueue][${reqId}] Received POST request`);
  try {
    const raw = await req.text();
    log(reqId, 'POST start', {
      contentLength: raw.length,
      remoteAddress: getClientIp(req),
      path: req.nextUrl.pathname,
      search: req.nextUrl.search,
    });

    if (!raw) {
      log(reqId, 'Request body is empty');
      return withJobHeaders(
        okJson({ error: 'Empty body; expected JSON.' }, 400),
        jobId,
        'error',
      );
    }

    let body: LlmJobData;
    try {
      body = JSON.parse(raw) as LlmJobData;
      log(reqId, 'Successfully parsed JSON body', {
        type: (body as { type?: unknown })?.type,
      });
    } catch (e) {
      const errInfo = toErrInfo(e);
      log(reqId, 'Malformed JSON body', { error: errInfo.message });
      return withJobHeaders(
        okJson({ error: 'Malformed JSON.', details: errInfo.message }, 400),
        jobId,
        'error',
      );
    }

    if (
      body?.type !== 'mission' &&
      body?.type !== 'ask' &&
      body?.type !== 'tutor-preflight'
    ) {
      log(reqId, 'Validation Error: Invalid type', {
        type: (body as { type?: unknown })?.type,
      });
      return withJobHeaders(
        okJson(
          { error: "Invalid 'type' (use 'mission', 'ask', or 'tutor-preflight')." },
          400,
        ),
        jobId,
        'error',
      );
    }
    if (!body?.payload || typeof body.payload !== 'object') {
      log(reqId, 'Validation Error: Invalid payload');
      return withJobHeaders(
        okJson({ error: "Invalid 'payload'." }, 400),
        jobId,
        'error',
      );
    }
    log(reqId, 'Body validation passed');

    // ───────────────────────────────────────────────────────────────
    // SHORT-CIRCUIT MISSIONS → delegate to fast route (Firestore-first)
    // (Avoids queue loops; fast route does its own enqueue if needed)
    // ───────────────────────────────────────────────────────────────
    if (body.type === 'mission') {
      const { missionType, role } = (body as MissionJobData).payload;

      // 6h freshness hint; /api/missions/stream decides real TTL
      const MAX_AGE_MS = 6 * 60 * 60 * 1000;

      const fastUrl = new URL('/api/missions/stream', req.url);
      fastUrl.searchParams.set('mission', missionType);
      fastUrl.searchParams.set('role', role || 'explorer');
      fastUrl.searchParams.set('maxAgeMs', String(MAX_AGE_MS));

      // Optional "force" if the client included it
      const force =
        (body as unknown as { payload?: { force?: boolean | number } })?.payload
          ?.force;
      if (force) fastUrl.searchParams.set('force', '1');

      log(reqId, 'Delegating mission to fast route', {
        url: fastUrl.toString(),
      });

      const fastRes = await fetch(fastUrl.toString(), {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'x-internal-proxy': 'llm/enqueue',
          accept: 'application/json',
        },
      });

      let fastBody: Record<string, unknown> = {};
      try {
        // Some edge responses might be empty/non-JSON; guard it.
        fastBody = (await fastRes.json()) as Record<string, unknown>;
      } catch {
        // leave as {}
      }

      const jobFromFast =
        (typeof fastBody.jobId === 'string' && fastBody.jobId) || 'fast-mission';

      // Map fast status → header job state (for client backoff)
      const status = typeof fastBody.status === 'string' ? fastBody.status : '';
      const stateFromFast: JobState | 'error' =
        status === 'ready'
          ? 'completed'
          : status === 'stale' || status === 'queued'
          ? 'waiting'
          : fastRes.ok
          ? 'waiting'
          : 'error';

      const out = NextResponse.json(fastBody as object, {
        status: fastRes.status,
      });
      out.headers.set('X-Req-Id', reqId);
      out.headers.set('X-Fast-Delegated', '1');
      return withJobHeaders(out, jobFromFast, stateFromFast);
    }
    // ───────────────────────────────────────────────────────────────

    // From here on only ask / tutor-preflight go to the interactive queue
    jobId = body.cacheKey || hashId({ type: body.type, payload: body.payload });
    log(reqId, 'Computed jobId', { jobId, type: body.type });

    const cached = getCached(jobId);
    if (cached && Date.now() < cached.soft) {
      const ageMs = Date.now() - cached.fetchedAt;
      log(reqId, 'Cache HIT (fresh)', { ageMs, jobId });
      const res = okJson(
        {
          accepted: true,
          jobId,
          state: 'completed',
          result: cached.value,
          cache: { status: 'fresh' },
        },
        200,
      );
      res.headers.set('X-Req-Id', reqId);
      res.headers.set('X-Cache', 'fresh');
      return withJobHeaders(res, jobId, 'completed');
    }
    if (cached) {
      log(reqId, 'Cache HIT (stale)', {
        ageMs: Date.now() - cached.fetchedAt,
        jobId,
      });
    } else {
      log(reqId, 'Cache MISS', { jobId });
    }

    // Queues
    log(reqId, 'Fetching queues...');
    const [interactiveQueue, backgroundQueue] = await Promise.all([
      getQueue(INTERACTIVE_QUEUE_NAME),
      getQueue(BACKGROUND_QUEUE_NAME),
    ]);
    log(reqId, 'Queues ready', {
      interactiveQueue: interactiveQueue.name,
      backgroundQueue: backgroundQueue.name,
    });

    const targetQueue = interactiveQueue; // only interactive types reach here
    const priority = 1; // interactive tasks high priority

    const removeOnComplete: JobsOptions['removeOnComplete'] = isDev
      ? false
      : { age: 300, count: 1000 };
    const removeOnFail: JobsOptions['removeOnFail'] = {
      age: 1800,
      count: 1000,
    };

    const addOpts: JobsOptions = {
      jobId,
      attempts: 2,
      priority,
      backoff: { type: 'exponential', delay: 1500 },
      removeOnComplete,
      removeOnFail,
    };

    log(reqId, 'Job options configured', { priority });

    // enqueue
    log(reqId, 'Calling enqueueIdempotent', { jobId });
    const { state } = (await enqueueIdempotent(
      body.type,
      { ...body, cacheKey: jobId },
      jobId,
      targetQueue,
      addOpts,
    )) as EnqueueResult;

    log(reqId, 'enqueueIdempotent finished', { state, jobId });

    const res = okJson({ accepted: true, jobId, state }, 202);
    res.headers.set('X-Req-Id', reqId);
    res.headers.set('X-Queue', targetQueue.name);
    res.headers.set('X-Job-Priority', String(priority));
    log(reqId, 'Returning 202 Accepted', { jobId, state });
    return withJobHeaders(
      res,
      jobId,
      state === 'exists' || state === 'unknown' ? 'waiting' : state,
    );
  } catch (err) {
    const info = toErrInfo(err);
    console.error(`[llm/enqueue][${reqId}][FATAL] Unhandled error in POST`, {
      reqId,
      jobId,
      errorName: info.name,
      errorMessage: info.message,
      errorCode: info.code,
      stack: info.stack,
    });
    const res = okJson(
      { error: 'Failed to enqueue job.', details: info.message, code: info.code },
      500,
    );
    res.headers.set('X-Req-Id', reqId);
    return withJobHeaders(res, jobId, 'error');
  }
}

/* ─────────────────────────────────────────────────────────
  GET (status / debug / list / stats)
────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const reqId = newReqId();
  const id = req.nextUrl.searchParams.get('id');
  const debug = req.nextUrl.searchParams.get('debug') === '1';

  log(reqId, 'GET request received', { id, debug });

  if (!id) {
    log(reqId, 'Missing job ID in query params');
    return okJson({ error: 'Missing ?id=' }, 400);
  }

  try {
    // Load queues
    log(reqId, 'Loading queues for GET...', { id });
    const [interactiveQueue, backgroundQueue] = await Promise.all([
      getQueue(INTERACTIVE_QUEUE_NAME),
      getQueue(BACKGROUND_QUEUE_NAME),
    ]);
    log(reqId, 'Queues loaded', {
      id,
      interactiveQueue: interactiveQueue.name,
      backgroundQueue: backgroundQueue.name,
    });

    // Find job
    log(reqId, 'Searching for job', { id });
    const candidateA = await Job.fromId<LlmJobData, LlmJobResult>(
      interactiveQueue,
      id,
    );
    let job: Job<LlmJobData, LlmJobResult, string> | undefined =
      candidateA ?? undefined;
    let queueName = interactiveQueue.name;

    if (!job) {
      const candidateB = await Job.fromId<LlmJobData, LlmJobResult>(
        backgroundQueue,
        id,
      );
      job = candidateB ?? undefined;
      if (job) queueName = backgroundQueue.name;
    }

    if (!job) {
      log(reqId, 'Job not found', { id });
      return withJobHeaders(
        okJson({ error: 'Job not found in any active queue.', id }, 404),
        id,
        'unknown',
      );
    }

    log(reqId, 'Job found', { id, queueName });

    const state = await job.getState();
    const progress =
      typeof job.progress === 'number' ? job.progress : (0 as number);

    log(reqId, 'State/progress retrieved', { id, state, progress });

    if (state === 'completed') {
      const resultUnknown = job.returnvalue as unknown;
      if (!isValidLlmJobResult(resultUnknown)) {
        log(reqId, 'Completed job has malformed data', { id });
        const payload = {
          state: 'failed' as const,
          progress: 100,
          error: 'Worker returned malformed data.',
        };
        return withJobHeaders(okJson(payload, 500), id, 'failed');
      }

      const result = resultUnknown as LlmJobResult;
      setCached(id, result);

      const dbg = debug
        ? {
            id: job.id,
            name: job.name,
            queue: queueName,
            attemptsMade: job.attemptsMade,
            timestamp: job.timestamp,
            processedOn: job.processedOn,
            finishedOn: job.finishedOn,
          }
        : undefined;

      const payload = dbg
        ? { state, progress, result, debug: dbg }
        : { state, progress, result };
      return withJobHeaders(okJson(payload, 200), id, state);
    }

    if (state === 'failed') {
      const dbg = debug
        ? {
            id: job.id,
            name: job.name,
            queue: queueName,
            attemptsMade: job.attemptsMade,
            timestamp: job.timestamp,
            failedReason: job.failedReason,
            stacktrace: job.stacktrace,
          }
        : undefined;
      const payload = dbg
        ? { state, progress, error: job.failedReason, debug: dbg }
        : { state, progress, error: job.failedReason };
      return withJobHeaders(okJson(payload, 500), id, state);
    }

    // pending-ish states
    const { interactiveStats, backgroundStats } = await getQueuesAndStats();
    const totalWaiting =
      (interactiveStats.waiting ?? 0) + (backgroundStats.waiting ?? 0);
    const totalActive =
      (interactiveStats.active ?? 0) + (backgroundStats.active ?? 0);

    const pollAfterMs = computePollAfterMs(state, totalWaiting, totalActive);
    const resp = okJson(
      { state, progress, queue: { waiting: totalWaiting, active: totalActive } },
      200,
    );
    resp.headers.set('Retry-After', String(Math.ceil(pollAfterMs / 1000)));
    resp.headers.set('X-Poll-After-Ms', String(pollAfterMs));
    return withJobHeaders(resp, id, state);
  } catch (err) {
    const info = toErrInfo(err);
    console.error(`[llm/enqueue][${reqId}][FATAL] Unhandled error in GET`, {
      reqId,
      jobId: id,
      errorName: info.name,
      errorMessage: info.message,
      errorCode: info.code,
      stack: info.stack,
    });
    const res = okJson(
      {
        error: 'Failed to retrieve job status.',
        details: info.message,
        code: info.code,
      },
      500,
    );
    res.headers.set('X-Req-Id', reqId);
    return withJobHeaders(res, id, 'error');
  }
}

/* ─────────────────────────────────────────────────────────
  Helpers
────────────────────────────────────────────────────────── */
async function getQueuesAndStats(): Promise<{
  interactiveStats: Record<'waiting' | 'active', number>;
  backgroundStats: Record<'waiting' | 'active', number>;
}> {
  const [interactiveQueue, backgroundQueue] = await Promise.all([
    getQueue(INTERACTIVE_QUEUE_NAME),
    getQueue(BACKGROUND_QUEUE_NAME),
  ]);

  const [interactiveCounts, backgroundCounts] = await Promise.all([
    interactiveQueue.getJobCounts('wait', 'active'),
    backgroundQueue.getJobCounts('wait', 'active'),
  ]);

  return {
    interactiveStats: {
      waiting: interactiveCounts.wait,
      active: interactiveCounts.active,
    },
    backgroundStats: {
      waiting: backgroundCounts.wait,
      active: backgroundCounts.active,
    },
  };
}

function computePollAfterMs(
  state: JobState | 'unknown',
  waiting: number,
  active: number,
): number {
  let base: number;
  switch (state) {
    case 'active':
      base = 1200;
      break;
    case 'delayed':
      base = 2000;
      break;
    case 'waiting':
    case 'waiting-children':
    case 'prioritized':
    case 'unknown':
    default:
      base = 1500;
      break;
  }
  const ratio = active > 0 ? waiting / active : waiting;
  if (ratio > 10) base = Math.max(base, 4000);
  else if (ratio > 3) base = Math.max(base, 2500);
  const jitter = base * (0.6 + Math.random() * 0.8);
  return Math.max(800, Math.min(8000, Math.round(jitter)));
}
