'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useGame } from '@/lib/store';
import type { EnrichedTopic, Img } from '@/types/mission';
import type { Role } from '@/types/llm';

// --- Import BOTH hooks ---
import { useMissionPlanGenerator } from '@/hooks/useMissionPlanGenerator';
import { useTutorPreflightGenerator } from '@/hooks/useTutorPreflightGenerator';

import MissionControl from '@/components/MissionControl';
import MissionStandby from '@/components/MissionStandby';
import TopicSelector from '@/components/TopicSelector';
import { Button } from '@/components/ui/button';

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type CleanTopic = Omit<EnrichedTopic, 'images'> & { images: Img[] };

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_BRIEFING = `Welcome to Space Poster Studio.
Your mission:
1) Write a catchy title.
2) Add a 1–2 line caption kids can understand.
3) Give one fun fact.
4) Suggest a color palette (2–3 colors).
Use “Quiz Me” to check understanding. Let’s design something stellar!`;

function reorderImages(images: Img[], focusIndex: number): Img[] {
  if (!images || images.length === 0) return [];
  const i = Math.max(0, Math.min(focusIndex, images.length - 1));
  return [images[i], ...images.slice(0, i), ...images.slice(i + 1)];
}

function buildContext(topic: CleanTopic, pickedIndex = 0): string {
  const chosen = topic.images?.[pickedIndex];
  const chosenLine = chosen
    ? `\nSelected poster base: #${pickedIndex + 1} ${chosen.title}`
    : '';
  return `Poster Theme: ${topic.title}. ${topic.summary}${chosenLine}`.trim();
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export default function SpacePosterPage() {
  const { role = 'explorer' } = useGame();

  // HOOK 1: Manages fetching the overall mission plan.
  const {
    missionPlan,
    isLoading: isMissionLoading,
    error: missionError,
    generateNewPlan,
  } = useMissionPlanGenerator('space-poster');

  // HOOK 2: Manages fetching the pre-flight data for a selected topic.
  const {
    preflight,
    isLoading: isPreflightLoading,
    error: preflightError,
    generateNewPreflight,
  } = useTutorPreflightGenerator();

  // Memoize the sanitized mission plan to prevent unnecessary re-renders.
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

  // This effect connects the two hooks. When a topic is selected, it
  // triggers the pre-flight generation for that topic.
  useEffect(() => {
    if (selectedTopic && cleanMissionPlan) {
      const imageTitle = selectedTopic.images?.[selectedImageIdx]?.title;
      
      generateNewPreflight({
        role: role as Role,
        mission: cleanMissionPlan,
        topicTitle: selectedTopic.title,
        topicSummary: selectedTopic.summary,
        imageTitle,
      });
    }
  }, [selectedTopic, selectedImageIdx, role, cleanMissionPlan, generateNewPreflight]);

  const handleSelectTopic = useCallback((topic: CleanTopic, imageIndex: number) => {
    setSelectedTopic(topic);
    setSelectedImageIdx(Math.max(0, imageIndex));
  }, []);

  const handleReturnToTopics = useCallback(() => {
    setSelectedTopic(null);
  }, []);

  // Derive the initial briefing message from the pre-flight result.
  const briefingMessage = useMemo(() => {
    if (!preflight) return DEFAULT_BRIEFING;
    const assistantFirst = preflight.starterMessages.find((m) => m.role === 'stella');
    return assistantFirst?.text?.trim() || DEFAULT_BRIEFING;
  }, [preflight]);

  /* ---------------------------- Render states ---------------------------- */

  if (isMissionLoading || missionError) {
    return (
      <section className="container mx-auto flex flex-col items-center justify-center p-4 text-center min-h-[60vh]">
        <h1 className="font-pixel text-xl text-gold mb-4">🌌 Space Poster Studio</h1>
        {missionError ? (
          <div className="rounded-xl border border-red-600/50 bg-red-900/30 p-4 text-red-200 max-w-md">
            <p className="font-semibold mb-1">Poster Plan Failed</p>
            <p className="text-sm opacity-90 mb-4">{String(missionError)}</p>
            <Button onClick={generateNewPlan} variant="destructive">Try Again</Button>
          </div>
        ) : (
          <MissionStandby missionName="Gathering Space Images..." />
        )}
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-pixel text-xl text-gold mb-1">🌌 Space Poster Studio</h1>
          {selectedTopic && <h2 className="text-lg text-sky-400">Theme: {selectedTopic.title}</h2>}
        </div>
        <div className="flex gap-2">
          {selectedTopic && <Button onClick={handleReturnToTopics} variant="outline">Change Theme</Button>}
          <Button onClick={generateNewPlan}>New Poster Plan</Button>
        </div>
      </div>

      {selectedTopic ? (
        isPreflightLoading ? (
          <MissionStandby missionName="Preparing Poster Briefing..." />
        ) : preflightError ? (
          <div className="rounded-xl border border-red-600/50 bg-red-900/30 p-4 text-red-200 max-w-xl">
            <p className="font-semibold mb-1">Preflight Failed</p>
            <p className="text-sm opacity-90 mb-3">{preflightError}</p>
            <div className="flex gap-2">
              <Button onClick={() => setSelectedTopic((t) => (t ? { ...t } : t))} variant="secondary">Retry</Button>
              <Button onClick={handleReturnToTopics} variant="outline">Back to Themes</Button>
            </div>
          </div>
        ) : (
          <MissionControl
            key={`${selectedTopic.title}-${selectedTopic.images?.[selectedImageIdx]?.href ?? 'no-image'}`}
            mission={selectedTopic.title}
            images={reorderImages(selectedTopic.images, selectedImageIdx)}
            context={buildContext(selectedTopic, selectedImageIdx)}
            initialMessage={{
              id: 'stella-poster-briefing',
              role: 'stella',
              text: briefingMessage,
            }}
          />
        )
      ) : (
        cleanMissionPlan && <TopicSelector plan={cleanMissionPlan} onSelect={handleSelectTopic} />
      )}
    </section>  
  );
}