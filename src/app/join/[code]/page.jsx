'use client';

import React, { useState, useEffect } from 'react';
const { useRouter } = require('next/navigation');
const { supabase } = require('@/lib/supabase');
const Link = require('next/link');

module.exports = function JoinWithCodePage({ params }) {
  const { code } = params;
  const router = useRouter();
  
  const [sessionCode, setSessionCode] = useState(code || '');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Vérifier si le code est valide au chargement
  useEffect(() => {
    async function verifySessionCode() {
      if (!code) {
        setError('Code de session manquant');
        setVerifying(false);
        return;
      }

      try {
        // Vérifier si le code de session existe et est valide
        const { data, error } = await supabase.rpc('verify_session_code', {
          p_session_code: code.trim()
        });

        if (error) throw error;
        
        if (!data || !data.success) {
          setError(data?.error || 'Session introuvable ou inactive');
          setVerifying(false);
          return;
        }

        // Stocker les informations de la session trouvée
        setSessionInfo(data);
        setVerifying(false);
      } catch (err) {
        console.error('Error verifying session:', err);
        setError('Impossible de vérifier le code de session. Veuillez réessayer.');
        setVerifying(false);
      }
    }
    
    verifySessionCode();
  }, [code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('Votre nom est requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Appeler la fonction Supabase pour rejoindre anonymement
      const { data, error } = await supabase.rpc('join_session_anonymously', {
        p_session_code: sessionCode.trim(),
        p_display_name: displayName.trim()
      });

      if (error) throw error;
      
      if (!data || !data.success) {
        setError(data?.error || 'Session introuvable ou inactive');
        setLoading(false);
        return;
      }

      // Stocker les informations du participant dans localStorage
      localStorage.setItem('anonymousParticipantId', data.participant_id);
      localStorage.setItem('anonymousSessionId', data.session_id);
      localStorage.setItem('anonymousToken', data.token);
      
      setSuccess(true);
      
      // Rediriger vers la page de la session
      setTimeout(() => {
        router.push(`/sessions/${data.session_id}/participate?token=${data.token}`);
      }, 1000);
    } catch (err) {
      console.error('Error joining session:', err);
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification du code de session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Rejoindre la session</h2>
          {sessionInfo && (
            <p className="text-xl font-semibold text-blue-600 mt-2">
              {sessionInfo.session_name}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
            Vous avez rejoint la session avec succès! Redirection en cours...
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="session-code" className="block text-sm font-medium text-gray-700 mb-1">
                Code de session
              </label>
              <input
                id="session-code"
                name="sessionCode"
                type="text"
                autoComplete="off"
                required
                disabled
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-700 font-medium focus:outline-none"
                value={sessionCode}
              />
            </div>
            <div>
              <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-1">
                Votre nom
              </label>
              <input
                id="display-name"
                name="displayName"
                type="text"
                autoComplete="name"
                required
                autoFocus
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Jean Dupont"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Chargement...
                </span>
              ) : (
                'Rejoindre la session'
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm mt-4">
          <Link href="/join" className="text-blue-600 hover:text-blue-800">
            Saisir un autre code
          </Link>
        </div>
      </div>
    </div>
  );
} 