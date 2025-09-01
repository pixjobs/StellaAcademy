'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { EnrichedMissionPlan } from '@/types/mission';
import { useGame } from '@/lib/store';

export type MissionType = 'rocket-lab' | 'rover-cam' | 'space-poster';

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
  return isRecord(x) && typeof x.missionTitle === 'string' && Array.isArray(x.topics);
}
function extractPlan(result: PollCompleted['result']): EnrichedMissionPlan | null {
  if (isMissionPlan(result)) return result;
  if (isRecord(result) && result.type === 'mission' && isMissionPlan(result.result)) {
    return result.result;
  }
  return null;
}

/**
 * Generate a mission plan via the worker/queue.
 * Pass one of: 'rocket-lab' | 'rover-cam' | 'space-poster'
 */
export function useMissionPlanGenerator(missionType: MissionType = 'rocket-lab') {
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

  // Enqueue a new mission job whenever role/missionType changes or user triggers regenerate
  useEffect(() => {
    let cancelled = false;

    const enqueue = async () => {
      try {
        const res = await fetch('/api/generate-mission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ missionType, role }),
        });

        if (res.status === 202) {
          const data = (await res.json()) as { jobId?: string };
          if (!data.jobId) throw new Error('No jobId returned from enqueue');
          if (!cancelled) setJobId(data.jobId);
        } else if (res.ok) {
          const data = (await res.json()) as unknown;
          if (isMissionPlan(data) && !cancelled) {
            setMissionPlan(data);
            setIsLoading(false);
          } else {
            throw new Error('Unexpected response format from enqueue endpoint.');
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

  // Poll for job completion if we got a jobId
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
        if (!stopped) {
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
