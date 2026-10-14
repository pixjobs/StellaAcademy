'use client';

import { useState } from 'react';
import { resetConsent } from '@/components/Analytics';

/** On /privacy: forget the visitor's cookie choice so the banner asks again. */
export default function CookieChoice() {
  const [done, setDone] = useState(false);
  return (
    <p className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => {
          resetConsent();
          setDone(true);
        }}
        className="rounded-full border border-[var(--rule)] px-4 py-1.5 font-semibold text-[var(--ink)] hover:border-[var(--ink)]"
      >
        Change your cookie choice
      </button>
      {done && (
        <span role="status" className="text-[var(--ink-soft)]">
          Done. Choose again in the banner at the bottom of the page.
        </span>
      )}
    </p>
  );
}
