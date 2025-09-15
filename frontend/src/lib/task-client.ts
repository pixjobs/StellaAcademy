// This file is SAFE to use in browser components ('use client').

import type { LlmJobData, LlmJobResult } from '@/types/llm';

// This defines the shape of the job document we get from our API
export type JobStatus<T = LlmJobResult> = {
  jobId: string;
  status: 'pending' | 'completed' | 'failed';
  type: LlmJobData['type'];
  createdAt: Date;
  result?: T;
  error?: string | null;
};

/**
 * Starts a new job by calling our Next.js API route.
 * @param jobData The job payload to enqueue.
 * @returns The unique ID of the created job.
 */
export async function startJob(jobData: LlmJobData): Promise<string> {
  const res = await fetch('/api/llm/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobData),
  });

  const data = (await res.json()) as {
    jobId?: string;
    error?: string;
  };

  if (!res.ok || !data.jobId) {
    throw new Error(data?.error || 'Failed to start job.');
  }
  return data.jobId;
}

/**
 * Polls our Next.js API route to get the status of a job.
 * This function also NORMALIZES the result shape before returning it.
 * @param jobId The ID of the job to check.
 * @returns The full, normalized job status document.
 */
export async function checkJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`/api/llm/enqueue?id=${encodeURIComponent(jobId)}`);
  const data = (await res.json()) as JobStatus | { error: string };

  if (!res.ok) {
    throw new Error((data as { error: string })?.error || 'Failed to check job status.');
  }

  const jobStatus = data as JobStatus;

  // ========================================================================
  // --- NORMALIZATION LOGIC ---
  // This is where we fix the nested 'result' object for 'mission' jobs.
  // ========================================================================
  if (
    jobStatus.status === 'completed' &&
    jobStatus.type === 'mission' &&
    jobStatus.result &&
    typeof jobStatus.result === 'object' &&
    'result' in jobStatus.result
  ) {
    console.log('[task-client] Normalizing nested mission result...');
    // "Unwrap" the nested result and return a clean object.
    return {
      ...jobStatus,
      result: (jobStatus.result as any).result,
    };
  }
  // ========================================================================

  // For all other cases (ask jobs, failed jobs, pending jobs), return the data as-is.
  return jobStatus;
}