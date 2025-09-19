'use client';

import type { LlmJobData, LlmJobResult } from '@/types/llm';

// This utility type creates a union of all possible "raw" result payloads.
type RawJobResultPayload = LlmJobResult['result'];

/**
 * Defines the shape of the job document returned by the API, both before
 * and after normalization.
 */
export type JobStatus = {
  jobId: string;
  status: 'pending' | 'completed' | 'failed';
  type: LlmJobData['type'];
  createdAt: Date;
  // The result can be the raw payload, a nested object, or the full LlmJobResult.
  result?: RawJobResultPayload | { result: RawJobResultPayload } | LlmJobResult;
  error?: string | null;
};

/**
 * Starts a new job by calling our Next.js API route.
 */
export async function startJob(jobData: LlmJobData): Promise<string> {
  const res = await fetch('/api/llm/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobData),
  });

  const data = (await res.json()) as { jobId?: string; error?: string };

  if (!res.ok || !data.jobId) {
    throw new Error(data?.error || 'Failed to start job.');
  }
  return data.jobId;
}

/**
 * Polls the API for job status and NORMALIZES the result shape.
 * This function is the single source of truth for cleaning up the API response
 * before it reaches any React component or hook.
 */
export async function checkJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`/api/llm/enqueue?id=${encodeURIComponent(jobId)}`);
  const data = (await res.json()) as JobStatus | { error: string };

  if (!res.ok) {
    throw new Error((data as { error: string })?.error || 'Failed to check job status.');
  }

  const jobStatus = data as JobStatus;

  // --- UNIVERSAL NORMALIZATION LOGIC ---
  // This block handles the nested result structure for ALL completed job types.
  if (
    jobStatus.status === 'completed' &&
    jobStatus.result &&
    typeof jobStatus.result === 'object' &&
    'result' in jobStatus.result && // Check if the outer result has a nested result
    'type' in jobStatus.result &&   // Check if it looks like our LlmJobResult shape
    'meta' in jobStatus.result
  ) {
    console.log(`[task-client] Normalizing nested result for job type: '${jobStatus.result.type}'`);
    
    // "Unwind" the structure, replacing the complex result with the clean, inner payload.
    return {
      ...jobStatus,
      result: (jobStatus.result as LlmJobResult).result,
    };
  }

  // For pending, failed, or already-flat results, return as-is.
  return jobStatus;
}