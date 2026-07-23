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
  const apiKey = process.env.NASA_API_KEY || '';
  
  if (!apiKey) {
    console.warn('[apod] No NASA_API_KEY configured, returning null');
    return null;
  }

  try {
    const date = new Date().toISOString().slice(0, 10);
    const response = await fetch(`https://api.nasa.gov/planetary/apod?date=${date}&api_key=${apiKey}`);
    
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
      credit: data.copyright || 'Public',
    };
  } catch (error) {
    console.warn('[apod] Failed to fetch APOD:', error instanceof Error ? error.message : error);
    return null;
  }
}
