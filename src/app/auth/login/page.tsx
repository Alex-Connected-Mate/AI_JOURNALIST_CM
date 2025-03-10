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
  const { user, setUser } = useStore();
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
      // Connexion directe avec Supabase plutôt que par le store
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login failed', { error: error.message });
        setError("Les identifiants sont incorrects. Veuillez réessayer.");
        setLoading(false);
        return;
      }
      
      if (data?.user) {
        console.log('Login successful', { userId: data.user.id });
        
        // Mettre à jour le store manuellement
        setUser({
          id: data.user.id,
          email: data.user.email || ''
        });
        
        // Rediriger vers la page demandée ou le tableau de bord par défaut
        const redirectTo = redirect || '/dashboard';
        console.log(`Redirecting after login to: ${redirectTo}`);
        router.push(redirectTo);
      }
    } catch (err: any) {
      console.error('Unexpected error during login', { error: err?.message });
      setError('Une erreur s\'est produite lors de la connexion');
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