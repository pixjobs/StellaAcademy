/**
 * Send a Google Analytics event. A no-op until gtag has loaded; with consent
 * denied GA records it without cookies (see components/Analytics.tsx).
 */
export function track(event: string, params?: Record<string, string | number>) {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', event, params);
}
