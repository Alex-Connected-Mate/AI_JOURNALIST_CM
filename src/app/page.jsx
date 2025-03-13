'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DotPattern from '@/components/DotPattern';
import { useStore } from '@/lib/store';

export default function HomePage() {
  const { user } = useStore();

  return (
    <div className="flex flex-col min-h-screen relative">
      <DotPattern className="absolute inset-0 z-0" />
      
      <main className="flex-grow flex items-center justify-center relative z-10">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-6">
            Plateforme d'IA Journaliste
          </h1>
          <p className="text-xl mb-12 max-w-3xl mx-auto">
            Une plateforme interactive permettant aux professeurs de créer des sessions d'analyse de discussions avec des agents IA.
          </p>
          
          <div className="flex justify-center space-x-4 mb-12">
            {user ? (
              <Link 
                href="/dashboard" 
                className="cm-button px-6 py-3 rounded-lg shadow-md"
              >
                Accéder au tableau de bord
              </Link>
            ) : (
              <>
                <Link 
                  href="/auth/login" 
                  className="cm-button px-6 py-3 rounded-lg shadow-md"
                >
                  Se connecter
                </Link>
                <Link 
                  href="/join" 
                  className="cm-button-secondary px-6 py-3 rounded-lg shadow-md border-2 border-primary"
                >
                  Rejoindre une session
                </Link>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            <Link href="/sessions" className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-semibold mb-3">Sessions</h2>
              <p className="text-gray-600">Créez et gérez vos sessions d'analyse interactive</p>
            </Link>
            
            <Link href="/dashboard" className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-semibold mb-3">Tableau de bord</h2>
              <p className="text-gray-600">Consultez vos statistiques et résultats d'analyses</p>
            </Link>
            
            <Link href="/join" className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-primary border-opacity-20">
              <h2 className="text-xl font-semibold mb-3 text-primary">Participer à une session</h2>
              <p className="text-gray-600">Rejoignez une session en tant que participant avec un code</p>
              <div className="mt-3 space-y-2">
                <span className="inline-block px-2 py-1 bg-gray-100 text-primary text-xs font-semibold rounded">
                  Aucun compte requis
                </span>
                <p className="text-xs text-gray-500">
                  Scannez un QR code ou entrez manuellement un code de session
                </p>
              </div>
            </Link>
          </div>
          
          <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Déploiement Vercel</h2>
            <p className="mb-4">
              Cette application est déployée sur Vercel à l'adresse suivante :
            </p>
            <a 
              href="https://ai-journalist-connectedmate.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline"
            >
              ai-journalist-connectedmate.vercel.app
            </a>
            
            <div className="mt-6 text-left">
              <h3 className="text-lg font-medium mb-2">Notes importantes :</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>En cas de problème lors du démarrage de l'application locale, utilisez la commande <code className="bg-gray-200 px-2 py-1 rounded">npm run dev:safe</code></li>
                <li>Pour corriger le conflit Git dans next.config.js, utilisez <code className="bg-gray-200 px-2 py-1 rounded">npm run fix-next-config</code></li>
                <li>L'application utilise un système de diagnostics accessible à <code className="bg-gray-200 px-2 py-1 rounded">/admin/diagnostics</code></li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-6 bg-white shadow-inner relative z-10">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>Clipboard by <span className="font-semibold">ConnectedMate</span> &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
} 