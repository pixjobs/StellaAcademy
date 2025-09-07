'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '@/lib/store';

type Img = { title?: string; href?: string };
type Props = {
  mission?: string;
  images?: Img[];        // pass images from page (NIVL/Mars/APOD)
  context?: string;      // OR pass a raw context string
};

export default function AskStella({ mission = 'general', images = [], context }: Props) {
  const role = useGame((s) => s.role);
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachImages, setAttachImages] = useState(images.length > 0); // default attach if we have images
  const [selected, setSelected] = useState<number | null>(null); // for clicking a thumb
  const abortRef = useRef<AbortController | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const DEBUG = process.env.NEXT_PUBLIC_DEBUG_ASK === '1';

  // Build a numbered context list when images are attached
  const builtContext = useMemo(() => {
    if (!attachImages || !images?.length) return context;
    const lines = images.slice(0, 12).map((im, i) => {
      const num = i + 1;
      return `#${num} ${im.title ?? 'Untitled'} – ${im.href ?? ''}`;
    });
    return (context ? context + '\n' : '') + lines.join('\n');
  }, [attachImages, images, context]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function onAsk(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAnswer('');
    setLoading(true);

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q || defaultPrompt(selected),
          context: builtContext,
          role,
          mission,
        }),
        signal: ac.signal,
        cache: 'no-store',
      });

      if (!res.ok || !res.body) {
        let preview = '';
        try { preview = await res.text(); } catch {}
        setError(`Server error (${res.status}). ${preview?.slice(0, 200)}`);
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (DEBUG) console.log('[ask:chunk]', chunk.replace(/\n/g, '\\n'));
        setAnswer((prev) => prev + chunk);
        queueMicrotask(() => {
          boxRef.current && (boxRef.current.scrollTop = boxRef.current.scrollHeight);
        });
      }
    } catch (err: any) {
      setError(err?.name === 'AbortError' ? 'Stopped.' : (err?.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  }

  function onStop() { abortRef.current?.abort(); }

  function defaultPrompt(sel: number | null) {
    if (sel) return `Ask me one question about image #${sel}, then give the answer for a ${role}.`;
    if (images.length) return `Give a ${role}-friendly 2-line summary of image #1.`;
    return `Introduce yourself as Stella in one sentence for a ${role}.`;
  }

  return (
    <div className="rounded-2xl bg-slate-900/60 p-4 shadow-pixel border border-white/10 backdrop-blur-md">
      <div className="flex items-center justify-between mb-2">
        <div className="font-pixel text-sm text-sky">Ask Stella</div>
        <label className="flex items-center gap-2 text-[11px] text-slate-300">
          <input
            type="checkbox"
            className="accent-sky"
            checked={attachImages}
            onChange={(e) => setAttachImages(e.target.checked)}
          />
          Attach images as context
        </label>
      </div>

      {/* Thumbnail strip (click to insert #N) */}
      {images?.length ? (
        <div className="mb-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
          {images.slice(0, 12).map((im, i) => {
            const n = i + 1;
            const isSel = selected === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setSelected(isSel ? null : n);
                  setQ((prev) => prev || `What is interesting in image #${n} for a ${role}?`);
                }}
                title={`Use image #${n}`}
                className={`relative group rounded-md overflow-hidden border ${isSel ? 'border-mint' : 'border-slate-700'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={im.href || ''}
                  alt={im.title || `Image ${n}`}
                  className="w-full h-16 object-cover"
                />
                <span
                  className={`absolute top-0 left-0 px-1.5 py-0.5 text-[10px] font-pixel
                               ${isSel ? 'bg-mint text-slate-900' : 'bg-black/60 text-white'}`}
                >
                  #{n}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <form onSubmit={onAsk} className="flex gap-2">
        <input
          className="flex-1 rounded-lg bg-slate-800/70 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-mint"
          placeholder={images.length ? 'Ask about an image (e.g., “Write a caption for #2”)' : 'Ask Stella…'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button disabled={loading} className="btn-pixel font-pixel text-xs">
          {loading ? 'Streaming…' : 'Send'}
        </button>
        {loading && (
          <button type="button" onClick={onStop} className="btn-pixel font-pixel text-xs bg-red-600/70 border-red-400/60">
            Stop
          </button>
        )}
      </form>

      {/* Streamed answer */}
      <div
        ref={boxRef}
        className="mt-3 text-sm whitespace-pre-wrap text-slate-200 min-h-[3lh] max-h-60 overflow-auto rounded-lg border border-slate-800/70 p-2 bg-slate-950/30"
      >
        {answer || (!loading && !error && 'Stella will reply here.')}
      </div>

      {error && <div className="mt-2 text-[11px] text-red-400">{error}</div>}

      {/* Context preview (helps you see what the LLM sees) */}
      {builtContext ? (
        <details className="mt-2">
          <summary className="text-[11px] text-slate-400 cursor-pointer">Show context being sent</summary>
          <pre className="mt-1 text-[11px] text-slate-300 bg-slate-950/30 p-2 rounded border border-slate-800/70 overflow-auto max-h-40">
{builtContext}
          </pre>
        </details>
      ) : null}

      <div className="mt-2 text-[11px] text-slate-500">
        Streaming via <span className="text-sky">/api/ask</span> • role <b>{role}</b> • mission <b>{mission}</b>
      </div>
    </div>
  );
}
