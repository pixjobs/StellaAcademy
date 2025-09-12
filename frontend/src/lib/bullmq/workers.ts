import { Worker, Job, Processor } from 'bullmq';
import { getConnection } from '@/lib/queue';
import { INTERACTIVE_QUEUE_NAME, BACKGROUND_QUEUE_NAME } from './queues';
import {
  LlmJobData,
  LlmJobResult,
  LlmAskPayload,
  LlmMissionPayload,
  TutorPreflightPayload,
  AskResult,
  EnrichedMissionPlan,
  TutorPreflightOutput,
  WorkerMeta,
  isLlmJobData,
} from '@/types/llm';

/** Helpers */
function initMeta(job: Job<LlmJobData, LlmJobResult, string>): WorkerMeta {
  const startTime = Date.now();
  return {
    jobId: String(job.id),
    queueName: job.queueName,
    timing: { queueWaitMs: startTime - job.timestamp, llmMs: 0, totalMs: 0 },
  };
}
function markTotal(meta: WorkerMeta, start: number) {
  meta.timing ??= { queueWaitMs: 0, llmMs: 0, totalMs: 0 };
  meta.timing.totalMs = Date.now() - start;
}

/** Simulated handlers (replace with real LLM calls as needed) */
async function handleAskJob(payload: LlmAskPayload, meta: WorkerMeta): Promise<AskResult> {
  const t0 = Date.now();
  await new Promise((r) => setTimeout(r, 1500));
  meta.timing ??= { queueWaitMs: 0, llmMs: 0, totalMs: 0 };
  meta.timing.llmMs = Date.now() - t0;
  meta.model = 'simulated-interactive-model';
  return {
    answer: 'This is a fast answer from the interactive worker.',
    tokens: { input: 100, output: 200, timeMs: meta.timing.llmMs },
  };
}
async function handleTutorPreflightJob(
  payload: TutorPreflightPayload,
  meta: WorkerMeta,
): Promise<TutorPreflightOutput> {
  const t0 = Date.now();
  await new Promise((r) => setTimeout(r, 1000));
  meta.timing ??= { queueWaitMs: 0, llmMs: 0, totalMs: 0 };
  meta.timing.llmMs = Date.now() - t0;
  meta.model = 'simulated-interactive-model';
  return {
    systemPrompt: `You are Stella, an expert tutor with the persona of a '${payload.role}'.`,
    starterMessages: [{ id: 'stella-1', role: 'stella', text: `Hello! Let's learn about ${payload.topicTitle}.` }],
    warmupQuestion: `What is one thing you find interesting about ${payload.topicTitle}?`,
    goalSuggestions: ['Understand its key features', 'Learn about its discovery'],
    difficultyHints: { easy: 'Focus on the basic facts.', standard: 'Include details about its history.', challenge: 'Discuss complex theories.' },
  };
}
async function handleMissionJob(payload: LlmMissionPayload, meta: WorkerMeta): Promise<EnrichedMissionPlan> {
  const t0 = Date.now();
  await new Promise((r) => setTimeout(r, 5000));
  meta.timing ??= { queueWaitMs: 0, llmMs: 0, totalMs: 0 };
  meta.timing.llmMs = Date.now() - t0;
  meta.model = 'simulated-background-model';
  return {
    missionTitle: 'In-Depth Analysis of Martian Geography',
    introduction: `Welcome, ${payload.role}! Your mission is to analyze Martian geology.`,
    topics: [
      {
        title: 'Olympus Mons',
        summary: 'The largest volcano in the solar system.',
        images: [{ title: 'Mars Express Orbiter Image', href: '...' }],
        keywords: ['Shield Volcano', 'Tharsis Montes'],
      },
    ],
  };
}

/** Processors */
const interactiveProcessor: Processor<LlmJobData, LlmJobResult, string> = async (job) => {
  const start = Date.now();
  const meta = initMeta(job);
  try {
    if (isLlmJobData(job.data, 'ask')) {
      const result = await handleAskJob(job.data.payload, meta);
      markTotal(meta, start);
      return { type: 'ask', result, meta };
    }
    if (isLlmJobData(job.data, 'tutor-preflight')) {
      const result = await handleTutorPreflightJob(job.data.payload, meta);
      markTotal(meta, start);
      return { type: 'tutor-preflight', result, meta };
    }
    markTotal(meta, start);
    return { type: 'failure', error: { message: `Unsupported job type: ${job.data.type}` }, meta };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    markTotal(meta, start);
    return { type: 'failure', error: { message: err.message, stack: err.stack }, meta };
  }
};

const backgroundProcessor: Processor<LlmJobData, LlmJobResult, string> = async (job) => {
  const start = Date.now();
  const meta = initMeta(job);
  try {
    if (isLlmJobData(job.data, 'mission')) {
      const result = await handleMissionJob(job.data.payload, meta);
      markTotal(meta, start);
      return { type: 'mission', result, meta };
    }
    markTotal(meta, start);
    return { type: 'failure', error: { message: `Unsupported job type: ${job.data.type}` }, meta };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    markTotal(meta, start);
    return { type: 'failure', error: { message: err.message, stack: err.stack }, meta };
  }
};

/** Setup */
export async function setupWorkers() {
  const connection = await getConnection();

  new Worker<LlmJobData, LlmJobResult, string>(INTERACTIVE_QUEUE_NAME, interactiveProcessor, {
    connection,
    concurrency: 16,
  });

  new Worker<LlmJobData, LlmJobResult, string>(BACKGROUND_QUEUE_NAME, backgroundProcessor, {
    connection,
    concurrency: 2,
  });
}
