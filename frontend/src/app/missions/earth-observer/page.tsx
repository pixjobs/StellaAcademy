'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMissionPlanGenerator } from '@/hooks/useMissionPlanGenerator';
import type { EnrichedMissionPlan, Img } from '@/types/mission';

import MissionControl from '@/components/MissionControl';
import MissionStandby from '@/components/MissionStandby';
import TopicSelector from '@/components/TopicSelector';
import { Button } from '@/components/ui/button';

// --- Type Definitions for Data Normalization ---
// This pattern ensures data integrity before it's used in state or components.
type TopicFromHook = EnrichedMissionPlan['topics'][number];
type CleanTopic = Omit<TopicFromHook, 'images'> & { images: Img[] };

// --- Mission-Specific Configuration ---
const MISSION_BRIEFING = `Welcome, Observer.
Your mission is to analyze these images of Earth from deep space.
1) Describe the major weather patterns or geographical features you see.
2) Ask about the time of day or season for a specific region.
3) Inquire about the technology behind the DSCOVR satellite or its orbit.
Use "Quiz Me" to test your observations. Let's begin the analysis.`;

/* ---------- Helpers (using strict, clean types) ---------- */

function reorderImages(images: Img[], focusIndex: number): Img[] {
  if (images.length === 0) return [];
  const i = Math.max(0, Math.min(focusIndex, images.length - 1));
  return [images[i], ...images.slice(0, i), ...images.slice(i + 1)];
}

function buildContext(topic: CleanTopic, pickedIndex = 0): string {
  const chosen = topic.images[pickedIndex];
  // No optional chaining `?.` or nullish coalescing `??` is needed due to our clean types.
  const chosenLine = `Selected image for analysis: #${pickedIndex + 1} - ${chosen.title}`;
  return `Mission: ${topic.title}. ${topic.summary}\n${chosenLine}`.trim();
}

/* ---------- Page Component ---------- */
export default function EarthObserverPage() {
  // Fetch the mission plan for the 'earth-observer' mission type.
  const { missionPlan, isLoading, error, generateNewPlan } = useMissionPlanGenerator('earth-observer');

  // --- Data Normalization ---
  // Create a memoized, "clean" version of the mission plan as soon as data arrives.
  // This step guarantees that all `Img` objects have the required `title` and `href` properties.
  const cleanMissionPlan = useMemo(() => {
    if (!missionPlan) return null;
    return {
      ...missionPlan,
      topics: missionPlan.topics.map((topic): CleanTopic => ({
        ...topic,
        // Normalize the images array: provide defaults and filter out any invalid entries.
        images: (topic.images || [])
          .map(img => ({
            title: img.title ?? 'Untitled Earth View', // A sensible default title
            href: img.href ?? '',
          }))
          .filter(img => img.href), // Ensure every image has a valid URL
      })),
    };
  }, [missionPlan]);

  // All component state will use our clean, strict `CleanTopic` type.
  const [selectedTopic, setSelectedTopic] = useState<CleanTopic | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);

  const handleSelectTopic = useCallback((topic: CleanTopic, imageIndex: number) => {
    setSelectedTopic(topic);
    setSelectedImageIdx(imageIndex);
  }, []);

  const handleReturnToTopics = useCallback(() => setSelectedTopic(null), []);

  // --- Render Logic ---

  // 1. Loading and Error States
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

  // 2. Main Content
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
        // Show the main MissionControl UI if a topic is selected
        <MissionControl
          key={selectedTopic.title}
          mission={selectedTopic.title}
          // The data passed here is guaranteed to be in the correct, strict format.
          images={reorderImages(selectedTopic.images, selectedImageIdx)}
          context={buildContext(selectedTopic, selectedImageIdx)}
          initialMessage={{ id: 'stella-earth-briefing', role: 'stella', text: MISSION_BRIEFING }}
        />
      ) : (
        // Otherwise, show the TopicSelector
        cleanMissionPlan && (
          <TopicSelector plan={cleanMissionPlan} onSelect={handleSelectTopic} />
        )
      )}
    </section>
  );
}