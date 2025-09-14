/* eslint-disable no-console */
import { fetchAPOD } from '@/lib/nasa';

export type ApodLite = {
  title?: string;
  explanation?: string;
  url?: string;
  hdurl?: string;
  bgUrl?: string; // some libs expose APOD bg as bgUrl
};

/** Thin wrapper that normalizes APOD fields and never throws. */
export async function getApod(): Promise<ApodLite | null> {
  try {
    const raw = await fetchAPOD();
    if (!raw || typeof raw !== 'object') return null;
    const a = raw as Record<string, unknown>;
    const title = typeof a.title === 'string' ? a.title : undefined;
    const explanation = typeof a.explanation === 'string' ? a.explanation : undefined;
    const url = typeof a.url === 'string' ? a.url : undefined;
    const hdurl = typeof a.hdurl === 'string' ? a.hdurl : undefined;
    const bgUrl = typeof (a as { bgUrl?: unknown }).bgUrl === 'string' ? (a as { bgUrl: string }).bgUrl : undefined;
    return { title, explanation, url: bgUrl || url || hdurl, hdurl, bgUrl };
  } catch (e) {
    console.warn('[apis/apod] APOD fetch failed:', e);
    return null;
  }
}

export default getApod;
