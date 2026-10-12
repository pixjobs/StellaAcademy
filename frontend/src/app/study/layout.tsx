import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Physics and maths lessons for KS2, KS3, GCSE and A-level',
  description: 'Free interactive physics and maths lessons for key stage 2, key stage 3, GCSE and A-level, each matched to the national curriculum for England.',
  alternates: { canonical: '/study' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
