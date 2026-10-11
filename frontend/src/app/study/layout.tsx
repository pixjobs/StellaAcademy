import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'All physics and maths lessons, from foundations to A-level',
  description: 'Browse free interactive physics and maths lessons by level: foundations, GCSE and A-level. Each has a model to experiment with, a worked example and practice questions.',
  alternates: { canonical: '/study' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
