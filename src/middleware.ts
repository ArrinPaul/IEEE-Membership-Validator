import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define route matchers
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/public(.*)',
]);

const isVolunteerRoute = createRouteMatcher([
  '/volunteer(.*)',
  '/api/volunteer(.*)',
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  
  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // If not authenticated and trying to access protected route
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Get user role from session claims
  let userRole = 
    (sessionClaims?.metadata as { role?: string })?.role || 
    (sessionClaims?.publicMetadata as { role?: string })?.role;

  // Fallback: If role is missing and we're accessing a protected route, 
  // fetch the full user object to be absolutely sure.
  if (!userRole && (isAdminRoute(req) || isVolunteerRoute(req))) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      userRole = (user.publicMetadata?.role as string) || 'user';
    } catch (error) {
      console.error('Middleware error fetching user role:', error);
      userRole = 'user';
    }
  } else if (!userRole) {
    userRole = 'user';
  }

  // Admin routes - only accessible by admins
  if (isAdminRoute(req)) {
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  // Volunteer routes - accessible by volunteers and admins
  if (isVolunteerRoute(req)) {
    if (!['admin', 'volunteer'].includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
