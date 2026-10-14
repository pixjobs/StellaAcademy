import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'NASA image gallery',
  description:
    'Search the NASA Image and Video Library: nebulae, rockets, rovers, planets and the people who fly to them, each with NASA\u2019s own description.',
  alternates: { canonical: '/gallery' },
};

// Photographs look best on black, so the gallery keeps the night theme all the way down.
export default function Layout({ children }: { children: ReactNode }) {
  return <div className="theme-night -mb-20">{children}</div>;
}
