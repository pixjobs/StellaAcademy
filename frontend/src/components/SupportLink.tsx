'use client';

import type { ReactNode } from 'react';
import { SUPPORT_URL } from '@/lib/site';
import { track } from '@/lib/track';

/** Renders nothing until SUPPORT_URL is set, so no dead buttons ship. */
export default function SupportLink({
  placement,
  className,
  children = 'Support Stella',
}: {
  placement: string;
  className?: string;
  children?: ReactNode;
}) {
  if (!SUPPORT_URL) return null;
  return (
    <a
      href={SUPPORT_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('support_click', { placement })}
      className={
        className ??
        'inline-flex items-center justify-center rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300'
      }
    >
      {children}
    </a>
  );
}
