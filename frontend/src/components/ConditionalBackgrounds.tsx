// app/components/ConditionalBackgrounds.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import AppBackground from '@/components/AppBackground';
import SolarSystemBackground from '@/components/SolarSystemBackground';

/**
 * Optional background URL (e.g., APOD) passed from the server.
 * If `loadAfterWarp` is true, the component can also fetch /api/apod
 * on a custom "warp complete" event to avoid loading during heavy animations.
 */
type Props = {
  url?: string;
  loadAfterWarp?: boolean;
  warpEventName?: string;
  /** When true (default), skip client fetch while tab is hidden to prevent wasted work */
  deferUntilVisible?: boolean;
  /** When true (default), allow prefetch on idle if no bg is present yet */
  prefetchOnIdle?: boolean;
  /** Custom endpoint (default '/api/apod') */
  apodEndpoint?: string;
  /** Milliseconds to keep a successful bg in a module cache (default 6h) */
  maxCacheAgeMs?: number;
};

/* ------------------------------ Config & helpers ------------------------------ */

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_BG === '1';

// Tiny module-level cache to prevent re-fetching APOD on every navigation
let cachedBgUrl: string | undefined;
let cachedAt = 0;

function log(...args: any[]) {
  if (DEBUG) console.log('[ConditionalBackgrounds]', ...args);
}

function warn(...args: any[]) {
  if (DEBUG) console.warn('[ConditionalBackgrounds]', ...args);
}

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function runOnIdle(cb: () => void, timeout = 1200) {
  // @ts-ignore
  const ric: ((cb: () => void, opts?: { timeout?: number }) => number) =
    typeof window !== 'undefined' && (window as any).requestIdleCallback;
  if (ric) return ric(cb, { timeout });
  const id = setTimeout(cb, timeout);
  return id as unknown as number;
}

function cancelIdle(handle: number) {
  // @ts-ignore
  const cic = typeof window !== 'undefined' && (window as any).cancelIdleCallback;
  if (cic) return cic(handle);
  clearTimeout(handle as unknown as ReturnType<typeof setTimeout>);
}

/* ------------------------------ Component ------------------------------ */

export default function ConditionalBackgrounds({
  url,
  loadAfterWarp = false,
  warpEventName = 'warp:done',
  deferUntilVisible = true,
  prefetchOnIdle = true,
  apodEndpoint = '/api/apod',
  maxCacheAgeMs = 6 * 60 * 60 * 1000, // 6 hours
}: Props) {
  const pathname = usePathname();
  const motionReduced = prefersReducedMotion();

  // Source of truth is the server-provided url first; normalize nullish to undefined
  const serverUrl = useMemo(() => url ?? undefined, [url]);

  const [bg, setBg] = useState<string | undefined>(() => {
    // prefer server-provided; otherwise fall back to fresh-ish cache
    if (serverUrl) return serverUrl;
    if (cachedBgUrl && now() - cachedAt < maxCacheAgeMs) return cachedBgUrl;
    return undefined;
  });

  // keep local state in sync with prop updates
  useEffect(() => {
    setBg(serverUrl);
    if (serverUrl) {
      cachedBgUrl = serverUrl;
      cachedAt = now();
    }
  }, [serverUrl, maxCacheAgeMs]);

  /* ------------------------------ Fetch logic ------------------------------ */

  const abortRef = useRef<AbortController | null>(null);
  const idleHandleRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(false);

  async function fetchApodOnce(): Promise<void> {
    if (bg) {
      log('bg already set, skipping fetch');
      return;
    }
    if (cachedBgUrl && now() - cachedAt < maxCacheAgeMs) {
      log('using cached bgUrl');
      setBg(cachedBgUrl);
      return;
    }

    if (deferUntilVisible && typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      log('tab hidden; deferring fetch');
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      // Use force-cache so the CDN/SWR header from the API can do its job.
      const res = await fetch(apodEndpoint, { cache: 'force-cache', signal: ctrl.signal });
      if (!res.ok) {
        warn(apodEndpoint, 'responded with', res.status);
        return;
      }
      const json = (await res.json().catch(() => null)) as { bgUrl?: string | null } | null;
      const next = json?.bgUrl ? String(json.bgUrl) : undefined;
      if (next) {
        cachedBgUrl = next;
        cachedAt = now();
        if (mountedRef.current) {
          setBg(next);
        }
        log('APOD bg applied:', next);
      } else {
        warn(apodEndpoint, 'returned no bgUrl');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        log('fetch aborted');
      } else {
        warn('Failed to fetch APOD bg:', err);
      }
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
    }
  }

  // Manual refresh hook via custom event (e.g., window.dispatchEvent(new Event('bg:refresh')))
  useEffect(() => {
    mountedRef.current = true;
    function onRefresh() {
      fetchApodOnce();
    }
    window.addEventListener('bg:refresh', onRefresh);
    return () => {
      mountedRef.current = false;
      window.removeEventListener('bg:refresh', onRefresh);
      abortRef.current?.abort();
      abortRef.current = null;
      if (idleHandleRef.current != null) {
        cancelIdle(idleHandleRef.current);
        idleHandleRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optionally fetch APOD after the warp event (only if route uses AppBackground)
  useEffect(() => {
    if (!loadAfterWarp) return;
    if (pathname === '/about') return; // we're showing SolarSystemBackground instead

    const onWarpDone = () => {
      fetchApodOnce();
    };

    // If animations are reduced, we can fetch immediately rather than waiting for warp.
    if (motionReduced) {
      fetchApodOnce();
      return;
    }

    // Listen for a single warp completion
    window.addEventListener(warpEventName, onWarpDone, { once: true });
    return () => window.removeEventListener(warpEventName, onWarpDone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAfterWarp, warpEventName, pathname, motionReduced]);

  // Optional: prefetch on idle if we still don't have a bg (and not on /about)
  useEffect(() => {
    if (!prefetchOnIdle) return;
    if (pathname === '/about') return;
    if (bg) return;

    idleHandleRef.current = runOnIdle(() => {
      idleHandleRef.current = null;
      fetchApodOnce();
    });

    return () => {
      if (idleHandleRef.current != null) {
        cancelIdle(idleHandleRef.current);
        idleHandleRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefetchOnIdle, pathname, bg]);

  /* ------------------------------ Route-based selection ------------------------------ */

  if (pathname === '/about') {
    log('route=/about → SolarSystemBackground');
    return <SolarSystemBackground />;
  }

  log('route=', pathname, 'bg=', bg);
  // If users prefer reduced motion, let AppBackground decide whether to warp or not.
  return <AppBackground url={bg} warpOnLoad={!motionReduced} />;
}
