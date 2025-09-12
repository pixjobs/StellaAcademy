'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useGame } from '@/lib/store';
import type { EnrichedMissionPlan } from '@/types/mission';
import type { MissionType } from '@/types/llm';

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type LlmJobState =
  | 'waiting'
  | 'active'
  | 'completed'
  | 'failed'
  | 'delayed'
  | 'paused';

export type MissionGenerationStatus =
  | 'idle'
  | 'enqueueing'
  | 'waiting'
  | 'generating'
  | 'success'
  | 'error';

type PollCompleted = {
  state: 'completed';
  result:
    | { type: 'mission'; result: EnrichedMissionPlan }
    | EnrichedMissionPlan;
};

type PollOngoing = { state: Exclude<LlmJobState, 'completed' | 'failed'> };

type PollFailed = { state: 'failed'; error?: string };

type PollResponse = PollCompleted | PollOngoing | PollFailed;

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function isMissionPlan(x: unknown): x is EnrichedMissionPlan {
  return (
    isRecord(x) &&
    typeof x.missionTitle === 'string' &&
    Array.isArray((x as { topics?: unknown }).topics)
  );
}

function extractPlan(result: PollCompleted['result']): EnrichedMissionPlan | null {
  if (isMissionPlan(result)) return result;
  if (isRecord(result) && result.type === 'mission' && isMissionPlan(result.result)) {
    return result.result;
  }
  return null;
}

function isCachedResponse(data: unknown): data is { result: PollCompleted['result'] } {
  return isRecord(data) && 'result' in data;
}

/* -------------------------------------------------------------------------- */
/*                              Backoff & Parsing                             */
/* -------------------------------------------------------------------------- */

const MAX_ENQUEUE_RETRIES = 3;
const ENQUEUE_RETRY_DELAY_MS = 1500; // Slightly increased base retry

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function suggestedRetryDelayMs(res: Response, fallbackMs: number): number {
  const pollAfter = res.headers.get('X-Poll-After-Ms');
  if (pollAfter) {
    const n = Number(pollAfter);
    if (Number.isFinite(n) && n > 0) return clamp(Math.round(n), 500, 30_000);
  }

  const retry = res.headers.get('Retry-After');
  if (!retry) return fallbackMs;

  const asSeconds = Number(retry);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return clamp(Math.round(asSeconds * 1000), 500, 60_000);
  }

  const asDate = Date.parse(retry);
  if (Number.isFinite(asDate)) {
    const delta = asDate - Date.now();
    if (delta > 0) return clamp(delta, 500, 60_000);
  }
  return fallbackMs;
}

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

  /* ---------------------------- Enqueue with retry --------------------------- */
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
            cache: 'no-store',
          });

          if (res.status === 202) {
            const data = (await res.json()) as { jobId?: string };
            if (!data.jobId) throw new Error('API returned 202 but no jobId.');
            if (!cancelled) setJobId(data.jobId);
            return;
          }

          if (res.ok) {
            const data = (await res.json()) as unknown;
            const plan = isCachedResponse(data) ? extractPlan(data.result) : null;
            if (plan) {
              if (!cancelled) {
                setMissionPlan(plan);
                setStatus('success');
              }
              return;
            }
            throw new Error(`Invalid cached response received: ${JSON.stringify(data)}`);
          }

          if (res.status === 503 || res.status === 429) {
            const delay = suggestedRetryDelayMs(res, ENQUEUE_RETRY_DELAY_MS * attempt);
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }

          if (res.status >= 400 && res.status < 500) {
            const txt = await res.text();
            throw new Error(`Failed to start mission generation (${res.status}): ${txt}`);
          }

          const txt = await res.text();
          throw new Error(`Server error (${res.status}): ${txt}`);
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          console.warn(`[Attempt ${attempt}/${MAX_ENQUEUE_RETRIES}] Enqueue failed: ${errorMessage}`);

          if (attempt === MAX_ENQUEUE_RETRIES) {
            if (!cancelled) {
              setError('Could not start the mission generation. Please try again.');
              setStatus('error');
            }
            return;
          }

          await new Promise((r) =>
            setTimeout(r, ENQUEUE_RETRY_DELAY_MS * attempt)
          );
        }
      }
    };

    void enqueueWithRetries();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [role, missionType, generationCount]);

  /* --------------------------------- Polling -------------------------------- */
  useEffect(() => {
    if (!jobId || missionPlan) return;

    let stopped = false;
    let pollCount = 0;

    // ===== CORRECTION 2: INCREASE TIME BETWEEN REQUESTS =====
    // This function makes the polling more patient.
    const schedule = (ms: number) => {
      // Increased the minimum delay to 1000ms and the maximum to 15,000ms
      setTimeout(poll, clamp(ms, 1000, 15_000));
    };

    const poll = async () => {
      if (stopped) return;
      abortRef.current = new AbortController();

      try {
        const res = await fetch(`/api/llm/enqueue?id=${encodeURIComponent(jobId)}`, {
          signal: abortRef.current.signal,
          cache: 'no-store',
        });

        if (res.status === 503 || res.status === 429) {
          setStatus('waiting');
          const delay = suggestedRetryDelayMs(res, 3000); // Increased fallback
          schedule(delay);
          return;
        }

        if (res.status === 410) {
          const txt = await res.text();
          throw new Error(`Job no longer available (410). ${txt}`);
        }

        if (res.status === 404) {
          setStatus('waiting');
          pollCount += 1;
          const delay = clamp(1500 + pollCount * 500, 1500, 6000); // Slower retries on 404
          schedule(delay);
          return;
        }

        if (!res.ok) {
          pollCount += 1;
          if (pollCount <= 2) {
            const delay = clamp(2000 * pollCount, 2000, 6000);
            schedule(delay);
            return;
          }
          const txt = await res.text();
          throw new Error(`Polling failed (${res.status}): ${txt}`);
        }

        const json = (await res.json()) as PollResponse;

        if (json.state === 'completed') {
          const plan = extractPlan(json.result);
          if (!plan) throw new Error('Received an invalid mission plan from the server.');
          setMissionPlan(plan);
          setStatus('success');
          setJobId(null);
          return;
        }

        if (json.state === 'failed') {
          // Pass the specific error from the backend instead of a generic one
          throw new Error(json.error || 'The mission generation process failed.');
        }

        setStatus(json.state === 'active' ? 'generating' : 'waiting');
        pollCount += 1;

        // More patient backoff calculation
        const hintedDelay = suggestedRetryDelayMs(res, 2500);
        // Increased base delay and growth factor, with a higher ceiling
        const expBackoff = clamp(Math.round(2500 * Math.pow(1.25, pollCount)), 1000, 12000);
        const delay = Math.max(hintedDelay, expBackoff);
        schedule(delay);

      } catch (e) {
        if (stopped || (e as Error).name === 'AbortError') return;

        // ===== CORRECTION 1: SEE THE ACTUAL ERROR =====
        // This block now extracts the specific error message from the backend
        // instead of showing a generic one.
        console.error('Polling error:', e);
        let specificError = 'An error occurred while fetching the mission plan.';
        if (e instanceof Error) {
            // Check if the error message is the JSON response from our API
            if (e.message.includes('{') && e.message.includes('state') && e.message.includes('error')) {
                try {
                    const jsonText = e.message.substring(e.message.indexOf('{'));
                    const errorPayload = JSON.parse(jsonText) as { error?: string };
                    if (errorPayload.error) {
                        specificError = errorPayload.error;
                    }
                } catch { /* Ignore parsing errors, use the full message */ 
                    specificError = e.message;
                }
            } else {
                // Use the error's message directly if it's not our specific JSON format
                specificError = e.message;
            }
        }
        setError(`Mission Failed: ${specificError}`);
        // =======================================================
        setStatus('error');
      }
    };

    void poll();

    return () => {
      stopped = true;
      abortRef.current?.abort();
    };
  }, [jobId, missionPlan]);

  const isLoading = status === 'enqueueing' || status === 'waiting' || status === 'generating';

  return { missionPlan, isLoading, status, error, generateNewPlan };
}