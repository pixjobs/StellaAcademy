'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import Image from 'next/image';
import type { EnrichedMissionPlan } from '@/types/mission';
import { Button } from '@/components/ui/button';

/* ---------------- Types (Strict & Self-Documenting) ---------------- */

type MissionImage = {
  title: string;
  href: string;
  highResHref?: string;
};

type Topic = EnrichedMissionPlan['topics'][number] & {
  images: MissionImage[];
};

type RawImage = {
  href?: string | null;
  imgSrc?: string | null;
  url?: string | null;
  hdurl?: string | null;
  links?: Array<{ href?: string; rel?: string }>;
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
  onSelect: (imageIndex: number) => void;
  onViewSlideshow: () => void;
  maxThumbs: number;
};

type LightboxProps = {
  topic: Topic;
  activeImageIndex: number;
  onClose: () => void;
  onSelectImage: (imageIndex: number) => void;
  onSetActiveImage: (imageIndex: number) => void;
};

/* ---------------- Helpers (Type-Safe & Smarter) ---------------- */

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function normalizeImages(raw: unknown[]): MissionImage[] {
  const out: MissionImage[] = [];
  if (!Array.isArray(raw)) return out;

  for (const item of raw) {
    if (!isRecord(item)) continue;
    const it = item as RawImage;
    const href = it.href ?? it.imgSrc ?? it.url;

    if (typeof href === 'string' && href) {
      const title = it.title ?? it.caption ?? 'Untitled NASA Image';
      let highResHref: string | undefined = it.hdurl ?? undefined;

      if (!highResHref && Array.isArray(it.links)) {
        highResHref = it.links.find(link => link.rel === 'orig')?.href ?? undefined;
      }

      out.push({ href, title: String(title), highResHref });
    }
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

  const handleSelect = (topic: Topic, imageIndex: number) => {
    onSelect(topic, imageIndex);
  };

  return (
    <div ref={root} className="rounded-2xl bg-slate-900/60 p-4 shadow-pixel border border-white/10 backdrop-blur-md">
      <h2 className="font-pixel text-lg text-gold mb-2">{plan.missionTitle}</h2>
      <p className="text-slate-300 mb-4">{plan.introduction}</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic, tIdx) => (
          <TopicCard
            key={`${topic.title}-${tIdx}`}
            topic={topic}
            onSelect={(imageIndex) => handleSelect(topic, imageIndex)}
            onViewSlideshow={() => openLightbox(tIdx, 0)}
            maxThumbs={maxThumbs}
          />
        ))}
      </div>

      {lightboxState.open && (
        <Lightbox
          topic={topics[lightboxState.topicIdx]}
          activeImageIndex={lightboxState.imageIdx}
          onClose={closeLightbox}
          onSelectImage={(imageIndex) => handleSelect(topics[lightboxState.topicIdx], imageIndex)}
          onSetActiveImage={(imageIndex) => setLightboxState(prev => ({ ...prev, imageIdx: imageIndex }))}
        />
      )}
    </div>
  );
}

/* ---------------- Child Component: TopicCard ---------------- */
function TopicCard({ topic, onSelect, onViewSlideshow, maxThumbs }: TopicCardProps) {
  const thumbs = topic.images.slice(0, maxThumbs);
  const hasImages = thumbs.length > 0;

  return (
    <div className="tg-card rounded-xl bg-slate-800/60 border border-white/10 p-3 flex flex-col">
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-gold pr-2">{topic.title}</h3>
        {hasImages && (
          <span className="text-[10px] font-pixel px-2 py-1 rounded bg-gold/20 text-gold flex-shrink-0">
            {topic.images.length} visuals
          </span>
        )}
      </div>
      <p className="text-sm text-slate-400 mt-1 line-clamp-3 flex-grow">{topic.summary}</p>

      {hasImages && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {thumbs.map((im) => (
            <button
              key={im.href}
              onClick={onViewSlideshow}
              className="group relative block h-16 rounded-md overflow-hidden border border-white/10 focus:outline-none focus:ring-2 focus:ring-gold"
              aria-label={`Open slideshow for ${topic.title}`}
            >
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

      <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
        {hasImages ? (
          <>
            <Button onClick={onViewSlideshow} variant="secondary" size="sm" className="flex-1">
              Slideshow
            </Button>
            {/* --- FIX IS HERE --- */}
            <Button onClick={() => onSelect(0)} size="sm" className="flex-1">
              Learn Topic
            </Button>
          </>
        ) : (
          // --- AND HERE ---
          <Button onClick={() => onSelect(0)} size="sm" className="w-full">
            Learn Topic
          </Button>
        )}
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
  const highResLink = currentImage?.highResHref || currentImage?.href;

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
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <span className="text-slate-300 hover:text-white text-sm">✕</span>
          </Button>
        </div>

        <div className="relative aspect-video bg-black/30 rounded-xl overflow-hidden border border-white/10 group">
          {currentImage ? (
            <>
              <Image
                key={currentImage.href}
                src={currentImage.href}
                alt={currentImage.title}
                fill
                className="object-contain"
                sizes="(max-width: 1280px) 90vw, 896px"
              />
              <a
                href={highResLink}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0"
                aria-label="View high-resolution image in new tab"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </div>
              </a>
            </>
          ) : (
            <div className="flex items-center justify-center text-slate-400">No image</div>
          )}
          <Button variant="secondary" size="icon" onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8">‹</Button>
          <Button variant="secondary" size="icon" onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8">›</Button>
        </div>

        <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-xs text-slate-300 truncate pr-4">{currentImage?.title} • {activeImageIndex + 1}/{count}</div>
          <div className="flex gap-2 flex-shrink-0">
            {/* --- AND HERE --- */}
            <Button onClick={() => onSelectImage(activeImageIndex)} size="sm">
              Learn from this Image
            </Button>
            <Button onClick={onClose} variant="secondary" size="sm">Close</Button>
          </div>
        </div>

        {count > 1 && (
          <div className="mt-3 flex justify-center flex-wrap gap-1.5">
            {topic.images.map((_, i) => (
              <button
                key={i}
                onClick={() => onSetActiveImage(i)}
                className={`h-2 w-2 rounded-full transition-colors ${i === activeImageIndex ? 'bg-gold' : 'bg-slate-600 hover:bg-slate-500'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}