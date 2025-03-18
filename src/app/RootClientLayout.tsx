'use client';

import React from 'react';
import AuthChecker from '@/components/AuthChecker';
import ProtectedRoute from '@/components/ProtectedRoute';
import LogViewer from '@/components/LogViewer';
import EventTrackerInitializer from '@/components/EventTrackerInitializer';
import { usePathname, useRouter } from 'next/navigation';
import { LocaleProvider } from '@/components/LocaleProvider';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';

interface RootClientLayoutProps {
  children: React.ReactNode;
}

function ErrorFallback({ error }: { error: Error }) {
  const router = useRouter();
  
  // Log l'erreur pour debugging
  console.error('Application error:', error);
  
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-md max-w-lg mx-auto mt-8">
      <h2 className="text-xl font-bold text-red-800 mb-2">Une erreur est survenue:</h2>
      <pre className="text-sm bg-white p-3 rounded border border-red-100 overflow-auto">
        {error.message}
      </pre>
      <div className="mt-4 flex gap-3">
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={() => router.push('/dashboard')}
        >
          Retour au dashboard
        </button>
        <button 
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

export default function RootClientLayout({ children }: RootClientLayoutProps) {
  const pathname = usePathname();

  // List of protected routes
  const protectedRoutes = [
    '/dashboard',
    '/settings',
    '/sessions'
  ];

  // Determine if current route is protected and requires auth
  const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route));

  // Public join route shouldn't use protected route wrapper
  const isJoinRoute = pathname?.startsWith('/join');

  // Renderiser le contenu basé sur le type de route
  const renderContent = () => {
    if (isProtectedRoute) {
      return (
        <ProtectedRoute excludedPaths={['/join']}>
          {children}
        </ProtectedRoute>
      );
    } else if (isJoinRoute) {
      return (
        <>
          <AuthChecker />
          {children}
        </>
      );
    } else {
      return children;
    }
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <LocaleProvider>
        <>
          {renderContent()}
          
          {/* Toast Notifications */}
          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 5000,
              success: {
                style: {
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #dcfce7'
                },
                duration: 3000,
              },
              error: {
                style: {
                  background: '#fef2f2',
                  color: '#b91c1c',
                  border: '1px solid #fee2e2'
                },
                duration: 5000,
              },
              loading: {
                style: {
                  background: '#f3f4f6',
                  color: '#1f2937',
                  border: '1px solid #e5e7eb'
                },
              },
            }}
          />
          
          {/* Event tracker for analytics */}
          <EventTrackerInitializer />
          
          {/* Dev tools - only in development */}
          {process.env.NODE_ENV === 'development' && <LogViewer />}
        </>
      </LocaleProvider>
    </ErrorBoundary>
  );
} 