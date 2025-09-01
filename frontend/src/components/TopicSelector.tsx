'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import type { EnrichedMissionPlan } from '@/types/mission';

type Topic = EnrichedMissionPlan['topics'][number];
type MissionImage = { title: string; href: string }; 

type TopicSelectorProps = {
  plan?: EnrichedMissionPlan;
  onSelect: (topic: Topic, imageIndex: number) => void; // <— important
  maxThumbs?: number;
};

/* ---------------- helpers (strict, no any) ---------------- */
function upgradeHttps(u?: string | null): string | null {
  if (!u) return null;
  try {
    const url = new URL(u);
    if (url.protocol === 'http:') {
      url.protocol = 'https:';
      return url.toString();
    }
    return u;
  } catch {
    return null;
  }
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function normalizeImages(raw?: unknown[]): MissionImage[] {
  if (!Array.isArray(raw)) return [];
  const out: MissionImage[] = [];
  for (const it of raw) {
    const href0 =
      typeof (it as any)?.href === 'string'
        ? (it as any).href
        : typeof (it as any)?.imgSrc === 'string'
        ? (it as any).imgSrc
        : typeof (it as any)?.url === 'string'
        ? (it as any).url
        : '';
    const href = upgradeHttps(href0);
    if (!href) continue; // must have href
    const titleRaw =
      typeof (it as any)?.title === 'string'
        ? (it as any).title
        : typeof (it as any)?.caption === 'string'
        ? (it as any).caption
        : 'Untitled';
    // Ensure required non-empty strings
    out.push({ href, title: titleRaw || 'Untitled' });
  }
  return out;
}

/* ---------------- component ---------------- */
export default function TopicSelector({ plan, onSelect, maxThumbs = 4 }: TopicSelectorProps) {
  const root = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  // Lightbox state
  const [open, setOpen] = useState(false);
  const [activeTopicIdx, setActiveTopicIdx] = useState<number>(0);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);

  // Guard while loading/polling
  if (!plan || !Array.isArray(plan.topics)) {
    return (
      <div className="rounded-2xl bg-slate-900/60 p-4 shadow-pixel border border-white/10 backdrop-blur-md">
        <h2 className="font-pixel text-lg text-mint mb-2">Preparing your mission…</h2>
        <p className="text-slate-300">We’re assembling topics and visuals.</p>
      </div>
    );
  }

  const topics: Topic[] = useMemo(
    () =>
      plan.topics.map((t) => ({
        ...t,
        images: normalizeImages(t.images as unknown[]),
      })),
    [plan]
  );

  /* ---------------- gsap entrance ---------------- */
  useGSAP(() => {
    gsap.from(root.current, { autoAlpha: 0, duration: 0.4, ease: 'power1.out' });
    gsap.from('.tg-card', {
      y: 12,
      autoAlpha: 0,
      stagger: 0.05,
      duration: 0.35,
      ease: 'power1.out',
      delay: 0.1,
    });
  }, { scope: root });

  /* ---------------- lightbox animation ---------------- */
  useGSAP(() => {
    if (!open || !lightboxRef.current) return;
    const tl = gsap.timeline();
    tl.fromTo(lightboxRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'power1.out' })
      .from('.tg-slide', { y: 16, autoAlpha: 0, duration: 0.25, ease: 'power1.out' });
    return () => tl.kill();
  }, [open, activeImageIdx]);

  /* ---------------- keyboard controls ---------------- */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTopicIdx, activeImageIdx]);

  const openLightbox = (tIdx: number, iIdx: number) => {
    setActiveTopicIdx(tIdx);
    setActiveImageIdx(iIdx);
    setOpen(true);
  };
  const closeLightbox = () => setOpen(false);

  const imagesForActive: MissionImage[] = Array.isArray(topics[activeTopicIdx]?.images)
    ? (topics[activeTopicIdx].images as MissionImage[])
    : [];
  const count = imagesForActive.length;

  const next = useCallback(() => setActiveImageIdx((i) => (count ? (i + 1) % count : 0)), [count]);
  const prev = useCallback(() => setActiveImageIdx((i) => (count ? (i - 1 + count) % count : 0)), [count]);

  /* ---------------- UI ---------------- */
  return (
    <div ref={root} className="rounded-2xl bg-slate-900/60 p-4 shadow-pixel border border-white/10 backdrop-blur-md">
      <h2 className="font-pixel text-lg text-mint mb-2">{plan.missionTitle}</h2>
      <p className="text-slate-300 mb-4">{plan.introduction}</p>

      {/* Grid of topic cards */}
      <div ref={gridRef} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic, tIdx) => {
          const all = Array.isArray(topic.images) ? (topic.images as MissionImage[]) : [];
          const thumbs = all.slice(0, maxThumbs);
          const hasImages = thumbs.length > 0;

          return (
            <div key={`${topic.title}-${tIdx}`} className="tg-card rounded-xl bg-slate-800/60 border border-white/10 p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sky pr-2">{topic.title}</h3>
                <span
                  className={`text-[10px] font-pixel px-2 py-1 rounded ${
                    hasImages ? 'bg-mint/20 text-mint' : 'bg-red-900/50 text-red-300'
                  }`}
                >
                  {hasImages ? `${all.length} visuals` : 'No visuals'}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 line-clamp-3">{topic.summary}</p>

              {/* thumbnails */}
              {hasImages && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {thumbs.map((im, iIdx) => (
                    <button
                      key={`${tIdx}-${iIdx}`}
                      onClick={() => openLightbox(tIdx, iIdx)}
                      className="group relative block rounded-md overflow-hidden border border-white/10 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      aria-label={`Open slideshow for ${topic.title} image ${iIdx + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={im.href}
                        alt={im.title || `Preview ${iIdx + 1}`}
                        className="w-full h-16 object-cover group-hover:scale-[1.03] transition-transform duration-200"
                        loading="lazy"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    if (hasImages) openLightbox(tIdx, 0);
                  }}
                  className="px-2 py-1 text-xs rounded bg-sky-900/50 hover:bg-sky-700/70 disabled:opacity-50"
                  disabled={!hasImages}
                >
                  View slideshow
                </button>
                <button
                  onClick={() => onSelect(topic, 0)}
                  className="px-2 py-1 text-xs rounded bg-mint/20 text-mint hover:bg-mint/30 disabled:opacity-50"
                  disabled={!hasImages}
                >
                  Learn this
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox / slideshow */}
      {open && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3"
          role="dialog"
          aria-modal="true"
          aria-label="Topic slideshow"
          onClick={closeLightbox}
        >
          <div
            className="tg-slide relative w-full max-w-4xl bg-slate-900/90 border border-white/10 rounded-2xl p-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-sky font-bold">
                {topics[activeTopicIdx]?.title}
              </div>
              <button
                className="text-slate-300 hover:text-white text-sm"
                onClick={closeLightbox}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Slide */}
            <div className="relative aspect-video bg-black/30 rounded-xl overflow-hidden border border-white/10">
              {imagesForActive[activeImageIdx] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagesForActive[activeImageIdx].href}
                  alt={imagesForActive[activeImageIdx].title || 'Slide'}
                  className="w-full h-full object-contain bg-slate-950"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">No image</div>
              )}

              {/* Prev / Next */}
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-800/70 hover:bg-slate-700/80 border border-white/10"
                onClick={prev}
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-800/70 hover:bg-slate-700/80 border border-white/10"
                onClick={next}
                aria-label="Next"
              >
                ›
              </button>
            </div>

            {/* Caption + actions */}
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-xs text-slate-300">
                {imagesForActive[activeImageIdx]?.title || 'Untitled'} • {activeImageIdx + 1}/{count || 0}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onSelect(topics[activeTopicIdx], activeImageIdx)}
                  className="px-3 py-1 text-xs rounded bg-mint/20 text-mint hover:bg-mint/30"
                >
                  Learn this
                </button>
                <button
                  onClick={closeLightbox}
                  className="px-3 py-1 text-xs rounded bg-slate-800/70 hover:bg-slate-700/80 border border-white/10"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Dots */}
            {count > 1 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {imagesForActive.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIdx(i)}
                    className={`h-2 w-2 rounded-full ${i === activeImageIdx ? 'bg-mint' : 'bg-slate-600 hover:bg-slate-500'}`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
