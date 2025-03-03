'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DotPattern from '@/components/DotPattern';
import { useStore } from '@/lib/store';

export default function HomePage() {
  const { user } = useStore();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 fade-in">
      {/* Motif de points en arrière-plan */}
      <DotPattern />
      
      {/* Logo en haut à gauche */}
      <div className="absolute top-8 left-8 z-10 flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="AI Journalist"
          width={40}
          height={40}
          className="h-10 w-auto"
        />
        <span className="font-bricolage text-lg font-semibold text-gray-800 hidden sm:inline-block">
          AI Journalist
        </span>
      </div>

      {/* Carte avec contenu */}
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
              AI Journalist
            </h1>
            <p className="mt-2 text-gray-600">
              Welcome to the AI Journalist platform
            </p>
          </div>
          
          <div className="pt-4">
            <Link 
              href={user ? "/dashboard" : "/auth/login"} 
              className="cm-button w-full py-3 block text-center"
            >
              {user ? "Go to Dashboard" : "Login"}
            </Link>
          </div>
        </div>
      </div>
      
      {/* Powered by */}
      <div className="absolute bottom-6 right-6 z-10">
        <div className="powered-by">
          <span>Powered by</span>
          <span className="font-bricolage font-semibold">Connected Mate</span>
        </div>
      </div>
    </div>
  );
} 