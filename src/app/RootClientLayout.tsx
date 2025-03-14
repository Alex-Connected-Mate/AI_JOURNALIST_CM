'use client';

import React, { useEffect } from 'react';
import Header from '@/components/Header';
import AuthChecker from '@/components/AuthChecker';
import ProtectedRoute from '@/components/ProtectedRoute';
import LogViewer from '@/components/LogViewer';
import EventTrackerInitializer from '@/components/EventTrackerInitializer';
import { useStore } from '@/lib/store';
import { usePathname } from 'next/navigation';
import { LocaleProvider } from '@/components/LocaleProvider';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';

interface RootClientLayoutProps {
  children: React.ReactNode;
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-md">
      <h2 className="text-xl font-bold text-red-800 mb-2">Something went wrong:</h2>
      <pre className="text-sm bg-white p-3 rounded border border-red-100 overflow-auto">
        {error.message}
      </pre>
      <button 
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        onClick={() => window.location.reload()}
      >
        Try again
      </button>
    </div>
  );
}

export default function RootClientLayout({ children }: RootClientLayoutProps) {
  const pathname = usePathname();
  const { appInitialized, user } = useStore();

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
        <AuthChecker>
          {children}
        </AuthChecker>
      );
    } else {
      return children;
    }
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <LocaleProvider>
        {appInitialized ? (
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
        ) : (
          <div className="fixed inset-0 flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading application...</p>
            </div>
          </div>
        )}
      </LocaleProvider>
    </ErrorBoundary>
  );
} 