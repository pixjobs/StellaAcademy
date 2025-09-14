// app/api/llm/preflight/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Job } from 'bullmq';
import type { Role, LlmJobData, LlmJobResult } from '@/types/llm';

import { isRole } from '@/workers/ollama/utils';
import {
  hashId,
  enqueueIdempotent,
  withJobHeaders,
  pollJobResponse,
} from '@/lib/api/queueHttp';
import {
  getQueue,
  INTERACTIVE_QUEUE_NAME,
  BACKGROUND_QUEUE_NAME,
} from '@/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type PreflightPayload = {
  mission: string;
  topicTitle: string;
  topicSummary: string;
  imageTitle?: string;
  role: Role;
};

/* -------------------------------------------------------------------------- */
/*                               POST (enqueue)                               */
/* -------------------------------------------------------------------------- */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let jobId = 'unknown';

  try {
    const body = (await req.json()) as PreflightPayload;
    const { mission, topicTitle, topicSummary, imageTitle, role } = body;

    // Robust validation
    if (!mission || typeof mission !== 'string' || mission.length > 200) {
      return NextResponse.json({ error: "Invalid 'mission'." }, { status: 400 });
    }
    if (!topicTitle || typeof topicTitle !== 'string' || topicTitle.length > 500) {
      return NextResponse.json({ error: "Invalid 'topicTitle'." }, { status: 400 });
    }
    if (!topicSummary || typeof topicSummary !== 'string' || topicSummary.length > 5000) {
      return NextResponse.json({ error: "Invalid 'topicSummary'." }, { status: 400 });
    }
    if (imageTitle && (typeof imageTitle !== 'string' || imageTitle.length > 500)) {
      return NextResponse.json({ error: "Invalid 'imageTitle'." }, { status: 400 });
    }
    if (!isRole(role)) {
      return NextResponse.json(
        { error: "Invalid 'role'. Use explorer|cadet|scholar." },
        { status: 400 },
      );
    }

    const payloadForQueue = { mission, topicTitle, topicSummary, imageTitle, role };
    jobId = hashId({ type: 'tutor-preflight', payload: payloadForQueue });

    console.log('[preflight][POST] enqueuing', { jobId, role, mission });

    // Use interactive queue only (preflight is user-interactive)
    const interactiveQueue = await getQueue(INTERACTIVE_QUEUE_NAME);

    // Keep job name simple; worker routes by data.type anyway
    const { state } = await enqueueIdempotent(
      'tutor-preflight',
      { type: 'tutor-preflight', payload: payloadForQueue } satisfies LlmJobData,
      jobId,
      interactiveQueue,
    );

    const res = NextResponse.json({ accepted: true, jobId, state }, { status: 202 });
    return withJobHeaders(res, jobId, state);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[preflight][POST] error', { jobId, error: msg });
    const res = NextResponse.json(
      { error: 'Failed to enqueue preflight job.', details: msg },
      { status: 500 },
    );
    return withJobHeaders(res, jobId, 'error');
  }
}

/* -------------------------------------------------------------------------- */
/*                           GET (poll / stats / list)                        */
/* -------------------------------------------------------------------------- */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id');
  const debug = req.nextUrl.searchParams.get('debug') === '1';
  const statsOnly = req.nextUrl.searchParams.get('stats') === '1';
  const list = req.nextUrl.searchParams.get('list') === '1';

  // Stats across both queues
  if (statsOnly) {
    const [interactiveQueue, backgroundQueue] = await Promise.all([
      getQueue(INTERACTIVE_QUEUE_NAME),
      getQueue(BACKGROUND_QUEUE_NAME),
    ]);
    const [iStats, bStats] = await Promise.all([
      interactiveQueue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed'),
      backgroundQueue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed'),
    ]);
    return NextResponse.json({
      queues: {
        [INTERACTIVE_QUEUE_NAME]: iStats,
        [BACKGROUND_QUEUE_NAME]: bStats,
      },
    });
  }

  // List a few jobs from both queues (no access to protected members)
  if (list) {
    const [interactiveQueue, backgroundQueue] = await Promise.all([
      getQueue(INTERACTIVE_QUEUE_NAME),
      getQueue(BACKGROUND_QUEUE_NAME),
    ]);

    const [iJobs, bJobs] = await Promise.all([
      interactiveQueue.getJobs(['active', 'waiting', 'delayed'], 0, 20),
      backgroundQueue.getJobs(['active', 'waiting', 'delayed'], 0, 20),
    ]);

    const jobToJSON = async (j: Job<LlmJobData, LlmJobResult, string>) => ({
      id: j.id,
      name: j.name,
      state: await j.getState(),
    });

    const [iList, bList] = await Promise.all([
      Promise.all(iJobs.map(jobToJSON)),
      Promise.all(bJobs.map(jobToJSON)),
    ]);

    return NextResponse.json({
      [INTERACTIVE_QUEUE_NAME]: iList,
      [BACKGROUND_QUEUE_NAME]: bList,
    });
  }

  if (!id) {
    return NextResponse.json({ error: 'Missing job ?id=' }, { status: 400 });
  }

  // Queue-agnostic poll by job id (your queueHttp helper handles response shape)
  return pollJobResponse(id, debug);
}
