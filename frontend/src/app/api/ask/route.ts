// app/api/ask/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  hashId,
  queueStats,
  redisPing,
  enqueueIdempotent,
  withJobHeaders,
  pollJobResponse,
} from '@/lib/api/queueHttp';
import { llmQueue } from '@/lib/queue';
import type { Role } from '@/types/llm';

/** Simple, model-friendly formatting guardrails */
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

/* ----------------------------- POST (enqueue) ----------------------------- */
export async function POST(req: NextRequest) {
  let jobId = 'unknown';

  try {
    const raw = await req.text();
    if (!raw) return NextResponse.json({ error: 'Empty request body; expected JSON.' }, { status: 400 });

    let body: AskPayload;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON body.' }, { status: 400 });
    }

    const role: Role = (body.role as Role) ?? 'explorer';
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt || prompt.length > 4000)
      return NextResponse.json({ error: "Invalid 'prompt'. Provide a non-empty string up to 4000 chars." }, { status: 400 });

    if (body.context && (typeof body.context !== 'string' || body.context.length > 20000))
      return NextResponse.json({ error: "Invalid 'context'. Must be a string up to 20000 chars." }, { status: 400 });

    if (role !== 'explorer' && role !== 'cadet' && role !== 'scholar')
      return NextResponse.json({ error: "Invalid 'role'. Use explorer|cadet|scholar." }, { status: 400 });

    const finalPrompt = `${FORMATTING_INSTRUCTIONS}\n\n--- USER PROMPT ---\n\n${prompt}`;
    const payloadForQueue = { ...body, role, prompt: finalPrompt };

    // Stable job id for idempotency (same request → same job)
    jobId = hashId({ type: 'ask', payload: payloadForQueue });

    const [ping] = await Promise.all([redisPing()]);
    console.log('[ask][POST] enqueuing', {
      jobId,
      role,
      mission: body.mission ?? 'general',
      redis: ping,
    });

    const { state } = await enqueueIdempotent(
      'llm',
      { type: 'ask', payload: payloadForQueue, cacheKey: jobId },
      jobId
    );

    const res = NextResponse.json({ accepted: true, jobId, state }, { status: 202 });
    return withJobHeaders(res, jobId, state);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ask][POST] error', { jobId, error: msg });
    const res = NextResponse.json({ error: 'Failed to enqueue ask.', details: msg }, { status: 500 });
    return withJobHeaders(res, jobId, 'error');
  }
}

/* ---------------- GET (status / debug / list / stats) ---------------- */
export async function GET(req: NextRequest) {
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

  // Standard polling response (completed/failed/in-progress) with headers
  return pollJobResponse(id, debug);
}
