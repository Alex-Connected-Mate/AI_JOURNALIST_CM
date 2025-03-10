'use client';

import React, { Suspense } from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '';
  const { user, login: storeLogin } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Rediriger si l'utilisateur est déjà connecté
  useEffect(() => {
    if (user) {
      const redirectTo = redirect || '/dashboard';
      console.log('User already logged in, redirecting', { redirectTo, userId: user.id });
      router.push(redirectTo);
    }
  }, [user, redirect, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    console.log('Login attempt', { email });
    
    try {
      // Tentative de connexion avec délai de récupération et gestion des erreurs améliorée
      const MAX_RETRIES = 3;
      let retryCount = 0;
      
      const attemptLogin = async (): Promise<any> => {
        try {
          // Connexion directe avec Supabase plutôt que par le store
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          return { data, error };
        } catch (fetchError) {
          console.error('Fetch error during login attempt', fetchError);
          
          // Si c'est une erreur de réseau et qu'il nous reste des tentatives
          if (retryCount < MAX_RETRIES && fetchError instanceof Error && 
              (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('Network'))) {
            retryCount++;
            console.log(`Retrying login attempt ${retryCount}/${MAX_RETRIES}...`);
            
            // Attente exponentielle entre les tentatives
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
            return attemptLogin();
          }
          
          throw fetchError;
        }
      };
      
      const { data, error } = await attemptLogin();
      
      if (error) {
        console.error('Login failed', { error: error.message });
        setError("Les identifiants sont incorrects. Veuillez réessayer.");
        setLoading(false);
        return;
      }
      
      if (data?.user) {
        console.log('Login successful', { userId: data.user.id });
        
        // Utiliser la méthode login du store pour mettre à jour l'état de l'utilisateur
        try {
          await storeLogin(email, password);
          
          // Rediriger vers la page demandée ou le tableau de bord par défaut
          const redirectTo = redirect || '/dashboard';
          console.log(`Redirecting after login to: ${redirectTo}`);
          router.push(redirectTo);
        } catch (storeError) {
          console.error('Error updating store after login', storeError);
          // Même si le store échoue, nous avons quand même authentifié l'utilisateur
          // donc nous pouvons continuer avec la redirection
          const redirectTo = redirect || '/dashboard';
          router.push(redirectTo);
        }
      }
    } catch (err: any) {
      console.error('Unexpected error during login', { error: err?.message });
      
      // Message d'erreur plus descriptif basé sur le type d'erreur
      if (err?.message?.includes('fetch') || err?.message?.includes('network')) {
        setError('Problème de connexion au serveur. Vérifiez votre connexion internet et réessayez.');
      } else {
        setError('Une erreur s\'est produite lors de la connexion. Veuillez réessayer.');
      }
      
      setLoading(false);
    }
  };
  
  return (
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
            Bienvenue
          </h1>
          <p className="mt-2 text-gray-600">
            Connectez-vous à votre compte pour continuer
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
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <Link href="/auth/reset-password" className="text-sm text-blue-600 hover:text-blue-800 focus-ring rounded">
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            ) : 'Se connecter'}
          </button>
          
          <div className="text-center pt-2">
            <p className="text-gray-600">
              Vous n'avez pas de compte ?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:text-blue-800 font-medium">
                Créer un compte
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginContent />
    </Suspense>
  );
} 