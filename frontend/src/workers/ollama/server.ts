/* eslint-disable no-console */
// ============================================================================
// Cloud Run Worker (HTTP target for Cloud Tasks)
// Secure-by-default: verifies incoming OIDC tokens from Cloud Tasks.
//
// REQUIRED LIBS:  npm install express google-auth-library
//
// REQUIRED ENV (production):
// - CLOUD_RUN_WORKER_URL            Full HTTPS base URL of this service (no path)
//
// OPTIONAL ENV:
// - CLOUD_RUN_WORKER_ALT_AUD        Optional second base URL (e.g., custom domain)
// - DISABLE_AUTH_CHECK=true         Bypass token verification (dev only)
// ============================================================================

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
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

import type { LlmJobData, LlmJobResult, HandlerOutput } from '@/types/llm';

// ---------- Debug helpers ----------
function pad(label: string, width = 26): string {
  return (label + ':').padEnd(width, ' ');
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

// ---------- Auth helpers ----------
const authClient = new OAuth2Client();

/** Normalise a URL string to a base service URL (no path, no trailing slash). */
function normaliseBaseUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  try {
    const parsed = new URL(u);
    parsed.pathname = '/';
    let s = parsed.toString();
    if (s.endsWith('/')) s = s.slice(0, -1);
    return s;
  } catch {
    return undefined;
  }
}

/** Decode JWT payload `aud` (best effort, no signature verification). */
function decodeAudClaim(idToken: string): unknown {
  try {
    const payloadB64 = idToken.split('.')[1];
    const json = Buffer.from(payloadB64, 'base64').toString('utf8');
    const parsed = JSON.parse(json) as { aud?: unknown };
    return parsed.aud;
  } catch {
    return undefined;
  }
}

/** Normalise and collect allowed audiences from env vars. */
function getAllowedAudiences(): string[] {
  const primaryAud = normaliseBaseUrl(process.env.CLOUD_RUN_WORKER_URL);
  const altAud = normaliseBaseUrl(process.env.CLOUD_RUN_WORKER_ALT_AUD);
  return [primaryAud, altAud].filter((v): v is string => Boolean(v));
}

/** Error normaliser (keeps TS any-free). */
function asError(e: unknown): Error {
  return e instanceof Error ? e : new Error(String(e));
}

/** Safer extractor for job type (no any). */
function extractJobType(x: unknown): string | undefined {
  if (typeof x === 'object' && x !== null && 'type' in x) {
    const t = (x as Record<string, unknown>).type;
    return typeof t === 'string' ? t : undefined;
  }
  return undefined;
}

/** Derive the correct result type for a given discriminant from LlmJobResult. */
type ResultFor<T extends LlmJobResult['type']> = Extract<LlmJobResult, { type: T }>['result'];

// ---------- Auth Middleware (Secure by Default) ----------
/**
 * Express middleware to verify OIDC tokens from Cloud Tasks.
 * ENFORCED when running on GCP (K_SERVICE set) unless DISABLE_AUTH_CHECK=true.
 */
async function verifyCloudTask(req: Request, res: Response, next: NextFunction) {
  const logContext = { component: 'AuthMiddleware' };
  const isGcpEnvironment = !!process.env.K_SERVICE;
  const isAuthDisabled = process.env.DISABLE_AUTH_CHECK === 'true';

  console.info({
    ...logContext,
    message: 'Auth gate evaluation',
    flags: {
      [pad('K_SERVICE present')]: isGcpEnvironment,
      [pad('DISABLE_AUTH_CHECK')]: isAuthDisabled,
    },
  });

  if (!isGcpEnvironment || isAuthDisabled) {
    const reason = !isGcpEnvironment ? 'Not a GCP environment' : 'Auth check explicitly disabled';
    console.info({ ...logContext, message: 'Skipping auth verification', reason });
    return next();
  }

  const allowedAudiences = getAllowedAudiences();
  if (allowedAudiences.length === 0) {
    console.error({
      ...logContext,
      message: 'FATAL: No valid audience configured.',
      env: {
        [pad('CLOUD_RUN_WORKER_URL')]: process.env.CLOUD_RUN_WORKER_URL ?? '<unset>',
        [pad('CLOUD_RUN_WORKER_ALT_AUD')]: process.env.CLOUD_RUN_WORKER_ALT_AUD ?? '<unset>',
      },
    });
    return res.status(500).send('Internal Server Error: Worker is misconfigured (audience).');
  }

  console.info({
    ...logContext,
    message: 'Enforcing auth verification',
    allowedAudiences,
  });

  const authHeader = req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.warn({ ...logContext, message: 'Unauthorized: Missing/invalid Authorization header.' });
    return res.status(401).send('Unauthorized');
  }
  const idToken = authHeader.slice('Bearer '.length);
  const incomingAud = decodeAudClaim(idToken);

  for (const aud of allowedAudiences) {
    try {
      await authClient.verifyIdToken({ idToken, audience: aud });
      console.info({
        ...logContext,
        message: 'OIDC token verified successfully.',
        matchedAudience: aud,
        incomingAud,
      });
      return next();
    } catch {
      // try the next audience
    }
  }

  console.error({
    ...logContext,
    message: 'Forbidden: OIDC token verification failed for all allowed audiences.',
    incomingAud,
    triedAudiences: allowedAudiences,
  });
  return res.status(403).send('Forbidden: Invalid identity token.');
}

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

function ok(res: express.Response, body: LlmJobResult) {
  res.status(200).json(body);
}

function err(res: express.Response, status: number, message: string, extra?: unknown) {
  console.error({ component: 'ErrorHandler', message, status, extra: safeJson(extra) });
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
  const bootLogContext = { component: 'Bootstrap' };
  console.info({ ...bootLogContext, message: 'Worker server starting…' });

  await loadConfigFromSecrets();
  console.info({ ...bootLogContext, message: 'Configuration and secrets loaded.' });

  // Log normalised audiences once at boot
  const bootAudiences = getAllowedAudiences();
  console.info({
    ...bootLogContext,
    message: 'Audience configuration (normalised)',
    audiences: bootAudiences,
  });

  const context: WorkerContext = await initializeContext();
  console.info({ ...bootLogContext, message: 'Shared context initialized.' });

  const app = express();
  app.use(express.json({ limit: '6mb' }));

  app.get('/_health', (_req, res) => res.status(200).send('OK'));

  const protectedRoutes = express.Router();
  protectedRoutes.use(verifyCloudTask);

  // --- Maintenance Route ---
  protectedRoutes.post('/maintenance/daily', async (_req, res) => {
    const maintLogContext = { component: 'MaintenanceHandler' };
    console.info({ ...maintLogContext, message: 'Starting daily library maintenance…' });
    try {
      await runLibraryMaintenance(context, false);
      console.info({ ...maintLogContext, message: 'Maintenance run completed successfully.' });
      res.status(200).json({ ok: true, ran: true });
    } catch (e: unknown) {
      const msg = asError(e).message || String(e);
      if (msg === 'MAINT_LOCKED' || msg === 'MAINT_RECENT') {
        console.warn({ ...maintLogContext, message: 'Maintenance skipped.', reason: msg });
        return res.status(200).json({ ok: true, ran: false, reason: msg });
      }
      console.error({ ...maintLogContext, message: 'Maintenance failed with an unexpected error.', error: safeJson(e) });
      return err(res, 500, 'maintenance failed', e);
    }
  });

  // --- Generic Job Entrypoint ---
  protectedRoutes.post('/jobs', async (req, res) => {
    const started = Date.now();
    let jobId = '';

    try {
      const hdrs = readTaskHeaders(req);
      const body = req.body ?? {};
      jobId = String((body as { jobId?: unknown }).jobId ?? hdrs.taskName ?? randomUUID());

      const jobData: LlmJobData =
        ((body as { jobData?: unknown }).jobData && typeof (body as { jobData?: unknown }).jobData === 'object'
          ? (body as { jobData?: unknown }).jobData
          : body) as LlmJobData;

      const jobType = extractJobType(jobData);
      const jobLogContext = { component: 'JobHandler', jobId, jobType };

      if (!jobType) {
        console.warn({ ...jobLogContext, message: 'Rejected malformed job payload.', body: safeJson(body) });
        return err(res, 400, 'Malformed job payload');
      }

      console.info({
        ...jobLogContext,
        message: 'Received new job request',
        queue: hdrs.queue,
        retryCount: hdrs.retryCount,
        taskName: hdrs.taskName,
      });

      console.info({ ...jobLogContext, message: `Dispatching to handler: ${jobType}` });

      // NOTE: HandlerOutput is not generic in your codebase, so we treat result as unknown
      // and narrow via the LlmJobResult discriminant using ResultFor<...>.
      let out: HandlerOutput;
      let finalResult: LlmJobResult;

      switch (jobType) {
        case 'mission': {
          out = await handleMissionJob(makeJob(jobId, jobData), context);
          const totalMs = Date.now() - started;
          finalResult = {
            type: 'mission',
            result: out.result as ResultFor<'mission'>,
            meta: { jobId, queueName: hdrs.queue, timing: { totalMs, queueWaitMs: 0 } },
          };
          console.info({ ...jobLogContext, message: 'Job completed successfully', timing: { totalMs }, resultType: finalResult.type });
          return ok(res, finalResult);
        }

        case 'ask': {
          out = await handleAskJob(makeJob(jobId, jobData), context);
          const totalMs = Date.now() - started;
          finalResult = {
            type: 'ask',
            result: out.result as ResultFor<'ask'>,
            meta: { jobId, queueName: hdrs.queue, timing: { totalMs, queueWaitMs: 0 } },
          };
          console.info({ ...jobLogContext, message: 'Job completed successfully', timing: { totalMs }, resultType: finalResult.type });
          return ok(res, finalResult);
        }

        case 'tutor-preflight': {
          out = await handleTutorPreflightJob(makeJob(jobId, jobData), context);
          const totalMs = Date.now() - started;
          finalResult = {
            type: 'tutor-preflight',
            result: out.result as ResultFor<'tutor-preflight'>,
            meta: { jobId, queueName: hdrs.queue, timing: { totalMs, queueWaitMs: 0 } },
          };
          console.info({ ...jobLogContext, message: 'Job completed successfully', timing: { totalMs }, resultType: finalResult.type });
          return ok(res, finalResult);
        }

        case 'library-backfill': {
          out = await handleLibraryBackfillJob(makeJob(jobId, jobData), context);
          const totalMs = Date.now() - started;
          finalResult = {
            type: 'library-backfill',
            result: out.result as ResultFor<'library-backfill'>,
            meta: { jobId, queueName: hdrs.queue, timing: { totalMs, queueWaitMs: 0 } },
          };
          console.info({ ...jobLogContext, message: 'Job completed successfully', timing: { totalMs }, resultType: finalResult.type });
          return ok(res, finalResult);
        }

        default: {
          console.warn({ ...jobLogContext, message: `Rejected unsupported job type: ${String(jobType)}` });
          return err(res, 422, `Unsupported type: ${String(jobType)}`);
        }
      }
    } catch (e: unknown) {
      const totalMs = Date.now() - started;
      const jobLogContext = { component: 'JobHandler', jobId };
      const errObj = asError(e);

      console.error({
        ...jobLogContext,
        message: 'Job failed with an unhandled exception',
        timing: { totalMs },
        error: { message: errObj.message, stack: errObj.stack },
      });

      const finalErrorResult: LlmJobResult = {
        type: 'failure',
        result: { error: errObj.message || 'Job execution failed' },
        meta: { jobId, queueName: readTaskHeaders(req).queue, timing: { totalMs, queueWaitMs: 0 } },
      };

      console.info({
        ...jobLogContext,
        message: 'Returning 200 OK with failure payload to prevent Cloud Tasks retry.',
        payload: finalErrorResult,
      });
      return ok(res, finalErrorResult);
    }
  });

  app.use(protectedRoutes);

  const port = Number(process.env.PORT) || 8080;
  app.listen(port, () => {
    console.info({
      ...bootLogContext,
      message: 'Worker listening',
      info: {
        [pad('URL env (raw)')]: process.env.CLOUD_RUN_WORKER_URL ?? '<unset>',
        [pad('ALT_AUD env (raw)')]: process.env.CLOUD_RUN_WORKER_ALT_AUD ?? '<unset>',
        [pad('Auth disabled')]: process.env.DISABLE_AUTH_CHECK === 'true',
        [pad('K_SERVICE present')]: !!process.env.K_SERVICE,
        [pad('PORT')]: port,
      },
    });
  });

  return app;
}

if (require.main === module) {
  startServer().catch((e) => {
    console.error({
      component: 'Bootstrap',
      message: 'FATAL BOOT ERROR: The server failed to start.',
      error: asError(e),
    });
    process.exit(1);
  });
}
