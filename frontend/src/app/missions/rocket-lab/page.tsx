'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useMissionPlanGenerator } from '@/hooks/useMissionPlanGenerator';
import { useGame } from '@/lib/store';
import type { EnrichedMissionPlan, Img } from '@/types/mission';

import MissionControl from '@/components/MissionControl';
import MissionStandby from '@/components/MissionStandby';
import TopicSelector from '@/components/TopicSelector';
import { Button } from '@/components/ui/button';

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type TopicFromHook = EnrichedMissionPlan['topics'][number];
type CleanTopic = Omit<TopicFromHook, 'images'> & { images: Img[] };

type TutorPreflightResult = {
  systemPrompt: string;
  starterMessages: Array<{ id: string; role: 'stella' | 'user'; text: string }>;
  warmupQuestion: string;
  goalSuggestions: string[];
  difficultyHints: {
    easy: string;
    standard: string;
    challenge: string;
  };
};

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_BRIEFING = `Welcome to the Rocket Lab.
Your mission is to analyze the provided technical data.
1) Review the specifications for the selected component.
2) Ask about its function or how it integrates with other systems.
3) Inquire about the materials used or its performance metrics.
Use “Quiz Me” to test your knowledge. Let's begin the analysis.`;

function reorderImages(images: Img[], focusIndex: number): Img[] {
  if (!images || images.length === 0) return [];
  const i = Math.max(0, Math.min(focusIndex, images.length - 1));
  return [images[i], ...images.slice(0, i), ...images.slice(i + 1)];
}

function buildContext(topic: CleanTopic, pickedIndex = 0): string {
  const chosen = topic.images?.[pickedIndex];
  const chosenLine = chosen
    ? `\nSelected image for analysis: #${pickedIndex + 1} - ${chosen.title}`
    : '';
  return `Objective: ${topic.title}. ${topic.summary}${chosenLine}`.trim();
}

async function startPreflight(payload: {
  mission: string;
  topicTitle: string;
  topicSummary: string;
  imageTitle?: string;
  role: 'explorer' | 'cadet' | 'scholar';
}): Promise<TutorPreflightResult | string> {
  const res = await fetch('/api/llm/enqueue', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'tutor-preflight', payload }),
  });

  const data = await res.json();
  if (res.ok && data.state === 'completed') {
    return data.result.result as TutorPreflightResult;
  }
  if (res.status === 202 && data.jobId) {
    return data.jobId as string;
  }
  throw new Error(data?.error || 'Failed to enqueue preflight.');
}

async function waitForPreflight(jobId: string, { timeoutMs = 45_000, intervalMs = 1500 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const res = await fetch(`/api/llm/enqueue?id=${encodeURIComponent(jobId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Preflight status error.');
    if (data.state === 'completed') {
      return data.result.result as TutorPreflightResult;
    }
    if (data.state === 'failed') {
      throw new Error(data?.error || 'Preflight job failed.');
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Preflight timed out.');
}

function isValidPreflightResult(data: unknown): data is TutorPreflightResult {
  if (typeof data !== 'object' || data === null) return false;
  const result = data as TutorPreflightResult;
  return (
    typeof result.systemPrompt === 'string' &&
    Array.isArray(result.starterMessages) &&
    typeof result.warmupQuestion === 'string'
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export default function RocketLabPage() {
  const { role = 'explorer' } = useGame();
  const { missionPlan, isLoading, error, generateNewPlan } = useMissionPlanGenerator('rocket-lab');

  const cleanMissionPlan = useMemo(() => {
    if (!missionPlan) return null;
    return {
      ...missionPlan,
      topics: missionPlan.topics.map((topic): CleanTopic => ({
        ...topic,
        images: (topic.images || [])
          .map((img) => ({ title: img.title ?? 'Untitled Image', href: img.href ?? '' }))
          .filter((img) => img.href),
      })),
    };
  }, [missionPlan]);

  const [selectedTopic, setSelectedTopic] = useState<CleanTopic | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  const [preflightLoading, setPreflightLoading] = useState(false);
  const [preflightError, setPreflightError] = useState<string | null>(null);
  const [preflightBriefing, setPreflightBriefing] = useState<string | null>(null);
  const lastRequestedRef = useRef<string | null>(null);

  const handleSelectTopic = useCallback((topic: CleanTopic, imageIndex: number) => {
    setSelectedTopic(topic);
    setSelectedImageIdx(Math.max(0, imageIndex));
  }, []);

  const handleReturnToTopics = useCallback(() => {
    setSelectedTopic(null);
    setPreflightLoading(false);
    setPreflightError(null);
    setPreflightBriefing(null);
    lastRequestedRef.current = null;
  }, []);

  useEffect(() => {
    if (!selectedTopic) return;

    const imageTitle = selectedTopic.images?.[selectedImageIdx]?.title;
    const reqKey = `${selectedTopic.title}::${imageTitle ?? 'no-image'}::${role}`;
    lastRequestedRef.current = reqKey;

    setPreflightLoading(true);
    setPreflightError(null);
    setPreflightBriefing(null);

    const runPreflight = async () => {
      try {
        const resultOrJobId = await startPreflight({
          mission: 'rocket-lab',
          topicTitle: selectedTopic.title,
          topicSummary: selectedTopic.summary,
          imageTitle,
          role,
        });

        let finalResult: TutorPreflightResult;
        if (typeof resultOrJobId === 'string') {
          finalResult = await waitForPreflight(resultOrJobId);
        } else {
          finalResult = resultOrJobId;
        }

        if (!isValidPreflightResult(finalResult)) {
          console.error("Invalid preflight data received from worker:", finalResult);
          throw new Error("Worker returned incomplete or malformed preflight data.");
        }

        // ===== THE FIX IS HERE =====
        // Changed `result` to the correctly named `finalResult` variable.
        const assistantFirst = finalResult.starterMessages.find((m) => m.role === 'stella') || finalResult.starterMessages[0];
        const briefingText = assistantFirst?.text?.trim() || DEFAULT_BRIEFING;

        if (lastRequestedRef.current === reqKey) {
          setPreflightBriefing(briefingText);
          setPreflightLoading(false);
        }
      } catch (e: unknown) {
        if (lastRequestedRef.current === reqKey) {
          setPreflightError(String((e as Error)?.message || e));
          setPreflightLoading(false);
        }
      }
    };

    runPreflight();
  }, [selectedTopic, selectedImageIdx, role]);

  if (isLoading || error) {
    return (
      <section className="container mx-auto flex flex-col items-center justify-center p-4 text-center min-h-[60vh]">
        <h1 className="font-pixel text-xl text-gold mb-4">🚀 Rocket Lab</h1>
        {error ? (
          <div className="rounded-xl border border-red-600/50 bg-red-900/30 p-4 text-red-200 max-w-md">
            <p className="font-semibold mb-1">Mission Generation Failed</p>
            <p className="text-sm opacity-90 mb-4">{String(error)}</p>
            <Button onClick={generateNewPlan} variant="destructive">Try Again</Button>
          </div>
        ) : (
          <MissionStandby missionName="Generating Mission Plan..." />
        )}
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-pixel text-xl text-gold mb-1">🚀 Rocket Lab</h1>
          {selectedTopic && <h2 className="text-lg text-sky-400">Objective: {selectedTopic.title}</h2>}
        </div>
        <div className="flex gap-2">
          {selectedTopic && <Button onClick={handleReturnToTopics} variant="outline">Change Topic</Button>}
          <Button onClick={generateNewPlan}>Generate New Mission</Button>
        </div>
      </div>

      {selectedTopic ? (
        preflightLoading ? (
          <MissionStandby missionName="Preparing Mission Briefing..." />
        ) : preflightError ? (
          <div className="rounded-xl border border-red-600/50 bg-red-900/30 p-4 text-red-200 max-w-xl">
            <p className="font-semibold mb-1">Preflight Failed</p>
            <p className="text-sm opacity-90 mb-3">{preflightError}</p>
            <div className="flex gap-2">
              <Button onClick={() => setSelectedTopic((t) => (t ? { ...t } : t))} variant="secondary">Retry</Button>
              <Button onClick={handleReturnToTopics} variant="outline">Back to Topics</Button>
            </div>
          </div>
        ) : (
          <MissionControl
            key={`${selectedTopic.title}-${selectedTopic.images?.[selectedImageIdx]?.href ?? 'no-image'}`}
            mission={selectedTopic.title}
            images={reorderImages(selectedTopic.images, selectedImageIdx)}
            context={buildContext(selectedTopic, selectedImageIdx)}
            initialMessage={{
              id: 'stella-briefing',
              role: 'stella',
              text: preflightBriefing ?? DEFAULT_BRIEFING,
            }}
          />
        )
      ) : (
        cleanMissionPlan && <TopicSelector plan={cleanMissionPlan} onSelect={handleSelectTopic} />
      )}
    </section>
  );
}