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
import { isRole } from '@/workers/ollama/utils';
import type { Role } from '@/types/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*                                Local Types                                 */
/* -------------------------------------------------------------------------- */

type PreflightPayload = {
  mission: string;
  topicTitle: string;
  topicSummary: string;
  imageTitle?: string;
  role: Role;
};

/* -------------------------------------------------------------------------- */
/*                               POST (Enqueue Job)                           */
/* -------------------------------------------------------------------------- */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let jobId = 'unknown';
  try {
    const body = await req.json() as PreflightPayload;

    const { mission, topicTitle, topicSummary, imageTitle, role } = body;

    // --- Robust Validation ---
    if (!mission || typeof mission !== 'string' || mission.length > 200) return NextResponse.json({ error: "Invalid 'mission'." }, { status: 400 });
    if (!topicTitle || typeof topicTitle !== 'string' || topicTitle.length > 500) return NextResponse.json({ error: "Invalid 'topicTitle'." }, { status: 400 });
    if (!topicSummary || typeof topicSummary !== 'string' || topicSummary.length > 5000) return NextResponse.json({ error: "Invalid 'topicSummary'." }, { status: 400 });
    if (imageTitle && (typeof imageTitle !== 'string' || imageTitle.length > 500)) return NextResponse.json({ error: "Invalid 'imageTitle'." }, { status: 400 });
    if (!isRole(role)) return NextResponse.json({ error: "Invalid 'role'. Use explorer|cadet|scholar." }, { status: 400 });

    const payloadForQueue = { mission, topicTitle, topicSummary, imageTitle, role };
    jobId = hashId({ type: 'tutor-preflight', payload: payloadForQueue });

    console.log('[preFlight][POST] enqueuing', { jobId, role, mission });

    const { interactiveQueue } = await getQueues();

    const { state } = await enqueueIdempotent(
      'tutor-preflight-setup',
      { type: 'tutor-preflight', payload: payloadForQueue },
      jobId,
      interactiveQueue
    );

    const res = NextResponse.json({ accepted: true, jobId, state }, { status: 202 });
    return withJobHeaders(res, jobId, state);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[preFlight][POST] error', { jobId, error: msg });
    const res = NextResponse.json({ error: 'Failed to enqueue preflight job.', details: msg }, { status: 500 });
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
        queues: { [INTERACTIVE_QUEUE_NAME]: interactiveStats, [BACKGROUND_QUEUE_NAME]: backgroundStats },
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

  if (!id) return NextResponse.json({ error: 'Missing job ?id=' }, { status: 400 });

  // pollJobResponse is queue-agnostic; it finds the job by its unique ID.
  return pollJobResponse(id, debug);
}