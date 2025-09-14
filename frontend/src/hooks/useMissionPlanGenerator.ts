'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '@/lib/store';
import type { EnrichedMissionPlan } from '@/types/mission';
import type { MissionType } from '@/types/llm';

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type LlmJobState = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';

export type MissionGenerationStatus =
  | 'idle'
  | 'enqueueing'
  | 'waiting'
  | 'generating'
  | 'success'
  | 'error';

type PollCompleted = {
  state: 'completed';
  result: { type: 'mission'; result: EnrichedMissionPlan } | EnrichedMissionPlan;
};
type PollOngoing = { state: Exclude<LlmJobState, 'completed' | 'failed'> };
type PollFailed  = { state: 'failed'; error?: string };
type PollResponse = PollCompleted | PollOngoing | PollFailed;

type FastStatus = 'ready' | 'stale' | 'queued' | 'missing' | 'error';
type FastReady  = { status: Extract<FastStatus, 'ready' | 'stale'>; plan: EnrichedMissionPlan; jobId?: string };
type FastQueued = { status: 'queued'; jobId: string; plan?: EnrichedMissionPlan };

/** Some backends reply 202 with just { jobId, plan? } (no status). Support that too. */
type FastQueuedLoose = { jobId: string; plan?: EnrichedMissionPlan; status?: 'queued' };

/* -------------------------------------------------------------------------- */
/* Config & helpers                                                            */
/* -------------------------------------------------------------------------- */

const MAX_ENQUEUE_RETRIES = 3;
const ENQUEUE_RETRY_DELAY_MS = 1500;
const DEFAULT_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6h

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}
function isMissionPlan(x: unknown): x is EnrichedMissionPlan {
  return isRecord(x) && typeof x.missionTitle === 'string' && Array.isArray((x as { topics?: unknown }).topics);
}
function extractPlan(result: PollCompleted['result']): EnrichedMissionPlan | null {
  if (isMissionPlan(result)) return result;
  if (isRecord(result) && result.type === 'mission' && isMissionPlan(result.result)) return result.result;
  return null;
}
function isFastReady(x: unknown): x is FastReady {
  return isRecord(x) && (x.status === 'ready' || x.status === 'stale') && isMissionPlan((x as { plan?: unknown }).plan);
}
/** Strict queued */
function isFastQueued(x: unknown): x is FastQueued {
  return isRecord(x) && x.status === 'queued' && typeof (x as { jobId?: unknown }).jobId === 'string';
}
/** Loose queued: jobId present, status optional (covers 202 bodies) */
function isFastQueuedLoose(x: unknown): x is FastQueuedLoose {
  return isRecord(x) && typeof (x as { jobId?: unknown }).jobId === 'string';
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
  if (Number.isFinite(asSeconds) && asSeconds >= 0) return clamp(Math.round(asSeconds * 1000), 500, 60_000);

  const asDate = Date.parse(retry);
  if (Number.isFinite(asDate)) {
    const delta = asDate - Date.now();
    if (delta > 0) return clamp(delta, 500, 60_000);
  }
  return fallbackMs;
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                        */
/* -------------------------------------------------------------------------- */

export function useMissionPlanGenerator(missionType: MissionType) {
  const role = useGame((s) => s.role);

  const [jobId, setJobId] = useState<string | null>(null);
  const [missionPlan, setMissionPlan] = useState<EnrichedMissionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<MissionGenerationStatus>('idle');
  const [generationCount, setGenerationCount] = useState(0);

  // Single abort controller slot for the latest network call
  const abortRef = useRef<AbortController | null>(null);

  const generateNewPlan = useCallback(() => {
    setMissionPlan(null);
    setJobId(null);
    setError(null);
    setStatus('idle');
    abortRef.current?.abort();
    setGenerationCount((c) => c + 1); // force refresh path
  }, []);

  /* ---------------- Firestore-first fetch (with optional background refresh) ---------------- */
  useEffect(() => {
    let cancelled = false;
    setError(null);
    setStatus('enqueueing');

    const controller = new AbortController();
    abortRef.current = controller;

    const force = generationCount > 0 ? 1 : 0;
    const url =
      `/api/missions/stream` +
      `?mission=${encodeURIComponent(missionType)}` +
      `&role=${encodeURIComponent(role ?? 'explorer')}` +
      `&maxAgeMs=${DEFAULT_MAX_AGE_MS}` +
      `&force=${force ? 1 : 0}`;

    const enqueueWithRetries = async (): Promise<void> => {
      for (let attempt = 1; attempt <= MAX_ENQUEUE_RETRIES; attempt++) {
        if (cancelled) return;
        const res = await fetch('/api/llm/enqueue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'mission', payload: { missionType, role } }),
          cache: 'no-store',
          signal: controller.signal,
        });

        if (res.status === 202) {
          const data = (await res.json()) as { jobId?: string };
          if (!cancelled && data.jobId) setJobId(data.jobId);
          return;
        }

        if (res.ok) {
          const data = (await res.json()) as unknown;
          if (isRecord(data) && 'result' in data) {
            const plan = extractPlan((data as { result: unknown }).result as PollCompleted['result']);
            if (plan && !cancelled) {
              setMissionPlan(plan);
              setStatus('success');
              return;
            }
          }
          // fallthrough to retry
        } else if (res.status === 503 || res.status === 429) {
          const delay = suggestedRetryDelayMs(res, ENQUEUE_RETRY_DELAY_MS * attempt);
          await sleep(delay);
          continue;
        } else if (res.status >= 400 && res.status < 500) {
          const txt = await res.text();
          if (!cancelled) {
            setError(`Failed to start mission generation (${res.status}): ${txt}`);
            setStatus('error');
          }
          return;
        }

        if (attempt === MAX_ENQUEUE_RETRIES) {
          const txt = await res.text().catch(() => '');
          if (!cancelled) {
            setError(txt || 'Could not start the mission generation.');
            setStatus('error');
          }
          return;
        }
        await sleep(ENQUEUE_RETRY_DELAY_MS * attempt);
      }
    };

    const tryFast = async (): Promise<void> => {
      const res = await fetch(url, { cache: 'no-store', signal: controller.signal });

      // Accept 200 (ready/stale/queued) AND 202 (queued w/out status)
      if (res.status !== 200 && res.status !== 202) {
        await enqueueWithRetries();
        return;
      }

      const data = (await res.json().catch(() => null)) as unknown;

      // 202 loose form: { jobId, plan? }
      if (res.status === 202 && isFastQueuedLoose(data)) {
        if (!cancelled) {
          if (data.plan && isMissionPlan(data.plan)) setMissionPlan(data.plan);
          setJobId(data.jobId);
          setStatus(data.plan ? 'generating' : 'waiting');
        }
        return;
      }

      // 200 structured forms
      if (isFastReady(data)) {
        if (!cancelled) {
          setMissionPlan(data.plan);
          setStatus('success');
          if (data.status === 'stale' && data.jobId) {
            setJobId(data.jobId);
            setStatus('generating'); // background refresh visible
          }
        }
        return;
      }

      if (isFastQueued(data) || isFastQueuedLoose(data)) {
        if (!cancelled) {
          const d = data as FastQueuedLoose;
          if (d.plan && isMissionPlan(d.plan)) setMissionPlan(d.plan);
          setJobId(d.jobId);
          setStatus(d.plan ? 'generating' : 'waiting');
        }
        return;
      }

      // Missing / error / unknown shape → fallback to enqueue
      if (isRecord(data) && data.status === 'error' && typeof (data as { error?: string }).error === 'string') {
        if (!cancelled) {
          setError((data as { error: string }).error);
          setStatus('error');
        }
        return;
      }

      await enqueueWithRetries();
    };

    void tryFast().catch(async () => {
      await enqueueWithRetries();
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [role, missionType, generationCount]);

  /* ------------------------------------------ Polling ------------------------------------- */
  useEffect(() => {
    if (!jobId) return;

    let stopped = false;
    let pollCount = 0;
    let timer: number | null = null;

    const schedule = (ms: number) => {
      const delay = clamp(ms, 1000, 15_000);
      timer = window.setTimeout(poll, delay);
    };

    const poll = async () => {
      if (stopped) return;
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(`/api/llm/enqueue?id=${encodeURIComponent(jobId)}`, {
        signal: controller.signal,
        cache: 'no-store',
      });

      if (res.status === 503 || res.status === 429) {
        setStatus('waiting');
        schedule(suggestedRetryDelayMs(res, 3000));
        return;
      }
      if (res.status === 410) {
        const txt = await res.text().catch(() => '');
        setError(`Job no longer available (410). ${txt}`);
        setStatus('error');
        return;
      }
      if (res.status === 404) {
        setStatus('waiting');
        pollCount += 1;
        schedule(clamp(1500 + pollCount * 500, 1500, 6000));
        return;
      }
      if (!res.ok) {
        pollCount += 1;
        if (pollCount <= 2) {
          schedule(clamp(2000 * pollCount, 2000, 6000));
          return;
        }
        const txt = await res.text().catch(() => '');
        setError(`Polling failed (${res.status}): ${txt}`);
        setStatus('error');
        return;
      }

      const json = (await res.json()) as PollResponse;

      if (json.state === 'completed') {
        const plan = extractPlan(json.result);
        if (!plan) {
          setError('Received an invalid mission plan from the server.');
          setStatus('error');
          return;
        }
        setMissionPlan(plan);
        setStatus('success');
        setJobId(null);
        return;
      }

      if (json.state === 'failed') {
        setError(json.error || 'The mission generation process failed.');
        setStatus('error');
        return;
      }

      setStatus(json.state === 'active' ? 'generating' : 'waiting');
      pollCount += 1;
      const hintedDelay = suggestedRetryDelayMs(res, 2500);
      const expBackoff = clamp(Math.round(2500 * Math.pow(1.25, pollCount)), 1000, 12000);
      schedule(Math.max(hintedDelay, expBackoff));
    };

    void poll().catch((e: unknown) => {
      if (stopped) return;
      setError((e as Error)?.message ?? 'An error occurred while fetching the mission plan.');
      setStatus('error');
    });

    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [jobId]);

  const isLoading = status === 'enqueueing' || status === 'waiting' || status === 'generating';

  return { missionPlan, isLoading, status, error, generateNewPlan };
}
