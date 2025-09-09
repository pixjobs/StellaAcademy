'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
// ===== CHANGE #1: Import next/image =====
import Image from 'next/image';
import type { EnrichedMissionPlan } from '@/types/mission';

/* ---------------- Types (Strict & Self-Documenting) ---------------- */

type MissionImage = {
  title: string;
  href: string;
};

type Topic = EnrichedMissionPlan['topics'][number] & {
  images: MissionImage[];
};

type RawImage = {
  href?: string | null;
  imgSrc?: string | null;
  url?: string | null;
  title?: string | null;
  caption?: string | null;
};

type TopicSelectorProps = {
  plan?: EnrichedMissionPlan;
  onSelect: (topic: Topic, imageIndex: number) => void;
  maxThumbs?: number;
};

type TopicCardProps = {
  topic: Topic;
  onViewSlideshow: () => void;
  onLearn: () => void;
  maxThumbs: number;
};

type LightboxProps = {
  topic: Topic;
  activeImageIndex: number;
  onClose: () => void;
  onSelectImage: (imageIndex: number) => void;
  onSetActiveImage: (imageIndex: number) => void;
};

/* ---------------- Helpers (Type-Safe) ---------------- */

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function normalizeImages(raw: unknown[]): MissionImage[] {
  const out: MissionImage[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const it = item as RawImage;
    const href = it.href ?? it.imgSrc ?? it.url;
    if (typeof href !== 'string' || !href) continue;
    const title = it.title ?? it.caption ?? 'Untitled';
    out.push({ href, title });
  }
  return out;
}

/* ---------------- Main Component ---------------- */
export default function TopicSelector({ plan, onSelect, maxThumbs = 4 }: TopicSelectorProps) {
  const root = useRef<HTMLDivElement>(null);
  const [lightboxState, setLightboxState] = useState<{ open: boolean; topicIdx: number; imageIdx: number }>({
    open: false,
    topicIdx: 0,
    imageIdx: 0,
  });

  const topics: Topic[] = useMemo(
    () => plan?.topics.map((t) => ({ ...t, images: normalizeImages(t.images) })) ?? [],
    [plan]
  );

  useGSAP(() => {
    gsap.from(root.current, { autoAlpha: 0, duration: 0.4, ease: 'power1.out' });
    gsap.from('.tg-card', { y: 12, autoAlpha: 0, stagger: 0.05, duration: 0.35, ease: 'power1.out', delay: 0.1 });
  }, { scope: root });

  if (!plan || topics.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900/60 p-4 shadow-pixel border border-white/10 backdrop-blur-md">
        <h2 className="font-pixel text-lg text-gold mb-2">Preparing your mission…</h2>
        <p className="text-slate-300">We’re assembling topics and visuals.</p>
      </div>
    );
  }

  const openLightbox = (topicIdx: number, imageIdx: number) => {
    setLightboxState({ open: true, topicIdx, imageIdx });
  };
  const closeLightbox = () => setLightboxState(prev => ({ ...prev, open: false }));

  return (
    <div ref={root} className="rounded-2xl bg-slate-900/60 p-4 shadow-pixel border border-white/10 backdrop-blur-md">
      <h2 className="font-pixel text-lg text-gold mb-2">{plan.missionTitle}</h2>
      <p className="text-slate-300 mb-4">{plan.introduction}</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic, tIdx) => (
          <TopicCard
            key={`${topic.title}-${tIdx}`}
            topic={topic}
            onViewSlideshow={() => openLightbox(tIdx, 0)}
            onLearn={() => onSelect(topic, 0)}
            maxThumbs={maxThumbs}
          />
        ))}
      </div>

      {lightboxState.open && (
        <Lightbox
          topic={topics[lightboxState.topicIdx]}
          activeImageIndex={lightboxState.imageIdx}
          onClose={closeLightbox}
          onSelectImage={(imageIndex) => onSelect(topics[lightboxState.topicIdx], imageIndex)}
          onSetActiveImage={(imageIndex) => setLightboxState(prev => ({ ...prev, imageIdx: imageIndex }))}
        />
      )}
    </div>
  );
}

/* ---------------- Child Component: TopicCard ---------------- */
function TopicCard({ topic, onViewSlideshow, onLearn, maxThumbs }: TopicCardProps) {
  const thumbs = topic.images.slice(0, maxThumbs);
  const hasImages = thumbs.length > 0;

  return (
    <div className="tg-card rounded-xl bg-slate-800/60 border border-white/10 p-3 flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gold pr-2">{topic.title}</h3>
        <span
          className={`text-[10px] font-pixel px-2 py-1 rounded ${
            hasImages ? 'bg-gold/20 text-gold' : 'bg-red-900/50 text-red-300'
          }`}
        >
          {hasImages ? `${topic.images.length} visuals` : 'No visuals'}
        </span>
      </div>
      <p className="text-sm text-slate-400 mt-1 line-clamp-3 flex-grow">{topic.summary}</p>

      {hasImages && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {thumbs.map((im, iIdx) => (
            <button
              key={`${topic.title}-thumb-${iIdx}`}
              onClick={onViewSlideshow}
              // ===== CHANGE #2: Added h-16 to the parent for explicit sizing =====
              className="group relative block h-16 rounded-md overflow-hidden border border-white/10 focus:outline-none focus:ring-2 focus:ring-gold"
              aria-label={`Open slideshow for ${topic.title}`}
            >
              {/* ===== CHANGE #3: Replaced <img> with next/image ===== */}
              <Image
                src={im.href}
                alt={im.title}
                fill
                className="object-cover group-hover:scale-[1.03] transition-transform duration-200"
                sizes="(max-width: 640px) 25vw, (max-width: 1024px) 15vw, 10vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={onViewSlideshow}
          className="px-2 py-1 text-xs rounded bg-slate-700/70 hover:bg-slate-600/70 text-slate-200 disabled:opacity-50"
          disabled={!hasImages}
        >
          View Slideshow
        </button>
        <button
          onClick={onLearn}
          className="px-2 py-1 text-xs rounded bg-gold/20 text-gold hover:bg-gold/30 disabled:opacity-50 font-semibold"
          disabled={!hasImages}
        >
          Learn This Topic
        </button>
      </div>
    </div>
  );
}

/* ---------------- Child Component: Lightbox ---------------- */
function Lightbox({ topic, activeImageIndex, onClose, onSelectImage, onSetActiveImage }: LightboxProps) {
  const lightboxRef = useRef<HTMLDivElement>(null);
  const count = topic.images.length;

  const next = useCallback(() => onSetActiveImage((activeImageIndex + 1) % count), [activeImageIndex, count, onSetActiveImage]);
  const prev = useCallback(() => onSetActiveImage((activeImageIndex - 1 + count) % count), [activeImageIndex, count, onSetActiveImage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, next, prev]);

  useGSAP(() => {
    gsap.fromTo(lightboxRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'power1.out' });
    gsap.from('.tg-slide-content', { y: 16, autoAlpha: 0, duration: 0.25, ease: 'power1.out' });
  }, { scope: lightboxRef });

  const currentImage = topic.images[activeImageIndex];

  return (
    <div
      ref={lightboxRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3"
      onClick={onClose}
    >
      <div
        className="tg-slide-content relative w-full max-w-4xl bg-slate-900/90 border border-white/10 rounded-2xl p-3 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-gold font-bold">{topic.title}</div>
          <button className="text-slate-300 hover:text-white text-sm" onClick={onClose}>✕</button>
        </div>

        <div className="relative aspect-video bg-black/30 rounded-xl overflow-hidden border border-white/10">
          {currentImage ? (
            // ===== CHANGE #4: Replaced <img> with next/image =====
            <Image
              src={currentImage.href}
              alt={currentImage.title}
              fill
              className="object-contain"
              sizes="(max-width: 1280px) 90vw, 896px"
            />
          ) : (
            <div className="flex items-center justify-center text-slate-400">No image</div>
          )}
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-800/70 hover:bg-slate-700/80 border border-white/10">‹</button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-800/70 hover:bg-slate-700/80 border border-white/10">›</button>
        </div>

        <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-xs text-slate-300">{currentImage?.title} • {activeImageIndex + 1}/{count}</div>
          <div className="flex gap-2">
            <button onClick={() => onSelectImage(activeImageIndex)} className="px-3 py-1 text-xs rounded bg-gold/20 text-gold hover:bg-gold/30 font-semibold">
              Learn from this Image
            </button>
            <button onClick={onClose} className="px-3 py-1 text-xs rounded bg-slate-800/70 hover:bg-slate-700/80 border border-white/10">Close</button>
          </div>
        </div>

        {count > 1 && (
          <div className="mt-3 flex justify-center flex-wrap gap-1.5">
            {topic.images.map((_, i) => (
              <button
                key={i}
                onClick={() => onSetActiveImage(i)}
                className={`h-2 w-2 rounded-full ${i === activeImageIndex ? 'bg-gold' : 'bg-slate-600 hover:bg-slate-500'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}