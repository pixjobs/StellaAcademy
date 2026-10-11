// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, Inclusive_Sans } from 'next/font/google';

import 'katex/dist/katex.min.css';
import './globals.css';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Analytics from '@/components/Analytics';
import AccessibilityWrapper from '@/components/AccessibilityWrapper';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import Providers from './providers';

// Self-hosted at build time: no font requests to Google from visitors' browsers.
const inclusive = Inclusive_Sans({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-inclusive',
  display: 'swap',
});
const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} | Free interactive physics and maths lessons`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: SITE_URL,
    title: `${SITE_NAME} | Free interactive physics and maths lessons`,
    description: SITE_DESCRIPTION,
    locale: 'en_GB',
  },
  twitter: { card: 'summary_large_image', title: SITE_NAME, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: '#020617' };

type RootLayoutProps = { children: ReactNode };

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en-GB" className={`${inclusive.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <body className="theme-paper min-h-screen overflow-x-hidden antialiased">
        <AccessibilityWrapper>
          <Providers>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 pb-20">{children}</main>
              <Footer />
            </div>
          </Providers>
        </AccessibilityWrapper>
        <Analytics />
      </body>
    </html>
  );
}
