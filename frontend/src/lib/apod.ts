import 'server-only';
import { getNasaApiKey } from './secrets';

export type Apod = {
  date: string; title: string; explanation: string;
  mediaType: string; bgUrl: string | null; credit: string;
};

const REVALIDATE_SECONDS = 60 * 60 * 24;

export async function getApod(): Promise<Apod | null> {
  try {
    const key = await getNasaApiKey();
    const r = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(key)}&thumbs=true`,
      { next: { revalidate: REVALIDATE_SECONDS } }
    );
    if (!r.ok) return null;
    const apod = await r.json();
    const bgUrl =
      apod.media_type === 'image' ? (apod.hdurl || apod.url) :
      apod.thumbnail_url || null;

    return {
      date: apod.date,
      title: apod.title,
      explanation: apod.explanation,
      mediaType: apod.media_type,
      bgUrl,
      credit: apod.copyright || 'NASA/APOD',
    };
  } catch {
    return null;
  }
}
