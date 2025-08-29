// /app/missions/rocket-lab/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/lib/store';
import type { EnrichedMissionPlan } from '@/types/mission';

import MissionControl from '@/components/MissionControl';
import MissionStandby from '@/components/MissionStandby';
import TopicSelector from '@/components/TopicSelector';

type Topic = EnrichedMissionPlan['topics'][number];

export default function RocketLabPage() {
  const role = useGame((s) => s.role);

  const [jobId, setJobId] = useState<string | null>(null);
  const [missionPlan, setMissionPlan] = useState<EnrichedMissionPlan | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Enqueue on role change
  useEffect(() => {
    let cancelled = false;
    setMissionPlan(null);
    setSelectedTopic(null);
    setError(null);
    setJobId(null);

    async function enqueue() {
      try {
        const res = await fetch('/api/generate-mission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ missionType: 'rocket-lab', role }),
        });

        // If your API ever serves a cached mission directly (200),
        // handle that too (not strictly needed if it always returns 202).
        if (res.status === 200) {
          const data = await res.json();
          setMissionPlan(data as EnrichedMissionPlan);
          return;
        }

        if (res.status !== 202) {
          const txt = await res.text();
          throw new Error(`Enqueue failed (${res.status}): ${txt}`);
        }

        const data = (await res.json()) as { jobId: string };
        if (!data?.jobId) throw new Error('No jobId returned from enqueue');
        if (!cancelled) setJobId(data.jobId);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }

    enqueue();
    return () => {
      cancelled = true;
      // cancel any pending poll
      abortRef.current?.abort();
    };
  }, [role]);

  // Poll for result when jobId is set
  useEffect(() => {
    if (!jobId || missionPlan) return;

    let stopped = false;
    let attempt = 0;

    const poll = async () => {
      if (stopped) return;
      attempt += 1;

      // New controller per poll to allow cancel on unmount
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const res = await fetch(`/api/llm/enqueue?id=${encodeURIComponent(jobId)}`, {
          signal: ac.signal,
          headers: { 'Accept': 'application/json' },
        });

        if (!res.ok) {
          // If 404 (job not found) or 500 (failed), surface it
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || `Polling error (${res.status})`);
        }

        const json: {
          state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
          progress?: number;
          result?: { type?: string; result?: EnrichedMissionPlan } | EnrichedMissionPlan;
        } = await res.json();

        if (json.state === 'completed') {
          // The unified endpoint returns { result: { type, result } }.
          // Our mission-specific GET unwraps to { result: EnrichedMissionPlan }.
          const maybePlan =
            (json.result && 'topics' in (json.result as any))
              ? (json.result as EnrichedMissionPlan)
              : (json.result && typeof json.result === 'object' && 'result' in json.result
                  ? (json.result as any).result as EnrichedMissionPlan
                  : null);

          if (!maybePlan) throw new Error('Completed without mission result');
          setMissionPlan(maybePlan);
          return;
        }

        // Backoff between polls: 500ms → 1s → 2s (cap at 2s)
        const delay = Math.min(2000, 500 * Math.pow(2, Math.max(0, attempt - 1)));
        setTimeout(poll, delay);
      } catch (e) {
        if (stopped) return;
        setError((e as Error).message);
        // retry after a short pause unless aborted
        setTimeout(() => {
          if (!stopped) poll();
        }, 1500);
      }
    };

    poll();

    return () => {
      stopped = true;
      abortRef.current?.abort();
    };
  }, [jobId, missionPlan]);

  const handleSelectTopic = (topic: Topic) => setSelectedTopic(topic);

  // Loading / error UI
  if (!missionPlan) {
    return (
      <section className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="font-pixel text-xl text-gold mb-4">🚀 Rocket Lab</h1>
        {error ? (
          <div className="rounded-xl border border-red-600/50 bg-red-900/30 p-4 text-red-200">
            <p className="font-semibold mb-1">Mission queue error</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        ) : (
          <MissionStandby missionName="Generating Mission" />
        )}
      </section>
    );
  }

  if (selectedTopic) {
    return (
      <section className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="font-pixel text-xl text-gold mb-1">🚀 Rocket Lab</h1>
        <h2 className="text-lg text-sky mb-4">Objective: {selectedTopic.title}</h2>
        <MissionControl
          key={selectedTopic.title}
          mission={selectedTopic.title}
          images={selectedTopic.images}
          context={`Student is learning about: ${selectedTopic.title}. ${selectedTopic.summary}`}
        />
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="font-pixel text-xl text-gold mb-4">🚀 Rocket Lab</h1>
      <TopicSelector plan={missionPlan} onSelectTopic={handleSelectTopic} />
    </section>
  );
}
