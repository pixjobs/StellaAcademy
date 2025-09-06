// app/components/ConditionalBackgrounds.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import AppBackground from '@/components/AppBackground';
import SolarSystemBackground from '@/components/SolarSystemBackground';

type Props = {
  /** Optional background URL (e.g., APOD) passed from the server */
  url?: string;
  /** If true, attempt to fetch APOD bg after a warp event fires on window */
  loadAfterWarp?: boolean;
  /** The custom event name your GSAP warp dispatches when complete */
  warpEventName?: string;
};

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_BG === '1';

export default function ConditionalBackgrounds({
  url,
  loadAfterWarp = false,
  warpEventName = 'warp:done',
}: Props) {
  const pathname = usePathname();
  // Normalize `url` to undefined to avoid React prop warnings
  const initial = useMemo(() => (url ?? undefined), [url]);
  const [bg, setBg] = useState<string | undefined>(initial);

  // Keep local state in sync with prop updates
  useEffect(() => {
    setBg(url ?? undefined);
  }, [url]);

  // Optionally fetch APOD after the warp event (only if route uses AppBackground)
  useEffect(() => {
    if (!loadAfterWarp) return;
    if (pathname === '/about') return; // we're showing SolarSystemBackground instead

    const onWarpDone = async () => {
      try {
        // If you don't have this API route, this will just warn and do nothing.
        const res = await fetch('/api/apod', { cache: 'force-cache' });
        if (!res.ok) {
          if (DEBUG) console.warn('[ConditionalBackgrounds] /api/apod responded', res.status);
          return;
        }
        const json = await res.json().catch(() => null);
        if (json?.bgUrl) {
          setBg(String(json.bgUrl));
          if (DEBUG) console.log('[ConditionalBackgrounds] APOD bg applied:', json.bgUrl);
        } else if (DEBUG) {
          console.warn('[ConditionalBackgrounds] /api/apod returned no bgUrl');
        }
      } catch (err) {
        if (DEBUG) console.warn('[ConditionalBackgrounds] Failed to fetch APOD bg:', err);
      }
    };

    window.addEventListener(warpEventName, onWarpDone, { once: true });
    return () => window.removeEventListener(warpEventName, onWarpDone);
  }, [loadAfterWarp, warpEventName, pathname]);

  // Route-based selection
  if (pathname === '/about') {
    if (DEBUG) console.log('[ConditionalBackgrounds] route=/about → SolarSystemBackground');
    return <SolarSystemBackground />;
  }

  // Default app background (with warp + optional bg url)
  if (DEBUG) console.log('[ConditionalBackgrounds] route=', pathname, 'bg=', bg);
  return <AppBackground url={bg} warpOnLoad />;
}
