// Simplified APOD fetcher for educational purposes
// No server-only directive needed since we're not using secrets
import { NextResponse } from 'next/server';

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

/**
 * Simple APOD fetcher for educational website
 * No caching, no secrets, no complex setup
 */
export async function getApod(): Promise<Apod | null> {
  const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';

  try {
    const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`, {
      next: { revalidate: 86400 }
    });
    
    if (!response.ok) {
      throw new Error(`APOD API error: ${response.status}`);
    }

    const data = (await response.json()) as NasaApodResponse;
    
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
