import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 fade-in">
      <div className="bento-card w-full max-w-md fade-in">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 font-bricolage">
              Interactive Sessions
            </h1>
            <p className="mt-2 text-gray-600">
              Plateforme de Connected Mate
            </p>
          </div>
          
          <div className="space-y-4">
            <Link href="/auth/login" className="cm-button w-full py-3 flex items-center justify-center">
              Se connecter
            </Link>
            
            <Link href="/auth/register" className="cm-button-secondary w-full py-3 flex items-center justify-center">
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 