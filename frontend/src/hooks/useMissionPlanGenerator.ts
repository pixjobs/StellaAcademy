'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '@/lib/store';
import { startJob, checkJobStatus } from '@/lib/task-client';
import type { EnrichedMissionPlan } from '@/types/mission';
import type { MissionType, LlmJobData } from '@/types/llm';

// Simplified, UI-friendly status states.
export type MissionGenerationStatus = 'idle' | 'loading' | 'success' | 'error';

// --- Configuration ---
const POLLING_INTERVAL_MS = 2000;
const JOB_TIMEOUT_MS = 45_000; // 45 seconds

/**
 * A robust React hook to generate a mission plan using the asynchronous,
 * polling-based backend architecture.
 *
 * @param missionType The type of mission to generate.
 * @returns An object with the mission plan, loading status, and error state.
 */
export function useMissionPlanGenerator(missionType: MissionType) {
  const { role = 'explorer' } = useGame();
  const [missionPlan, setMissionPlan] = useState<EnrichedMissionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<MissionGenerationStatus>('idle');
  const [generationCount, setGenerationCount] = useState(0);

  // Use a ref to hold the AbortController. This ensures that a re-render
  // doesn't lose the reference to the active controller.
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Triggers a new mission plan generation. It aborts any ongoing polling
   * from a previous request and resets the state.
   */
  const generateNewPlan = useCallback(() => {
    // Abort any active polling loop from a previous call.
    abortRef.current?.abort();

    // Reset all state variables and increment the generation counter
    // to trigger the main useEffect hook.
    setMissionPlan(null);
    setError(null);
    setStatus('idle');
    setGenerationCount((c) => c + 1);
  }, []);

  useEffect(() => {
    // Each generation attempt gets its own AbortController.
    const controller = new AbortController();
    abortRef.current = controller;

    const createAndPollMission = async () => {
      setStatus('loading');
      setError(null);

      try {
        // Define the job payload with a specific type to satisfy TypeScript.
        const jobPayload: LlmJobData = {
          type: 'mission',
          payload: { missionType, role },
        };

        const jobId = await startJob(jobPayload);

        const started = Date.now();
        while (Date.now() - started < JOB_TIMEOUT_MS) {
          // If the controller has been aborted (e.g., by generateNewPlan), stop polling.
          if (controller.signal.aborted) {
            console.log('Mission plan polling was cancelled.');
            return;
          }

          // checkJobStatus now returns a clean, normalized data shape.
          const jobStatus = await checkJobStatus(jobId);

          if (jobStatus.status === 'completed') {
            // =================================================================
            // --- UPDATED & SIMPLIFIED LOGIC ---
            // =================================================================
            // The ugly nested check is gone. We now directly check the result
            // to ensure it looks like a valid mission plan.
            if (jobStatus.result && 'missionTitle' in jobStatus.result) {
              const plan = jobStatus.result as EnrichedMissionPlan;
              setMissionPlan(plan);
              setStatus('success');
              return; // Success! Exit the function.
            }
            // This error will now only be thrown if the result is truly malformed
            // (e.g., empty or not an object).
            throw new Error('Completed job returned an invalid result shape.');
          }

          if (jobStatus.status === 'failed') {
            throw new Error(jobStatus.error || 'Mission generation failed in the worker.');
          }

          // Wait for the defined interval before the next poll.
          await new Promise((r) => setTimeout(r, POLLING_INTERVAL_MS));
        }

        // If the loop finishes without returning, it's a timeout.
        throw new Error('Mission generation timed out. The server may be busy.');
      } catch (err: unknown) {
        // Don't set an error state if the operation was intentionally cancelled.
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(message);
        setStatus('error');
      }
    };

    // The `void` operator indicates we are intentionally not awaiting this promise.
    void createAndPollMission();

    // The cleanup function is critical. It runs when the component unmounts
    // or when the dependencies change, ensuring no state updates happen on an
    // unmounted component.
    return () => {
      controller.abort();
    };
  }, [role, missionType, generationCount]);

  const isLoading = status === 'loading';

  return { missionPlan, isLoading, status, error, generateNewPlan };
}