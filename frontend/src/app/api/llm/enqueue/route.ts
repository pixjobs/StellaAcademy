import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { Job, JobsOptions, JobState } from 'bullmq';
import type { LlmJobData, LlmJobResult, TutorPreflightOutput } from '@/types/llm';
import { enqueueIdempotent, withJobHeaders } from '@/lib/api/queueHttp';
import { getQueues } from '@/lib/bullmq/queues';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ─────────────────────────────────────────────────────────
  TYPES & VALIDATION
────────────────────────────────────────────────────────── */

type EnqueueResult = { state: JobState | 'exists' | 'unknown' };
type CacheVal<T> = { value: T; fetchedAt: number; soft: number; hard: number };
interface ErrorLike { name?: string; message?: string; stack?: string; code?: string | number; }

function isValidLlmJobResult(value: unknown): value is LlmJobResult {
  if (typeof value !== 'object' || value === null) return false;
  if (!('type' in value) || !('result' in value)) return false;
  const data = value as { type: unknown; result: unknown };
  const t = data.type;
  if (t === 'tutor-preflight') {
    const r = data.result as TutorPreflightOutput;
    return typeof r?.systemPrompt === 'string' && Array.isArray(r.starterMessages) && typeof r.warmupQuestion === 'string';
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
const SOFT_MS = Number(process.env.LLM_CACHE_SOFT_MS ?? 5 * 60 * 1000);
const HARD_MS = Number(process.env.LLM_CACHE_HARD_MS ?? 30 * 60 * 1000);

/* ─────────────────────────────────────────────────────────
  SMALL UTILS
────────────────────────────────────────────────────────── */

function newReqId(): string { return crypto.randomUUID(); }
function hashId(o: unknown): string { return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex'); }
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
  CACHE.set(id, { value, fetchedAt: now, soft: now + SOFT_MS, hard: now + HARD_MS });
}
function okJson(data: object, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === 'number' ? { status: init } : init);
}
function toErrInfo(e: unknown): ErrorLike {
  const ee = (e ?? {}) as ErrorLike;
  return { name: ee.name ?? 'Error', message: ee.message ?? String(e), stack: ee.stack, code: ee.code };
}

/* ─────────────────────────────────────────────────────────
  POST (enqueue)
────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const reqId = newReqId();
  let jobId = 'unknown';

  try {
    const raw = await req.text();
    log(reqId, 'POST start', { contentLength: raw.length });

    if (!raw) return withJobHeaders(okJson({ error: 'Empty body; expected JSON.' }, 400), jobId, 'error');

    let body: LlmJobData;
    try {
      body = JSON.parse(raw) as LlmJobData;
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
    log(reqId, 'Computed jobId', { jobId, type: body.type });

    const cached = getCached(jobId);
    if (cached && Date.now() < cached.soft) {
      log(reqId, 'Cache HIT (fresh)', { ageMs: Date.now() - cached.fetchedAt });
      const res = okJson({ accepted: true, jobId, state: 'completed', result: cached.value, cache: { status: 'fresh' } }, 200);
      return withJobHeaders(res, jobId, 'completed');
    }

    const { interactiveQueue, backgroundQueue } = await getQueues();
    const targetQueue = (body.type === 'mission') ? backgroundQueue : interactiveQueue;
    log(reqId, 'Queue selected', { queueName: targetQueue.name });

    const addOpts: JobsOptions = {
      jobId,
      attempts: 2,
      backoff: { type: 'exponential', delay: 1500 },
      removeOnComplete: { age: 300, count: 1000 },
      removeOnFail: { age: 1800, count: 1000 },
    };

    const { state } = await enqueueIdempotent(
      body.type,
      { ...body, cacheKey: jobId },
      jobId,
      targetQueue,
      addOpts
    ) as EnqueueResult;

    log(reqId, 'enqueueIdempotent ok', { state });

    const res = okJson({ accepted: true, jobId, state }, 202);
    res.headers.set('X-Req-Id', reqId);
    return withJobHeaders(res, jobId, state === 'exists' || state === 'unknown' ? 'waiting' : state);

  } catch (err) {
    const info = toErrInfo(err);
    console.error('[llm/enqueue][POST] Unhandled error', { reqId, jobId, ...info });
    const res = okJson({ error: 'Failed to enqueue job.', details: info.message, code: info.code }, 500);
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

  if (!id) return okJson({ error: 'Missing ?id=' }, 400);

  const { interactiveQueue, backgroundQueue } = await getQueues();
  const job = (await Job.fromId(interactiveQueue, id)) ?? (await Job.fromId(backgroundQueue, id));

  if (!job) {
    log(reqId, 'Job not found', { id });
    return withJobHeaders(okJson({ error: 'Job not found in any active queue.', id }, 404), id, 'missing');
  }

  const state = await job.getState();
  const progress = job.progress ?? 0;

  if (state === 'completed') {
    const result = job.returnvalue as LlmJobResult;
    if (!isValidLlmJobResult(result)) {
      log(reqId, 'Job completed with malformed data', { id });
      const payload = { state: 'failed' as const, progress: 100, error: 'Worker returned malformed data.' };
      return withJobHeaders(okJson(payload, 500), id, 'failed');
    }
    setCached(id, result);
    const payload = debug ? { state, progress, result, debug: { ...job } } : { state, progress, result };
    return withJobHeaders(okJson(payload, 200), id, state);
  }

  if (state === 'failed') {
    const payload = debug ? { state, progress, error: job.failedReason, stacktrace: job.stacktrace } : { state, progress, error: job.failedReason };
    return withJobHeaders(okJson(payload, 500), id, state);
  }

  const { interactiveStats, backgroundStats } = await getQueuesAndStats();
  const totalWaiting = (interactiveStats.waiting ?? 0) + (backgroundStats.waiting ?? 0);
  const totalActive = (interactiveStats.active ?? 0) + (backgroundStats.active ?? 0);
  
  // The state is passed to the corrected helper function below
  const pollAfterMs = computePollAfterMs(state, totalWaiting, totalActive);

  const resp = okJson({ state, progress, queue: { waiting: totalWaiting, active: totalActive } }, 200);
  resp.headers.set('Retry-After', String(Math.ceil(pollAfterMs / 1000)));
  resp.headers.set('X-Poll-After-Ms', String(pollAfterMs));
  return withJobHeaders(resp, id, state);
}

// Helper for GET endpoint to fetch stats for both queues
async function getQueuesAndStats() {
  const { interactiveQueue, backgroundQueue } = await getQueues();
  const [interactiveStats, backgroundStats] = await Promise.all([
    interactiveQueue.getJobCounts('wait', 'active'),
    backgroundQueue.getJobCounts('wait', 'active'),
  ]);
  return { interactiveStats, backgroundStats };
}

// --- CORRECTED HELPER FUNCTION ---
// The function signature is widened to accept the 'unknown' state.
function computePollAfterMs(state: JobState | 'unknown', waiting: number, active: number): number {
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
    case 'unknown': // Handle 'unknown' gracefully
    default:
      base = 1500; // Default to a safe polling interval
      break;
  }
  
  const ratio = active > 0 ? waiting / active : waiting;
  if (ratio > 10) base = Math.max(base, 4000);
  else if (ratio > 3) base = Math.max(base, 2500);
  
  const jitter = base * (0.6 + Math.random() * 0.8);
  return Math.max(800, Math.min(8000, Math.round(jitter)));
}