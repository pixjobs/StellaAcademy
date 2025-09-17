// app/sign-in/[[...rest]]/page.tsx
import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toSafeRelative(redirect_url?: string, origin?: string) {
  if (!redirect_url) return "/";
  try {
    const u = new URL(redirect_url, origin ?? "http://localhost:3000");
    if (origin && u.origin !== origin) return "/";
    return (u.pathname || "/") + u.search + u.hash;
  } catch {
    return redirect_url.startsWith("/") ? redirect_url : "/";
  }
}

export default async function SignInPage({
  searchParams,
}: {
  // In newer Next, searchParams may be a Promise in RSC
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  // ✅ FIX: auth() is async in v5
  const { userId } = await auth();

  // ✅ await both
  const sp = await searchParams;
  const hdrs = await headers();

  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;

  const target = toSafeRelative(sp?.redirect_url, origin);

  // If already signed in, bounce to the intended target
  if (userId) {
    redirect(target);
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <SignIn
        redirectUrl={target} // go back to original page after sign-in
        afterSignInUrl="/"   // fallback when no redirect_url provided
      />
    </div>
  );
}
