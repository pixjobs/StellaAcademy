'use client';

import { ClerkProvider } from '@clerk/nextjs';

export default function Providers({ children }: { children: React.ReactNode }) {
  // If you want, you can pass publishableKey explicitly:
  // return <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>{children}</ClerkProvider>;
  return <ClerkProvider>{children}</ClerkProvider>;
}
