'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useGame } from '@/lib/store';
import type { EnrichedMissionPlan } from '@/types/mission';
import type { MissionType } from '@/types/llm';

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type LlmJobState = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
export type MissionGenerationStatus = 'idle' | 'enqueueing' | 'waiting' | 'generating' | 'success' | 'error';

type PollCompleted = { state: 'completed'; result: { type: 'mission'; result: EnrichedMissionPlan } | EnrichedMissionPlan; };
type PollOngoing = { state: Exclude<LlmJobState, 'completed' | 'failed'> };
type PollFailed = { state: 'failed'; error?: string };
type PollResponse = PollCompleted | PollOngoing | PollFailed;

function isCachedResponse(data: unknown): data is { result: PollCompleted['result'] } {
  return isRecord(data) && 'result' in data;
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function isRecord(x: unknown): x is Record<string, unknown> { return typeof x === 'object' && x !== null; }
function isMissionPlan(x: unknown): x is EnrichedMissionPlan { return isRecord(x) && typeof x.missionTitle === 'string' && Array.isArray(x.topics); }
function extractPlan(result: PollCompleted['result']): EnrichedMissionPlan | null {
  if (isMissionPlan(result)) return result;
  if (isRecord(result) && result.type === 'mission' && isMissionPlan(result.result)) return result.result;
  return null;
}

const MAX_ENQUEUE_RETRIES = 3;
const ENQUEUE_RETRY_DELAY_MS = 1000;

/* -------------------------------------------------------------------------- */
/*                                  Main Hook                                 */
/* -------------------------------------------------------------------------- */

export function useMissionPlanGenerator(missionType: MissionType) {
  const role = useGame((s) => s.role);

  const [jobId, setJobId] = useState<string | null>(null);
  const [missionPlan, setMissionPlan] = useState<EnrichedMissionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<MissionGenerationStatus>('idle');
  const [generationCount, setGenerationCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const generateNewPlan = useCallback(() => {
    setMissionPlan(null);
    setJobId(null);
    setError(null);
    setStatus('idle');
    abortRef.current?.abort();
    setGenerationCount((c) => c + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('enqueueing');

    const enqueueWithRetries = async () => {
      for (let attempt = 1; attempt <= MAX_ENQUEUE_RETRIES; attempt++) {
        if (cancelled) return;

        try {
          const res = await fetch('/api/llm/enqueue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'mission', payload: { missionType, role } }),
          });

          if (res.status === 202) { // 202 Accepted: Job was created, polling will begin.
            const data = (await res.json()) as { jobId?: string };
            if (!data.jobId) throw new Error('API returned 202 but no jobId.');
            if (!cancelled) setJobId(data.jobId);
            return; // Success, exit the retry loop.
          }
          
          if (res.ok) { // 200 OK: A cached result was returned.
            const data = (await res.json()) as unknown;
            const plan = isCachedResponse(data) ? extractPlan(data.result) : null;
            
            if (plan) { // The cached plan is valid.
              if (!cancelled) {
                setMissionPlan(plan);
                setStatus('success');
              }
              return; // Success, exit the retry loop.
            } else {
              // THIS IS THE FIX: The cached response was invalid.
              throw new Error(`Invalid cached response received: ${JSON.stringify(data)}`);
            }
          }

          // Handle non-OK server responses that might be retriable
          if (res.status >= 500) {
            throw new Error(`Server error (${res.status}), retrying...`);
          }

          // Handle other client errors (e.g., 400, 403) that should not be retried.
          const txt = await res.text();
          throw new Error(`Failed to start mission generation (${res.status}): ${txt}`);

        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          console.warn(`[Attempt ${attempt}/${MAX_ENQUEUE_RETRIES}] Enqueue failed: ${errorMessage}`);
          
          if (attempt === MAX_ENQUEUE_RETRIES) {
            if (!cancelled) {
              setError('Could not start the mission generation. Please try again.');
              setStatus('error');
            }
            return; // Final attempt failed, exit loop.
          }
          
          // Wait before the next retry.
          await new Promise(resolve => setTimeout(resolve, ENQUEUE_RETRY_DELAY_MS * attempt));
        }
      }
    };

    enqueueWithRetries();

    return () => { cancelled = true; abortRef.current?.abort(); };
  }, [role, missionType, generationCount]);

  useEffect(() => {
    if (!jobId || missionPlan) return;

    let stopped = false;
    let pollCount = 0;

    const poll = async () => {
      if (stopped) return;
      abortRef.current = new AbortController();

      try {
        const res = await fetch(`/api/llm/enqueue?id=${jobId}`, {
          signal: abortRef.current.signal,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Polling failed (${res.status})`);

        const json = (await res.json()) as PollResponse;

        if (json.state === 'completed') {
          const plan = extractPlan(json.result);
          if (!plan) throw new Error('Received an invalid mission plan from the server.');
          setMissionPlan(plan);
          setStatus('success');
          setJobId(null);
        } else if (json.state === 'failed') {
          throw new Error(json.error || 'The mission generation process failed.');
        } else {
          setStatus(json.state === 'active' ? 'generating' : 'waiting');
          pollCount++;
          const delay = Math.min(1500 * Math.pow(1.2, pollCount), 8000);
          setTimeout(poll, delay);
        }
      } catch (e) {
        if (!stopped && (e as Error).name !== 'AbortError') {
          console.error("Polling error:", e);
          setError('An error occurred while fetching the mission plan. Please try again.');
          setStatus('error');
        }
      }
    };

    poll();

    return () => { stopped = true; abortRef.current?.abort(); };
  }, [jobId, missionPlan]);

  const isLoading = status === 'enqueueing' || status === 'waiting' || status === 'generating';

  return { missionPlan, isLoading, status, error, generateNewPlan };
}