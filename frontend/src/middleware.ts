// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isClerkEnabled =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

// Public routes that must stay open (sign-in/up pages, webhooks, optionally /privacy, /terms)
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/privacy(.*)',
  '/terms(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (!isClerkEnabled) return NextResponse.next(); // no-login mode for dev if secrets missing

  // Allow explicitly public routes
  if (isPublicRoute(req)) return NextResponse.next();

  // Everything else requires auth
  const session = await auth();
  if (!session.userId) {
    // For API calls, return 401; for pages, redirect to sign-in with return URL
    const { pathname } = req.nextUrl;
    if (pathname.startsWith('/api') || pathname.startsWith('/trpc')) {
      return new NextResponse(JSON.stringify({ error: 'Unauthenticated' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.nextUrl.href);
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
