'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useGame } from '@/lib/store';
import type { EnrichedMissionPlan } from '@/types/mission';
import type { MissionType } from '@/types/llm';

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type LlmJobState = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';

type PollCompleted = {
  state: 'completed';
  result: { type: 'mission'; result: EnrichedMissionPlan } | EnrichedMissionPlan;
};
type PollOngoing = { state: Exclude<LlmJobState, 'completed' | 'failed'> };
type PollFailed = { state: 'failed'; error?: string };
type PollResponse = PollCompleted | PollOngoing | PollFailed;

// ===== NEW TYPE GUARD =====
// This is the key to the fix. It's a type guard that checks if the `data` object
// from a cached response has the `result` property we expect.
function isCachedResponse(data: unknown): data is { result: PollCompleted['result'] } {
  return isRecord(data) && 'result' in data;
}
// ==========================

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function isMissionPlan(x: unknown): x is EnrichedMissionPlan {
  return isRecord(x) && typeof x.missionTitle === 'string' && Array.isArray(x.topics);
}

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

export function useMissionPlanGenerator(missionType: MissionType) {
  const role = useGame((s) => s.role);

  const [jobId, setJobId] = useState<string | null>(null);
  const [missionPlan, setMissionPlan] = useState<EnrichedMissionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generationCount, setGenerationCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const generateNewPlan = useCallback(() => {
    setMissionPlan(null);
    setJobId(null);
    setError(null);
    setIsLoading(true);
    abortRef.current?.abort();
    setGenerationCount((c) => c + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const enqueue = async () => {
      try {
        const res = await fetch('/api/llm/enqueue', { // Using the correct, unified endpoint
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'mission', payload: { missionType, role } }),
        });

        if (res.status === 202) {
          const data = (await res.json()) as { jobId?: string };
          if (!data.jobId) throw new Error('No jobId returned from enqueue');
          if (!cancelled) setJobId(data.jobId);
        } else if (res.ok) { // Status is 200, meaning a cached result was returned
          const data = (await res.json()) as unknown;

          // ===== THE FIX IS HERE =====
          // We use our new type guard to safely check the shape of `data`.
          // If it's valid, `data.result` is now fully typed, and no `as any` is needed.
          const plan = isCachedResponse(data) ? extractPlan(data.result) : null;
          // ===========================

          if (plan && !cancelled) {
            setMissionPlan(plan);
            setIsLoading(false);
          } else {
            // This now correctly handles cases where the cached response is malformed.
            console.error("Received unexpected 200 OK response format:", data);
            throw new Error('Unexpected cache response format from enqueue endpoint.');
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

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [role, missionType, generationCount]);

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
          setTimeout(poll, 1500);
        }
      } catch (e) {
        if (!stopped && (e as Error).name !== 'AbortError') {
          setError((e as Error).message);
          setIsLoading(false);
        }
      }
    };

    poll();

    return () => {
      stopped = true;
      abortRef.current?.abort();
    };
  }, [jobId, missionPlan]);

  return { missionPlan, isLoading, error, generateNewPlan };
}