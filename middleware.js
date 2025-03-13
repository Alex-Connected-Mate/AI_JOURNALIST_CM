import { NextResponse } from 'next/server';

// Pages qui ne nécessitent pas d'authentification
const publicPaths = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/reset-password',
  '/join',
];

// Chemins de participation qui utilisent l'authentification par token
const participationPaths = ['/sessions/:id/participate'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Vérifier si le chemin est public
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Vérifier si c'est une route de join avec code (/join/CODE)
  if (pathname.startsWith('/join/')) {
    // C'est une route d'accès direct par code de session, permettre l'accès
    return NextResponse.next();
  }
  
  // Vérifier si c'est un chemin de participation
  const isParticipationPath = participationPaths.some(path => {
    // Convertir le modèle de chemin en RegExp
    const pathPattern = path.replace(/:id/, '[^/]+');
    const regex = new RegExp(`^${pathPattern}$`);
    return regex.test(pathname);
  });
  
  if (isParticipationPath) {
    // Vérifier si le token est présent dans l'URL
    const token = request.nextUrl.searchParams.get('token');
    if (token) {
      return NextResponse.next();
    }
  }
  
  // Pour tous les autres chemins, vérifier si l'utilisateur est authentifié
  const authSession = request.cookies.get('supabase-auth-token');
  
  if (!authSession) {
    // Rediriger vers la page de connexion si aucune session n'est trouvée
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
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