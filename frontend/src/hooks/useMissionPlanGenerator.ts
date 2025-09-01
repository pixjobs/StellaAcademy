'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { EnrichedMissionPlan } from '@/types/mission';
import { useGame } from '@/lib/store';

// Keep all related types and type guards with the hook that uses them
type LlmJobState = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
type PollCompleted = {
  state: 'completed';
  result: { type: 'mission'; result: EnrichedMissionPlan } | EnrichedMissionPlan;
};
type PollOngoing = { state: Exclude<LlmJobState, 'completed' | 'failed'> };
type PollFailed = { state: 'failed'; error?: string };
type PollResponse = PollCompleted | PollOngoing | PollFailed;

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}
function isMissionPlan(x: unknown): x is EnrichedMissionPlan {
  if (!isRecord(x)) return false;
  return typeof x.missionTitle === 'string' && Array.isArray(x.topics);
}
function extractPlan(result: PollCompleted['result']): EnrichedMissionPlan | null {
  if (isMissionPlan(result)) return result;
  if (isRecord(result) && result.type === 'mission' && isMissionPlan(result.result)) {
    return result.result;
  }
  return null;
}

/**
 * A custom hook to manage the lifecycle of generating a mission plan.
 * It handles enqueueing a job, polling for its status, and returning the final plan.
 */
export function useMissionPlanGenerator() {
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

  // Effect for enqueueing the job
  useEffect(() => {
    let cancelled = false;
    
    const enqueue = async () => {
      try {
        const res = await fetch('/api/generate-mission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ missionType: 'rocket-lab', role }),
        });

        if (res.status === 202) {
          const data = await res.json() as { jobId?: string };
          if (!data.jobId) throw new Error('No jobId returned from enqueue');
          if (!cancelled) setJobId(data.jobId);
        } else if (res.ok) {
           const data = await res.json() as unknown;
           if (isMissionPlan(data) && !cancelled) {
             setMissionPlan(data);
             setIsLoading(false);
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

    void enqueue();
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [role, generationCount]);

  // Effect for polling the job status
  useEffect(() => {
    if (!jobId || missionPlan) return;

    let stopped = false;
    const poll = async () => {
      if (stopped) return;
      abortRef.current = new AbortController();

      try {
        const res = await fetch(`/api/llm/enqueue?id=${jobId}`, { signal: abortRef.current.signal });
        if (!res.ok) throw new Error(`Polling error (${res.status})`);

        const json = await res.json() as PollResponse;

        if (json.state === 'completed') {
          const plan = extractPlan(json.result);
          if (!plan) throw new Error('Mission plan format is invalid.');
          setMissionPlan(plan);
          setIsLoading(false);
          setJobId(null); // Stop polling
        } else if (json.state === 'failed') {
          throw new Error(json.error || 'Mission generation failed.');
        } else {
          // If still ongoing, poll again after a delay
          setTimeout(() => void poll(), 2000);
        }
      } catch (e) {
        if (!stopped) {
          setError((e as Error).message);
          setIsLoading(false);
        }
      }
    };

    void poll();
    return () => { stopped = true; abortRef.current?.abort(); };
  }, [jobId, missionPlan]);

  return { missionPlan, isLoading, error, generateNewPlan };
}