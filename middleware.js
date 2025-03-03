import { NextResponse } from 'next/server';

// This middleware doesn't actively do anything by itself
// But it tells Next.js that we want to handle our own 404 responses
// rather than relying on its built-in fallbacks
export function middleware(request) {
  return NextResponse.next();
}

// This configuration tells Next.js that all routes should go through
// our middleware, which will ensure our custom not-found pages are used
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
}; 