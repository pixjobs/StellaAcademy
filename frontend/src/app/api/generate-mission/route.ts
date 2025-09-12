import { NextRequest, NextResponse } from 'next/server';
import { Job } from 'bullmq'; // Import the Job type for type safety
import {
  hashId,
  enqueueIdempotent,
  withJobHeaders,
  pollJobResponse,
} from '@/lib/api/queueHttp';
import { getQueues } from '@/lib/bullmq/queues';
import { INTERACTIVE_QUEUE_NAME, BACKGROUND_QUEUE_NAME } from '@/lib/queue';
import { isMissionType, isRole } from '@/workers/ollama/utils';
import type { Role, MissionType } from '@/types/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*                                Local Types                                 */
/* -------------------------------------------------------------------------- */

type RequestPayload = {
  missionType: MissionType;
  role?: Role;
};

/* -------------------------------------------------------------------------- */
/*                               POST (Enqueue Job)                           */
/* -------------------------------------------------------------------------- */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let jobId = 'unknown';
  try {
    const body = await req.json() as RequestPayload;

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

    const { backgroundQueue } = await getQueues();

    const { state } = await enqueueIdempotent(
      'mission-generation',
      { type: 'mission', payload: payloadForQueue },
      jobId,
      backgroundQueue
    );

    const res = NextResponse.json({ accepted: true, jobId, state }, { status: 202 });
    return withJobHeaders(res, jobId, state);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[generate-mission][POST] error', { jobId, error: msg });
    const res = NextResponse.json({ error: 'Failed to enqueue mission generation.', details: msg }, { status: 500 });
    return withJobHeaders(res, jobId, 'error');
  }
}

/* -------------------------------------------------------------------------- */
/*                      GET (Poll Status / Debug)                             */
/* -------------------------------------------------------------------------- */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id');
  const debug = req.nextUrl.searchParams.get('debug') === '1';
  const statsOnly = req.nextUrl.searchParams.get('stats') === '1';
  const list = req.nextUrl.searchParams.get('list') === '1';

  if (statsOnly || list) {
    const { interactiveQueue, backgroundQueue } = await getQueues();
    if (statsOnly) {
      const [interactiveStats, backgroundStats] = await Promise.all([
        interactiveQueue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed'),
        backgroundQueue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed'),
      ]);
      return NextResponse.json({
        queues: {
          [INTERACTIVE_QUEUE_NAME]: interactiveStats,
          [BACKGROUND_QUEUE_NAME]: backgroundStats,
        },
      });
    }

    // --- CORRECTED LOGIC for ?list=1 ---
    const [iJobs, bJobs] = await Promise.all([
      interactiveQueue.getJobs(['active', 'waiting', 'delayed'], 0, 20),
      backgroundQueue.getJobs(['active', 'waiting', 'delayed'], 0, 20),
    ]);

    // Helper function to asynchronously get the state for each job
    const jobToJSON = async (j: Job) => ({
        id: j.id,
        name: j.name,
        state: await j.getState(),
    });

    // Process all jobs in parallel to get their states
    const [iJobsWithState, bJobsWithState] = await Promise.all([
        Promise.all(iJobs.map(jobToJSON)),
        Promise.all(bJobs.map(jobToJSON)),
    ]);

    return NextResponse.json({
      [INTERACTIVE_QUEUE_NAME]: iJobsWithState,
      [BACKGROUND_QUEUE_NAME]: bJobsWithState,
    });
  }

  if (!id) {
    return NextResponse.json({ error: 'Missing job ?id=' }, { status: 400 });
  }

  // The pollJobResponse helper is queue-agnostic and works by job ID.
  return pollJobResponse(id, debug);
}