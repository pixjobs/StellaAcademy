// app/layout.tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Providers from './providers';

export const metadata: Metadata = { title: 'Stella Academy' };

/**
 * Keep this dynamic so Clerk reads env at runtime (no build-time key needed).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RootLayoutProps = { children: ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
  const useApod = process.env.USE_APOD_BG === 'true';

  let bgUrl: string | undefined;
  if (useApod) {
    // Simple APOD fetch without secrets (educational use)
    const apiKey = process.env.NASA_API_KEY || '';
    if (apiKey) {
      try {
        const date = new Date().toISOString().slice(0, 10);
        const response = await fetch(`https://api.nasa.gov/planetary/apod?date=${date}&api_key=${apiKey}`);
        if (response.ok) {
          const data = await response.json();
          bgUrl = data.url || undefined;
        }
      } catch (err) {
        console.warn('[layout] Failed to load APOD background:', err);
      }
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={[
          'min-h-screen bg-background text-foreground antialiased',
          'overflow-x-hidden',
          'selection:bg-accent selection:text-accent-foreground',
        ].join(' ')}
      >
        {/* Wrap the whole app in Providers if needed - currently just passes children */}
        <Providers>
          <div className="relative z-20 flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
