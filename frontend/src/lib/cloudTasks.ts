// lib/cloudTasks.ts
import { CloudTasksClient } from '@google-cloud/tasks';
import type { LlmJobData } from '@/types/llm';
import {
  getGcpLocation,
  getCloudRunWorkerUrl,
  getCloudTasksInvokerSa,
  getInteractiveTasksQueueId,
  getBackgroundTasksQueueId,
  getRequiredSecret,
} from './secrets';

const tasksClient = new CloudTasksClient();
export type QueueType = 'interactive' | 'background';

// Normalize to avoid double slashes and default sensibly
const DEV_WORKER_URL =
  (process.env.DEV_WORKER_URL || 'http://127.0.0.1:8080').replace(/\/+$/, '');

const VERBOSE = process.env.VERBOSE_ENQUEUE === '1';

async function postToLocalWorkerViaJobs(jobId: string, jobData: LlmJobData) {
  const url = `${DEV_WORKER_URL}/jobs`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Local-Auth': 'dev', // required by your server.ts in dev
  };
  const bodyObj = { jobId, jobData };
  const bodyStr = JSON.stringify(bodyObj);

  if (VERBOSE) {
    console.log('\n[DEV enqueue] -> REQUEST');
    console.log('  URL:     ', url);
    console.log('  Headers: ', headers);
    console.log('  Body[0:400]:', bodyStr.slice(0, 400));
  }

  let resp: Response;
  try {
    resp = await fetch(url, { method: 'POST', headers, body: bodyStr });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`[DEV enqueue] fetch error to ${url}: ${msg}`);
  }

  const text = await resp.text();
  if (VERBOSE) {
    console.log('[DEV enqueue] <- RESPONSE');
    console.log('  Status:  ', resp.status, resp.statusText);
    console.log('  Body[0:800]:', text.slice(0, 800), '\n');
  }

  if (!resp.ok) {
    const hint =
      resp.status === 404
        ? 'Hint: Does your worker expose POST /jobs? Is DEV_WORKER_URL correct?\n' +
          `Current DEV_WORKER_URL: ${DEV_WORKER_URL}`
        : '';
    throw new Error(`Dev worker HTTP call failed: ${resp.status} ${resp.statusText}\n${text}\n${hint}`);
  }

  try {
    return JSON.parse(text); // should be: { jobId, type, result, meta }
  } catch {
    return { type: 'failure', result: { error: text }, meta: { jobId, timing: { totalMs: 0, queueWaitMs: 0 } } };
  }
}

/**
 * Enqueue a task.
 * - DEV: call local worker /jobs and RETURN result (so your API can write Firestore immediately)
 * - PROD: create Cloud Task (returns null)
 */
export async function enqueueTask(
  jobId: string,
  jobData: LlmJobData,
  queueType: QueueType
): Promise<any | null> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] Posting job ${jobId} to ${DEV_WORKER_URL}/jobs (${queueType})`);
    const out = await postToLocalWorkerViaJobs(jobId, jobData);
    return out ?? null;
  }

  // ---- PRODUCTION (unchanged) ----
  const [
    project,
    location,
    workerUrl,
    serviceAccountEmail,
    interactiveQueue,
    backgroundQueue,
  ] = await Promise.all([
    getRequiredSecret('GOOGLE_CLOUD_PROJECT'),
    getGcpLocation(),
    getCloudRunWorkerUrl(),
    getCloudTasksInvokerSa(),
    getInteractiveTasksQueueId(),
    getBackgroundTasksQueueId(),
  ]);

  const queueName = queueType === 'interactive' ? interactiveQueue : backgroundQueue;
  const queuePath = tasksClient.queuePath(project, location, queueName);

  const [response] = await tasksClient.createTask({
    parent: queuePath,
    task: {
      httpRequest: {
        httpMethod: 'POST',
        url: `${workerUrl}/jobs`,
        headers: { 'Content-Type': 'application/json' },
        body: Buffer.from(JSON.stringify({ jobId, jobData })).toString('base64'),
        oidcToken: { serviceAccountEmail },
      },
    },
  });

  console.log(`[PROD] Created task ${response.name} for ${jobId}`);
  return null;
}
