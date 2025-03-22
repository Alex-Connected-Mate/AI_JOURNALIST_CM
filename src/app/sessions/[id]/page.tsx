'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import SessionStartedNotification from '@/components/SessionStartedNotification';
import { QRCodeSVG } from 'qrcode.react';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [sessionJustStarted, setSessionJustStarted] = useState(false);
  
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
      
      // Mettre à jour localement le statut de la session
      setSession({...session, status: 'active'});
      
      // Afficher la notification de session démarrée
      setSessionJustStarted(true);
      
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
    if (typeof window === 'undefined') return '';
    
    // Utiliser le code de session
    const sessionCode = session?.code || session?.session_code;
    if (!sessionCode) return '';
    
    return `${window.location.origin}/join/${sessionId}`;
  };
  
  // Copier l'URL dans le presse-papier
  const copyShareUrl = () => {
    const url = getShareUrl();
    if (!url) return;
    
    navigator.clipboard.writeText(url)
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
    const directUrl = getShareUrl();
    if (!directUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(directUrl)}`;
  };
  
  // Fonction pour supprimer une session
  const handleDeleteSession = async () => {
    if (!session || !isHost || deleteConfirmText !== session.name) return;
    
    try {
      // Supprimer la session
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);
        
      if (error) throw error;
      
      // Rediriger vers le tableau de bord
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error deleting session:', err);
      setError("Impossible de supprimer la session. Veuillez réessayer.");
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la session...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-4 text-lg font-medium text-gray-900">Erreur</h2>
            <p className="mt-2 text-gray-500">{error}</p>
          </div>
          <div className="mt-6">
            <Link href="/dashboard" className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/dashboard" className="text-primary hover:text-primary-dark flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Retour au tableau de bord
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* En-tête de la session */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{session.title || session.name}</h1>
                <p className="text-gray-600">{session.institution}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  session.status === 'active' ? 'bg-green-100 text-green-800' :
                  session.status === 'ended' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {session.status === 'active' ? 'Active' :
                   session.status === 'ended' ? 'Terminée' :
                   'Brouillon'}
                </span>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Colonne de gauche - Informations de la session */}
              <div>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Informations de la session</h2>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Code de session</dt>
                      <dd className="mt-1 text-lg font-mono font-bold text-primary">{session.code || session.session_code}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Participants maximum</dt>
                      <dd className="mt-1 text-lg font-medium text-gray-900">{session.max_participants || 30}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Créée le</dt>
                      <dd className="mt-1 text-gray-900">{new Date(session.created_at).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </div>

                {/* Actions de la session */}
                <div className="mt-6 space-y-4">
                  {session.status === 'active' && (
                    <>
                      <Link 
                        href={`/sessions/${sessionId}/run`}
                        className="block w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary text-center"
                      >
                        Lancer la présentation
                      </Link>
                      <button
                        onClick={handleEndVoting}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        Terminer la session
                      </button>
                    </>
                  )}
                  <Link
                    href={`/sessions/${sessionId}/edit`}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary text-center"
                  >
                    Modifier la session
                  </Link>
                </div>
              </div>

              {/* Colonne de droite - QR Code et partage */}
              <div>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Partager la session</h2>
                  
                  <div className="flex flex-col items-center space-y-6">
                    {/* QR Code */}
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <QRCodeSVG value={getShareUrl()} size={200} />
                    </div>

                    {/* URL de partage */}
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL de la session
                      </label>
                      <div className="flex rounded-md shadow-sm">
                        <input
                          type="text"
                          readOnly
                          value={getShareUrl()}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                        />
                        <button
                          onClick={copyShareUrl}
                          className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                          {showCopiedMessage ? 'Copié !' : 'Copier'}
                        </button>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="w-full bg-white rounded-lg p-4 border border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-2">Instructions pour les participants</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600">
                        <li>Scannez le QR code ou utilisez l'URL ci-dessus</li>
                        <li>Entrez le code de session : <span className="font-mono font-bold text-primary">{session.code || session.session_code}</span></li>
                        <li>Suivez les instructions à l'écran pour rejoindre</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 