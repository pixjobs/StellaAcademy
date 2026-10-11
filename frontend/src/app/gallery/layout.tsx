import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'NASA image gallery',
  description: 'Search the NASA image library and see the Astronomy Picture of the Day.',
  alternates: { canonical: '/gallery' },
};

// Photographs look best on black, so the gallery keeps the night theme all the way down.
export default function Layout({ children }: { children: ReactNode }) {
  return <div className="theme-night -mb-20">{children}</div>;
}
