'use client';

import React, { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/components/LocaleProvider';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { useSearchParams } from 'next/navigation';
import { getSessions } from '@/lib/supabase';
import logger from '@/lib/logger';

function LoadingFallback() {
  return (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
    </div>
  );
}

function DashboardContent() {
  const { t, locale } = useTranslation();
  const { user } = useStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const searchParams = useSearchParams();
  const [successMessage, setSuccessMessage] = useState(null);

  // Check for success messages from URL params
  useEffect(() => {
    const success = searchParams.get('success');
    if (success) {
      // Handle different success messages
      switch (success) {
        case 'nexus-config-saved':
          setSuccessMessage('Nexus questionnaire configuration saved successfully.');
          break;
        case 'session-created':
          setSuccessMessage('Session créée avec succès. Vous pouvez maintenant la configurer ou la partager avec vos participants.');
          break;
        default:
          setSuccessMessage('Opération complétée avec succès.');
      }
    }
  }, [searchParams]);

  // Set a timeout to force end loading state after 5 seconds to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  // Force end loading if timeout reached
  useEffect(() => {
    if (loadingTimeout && loading) {
      setLoading(false);
      logger.warning('Loading sessions timed out - forcing end of loading state');
    }
  }, [loadingTimeout, loading]);

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        logger.info('Fetching sessions for user:', user.id);
        
        // Fetch real session data from Supabase
        const { data, error } = await getSessions(user.id);
        
        if (error) {
          logger.error('Error fetching sessions:', error);
          setError('Unable to load sessions. Please try again later.');
          setLoading(false);
          return;
        }
        
        logger.info(`Fetched ${data?.length || 0} sessions`);
        setSessions(data || []);
        setLoading(false);
      } catch (error) {
        logger.error('Error fetching sessions:', error);
        setError('An unexpected error occurred. Please try again later.');
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  // Determine if we should show loading, empty state, or sessions list
  const shouldShowLoading = loading && !loadingTimeout;
  const shouldShowEmptyState = (!loading || loadingTimeout) && (!sessions || sessions.length === 0);
  const shouldShowSessions = (!loading || loadingTimeout) && sessions && sessions.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {t('dashboard.title', 'Tableau de bord')}
          </h1>
          <Link 
            href="/sessions/new" 
            className="cm-button flex items-center gap-2"
          >
            <span role="img" aria-label="rocket">🚀</span>
            {t('dashboard.createSession', 'Créer une session')}
          </Link>
        </div>
        
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h2 className="font-medium text-blue-800 mb-2">
            {t('dashboard.welcomeMessage', 'Bienvenue sur AI Journalist')}
          </h2>
          <p className="text-gray-600">
            Créez et gérez vos sessions interactives avec l'assistance IA (test Maxime)
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">{t('dashboard.yourSessions', 'Vos sessions')}</h2>
          
          {shouldShowLoading ? (
            <LoadingFallback />
          ) : shouldShowSessions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <div key={session.id} className="border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-lg">{session.name || 'Session sans titre'}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        session.status === 'draft' ? 'bg-gray-100 text-gray-700' : 
                        session.status === 'active' ? 'bg-green-100 text-green-700' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {session.status === 'draft' ? 'Brouillon' : 
                         session.status === 'active' ? 'Active' : 
                         'Terminée'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {session.institution || 'Aucune institution'}
                    </p>
                    
                    {session.access_code && (
                      <div className="flex items-center mt-2 text-sm text-violet-700 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Code d'accès: {session.access_code}
                      </div>
                    )}
                    
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {session.created_at ? new Date(session.created_at).toLocaleDateString() : 'Pas de date'}
                    </div>
                  </div>
                  
                  <div className="border-t mt-2 p-3 bg-gray-50 flex flex-wrap gap-2">
                    <Link 
                      href={`/sessions/${session.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded-md hover:bg-blue-50 flex-1 text-center"
                    >
                      Voir les détails
                    </Link>
                    
                    {/* Bouton d'édition pour toutes les sessions */}
                    <Link 
                      href={`/sessions/${session.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm px-3 py-1 rounded-md hover:bg-indigo-50 flex-1 text-center"
                    >
                      Éditer
                    </Link>
                    
                    {/* Ajouter un bouton "Launch Session" pour toutes les sessions actives */}
                    {session.status === 'active' && (
                      <Link 
                        href={`/sessions/${session.id}/run`}
                        className="text-green-600 hover:text-green-800 text-sm px-3 py-1 rounded-md hover:bg-green-50 flex-1 text-center font-medium"
                      >
                        Lancer la session
                      </Link>
                    )}
                    
                    {/* Bouton pour voir les résultats des sessions terminées */}
                    {session.status === 'ended' && (
                      <Link 
                        href={`/sessions/${session.id}/results`}
                        className="text-amber-600 hover:text-amber-800 text-sm px-3 py-1 rounded-md hover:bg-amber-50 flex-1 text-center"
                      >
                        Voir les résultats
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {t('dashboard.noSessions', 'Pas encore de sessions')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('dashboard.createYourFirst', 'Créez votre première session pour commencer')}
              </p>
              <Link 
                href="/sessions/new" 
                className="cm-button inline-flex items-center gap-2"
              >
                <span role="img" aria-label="rocket">🚀</span>
                {t('dashboard.createSession', 'Créer une session')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DashboardContent />
    </Suspense>
  );
} 