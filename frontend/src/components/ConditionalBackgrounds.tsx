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

// [FIXED] Define a type for the window object that includes non-standard idle callback functions.
type WindowWithIdleCallback = Window & {
  requestIdleCallback: (
    callback: () => void,
    options?: { timeout?: number }
  ) => number;
  cancelIdleCallback: (handle: number) => void;
};

// Tiny module-level cache to prevent re-fetching APOD on every navigation
let cachedBgUrl: string | undefined;
let cachedAt = 0;

// [FIXED] Use 'unknown[]' for safer generic logging.
function log(...args: unknown[]) {
  if (DEBUG) console.log('[ConditionalBackgrounds]', ...args);
}

// [FIXED] Use 'unknown[]' for safer generic logging.
function warn(...args: unknown[]) {
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
  // [FIXED] Check for requestIdleCallback in a type-safe way. No need for @ts-ignore or `any`.
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    const win = window as WindowWithIdleCallback;
    return win.requestIdleCallback(cb, { timeout });
  }
  const id = setTimeout(cb, timeout);
  return id as unknown as number;
}

function cancelIdle(handle: number) {
  // [FIXED] Check for cancelIdleCallback in a type-safe way.
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    const win = window as WindowWithIdleCallback;
    return win.cancelIdleCallback(handle);
  }
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

  const serverUrl = useMemo(() => url ?? undefined, [url]);

  const [bg, setBg] = useState<string | undefined>(() => {
    if (serverUrl) return serverUrl;
    if (cachedBgUrl && now() - cachedAt < maxCacheAgeMs) return cachedBgUrl;
    return undefined;
  });

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
    } catch (err: unknown) { // [FIXED] Catch as 'unknown' for type safety.
      // [FIXED] Safely check if the error is an AbortError.
      if (err instanceof Error && err.name === 'AbortError') {
        log('fetch aborted');
      } else {
        warn('Failed to fetch APOD bg:', err);
      }
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
    }
  }

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

  useEffect(() => {
    if (!loadAfterWarp) return;
    if (pathname === '/about') return;

    const onWarpDone = () => {
      fetchApodOnce();
    };

    if (motionReduced) {
      fetchApodOnce();
      return;
    }

    window.addEventListener(warpEventName, onWarpDone, { once: true });
    return () => window.removeEventListener(warpEventName, onWarpDone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAfterWarp, warpEventName, pathname, motionReduced]);

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
  return <AppBackground url={bg} warpOnLoad={!motionReduced} />;
}