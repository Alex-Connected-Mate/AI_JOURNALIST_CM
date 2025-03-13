'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SessionRunPage({ params }) {
  const sessionId = params.id;
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [currentSlide, setCurrentSlide] = useState('join'); // Valeurs possibles: join, pause, interact, analysis, results
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);

  // Chargement des données de la session
  useEffect(() => {
    async function loadSessionData() {
      try {
        // Charger les informations de base de la session
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();
          
        if (sessionError) throw sessionError;
        setSession(sessionData);

        // Charger les participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('session_participants')
          .select('*')
          .eq('session_id', sessionId);
          
        if (participantsError) throw participantsError;
        setParticipants(participantsData || []);

        setLoading(false);
      } catch (err) {
        console.error('Error loading session data:', err);
        setError('Impossible de charger les données de la session');
        setLoading(false);
      }
    }
    
    loadSessionData();
    
    // Configurer une mise à jour en temps réel des participants
    const subscription = supabase
      .channel(`session_${sessionId}_participants`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'session_participants',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        // Mettre à jour la liste des participants
        if (payload.eventType === 'INSERT') {
          setParticipants(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'DELETE') {
          setParticipants(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [sessionId]);

  // Gestion de la navigation entre les slides
  const goToNextSlide = () => {
    switch (currentSlide) {
      case 'join':
        setCurrentSlide('pause');
        break;
      case 'pause':
        setCurrentSlide('interact');
        break;
      case 'interact':
        setCurrentSlide('analysis');
        break;
      case 'analysis':
        setCurrentSlide('results');
        break;
      default:
        break;
    }
  };

  const goToPreviousSlide = () => {
    switch (currentSlide) {
      case 'pause':
        setCurrentSlide('join');
        break;
      case 'interact':
        setCurrentSlide('pause');
        break;
      case 'analysis':
        setCurrentSlide('interact');
        break;
      case 'results':
        setCurrentSlide('analysis');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la présentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link 
            href={`/sessions/${sessionId}`}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Retour à la session
          </Link>
        </div>
      </div>
    );
  }

  // Rendu du slide actuel
  const renderCurrentSlide = () => {
    switch (currentSlide) {
      case 'join':
        return (
          <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6">Rejoindre la session</h2>
            
            <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
              <div className="flex-1">
                <p className="text-lg mb-4">
                  Scannez le QR code ou utilisez le code de session pour rejoindre:
                </p>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="font-mono text-xl font-bold text-blue-800">
                    {session?.session_code || 'CODE'}
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    Participants connectés: {participants.length} / {session?.max_participants || 30}
                  </p>
                </div>
              </div>
              
              <div className="flex-shrink-0 bg-white p-2 border rounded-lg shadow-sm">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${session?.session_code}`)}`}
                  alt="QR Code pour rejoindre la session"
                  width={200}
                  height={200}
                />
              </div>
            </div>
            
            <div className="mt-8 space-y-4">
              <h3 className="font-semibold">Participants ({participants.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {participants.map(participant => (
                  <div key={participant.id} className="bg-gray-50 p-2 rounded">
                    {participant.display_name || 'Anonyme'}
                  </div>
                ))}
                {participants.length === 0 && (
                  <p className="text-gray-500 col-span-4">Aucun participant pour le moment</p>
                )}
              </div>
            </div>
          </div>
        );
        
      case 'pause':
        return (
          <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6">Pause</h2>
            <p className="text-center text-lg">
              Session en pause. Nous reprendrons dans quelques instants.
            </p>
          </div>
        );
        
      case 'interact':
        return (
          <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6">Phase d'interaction</h2>
            <p className="text-center text-lg mb-4">
              Les participants interagissent avec les agents IA.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-center">
                Cette phase permet aux participants de discuter avec les agents IA configurés pour cette session.
              </p>
            </div>
          </div>
        );
        
      case 'analysis':
        return (
          <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6">Analyse préliminaire</h2>
            <p className="text-center text-lg mb-4">
              Analyse des premières interactions et discussions.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p>Données d'analyse non disponibles pour le moment.</p>
            </div>
          </div>
        );
        
      case 'results':
        return (
          <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6">Résultats finaux</h2>
            <p className="text-center text-lg mb-4">
              Analyse complète de la session.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p>Résultats complets non disponibles pour le moment.</p>
            </div>
            <div className="mt-8 text-center">
              <Link
                href={`/sessions/${sessionId}/results`}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Voir le rapport détaillé
              </Link>
            </div>
          </div>
        );
        
      default:
        return <div>Contenu non disponible</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{session?.name || 'Session'}</h1>
            <p className="text-gray-600">
              {session?.description || 'Aucune description'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Link
              href={`/sessions/${sessionId}`}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Quitter la présentation
            </Link>
          </div>
        </div>
        
        {/* Navigation entre slides */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={goToPreviousSlide}
            disabled={currentSlide === 'join'}
            className={`px-4 py-2 rounded flex items-center gap-2 ${
              currentSlide === 'join' 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Précédent
          </button>
          
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${currentSlide === 'join' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            <div className={`h-3 w-3 rounded-full ${currentSlide === 'pause' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            <div className={`h-3 w-3 rounded-full ${currentSlide === 'interact' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            <div className={`h-3 w-3 rounded-full ${currentSlide === 'analysis' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            <div className={`h-3 w-3 rounded-full ${currentSlide === 'results' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
          </div>
          
          <button
            onClick={goToNextSlide}
            disabled={currentSlide === 'results'}
            className={`px-4 py-2 rounded flex items-center gap-2 ${
              currentSlide === 'results' 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Suivant
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Contenu du slide actuel */}
        {renderCurrentSlide()}
      </div>
    </div>
  );
} 