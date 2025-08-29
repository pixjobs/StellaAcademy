'use client';

import type { EnrichedMissionPlan } from '@/types/mission';

type Topic = EnrichedMissionPlan['topics'][number];

type TopicSelectorProps = {
  plan?: EnrichedMissionPlan;                    // can be undefined while loading/polling
  onSelectTopic: (topic: Topic) => void;
};

export default function TopicSelector({ plan, onSelectTopic }: TopicSelectorProps) {
  // If no plan yet, show a gentle placeholder (prevents undefined access + cleaner UX)
  if (!plan || !Array.isArray(plan.topics)) {
    return (
      <div className="rounded-2xl bg-slate-900/60 p-4 shadow-pixel border border-white/10 backdrop-blur-md">
        <h2 className="font-pixel text-lg text-mint mb-2">Preparing your mission…</h2>
        <p className="text-slate-300">We’re assembling topics and visuals.</p>
      </div>
    );
  }

  const topics: Topic[] = plan.topics;

  return (
    <div className="rounded-2xl bg-slate-900/60 p-4 shadow-pixel border border-white/10 backdrop-blur-md">
      <h2 className="font-pixel text-lg text-mint mb-2">{plan.missionTitle}</h2>
      <p className="text-slate-300 mb-4">{plan.introduction}</p>

      <div className="space-y-3">
        {topics.map((topic, index) => {
          const images = Array.isArray(topic.images) ? topic.images : [];
          const hasImages = images.length > 0;

          return (
            <button
              key={`${topic.title}-${index}`}
              onClick={() => onSelectTopic(topic)}
              disabled={!hasImages}
              className="w-full text-left p-3 rounded-lg bg-slate-800/70 border border-slate-700 hover:border-mint transition-colors disabled:opacity-50 disabled:hover:border-slate-700 disabled:cursor-not-allowed"
              aria-disabled={!hasImages}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sky">
                  Objective {index + 1}: {topic.title}
                </h3>
                <span
                  className={`text-xs font-pixel px-2 py-1 rounded ${
                    hasImages ? 'bg-mint/20 text-mint' : 'bg-red-900/50 text-red-300'
                  }`}
                >
                  {hasImages ? `${images.length} Visuals` : 'No Visuals'}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">{topic.summary}</p>
            </button>
          );
        })}

        {topics.length === 0 && (
          <div className="text-slate-400 text-sm">No topics yet—stand by for launch 🚀</div>
        )}
      </div>
    </div>
  );
}
