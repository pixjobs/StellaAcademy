'use client';

import { ClerkProvider, ClerkLoaded, ClerkLoading } from '@clerk/nextjs';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      // Local sign-in page
      signInUrl="/sign-in"
      appearance={{
        variables: { colorPrimary: '#0f766e', borderRadius: '0.75rem' },
        elements: {
          card: 'shadow-xl rounded-2xl border border-slate-200',
          formButtonPrimary: 'bg-teal-600 hover:bg-teal-700 text-white',
        },
      }}
    >
      <ClerkLoading>
        <div className="opacity-0">{children}</div>
      </ClerkLoading>
      <ClerkLoaded>{children}</ClerkLoaded>
    </ClerkProvider>
  );
}
