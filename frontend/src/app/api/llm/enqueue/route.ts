import { NextResponse } from 'next/server';
import { Firestore } from '@google-cloud/firestore';
import { auth } from '@clerk/nextjs/server';
import { enqueueTask } from '@/lib/cloudTasks';
import { nanoid } from 'nanoid';
import type { LlmJobData, AskResult, LlmJobResult, WorkerMeta } from '@/types/llm';

// --- Import implemented link utilities ---
import { markdownifyBareUrls, extractLinksFromText } from '@/lib/llm/links';
import { dedupeLinks, tryGoogleCse } from '@/lib/llmUtils';

// Ensure this route runs on the Node.js runtime for Firestore Admin SDK compatibility.
export const runtime = 'nodejs';

// --- Initialization ---
const db = new Firestore();
const jobsCollection = db.collection('jobs');

// ========================================================================
// --- MODULE-LEVEL HELPERS & TYPE GUARDS ---
// ========================================================================

/**
 * Type guard to safely check if an object is a valid, successful LlmJobResult.
 */
function isLlmJobResult(obj: unknown): obj is LlmJobResult {
  if (!obj || typeof obj !== 'object') return false;
  if (!('type' in obj && 'result' in obj && 'meta' in obj)) return false;
  const meta = (obj as LlmJobResult).meta as WorkerMeta;
  if (!meta || typeof meta !== 'object' || !('jobId' in meta)) return false;
  return (obj as LlmJobResult).type !== 'failure';
}

/**
 * Type guard to check for a nested result structure from 'mission' jobs.
 */
function isNestedMissionResult(obj: unknown): obj is { result: unknown } {
  return !!obj && typeof obj === 'object' && 'result' in obj;
}

/**
 * Type guard to check for a valid 'ask' job result.
 */
function isAskResult(obj: unknown): obj is AskResult {
  return !!obj && typeof obj === 'object' && 'answer' in obj && typeof (obj as AskResult).answer === 'string';
}

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

  let jobId = ''; // Initialize here for use in the catch block

  try {
    const jobData = (await request.json()) as LlmJobData;
    if (!jobData || !jobData.type) {
      return NextResponse.json({ error: 'Invalid job data provided.' }, { status: 400 });
    }

    jobId = nanoid();
    const createdAt = new Date();

    // Create the job doc in "pending" first.
    await jobsCollection.doc(jobId).set({
      jobId,
      status: 'pending',
      type: jobData.type,
      userId,
      createdAt,
      result: null,
      error: null,
    });

    // In DEV, this returns the full LlmJobResult. In PROD, it returns null.
    const immediateResult = await enqueueTask(jobId, jobData, 'interactive');

    if (isLlmJobResult(immediateResult)) {
      // TypeScript's inference gets confused by the type guard's logic, resulting in `never`.
      // We cast `immediateResult` because the guard has already validated its structure.
      const successfulResult = immediateResult as LlmJobResult;

      console.log('[API ENQUEUE][DEV] Immediate worker result — writing to Firestore', {
        jobId: successfulResult.meta.jobId,
        type: successfulResult.type,
        hasResult: !!successfulResult.result,
      });

      // Persist the complete, validated result from the worker.
      await jobsCollection.doc(jobId).set(
        {
          status: 'completed',
          type: successfulResult.type,
          result: successfulResult.result,
          meta: successfulResult.meta,
          completedAt: new Date(),
          error: null,
        },
        { merge: true }, // Use merge to safely update the 'pending' doc.
      );
    } else {
      // This is the production path, or the dev path if the worker returned null/an error.
      console.log('[API ENQUEUE] Enqueued job (async processing)', { jobId, type: jobData.type });
    }

    return NextResponse.json({ jobId });
  } catch (error) {
    console.error(`[API ENQUEUE] Failed to enqueue job ${jobId}:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (jobId) {
      await jobsCollection.doc(jobId).set({ status: 'failed', error: message }, { merge: true });
    }
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

    // --- TYPE-SAFE NORMALIZATION & POST-PROCESSING LOGIC ---

    // 1. Normalize the shape for 'mission' jobs to unwrap the nested result.
    if (
      jobData.status === 'completed' &&
      jobData.type === 'mission' &&
      isNestedMissionResult(jobData.result) // Use the type guard (now defined at module level)
    ) {
      console.log(`[API POLL][${jobId}] Normalizing nested mission result.`);
      jobData.result = jobData.result.result;
    }

    // 2. Post-process the result for 'ask' jobs to enrich with links.
    if (
      jobData.status === 'completed' &&
      jobData.type === 'ask' &&
      isAskResult(jobData.result) // Use the type guard (now defined at module level)
    ) {
      console.log(`[API POLL][${jobId}] Post-processing 'ask' result with link enrichment.`);
      
      const rawAnswer = jobData.result.answer;
      const answerWithLinks = markdownifyBareUrls(rawAnswer);
      const textLinks = extractLinksFromText(answerWithLinks);
      const firstSentence = String(rawAnswer).split(/[.!?]\s/)[0]?.slice(0, 120) ?? '';
      const cseLinks = firstSentence ? await tryGoogleCse(firstSentence) : [];
      const links = dedupeLinks(textLinks, cseLinks);

      jobData.result = { ...jobData.result, answer: answerWithLinks, links };
    }

    return NextResponse.json(jobData);
  } catch (error) {
    console.error(`[API POLL] Failed to get job status for user ${userId}:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Status check failed: ${message}` }, { status: 500 });
  }
}