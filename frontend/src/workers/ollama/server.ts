/* eslint-disable no-console */
// ============================================================================
// Cloud Run Worker (HTTP target for Cloud Tasks)
// ============================================================================

import express from 'express';
import { randomUUID } from 'crypto';
import type { Job } from 'bullmq';

import { initializeContext, type WorkerContext } from './context';
import {
  handleMissionJob,
  handleAskJob,
  handleTutorPreflightJob,
  handleLibraryBackfillJob,
} from './job-handlers';

import { runLibraryMaintenance } from './mission-library';
import { loadConfigFromSecrets } from './ollama-client';

// Import the final, authoritative types from the single source of truth
import type {
  LlmJobData,
  MissionJobData,
  AskJobData,
  TutorPreflightJobData,
  LibraryBackfillJobData,
  HandlerOutput,
  LlmJobResult,
  WorkerMeta,
} from '@/types/llm';

// ---------- Small helpers ----------

function makeJob<T extends LlmJobData>(jobId: string, data: T): Job<T> {
  const jobLike = {
    id: jobId,
    data,
    updateProgress: async (progress: number | object) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[worker][${jobId}] progress:`, progress);
      }
    },
  };
  return jobLike as unknown as Job<T>;
}

/** Uniform OK response, strictly typed to accept a valid LlmJobResult. */
function ok(res: express.Response, body: LlmJobResult) {
  res.status(200).json(body);
}

function err(res: express.Response, status: number, message: string, extra?: unknown) {
  if (extra) console.error('[worker] error extra:', extra);
  res.status(status).json({ ok: false, error: message });
}

function readTaskHeaders(req: express.Request) {
  return {
    taskName: req.get('X-Cloud-Tasks-TaskName') || null,
    queue: req.get('X-Cloud-Tasks-QueueName') || null,
    retryCount: Number(req.get('X-Cloud-Tasks-TaskRetryCount') || 0),
  };
}

// ---------- Server bootstrap ----------

export async function startServer() {
  await loadConfigFromSecrets();
  console.log('[worker] secrets loaded');
  const context: WorkerContext = await initializeContext();
  console.log('[worker] context initialized');

  const app = express();
  app.use(express.json({ limit: '6mb' }));
  app.get('/_health', (_req, res) => res.status(200).send('OK'));

  // --- Maintenance Route ---
  app.post('/maintenance/daily', async (_req, res) => {
    try {
      await runLibraryMaintenance(context, false);
      res.status(200).json({ ok: true, ran: true });
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg === 'MAINT_LOCKED' || msg === 'MAINT_RECENT') {
        return res.status(200).json({ ok: true, ran: false, reason: msg });
      }
      return err(res, 500, 'maintenance failed', e);
    }
  });

  // --- Generic Job Entrypoint ---
  app.post('/jobs', async (req, res) => {
    const started = Date.now();
    let jobId = ''; // Initialize jobId outside the try-catch block

    try { // <-- FIX: Add the 'try' block here
      const hdrs = readTaskHeaders(req);
      const body = req.body ?? {};
      jobId = String(body.jobId || hdrs.taskName || randomUUID());
      const jobData: LlmJobData = (body.jobData && typeof body.jobData === 'object' ? body.jobData : body) as LlmJobData;

      if (!jobData || !('type' in jobData)) {
        return err(res, 400, 'Malformed job payload');
      }

      console.log(`[worker][${jobId}] /jobs type=${jobData.type} queue=${hdrs.queue} retry=${hdrs.retryCount}`);

      let handlerOutput: HandlerOutput;
      switch (jobData.type) {
        case 'mission':
          handlerOutput = await handleMissionJob(makeJob(jobId, jobData), context);
          break;
        case 'ask':
          handlerOutput = await handleAskJob(makeJob(jobId, jobData), context);
          break;
        case 'tutor-preflight':
          handlerOutput = await handleTutorPreflightJob(makeJob(jobId, jobData), context);
          break;
        case 'library-backfill':
          handlerOutput = await handleLibraryBackfillJob(makeJob(jobId, jobData), context);
          break;
        default:
          return err(res, 422, `Unsupported type: ${(jobData as any).type}`);
      }
    
      const finalResult: LlmJobResult = {
        type: handlerOutput.type,
        result: handlerOutput.result as any,
        meta: {
          jobId,
          queueName: hdrs.queue,
          timing: {
            totalMs: Date.now() - started,
            queueWaitMs: 0,
          },
        },
      };

      return ok(res, finalResult);

    } catch (e) { // <-- FIX: This catch is now correctly associated with the try block
      console.error(`[worker] /jobs failed for jobId ${jobId}:`, e);
      // On failure, construct a valid JobFailureResult
      const finalErrorResult: LlmJobResult = {
        type: 'failure',
        result: { error: e instanceof Error ? e.message : 'Job execution failed' },
        meta: {
          jobId,
          queueName: readTaskHeaders(req).queue,
          timing: {
            totalMs: Date.now() - started,
            queueWaitMs: 0,
          },
        },
      };
      // Send a 200 OK with a failure payload so Cloud Tasks does not retry a failed job.
      return ok(res, finalErrorResult);
    }
  });

  const port = Number(process.env.PORT) || 8080;
  app.listen(port, () => {
    console.log(`[worker] listening on http://localhost:${port}`);
  });

  return app;
}

if (require.main === module) {
  startServer().catch((e) => {
    console.error('[worker] FATAL BOOT ERROR:', e);
    process.exit(1);
  });
}