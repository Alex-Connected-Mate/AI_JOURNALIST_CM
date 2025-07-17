'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';

export default function HomePage() {
  const { user } = useStore();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Interactive Sessions Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-Powered Insights for Interactive Sessions
          </p>
          
          {user ? (
            <div className="space-y-4">
              <p className="text-green-600">Welcome back, you are logged in!</p>
              <Link 
                href="/dashboard" 
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">Please sign in to continue</p>
              <div className="space-x-4">
                <Link 
                  href="/auth/login" 
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Sign In
                </Link>
                <Link 
                  href="/join" 
                  className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                >
                  Join Session
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 