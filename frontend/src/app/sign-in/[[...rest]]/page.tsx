import { SignIn } from '@clerk/nextjs';

export default function SignInPage({
  searchParams,
}: { searchParams?: { redirect_url?: string } }) {
  // Clerk will also respect return URLs you’ve configured in dashboard
  const redirectUrl = searchParams?.redirect_url ?? '/';
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <SignIn
        appearance={{ variables: { colorPrimary: '#22d3ee' } }}
        redirectUrl={redirectUrl}
        afterSignInUrl={redirectUrl}
      />
    </div>
  );
}
