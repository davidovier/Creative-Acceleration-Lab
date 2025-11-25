/**
 * Next.js Middleware for Auth Protection
 * Protects authenticated routes
 */

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Skip middleware if environment variables are not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not configured - skipping auth middleware');
    return res;
  }

  try {
    const supabase = createMiddlewareClient({ req, res });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Protected routes
    const protectedPaths = ['/dashboard', '/projects', '/account', '/sessions'];
    const isProtectedPath = protectedPaths.some((path) =>
      req.nextUrl.pathname.startsWith(path)
    );

    // Redirect to login if accessing protected route without session
    if (isProtectedPath && !session) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect to dashboard if accessing auth pages while logged in
    const authPaths = ['/login', '/signup'];
    const isAuthPath = authPaths.includes(req.nextUrl.pathname);

    if (isAuthPath && session) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // Continue without auth if there's an error
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
