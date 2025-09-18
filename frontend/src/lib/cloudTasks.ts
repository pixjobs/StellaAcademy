// ./src/lib/cloudTasks.ts

import { CloudTasksClient } from '@google-cloud/tasks';
import type { LlmJobData } from '@/types/llm';

import {
  getProjectId,
  getGcpLocation,
  getCloudRunWorkerUrl,
  getCloudTasksInvokerSa,
  getInteractiveTasksQueueId,
  getBackgroundTasksQueueId,
} from '@/lib/secrets';

// ───────────────────────────────────────────────────────────────────────────────
// Types & Helpers
// ───────────────────────────────────────────────────────────────────────────────

export type QueueType = 'interactive' | 'background';

interface TaskConfig {
  isReady: boolean;
  projectId?: string;
  location?: string;
  workerUrl?: string;
  serviceAccountEmail?: string;
  interactiveQueue?: string;
  backgroundQueue?: string;
}

type RequiredKeys = Exclude<keyof TaskConfig, 'isReady'>;

const REQUIRED_KEYS: ReadonlyArray<RequiredKeys> = [
  'projectId',
  'location',
  'workerUrl',
  'serviceAccountEmail',
  'interactiveQueue',
  'backgroundQueue',
] as const;

function pad(label: string, width = 18): string {
  return (label + ':').padEnd(width, ' ');
}

function toQueueId(value: string | undefined): string | undefined {
  if (!value) return value;
  return value.includes('/queues/') ? value.split('/').pop() : value;
}

/**
 * Validates that the URL is a valid base URL (no path) for OIDC audience.
 */
function isValidAudienceUrl(url: string): boolean {
  try {
    const u = new URL(url);
    // The path must be empty or a single slash.
    return (u.pathname === '' || u.pathname === '/') && u.protocol.length > 0 && u.host.length > 0;
  } catch {
    return false;
  }
}

function formatError(err: unknown): string {
  const error = err as { message?: string; code?: number; details?: string };
  const parts: string[] = [];
  if (error.message) parts.push(error.message);
  if (typeof error.code === 'number') parts.push(`code=${error.code}`);
  if (typeof error.details !== 'undefined') parts.push(`details=${String(error.details)}`);
  return parts.join(' | ');
}

function missingConfigKeys(cfg: TaskConfig): ReadonlyArray<RequiredKeys> {
  const missing: RequiredKeys[] = [];
  for (const k of REQUIRED_KEYS) {
    if (!cfg[k]) missing.push(k);
  }
  return missing;
}

// ───────────────────────────────────────────────────────────────────────────────
// Client & Configuration
// ───────────────────────────────────────────────────────────────────────────────

const tasksClient = new CloudTasksClient();

const configPromise: Promise<TaskConfig> = (async () => {
  console.log('[Tasks] Initialising configuration...');
  try {
    const [
      projectId,
      location,
      workerUrl,
      serviceAccountEmail,
      interactiveQueueRaw,
      backgroundQueueRaw,
    ] = await Promise.all([
      getProjectId(),
      getGcpLocation(),
      getCloudRunWorkerUrl(),
      getCloudTasksInvokerSa(),
      getInteractiveTasksQueueId(),
      getBackgroundTasksQueueId(),
    ]);

    // --- FIX: Add strict validation for critical configuration values ---
    if (!isValidAudienceUrl(workerUrl)) {
      throw new Error(
        `Invalid CLOUD_RUN_WORKER_URL: "${workerUrl}". It must be a base URL (e.g., "https://my-service-id.run.app") with no path.`
      );
    }
    if (!serviceAccountEmail || !serviceAccountEmail.includes('@')) {
        throw new Error(`Invalid CLOUD_TASKS_INVOKER_SA: "${serviceAccountEmail}". It must be a valid service account email.`);
    }

    const interactiveQueue = toQueueId(interactiveQueueRaw);
    const backgroundQueue = toQueueId(backgroundQueueRaw);

    const cfg: TaskConfig = {
      projectId,
      location,
      workerUrl,
      serviceAccountEmail,
      interactiveQueue,
      backgroundQueue,
      isReady: false,
    };

    const missing = missingConfigKeys(cfg);
    if (missing.length > 0) {
      // This will now be caught by the explicit checks above, but remains as a safeguard.
      throw new Error(`Cloud Tasks configuration is INCOMPLETE. Missing: ${missing.join(', ')}`);
    }

    console.log('[Tasks-Debug] Resolved configuration:');
    console.log(`  ${pad('Project ID')} "${projectId}"`);
    console.log(`  ${pad('Location')} "${location}"`);
    console.log(`  ${pad('Worker URL')} "${workerUrl}"`);
    console.log(`  ${pad('Invoker SA')} "${serviceAccountEmail}"`);
    console.log(`  ${pad('Interactive Queue')} "${interactiveQueue}"`);
    console.log(`  ${pad('Background Queue')} "${backgroundQueue}"`);
    
    console.log(`[Tasks] Configuration loaded successfully for project "${projectId}".`);
    cfg.isReady = true;
    return cfg;

  } catch (error) {
    console.error('[Tasks] CRITICAL: Failed to load configuration. Enqueueing will be disabled.', error);
    // Return a non-ready config so that all subsequent calls fail clearly.
    return { isReady: false };
  }
})();

// ───────────────────────────────────────────────────────────────────────────────
// Main API
// ───────────────────────────────────────────────────────────────────────────────

export async function enqueueTask(
  jobId: string,
  jobData: LlmJobData,
  queueType: QueueType
): Promise<null> {
  const cfg = await configPromise;

  if (!cfg.isReady) {
    throw new Error(
      `[Enqueue] Cannot create task for job "${jobId}" because Cloud Tasks configuration failed to initialize. Please check server startup logs.`
    );
  }

  const queueId = queueType === 'interactive' ? cfg.interactiveQueue! : cfg.backgroundQueue!;
  const parent = tasksClient.queuePath(cfg.projectId!, cfg.location!, queueId);
  const serviceBaseUrl = cfg.workerUrl!;
  const targetUrl = `${serviceBaseUrl}/jobs`;

  try {
    const payload = { jobId, jobData };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64');

    const [response] = await tasksClient.createTask({
      parent,
      task: {
        httpRequest: {
          httpMethod: 'POST',
          url: targetUrl,
          headers: { 'Content-Type': 'application/json' },
          body,
          oidcToken: {
            serviceAccountEmail: cfg.serviceAccountEmail!,
            audience: serviceBaseUrl,
          },
        },
      },
    });

    console.log(`[Enqueue] ✅ Task created for job "${jobId}" → ${response.name}`);
    return null;
  } catch (error) {
    const errorMessage = formatError(error);
    console.error(`[Enqueue] ❌ Failed to create task for job "${jobId}": ${errorMessage}`);
    
    // --- FIX: Add detailed, actionable hints based on the specific error code ---
    const gcpError = error as { code?: number };
    if (gcpError.code === 7) { // PERMISSION_DENIED
      console.error(
        '[Enqueue-Debug] HINT: Received "Permission Denied". This is an IAM issue. Please verify:\n' +
        `  1. The service account running this server has the "Cloud Tasks Enqueuer" (roles/cloudtasks.enqueuer) role.\n` +
        `  2. The invoker SA ("${cfg.serviceAccountEmail}") has the "Cloud Run Invoker" (roles/run.invoker) role on the worker service ("${cfg.workerUrl}").\n` +
        `  3. The Google-managed Cloud Tasks Service Agent has the "Service Account Token Creator" (roles/iam.serviceAccountTokenCreator) role on the invoker SA ("${cfg.serviceAccountEmail}").`
      );
    } else if (gcpError.code === 5) { // NOT_FOUND
        console.error(`[Enqueue-Debug] HINT: Received "Not Found". Check if the queue "${queueId}" exists in project "${cfg.projectId}" and location "${cfg.location}".`);
    } else if (gcpError.code === 3) { // INVALID_ARGUMENT
        console.error(`[Enqueue-Debug] HINT: Received "Invalid Argument". This often means the service account email or audience URL is malformed. Check the configuration logs above.`);
    }

    throw error;
  }
}