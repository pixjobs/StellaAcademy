'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMissionPlanGenerator } from '@/hooks/useMissionPlanGenerator';
// Import the strict Img type, and other types as needed
import type { EnrichedMissionPlan, Img } from '@/types/mission';

import MissionControl from '@/components/MissionControl';
import MissionStandby from '@/components/MissionStandby';
import TopicSelector from '@/components/TopicSelector';
import { Button } from '@/components/ui/button';

// This is the "loose" topic type that comes from your hook
type TopicFromHook = EnrichedMissionPlan['topics'][number];
// This is our new, "strict" topic type where images are guaranteed to be correct
type CleanTopic = Omit<TopicFromHook, 'images'> & { images: Img[] };

const MISSION_BRIEFING = `Welcome to Space Poster Studio.
Your mission:
1) Write a catchy title.
2) Add a 1–2 line caption kids can understand.
3) Give one fun fact.
4) Suggest a color palette (2–3 colors).
Use “Quiz Me” to check understanding. Let’s design something stellar!`;

/* ---------- Helpers (Now using strict types) ---------- */

// This function now correctly expects and returns the strict Img array
function reorderImages(images: Img[], focusIndex: number): Img[] {
  if (images.length === 0) return [];
  const i = Math.max(0, Math.min(focusIndex, images.length - 1));
  return [images[i], ...images.slice(0, i), ...images.slice(i + 1)];
}

function buildContext(topic: CleanTopic, pickedIndex = 0): string {
  const chosen = topic.images[pickedIndex];
  // No more optional chaining `?.` or nullish coalescing `??` needed!
  const chosenLine = `Selected poster base: #${pickedIndex + 1} ${chosen.title}`;
  return `Poster Theme: ${topic.title}. ${topic.summary}\n${chosenLine}`.trim();
}

/* ---------- Page Component (Fully Refactored) ---------- */
export default function SpacePosterPage() {
  const { missionPlan, isLoading, error, generateNewPlan } = useMissionPlanGenerator('space-poster');

  // --- THIS IS THE CORE FIX ---
  // We create a "clean" version of the mission plan as soon as the data arrives.
  // This memoized value will only re-calculate when the original missionPlan changes.
  const cleanMissionPlan = useMemo(() => {
    if (!missionPlan) return null;
    return {
      ...missionPlan,
      topics: missionPlan.topics.map((topic): CleanTopic => ({
        ...topic,
        // Normalize the images array: provide defaults and filter out invalid entries.
        images: (topic.images || [])
          .map(img => ({
            title: img.title ?? 'Untitled Image',
            href: img.href ?? '',
          }))
          .filter(img => img.href), // Ensure every image has a URL
      })),
    };
  }, [missionPlan]);

  // All state now uses the clean, strict `CleanTopic` type.
  const [selectedTopic, setSelectedTopic] = useState<CleanTopic | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);

  const handleSelectTopic = useCallback((topic: CleanTopic, imageIndex: number) => {
    setSelectedTopic(topic);
    setSelectedImageIdx(imageIndex);
  }, []);

  const handleReturnToTopics = useCallback(() => setSelectedTopic(null), []);

  // Loading / Error state (unchanged, but now safer)
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

      {selectedTopic ? (
        <MissionControl
          key={selectedTopic.title}
          mission={selectedTopic.title}
          // The data passed here is now guaranteed to be in the correct, strict format.
          images={reorderImages(selectedTopic.images, selectedImageIdx)}
          context={buildContext(selectedTopic, selectedImageIdx)}
          initialMessage={{ id: 'stella-poster-briefing', role: 'stella', text: MISSION_BRIEFING }}
        />
      ) : (
        // Pass the cleaned data to the TopicSelector as well
        cleanMissionPlan && (
          <TopicSelector plan={cleanMissionPlan} onSelect={handleSelectTopic} />
        )
      )}
    </section>
  );
}