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
            AI Journalist Platform
          </h1>
          <p className="text-xl mb-12 max-w-3xl mx-auto">
            An interactive platform for professors to create discussion analysis sessions with AI agents.
          </p>
          
          <div className="flex justify-center space-x-4 mb-12">
            {user ? (
              <Link 
                href="/dashboard" 
                className="cm-button px-6 py-3 rounded-lg shadow-md"
              >
                Access Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href="/auth/login" 
                  className="cm-button px-6 py-3 rounded-lg shadow-md"
                >
                  Login
                </Link>
                <Link 
                  href="/join" 
                  className="cm-button-secondary px-6 py-3 rounded-lg shadow-md border-2 border-primary text-lg font-medium flex items-center"
                >
                  <span className="mr-2">Join a Session</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            <Link href="/sessions" className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-semibold mb-3">Sessions</h2>
              <p className="text-gray-600">Create and manage your interactive analysis sessions</p>
            </Link>
            
            <Link href="/dashboard" className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-semibold mb-3">Dashboard</h2>
              <p className="text-gray-600">View your statistics and analysis results</p>
            </Link>
            
            <Link href="/join" className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-primary border-opacity-20">
              <h2 className="text-xl font-semibold mb-3 text-primary">Join a Session</h2>
              <p className="text-gray-600">Join a session as a participant with a code</p>
              <div className="mt-3 space-y-2">
                <span className="inline-block px-2 py-1 bg-gray-100 text-primary text-xs font-semibold rounded">
                  No account required
                </span>
                <p className="text-xs text-gray-500">
                  Scan a QR code or manually enter a session code
                </p>
              </div>
            </Link>
          </div>
          
          <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Vercel Deployment</h2>
            <p className="mb-4">
              This application is deployed on Vercel at the following address:
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
              <h3 className="text-lg font-medium mb-2">Important notes:</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>If you have issues when starting the local application, use the command <code className="bg-gray-200 px-2 py-1 rounded">npm run dev:safe</code></li>
                <li>To fix Git conflict in next.config.js, use <code className="bg-gray-200 px-2 py-1 rounded">npm run fix-next-config</code></li>
                <li>The application has a diagnostics system accessible at <code className="bg-gray-200 px-2 py-1 rounded">/admin/diagnostics</code></li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-6 bg-white shadow-inner relative z-10">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} ConnectedMate</p>
        </div>
      </footer>
    </div>
  );
} 