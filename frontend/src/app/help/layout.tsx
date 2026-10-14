import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Help test Stella',
  description: 'Teachers, scientists and parents: try the free Stella Academy lessons and tell us what is wrong or missing.',
  alternates: { canonical: '/help' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
