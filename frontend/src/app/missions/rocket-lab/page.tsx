'use client';

import { useState } from 'react';
import { useMissionPlanGenerator } from '@/hooks/useMissionPlanGenerator';
import type { EnrichedMissionPlan, Img } from '@/types/mission';

import MissionControl from '@/components/MissionControl';
import MissionStandby from '@/components/MissionStandby';
import TopicSelector from '@/components/TopicSelector';
import { Button } from '@/components/ui/button';

type Topic = EnrichedMissionPlan['topics'][number];

// This mission briefing text replaces the old static sidebar
const MISSION_BRIEFING = `Mission briefing received. Your objectives are as follows:
1.  Provide a simple summary of the chosen image.
2.  Identify its key concept (e.g., thrust, staging, aerodynamics).
3.  Ask a "what if" question to test understanding.
4.  Connect it to a real-world mission.
Remember to use the 'Quiz Me' command for self-assessment. Good luck, Commander.`;

/* ---------- helpers ---------- */
function reorderImages(images: Img[] = [], focusIndex: number): Img[] {
  if (images.length === 0) return [];
  const i = Math.max(0, Math.min(focusIndex, images.length - 1));
  return [images[i], ...images.slice(0, i), ...images.slice(i + 1)];
}
function buildContext(topic: Topic, pickedIndex = 0): string {
  const chosen = topic.images?.[pickedIndex];
  const chosenLine = chosen ? `Selected image for analysis: #${pickedIndex + 1} ${chosen.title ?? 'Untitled'}` : '';
  return `Objective: ${topic.title}. ${topic.summary}\n${chosenLine}`;
}

/* ---------- component ---------- */
export default function RocketLabPage() {
  const { missionPlan, isLoading, error, generateNewPlan } = useMissionPlanGenerator();
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);

  const handleSelectTopic = (topic: Topic, imageIndex: number): void => {
    setSelectedTopic(topic);
    setSelectedImageIdx(imageIndex);
  };

  const handleReturnToTopics = (): void => {
    setSelectedTopic(null);
  };

  // RENDER: Loading or Error State
  if (isLoading || error) {
    return (
      <section className="container mx-auto flex flex-col items-center justify-center p-4 text-center min-h-[60vh]">
        <h1 className="font-pixel text-xl text-gold mb-4">🚀 Rocket Lab</h1>
        {error ? (
          <div className="rounded-xl border border-red-600/50 bg-red-900/30 p-4 text-red-200 max-w-md">
            <p className="font-semibold mb-1">Mission Generation Failed</p>
            <p className="text-sm opacity-90 mb-4">{error}</p>
            <Button onClick={generateNewPlan} variant="destructive">Try Again</Button>
          </div>
        ) : (
          <MissionStandby missionName="Generating Mission Plan..." />
        )}
      </section>
    );
  }

  // RENDER: Main Content after loading
  return (
    <section className="container mx-auto px-4 py-8 max-w-6xl">
      {/* --- Header Area with Actions --- */}
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

      {/* --- Conditional Content Area --- */}
      {selectedTopic && missionPlan ? (
        // STATE: Topic has been selected -> Show Mission Control
        <MissionControl
          key={`${selectedTopic.title}-${selectedImageIdx}`}
          mission={selectedTopic.title}
          images={reorderImages(selectedTopic.images as Img[] | undefined, selectedImageIdx)}
          context={buildContext(selectedTopic, selectedImageIdx)}
          initialMessage={{
            id: 'stella-briefing',
            role: 'stella',
            text: MISSION_BRIEFING,
          }}
        />
      ) : (
        // STATE: No topic selected yet -> Show Topic Selector
        missionPlan && <TopicSelector plan={missionPlan} onSelect={handleSelectTopic} />
      )}
    </section>
  );
}