import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useStore } from '@/lib/store';

// Composant pour afficher une session
const SessionCard = ({ session }) => {
  return (
    <Link href={`/sessions/${session.id}`} className="session-card p-5 hover:shadow-md transition-all rounded-lg border border-gray-200 bg-white flex items-start gap-4">
      <div className="rounded-lg bg-blue-50 p-2 shadow-sm h-14 w-14 flex items-center justify-center">
        <div className="text-2xl">{session.selected_emoji || '🚀'}</div>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-lg font-bricolage">{session.name}</h3>
        {session.institution && (
          <p className="text-sm text-gray-500">{session.institution}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className={`text-xs px-2 py-1 rounded-full ${
            session.status === 'draft' ? 'bg-gray-100 text-gray-700' : 
            session.status === 'active' ? 'bg-green-100 text-green-700' : 
            'bg-blue-100 text-blue-700'
          }`}>
            {session.status === 'draft' ? 'Brouillon' : 
             session.status === 'active' ? 'Active' : 'Terminée'}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(session.created_at).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'short'
            })}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs text-gray-500">Participants</span>
        <span className="font-semibold">0/{session.max_participants || 30}</span>
      </div>
    </Link>
  );
};

// Composant pour afficher un message de succès
const SuccessMessage = ({ message, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 fade-in flex justify-between items-center">
      <div className="flex items-center">
        <svg className="h-5 w-5 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>{message}</span>
      </div>
      <button onClick={onDismiss} className="text-green-700 hover:text-green-800">
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const { user, sessions, fetchSessions, logout } = useStore();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState({
    active: 0,
    ended: 0,
    participants: 0
  });
  
  // Gestion du message de succès
  useEffect(() => {
    if (router.query.success === 'session-created') {
      setSuccess('Votre session a été créée avec succès !');
    }
  }, [router.query]);
  
  // Chargement des sessions
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Si nous sommes en mode démonstration, nous n'avons pas besoin de charger les données
        if (router.query.demo) {
          setTimeout(() => {
            setLoading(false);
          }, 1000);
          return;
        }
        
        // Charger les sessions depuis Supabase via notre store
        if (user) {
          await fetchSessions();
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, fetchSessions, router.query.demo]);

  // Calcul des statistiques
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      const active = sessions.filter(s => s.status === 'active').length;
      const ended = sessions.filter(s => s.status === 'ended').length;
      const participants = 0; // À implémenter: compter les participants réels
      
      setStats({ active, ended, participants });
    }
  }, [sessions]);

  return (
    <div className="min-h-screen">
      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-8">
        {/* Message de succès */}
        {success && (
          <SuccessMessage 
            message={success} 
            onDismiss={() => setSuccess(null)} 
          />
        )}
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 font-bricolage">
            Mes sessions
          </h1>
        </div>
        
        {/* Contenu */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-6 h-6 border-2 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid gap-8">
            {/* Liste des sessions */}
            <div className="mb-8">
              {sessions && sessions.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map(session => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <div className="mb-4 text-6xl">🚀</div>
                  <h2 className="text-xl font-semibold mb-2">Commencez avec votre première session</h2>
                  <p className="text-gray-500 mb-6">Créez une session interactive pour engager vos participants dans un dialogue structuré.</p>
                  <Link href="/sessions/new" className="cm-button inline-flex items-center gap-2 px-4 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Créer votre première session
                  </Link>
                </div>
              )}
            </div>
            
            {/* Zone inspirée de Zapier montrant le processus de session */}
            {sessions && sessions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Processus de session</h2>
                  <div className="flex items-center gap-4">
                    <Link href="/docs/process" className="text-blue-600 text-sm hover:underline">
                      En savoir plus
                    </Link>
                    <Link href="/sessions/new" className="cm-button-secondary text-sm px-3 py-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Nouvelle session
                    </Link>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 overflow-x-auto pb-4">
                  {/* Bloc 1: Création de session */}
                  <div className="min-w-[220px] bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-blue-100 text-blue-800 p-1 rounded">1</div>
                      <h3 className="font-medium">Configuration</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Définissez les paramètres de votre session et les règles de vote.
                    </p>
                    <div className="text-xs text-gray-500">
                      →
                    </div>
                  </div>
                  
                  {/* Bloc 2: Phase de participation */}
                  <div className="min-w-[220px] bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-purple-100 text-purple-800 p-1 rounded">2</div>
                      <h3 className="font-medium">Participation</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Les participants rejoignent la session et interagissent.
                    </p>
                    <div className="text-xs text-gray-500">
                      →
                    </div>
                  </div>
                  
                  {/* Bloc 3: Phase de vote */}
                  <div className="min-w-[220px] bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-green-100 text-green-800 p-1 rounded">3</div>
                      <h3 className="font-medium">Phase de vote</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Les participants votent pour les contributions les plus pertinentes.
                    </p>
                    <div className="text-xs text-gray-500">
                      →
                    </div>
                  </div>
                  
                  {/* Bloc 4: IA et synthèse */}
                  <div className="min-w-[220px] bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-amber-100 text-amber-800 p-1 rounded">4</div>
                      <h3 className="font-medium">IA & Synthèse</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      L'IA synthétise les contributions les plus votées.
                    </p>
                    <div className="text-xs text-gray-500">
                      →
                    </div>
                  </div>
                  
                  {/* Bloc 5: Résultats */}
                  <div className="min-w-[220px] bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-red-100 text-red-800 p-1 rounded">5</div>
                      <h3 className="font-medium">Résultats</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Obtenez les résultats finaux et les insights de votre session.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}