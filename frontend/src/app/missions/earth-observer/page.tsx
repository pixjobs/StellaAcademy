'use client';

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useMissionPlanGenerator } from '@/hooks/useMissionPlanGenerator';
import { useGame } from '@/lib/store'; // ← role from global store
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
  starterMessages: Array<{ role: 'user' | 'assistant' | 'system'; text: string }>;
  difficulty?: string;
};

/* -------------------------------------------------------------------------- */
/*                             Mission copy & helpers                         */
/* -------------------------------------------------------------------------- */

const DEFAULT_BRIEFING = `Welcome, Observer.
Your mission is to analyze these images of Earth from deep space.
1) Describe the major weather patterns or geographical features you see.
2) Ask about the time of day or season for a specific region.
3) Inquire about the technology behind the DSCOVR satellite or its orbit.
Use "Quiz Me" to test your observations. Let's begin the analysis.`;

// Reorder images so the selected one is first
function reorderImages(images: Img[], focusIndex: number): Img[] {
  if (images.length === 0) return [];
  const i = Math.max(0, Math.min(focusIndex, images.length - 1));
  return [images[i], ...images.slice(0, i), ...images.slice(i + 1)];
}

function buildContext(topic: CleanTopic, pickedIndex = 0): string {
  const chosen = topic.images[pickedIndex];
  const chosenLine = `Selected image for analysis: #${pickedIndex + 1} - ${chosen.title}`;
  return `Mission: ${topic.title}. ${topic.summary}\n${chosenLine}`.trim();
}

/* ----------------------------- Preflight helpers ------------------------- */

// POST → /api/preFlight and return jobId
async function startPreflight(payload: {
  mission: string;          // 'earth-observer'
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

    if (data.state === 'completed') return data.result as TutorPreflightResult;
    if (data.state === 'failed') throw new Error(data?.error || 'Preflight job failed.');
    if (Date.now() - started > timeoutMs) throw new Error('Preflight timed out.');
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/* -------------------------------------------------------------------------- */
/*                               Page Component                               */
/* -------------------------------------------------------------------------- */

export default function EarthObserverPage() {
  const { role = 'explorer' } = useGame(); // explorer|cadet|scholar

  const { missionPlan, isLoading, error, generateNewPlan } =
    useMissionPlanGenerator('earth-observer');

  // Clean plan with strict images
  const cleanMissionPlan = useMemo(() => {
    if (!missionPlan) return null;
    return {
      ...missionPlan,
      topics: missionPlan.topics.map((topic): CleanTopic => ({
        ...topic,
        images: (topic.images || [])
          .map((img) => ({
            title: img.title ?? 'Untitled Earth View',
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
  const lastRequestedRef = useRef<string | null>(null); // race-guard

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

  // Kick off preflight whenever a topic/image/role changes
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
          mission: 'earth-observer',
          topicTitle: selectedTopic.title,
          topicSummary: selectedTopic.summary,
          imageTitle,
          role,
        });

        const result = await waitForPreflight(jobId);

        // Favor the first assistant/system message; fall back to first entry; then default text
        const assistantFirst =
          result.starterMessages.find((m) => m.role === 'assistant') ||
          result.starterMessages.find((m) => m.role === 'system') ||
          result.starterMessages[0];

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
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopic, selectedImageIdx, role]);

  /* ---------------------------- Render states ---------------------------- */

  if (isLoading || error) {
    return (
      <section className="container mx-auto flex flex-col items-center justify-center p-4 text-center min-h-[60vh]">
        <h1 className="font-pixel text-xl text-gold mb-4">🌍 Earth Observer</h1>
        {error ? (
          <div className="rounded-xl border border-red-600/50 bg-red-900/30 p-4 text-red-200 max-w-md">
            <p className="font-semibold mb-1">Mission Plan Failed</p>
            <p className="text-sm opacity-90 mb-4">{String(error)}</p>
            <Button onClick={generateNewPlan} variant="destructive">Try Again</Button>
          </div>
        ) : (
          <MissionStandby missionName="Acquiring Satellite Imagery..." />
        )}
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-pixel text-xl text-gold mb-1">🌍 Earth Observer</h1>
          {selectedTopic && (
            <h2 className="text-lg text-sky-400">Target: {selectedTopic.title}</h2>
          )}
        </div>
        <div className="flex gap-2">
          {selectedTopic && (
            <Button onClick={handleReturnToTopics} variant="outline">Return to Selection</Button>
          )}
          <Button onClick={generateNewPlan}>New Imagery</Button>
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
              <Button onClick={handleReturnToTopics} variant="outline">Back to Targets</Button>
            </div>
          </div>
        ) : (
          <MissionControl
            key={`${selectedTopic.title}-${selectedImageIdx}`}
            mission={selectedTopic.title}
            images={reorderImages(selectedTopic.images, selectedImageIdx)}
            context={buildContext(selectedTopic, selectedImageIdx)}
            initialMessage={{
              id: 'stella-earth-briefing',
              role: 'stella',
              text: preflightBriefing ?? DEFAULT_BRIEFING,
            }}
          />
        )
      ) : (
        cleanMissionPlan && (
          <TopicSelector plan={cleanMissionPlan} onSelect={handleSelectTopic} />
        )
      )}
    </section>
  );
}
