/* eslint-disable no-console */
import type { Job } from 'bullmq';
import type { Firestore } from '@google-cloud/firestore';
import type { WorkerContext } from './context';
import { retrieveMissionForUser, backfillOne } from './mission-library';
import { hardenAskPrompt, buildTutorSystem, buildTutorUser, extractJson } from './utils';
import { callOllama } from './ollama-client';
import { postProcessLlmResponse } from './llm-post-processing';
import { markdownifyBareUrls, extractLinksFromText } from '@/lib/llm/links';
import { logger } from './utils/logger';
import { retrievePreflightFromLibrary, savePreflightToLibrary } from './preflight-library';

import type {
  LlmJobData,
  MissionJobData,
  AskJobData,
  TutorPreflightJobData,
  LibraryBackfillJobData,
  Role,
  TutorPreflightOutput,
  LinkPreview,
  AskResult,
  HandlerOutput,
} from '@/types/llm';

import type { EnrichedMissionPlan } from '@/types/mission';

/* -------------------------------------------------------------------------- */
/* Config & Utilities                                                         */
/* -------------------------------------------------------------------------- */

const LLM_TIMEOUT_MS = 12_000;

function isRole(x: unknown): x is Role {
  return x === 'explorer' || x === 'cadet' || x === 'scholar';
}

function clampStr(s: string, max = 8000): string {
  return s.length > max ? s.slice(0, max) : s;
}

/* -------------------------------------------------------------------------- */
/* Centralized Firestore Update Helpers                                       */
/* -------------------------------------------------------------------------- */

async function updateJobAsCompleted(db: Firestore, jobId: string, result: unknown): Promise<void> {
  const jobDocRef = db.collection('jobs').doc(jobId);
  logger.info(`[worker][firestore][${jobId}] Attempting to write 'completed' status...`);
  try {
    await jobDocRef.set(
      {
        status: 'completed',
        result,
        completedAt: new Date(),
        error: null,
      },
      { merge: true }
    );
    logger.info(`[worker][firestore][${jobId}] Successfully wrote 'completed' status.`);
  } catch (error) {
    logger.error(`[worker][firestore][${jobId}] FAILED to write 'completed' status to Firestore:`, error);
    throw error;
  }
}

async function updateJobAsFailed(db: Firestore, jobId: string, error: Error): Promise<void> {
  const jobDocRef = db.collection('jobs').doc(jobId);
  logger.info(`[worker][firestore][${jobId}] Attempting to write 'failed' status...`);
  try {
    await jobDocRef.set(
      {
        status: 'failed',
        error: error.message || 'An unknown worker error occurred.',
        completedAt: new Date(),
      },
      { merge: true }
    );
    logger.info(`[worker][firestore][${jobId}] Successfully wrote 'failed' status.`);
  } catch (dbError) {
    logger.error(`[worker][firestore][${jobId}] FAILED to write 'failed' status to Firestore:`, dbError);
    logger.error(`[worker][firestore][${jobId}] Original error was:`, error);
    throw dbError;
  }
}

/* -------------------------------------------------------------------------- */
/* Job Handlers                                                               */
/* -------------------------------------------------------------------------- */

export async function handleLibraryBackfillJob(job: Job<LlmJobData>, context: WorkerContext): Promise<HandlerOutput> {
  if (job.data.type !== 'library-backfill') {
    throw new Error(`handleLibraryBackfillJob received wrong type: ${job.data.type}`);
  }
  const { missionType, role, reason } = (job.data as LibraryBackfillJobData).payload;
  await job.updateProgress(5);
  const result = await backfillOne(missionType, role, context, reason);
  await job.updateProgress(100);
  return { type: 'library-backfill', result };
}

export async function handleMissionJob(job: Job<LlmJobData>, context: WorkerContext): Promise<HandlerOutput> {
  const jobId = job.id;
  if (!jobId) throw new Error('Job is missing an ID.');

  if (job.data.type !== 'mission') {
    throw new Error(`handleMissionJob received wrong job type: ${job.data.type}`);
  }

  try {
    const { missionType, role } = (job.data as MissionJobData).payload;
    const safeRole: Role = isRole(role) ? role : 'explorer';
    await job.updateProgress(10);

    const missionPlan: EnrichedMissionPlan = await retrieveMissionForUser(missionType, safeRole, context);
    await job.updateProgress(90);

    await updateJobAsCompleted(context.db, jobId, missionPlan);

    await job.updateProgress(100);
    return { type: 'mission', result: missionPlan };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(`[worker][handler][mission][${jobId}] Failed:`, err);
    await updateJobAsFailed(context.db, jobId, err);
    throw err;
  }
}

export async function handleAskJob(job: Job<LlmJobData>, context: WorkerContext): Promise<HandlerOutput> {
  const jobId = job.id;
  if (!jobId) throw new Error('Job is missing an ID.');

  if (job.data.type !== 'ask') {
    throw new Error(`handleAskJob received wrong job type: ${job.data.type}`);
  }

  try {
    const { prompt, context: jobContext } = (job.data as AskJobData).payload;
    if (!prompt) throw new Error('ASK job is missing a prompt.');

    await job.updateProgress(10);

    const hardenedPrompt = hardenAskPrompt(clampStr(prompt), clampStr(String(jobContext ?? '')));
    const rawAnswer = await callOllama(hardenedPrompt, { temperature: 0.6 });
    const cleanedAnswer = postProcessLlmResponse(rawAnswer, {});
    const answerWithLinks = markdownifyBareUrls(cleanedAnswer);
    const links: LinkPreview[] = extractLinksFromText(answerWithLinks, 8);

    const result: AskResult = { answer: answerWithLinks, links };
    await job.updateProgress(90);

    await updateJobAsCompleted(context.db, jobId, result);

    await job.updateProgress(100);
    return { type: 'ask', result };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(`[worker][handler][ask][${jobId}] Failed:`, err);
    await updateJobAsFailed(context.db, jobId, err);
    throw err;
  }
}

export async function handleTutorPreflightJob(job: Job<LlmJobData>, context: WorkerContext): Promise<HandlerOutput> {
  const jobId = job.id;
  if (!jobId) throw new Error('Job is missing an ID.');

  if (job.data.type !== 'tutor-preflight') {
    throw new Error(`handleTutorPreflightJob received wrong job type: ${job.data.type}`);
  }

  const jobPayload = (job.data as TutorPreflightJobData).payload;

  try {
    await job.updateProgress(5);
    let finalResult: TutorPreflightOutput;

    const cachedPreflight = await retrievePreflightFromLibrary(jobPayload, context);

    if (cachedPreflight) {
      logger.info(`[worker][handler][preflight][${jobId}] Cache hit.`);
      finalResult = cachedPreflight;
    } else {
      logger.info(`[worker][handler][preflight][${jobId}] Cache miss, generating new preflight.`);
      const { role } = jobPayload;
      const safeRole: Role = isRole(role) ? role : 'explorer';

      const createPreflight = async (currentRole: Role): Promise<TutorPreflightOutput> => {
        const { mission, topicTitle, topicSummary, imageTitle } = jobPayload;
        const missionTitle = typeof mission === 'string' ? mission : mission.missionTitle;
        const system = buildTutorSystem(currentRole, missionTitle, topicTitle, imageTitle);
        const user = buildTutorUser(topicSummary);

        const raw = await callOllama(`${system}\n\nUSER:\n${user}\n\nReturn JSON only.`, { temperature: 0.6 });
        const parsed = extractJson<TutorPreflightOutput>(raw);

        if (!parsed?.systemPrompt || !parsed.starterMessages) {
          throw new Error(`Tutor-preflight (role: ${currentRole}): LLM returned malformed JSON.`);
        }
        return parsed;
      };

      try {
        finalResult = await createPreflight(safeRole);
      } catch (generationError) {
        logger.warn(`[worker][preflight][${jobId}] Generation for role '${safeRole}' failed. Retrying with 'explorer'.`, generationError);
        finalResult = await createPreflight('explorer');
      }

      await savePreflightToLibrary(jobPayload, finalResult, context);
    }

    await job.updateProgress(90);
    await updateJobAsCompleted(context.db, jobId, finalResult);

    await job.updateProgress(100);
    return { type: 'tutor-preflight', result: finalResult };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(`[worker][handler][preflight][${jobId}] Failed catastrophically:`, err);
    await updateJobAsFailed(context.db, jobId, err);
    throw err;
  }
}