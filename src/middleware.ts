import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes publiques qui ne nécessitent pas d'authentification
const PUBLIC_ROUTES = [
  '/', 
  '/auth/login', 
  '/auth/signup',
  '/auth/reset-password',
  '/auth/callback'
]

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const { data: { session } } = await supabase.auth.getSession()

  const path = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    path === route || path.startsWith(`${route}/`)
  );
  
  if (!session && !isPublicRoute) {
    // Rediriger vers la page de connexion avec l'URL actuelle en paramètre de redirection
    return NextResponse.redirect(
      new URL(`/auth/login?redirect=${encodeURIComponent(path)}`, request.url)
    );
  }

  if (session && (path === '/auth/login' || path === '/auth/signup')) {
    // Rediriger vers le tableau de bord si l'utilisateur tente d'accéder 
    // aux pages d'authentification alors qu'il est déjà connecté
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Security headers
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets).*)'],
} 