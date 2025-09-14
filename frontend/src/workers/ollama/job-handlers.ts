/* eslint-disable no-console */
// workers/ollama/job-handlers.ts
import type { Job } from 'bullmq';
import type { WorkerContext } from './context';
import { retrieveMissionForUser } from './mission-library';
import { hardenAskPrompt, buildTutorSystem, buildTutorUser, extractJson } from './utils';
import { callOllama } from './ollama-client';
import { postProcessLlmResponse } from './llm-post-processing';
import { markdownifyBareUrls, extractLinksFromText } from '@/lib/llm/links';
import type {
  LlmJobData,
  MissionJobData,
  AskJobData,
  TutorPreflightJobData,
  Role,
  TutorPreflightOutput,
  LinkPreview,
  AskResult,
} from '@/types/llm';

export type HandlerOutput = { type: LlmJobData['type']; result: unknown };

type GoogleSearchFn = (query: string, limit: number) => Promise<LinkPreview[]>;

async function resolveGoogleSearch(): Promise<GoogleSearchFn | null> {
  try {
    const mod = (await import('@/lib/search')) as {
      googleCustomSearch?: GoogleSearchFn;
      default?:
        | GoogleSearchFn
        | { googleCustomSearch?: GoogleSearchFn };
    };
    if (typeof mod.googleCustomSearch === 'function') return mod.googleCustomSearch;
    const def = mod.default;
    if (typeof def === 'function') return def as GoogleSearchFn;
    if (def && typeof (def as { googleCustomSearch?: unknown }).googleCustomSearch === 'function') {
      return (def as { googleCustomSearch: GoogleSearchFn }).googleCustomSearch;
    }
    return null;
  } catch {
    return null;
  }
}

/** 'mission' */
export async function handleMissionJob(job: Job<LlmJobData>, context: WorkerContext): Promise<HandlerOutput> {
  if (job.data.type !== 'mission') {
    throw new Error(`handleMissionJob received wrong job type: ${job.data.type}`);
  }
  const { missionType, role } = (job.data as MissionJobData).payload;
  await job.updateProgress(10);
  const missionPlan = await retrieveMissionForUser(missionType, role, context);
  await job.updateProgress(100);
  return { type: 'mission', result: missionPlan };
}

/** 'ask' */
export async function handleAskJob(job: Job<LlmJobData>, context: WorkerContext): Promise<HandlerOutput> {
  if (job.data.type !== 'ask') {
    throw new Error(`handleAskJob received wrong job type: ${job.data.type}`);
  }
  const { prompt, context: jobContext } = (job.data as AskJobData).payload;
  const logPrefix = `[worker][handler][ask][${job.id}]`;
  await job.updateProgress(5);

  const rawAnswer = await context.llmBottleneck.submit(() =>
    callOllama(hardenAskPrompt(prompt, jobContext), { temperature: 0.6 }),
  );

  const cleanedAnswer = postProcessLlmResponse(rawAnswer, {});
  const answerWithLinks = markdownifyBareUrls(cleanedAnswer);

  let links: LinkPreview[] = [];
  try {
    const inline = extractLinksFromText(answerWithLinks, 8);
    const baseQuery = [String(jobContext ?? '').slice(0, 240), String(prompt ?? '').slice(0, 280)]
      .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim().slice(0, 360);

    const googleSearchFn = await resolveGoogleSearch();
    if (googleSearchFn && baseQuery) {
      const web = await googleSearchFn(baseQuery, 5);
      const seen = new Set<string>(inline.map((l: LinkPreview) => l.url));
      links = [...inline, ...web.filter((w: LinkPreview) => !seen.has(w.url))].slice(0, 8);
    } else {
      links = inline;
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`${logPrefix} Link enrichment failed (continuing): ${msg}`);
  }

  const result: AskResult = { answer: answerWithLinks, links };
  await job.updateProgress(100);
  return { type: 'ask', result };
}

/** 'tutor-preflight' */
export async function handleTutorPreflightJob(job: Job<LlmJobData>, context: WorkerContext): Promise<HandlerOutput> {
  if (job.data.type !== 'tutor-preflight') {
    throw new Error(`handleTutorPreflightJob received wrong job type: ${job.data.type}`);
  }
  const { role } = (job.data as TutorPreflightJobData).payload;
  const logPrefix = `[worker][handler][preflight][${job.id}]`;
  await job.updateProgress(5);

  const createPreflight = async (currentRole: Role): Promise<TutorPreflightOutput> => {
    const { mission, topicTitle, topicSummary, imageTitle } = (job.data as TutorPreflightJobData).payload;
    const system = buildTutorSystem(currentRole, mission, topicTitle, imageTitle);
    const user = buildTutorUser(topicSummary);

    const raw = await context.llmBottleneck.submit(() =>
      callOllama(`${system}\n\nUSER:\n${user}\n\nReturn JSON only.`, { temperature: 0.6 }),
    );

    if (process.env.DEBUG_WORKER === '1' || currentRole !== role) {
      console.log(`${logPrefix} RAW LLM OUTPUT (Role: ${currentRole}):\n---\n${raw}\n---`);
    }

    const parsed = extractJson<TutorPreflightOutput>(raw);
    if (!parsed?.systemPrompt || !parsed?.starterMessages || !parsed?.warmupQuestion || !parsed?.difficultyHints) {
      throw new Error(`Tutor-preflight (role: ${currentRole}): LLM returned malformed JSON.`);
    }
    return parsed;
  };

  try {
    const result = await createPreflight(role);
    await job.updateProgress(100);
    return { type: 'tutor-preflight', result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`${logPrefix} Tailored preflight for '${role}' failed. Retrying with 'explorer'.`, { error: msg });
    const fallbackResult = await createPreflight('explorer');
    await job.updateProgress(100);
    return { type: 'tutor-preflight', result: fallbackResult };
  }
}
