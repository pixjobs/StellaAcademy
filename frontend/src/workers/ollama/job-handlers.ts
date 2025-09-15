// workers/ollama/job-handlers.ts
/* eslint-disable no-console */
import type { Job } from 'bullmq';
import type { WorkerContext } from './context';
import { retrieveMissionForUser } from './mission-library';
import { hardenAskPrompt, buildTutorSystem, buildTutorUser, extractJson } from './utils';
import { callOllama } from './ollama-client';
import { postProcessLlmResponse } from './llm-post-processing';
import { markdownifyBareUrls, extractLinksFromText } from '@/lib/llm/links';
import type { LibraryBackfillJobData } from '@/types/llm';
import { backfillOne } from './mission-library'; 

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

/* -------------------------------------------------------------------------- */
/* Config & tiny utils                                                        */
/* -------------------------------------------------------------------------- */

const LLM_TIMEOUT_MS = 12_000; // keep aligned with missions
const DEBUG_WORKER = process.env.DEBUG_WORKER === '1';

function isRole(x: unknown): x is Role {
  return x === 'explorer' || x === 'cadet' || x === 'scholar';
}

function clampStr(s: string, max = 8000): string {
  return s.length > max ? s.slice(0, max) : s;
}

function requireBottleneck(ctx: WorkerContext) {
  const b = (ctx as unknown as { llmBottleneck?: unknown }).llmBottleneck;
  if (!b || typeof (b as { submit?: unknown }).submit !== 'function') {
    throw new Error('[worker] llmBottleneck missing from WorkerContext.');
  }
  return b as { submit<T>(fn: () => Promise<T>): Promise<T> };
}

function withTimeout<T>(p: Promise<T>, ms = LLM_TIMEOUT_MS, tag = 'llm'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${tag} timed out after ${ms}ms`)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

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

/* -------------------------------------------------------------------------- */
/* Handlers                                                                   */
/* -------------------------------------------------------------------------- */

//** backfill */
export async function handleLibraryBackfillJob(
  job: Job<LlmJobData>,
  context: WorkerContext
): Promise<HandlerOutput> {
  if (job.data.type !== 'library-backfill') {
    throw new Error(`handleLibraryBackfillJob received wrong type: ${job.data.type}`);
  }
  const { missionType, role, reason } = (job.data as LibraryBackfillJobData).payload;

  await job.updateProgress(5);
  const ok = await backfillOne(missionType, role, context);
  await job.updateProgress(100);

  return { type: 'library-backfill', result: { ok, reason, missionType, role } };
}

/** 'mission' */
export async function handleMissionJob(job: Job<LlmJobData>, context: WorkerContext): Promise<HandlerOutput> {
  if (job.data.type !== 'mission') {
    throw new Error(`handleMissionJob received wrong job type: ${job.data.type}`);
  }
  const { missionType, role } = (job.data as MissionJobData).payload;
  const safeRole: Role = isRole(role) ? role : 'explorer';

  await job.updateProgress(10);
  const missionPlan = await retrieveMissionForUser(missionType, safeRole, context);
  await job.updateProgress(100);
  return { type: 'mission', result: missionPlan };
}

/** 'ask' */
export async function handleAskJob(job: Job<LlmJobData>, context: WorkerContext): Promise<HandlerOutput> {
  if (job.data.type !== 'ask') {
    throw new Error(`handleAskJob received wrong job type: ${job.data.type}`);
  }
  const { prompt, context: jobContext } = (job.data as AskJobData).payload;
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('ASK job missing "prompt" string.');
  }
  const logPrefix = `[worker][handler][ask][${job.id}]`;
  await job.updateProgress(5);

  const bottleneck = requireBottleneck(context);

  // LLM
  const rawAnswer = await withTimeout(
    bottleneck.submit(() => callOllama(hardenAskPrompt(clampStr(prompt), clampStr(String(jobContext ?? ''))), { temperature: 0.6 })),
    LLM_TIMEOUT_MS,
    'ask-llm',
  );

  const cleanedAnswer = postProcessLlmResponse(rawAnswer, {});
  const answerWithLinks = markdownifyBareUrls(cleanedAnswer);

  // Link enrichment (best-effort)
  let links: LinkPreview[] = [];
  try {
    const inline = extractLinksFromText(answerWithLinks, 8);
    const baseQuery = [
      String(jobContext ?? '').slice(0, 240),
      String(prompt ?? '').slice(0, 280),
    ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim().slice(0, 360);

    const googleSearchFn = await resolveGoogleSearch();
    if (googleSearchFn && baseQuery) {
      const web = await googleSearchFn(baseQuery, 5);
      const seen = new Set<string>(inline.map((l) => l.url));
      links = [...inline, ...web.filter((w) => !seen.has(w.url))].slice(0, 8);
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
  const safeRole: Role = isRole(role) ? role : 'explorer';
  const logPrefix = `[worker][handler][preflight][${job.id}]`;
  await job.updateProgress(5);

  const bottleneck = requireBottleneck(context);

  const createPreflight = async (currentRole: Role): Promise<TutorPreflightOutput> => {
    const { mission, topicTitle, topicSummary, imageTitle } = (job.data as TutorPreflightJobData).payload;

    if (!mission || !topicTitle || !topicSummary) {
      throw new Error('Tutor-preflight job missing mission/topicTitle/topicSummary.');
    }

    const system = buildTutorSystem(currentRole, mission, topicTitle, imageTitle);
    const user = buildTutorUser(topicSummary);

    const raw = await withTimeout(
      bottleneck.submit(() =>
        callOllama(`${system}\n\nUSER:\n${user}\n\nReturn JSON only.`, { temperature: 0.6 }),
      ),
      LLM_TIMEOUT_MS,
      'tutor-preflight-llm',
    );

    if (DEBUG_WORKER || currentRole !== safeRole) {
      console.log(`${logPrefix} RAW LLM OUTPUT (Role: ${currentRole}):\n---\n${raw}\n---`);
    }

    const parsed = extractJson<TutorPreflightOutput>(raw);
    // Strong shape check
    if (
      !parsed ||
      typeof parsed.systemPrompt !== 'string' ||
      !Array.isArray(parsed.starterMessages) ||
      typeof parsed.warmupQuestion !== 'string' ||
      !parsed.difficultyHints ||
      typeof parsed.difficultyHints.easy !== 'string' ||
      typeof parsed.difficultyHints.standard !== 'string' ||
      typeof parsed.difficultyHints.challenge !== 'string'
    ) {
      throw new Error(`Tutor-preflight (role: ${currentRole}): LLM returned malformed JSON.`);
    }

    // Sanitize lengths
    parsed.systemPrompt = clampStr(parsed.systemPrompt, 4000);
    parsed.starterMessages = parsed.starterMessages.slice(0, 6).map((m) => ({
      id: String(m.id || '').slice(0, 64) || 'stella-hello',
      role: m.role === 'user' ? 'user' : 'stella',
      text: clampStr(String(m.text || ''), 1200),
    }));
    parsed.goalSuggestions = Array.isArray(parsed.goalSuggestions)
      ? parsed.goalSuggestions.slice(0, 6).map((s) => clampStr(String(s), 200))
      : [];

    return parsed;
  };

  try {
    const result = await createPreflight(safeRole);
    await job.updateProgress(100);
    return { type: 'tutor-preflight', result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`${logPrefix} Tailored preflight for '${safeRole}' failed. Retrying with 'explorer'.`, { error: msg });
    const fallbackResult = await createPreflight('explorer');
    await job.updateProgress(100);
    return { type: 'tutor-preflight', result: fallbackResult };
  }
}
