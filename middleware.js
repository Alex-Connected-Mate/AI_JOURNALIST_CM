import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

// Pages qui ne nécessitent pas d'authentification
const publicPaths = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/reset-password',
  '/auth/callback',
  '/join',
];

// Chemins de participation qui sont toujours publics sans authentification
const participationPaths = [
  '/sessions/:id/participate',
  '/sessions/:id/run'
];

export async function middleware(request) {
  const res = NextResponse.next()
  
  try {
    const supabase = createMiddlewareClient({ req: request, res })
    const { data: { session } } = await supabase.auth.getSession()

    const path = request.nextUrl.pathname;
    
    // Considérer les URLs de participation comme publiques
    const isParticipateRoute = path.includes('/participate') || path.includes('/join');
    
    const isPublicRoute = publicPaths.some(route => 
      path === route || path.startsWith(`${route}/`)
    ) || isParticipateRoute;
    
    if (!session && !isPublicRoute) {
      // Rediriger vers la page de connexion avec l'URL actuelle en paramètre de redirection
      return NextResponse.redirect(
        new URL(`/auth/login?redirect=${encodeURIComponent(path)}`, request.url)
      );
    }

    if (session && (path === '/auth/login' || path === '/auth/register')) {
      // Rediriger vers le tableau de bord si l'utilisateur tente d'accéder 
      // aux pages d'authentification alors qu'il est déjà connecté
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (error) {
    console.error('Middleware error:', error);
    // Continue avec la requête même en cas d'erreur pour éviter de bloquer l'accès
  }

  // Security headers
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Politique CSP plus permissive pour permettre Supabase et autres ressources essentielles
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://*.vercel-insights.com wss://*.supabase.co https://*.vercel.app; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://* data:; frame-src 'self' https://*.supabase.co;"
  );

  return res
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