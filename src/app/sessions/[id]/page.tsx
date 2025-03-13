'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

interface SessionDetailPageProps {
  params: {
    id: string;
  };
}

export default function SessionDetailPage({ params }: SessionDetailPageProps) {
  const sessionId = params.id;
  const router = useRouter();
  const { user } = useStore();
  
  const [session, setSession] = useState<any>(null);
  const [voteSettings, setVoteSettings] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [userParticipant, setUserParticipant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  
  // Charger les informations de la session
  useEffect(() => {
    async function loadSessionData() {
      if (!sessionId || !user) return;
      
      try {
        setLoading(true);
        
        // Charger les informations de la session
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();
          
        if (sessionError) throw sessionError;
        if (!sessionData) throw new Error('Session non trouvée');
        
        setSession(sessionData);
        setIsHost(sessionData.user_id === user.id);
        
        // Charger les paramètres de vote
        const { data: voteSettingsData } = await supabase
          .from('vote_settings')
          .select('*')
          .eq('session_id', sessionId)
          .single();
        
        setVoteSettings(voteSettingsData || {
          max_votes_per_participant: 3,
          require_reason: false,
          voting_duration: 1200,
          top_voted_count: 3
        });
        
        // Charger les participants de la session
        const { data: participantsData, error: participantsError } = await supabase
          .from('session_participants')
          .select('*')
          .eq('session_id', sessionId)
          .order('joined_at', { ascending: true });
          
        if (participantsError) throw participantsError;
        setParticipants(participantsData || []);
        
        // Vérifier si l'utilisateur est déjà participant
        const userPart = participantsData?.find((p: any) => p.user_id === user.id);
        setUserParticipant(userPart || null);
        
      } catch (err: any) {
        console.error('Error loading session data:', err);
        setError('Impossible de charger les données de la session. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    }
    
    loadSessionData();
  }, [sessionId, user]);
  
  // Démarrer la session (phase de vote)
  const handleStartVoting = async () => {
    if (!session || !isHost) return;
    
    try {
      // Mettre à jour le statut de la session
      const { error } = await supabase
        .from('sessions')
        .update({
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', sessionId);
        
      if (error) throw error;
      
      // Enregistrer les paramètres de vote s'ils n'existent pas déjà
      const { error: settingsError } = await supabase
        .from('vote_settings')
        .upsert({
          session_id: sessionId,
          ...voteSettings,
        }, { onConflict: 'session_id' });
        
      if (settingsError) throw settingsError;
      
      // Utiliser une procédure stockée ou une procédure côté serveur pour créer la notification
      // Cela évite les problèmes de politique RLS
      try {
        // Créer une notification pour tous les participants sans utiliser directement la table des notifications
        // Cette fonction procédurale gère correctement les autorisations RLS
        await supabase.rpc('create_session_notification', {
          p_session_id: sessionId,
          p_title: 'Session démarrée',
          p_message: 'La phase de vote a commencé. Vous pouvez maintenant voter pour les autres participants.',
          p_type: 'session_started'
        });
      } catch (notifError) {
        // Log l'erreur mais continuer (non bloquant)
        console.error('Erreur lors de la création des notifications:', notifError);
      }
      
      // Recharger la page pour afficher le nouvel état
      window.location.reload();
    } catch (err: any) {
      console.error('Error starting voting:', err);
      setError("Impossible de démarrer la phase de vote. Veuillez réessayer.");
    }
  };
  
  // Terminer la phase de vote manuellement
  const handleEndVoting = async () => {
    if (!session || !isHost) return;
    
    try {
      // Mettre à jour le statut de la session
      const { error } = await supabase
        .from('sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);
        
      if (error) throw error;
      
      // Rediriger vers la page des résultats
      router.push(`/sessions/${sessionId}/results`);
    } catch (err: any) {
      console.error('Error ending voting:', err);
      setError("Impossible de terminer la phase de vote. Veuillez réessayer.");
    }
  };
  
  // Créer une URL de partage pour la session
  const getShareUrl = () => {
    return typeof window !== 'undefined' 
      ? `${window.location.origin}/sessions/${sessionId}/join` 
      : '';
  };
  
  // Copier l'URL dans le presse-papier
  const copyShareUrl = () => {
    navigator.clipboard.writeText(getShareUrl())
      .then(() => {
        setShowCopiedMessage(true);
        setTimeout(() => setShowCopiedMessage(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy url: ', err);
      });
  };
  
  // Générer un QR code pour rejoindre la session
  const getQRCodeUrl = () => {
    const shareUrl = getShareUrl();
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
  };
  
  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center p-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-6 text-lg">Chargement de la session...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Erreur</h2>
          <p>{error}</p>
          <div className="mt-6">
            <Link href="/dashboard" className="cm-button">
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Session non trouvée</h2>
          <p>Impossible de trouver les informations de la session.</p>
          <div className="mt-6">
            <Link href="/dashboard" className="cm-button">
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Retour au tableau de bord
        </Link>
      </div>
      
      <div className="bento-card mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 shadow-sm h-14 w-14 flex items-center justify-center">
                <div className="text-2xl">{session.emoji || '🚀'}</div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-bricolage">{session.name}</h1>
                {session.institution && (
                  <p className="text-gray-600">{session.institution}</p>
                )}
              </div>
            </div>
            
            {session.description && (
              <p className="mt-4 text-gray-700">{session.description}</p>
            )}
            
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                {participants.length} / {session.max_participants || 30} participants
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm flex items-center ${
                session.status === 'draft' ? 'bg-gray-100 text-gray-700' : 
                session.status === 'active' ? 'bg-green-100 text-green-700' : 
                'bg-blue-100 text-blue-700'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {session.status === 'draft' ? 'Brouillon' : 
                 session.status === 'active' ? 'Active' : 'Terminée'}
              </div>
              
              <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {new Date(session.created_at).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
          
          {isHost && (
            <div className="flex flex-col gap-2">
              {session.status === 'draft' && (
                <button 
                  onClick={handleStartVoting}
                  className="cm-button flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Démarrer la session
                </button>
              )}
              
              {session.status === 'active' && (
                <>
                  <Link 
                    href={`/sessions/${sessionId}/run`}
                    className="cm-button bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 flex items-center justify-center gap-2 py-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Lancer la présentation
                  </Link>
                  
                  <button 
                    onClick={handleEndVoting}
                    className="cm-button-secondary flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                    Terminer la session
                  </button>
                </>
              )}
              
              <Link 
                href={`/sessions/${sessionId}/edit`}
                className="cm-button-secondary flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Modifier
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Contenu principal de la session selon son statut */}
      {session.status === 'draft' && (
        <div className="bento-card">
          <h2 className="text-xl font-semibold mb-4">Partager la session</h2>
          <p className="text-gray-600 mb-6">
            Partagez ce lien avec vos participants pour qu'ils puissent rejoindre la session.
          </p>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={getShareUrl()}
                  readOnly
                  className="cm-input pr-24"
                />
                <button
                  onClick={copyShareUrl}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 cm-button-secondary text-sm py-1 px-3"
                >
                  {showCopiedMessage ? 'Copié !' : 'Copier'}
                </button>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">Instructions pour les participants</h3>
                <ol className="list-decimal list-inside text-gray-700 space-y-2">
                  <li>Cliquez sur le lien ci-dessus pour rejoindre la session</li>
                  <li>Connectez-vous ou créez un compte si nécessaire</li>
                  <li>Attendez que l'hôte démarre la session</li>
                </ol>
              </div>
            </div>
            
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="bg-white p-2 border rounded-lg shadow-sm">
                <Image
                  src={getQRCodeUrl()}
                  alt="QR Code pour rejoindre la session"
                  width={150}
                  height={150}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">Scanner pour rejoindre</p>
            </div>
          </div>
        </div>
      )}
      
      {session.status === 'active' && (
        <div className="bento-card">
          <h2 className="text-xl font-semibold mb-4">Session en cours</h2>
          <p className="text-gray-600 mb-6">
            La session est actuellement active. Les participants peuvent contribuer et voter.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isHost && (
              <Link 
                href={`/sessions/${sessionId}/run`}
                className="cm-button bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 flex items-center justify-center gap-2 py-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Lancer la présentation
              </Link>
            )}
            
            <Link 
              href={`/sessions/${sessionId}/vote`}
              className="cm-button flex items-center gap-2 justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              Participer à la session
            </Link>
          </div>
        </div>
      )}
      
      {session.status === 'ended' && (
        <div className="bento-card">
          <h2 className="text-xl font-semibold mb-4">Session terminée</h2>
          <p className="text-gray-600 mb-6">
            Cette session est terminée. Vous pouvez consulter les résultats.
          </p>
          
          <div className="flex justify-center">
            <Link 
              href={`/sessions/${sessionId}/results`}
              className="cm-button flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Voir les résultats
            </Link>
          </div>
        </div>
      )}
      
      {/* Liste des participants */}
      <div className="bento-card mt-6">
        <h2 className="text-xl font-semibold mb-4">Participants ({participants.length})</h2>
        
        {participants.length === 0 ? (
          <p className="text-gray-600">
            Aucun participant n'a encore rejoint cette session.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="bg-blue-100 text-blue-800 h-10 w-10 rounded-full flex items-center justify-center font-semibold">
                  {participant.display_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium">{participant.display_name || 'Anonyme'}</p>
                  <p className="text-xs text-gray-500">
                    Rejoint le {new Date(participant.joined_at).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'short'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 