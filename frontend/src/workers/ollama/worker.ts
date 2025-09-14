// workers/ollama/worker.ts
/* eslint-disable no-console */
// =========================================================================
// BullMQ Worker - Single source of truth for job orchestration
// - Meta is built here; handlers return { type, result } only
// - Health check; robust logs; maintenance starts once Redis is ready
// =========================================================================

import http, { type Server } from 'http';
import { Worker, QueueEvents, type Processor, type Job } from 'bullmq';
import { INTERACTIVE_QUEUE_NAME, BACKGROUND_QUEUE_NAME } from '@/lib/queue';
import { bootstrap } from './boot';
import { initializeContext, type WorkerContext } from './context';
import { startLibraryMaintenance } from './mission-library';
import {
  handleMissionJob,
  handleAskJob,
  handleTutorPreflightJob,
  type HandlerOutput,
} from './job-handlers';
import type { LlmJobData, LlmJobResult, WorkerMeta } from '@/types/llm';

let isShuttingDown = false;

/** Local-only: meta is created/updated here, not in other modules. */
function buildMeta(job: Job<LlmJobData>): WorkerMeta {
  const startTime = Date.now();
  return {
    jobId: String(job.id),
    queueName: job.queueName,
    timing: {
      queueWaitMs: startTime - job.timestamp,
      llmMs: 0,
      totalMs: 0,
      retrievalMs: 0,
    },
  };
}
function markTotal(meta: WorkerMeta, startedAt: number): void {
  meta.timing.totalMs = Date.now() - startedAt;
}

async function startApp(): Promise<void> {
  const context = await initializeContext();

  console.log('[worker] ENV:', {
    NODE_ENV: process.env.NODE_ENV,
    INTERACTIVE_QUEUE_NAME,
    BACKGROUND_QUEUE_NAME,
    REDIS_URL_PRESENT: !!process.env.REDIS_URL_ONLINE || !!process.env.REDIS_URL_LOCAL,
  });

  // Health
  let isHealthy = (context.redis as unknown as { status?: string }).status === 'ready';
  const healthServer: Server = http.createServer((_req, res) => {
    res.writeHead(isHealthy ? 200 : 503, { 'Content-Type': 'text/plain' });
    res.end(isHealthy ? 'ok' : 'service unavailable');
  });
  const port = Number(process.env.PORT) || 8080;
  healthServer.listen(port, () => console.log('[worker] Health check server listening on', port));

  // Maintenance starts once Redis is ready; try immediate and also on 'ready'
  let maintenanceTimerId: NodeJS.Timeout | null = null;
  const startMaintIfNeeded = () => {
    if (!maintenanceTimerId) {
      console.log('[worker] Starting proactive maintenance loop.');
      maintenanceTimerId = startLibraryMaintenance(context);
    }
  };

  context.redis.on('ready', () => { isHealthy = true; startMaintIfNeeded(); });
  context.redis.on('close', () => { isHealthy = false; });

  if ((context.redis as any).status === 'ready' || (context as any).redisReady) {
    startMaintIfNeeded();
  } else {
    console.warn('[worker] Redis not ready at boot; maintenance will start when ready.');
  }

  // Processor factory
  const createProcessor = (
    handlerMap: Partial<Record<LlmJobData['type'], (job: Job<LlmJobData>, ctx: WorkerContext) => Promise<HandlerOutput>>>,
  ): Processor<LlmJobData, LlmJobResult> => {
    return async (job: Job<LlmJobData>): Promise<LlmJobResult> => {
      const startedAt = Date.now();
      const meta = buildMeta(job);
      try {
        console.log('[worker] picked job', { q: job.queueName, id: job.id, name: job.name, type: job.data.type });
        const handler = handlerMap[job.data.type];
        if (!handler) throw new Error(`No handler registered for job type: ${job.data.type}`);
        const payload = await handler(job, context);
        markTotal(meta, startedAt);
        return { ...payload, meta } as LlmJobResult;
      } catch (err) {
        markTotal(meta, startedAt);
        const e = err as Error;
        console.error(`[worker][${job.queueName}][${job.id}] ❌ Job Failed`, {
          name: job.name, type: job.data.type, error: e.message, stack: e.stack,
        });
        throw err;
      }
    };
  };

  // Map handlers
  const interactiveProcessor = createProcessor({ ask: handleAskJob, 'tutor-preflight': handleTutorPreflightJob });
  const backgroundProcessor  = createProcessor({ mission: handleMissionJob });

  // Workers
  const devBoost = process.env.NODE_ENV !== 'production';
  const interactiveWorker = new Worker<LlmJobData, LlmJobResult>(
    INTERACTIVE_QUEUE_NAME,
    interactiveProcessor,
    { connection: context.redis, concurrency: 16, lockDuration: 90_000 },
  );
  const backgroundWorker = new Worker<LlmJobData, LlmJobResult>(
    BACKGROUND_QUEUE_NAME,
    backgroundProcessor,
    { connection: context.redis, concurrency: devBoost ? 6 : 2, lockDuration: 300_000 },
  );

  interactiveWorker.on('error',  (e) => console.error('[worker][interactive] error:', e?.message || e));
  backgroundWorker.on('error',   (e) => console.error('[worker][background]  error:', e?.message || e));
  interactiveWorker.on('failed', (j, e) => console.error('[worker][interactive] failed:', j?.id, e?.message));
  backgroundWorker.on('failed',  (j, e) => console.error('[worker][background]  failed:', j?.id, e?.message));
  interactiveWorker.on('stalled', (jobId) => console.warn('[worker][interactive] stalled:', jobId));
  backgroundWorker.on('stalled',  (jobId) => console.warn('[worker][background]  stalled:', jobId));

  const interactiveEvents = new QueueEvents(INTERACTIVE_QUEUE_NAME, { connection: context.redis });
  const backgroundEvents  = new QueueEvents(BACKGROUND_QUEUE_NAME,  { connection: context.redis });
  await Promise.allSettled([interactiveEvents.waitUntilReady(), backgroundEvents.waitUntilReady()]);

  interactiveEvents.on('failed', ({ jobId, failedReason }) =>
    console.error('[events][interactive] job failed', { jobId, failedReason }));
  backgroundEvents.on('failed', ({ jobId, failedReason }) =>
    console.error('[events][background]  job failed', { jobId, failedReason }));

  // Shutdown
  const shutdown = async (): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log('[worker] Received shutdown signal. Shutting down gracefully...');

    if (maintenanceTimerId) { clearInterval(maintenanceTimerId); maintenanceTimerId = null; }
    isHealthy = false;
    await new Promise<void>((resolve) => healthServer.close(() => resolve()));

    await Promise.allSettled([
      interactiveWorker.close(),
      backgroundWorker.close(),
      interactiveEvents.close(),
      backgroundEvents.close(),
    ]);

    try { await context.redis.quit(); } catch { /* ignore */ }

    console.log('[worker] Shutdown complete.');
    process.exit(0);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  process.on('uncaughtException', (e) => { console.error('[worker] uncaughtException:', e); });
  process.on('unhandledRejection', (r) => { console.error('[worker] unhandledRejection:', r); });

  console.log('[worker] Boot sequence complete. Workers are ready.');
}

bootstrap().then(startApp).catch((err) => { console.error('[worker] FATAL BOOT ERROR:', err); process.exit(1); });
