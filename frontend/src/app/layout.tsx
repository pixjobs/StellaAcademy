import type { Metadata } from 'next';

import './globals.css';
import 'katex/dist/katex.min.css';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getApod } from '@/lib/apod';
import GSAPProvider from '@/components/GSAPProvider';
import ConditionalBackgrounds from '@/components/ConditionalBackgrounds';
import Providers from './providers'; // ✅ add this

export const metadata: Metadata = {
  title: 'Stella Academy',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const useApod = process.env.USE_APOD_BG === 'true';
  const apod = useApod ? await getApod() : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={[
          'min-h-screen bg-background text-foreground antialiased',
          'overflow-x-hidden',
          'selection:bg-accent selection:text-accent-foreground',
        ].join(' ')}
      >
        {/* Wrap the whole app with ClerkProvider */}
        <Providers>
          <GSAPProvider>
            {/* Background logic */}
            <ConditionalBackgrounds url={apod?.bgUrl || undefined} />

            {/* Foreground content (above background) */}
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
