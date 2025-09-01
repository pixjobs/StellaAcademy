'use client';

import { useState } from 'react';
import { useMissionPlanGenerator } from '@/hooks/useMissionPlanGenerator'; // accepts optional missionType
import type { EnrichedMissionPlan, Img } from '@/types/mission';

import MissionControl from '@/components/MissionControl';
import MissionStandby from '@/components/MissionStandby';
import TopicSelector from '@/components/TopicSelector';
import { Button } from '@/components/ui/button';

type Topic = EnrichedMissionPlan['topics'][number];

// Rover-specific briefing
const MISSION_BRIEFING = `Welcome to Rover Cam.
Your objectives:
1) Give a simple summary of the chosen rover image.
2) Name the key concept (camera, terrain, or instrument).
3) Ask a “what if” question about what you see.
4) Link it to a real rover mission milestone.
Use “Quiz Me” to test yourself. Good luck, Explorer!`;

/* ---------- helpers (reused) ---------- */
function reorderImages(images: Img[] = [], focusIndex: number): Img[] {
  if (!images || images.length === 0) return [];
  const i = Math.max(0, Math.min(focusIndex, images.length - 1));
  return [images[i], ...images.slice(0, i), ...images.slice(i + 1)];
}
function buildContext(topic: Topic, pickedIndex = 0): string {
  const chosen = topic.images?.[pickedIndex] as Img | undefined;
  const chosenLine = chosen
    ? `Selected image for analysis: #${pickedIndex + 1} ${chosen.title ?? 'Untitled'}`
    : '';
  return `Objective: ${topic.title}. ${topic.summary}\n${chosenLine}`;
}

/* ---------- component ---------- */
export default function RoverCamPage() {
  // If your hook signature is useMissionPlanGenerator(missionType?: string), this passes 'rover-cam'.
  // If not, remove the argument.
  const { missionPlan, isLoading, error, generateNewPlan } = useMissionPlanGenerator('rover-cam');

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);

  const handleSelectTopic = (topic: Topic, imageIndex: number): void => {
    setSelectedTopic(topic);
    setSelectedImageIdx(imageIndex);
  };


  const handleReturnToTopics = (): void => {
    setSelectedTopic(null);
  };

  // Loading / Error state (reused)
  if (isLoading || error) {
    return (
      <section className="container mx-auto flex flex-col items-center justify-center p-4 text-center min-h-[60vh]">
        <h1 className="font-pixel text-xl text-gold mb-4">🛰️ Rover Cam</h1>
        {error ? (
          <div className="rounded-xl border border-red-600/50 bg-red-900/30 p-4 text-red-200 max-w-md">
            <p className="font-semibold mb-1">Mission Generation Failed</p>
            <p className="text-sm opacity-90 mb-4">{error}</p>
            <Button onClick={generateNewPlan} variant="destructive">Try Again</Button>
          </div>
        ) : (
          <MissionStandby missionName="Fetching Rover Feeds..." />
        )}
      </section>
    );
  }

  // Main content (reused)
  return (
    <section className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-pixel text-xl text-gold mb-1">🛰️ Rover Cam</h1>
          {selectedTopic && (
            <h2 className="text-lg text-sky-400">Objective: {selectedTopic.title}</h2>
          )}
        </div>
        <div className="flex gap-2">
          {selectedTopic && (
            <Button onClick={handleReturnToTopics} variant="outline">Change Topic</Button>
          )}
          <Button onClick={generateNewPlan}>New Rover Plan</Button>
        </div>
      </div>

      {/* Topic selector or MissionControl */}
      {selectedTopic && missionPlan ? (
        <MissionControl
          key={`${selectedTopic.title}-${selectedImageIdx}`}
          mission={selectedTopic.title}
          images={reorderImages((selectedTopic.images as unknown as Img[] | undefined) ?? [], selectedImageIdx)}
          context={buildContext(selectedTopic, selectedImageIdx)}
          initialMessage={{
            id: 'stella-rover-briefing',
            role: 'stella',
            text: MISSION_BRIEFING,
          }}
        />
      ) : (
        missionPlan && (
          <TopicSelector
            plan={missionPlan}
            onSelect={handleSelectTopic}
          />
        )
      )}
    </section>
  );
}
