'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import AppBackground from '@/components/AppBackground';

type Props = {
  url?: string;                 // optional server-injected APOD URL
  apodEndpoint?: string;        // defaults to '/api/apod'
  maxCacheAgeMs?: number;       // defaults to 6h
  deferUntilVisible?: boolean;  // defaults to true
};

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_BG === '1';

// tiny module cache shared across navigations
let cachedBgUrl: string | undefined;
let cachedAt = 0;

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
function log(...args: unknown[]) {
  if (DEBUG) console.log('[ConditionalBackgrounds]', ...args);
}
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ConditionalBackgrounds({
  url,
  apodEndpoint = '/api/apod',
  maxCacheAgeMs = 6 * 60 * 60 * 1000,
  deferUntilVisible = true,
}: Props) {
  const pathname = usePathname();
  const isAbout = (pathname ?? '').startsWith('/about');

  // ✅ Hooks are called unconditionally — no early returns above this line
  const motionReduced = useMemo(prefersReducedMotion, []);
  const serverUrl = useMemo(() => url ?? undefined, [url]);

  const [bg, setBg] = useState<string | undefined>(() => {
    if (serverUrl) return serverUrl;
    if (cachedBgUrl && now() - cachedAt < maxCacheAgeMs) return cachedBgUrl;
    return undefined;
  });

  const abortRef = useRef<AbortController | null>(null);

  // Apply server-provided URL (and cache it)
  useEffect(() => {
    if (!serverUrl) return;
    setBg(serverUrl);
    cachedBgUrl = serverUrl;
    cachedAt = now();
  }, [serverUrl, maxCacheAgeMs]);

  // Client fetch (skipped on /about)
  useEffect(() => {
    if (isAbout) return;        // let AboutContent own the background
    if (bg) return;             // already have one
    if (!apodEndpoint) return;

    if (
      deferUntilVisible &&
      typeof document !== 'undefined' &&
      document.visibilityState !== 'visible'
    ) {
      const onVisible = () => {
        if (document.visibilityState === 'visible') {
          document.removeEventListener('visibilitychange', onVisible);
          // retrigger effect by touching state
          setBg((prev) => prev ?? undefined);
        }
      };
      document.addEventListener('visibilitychange', onVisible);
      return () => document.removeEventListener('visibilitychange', onVisible);
    }

    if (cachedBgUrl && now() - cachedAt < maxCacheAgeMs) {
      setBg(cachedBgUrl);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      try {
        const res = await fetch(apodEndpoint, { cache: 'force-cache', signal: ctrl.signal });
        if (!res.ok) {
          log(apodEndpoint, 'HTTP', res.status);
          return;
        }
        const json = (await res.json().catch(() => null)) as { bgUrl?: string | null } | null;
        const next = json?.bgUrl ? String(json.bgUrl) : undefined;
        if (next) {
          cachedBgUrl = next;
          cachedAt = now();
          setBg(next);
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') log('fetch aborted');
        else log('APOD fetch failed', e);
      } finally {
        if (abortRef.current === ctrl) abortRef.current = null;
      }
    })();

    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [isAbout, bg, apodEndpoint, maxCacheAgeMs, deferUntilVisible]);

  // ✅ Only branch in JSX — hook order stays identical every render
  return isAbout ? null : <AppBackground url={bg} warpOnLoad={!motionReduced} />;
}
