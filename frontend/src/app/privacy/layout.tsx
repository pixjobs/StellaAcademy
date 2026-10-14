import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What information Stella Academy collects, why, how long it is kept, and your rights. Written for learners and adults.',
  alternates: { canonical: '/privacy' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
