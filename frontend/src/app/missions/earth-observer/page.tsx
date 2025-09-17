'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
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
/*                             Component Helpers                              */
/* -------------------------------------------------------------------------- */

const DEFAULT_BRIEFING = `Welcome, Observer.
Your mission is to analyze these images of Earth from deep space.
1) Describe the major weather patterns or geographical features you see.
2) Ask about the time of day or season for a specific region.
3) Inquire about the technology behind the DSCOVR satellite or its orbit.
Use "Quiz Me" to test your observations. Let's begin the analysis.`;

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
  return `Mission: ${topic.title}. ${topic.summary}${chosenLine}`.trim();
}

/* -------------------------------------------------------------------------- */
/*                               Page Component                               */
/* -------------------------------------------------------------------------- */

export default function EarthObserverPage() {
  const { role = 'explorer' } = useGame();

  // HOOK 1: Manages fetching the overall mission plan (the list of topics).
  const {
    missionPlan,
    isLoading: isMissionLoading,
    error: missionError,
    generateNewPlan,
  } = useMissionPlanGenerator('earth-observer');

  // HOOK 2: Manages fetching the pre-flight data for a SINGLE selected topic.
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
          .map((img) => ({ title: img.title ?? 'Untitled Earth View', href: img.href ?? '' }))
          .filter((img) => img.href),
      })),
    };
  }, [missionPlan]);

  const [selectedTopic, setSelectedTopic] = useState<CleanTopic | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);

  // This effect is the "glue" that connects the two hooks.
  // When a user selects a topic, it triggers the pre-flight generation for that topic.
  useEffect(() => {
    if (selectedTopic && cleanMissionPlan) {
      const imageTitle = selectedTopic.images?.[selectedImageIdx]?.title;
      
      generateNewPreflight({
        role: role as Role,
        mission: cleanMissionPlan, // Pass the full mission plan object
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

  // State 1: Handle the initial loading and error state for the MISSION PLAN.
  if (isMissionLoading || missionError) {
    return (
      <section className="container mx-auto flex flex-col items-center justify-center p-4 text-center min-h-[60vh]">
        <h1 className="font-pixel text-xl text-gold mb-4">🌍 Earth Observer</h1>
        {missionError ? (
          <div className="rounded-xl border border-red-600/50 bg-red-900/30 p-4 text-red-200 max-w-md">
            <p className="font-semibold mb-1">Mission Plan Failed</p>
            <p className="text-sm opacity-90 mb-4">{String(missionError)}</p>
            <Button onClick={generateNewPlan} variant="destructive">Try Again</Button>
          </div>
        ) : (
          <MissionStandby missionName="Acquiring Satellite Imagery..." />
        )}
      </section>
    );
  }

  // State 2: The main page content, which branches based on whether a topic is selected.
  return (
    <section className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-pixel text-xl text-gold mb-1">🌍 Earth Observer</h1>
          {selectedTopic && <h2 className="text-lg text-sky-400">Target: {selectedTopic.title}</h2>}
        </div>
        <div className="flex gap-2">
          {selectedTopic && <Button onClick={handleReturnToTopics} variant="outline">Return to Selection</Button>}
          <Button onClick={generateNewPlan}>New Imagery</Button>
        </div>
      </div>

      {selectedTopic ? (
        // State 2a: A topic IS selected. Now we render based on the PRE-FLIGHT hook's state.
        isPreflightLoading ? (
          <MissionStandby missionName="Preparing Mission Briefing..." />
        ) : preflightError ? (
          <div className="rounded-xl border border-red-600/50 bg-red-900/30 p-4 text-red-200 max-w-xl">
            <p className="font-semibold mb-1">Preflight Failed</p>
            <p className="text-sm opacity-90 mb-3">{preflightError}</p>
            <div className="flex gap-2">
              {/* Retry by re-triggering the useEffect */}
              <Button onClick={() => setSelectedTopic((t) => (t ? { ...t } : t))} variant="secondary">Retry</Button>
              <Button onClick={handleReturnToTopics} variant="outline">Back to Targets</Button>
            </div>
          </div>
        ) : (
          <MissionControl
            key={`${selectedTopic.title}-${selectedTopic.images?.[selectedImageIdx]?.href ?? 'no-image'}`}
            mission={selectedTopic.title}
            images={reorderImages(selectedTopic.images, selectedImageIdx)}
            context={buildContext(selectedTopic, selectedImageIdx)}
            initialMessage={{
              id: 'stella-earth-briefing',
              role: 'stella',
              text: briefingMessage,
            }}
          />
        )
      ) : (
        // State 2b: No topic selected yet. Show the list of topics.
        cleanMissionPlan && <TopicSelector plan={cleanMissionPlan} onSelect={handleSelectTopic} />
      )}
    </section>
  );
}