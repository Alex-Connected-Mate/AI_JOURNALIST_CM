'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useStore } from '@/lib/store';
import { useLoggerNew } from '../hooks/useLoggerNew';

// Custom hook to get current user
const useUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
};

export default function AuthChecker({ children }) {
  const router = useRouter();
  const logger = useLoggerNew('AuthChecker');
  const { user, loading } = useUser();
  const { setUser, setIsAuthenticated } = useStore();

  useEffect(() => {
    logger.debug('AuthChecker monté');
    
    if (!loading) {
      setUser(user);
      setIsAuthenticated(!!user);
      
      if (user) {
        logger.debug('Utilisateur connecté:', user.email);
      } else {
        logger.debug('Aucun utilisateur connecté');
      }
    }
  }, [user, loading, setUser, setIsAuthenticated, logger]);

  // Don't render children until we know the auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return children;
} 