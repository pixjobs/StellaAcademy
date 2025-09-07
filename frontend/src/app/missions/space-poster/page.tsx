'use client';

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useMissionPlanGenerator } from '@/hooks/useMissionPlanGenerator';
import { useGame } from '@/lib/store'; // ✅ get the picked role
import type { EnrichedMissionPlan, Img } from '@/types/mission';

import MissionControl from '@/components/MissionControl';
import MissionStandby from '@/components/MissionStandby';
import TopicSelector from '@/components/TopicSelector';
import { Button } from '@/components/ui/button';

type TopicFromHook = EnrichedMissionPlan['topics'][number];
type CleanTopic = Omit<TopicFromHook, 'images'> & { images: Img[] };

type TutorPreflightResult = {
  systemPrompt: string;
  starterMessages: Array<{ role: 'user' | 'assistant' | 'system'; text: string }>;
  difficulty?: string;
};

const DEFAULT_BRIEFING = `Welcome to Space Poster Studio.
Your mission:
1) Write a catchy title.
2) Add a 1–2 line caption kids can understand.
3) Give one fun fact.
4) Suggest a color palette (2–3 colors).
Use “Quiz Me” to check understanding. Let’s design something stellar!`;

/* ---------- Helpers ---------- */

function reorderImages(images: Img[], focusIndex: number): Img[] {
  if (images.length === 0) return [];
  const i = Math.max(0, Math.min(focusIndex, images.length - 1));
  return [images[i], ...images.slice(0, i), ...images.slice(i + 1)];
}

function buildContext(topic: CleanTopic, pickedIndex = 0): string {
  const chosen = topic.images[pickedIndex];
  const chosenLine = `Selected poster base: #${pickedIndex + 1} ${chosen.title}`;
  return `Poster Theme: ${topic.title}. ${topic.summary}\n${chosenLine}`.trim();
}

// POST → /api/preFlight
async function startPreflight(payload: {
  mission: string; // 'space-poster'
  topicTitle: string;
  topicSummary: string;
  imageTitle?: string;
  role: 'explorer' | 'cadet' | 'scholar'; // ✅ role required by API
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

// Poll status
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

/* ---------- Page ---------- */

export default function SpacePosterPage() {
  const { missionPlan, isLoading, error, generateNewPlan } = useMissionPlanGenerator('space-poster');
  const { role = 'explorer' } = useGame(); // ✅ ensure we have a valid role

  // Clean/strict plan
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

  const [selectedTopic, setSelectedTopic] = useState<CleanTopic | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);

  // Preflight state
  const [preflightLoading, setPreflightLoading] = useState(false);
  const [preflightError, setPreflightError] = useState<string | null>(null);
  const [preflightBriefing, setPreflightBriefing] = useState<string | null>(null);
  const lastRequestedRef = useRef<string | null>(null);

  const handleSelectTopic = useCallback((topic: CleanTopic, imageIndex: number) => {
    setSelectedTopic(topic);
    setSelectedImageIdx(imageIndex);
  }, []);

  const handleReturnToTopics = useCallback(() => {
    setSelectedTopic(null);
    setPreflightLoading(false);
    setPreflightError(null);
    setPreflightBriefing(null);
    lastRequestedRef.current = null;
  }, []);

  // Kick off preflight when a topic is selected, image changes, or role changes
  useEffect(() => {
    if (!selectedTopic) return;

    const imageTitle = selectedTopic.images[selectedImageIdx]?.title || undefined;
    const reqKey = `${selectedTopic.title}::${imageTitle}::${role}`; // ✅ include role to avoid races
    lastRequestedRef.current = reqKey;

    setPreflightLoading(true);
    setPreflightError(null);
    setPreflightBriefing(null);

    (async () => {
      try {
        const jobId = await startPreflight({
          mission: 'space-poster',
          topicTitle: selectedTopic.title,
          topicSummary: selectedTopic.summary,
          imageTitle,
          role, // ✅ pass role through
        });
        const result = await waitForPreflight(jobId);

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
  }, [selectedTopic, selectedImageIdx, role]); // ✅ depend on role, too

  // Loading / Error for plan generation
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
          {selectedTopic && <h2 className="text-lg text-sky-400">Theme: {selectedTopic.title}</h2>}
        </div>
        <div className="flex gap-2">
          {selectedTopic && <Button onClick={handleReturnToTopics} variant="outline">Change Theme</Button>}
          <Button onClick={generateNewPlan}>New Poster Plan</Button>
        </div>
      </div>

      {selectedTopic ? (
        preflightLoading ? (
          <MissionStandby missionName="Preparing Poster Briefing..." />
        ) : preflightError ? (
          <div className="rounded-xl border border-red-600/50 bg-red-900/30 p-4 text-red-200 max-w-xl">
            <p className="font-semibold mb-1">Preflight Failed</p>
            <p className="text-sm opacity-90 mb-3">{preflightError}</p>
            <div className="flex gap-2">
              <Button onClick={() => setSelectedTopic((t) => (t ? { ...t } : t))} variant="secondary">
                Retry
              </Button>
              <Button onClick={handleReturnToTopics} variant="outline">Back to Themes</Button>
            </div>
          </div>
        ) : (
          <MissionControl
            key={`${selectedTopic.title}-${selectedImageIdx}`}
            mission={selectedTopic.title}
            images={reorderImages(selectedTopic.images, selectedImageIdx)}
            context={buildContext(selectedTopic, selectedImageIdx)}
            initialMessage={{
              id: 'stella-poster-briefing',
              role: 'stella',
              text: preflightBriefing ?? DEFAULT_BRIEFING,
            }}
          />
        )
      ) : (
        cleanMissionPlan && <TopicSelector plan={cleanMissionPlan} onSelect={handleSelectTopic} />
      )}
    </section>
  );
}
