import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '../../../lib/store';
import { supabase } from '../../../lib/supabase';

export default function SessionDetailPage() {
  const router = useRouter();
  const { id: sessionId } = router.query;
  const { user, profile } = useStore();
  
  const [session, setSession] = useState(null);
  const [voteSettings, setVoteSettings] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [userParticipant, setUserParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        const userPart = participantsData?.find(p => p.user_id === user.id);
        setUserParticipant(userPart || null);
        
      } catch (err) {
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
      
      // Recharger la page pour afficher le nouvel état
      window.location.reload();
    } catch (err) {
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
    } catch (err) {
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
  
  // Générer un QR code pour rejoindre la session (URL simplifiée pour l'exemple)
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
    <div className="container mx-auto max-w-4xl px-4 py-8 min-h-screen">
      {/* Message de copie réussie */}
      {showCopiedMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50 animate-fadeIn">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>URL copiée dans le presse-papier</span>
          </div>
        </div>
      )}
      
      {/* En-tête de la session */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-bold font-bricolage">{session.name}</h1>
            <p className="text-gray-600">{session.institution}</p>
            {session.professorName && (
              <p className="text-gray-600 text-sm mt-1">Par {session.professorName}</p>
            )}
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="text-sm font-medium px-3 py-1 rounded-full inline-flex items-center justify-center 
              ${session.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                session.status === 'active' ? 'bg-green-100 text-green-800' : 
                session.status === 'ended' ? 'bg-yellow-100 text-yellow-800' : 
                session.status === 'ai_discussion' ? 'bg-purple-100 text-purple-800' : 
                'bg-blue-100 text-blue-800'}"
            >
              {session.status === 'draft' ? 'Brouillon' : 
               session.status === 'active' ? 'Vote en cours' : 
               session.status === 'ended' ? 'Vote terminé' : 
               session.status === 'ai_discussion' ? 'Discussion IA en cours' : 
               'Terminée'}
            </div>
          </div>
        </div>
        
        {/* Indicateur de progression */}
        <div className="mt-6">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Étape</span>
            <span className="text-xs font-medium text-gray-500">
              {session.status === 'draft' ? '1' : 
               session.status === 'active' ? '3' : 
               session.status === 'ended' ? '4' : 
               session.status === 'ai_discussion' ? '5' : '5'}/5
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                session.status === 'draft' ? 'bg-blue-600 w-1/5' : 
                session.status === 'active' ? 'bg-green-600 w-3/5' : 
                session.status === 'ended' ? 'bg-yellow-600 w-4/5' : 
                session.status === 'ai_discussion' ? 'bg-amber-600 w-full' : 
                'bg-blue-600 w-full'
              }`}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs mt-1">
            <span className={`${session.status === 'draft' ? 'font-bold text-blue-600' : 'text-gray-500'}`}>Configuration</span>
            <span className={`${session.status === 'active' ? 'font-bold text-green-600' : 'text-gray-500'}`}>Vote</span>
            <span className={`${session.status === 'ended' ? 'font-bold text-yellow-600' : 'text-gray-500'}`}>Résultats</span>
            <span className={`${session.status === 'ai_discussion' ? 'font-bold text-amber-600' : 'text-gray-500'}`}>IA & Synthèse</span>
          </div>
        </div>
      </div>
      
      {/* Corps de la page selon l'état de la session */}
      {session.status === 'draft' ? (
        // Session en mode brouillon - Vue du professeur
        isHost ? (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
              <h2 className="text-lg font-medium text-blue-800 mb-2">Session prête à démarrer</h2>
              <p className="text-blue-700 mb-4">
                Vous êtes le professeur de cette session. Partagez l'URL avec vos participants pour qu'ils puissent rejoindre avant de commencer.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="text-md font-medium mb-2">Partager avec les participants</h3>
                  <div className="flex">
                    <input 
                      type="text" 
                      value={getShareUrl()} 
                      className="cm-input flex-grow" 
                      readOnly 
                      onClick={(e) => e.target.select()}
                    />
                    <button 
                      onClick={copyShareUrl} 
                      className="ml-2 px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                      title="Copier l'URL"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-md font-medium mb-2">Ou scanner le QR code</h3>
                  <div className="inline-block bg-white p-2 border rounded">
                    <img src={getQRCodeUrl()} alt="QR Code" width={150} height={150} />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <button 
                  onClick={handleStartVoting} 
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm font-medium flex items-center justify-center mx-auto transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Démarrer la phase de vote
                </button>
                <p className="mt-3 text-sm text-blue-600">
                  {participants.length} participant{participants.length !== 1 ? 's' : ''} ont déjà rejoint la session
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-6">Paramètres de la session</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Configuration du profil</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>
                        Mode de profil: {
                          session.profileMode === 'anonymous' ? 'Anonyme' :
                          session.profileMode === 'semi-anonymous' ? 'Semi-anonyme' :
                          'Non-anonyme'
                        }
                      </li>
                      <li>Maximum de participants: {session.maxParticipants}</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Configuration des votes</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>Votes par participant: {voteSettings.max_votes_per_participant}</li>
                      <li>Participants "Nuggets": {voteSettings.top_voted_count}</li>
                      <li>Durée de vote: {Math.floor(voteSettings.voting_duration / 60)} minutes</li>
                      <li>Raison requise: {voteSettings.require_reason ? 'Oui' : 'Non'}</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <Link href={`/sessions/${sessionId}/edit`} className="cm-button-outlined">
                  Modifier les paramètres
                </Link>
              </div>
            </div>
            
            {/* Liste des participants */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Participants ({participants.length})</h2>
              
              {participants.length === 0 ? (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">
                    Aucun participant n'a encore rejoint la session.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Partagez l'URL ou le code QR pour inviter des participants.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {participants.map((participant) => {
                    const displayName = participant.anonymous_id || participant.display_name || 'Participant';
                    
                    return (
                      <div key={participant.id} className="border rounded-lg p-3 flex items-center">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base mr-3" 
                          style={{ backgroundColor: participant.profile_color || '#3B82F6' }}
                        >
                          {participant.selected_emoji || displayName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-medium">{displayName}</h3>
                          <p className="text-xs text-gray-500">
                            Rejoint {new Date(participant.joined_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Vue du participant pour une session non démarrée
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
              <h2 className="text-lg font-medium text-blue-800 mb-2">Session pas encore démarrée</h2>
              <p className="text-blue-700 mb-4">
                Cette session n'a pas encore été démarrée par le professeur. Veuillez patienter.
              </p>
              
              {!userParticipant ? (
                <div className="mt-6 text-center">
                  <Link href={`/sessions/${sessionId}/join`} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm font-medium inline-flex items-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                    Rejoindre la session
                  </Link>
                </div>
              ) : (
                <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-800">
                    Vous avez rejoint cette session en tant que participant.
                  </p>
                  <p className="mt-2 text-blue-600">
                    Vous serez notifié lorsque la session démarrera.
                  </p>
                </div>
              )}
            </div>
            
            {/* Informations sur la session */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">À propos de cette session</h2>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  Le professeur a configuré cette session pour que les participants puissent interagir et voter les uns pour les autres.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Mode de profil</h3>
                    <p className="text-gray-600">
                      {session.profileMode === 'anonymous' ? 
                        'Les participants seront anonymes avec des identifiants générés.' :
                      session.profileMode === 'semi-anonymous' ? 
                        'Les participants pourront utiliser un pseudonyme et personnaliser leur profil.' :
                        'Les participants utiliseront leur vrai nom et informations.'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Phase de vote</h3>
                    <p className="text-gray-600">
                      Chaque participant pourra voter pour {voteSettings.max_votes_per_participant} personne(s) 
                      {voteSettings.require_reason ? ' en donnant une raison' : ''}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      ) : session.status === 'active' ? (
        // Session active - Phase de vote
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-100 rounded-lg p-6">
            <h2 className="text-lg font-medium text-green-800 mb-2">Phase de vote en cours</h2>
            <p className="text-green-700 mb-4">
              Les participants peuvent maintenant voter les uns pour les autres. 
              {isHost ? ' Vous pouvez suivre les résultats en temps réel.' : ' Votez pour les participants que vous trouvez intéressants.'}
            </p>
            
            <div className="mt-6 text-center">
              {isHost ? (
                <>
                  <Link href={`/sessions/${sessionId}/results`} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm font-medium inline-flex items-center mr-4 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    Voir les résultats en direct
                  </Link>
                  <button 
                    onClick={handleEndVoting} 
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-md shadow-sm font-medium inline-flex items-center transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                    Terminer la phase de vote
                  </button>
                </>
              ) : (
                <>
                  {userParticipant ? (
                    <Link href={`/sessions/${sessionId}/vote`} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm font-medium inline-flex items-center transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      Participer au vote
                    </Link>
                  ) : (
                    <Link href={`/sessions/${sessionId}/join`} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm font-medium inline-flex items-center transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                      Rejoindre la session
                    </Link>
                  )}
                </>
              )}
            </div>
            
          </div>
        </div>
      ) : session.status === 'ended' || session.status === 'ai_discussion' ? (
        // Phase de vote terminée ou phase de discussion IA
        <div className="space-y-6">
          <div className={`${
            session.status === 'ended' ? 'bg-yellow-50 border-yellow-100' : 'bg-purple-50 border-purple-100'
          } border rounded-lg p-6`}>
            <h2 className={`text-lg font-medium mb-2 ${
              session.status === 'ended' ? 'text-yellow-800' : 'text-purple-800'
            }`}>
              {session.status === 'ended' ? 'Phase de vote terminée' : 'Phase de discussion IA en cours'}
            </h2>
            
            <p className={`mb-4 ${
              session.status === 'ended' ? 'text-yellow-700' : 'text-purple-700'
            }`}>
              {session.status === 'ended' 
                ? 'Les résultats des votes sont maintenant disponibles. Les participants sélectionnés pourront bientôt interagir avec l\'IA.'
                : 'Les participants sélectionnés interagissent actuellement avec l\'IA. Les résultats seront compilés à la fin de la session.'
              }
            </p>
            
            <div className="mt-6 text-center">
              <Link href={`/sessions/${sessionId}/results`} className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md shadow-sm font-medium inline-flex items-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Voir les résultats des votes
              </Link>
              
              {session.status === 'ai_discussion' && (
                <Link href={`/sessions/${sessionId}/ai-discussion`} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-sm font-medium inline-flex items-center ml-4 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                  Aller à la discussion IA
                </Link>
              )}
            </div>
          </div>
          
          {/* Statistiques de la session */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Statistiques de la session</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {participants.length}
                </div>
                <div className="text-gray-600">Participants</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {voteSettings.max_votes_per_participant}
                </div>
                <div className="text-gray-600">Votes par personne</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {voteSettings.top_voted_count}
                </div>
                <div className="text-gray-600">Participants "Nuggets"</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Session terminée
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-medium text-gray-800 mb-2">
            Cette session est terminée
          </h2>
          <p className="text-gray-600 mb-6">
            La session est complètement terminée et archivée.
          </p>
          <Link href="/dashboard" className="cm-button">
            Retour au tableau de bord
          </Link>
        </div>
      )}
      
      {/* Navigation */}
      <div className="mt-12 border-t pt-6 text-center">
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Retour au tableau de bord
        </Link>
      </div>
      
      {/* Processus visuel de la session */}
      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Processus de session</h2>
          <Link href="/docs/process" className="text-blue-600 text-sm hover:underline">
            En savoir plus
          </Link>
        </div>
        
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {/* Bloc 1: Création de session */}
          <div className={`min-w-[220px] ${
            session.status === 'draft' 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-gray-50 border-gray-200'
          } border rounded-lg p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`${
                session.status === 'draft' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              } p-1 rounded font-bold`}>1</div>
              <h3 className="font-medium">Configuration</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Définissez les paramètres et partagez l'URL avec les participants.
            </p>
            <div className="text-xs text-gray-500">
              {session.status === 'draft' ? 'Vous êtes ici →' : '→'}
            </div>
          </div>
          
          {/* Bloc 2: Phase de participation */}
          <div className={`min-w-[220px] ${
            (session.status === 'draft' && participants.length > 0) 
              ? 'bg-purple-50 border-purple-200' 
              : 'bg-gray-50 border-gray-200'
          } border rounded-lg p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`${
                (session.status === 'draft' && participants.length > 0) 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-gray-100 text-gray-800'
              } p-1 rounded`}>2</div>
              <h3 className="font-medium">Participation</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Les participants rejoignent la session et se préparent à voter.
            </p>
            <div className="text-xs text-gray-500">
              {(session.status === 'draft' && participants.length > 0) ? 'Vous êtes ici →' : '→'}
            </div>
          </div>
          
          {/* Bloc 3: Phase de vote */}
          <div className={`min-w-[220px] ${
            session.status === 'active' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          } border rounded-lg p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`${
                session.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              } p-1 rounded`}>3</div>
              <h3 className="font-medium">Phase de vote</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Les participants votent pour les contributions les plus pertinentes.
            </p>
            <div className="text-xs text-gray-500">
              {session.status === 'active' ? 'Vous êtes ici →' : '→'}
            </div>
          </div>
          
          {/* Bloc 4: Résultats du vote */}
          <div className={`min-w-[220px] ${
            session.status === 'ended' 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-gray-50 border-gray-200'
          } border rounded-lg p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`${
                session.status === 'ended' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-gray-100 text-gray-800'
              } p-1 rounded`}>4</div>
              <h3 className="font-medium">Résultats du vote</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Les votes sont comptabilisés et les {voteSettings?.top_voted_count || 3} participants les plus votés sont sélectionnés.
            </p>
            <div className="text-xs text-gray-500">
              {session.status === 'ended' ? 'Vous êtes ici →' : '→'}
            </div>
          </div>
          
          {/* Bloc 5: IA et synthèse */}
          <div className={`min-w-[220px] ${
            session.status === 'ai_discussion' 
              ? 'bg-amber-50 border-amber-200' 
              : 'bg-gray-50 border-gray-200'
          } border rounded-lg p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`${
                session.status === 'ai_discussion' 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-gray-100 text-gray-800'
              } p-1 rounded`}>5</div>
              <h3 className="font-medium">IA & Synthèse</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              L'IA interagit avec les participants sélectionnés et synthétise les contributions.
            </p>
            {session.status === 'ai_discussion' ? <div className="text-xs text-gray-500">Vous êtes ici</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
} 