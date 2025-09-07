// app/layout.tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';
import 'katex/dist/katex.min.css';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GSAPProvider from '@/components/GSAPProvider';
import ConditionalBackgrounds from '@/components/ConditionalBackgrounds';
import Providers from './providers';

export const metadata: Metadata = { title: 'Stella Academy' };

type RootLayoutProps = { children: ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
  const useApod = process.env.USE_APOD_BG === 'true';

  let bgUrl: string | undefined;
  if (useApod) {
    try {
      // Directly call the server lib: no network, no absolute URL required.
      const { getApod } = await import('@/lib/apod'); // server-only module
      const apod = await getApod();
      bgUrl = apod?.bgUrl ?? undefined;
    } catch (err) {
      console.warn('[layout] Failed to load APOD background:', err);
      bgUrl = undefined;
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={[
        'min-h-screen bg-background text-foreground antialiased',
        'overflow-x-hidden',
        'selection:bg-accent selection:text-accent-foreground',
      ].join(' ')}>
        <Providers>
          <GSAPProvider>
            <ConditionalBackgrounds url={bgUrl} />
            <div className="relative z-20 flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </GSAPProvider>
        </Providers>
      </body>
    </html>
  );
}
