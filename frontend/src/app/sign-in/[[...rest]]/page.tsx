// app/sign-in/[[...rest]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <SignIn
        appearance={{
          variables: { colorPrimary: '#22d3ee' }
        }}
      />
    </div>
  );
}