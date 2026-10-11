'use client';

import type { ReactNode } from 'react';
import { track } from '@/lib/track';

/** A reveal ("Show the answer") that records the first time it is opened. */
export default function TrackedDetails({
  summary,
  event,
  params,
  children,
}: {
  summary: string;
  event: string;
  params?: Record<string, string | number>;
  children: ReactNode;
}) {
  return (
    <details
      onToggle={(e) => {
        if (e.currentTarget.open) track(event, params);
      }}
    >
      <summary className="cursor-pointer font-semibold text-[var(--action)] hover:text-[var(--action-hover)]">{summary}</summary>
      {children}
    </details>
  );
}
