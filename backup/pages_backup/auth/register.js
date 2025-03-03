import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    setLoading(true);
    
    try {
      // Simuler une inscription pour le moment
      setTimeout(() => {
        router.push('/auth/login?registered=true');
      }, 1500);
    } catch (err) {
      setError('Une erreur inattendue est survenue');
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 fade-in">
      <div className="bento-card w-full max-w-md fade-in">
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.png"
                alt="Logo"
                width={80}
                height={80}
                className="h-20 w-auto"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 font-bricolage">
              Créer votre compte
            </h1>
            <p className="mt-2 text-gray-600">
              Rejoignez la plateforme de sessions interactives
            </p>
          </div>
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre.email@exemple.com"
                  className="cm-input"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="cm-input"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Le mot de passe doit comporter au moins 6 caractères
                </p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="cm-input"
                />
              </div>
            </div>
            
            {error && (
              <div className="second-level-block px-4 py-3 text-red-700 relative">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              className="cm-button w-full py-3"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin mr-2"></div>
                  <span>Chargement...</span>
                </div>
              ) : 'Créer un compte'}
            </button>
            
            <div className="text-center pt-2">
              <p className="text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 font-medium">
                  Se connecter
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 