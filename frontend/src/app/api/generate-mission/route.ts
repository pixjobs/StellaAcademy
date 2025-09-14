// app/api/llm/generate-mission/route.ts
/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { Job } from 'bullmq';
import type { LlmJobData, LlmJobResult } from '@/types/llm';
import { hashId, enqueueIdempotent, withJobHeaders } from '@/lib/api/queueHttp';
import {
  getQueue,
  INTERACTIVE_QUEUE_NAME,
  BACKGROUND_QUEUE_NAME,
} from '@/lib/queue';
import { isMissionType, isRole } from '@/workers/ollama/utils';
import type { Role, MissionType } from '@/types/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RequestPayload = {
  missionType: MissionType;
  role?: Role;
};

/* -------------------------------- POST --------------------------------- */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let jobId = 'unknown';
  try {
    const body = (await req.json()) as RequestPayload;
    const { missionType } = body;
    const role: Role = body.role ?? 'explorer';

    if (!isMissionType(missionType)) {
      return NextResponse.json({ error: "Invalid or missing 'missionType'." }, { status: 400 });
    }
    if (!isRole(role)) {
      return NextResponse.json({ error: "Invalid 'role'. Use explorer|cadet|scholar." }, { status: 400 });
    }

    const payloadForQueue = { missionType, role };
    jobId = hashId({ type: 'mission', payload: payloadForQueue });

    console.log('[generate-mission][POST] enqueuing', { jobId, missionType, role });

    // Use the background queue for mission generation
    const backgroundQueue = await getQueue(BACKGROUND_QUEUE_NAME);

    // Keep the job "name" aligned with the type for clarity
    const { state } = await enqueueIdempotent(
      'mission',
      { type: 'mission', payload: payloadForQueue },
      jobId,
      backgroundQueue,
    );

    const res = NextResponse.json({ accepted: true, jobId, state }, { status: 202 });
    return withJobHeaders(res, jobId, state);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[generate-mission][POST] error', { jobId, error: msg });
    const res = NextResponse.json(
      { error: 'Failed to enqueue mission generation.', details: msg },
      { status: 500 },
    );
    return withJobHeaders(res, jobId, 'error');
  }
}

/* -------------------------------- GET ---------------------------------- */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id');
  const debug = req.nextUrl.searchParams.get('debug') === '1';
  const statsOnly = req.nextUrl.searchParams.get('stats') === '1';
  const list = req.nextUrl.searchParams.get('list') === '1';

  // Stats for both queues
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
      queues: { [INTERACTIVE_QUEUE_NAME]: iStats, [BACKGROUND_QUEUE_NAME]: bStats },
    });
  }

  // Lightweight listing
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

  try {
    // Search both queues by id
    const [interactiveQueue, backgroundQueue] = await Promise.all([
      getQueue(INTERACTIVE_QUEUE_NAME),
      getQueue(BACKGROUND_QUEUE_NAME),
    ]);

    let job: Job<LlmJobData, LlmJobResult, string> | undefined =
      (await Job.fromId<LlmJobData, LlmJobResult>(interactiveQueue, id)) ?? undefined;
    let queueName = INTERACTIVE_QUEUE_NAME;

    if (!job) {
      job = (await Job.fromId<LlmJobData, LlmJobResult>(backgroundQueue, id)) ?? undefined;
      if (job) queueName = BACKGROUND_QUEUE_NAME;
    }

    if (!job) {
      return withJobHeaders(
        NextResponse.json({ error: 'Job not found in any active queue.', id }, { status: 404 }),
        id,
        'missing',
      );
    }

    const state = await job.getState();
    const progress = typeof job.progress === 'number' ? job.progress : 0;

    if (state === 'completed') {
      const result = job.returnvalue as LlmJobResult;
      const payload = debug
        ? {
            state,
            progress,
            result,
            debug: {
              id: job.id,
              name: job.name,
              queue: queueName,
              attemptsMade: job.attemptsMade,
              timestamp: job.timestamp,
              processedOn: job.processedOn,
              finishedOn: job.finishedOn,
            },
          }
        : { state, progress, result };
      return withJobHeaders(NextResponse.json(payload, { status: 200 }), id, state);
    }

    if (state === 'failed') {
      const payload = debug
        ? {
            state,
            progress,
            error: job.failedReason,
            debug: { id: job.id, name: job.name, queue: queueName, stacktrace: job.stacktrace },
          }
        : { state, progress, error: job.failedReason };
      return withJobHeaders(NextResponse.json(payload, { status: 500 }), id, state);
    }

    // Pending-ish states
    return withJobHeaders(
      NextResponse.json({ state, progress }, { status: 200 }),
      id,
      state,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[generate-mission][GET] error', { id, error: msg });
    return withJobHeaders(
      NextResponse.json({ error: 'Failed to read job status.', details: msg }, { status: 500 }),
      id,
      'error',
    );
  }
}
