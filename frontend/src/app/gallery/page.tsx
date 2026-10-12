'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { SkyBand } from '@/components/Sky';
import { track } from '@/lib/track';

interface NivlItem {
  id: string;
  title: string;
  description?: string;
  sourceUrl?: string;
  thumbnailUrl?: string;
  dateCreated?: string;
  center?: string;
  keywords?: string[];
}

const PER_PAGE = 12;

const SUGGESTIONS = [
  { label: 'Nebulae', query: 'nebula' },
  { label: 'James Webb', query: 'webb' },
  { label: 'Hubble', query: 'hubble' },
  { label: 'Apollo', query: 'apollo' },
  { label: 'Mars rovers', query: 'mars rover' },
  { label: 'Jupiter and Saturn', query: 'jupiter saturn' },
];

type Results =
  | { status: 'loading' }
  | { status: 'failed'; message: string }
  | { status: 'ready'; items: NivlItem[] };

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6c453]';

const year = (item: NivlItem) => (item.dateCreated ? item.dateCreated.slice(0, 4) : '');

function longDate(iso?: string): string {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** NASA serves each picture in several sizes; the thumbnail's address gives the larger one. */
const largerImage = (thumbnailUrl?: string) => (thumbnailUrl ?? '').replace(/~(thumb|small)/, '~medium');

/** NASA's descriptions are plain text with bare web addresses in them. */
function Description({ text }: { text: string }) {
  const paragraphs = text.split('\n').filter((p) => p.trim() !== '');
  return (
    <>
      {paragraphs.map((paragraph, i) => (
        <p key={i}>
          {paragraph.split(/(https?:\/\/[^\s]+)/g).map((part, j) =>
            /^https?:\/\//.test(part) ? (
              <a key={j} href={part} target="_blank" rel="noopener noreferrer" className="break-all text-[#a5b4fc] underline underline-offset-4 hover:text-white">
                {part}
              </a>
            ) : (
              <span key={j}>{part}</span>
            ),
          )}
        </p>
      ))}
    </>
  );
}

function Picture({ item, onClose }: { item: NivlItem; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  // A modal <dialog> brings its own focus handling, Escape to close and inert page behind.
  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      aria-labelledby="picture-title"
      className="m-auto max-h-[92vh] w-[min(92vw,56rem)] overflow-y-auto rounded-2xl border border-white/15 bg-[#0b1026] p-0 text-slate-200 backdrop:bg-black/80"
    >
      <div className="bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element -- size is unknown and the fallback swaps the address by hand */}
        <img
          src={largerImage(item.thumbnailUrl)}
          alt={item.title}
          onError={(e) => {
            if (item.thumbnailUrl && e.currentTarget.src !== item.thumbnailUrl) e.currentTarget.src = item.thumbnailUrl;
          }}
          className="max-h-[62vh] w-full object-contain"
        />
      </div>
      <div className="p-6 sm:p-8">
        <h2 id="picture-title" className="font-fraunces text-3xl font-semibold leading-tight text-white">
          {item.title}
        </h2>
        <p className="mt-2 text-slate-300">
          {[item.center ? `NASA ${item.center}` : 'NASA', longDate(item.dateCreated)].filter(Boolean).join(', ')}
        </p>
        <div className="mt-5 space-y-4 text-lg leading-relaxed">
          {item.description ? <Description text={item.description} /> : <p>NASA has not written a description for this picture.</p>}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className={`rounded-full bg-[#a5b4fc] px-6 py-2.5 font-semibold text-[#0b1026] hover:bg-white ${FOCUS_RING}`}
          >
            Close
          </button>
          <a
            href={`https://images.nasa.gov/details/${encodeURIComponent(item.id)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`font-semibold text-[#a5b4fc] underline decoration-2 underline-offset-4 hover:text-white ${FOCUS_RING}`}
          >
            See it on images.nasa.gov
          </a>
        </div>
      </div>
    </dialog>
  );
}

export default function GalleryPage() {
  const [query, setQuery] = useState('nebula');
  const [typed, setTyped] = useState('');
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [results, setResults] = useState<Results>({ status: 'loading' });
  const [open, setOpen] = useState<NivlItem | null>(null);

  useEffect(() => {
    let current = true;
    fetch('/api/search-nasa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, page, limit: PER_PAGE }),
    })
      .then(async (response) => {
        if (!current) return;
        if (response.status === 429) {
          setResults({ status: 'failed', message: 'That was a lot of searches in a short time. Wait a minute, then try again.' });
        } else if (!response.ok) {
          setResults({ status: 'failed', message: 'NASA’s image library did not answer. Try again in a moment.' });
        } else {
          const items = (await response.json()) as NivlItem[];
          if (current) setResults({ status: 'ready', items });
        }
      })
      .catch(() => {
        if (current) setResults({ status: 'failed', message: 'The search could not be reached. Check your connection and try again.' });
      });
    return () => {
      current = false;
    };
  }, [query, page, attempt]);

  const show = (nextQuery: string, nextPage: number) => {
    if (nextQuery === query && nextPage === page) return;
    setResults({ status: 'loading' });
    setQuery(nextQuery);
    setPage(nextPage);
  };

  const search = (wanted: string) => {
    const cleaned = wanted.trim();
    if (!cleaned) return;
    track('gallery_search', { query: cleaned.slice(0, 60) });
    show(cleaned, 1);
  };

  const items = results.status === 'ready' ? results.items : [];

  return (
    <>
      <SkyBand>
        <h1 className="font-fraunces text-5xl font-semibold leading-[1.04] tracking-[-0.025em] text-white sm:text-6xl">
          NASA image gallery
        </h1>
        <p className="mt-4 max-w-2xl text-xl leading-relaxed text-slate-200">
          Search NASA&rsquo;s own picture library: nebulae, rockets, rovers, planets and the people who fly to them.
        </p>

        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            search(typed);
          }}
          className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
        >
          <label className="block flex-1">
            <span className="sr-only">Search NASA pictures</span>
            <input
              type="search"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              maxLength={200}
              placeholder="Search NASA pictures, e.g. Saturn"
              className="w-full rounded-full border border-white/25 bg-[#0b1026]/80 px-5 py-3 text-lg text-white placeholder-slate-400 focus:border-[#a5b4fc] focus:outline-none focus:ring-2 focus:ring-[#a5b4fc]/40"
            />
          </label>
          <button type="submit" className={`rounded-full bg-[#a5b4fc] px-7 py-3 text-lg font-semibold text-[#0b1026] hover:bg-white ${FOCUS_RING}`}>
            Search
          </button>
        </form>

        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Suggested searches">
          {SUGGESTIONS.map((s) => {
            const active = s.query === query;
            return (
              <button
                key={s.query}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setTyped('');
                  search(s.query);
                }}
                className={`rounded-full border px-4 py-1.5 text-[15px] font-semibold ${FOCUS_RING} ${
                  active ? 'border-white bg-white text-[#0b1026]' : 'border-white/30 text-white hover:border-white'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </SkyBand>

      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <p className="text-lg text-slate-300" aria-live="polite">
          {results.status === 'loading' && `Searching for “${query}”…`}
          {results.status === 'ready' &&
            (items.length === 0 ? `Nothing found for “${query}”. Try a shorter or different search.` : `Pictures for “${query}”, page ${page}`)}
        </p>

        {results.status === 'failed' && (
          <div role="alert" className="mt-4 rounded-2xl border border-white/15 bg-[#0b1026] p-6 text-lg text-white">
            <p>{results.message}</p>
            <button
              type="button"
              onClick={() => {
                setResults({ status: 'loading' });
                setAttempt((n) => n + 1);
              }}
              className={`mt-3 font-semibold text-[#a5b4fc] underline decoration-2 underline-offset-4 hover:text-white ${FOCUS_RING}`}
            >
              Try again
            </button>
          </div>
        )}

        {results.status === 'loading' && (
          <ul aria-hidden="true" className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="aspect-[4/3] rounded-2xl border border-white/10 bg-[#0b1026]" />
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <>
            <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <li key={item.id} className="flex">
                  <button
                    type="button"
                    onClick={() => {
                      track('gallery_picture_opened', { nasa_id: item.id.slice(0, 60) });
                      setOpen(item);
                    }}
                    className={`group flex w-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0b1026] text-left hover:border-white/50 ${FOCUS_RING}`}
                  >
                    <span className="relative block aspect-[4/3] w-full bg-black">
                      {item.thumbnailUrl && (
                        <Image src={item.thumbnailUrl} alt="" fill unoptimized sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                      )}
                    </span>
                    <span className="flex flex-1 flex-col p-4">
                      <span className="font-fraunces text-xl font-semibold leading-snug text-white group-hover:underline">{item.title}</span>
                      <span className="mt-1 text-[15px] text-slate-300">
                        {[item.center ? `NASA ${item.center}` : 'NASA', year(item)].filter(Boolean).join(', ')}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <nav aria-label="Pages of results" className="mt-8 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => show(query, page - 1)}
                disabled={page === 1}
                className={`rounded-full border border-white/30 px-5 py-2.5 font-semibold text-white hover:border-white disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING}`}
              >
                Previous page
              </button>
              <button
                type="button"
                onClick={() => show(query, page + 1)}
                disabled={items.length < PER_PAGE || page >= 50}
                className={`rounded-full border border-white/30 px-5 py-2.5 font-semibold text-white hover:border-white disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING}`}
              >
                Next page
              </button>
            </nav>
          </>
        )}

        <p className="mt-10 max-w-2xl leading-relaxed text-slate-400">
          Every picture here comes from the NASA Image and Video Library. Stella Academy is not part of NASA and is not
          endorsed by it.
        </p>
      </div>

      {open && <Picture key={open.id} item={open} onClose={() => setOpen(null)} />}
    </>
  );
}
