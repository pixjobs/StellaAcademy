'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useMissionPlanGenerator } from '@/hooks/useMissionPlanGenerator';
import { useGame } from '@/lib/store'; // ← get the role the user picked on Home
import type { EnrichedMissionPlan, Img } from '@/types/mission';

import MissionControl from '@/components/MissionControl';
import MissionStandby from '@/components/MissionStandby';
import TopicSelector from '@/components/TopicSelector';
import { Button } from '@/components/ui/button';

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

// This pattern ensures data integrity before it's used in state or components.
type TopicFromHook = EnrichedMissionPlan['topics'][number];
// A stricter "clean" type that guarantees the images array is present and valid.
type CleanTopic = Omit<TopicFromHook, 'images'> & { images: Img[] };

// Preflight result (matches worker’s `tutor-preflight` result)
type TutorPreflightResult = {
  systemPrompt: string;
  starterMessages: Array<{ role: 'user' | 'assistant' | 'system'; text: string }>;
  difficulty?: 'explorer' | 'cadet' | 'scholar' | string;
};

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function reorderImages(images: Img[], focusIndex: number): Img[] {
  if (images.length === 0) return [];
  const i = Math.max(0, Math.min(focusIndex, images.length - 1));
  return [images[i], ...images.slice(0, i), ...images.slice(i + 1)];
}

function buildContext(topic: CleanTopic, pickedIndex = 0): string {
  const chosen = topic.images[pickedIndex];
  const chosenLine = `Selected image for analysis: #${pickedIndex + 1} - ${chosen.title}`;
  return `Objective: ${topic.title}. ${topic.summary}\n${chosenLine}`.trim();
}

// POST → /api/preFlight and return jobId
async function startPreflight(payload: {
  mission: string;
  topicTitle: string;
  topicSummary: string;
  imageTitle?: string;
  role: 'explorer' | 'cadet' | 'scholar';
}) {
  const res = await fetch('/api/preFlight', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to enqueue preflight.');
  return data.jobId as string;
}

// Poll GET → /api/preFlight?id=... until completed/failed
async function waitForPreflight(jobId: string, { timeoutMs = 25_000, intervalMs = 700 } = {}) {
  const started = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await fetch(`/api/preFlight?id=${encodeURIComponent(jobId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Preflight status error.');

    if (data.state === 'completed') {
      return data.result as TutorPreflightResult;
    }
    if (data.state === 'failed') {
      throw new Error(data?.error || 'Preflight job failed.');
    }
    if (Date.now() - started > timeoutMs) {
      throw new Error('Preflight timed out.');
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export default function RocketLabPage() {
  // Role from global store (Explorer/Cadet/Scholar)
  const { role = 'explorer' } = useGame();

  // Generate the topic/mission plan as before
  const { missionPlan, isLoading, error, generateNewPlan } = useMissionPlanGenerator('rocket-lab');

  const cleanMissionPlan = useMemo(() => {
    if (!missionPlan) return null;
    return {
      ...missionPlan,
      topics: missionPlan.topics.map((topic): CleanTopic => ({
        ...topic,
        images: (topic.images || [])
          .map((img) => ({
            title: img.title ?? 'Untitled Image',
            href: img.href ?? '',
          }))
          .filter((img) => img.href),
      })),
    };
  }, [missionPlan]);

  // UI state
  const [selectedTopic, setSelectedTopic] = useState<CleanTopic | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);

  // Preflight state
  const [preflightLoading, setPreflightLoading] = useState(false);
  const [preflightError, setPreflightError] = useState<string | null>(null);
  const [preflightBriefing, setPreflightBriefing] = useState<string | null>(null);
  const lastRequestedRef = useRef<string | null>(null); // prevent race conditions

  const handleSelectTopic = useCallback((topic: CleanTopic, imageIndex: number) => {
    setSelectedTopic(topic);
    setSelectedImageIdx(imageIndex);
  }, []);

  const handleReturnToTopics = useCallback(() => {
    setSelectedTopic(null);
    // reset preflight state
    setPreflightLoading(false);
    setPreflightError(null);
    setPreflightBriefing(null);
    lastRequestedRef.current = null;
  }, []);

  // Kick off preflight whenever a topic is selected
  useEffect(() => {
    if (!selectedTopic) return;

    const imageTitle = selectedTopic.images[selectedImageIdx]?.title || undefined;
    const reqKey = `${selectedTopic.title}::${imageTitle}::${role}`;
    lastRequestedRef.current = reqKey;

    setPreflightLoading(true);
    setPreflightError(null);
    setPreflightBriefing(null);

    (async () => {
      try {
        const jobId = await startPreflight({
          mission: 'rocket-lab',
          topicTitle: selectedTopic.title,
          topicSummary: selectedTopic.summary,
          imageTitle,
          role,
        });

        const result = await waitForPreflight(jobId);

        // Build a single Markdown “briefing” out of starter messages
        // Prefer the first assistant/system message if present
        const assistantFirst =
          result.starterMessages.find((m) => m.role === 'assistant') ||
          result.starterMessages.find((m) => m.role === 'system') ||
          result.starterMessages[0];

        const briefingText =
          assistantFirst?.text?.trim() ||
          'Mission briefing ready. Choose a task to begin.';

        // prevent setting state if a newer request superseded this one
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
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopic, selectedImageIdx, role]);

  // RENDER: Loading or Error State for plan generation
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

  // RENDER: Main Content
  return (
    <section className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-pixel text-xl text-gold mb-1">🚀 Rocket Lab</h1>
          {selectedTopic && (
            <h2 className="text-lg text-sky-400">Objective: {selectedTopic.title}</h2>
          )}
        </div>
        <div className="flex gap-2">
          {selectedTopic && (
            <Button onClick={handleReturnToTopics} variant="outline">Change Topic</Button>
          )}
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
              <Button
                onClick={() => {
                  // retrigger by re-setting the same selection
                  setSelectedTopic((t) => (t ? { ...t } : t));
                }}
                variant="secondary"
              >
                Retry
              </Button>
              <Button onClick={handleReturnToTopics} variant="outline">Back to Topics</Button>
            </div>
          </div>
        ) : (
          <MissionControl
            key={`${selectedTopic.title}-${selectedImageIdx}`}
            mission={selectedTopic.title}
            images={reorderImages(selectedTopic.images, selectedImageIdx)}
            context={buildContext(selectedTopic, selectedImageIdx)}
            initialMessage={{
              id: 'stella-briefing',
              role: 'stella',
              text: preflightBriefing ?? 'Mission briefing ready.',
            }}
          />
        )
      ) : (
        cleanMissionPlan && <TopicSelector plan={cleanMissionPlan} onSelect={handleSelectTopic} />
      )}
    </section>
  );
}
