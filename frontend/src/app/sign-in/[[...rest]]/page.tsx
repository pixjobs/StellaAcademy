// app/sign-in/[[...rest]]/page.tsx
import { SignIn } from '@clerk/nextjs';

type PageProps = {
  // Next 15 types `searchParams` as a Promise in server components
  searchParams?: Promise<Record<string, string | string[]>>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const raw = sp.redirect_url;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <SignIn
        appearance={{ variables: { colorPrimary: '#22d3ee' } }}
      />
    </div>
  );
}
