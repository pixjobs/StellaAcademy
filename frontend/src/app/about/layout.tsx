import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'About',
  description: 'Who Stella Academy is for, what is in each free physics and maths lesson, how the lessons are made, and what data the site collects.',
  alternates: { canonical: '/about' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
