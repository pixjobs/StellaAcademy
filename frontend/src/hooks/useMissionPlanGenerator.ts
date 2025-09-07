'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useGame } from '@/lib/store';
// Import the canonical, expanded MissionType and other types from their central locations.
import type { EnrichedMissionPlan } from '@/types/mission';
import type { MissionType } from '@/types/llm';

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type LlmJobState = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';

// Define the shape of the data we expect back from our polling endpoint.
type PollCompleted = {
  state: 'completed';
  result: { type: 'mission'; result: EnrichedMissionPlan } | EnrichedMissionPlan;
};
type PollOngoing = { state: Exclude<LlmJobState, 'completed' | 'failed'> };
type PollFailed = { state: 'failed'; error?: string };
type PollResponse = PollCompleted | PollOngoing | PollFailed;

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function isMissionPlan(x: unknown): x is EnrichedMissionPlan {
  return isRecord(x) && typeof x.missionTitle === 'string' && Array.isArray(x.topics);
}

/**
 * Safely extracts the EnrichedMissionPlan from the various possible response shapes.
 * This handles both fresh cache hits (direct plan) and polled job results.
 */
function extractPlan(result: PollCompleted['result']): EnrichedMissionPlan | null {
  if (isMissionPlan(result)) return result;
  if (isRecord(result) && result.type === 'mission' && isMissionPlan(result.result)) {
    return result.result;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*                                  Main Hook                                 */
/* -------------------------------------------------------------------------- */

/**
 * A hook to generate a mission plan via the backend worker queue.
 * It handles the entire lifecycle: enqueuing the job, polling for its status,
 * and returning the final mission plan or any errors.
 *
 * @param missionType - The specific type of mission to generate. This is a required
 * parameter that determines which backend logic is triggered (e.g., calling NIVL for
 * 'celestial-investigator' or the EPIC API for 'earth-observer').
 * @returns An object containing the mission plan, loading state, error state, and a
 * function to trigger a new generation.
 */
export function useMissionPlanGenerator(missionType: MissionType) {
  const role = useGame((s) => s.role);

  const [jobId, setJobId] = useState<string | null>(null);
  const [missionPlan, setMissionPlan] = useState<EnrichedMissionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generationCount, setGenerationCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Resets the state and triggers a new mission generation.
   * Aborts any ongoing polling requests.
   */
  const generateNewPlan = useCallback(() => {
    setMissionPlan(null);
    setJobId(null);
    setError(null);
    setIsLoading(true);
    abortRef.current?.abort();
    setGenerationCount((c) => c + 1);
  }, []);

  // Effect 1: Enqueue a new mission job whenever the key dependencies change.
  useEffect(() => {
    let cancelled = false;

    const enqueue = async () => {
      // The silent fallback has been removed. The missionType from props is now required.
      try {
        const res = await fetch('/api/generate-mission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Directly use the missionType, ensuring the correct mission is always requested.
          body: JSON.stringify({ missionType, role }),
        });

        // A 202 status means the job was accepted by the queue.
        if (res.status === 202) {
          const data = (await res.json()) as { jobId?: string };
          if (!data.jobId) throw new Error('No jobId returned from enqueue');
          if (!cancelled) setJobId(data.jobId);
        // A 200 status means we got a fresh, cached result immediately.
        } else if (res.ok) {
          const data = (await res.json()) as unknown;
          const plan = isRecord(data) ? extractPlan(data.result as any) : null;
          if (plan && !cancelled) {
            setMissionPlan(plan);
            setIsLoading(false);
          } else {
            throw new Error('Unexpected 200 OK response format from enqueue endpoint.');
          }
        } else {
          const txt = await res.text();
          throw new Error(`Enqueue failed (${res.status}): ${txt}`);
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setIsLoading(false);
        }
      }
    };

    enqueue();

    // Cleanup function to prevent state updates on unmounted components.
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [role, missionType, generationCount]);

  // Effect 2: Poll for job completion if we have a jobId and no mission plan yet.
  useEffect(() => {
    if (!jobId || missionPlan) return;

    let stopped = false;
    const poll = async () => {
      if (stopped) return;
      abortRef.current = new AbortController();

      try {
        const res = await fetch(`/api/llm/enqueue?id=${jobId}`, {
          signal: abortRef.current.signal,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Polling error (${res.status})`);

        const json = (await res.json()) as PollResponse;

        if (json.state === 'completed') {
          const plan = extractPlan(json.result);
          if (!plan) throw new Error('Mission plan format is invalid.');
          setMissionPlan(plan);
          setIsLoading(false);
          setJobId(null);
        } else if (json.state === 'failed') {
          throw new Error(json.error || 'Mission generation failed.');
        } else {
          // If the job is still ongoing, wait and poll again.
          setTimeout(poll, 1500);
        }
      } catch (e) {
        // Don't set an error state if the request was intentionally aborted.
        if (!stopped && (e as Error).name !== 'AbortError') {
          setError((e as Error).message);
          setIsLoading(false);
        }
      }
    };

    poll();

    // Cleanup function to stop polling when the component unmounts or dependencies change.
    return () => {
      stopped = true;
      abortRef.current?.abort();
    };
  }, [jobId, missionPlan]);

  return { missionPlan, isLoading, error, generateNewPlan };
}