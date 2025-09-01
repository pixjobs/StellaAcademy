'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMissionPlanGenerator } from '@/hooks/useMissionPlanGenerator';
import type { EnrichedMissionPlan, Img } from '@/types/mission';

import MissionControl from '@/components/MissionControl';
import MissionStandby from '@/components/MissionStandby';
import TopicSelector from '@/components/TopicSelector';
import { Button } from '@/components/ui/button';

type Topic = EnrichedMissionPlan['topics'][number];

// Poster-specific briefing
const MISSION_BRIEFING = `Welcome to Space Poster Studio.
Your mission:
1) Write a catchy title.
2) Add a 1–2 line caption kids can understand.
3) Give one fun fact.
4) Suggest a color palette (2–3 colors).
Use “Quiz Me” to check understanding. Let’s design something stellar!`;

/* ---------- helpers ---------- */
function reorderImages(images: Img[] | undefined, focusIndex: number): Img[] {
  const list = images ?? [];
  if (list.length === 0) return [];
  const i = Math.max(0, Math.min(focusIndex, list.length - 1));
  return [list[i], ...list.slice(0, i), ...list.slice(i + 1)];
}

function buildContext(topic: Topic, pickedIndex = 0): string {
  const chosen = (topic?.images?.[pickedIndex] as Img | undefined);
  const chosenLine = chosen
    ? `Selected poster base: #${pickedIndex + 1} ${chosen.title ?? 'Untitled'}`
    : '';
  // Keep context short—MissionControl will pass this to the LLM
  return `Poster Theme: ${topic?.title ?? 'Untitled'}. ${topic?.summary ?? ''}\n${chosenLine}`.trim();
}

/* ---------- page ---------- */
export default function SpacePosterPage() {
  // Ask worker for a poster-friendly plan (remove arg if your hook doesn't accept it)
  const { missionPlan, isLoading, error, generateNewPlan } = useMissionPlanGenerator('space-poster');

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);

  // Prevent duplicate composers in dev StrictMode by ensuring only one control mount
  const showMissionControl = useMemo(
    () => Boolean(selectedTopic && missionPlan && !isLoading && !error),
    [selectedTopic, missionPlan, isLoading, error]
  );

  const handleSelectTopic = useCallback((topic: Topic, imageIndex: number) => {
    setSelectedTopic(topic);
    setSelectedImageIdx(imageIndex ?? 0);
  }, []);

  const handleReturnToTopics = useCallback(() => setSelectedTopic(null), []);

  // Loading / Error state
  if (isLoading || error) {
    return (
      <section className="container mx-auto flex flex-col items-center justify-center p-4 text-center min-h-[60vh]">
        <h1 className="font-pixel text-xl text-gold mb-4">🌌 Space Poster Studio</h1>
        {error ? (
          <div className="rounded-xl border border-red-600/50 bg-red-900/30 p-4 text-red-200 max-w-md">
            <p className="font-semibold mb-1">Poster Plan Failed</p>
            <p className="text-sm opacity-90 mb-4">{String(error)}</p>
            <Button onClick={generateNewPlan} variant="destructive">Try Again</Button>
          </div>
        ) : (
          <MissionStandby missionName="Gathering Space Images..." />
        )}
      </section>
    );
  }

  // Main content
  return (
    <section className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-pixel text-xl text-gold mb-1">🌌 Space Poster Studio</h1>
          {selectedTopic && (
            <h2 className="text-lg text-sky-400">Theme: {selectedTopic.title}</h2>
          )}
        </div>
        <div className="flex gap-2">
          {selectedTopic && (
            <Button onClick={handleReturnToTopics} variant="outline">Change Theme</Button>
          )}
          <Button onClick={generateNewPlan}>New Poster Plan</Button>
        </div>
      </div>

      {/* Topic selector or MissionControl (mutually exclusive by showMissionControl) */}
      {showMissionControl ? (
        <MissionControl
          // Keep key stable per topic to avoid double-mounts
          key={selectedTopic?.title ?? 'poster-topic'}
          mission={selectedTopic?.title ?? 'Untitled'}
          images={reorderImages(selectedTopic?.images as Img[] | undefined, selectedImageIdx)}
          context={buildContext(selectedTopic as Topic, selectedImageIdx)}
          initialMessage={{ id: 'stella-poster-briefing', role: 'stella', text: MISSION_BRIEFING }}
        />
      ) : (
        missionPlan && (
          <TopicSelector plan={missionPlan} onSelect={handleSelectTopic} />
        )
      )}
    </section>
  );
}