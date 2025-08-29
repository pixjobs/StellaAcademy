import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppBackground from '@/components/AppBackground';
import { getApod } from '@/lib/apod';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const useApod = process.env.USE_APOD_BG === 'true';
  const apod = useApod ? await getApod() : null;

  return (
    <html lang="en">
      <body className="min-h-screen text-white bg-transparent">
        <AppBackground url={apod?.bgUrl || undefined} warpOnLoad />
        <div className="relative z-20 flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
