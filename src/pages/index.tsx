'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function RedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Simuler un délai avant la redirection
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="text-center max-w-md p-8 rounded-lg shadow-lg bg-white">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Connected Mate AI</h1>
          <p className="text-gray-600">
            Redirection vers le dashboard...
          </p>
        </div>
        
        <div className="flex items-center justify-center mb-6">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            Si vous n'êtes pas redirigé automatiquement, veuillez cliquer sur le lien ci-dessous :
          </p>
          <div>
            <Link 
              href="/dashboard" 
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Accéder au dashboard
            </Link>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
          <p className="text-xs text-gray-500">
            Des problèmes pour accéder à l'application ?
          </p>
          <div className="flex space-x-2 justify-center">
            <Link 
              href="/debug" 
              className="text-xs text-blue-600 hover:underline"
            >
              Diagnostic
            </Link>
            <span className="text-gray-400">•</span>
            <Link 
              href="/force-dashboard" 
              className="text-xs text-blue-600 hover:underline"
            >
              Accès d'urgence
            </Link>
            <span className="text-gray-400">•</span>
            <a 
              href="/emergency.html" 
              className="text-xs text-blue-600 hover:underline"
            >
              Page d'urgence
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 