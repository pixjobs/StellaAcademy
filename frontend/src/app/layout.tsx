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

import AccessibilityWrapper from '@/components/AccessibilityWrapper';

export default async function RootLayout({ children }: RootLayoutProps) {
  let bgUrl = '/bg.jpg';
  
  try {
    const res = await fetch('http://localhost:3000/api/apod', { cache: 'no-store' }).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      if (data && data.bgUrl) {
        bgUrl = data.bgUrl;
      }
    }
  } catch (err) {
    // silently fallback
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={[
          'min-h-screen bg-slate-950 text-slate-100 antialiased',
          'overflow-x-hidden',
          'selection:bg-accent selection:text-accent-foreground',
        ].join(' ')}
      >
        <AccessibilityWrapper>
          <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute -inset-[10%] opacity-25 bg-cover bg-center bg-no-repeat mix-blend-screen animate-apod-slow"
              style={{ backgroundImage: `url('${bgUrl}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/80 pointer-events-none" />
          </div>
          {/* Wrap the whole app in Providers if needed - currently just passes children */}
          <Providers>
            <div className="relative z-20 flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </Providers>
        </AccessibilityWrapper>
      </body>
    </html>
  );
}
