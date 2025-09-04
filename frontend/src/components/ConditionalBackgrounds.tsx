// app/components/ConditionalBackgrounds.tsx
'use client';

import { usePathname } from 'next/navigation';
import AppBackground from '@/components/AppBackground';
import SolarSystemBackground from '@/components/SolarSystemBackground';

// This component checks the current page route and renders the correct background
export default function ConditionalBackgrounds({ url }: { url?: string }) {
  const pathname = usePathname();

  // If we are on the '/about' page, show the solar system.
  // NOTE: You can add more routes here with || pathname === '/another-route'
  if (pathname === '/about') {
    return <SolarSystemBackground />;
  }

  // Otherwise, show the default AppBackground.
  return <AppBackground url={url} warpOnLoad />;
}