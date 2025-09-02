
import type { Metadata } from 'next';

import './globals.css';
import 'katex/dist/katex.min.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppBackground from '@/components/AppBackground';
import { getApod } from '@/lib/apod';
import GSAPProvider from '@/components/GSAPProvider'; 
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const useApod = process.env.USE_APOD_BG === 'true';
  const apod = useApod ? await getApod() : null;

  return (
    <html lang="en">
      <body>
        {/* 2. Wrap the body content with the GSAPProvider */}
        <GSAPProvider>
          <AppBackground url={apod?.bgUrl || undefined} warpOnLoad />
          <div className="relative z-20 flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </GSAPProvider>
      </body>
    </html>
  );
}