import '../app/globals.css'
import Header from '@/components/Header'
import AuthChecker from '@/components/AuthChecker'
import ProtectedRoute from '@/components/ProtectedRoute'
import LogViewer from '@/components/LogViewer'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/router'

export default function MyApp({ Component, pageProps }) {
  const { user, logout } = useStore()
  const router = useRouter()
  
  // Liste des chemins qui ne nécessitent pas d'authentification
  const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/reset-password'];
  
  // Vérifier si la page actuelle est une page d'authentification
  const isAuthPage = publicPaths.some(path => 
    router.pathname === path || 
    router.pathname.startsWith('/auth/')
  );
  
  return (
    <div className="min-h-screen relative">
      {/* Vérification de l'authentification */}
      <AuthChecker />
      
      {/* Afficher le Header uniquement sur les pages protégées (non-auth) */}
      {!isAuthPage && <Header user={user} logout={logout} />}
      
      {/* Protection des routes qui nécessitent une authentification */}
      <ProtectedRoute excludedPaths={publicPaths}>
        {/* Main content */}
        <Component {...pageProps} />
      </ProtectedRoute>
      
      {/* Afficheur de logs (disponible sur toutes les pages) */}
      <LogViewer />
    </div>
  )
}