'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import DotPattern from '@/components/ui/DotPattern';

export default function SessionRunPage({ params }) {
  const sessionId = params.id;
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [currentSlide, setCurrentSlide] = useState('join'); // Valeurs possibles: join, pause, interact, analysis, results
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [shareUrl, setShareUrl] = useState('');

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
          .from('participants')
          .select('*')
          .eq('session_id', sessionId);
          
        if (participantsError) throw participantsError;
        setParticipants(participantsData || []);

        // Générer l'URL de partage
        if (typeof window !== 'undefined' && sessionData?.session_code) {
          setShareUrl(`${window.location.origin}/join/${sessionData.session_code}`);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading session data:', err);
        setError('Impossible de charger les données de la session');
        setLoading(false);
      }
    }
    
    loadSessionData();
    
    // Configurer une mise à jour en temps réel des participants
    const participantsSubscription = supabase
      .channel(`session_${sessionId}_participants`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'participants',
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
      supabase.removeChannel(participantsSubscription);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
        <DotPattern className="absolute inset-0 z-0" />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la présentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
        <DotPattern className="absolute inset-0 z-0" />
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md relative z-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link 
            href={`/sessions/${sessionId}`}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
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
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md relative z-10 border border-gray-200">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-center mb-6">Rejoindre la session</h2>
              
              <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                <div className="flex-1">
                  <p className="text-lg mb-4">
                    Scannez le QR code ou utilisez le code de session pour rejoindre:
                  </p>
                  <div className="bg-blue-50 p-6 rounded-lg text-center border border-blue-100">
                    <p className="font-mono text-3xl font-bold text-primary tracking-wider">
                      {session?.session_code || 'CODE'}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      Partagez l'URL: <span className="font-medium">{shareUrl}</span>
                    </p>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      Participants connectés: {participants.length} / {session?.max_participants || 30}
                    </p>
                  </div>
                </div>
                
                <div className="flex-shrink-0 bg-white p-3 border rounded-lg shadow-md">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`}
                    alt="QR Code pour rejoindre la session"
                    width={200}
                    height={200}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-b-lg border-t">
              <h3 className="font-semibold mb-4">Participants ({participants.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {participants.map(participant => (
                  <div key={participant.id} className="bg-white p-2 rounded border shadow-sm">
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
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md relative z-10 border border-gray-200">
            <div className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-6">Pause</h2>
              <div className="bg-yellow-50 p-10 rounded-lg border border-yellow-100">
                <p className="text-xl">
                  Session en pause. Nous reprendrons dans quelques instants.
                </p>
                
                <div className="mt-8 flex justify-center">
                  <div className="inline-block bg-white p-3 rounded-lg border shadow-sm">
                    <p className="font-mono text-lg font-semibold mb-1">Code de session:</p>
                    <p className="font-mono text-2xl font-bold text-primary">{session?.session_code}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'interact':
        return (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md relative z-10 border border-gray-200">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-center mb-6">Phase d'interaction</h2>
              <p className="text-center text-lg mb-4">
                Les participants interagissent avec les agents IA.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <p className="text-center">
                  Cette phase permet aux participants de discuter avec les agents IA configurés pour cette session.
                </p>
              </div>
              
              <div className="mt-8 flex justify-center">
                <div className="inline-block bg-white p-3 rounded-lg border shadow-sm">
                  <p className="font-mono text-lg font-semibold mb-1">Code de session:</p>
                  <p className="font-mono text-2xl font-bold text-primary">{session?.session_code}</p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'analysis':
        return (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md relative z-10 border border-gray-200">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-center mb-6">Analyse préliminaire</h2>
              <p className="text-center text-lg mb-4">
                Analyse des premières interactions et discussions.
              </p>
              <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                <p>Données d'analyse non disponibles pour le moment.</p>
              </div>
              
              <div className="mt-8 flex justify-center">
                <div className="inline-block bg-white p-3 rounded-lg border shadow-sm">
                  <p className="font-mono text-lg font-semibold mb-1">Code de session:</p>
                  <p className="font-mono text-2xl font-bold text-primary">{session?.session_code}</p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'results':
        return (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md relative z-10 border border-gray-200">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-center mb-6">Résultats finaux</h2>
              <p className="text-center text-lg mb-4">
                Analyse complète de la session.
              </p>
              <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                <p>Résultats complets non disponibles pour le moment.</p>
              </div>
              
              <div className="mt-8 flex justify-center">
                <Link
                  href={`/sessions/${sessionId}/results`}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 shadow-sm"
                >
                  Voir le rapport détaillé
                </Link>
              </div>
              
              <div className="mt-8 flex justify-center">
                <div className="inline-block bg-white p-3 rounded-lg border shadow-sm">
                  <p className="font-mono text-lg font-semibold mb-1">Code de session:</p>
                  <p className="font-mono text-2xl font-bold text-primary">{session?.session_code}</p>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return <div>Contenu non disponible</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-0 relative overflow-hidden">
      <DotPattern className="absolute inset-0 z-0" />
      
      {/* Contenu du slide actuel */}
      <div className="container mx-auto px-4 min-h-screen flex flex-col">
        <div className="flex-grow flex items-center justify-center py-8">
          {renderCurrentSlide()}
        </div>
        
        {/* Navigation entre slides */}
        <div className="flex justify-between items-center p-4 bg-white border-t border-gray-200 sticky bottom-16 z-10 rounded-t-lg">
          <button
            onClick={goToPreviousSlide}
            disabled={currentSlide === 'join'}
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${
              currentSlide === 'join' 
                ? 'bg-white text-gray-400 cursor-not-allowed border border-gray-200' 
                : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-300 shadow-sm'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Précédent
          </button>
          
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${currentSlide === 'join' ? 'bg-primary' : 'bg-gray-300'}`}></div>
            <div className={`h-3 w-3 rounded-full ${currentSlide === 'pause' ? 'bg-primary' : 'bg-gray-300'}`}></div>
            <div className={`h-3 w-3 rounded-full ${currentSlide === 'interact' ? 'bg-primary' : 'bg-gray-300'}`}></div>
            <div className={`h-3 w-3 rounded-full ${currentSlide === 'analysis' ? 'bg-primary' : 'bg-gray-300'}`}></div>
            <div className={`h-3 w-3 rounded-full ${currentSlide === 'results' ? 'bg-primary' : 'bg-gray-300'}`}></div>
          </div>
          
          <button
            onClick={goToNextSlide}
            disabled={currentSlide === 'results'}
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${
              currentSlide === 'results' 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
            }`}
          >
            Suivant
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Footer avec branding */}
      <div className="fixed bottom-0 left-0 right-0 bg-white py-3 border-t border-gray-200 shadow-md z-20">
        <div className="container mx-auto px-4 flex justify-center items-center">
          <div className="flex items-center">
            <span className="font-medium text-base text-gray-700">Clipboard by </span>
            <span className="ml-1 font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">ConnectedMate</span>
          </div>
        </div>
      </div>
    </div>
  );
} 