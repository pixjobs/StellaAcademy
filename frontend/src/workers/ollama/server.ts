/* eslint-disable no-console */
// ============================================================================
// Cloud Run Worker (HTTP target for Cloud Tasks)
// Compatible with your current job-handlers.ts (BullMQ Job signature)
// - GET  /_health
// - POST /jobs                 -> body { jobId?, jobData | (inline LlmJobData) }
// - POST /mission              -> body { missionType, role }
// - POST /ask                  -> body { prompt, context? }
// - POST /tutor-preflight      -> body { role, mission, topicTitle, topicSummary, imageTitle? }
// Returns 2xx on success (ack), 5xx on error (retry).
// ============================================================================

import express from 'express';
import { randomUUID } from 'crypto';
import type { Job } from 'bullmq'; // type-only compatibility

import { initializeContext, type WorkerContext } from './context';
import {
  handleMissionJob,
  handleAskJob,
  handleTutorPreflightJob,
  handleLibraryBackfillJob,
  type HandlerOutput,
} from './job-handlers';

import type {
  LlmJobData,
  MissionJobData,
  AskJobData,
  TutorPreflightJobData,
  LlmJobResult,
} from '@/types/llm';

import { runLibraryMaintenance } from './mission-library';
import { loadConfigFromSecrets } from './ollama-client';

// ---------- Small helpers ----------

/** Minimal Job-like object for handler compatibility. */
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
  // Only the fields handlers use; cast for typing convenience.
  return jobLike as unknown as Job<T>;
}

/** Uniform OK response (keeps LlmJobResult shape). */
function ok(res: express.Response, body: { jobId: string } & HandlerOutput) {
  const final: LlmJobResult & { jobId: string } = {
    jobId: body.jobId,
    type: body.type,
    result: body.result,
    meta: {}, // room for diagnostics later
  };
  res.status(200).json(final);
}

function err(res: express.Response, status: number, message: string, extra?: unknown) {
  if (extra) console.error('[worker] error extra:', extra);
  res.status(status).json({ ok: false, error: message });
}

/** Read Cloud Tasks headers (useful in logs / idempotency if you later persist results). */
function readTaskHeaders(req: express.Request) {
  return {
    taskName: req.get('X-Cloud-Tasks-TaskName') || null,
    queue: req.get('X-Cloud-Tasks-QueueName') || null,
    retryCount: Number(req.get('X-Cloud-Tasks-TaskRetryCount') || 0),
    executionCount: Number(req.get('X-Cloud-Tasks-TaskExecutionCount') || 0),
    scheduledTime: req.get('X-Cloud-Tasks-ScheduledTime') || null,
  };
}

// ---------- Server bootstrap ----------

export async function startServer() {
  // 1) Load secrets (Ollama host, API keys, etc.)
  await loadConfigFromSecrets();
  console.log('[worker] secrets loaded');

  // 2) Initialize shared context (Firestore, bottleneck, etc.)
  const context: WorkerContext = await initializeContext();
  console.log('[worker] context initialized');

  // 3) Build app
  const app = express();
  app.use(express.json({ limit: '6mb' }));

  // Health check (Cloud Run)
  app.get('/_health', (_req, res) => res.status(200).send('OK'));

    // --- single-run /maintenance/daily guarded by a Firestore lock ---
    app.post('/maintenance/daily', async (_req, res) => {
    try {
        const db = (context as any).db;
        const docRef = db.collection('ops').doc('mission-library-maint');
        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;
        const LEASE_MS = 30 * 60 * 1000; // 30m

        await db.runTransaction(async (tx: any) => {
        const snap = await tx.get(docRef);
        const data = snap.exists ? snap.data() : {};
        const lastRunMs = Number(data?.lastRunMs ?? 0);
        const inProgress = Boolean(data?.inProgress);
        const leaseUntilMs = Number(data?.leaseUntilMs ?? 0);

        if (inProgress && leaseUntilMs > now) throw new Error('MAINT_LOCKED');
        if (now - lastRunMs < DAY) throw new Error('MAINT_RECENT');

        tx.set(docRef, { inProgress: true, leaseUntilMs: now + LEASE_MS }, { merge: true });
        });

        try {
        await runLibraryMaintenance(context, false);
        } finally {
        await (context as any).db
            .collection('ops')
            .doc('mission-library-maint')
            .set({ inProgress: false, lastRunMs: Date.now(), leaseUntilMs: 0 }, { merge: true });
        }

        return ok(res, { ran: true });
    } catch (e: any) {
        const msg = e?.message || String(e);
        if (msg === 'MAINT_LOCKED' || msg === 'MAINT_RECENT') {
        return ok(res, { ran: false, reason: msg }); // 200, no retry
        }
        return err(res, 500, 'maintenance failed', e);
    }
    });

  // --- Generic entrypoint: accepts either { jobId?, jobData } or raw LlmJobData ---
  app.post('/jobs', async (req, res) => {
    try {
      const hdrs = readTaskHeaders(req); // optional; handy for logs
      // Dev guard: avoid accidental local calls
      if (process.env.NODE_ENV !== 'production') {
        const devHdr = req.get('X-Local-Auth');
        if (devHdr !== 'dev') {
          return err(res, 403, 'forbidden (dev header missing: X-Local-Auth: dev)');
        }
      }

      const body = req.body ?? {};
      const jobId = String(body.jobId || hdrs.taskName || randomUUID());
      const jobData: LlmJobData =
        (body.jobData && typeof body.jobData === 'object' ? body.jobData : body) as LlmJobData;

      if (!jobData || typeof jobData !== 'object' || !('type' in jobData)) {
        return err(res, 400, 'Malformed job payload');
      }

      console.log(
        `[worker][${jobId}] /jobs type=${(jobData as LlmJobData).type} queue=${hdrs.queue} retry=${hdrs.retryCount}`
      );

      let out: HandlerOutput;
      switch (jobData.type) {
        case 'mission': {
          const job = makeJob(jobId, jobData as MissionJobData);
          out = await handleMissionJob(job, context);
          break;
        }
        case 'ask': {
          const job = makeJob(jobId, jobData as AskJobData);
          out = await handleAskJob(job, context);
          break;
        }
        case 'tutor-preflight': {
          const job = makeJob(jobId, jobData as TutorPreflightJobData);
          out = await handleTutorPreflightJob(job, context);
          break;
        }
        default:
          return err(res, 422, `Unsupported type: ${(jobData as any).type}`);
      }

      return ok(res, { jobId, ...out });
    } catch (e) {
      console.error('[worker] /jobs failed:', e);
      // Non-2xx triggers Cloud Tasks retry
      return err(res, 500, 'Job execution failed', e);
    }
  });

  // --- Convenience routes (dev/local tools) ---
  app.post('/mission', async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'production' && req.get('X-Local-Auth') !== 'dev') {
        return err(res, 403, 'forbidden (dev header missing)');
      }
      const jobId = randomUUID();
      const payload: MissionJobData = {
        type: 'mission',
        payload: {
          missionType: req.body?.missionType,
          role: req.body?.role,
        },
      };
      const job = makeJob(jobId, payload);
      const out = await handleMissionJob(job, context);
      return ok(res, { jobId, ...out });
    } catch (e) {
      console.error('[worker] /mission failed:', e);
      return err(res, 500, 'Mission job failed', e);
    }
  });

  app.post('/ask', async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'production' && req.get('X-Local-Auth') !== 'dev') {
        return err(res, 403, 'forbidden (dev header missing)');
      }
      const jobId = randomUUID();
      const payload: AskJobData = {
        type: 'ask',
        payload: {
          prompt: req.body?.prompt,
          context: req.body?.context ?? '',
        },
      };
      const job = makeJob(jobId, payload);
      const out = await handleAskJob(job, context);
      return ok(res, { jobId, ...out });
    } catch (e) {
      console.error('[worker] /ask failed:', e);
      return err(res, 500, 'Ask job failed', e);
    }
  });

  app.post('/tutor-preflight', async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'production' && req.get('X-Local-Auth') !== 'dev') {
        return err(res, 403, 'forbidden (dev header missing)');
      }
      const jobId = randomUUID();
      const payload: TutorPreflightJobData = {
        type: 'tutor-preflight',
        payload: {
          role: req.body?.role,
          mission: req.body?.mission,
          topicTitle: req.body?.topicTitle,
          topicSummary: req.body?.topicSummary,
          imageTitle: req.body?.imageTitle ?? '',
        },
      };
      const job = makeJob(jobId, payload);
      const out = await handleTutorPreflightJob(job, context);
      return ok(res, { jobId, ...out });
    } catch (e) {
      console.error('[worker] /tutor-preflight failed:', e);
      return err(res, 500, 'Tutor preflight job failed', e);
    }
  });

  // 4) Start listening
  const port = Number(process.env.PORT) || 8080;
  app.listen(port, () => {
    console.log(`[worker] listening on http://localhost:${port}`);
  });

  return app;
}

// If invoked directly (node dist/.../server.js)
if (require.main === module) {
  startServer().catch((e) => {
    console.error('[worker] FATAL BOOT ERROR:', e);
    process.exit(1);
  });
}
