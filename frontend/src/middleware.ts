// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const hasServerPk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_");
const hasSecret  = !!process.env.CLERK_SECRET_KEY?.startsWith("sk_");
const clerkEnabled = hasServerPk && hasSecret;

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/privacy(.*)",
  "/terms(.*)",
]);

const protectedMw = clerkMiddleware(async (auth, req: NextRequest) => {
  if (isPublicRoute(req)) return NextResponse.next();
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
});

const passthroughMw = () => NextResponse.next();

// ✅ If keys missing, don’t even create/run Clerk’s middleware
export default clerkEnabled ? protectedMw : passthroughMw;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
