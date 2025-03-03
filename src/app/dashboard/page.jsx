'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/components/LocaleProvider';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { useSearchParams } from 'next/navigation';

export default function DashboardPage() {
  const { t, locale } = useTranslation();
  const { user } = useStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
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
          setSuccessMessage('Session created successfully.');
          break;
        default:
          setSuccessMessage('Operation completed successfully.');
      }
    }
  }, [searchParams]);

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // In production, this would be an API call to your database
        // For example:
        // const { data } = await supabase.from('sessions').select('*').eq('user_id', user.id);
        
        // For development, we'll just use an empty array for now
        setSessions([]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {t('dashboard.title', 'Dashboard')}
          </h1>
          <Link 
            href="/sessions/new" 
            className="cm-button flex items-center gap-2"
          >
            <span role="img" aria-label="rocket">🚀</span>
            {t('dashboard.createSession', 'Create Session')}
          </Link>
        </div>
        
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h2 className="font-medium text-blue-800 mb-2">
            {t('dashboard.welcomeMessage', 'Welcome to AI Journalist')}
          </h2>
          <p className="text-gray-600">
            Create and manage your interactive sessions with AI assistance
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">{t('dashboard.yourSessions', 'Your Sessions')}</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          ) : sessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <div key={session.id} className="border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-lg">{session.name || 'Untitled Session'}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        session.status === 'draft' ? 'bg-gray-100 text-gray-700' : 
                        session.status === 'active' ? 'bg-green-100 text-green-700' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {session.status === 'draft' ? 'Draft' : 
                         session.status === 'active' ? 'Active' : 
                         'Completed'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {session.institution}
                    </p>
                    
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {session.created_at ? new Date(session.created_at).toLocaleDateString() : 'No date'}
                    </div>
                    
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                      {session.participants_count || 0} participants
                    </div>
                  </div>
                  
                  <div className="border-t mt-2 p-3 bg-gray-50 flex flex-wrap gap-2">
                    <Link 
                      href={`/sessions/${session.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded-md hover:bg-blue-50 flex-1 text-center"
                    >
                      View Details
                    </Link>
                    
                    {/* Ajouter un bouton "Launch Session" pour toutes les sessions actives */}
                    {session.status === 'active' && (
                      <Link 
                        href={`/sessions/${session.id}/run`}
                        className="text-green-600 hover:text-green-800 text-sm px-3 py-1 rounded-md hover:bg-green-50 flex-1 text-center font-medium"
                      >
                        Launch Session
                      </Link>
                    )}
                    
                    {/* Bouton d'édition pour les sessions en mode brouillon */}
                    {session.status === 'draft' && (
                      <Link 
                        href={`/sessions/${session.id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm px-3 py-1 rounded-md hover:bg-indigo-50 flex-1 text-center"
                      >
                        Edit Session
                      </Link>
                    )}
                    
                    {/* Bouton pour voir les résultats des sessions terminées */}
                    {session.status === 'ended' && (
                      <Link 
                        href={`/sessions/${session.id}/results`}
                        className="text-amber-600 hover:text-amber-800 text-sm px-3 py-1 rounded-md hover:bg-amber-50 flex-1 text-center"
                      >
                        View Results
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
                {t('dashboard.noSessions', 'No sessions yet')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('dashboard.createYourFirst', 'Create your first session to get started')}
              </p>
              <Link 
                href="/sessions/new" 
                className="cm-button flex items-center gap-2"
              >
                <span role="img" aria-label="rocket">🚀</span>
                {t('dashboard.createSession', 'Create Session')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 