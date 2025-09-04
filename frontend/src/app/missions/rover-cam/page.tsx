'use client';

import { useState, useMemo, useCallback } from 'react';
import { useMissionPlanGenerator } from '@/hooks/useMissionPlanGenerator';
// Import the canonical types from their central locations.
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

/* -------------------------------------------------------------------------- */
/*                                Configuration                               */
/* -------------------------------------------------------------------------- */

const MISSION_BRIEFING = `Welcome to Rover Cam.
Your objectives:
1) Give a simple summary of the chosen rover image.
2) Name the key concept (camera, terrain, or instrument).
3) Ask a “what if” question about what you see.
4) Link it to a real rover mission milestone.
Use “Quiz Me” to test yourself. Good luck, Explorer!`;

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

// These helpers can now safely assume they receive clean, validated data.
function reorderImages(images: Img[], focusIndex: number): Img[] {
  if (images.length === 0) return [];
  const i = Math.max(0, Math.min(focusIndex, images.length - 1));
  return [images[i], ...images.slice(0, i), ...images.slice(i + 1)];
}

function buildContext(topic: CleanTopic, pickedIndex = 0): string {
  const chosen = topic.images[pickedIndex];
  // No more optional chaining or casting is needed here.
  const chosenLine = `Selected image for analysis: #${pickedIndex + 1} - ${chosen.title}`;
  return `Objective: ${topic.title}. ${topic.summary}\n${chosenLine}`.trim();
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export default function RoverCamPage() {
  // The hook is already called correctly with the required 'rover-cam' mission type.
  const { missionPlan, isLoading, error, generateNewPlan } = useMissionPlanGenerator('rover-cam');

  // --- DATA NORMALIZATION ---
  // We introduce the robust data cleaning step.
  const cleanMissionPlan = useMemo(() => {
    if (!missionPlan) return null;
    return {
      ...missionPlan,
      topics: missionPlan.topics.map((topic): CleanTopic => ({
        ...topic,
        // Normalize the images array: provide defaults and filter out invalid entries.
        images: (topic.images || [])
          .map(img => ({
            title: img.title ?? 'Untitled Rover Image',
            href: img.href ?? '',
          }))
          .filter(img => img.href), // Ensure every image has a valid URL.
      })),
    };
  }, [missionPlan]);

  // All component state will now use our clean, strict `CleanTopic` type.
  const [selectedTopic, setSelectedTopic] = useState<CleanTopic | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);

  const handleSelectTopic = useCallback((topic: CleanTopic, imageIndex: number) => {
    setSelectedTopic(topic);
    setSelectedImageIdx(imageIndex);
  }, []);

  const handleReturnToTopics = useCallback(() => {
    setSelectedTopic(null);
  }, []);

  // RENDER: Loading or Error State
  if (isLoading || error) {
    return (
      <section className="container mx-auto flex flex-col items-center justify-center p-4 text-center min-h-[60vh]">
        <h1 className="font-pixel text-xl text-gold mb-4">🛰️ Rover Cam</h1>
        {error ? (
          <div className="rounded-xl border border-red-600/50 bg-red-900/30 p-4 text-red-200 max-w-md">
            <p className="font-semibold mb-1">Mission Generation Failed</p>
            <p className="text-sm opacity-90 mb-4">{String(error)}</p>
            <Button onClick={generateNewPlan} variant="destructive">Try Again</Button>
          </div>
        ) : (
          <MissionStandby missionName="Fetching Rover Feeds..." />
        )}
      </section>
    );
  }

  // RENDER: Main Content
  return (
    <section className="container mx-auto px-4 py-8 max-w-6xl">
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

      {selectedTopic ? (
        // STATE: Topic selected -> Show Mission Control
        <MissionControl
          key={`${selectedTopic.title}-${selectedImageIdx}`}
          mission={selectedTopic.title}
          // The data passed here is now guaranteed to be clean. The ugly cast is gone.
          images={reorderImages(selectedTopic.images, selectedImageIdx)}
          context={buildContext(selectedTopic, selectedImageIdx)}
          initialMessage={{
            id: 'stella-rover-briefing',
            role: 'stella',
            text: MISSION_BRIEFING,
          }}
        />
      ) : (
        // STATE: No topic selected -> Show Topic Selector
        // We pass the cleanMissionPlan to ensure TopicSelector receives reliable data.
        cleanMissionPlan && <TopicSelector plan={cleanMissionPlan} onSelect={handleSelectTopic} />
      )}
    </section>
  );
}