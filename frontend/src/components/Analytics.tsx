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
  applyConsent('denied');
  listeners.forEach((listener) => listener());
}

function applyConsent(value: Consent) {
  // Google's switch for turning the tag off completely. Without it, a tag that loaded after Accept would keep sending
  // cookieless pings for the rest of the visit once consent is withdrawn.
  (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = value === 'denied';
  window.gtag?.('consent', 'update', { analytics_storage: value });
  if (value === 'denied') clearAnalyticsCookies();
}

/** Delete Google Analytics' cookies (_ga, _ga_<id>) after consent is withdrawn, on this host and the parent domain. */
function clearAnalyticsCookies() {
  const host = window.location.hostname;
  const domains = ['', host, host.replace(/^www\./, '.')];
  for (const name of document.cookie.split(';').map((c) => c.split('=')[0].trim())) {
    if (!name.startsWith('_ga')) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
    }
  }
}

/**
 * Google Analytics 4, loaded only after the visitor presses Accept (UK PECR /
 * GDPR and the ICO Children's Code). Until then, and after Decline, no Google
 * script loads and nothing is sent: lesson events go nowhere because
 * window.gtag does not exist. Withdrawing consent later deletes the cookies.
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
      {choice === 'granted' && (
        <>
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window['ga-disable-${GA_ID}'] = false;
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('consent', 'default', {
                analytics_storage: 'granted',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
              });
              gtag('set', 'allow_google_signals', false);
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        </>
      )}

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
            {/* Decline and Accept look the same on purpose: the Children's Code asks for no nudging. */}
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => decide('denied')}
                className="rounded-lg border border-white/40 px-4 py-1.5 font-medium text-white hover:bg-white/10"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => decide('granted')}
                className="rounded-lg border border-white/40 px-4 py-1.5 font-medium text-white hover:bg-white/10"
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
