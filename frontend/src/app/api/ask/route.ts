// app/api/ask/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { Job } from 'bullmq';
import { llmQueue, connection as redis } from '@/lib/queue';
import type { LlmJobResult, Role } from '@/types/llm';

// No longer need Zod for this simplified approach
// import { z } from 'zod';

// ---------------------------- Simplified Formatting Instructions ----------------------------
// This prompt is much simpler for a less capable model to understand and follow.
const FORMATTING_INSTRUCTIONS = `
You are Stella, a helpful AI assistant.
Your entire response MUST be a single, valid Markdown document.
Do NOT use LaTeX document structure like \\documentclass.

**Formatting Rules:**
- Use Markdown for headings (#), lists (*), and tables (|).
- Use double dollar signs \`$$ ... $$\` for standalone math equations.
- Use single dollar signs \`$ ... $\` for inline math variables.

Example:
The formula is:
$$
A = \\pi r^2
$$
Here, $A$ is the area and $r$ is the radius.
`;

type AskPayload = {
  prompt: string;
  context?: string;
  role?: Role;
  mission?: string;
};

function hashId(o: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
}

async function queueStats() {
  const [waiting, active, delayed, failed, completed, isPaused] = await Promise.all([
    llmQueue.getWaitingCount(),
    llmQueue.getActiveCount(),
    llmQueue.getDelayedCount(),
    llmQueue.getFailedCount(),
    llmQueue.getCompletedCount(),
    llmQueue.isPaused(),
  ]);
  return { waiting, active, delayed, failed, completed, isPaused };
}

async function redisPing() {
  try {
    const pong = await redis.ping();
    return { ok: pong === 'PONG', pong };
  } catch (e: unknown) {
    return { ok: false, error: String((e as Error)?.message || e) };
  }
}

// ---------------------------- POST (enqueue) ----------------------------
export async function POST(req: NextRequest) {
  const started = Date.now();
  let jobId = 'unknown';

  try {
    const raw = await req.text();
    if (!raw) return NextResponse.json({ error: 'Empty request body; expected JSON.' }, { status: 400 });

    let body: AskPayload;
    try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Malformed JSON body.' }, { status: 400 }); }

    const role: Role = (body.role as Role) ?? 'explorer';
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt || prompt.length > 4000) return NextResponse.json({ error: "Invalid 'prompt'. Provide a non-empty string up to 4000 chars." }, { status: 400 });
    if (body.context && (typeof body.context !== 'string' || body.context.length > 20000)) return NextResponse.json({ error: "Invalid 'context'. Must be a string up to 20000 chars." }, { status: 400 });
    if (role !== 'explorer' && role !== 'cadet' && role !== 'scholar') return NextResponse.json({ error: "Invalid 'role'. Use explorer|cadet|scholar." }, { status: 400 });

    const finalPrompt = `${FORMATTING_INSTRUCTIONS}\n\n--- USER PROMPT ---\n\n${prompt}`;
    const payloadForQueue = { ...body, role, prompt: finalPrompt };
    jobId = hashId({ type: 'ask', payload: payloadForQueue });

    const [ping, statsBefore] = await Promise.all([redisPing(), queueStats()]);
    console.log('[ask][POST] enqueuing', { jobId, role, mission: body.mission ?? 'general', redis: ping });

    try {
      await llmQueue.add(
        'llm',
        { type: 'ask', payload: payloadForQueue, cacheKey: jobId },
        {
          jobId,
          attempts: 2,
          backoff: { type: 'exponential', delay: 1500 },
          // THE FIX: Set job retention ("cache") to 1 hour (3600 seconds)
          removeOnComplete: { age: 3600, count: 5000 },
          removeOnFail: { age: 86400, count: 1000 }, // Keep failed jobs for a day for debugging
        }
      );
    } catch (e: unknown) {
      const msg = String((e as Error)?.message || e);
      if (!/already exists/i.test(msg)) throw e;
    }

    const job = await Job.fromId(llmQueue, jobId);
    const state = job ? await job.getState() : 'missing';
    const res = NextResponse.json({ accepted: true, jobId, state }, { status: 202 });
    res.headers.set('x-job-id', jobId);
    res.headers.set('x-queue-state', state);
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ask][POST] error', { jobId, error: msg });
    const res = NextResponse.json({ error: 'Failed to enqueue ask.', details: msg }, { status: 500 });
    res.headers.set('x-job-id', jobId);
    res.headers.set('x-queue-state', 'error');
    return res;
  }
}

// ---------------------------- GET (status / debug / list / stats) ----------------------------
// This GET handler for polling job status remains unchanged. It is complete and correct.
export async function GET(req: NextRequest) {
  const started = Date.now();
  const id = req.nextUrl.searchParams.get('id');
  const debug = req.nextUrl.searchParams.get('debug') === '1';
  const statsOnly = req.nextUrl.searchParams.get('stats') === '1';
  const list = req.nextUrl.searchParams.get('list') === '1';

  if (statsOnly) {
    const [ping, stats] = await Promise.all([redisPing(), queueStats()]);
    return NextResponse.json(
      { queue: stats, redis: ping, server: { pid: process.pid, now: new Date().toISOString() } },
      { status: 200 }
    );
  }

  if (list) {
    const [waiting, active, delayed] = await Promise.all([
      llmQueue.getJobs(['waiting'], 0, 20),
      llmQueue.getJobs(['active'], 0, 20),
      llmQueue.getJobs(['delayed'], 0, 20),
    ]);
    return NextResponse.json(
      {
        waiting: waiting.map((j) => j.id),
        active: active.map((j) => j.id),
        delayed: delayed.map((j) => j.id),
      },
      { status: 200 }
    );
  }

  if (!id) return NextResponse.json({ error: 'Missing ?id=' }, { status: 400 });

  try {
    const job = await Job.fromId(llmQueue, id);
    if (!job) {
      return NextResponse.json(
        {
          error: 'Job not found',
          id,
          likely: [ 'Polled wrong jobId', 'Job expired', 'Queue/worker mismatch' ],
          queue: await queueStats(),
          redis: await redisPing(),
        },
        { status: 404 }
      );
    }

    const state = await job.getState();
    const progress = job.progress ?? 0;

    const meta = debug
      ? {
          id: job.id, name: job.name, state, progress, attemptsMade: job.attemptsMade, opts: job.opts,
          dataPreviewBytes: (() => { try { return JSON.stringify(job.data).length; } catch { return -1; } })(),
          timestamps: { timestamp: job.timestamp, processedOn: job.processedOn, finishedOn: job.finishedOn },
          stacktrace: job.stacktrace,
          queue: await queueStats(), redis: await redisPing(),
          server: { pid: process.pid, now: new Date().toISOString(), durationMs: Date.now() - started },
        }
      : undefined;

    if (state === 'completed') {
      const result = job.returnvalue as LlmJobResult;
      if (result?.type !== 'ask') {
        const res = NextResponse.json( debug ? { state, progress, error: 'Job is not an ask result', debug: meta } : { state, progress, error: 'Job is not an ask result' }, { status: 409 } );
        res.headers.set('x-job-id', id);
        res.headers.set('x-queue-state', state);
        return res;
      }
      const res = NextResponse.json( debug ? { state, progress, result: result.result, debug: meta } : { state, progress, result: result.result }, { status: 200 } );
      res.headers.set('x-job-id', id);
      res.headers.set('x-queue-state', state);
      return res;
    }

    if (state === 'failed') {
      const res = NextResponse.json( debug ? { state, progress, error: job.failedReason, debug: meta } : { state, progress, error: job.failedReason }, { status: 500 } );
      res.headers.set('x-job-id', id);
      res.headers.set('x-queue-state', state);
      return res;
    }

    const res = NextResponse.json(debug ? { state, progress, debug: meta } : { state, progress }, { status: 200 });
    res.headers.set('x-job-id', id);
    res.headers.set('x-queue-state', state);
    return res;
  } catch (err: unknown) {
    console.error('[ask][GET] error', String((err as Error)?.message || err));
    return NextResponse.json(
      { error: 'Failed to read job status.', details: String((err as Error)?.message || err) },
      { status: 500 }
    );
  }
}