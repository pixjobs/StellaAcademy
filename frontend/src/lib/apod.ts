// Simplified APOD fetcher for educational purposes
// No server-only directive needed since we're not using secrets

// Types
export type Apod = {
  date: string;
  title: string;
  explanation: string;
  mediaType: 'image' | 'video';
  bgUrl: string;
  credit: string;
};

interface NasaApodResponse {
  date: string;
  title: string;
  explanation: string;
  media_type: 'image' | 'video';
  url: string;
  copyright: string | null;
}

/** Real pictures are hosted under apod.nasa.gov/apod/image/; anything else is not the picture of the day. */
function isRealApodImage(data: NasaApodResponse): boolean {
  if (data.media_type !== 'image' || typeof data.url !== 'string') return false;
  try {
    const url = new URL(data.url);
    return url.hostname === 'apod.nasa.gov' && url.pathname.startsWith('/apod/image/') && !/logo/i.test(url.pathname);
  } catch {
    return false;
  }
}

/**
 * Simple APOD fetcher for educational website
 * No caching, no secrets, no complex setup
 */
export async function getApod(): Promise<Apod | null> {
  const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';

  try {
    const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      throw new Error(`APOD API error: ${response.status}`);
    }

    const data = (await response.json()) as NasaApodResponse;

    // The API sometimes answers with a placeholder (in October 2026 every day came back as
    // "NASA Science" with NASA's logo as the picture). Only accept a real APOD image.
    if (!isRealApodImage(data)) {
      throw new Error(`APOD returned a placeholder: ${data.title} (${data.url})`);
    }

    return {
      date: data.date,
      title: data.title,
      explanation: data.explanation,
      mediaType: data.media_type,
      bgUrl: data.url,
      credit: data.copyright || 'NASA / Public Domain',
    };
  } catch (error) {
    console.warn('[apod] Failed to fetch APOD, using fallback:', error instanceof Error ? error.message : error);
    return {
      date: new Date().toISOString().slice(0, 10),
      title: 'Cosmic Deep Field',
      explanation: 'Deep space stars and nebulosity background.',
      mediaType: 'image',
      bgUrl: '/bg.jpg',
      credit: 'Stella Academy',
    };
  }
}
