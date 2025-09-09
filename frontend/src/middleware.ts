// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Read server + client envs
const serverPk = process.env.CLERK_PUBLISHABLE_KEY?.trim();
const clientPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
const secret   = process.env.CLERK_SECRET_KEY?.trim();

// Safe debug (no secrets leaked)
console.log("[Clerk Debug] Env loaded:", {
  hasServerPk: !!serverPk,
  serverPkPrefix: serverPk ? serverPk.slice(0, 8) : null, // "pk_live_"
  serverPkLen: serverPk?.length ?? 0,
  hasClientPk: !!clientPk,
  clientPkPrefix: clientPk ? clientPk.slice(0, 8) : null, // "pk_live_"
  clientPkLen: clientPk?.length ?? 0,
  hasSecret: !!secret,
  secretPrefix: secret ? secret.slice(0, 8) : null,       // "sk_live_"
  secretLen: secret?.length ?? 0,
  nodeEnv: process.env.NODE_ENV,
});

// IMPORTANT: Gate on server key + secret (middleware runs on server/edge)
const isClerkEnabled =
  !!serverPk && serverPk.startsWith('pk_') &&
  !!secret   && secret.startsWith('sk_');

// Public routes
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/privacy(.*)',
  '/terms(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (!isClerkEnabled) {
    console.warn("[Clerk Debug] Clerk disabled (missing/invalid server publishable key or secret)");
    return NextResponse.next();
  }

  if (isPublicRoute(req)) return NextResponse.next();

  const session = await auth();
  if (!session.userId) {
    const { pathname } = req.nextUrl;
    if (pathname.startsWith('/api') || pathname.startsWith('/trpc')) {
      return new NextResponse(JSON.stringify({ error: 'Unauthenticated' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.nextUrl.href);
    console.warn("[Clerk Debug] Unauthenticated, redirecting to /sign-in");
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
