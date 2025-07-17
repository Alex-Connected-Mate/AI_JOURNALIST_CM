'use client';

import React, { useEffect } from 'react';
import ThemeProvider from './ThemeProvider';
import { supabase } from '@/lib/supabaseClient';
import AppInitializer from '@/components/AppInitializer';
import AuthChecker from '@/components/AuthChecker';
import ProtectedRoute from '@/components/ProtectedRoute';
import LogViewer from '@/components/LogViewer';
import { useStore } from '@/lib/store';
import { usePathname, useRouter } from 'next/navigation';
import { ConfirmProvider } from '@/components/providers/ConfirmProvider';
import { LocaleProvider } from '@/components/LocaleProvider';

/**
 * Composant racine pour le côté client
 * Contient les providers et la logique d'initialisation
 */
export default function RootClientLayout({ children }) {
  const pathname = usePathname();
  const { showLogs } = useStore();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') router.refresh();
      if (event === 'SIGNED_OUT') router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Pages publiques qui ne nécessitent pas d'auth
  const isPublicPage = (pathname) => {
    return pathname === '/login' || 
           pathname === '/signup' || 
           pathname === '/password-reset' || 
           pathname === '/magic-link' ||
           pathname === '/auth/callback' ||
           pathname?.startsWith('/join/');
  };

  return (
    <ThemeProvider>
      <LocaleProvider>
        <ConfirmProvider>
          <AppInitializer>
            <AuthChecker>
              {isPublicPage(pathname) ? (
                children
              ) : (
                <ProtectedRoute>
                  {children}
                </ProtectedRoute>
              )}
            </AuthChecker>
            {showLogs && <LogViewer />}
          </AppInitializer>
        </ConfirmProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
} 