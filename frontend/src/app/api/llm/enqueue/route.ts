import { NextResponse } from 'next/server';
import { Firestore } from '@google-cloud/firestore';
import { auth } from '@clerk/nextjs/server';
import { enqueueTask } from '@/lib/cloudTasks';
import { nanoid } from 'nanoid';
import type { LlmJobData, AskResult } from '@/types/llm';

// --- Import implemented link utilities ---
import { markdownifyBareUrls, extractLinksFromText } from '@/lib/llm/links';
import { dedupeLinks, tryGoogleCse } from '@/lib/llmUtils';

// Ensure this route runs on the Node.js runtime for Firestore Admin SDK compatibility.
export const runtime = 'nodejs';

// --- Initialization ---
const db = new Firestore();
const jobsCollection = db.collection('jobs');

/**
 * Gets the current user's ID.
 * In development, allows for a non-secure bypass for easy API testing.
 */
async function getUserId() {
  if (process.env.NODE_ENV === 'development') {
    const { userId } = await auth();
    if (userId) return userId;
    
    console.warn('\n⚠️  [AUTH BYPASS] No user session found. Using development user ID. This should NOT appear in production.\n');
    return 'dev-user-id-for-testing';
  }

  const { userId } = await auth();
  return userId;
}

// --- POST Handler (Enqueue any job type) ---
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const jobData = (await request.json()) as LlmJobData;
    if (!jobData || !jobData.type) {
      return NextResponse.json({ error: 'Invalid job data provided.' }, { status: 400 });
    }

    const jobId = nanoid();
    const createdAt = new Date();

    await jobsCollection.doc(jobId).set({
      jobId,
      status: 'pending',
      type: jobData.type,
      userId,
      createdAt,
      result: null,
      error: null,
    });

    const maybeImmediate = await enqueueTask(jobId, jobData, 'interactive');

    if (maybeImmediate && typeof maybeImmediate === 'object') {
      const { type, result, meta } = maybeImmediate as any;
      const safeMeta = meta && typeof meta === 'object'
        ? meta
        : { jobId, timing: { totalMs: 0, queueWaitMs: 0 }, queueName: 'dev' };

      console.log('[API ENQUEUE][DEV] Immediate worker result — writing to Firestore', {
        jobId,
        type,
        hasResult: !!result,
      });

      await jobsCollection.doc(jobId).set(
        {
          status: 'completed',
          type: type ?? jobData.type,
          result: result ?? {},
          meta: safeMeta,
          completedAt: new Date(),
          error: null,
        },
        { merge: true },
      );
    } else {
      console.log('[API ENQUEUE] Enqueued job (async processing)', { jobId, type: jobData.type });
    }

    return NextResponse.json({ jobId });
  } catch (error) {
    console.error(`[API ENQUEUE] Failed to enqueue job:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Enqueue failed: ${message}` }, { status: 500 });
  }
}

// --- GET Handler (Poll for any job status, with special 'ask' logic) ---
export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('id');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required.' }, { status: 400 });
    }

    const jobDoc = await jobsCollection.doc(jobId).get();

    if (!jobDoc.exists) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    const jobData = jobDoc.data()!;

    if (jobData.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ========================================================================
    // --- NORMALIZATION & POST-PROCESSING LOGIC ---
    // ========================================================================

    // 1. Normalize the shape for 'mission' jobs to unwrap the nested result.
    if (
      jobData.status === 'completed' &&
      jobData.type === 'mission' &&
      jobData.result &&
      'result' in jobData.result
    ) {
      console.log(`[API POLL][${jobId}] Normalizing nested mission result.`);
      jobData.result = (jobData.result as any).result;
    }

    // 2. Post-process the result for 'ask' jobs to enrich with links.
    if (
      jobData.status === 'completed' &&
      jobData.type === 'ask' &&
      jobData.result &&
      'answer' in jobData.result
    ) {
      console.log(`[API POLL][${jobId}] Post-processing 'ask' result with link enrichment.`);
      const result = jobData.result as AskResult;
      const rawAnswer = result.answer;

      const answerWithLinks = markdownifyBareUrls(rawAnswer);
      const textLinks = extractLinksFromText(answerWithLinks);
      
      const firstSentence = String(rawAnswer).split(/[.!?]\s/)[0]?.slice(0, 120) ?? '';
      const cseLinks = firstSentence ? await tryGoogleCse(firstSentence) : [];
      
      const links = dedupeLinks(textLinks, cseLinks);

      jobData.result = { ...result, answer: answerWithLinks, links };
    }
    // ========================================================================

    return NextResponse.json(jobData);
  } catch (error) {
    console.error(`[API POLL] Failed to get job status for user ${userId}:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Status check failed: ${message}` }, { status: 500 });
  }
}