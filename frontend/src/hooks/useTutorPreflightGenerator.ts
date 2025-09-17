'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { startJob, checkJobStatus } from '@/lib/task-client';
import type { TutorPreflightOutput, TutorPreflightJobData, Role } from '@/types/llm';
import type { EnrichedMissionPlan } from '@/types/mission';

export type PreflightGenerationStatus = 'idle' | 'loading' | 'success' | 'error';

export type TutorPreflightParams = {
  role: Role;
  mission: EnrichedMissionPlan;
  topicTitle: string;
  topicSummary: string;
  imageTitle?: string;
};

/**
 * A robust React hook to generate a tutor pre-flight configuration using the
 * asynchronous, polling-based backend architecture.
 */
export function useTutorPreflightGenerator() {
  const [preflight, setPreflight] = useState<TutorPreflightOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PreflightGenerationStatus>('idle');

  const abortRef = useRef<AbortController | null>(null);

  const generateNewPreflight = useCallback((params: TutorPreflightParams) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const createAndPollPreflight = async () => {
      setPreflight(null);
      setError(null);
      setStatus('loading');

      try {
        const jobPayload: TutorPreflightJobData = {
          type: 'tutor-preflight',
          payload: {
            role: params.role,
            mission: params.mission,
            topicTitle: params.topicTitle,
            topicSummary: params.topicSummary,
            imageTitle: params.imageTitle,
          },
        };

        const jobId = await startJob(jobPayload);

        const POLLING_INTERVAL_MS = 2000;
        const JOB_TIMEOUT_MS = 45_000;
        const started = Date.now();

        while (Date.now() - started < JOB_TIMEOUT_MS) {
          if (controller.signal.aborted) {
            console.log('Tutor pre-flight polling was cancelled.');
            return;
          }

          // `checkJobStatus` now returns a clean, unwound data structure.
          const jobStatus = await checkJobStatus(jobId);

          if (jobStatus.status === 'completed') {
            // --- SIMPLIFIED & TYPE-SAFE LOGIC ---
            // The ugly nested checks are gone. We can now directly check the result.
            if (jobStatus.result && 'systemPrompt' in jobStatus.result) {
              const preflightData = jobStatus.result as TutorPreflightOutput;
              setPreflight(preflightData);
              setStatus('success');
              return; // Success!
            }
            throw new Error('Completed job returned an invalid pre-flight result shape.');
          }

          if (jobStatus.status === 'failed') {
            throw new Error(jobStatus.error || 'Pre-flight generation failed in the worker.');
          }

          await new Promise((r) => setTimeout(r, POLLING_INTERVAL_MS));
        }

        throw new Error('Pre-flight generation timed out. The server may be busy.');
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(message);
        setStatus('error');
      }
    };

    void createAndPollPreflight();
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const isLoading = status === 'loading';

  return { preflight, isLoading, status, error, generateNewPreflight };
}