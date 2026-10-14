'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useEffect, useSyncExternalStore } from 'react';
import { GA_ID } from '@/lib/site';

const CONSENT_KEY = 'stella-analytics-consent';

type Consent = 'granted' | 'denied';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// The visitor's choice lives in localStorage; `session` covers browsers where storage is unavailable.
let session: Consent | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readConsent(): Consent | null {
  if (session) return session;
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

const unknownOnServer = () => undefined;

/** Forget the visitor's choice, so the banner asks again (the "change your cookie choice" button on /privacy). */
export function resetConsent() {
  session = null;
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* storage unavailable: nothing was saved */
  }
  window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
  listeners.forEach((listener) => listener());
}

function applyConsent(value: Consent) {
  window.gtag?.('consent', 'update', { analytics_storage: value });
}

/**
 * Google Analytics 4 with Consent Mode: analytics storage is denied by default
 * and only granted once the visitor accepts (UK PECR / GDPR).
 */
export default function Analytics() {
  // undefined until the browser has been asked, so the banner never flashes for someone who has already chosen.
  const choice = useSyncExternalStore<Consent | null | undefined>(subscribe, readConsent, unknownOnServer);

  useEffect(() => {
    if (choice) applyConsent(choice);
  }, [choice]);

  const decide = (value: Consent) => {
    session = value;
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      /* storage unavailable: choice lasts for this page view only */
    }
    listeners.forEach((listener) => listener());
  };

  return (
    <>
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />

      {choice === null && (
        <div
          role="dialog"
          aria-label="Analytics cookies"
          className="fixed inset-x-0 bottom-0 z-[100] border-t border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 text-sm text-slate-300 sm:flex-row sm:justify-between">
            <p>
              We use Google Analytics cookies to see which lessons are useful. They are not used for
              advertising. Is that OK?{' '}
              <Link href="/privacy" className="underline decoration-white/40 underline-offset-2 hover:decoration-white">
                Privacy
              </Link>
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => decide('denied')}
                className="rounded-lg border border-white/15 px-4 py-1.5 text-slate-300 hover:bg-white/5"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => decide('granted')}
                className="rounded-lg bg-indigo-500 px-4 py-1.5 font-medium text-white hover:bg-indigo-400"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
