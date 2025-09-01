'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useGame } from '@/lib/store';
import { useMissionChatQueued } from '@/hooks/useMissionChatQueued';
import ChatDisplay from '@/components/ChatDisplay';
import ChatInput from '@/components/ChatInput';

type Img = { title?: string; href?: string };
type Topic = {
  title: string;
  summary: string;
  images?: Img[];
};

type Props = {
  topic: Topic;
  initialImageIdx?: number;
};

function normalizeImages(raw?: any[]): Required<Img>[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((it) => {
      const href = String(it?.href ?? it?.imgSrc ?? '');
      const title = String(it?.title ?? 'Untitled');
      return href ? { href, title } : null;
    })
    .filter(Boolean) as Required<Img>[];
}

export default function MissionLesson({ topic, initialImageIdx = 0 }: Props) {
  const role = useGame((s) => s.role);
  const images = useMemo(() => normalizeImages(topic.images), [topic.images]);
  const firstIdx = Math.min(Math.max(0, initialImageIdx), Math.max(0, images.length - 1));

  const { messages, loading, sendMessage, stop, reset } = useMissionChatQueued({
    role,
    mission: topic.title,
  });

  // auto-intro on mount
  const kickedRef = useRef(false);
  useEffect(() => {
    if (kickedRef.current) return;
    kickedRef.current = true;

    const chosen = images[firstIdx];
    const context = chosen ? `#1 ${chosen.title} – ${chosen.href}` : '';
    const prompt = `Give a ${role}-friendly 3-bullet intro to "${topic.title}" using the selected image. End with 1 question I can answer.`;
    sendMessage(prompt, `Student is learning about: ${topic.title}. ${topic.summary}\n${context}`); // fire & forget
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.title]);

  const chosen = images[firstIdx];

  const askExplain = () =>
    sendMessage(
      `Explain the key idea in this image like I'm a ${role}. One tight paragraph + one formula or number if relevant.`,
      chosen ? `${chosen.title} – ${chosen.href}` : undefined
    );

  const askQuiz = () =>
    sendMessage(
      `Quiz me on "${topic.title}". Ask 3 questions, one at a time. Wait for my reply after each. Start now with Q1.`,
      chosen ? `${chosen.title} – ${chosen.href}` : undefined
    );

  const askSummary = () =>
    sendMessage(
      `Give me a 2-line takeaway about "${topic.title}" tied to this picture.`,
      chosen ? `${chosen.title} – ${chosen.href}` : undefined
    );

  const handleSend = (q: string) => {
    const context = chosen ? `${chosen.title} – ${chosen.href}` : undefined;
    sendMessage(q, context);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-pixel text-lg text-sky">Objective: {topic.title}</h2>
          <div className="flex gap-2">
            <button onClick={askExplain} className="px-2 py-1 text-xs rounded bg-sky-900/60 hover:bg-sky-800/80">
              Explain
            </button>
            <button onClick={askQuiz} className="px-2 py-1 text-xs rounded bg-amber-900/60 hover:bg-amber-800/80">
              Quiz Me
            </button>
            <button onClick={askSummary} className="px-2 py-1 text-xs rounded bg-mint/20 text-mint hover:bg-mint/30">
              Summary
            </button>
          </div>
        </div>

        {/* lead image */}
        {chosen && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={chosen.href}
            alt={chosen.title}
            className="w-full max-h-96 object-contain rounded-lg border border-white/10 mb-3"
          />
        )}

        <ChatDisplay messages={messages} />
        {loading && <div className="text-xs text-sky animate-pulse my-1">Stella is thinking…</div>}
        <ChatInput onSend={handleSend} onStop={stop} isLoading={loading} />
        <div className="mt-2 text-[11px] text-slate-500">
          Role: <b>{role}</b> • Topic: <b>{topic.title}</b>
        </div>
      </div>

      {/* Lesson scaffold */}
      <aside className="rounded-xl bg-slate-800/50 border border-white/10 p-3">
        <div className="font-pixel text-xs text-sky mb-2">Lesson Plan</div>
        <ol className="text-sm text-slate-300 list-decimal ml-5 space-y-1">
          <li>Summarise the image in plain words.</li>
          <li>Spot the key concept (thrust, staging, aero, camera use).</li>
          <li>Ask a “what if” (e.g. +20% thrust?).</li>
          <li>Link to a real mission or rover workflow.</li>
          <li>Write a 1-line takeaway.</li>
        </ol>
        <div className="mt-3 text-[11px] text-slate-400">
          Tip: use <b>Quiz Me</b> for practice questions.
        </div>
      </aside>
    </div>
  );
}
