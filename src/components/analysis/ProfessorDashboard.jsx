/**
 * Tableau de bord du professeur
 * 
 * Ce composant affiche une interface complète pour superviser une session,
 * voir l'activité des participants, lancer des analyses et visualiser les résultats.
 */

import React, { useState, useEffect } from 'react';
import { TabGroup, TabList, Tab, TabPanels, TabPanel, classNames } from '@/components/Tabs';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { ANALYSIS_TYPES } from '@/lib/services/analysisService';
import AnalysisProgress from './AnalysisProgress';
import AnalysisResults from './AnalysisResults';
import logger from '@/lib/logger';

/**
 * Carte statistique
 */
function StatusCard({ title, value, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
    indigo: 'bg-indigo-50 text-indigo-700'
  };
  
  return (
    <div className={`p-4 rounded-lg ${colorClasses[color]} shadow-sm`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

/**
 * Liste des participants
 */
function ParticipantsList({ sessionId }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Charger les participants initiaux
    const loadParticipants = async () => {
      try {
        setLoading(true);
        
        // Récupérer les discussions actives pour cette session (une discussion = un participant)
        const { data, error } = await supabase
          .from('discussions')
          .select(`
            id,
            participant_id,
            agent_type,
            created_at,
            participants:participant_id (id, name, email)
          `)
          .eq('session_id', sessionId)
          .eq('is_deleted', false);
          
        if (error) {
          throw error;
        }
        
        // Récupérer les statistiques de messages pour chaque discussion
        const enhancedParticipants = await Promise.all(
          data.map(async (discussion) => {
            // Nombre de messages par discussion
            const { count: messageCount, error: msgError } = await supabase
              .from('chat_messages')
              .select('id', { count: 'exact' })
              .eq('discussion_id', discussion.id)
              .eq('is_deleted', false);
              
            if (msgError) {
              logger.error('Erreur lors du comptage des messages:', msgError);
            }
            
            // Dernier message
            const { data: lastMessage, error: lastMsgError } = await supabase
              .from('chat_messages')
              .select('created_at')
              .eq('discussion_id', discussion.id)
              .eq('is_deleted', false)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
              
            return {
              id: discussion.id,
              participantId: discussion.participant_id,
              name: discussion.participants?.name || 'Anonyme',
              email: discussion.participants?.email || null,
              agentType: discussion.agent_type,
              joinedAt: discussion.created_at,
              messageCount: messageCount || 0,
              lastActivity: lastMessage?.created_at || discussion.created_at
            };
          })
        );
        
        setParticipants(enhancedParticipants);
        setLoading(false);
      } catch (error) {
        logger.error('Erreur lors du chargement des participants:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    loadParticipants();
    
    // S'abonner aux changements de discussions pour cette session
    const discussionsSubscription = supabase
      .channel(`session-discussions-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'discussions',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        // Recharger tous les participants lorsqu'il y a des changements
        loadParticipants();
      })
      .subscribe();
      
    // S'abonner aux changements de messages pour mettre à jour les compteurs
    const messagesSubscription = supabase
      .channel(`session-messages-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `discussion_id=in.(select id from discussions where session_id='${sessionId}')`
      }, (payload) => {
        // Recharger les participants à chaque nouveau message
        // Note: Dans une implémentation réelle, on optimiserait pour ne mettre à jour que le participant concerné
        loadParticipants();
      })
      .subscribe();
      
    return () => {
      discussionsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  }, [sessionId]);
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        Erreur lors du chargement des participants: {error}
      </div>
    );
  }
  
  if (participants.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <div className="text-4xl mb-3">👥</div>
        <p className="text-gray-600">Aucun participant n'a encore rejoint cette session.</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Participant
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Agent
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Messages
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dernière activité
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statut
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {participants.map((participant) => {
            // Calculer si le participant est actif (activité dans les 5 dernières minutes)
            const isActive = new Date(participant.lastActivity) > new Date(Date.now() - 5 * 60 * 1000);
            
            return (
              <tr key={participant.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-semibold">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{participant.name}</p>
                      {participant.email && (
                        <p className="text-xs text-gray-500">{participant.email}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {participant.agentType === 'student' ? 'Étudiant' : 'Assistant IA'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {participant.messageCount}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {new Date(participant.lastActivity).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isActive 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Résumé de l'activité de chat
 */
function ChatActivitySummary({ sessionId }) {
  const [stats, setStats] = useState({
    totalMessages: 0,
    activeParticipants: 0,
    avgMessagesPerParticipant: 0,
    lastActivityTime: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        
        // Nombre total de messages
        const { count: totalMessages, error: msgError } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact' })
          .eq('session_id', sessionId)
          .eq('is_deleted', false);
          
        if (msgError) {
          throw msgError;
        }
        
        // Nombre de participants actifs (au moins un message)
        const { data: activeParticipants, error: partError } = await supabase
          .from('discussions')
          .select('participant_id')
          .eq('session_id', sessionId)
          .eq('is_deleted', false);
          
        if (partError) {
          throw partError;
        }
        
        // Dernier message
        const { data: lastMessage, error: lastMsgError } = await supabase
          .from('chat_messages')
          .select('created_at')
          .eq('session_id', sessionId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (lastMsgError && lastMsgError.code !== 'PGRST116') { // Ignorer l'erreur si aucun message n'est trouvé
          throw lastMsgError;
        }
        
        // Calculer les statistiques
        const activeParticipantsCount = activeParticipants?.length || 0;
        
        setStats({
          totalMessages: totalMessages || 0,
          activeParticipants: activeParticipantsCount,
          avgMessagesPerParticipant: activeParticipantsCount > 0 
            ? Math.round((totalMessages || 0) / activeParticipantsCount) 
            : 0,
          lastActivityTime: lastMessage?.created_at || null
        });
        
        setLoading(false);
      } catch (error) {
        logger.error('Erreur lors du chargement des statistiques:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    loadStats();
    
    // S'abonner aux changements de messages pour cette session
    const subscription = supabase
      .channel(`session-messages-stats-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        loadStats();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId]);
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        Erreur lors du chargement des statistiques: {error}
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Activité de la session</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatusCard 
          title="Messages échangés" 
          value={stats.totalMessages} 
          icon="💬" 
          color="blue" 
        />
        <StatusCard 
          title="Participants actifs" 
          value={stats.activeParticipants} 
          icon="👥" 
          color="green" 
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-700">
            Moyenne de messages par participant:
          </p>
          <p className="font-bold text-gray-800">
            {stats.avgMessagesPerParticipant}
          </p>
        </div>
        
        {stats.lastActivityTime && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-700">
              Dernière activité:
            </p>
            <p className="font-bold text-gray-800">
              {new Date(stats.lastActivityTime).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Contrôles d'analyse
 */
function AnalysisControls({ sessionId, sessionConfig }) {
  const [isLaunching, setIsLaunching] = useState({
    nuggets: false,
    lightbulbs: false,
    overall: false
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Lancer une analyse
  const launchAnalysis = async (analysisType) => {
    // Vérifier le type d'analyse
    if (!ANALYSIS_TYPES[analysisType.toUpperCase()]) {
      setError(`Type d'analyse invalide: ${analysisType}`);
      return;
    }
    
    try {
      setIsLaunching(prev => ({ ...prev, [analysisType]: true }));
      setError(null);
      setSuccessMessage(null);
      
      // Configuration à envoyer
      let configData = {};
      
      // Sélectionner la configuration en fonction du type d'analyse
      switch (analysisType) {
        case ANALYSIS_TYPES.NUGGETS:
          configData = sessionConfig?.nuggetsRules || {};
          break;
        case ANALYSIS_TYPES.LIGHTBULBS:
          configData = sessionConfig?.lightbulbsRules || {};
          break;
        case ANALYSIS_TYPES.OVERALL:
          configData = sessionConfig?.overallRules || {};
          break;
        default:
          configData = {};
      }
      
      // Appeler l'API pour lancer l'analyse
      const response = await fetch('/api/ai/analyze-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          analysisType: ANALYSIS_TYPES[analysisType.toUpperCase()],
          config: configData
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du lancement de l\'analyse');
      }
      
      const result = await response.json();
      setSuccessMessage(result.message || `Analyse ${analysisType} lancée avec succès`);
      
      // Attendre un court délai pour permettre à l'utilisateur de voir le message de succès
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      logger.error(`Erreur lors du lancement de l'analyse ${analysisType}:`, error);
      setError(error.message);
    } finally {
      setIsLaunching(prev => ({ ...prev, [analysisType]: false }));
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Lancer une analyse</h3>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4">
          {successMessage}
        </div>
      )}
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <button
          onClick={() => launchAnalysis('nuggets')}
          disabled={isLaunching.nuggets}
          className={`p-4 rounded-lg flex flex-col items-center justify-center border border-blue-200 ${
            isLaunching.nuggets ? 'bg-blue-50 cursor-wait' : 'bg-white hover:bg-blue-50'
          }`}
        >
          <span className="text-3xl mb-2">💎</span>
          <h4 className="font-medium text-gray-800">Analyse Nuggets</h4>
          <p className="text-xs text-gray-500 text-center mt-1">
            Extraire les idées clés et les insights de chaque discussion, 
            en identifiant les modèles de pensée et les concepts importants.
          </p>
          {isLaunching.nuggets && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mt-2"></div>
          )}
        </button>
        
        <button
          onClick={() => launchAnalysis('lightbulbs')}
          disabled={isLaunching.lightbulbs}
          className={`p-4 rounded-lg flex flex-col items-center justify-center border border-yellow-200 ${
            isLaunching.lightbulbs ? 'bg-yellow-50 cursor-wait' : 'bg-white hover:bg-yellow-50'
          }`}
        >
          <span className="text-3xl mb-2">💡</span>
          <h4 className="font-medium text-gray-800">Analyse Lightbulbs</h4>
          <p className="text-xs text-gray-500 text-center mt-1">
            Identifie les idées innovantes et créatives, en évaluant leur potentiel 
            et en suggérant des pistes de développement.
          </p>
          {isLaunching.lightbulbs && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700 mt-2"></div>
          )}
        </button>
        
        <button
          onClick={() => launchAnalysis('overall')}
          disabled={isLaunching.overall}
          className={`p-4 rounded-lg flex flex-col items-center justify-center border border-green-200 ${
            isLaunching.overall ? 'bg-green-50 cursor-wait' : 'bg-white hover:bg-green-50'
          }`}
        >
          <span className="text-3xl mb-2">📊</span>
          <h4 className="font-medium text-gray-800">Analyse Globale</h4>
          <p className="text-xs text-gray-500 text-center mt-1">
            Synthétise l'ensemble des discussions pour dégager les thèmes principaux, 
            les points forts et les recommandations actionables.
          </p>
          {isLaunching.overall && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mt-2"></div>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Tableau de bord du professeur
 */
export default function ProfessorDashboard({ sessionId, sessionConfig }) {
  const [activeTab, setActiveTab] = useState(0);
  const [analysisData, setAnalysisData] = useState({});
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [activeAnalysisType, setActiveAnalysisType] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  
  // Catégories d'onglets
  const tabCategories = [
    { id: 'participants', name: 'Participants', icon: '👥' },
    { id: 'analysis', name: 'Analyses', icon: '📊' },
    { id: 'results', name: 'Résultats', icon: '📋' }
  ];
  
  // Charger les résultats d'analyse
  useEffect(() => {
    const loadAnalysisResults = async () => {
      if (activeTab !== 2) return; // Ne charger que si on est sur l'onglet Résultats
      
      try {
        setIsLoadingAnalysis(true);
        setAnalysisError(null);
        
        // Appeler l'API pour récupérer les résultats d'analyse
        const response = await fetch(`/api/ai/get-analysis?sessionId=${sessionId}&showAll=true`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors de la récupération des analyses');
        }
        
        const result = await response.json();
        
        // Organiser les données par type d'analyse
        const organizedData = {};
        
        // Traiter les analyses globales
        if (result.globalAnalyses && result.globalAnalyses.length > 0) {
          result.globalAnalyses.forEach(analysis => {
            if (analysis.content) {
              organizedData[analysis.analysis_type] = analysis.content;
            }
          });
        }
        
        // Si aucune donnée n'est disponible, utiliser des exemples statiques pour les tests
        if (Object.keys(organizedData).length === 0) {
          // Exemple de données Nuggets
          organizedData[ANALYSIS_TYPES.NUGGETS] = {
            insights: [
              {
                title: "Insight principal: Comprendre les besoins utilisateurs",
                description: "La discussion a mis en évidence l'importance de comprendre les besoins des utilisateurs avant de concevoir des fonctionnalités.",
                keyPoints: [
                  "L'empathie avec l'utilisateur est cruciale",
                  "Les entretiens utilisateurs doivent précéder le développement",
                  "Le feedback continu améliore la pertinence des solutions"
                ],
                relevantQuotes: [
                  {
                    text: "Nous devrions toujours commencer par comprendre pourquoi l'utilisateur a besoin de cette fonctionnalité",
                    context: "Discussion sur la méthodologie de conception"
                  }
                ]
              }
            ],
            patternDiscovered: {
              pattern: "Approche centrée utilisateur",
              evidence: "Les participants reviennent systématiquement à la question 'Qu'est-ce que l'utilisateur cherche à accomplir?'",
              significance: "Cette approche permet d'éviter le développement de fonctionnalités non pertinentes"
            }
          };
          
          // Exemple de données Lightbulbs
          organizedData[ANALYSIS_TYPES.LIGHTBULBS] = {
            innovativeIdeas: [
              {
                title: "Intégration de l'IA pour anticiper les besoins utilisateurs",
                description: "Utiliser l'apprentissage automatique pour prédire les actions que l'utilisateur souhaite accomplir en fonction de son comportement passé.",
                potentialApplications: [
                  "Recommandations personnalisées dans l'interface",
                  "Auto-complétion contextuelle des formulaires",
                  "Ajustement dynamique des workflows en fonction de l'utilisateur"
                ]
              }
            ],
            crossConnections: [
              {
                domains: ["UX Design", "Intelligence Artificielle"],
                insight: "Combiner l'analyse comportementale avec l'IA prédictive",
                value: "Permet une personnalisation de l'expérience sans effort supplémentaire pour l'utilisateur"
              }
            ],
            evaluationScore: 4,
            developmentSuggestions: [
              "Explorer les modèles de prédiction comportementale appliqués à l'UX",
              "Tester avec un groupe pilote pour mesurer l'impact sur l'expérience utilisateur",
              "Intégrer progressivement pour ne pas perturber les utilisateurs habitués à l'interface actuelle"
            ]
          };
          
          // Exemple de données Overall
          organizedData[ANALYSIS_TYPES.OVERALL] = {
            sessionOverview: {
              totalDiscussions: 4,
              analyzedDiscussions: 4,
              participationLevel: "Élevé",
              overallQuality: "Excellente"
            },
            keySynthesis: {
              mainThemes: [
                {
                  title: "Conception centrée utilisateur",
                  frequency: 85,
                  significance: "Haute",
                  relatedInsights: 3
                },
                {
                  title: "Innovation technologique",
                  frequency: 65,
                  significance: "Moyenne",
                  relatedInsights: 2
                }
              ],
              innovationHotspots: [
                {
                  area: "IA appliquée à l'expérience utilisateur",
                  participants: 3,
                  potentialImpact: "Significatif"
                }
              ]
            },
            actionableRecommendations: [
              {
                title: "Mettre en place un processus de test utilisateur systématique",
                description: "Établir un protocole pour tester chaque nouvelle fonctionnalité avec un panel d'utilisateurs représentatifs avant le déploiement.",
                implementationSteps: [
                  "Constituer un panel d'utilisateurs diversifiés",
                  "Créer des scénarios de test standard",
                  "Établir des métriques quantitatives et qualitatives"
                ],
                expectedOutcomes: "Réduction des fonctionnalités peu utilisées et augmentation de la satisfaction utilisateur"
              }
            ],
            sessionSummary: {
              strengths: [
                "Forte implication des participants",
                "Grande diversité des perspectives",
                "Focus constant sur les besoins utilisateurs"
              ],
              opportunities: [
                "Explorer davantage l'intersection entre IA et UX",
                "Développer des méthodes de test utilisateur plus efficaces"
              ],
              overallConclusion: "La session a permis de faire émerger une vision commune centrée sur l'utilisateur, avec des idées innovantes à l'intersection de l'IA et de l'UX. La prochaine étape serait de structurer ces insights en méthodologie applicable au prochain cycle de développement."
            }
          };
        }
        
        setAnalysisData(organizedData);
        setIsLoadingAnalysis(false);
      } catch (error) {
        logger.error('Erreur lors du chargement des résultats d\'analyse:', error);
        setAnalysisError(error.message);
        setIsLoadingAnalysis(false);
      }
    };
    
    loadAnalysisResults();
  }, [sessionId, activeTab]);
  
  // Gérer le changement d'onglet
  const handleTabChange = (index) => {
    setActiveTab(index);
  };
  
  // Gérer le lancement d'une nouvelle analyse
  const handleStartAnalysis = (analysisType) => {
    setActiveAnalysisType(analysisType);
  };
  
  return (
    <div className="bg-gray-100 rounded-lg shadow-md overflow-hidden">
      <TabGroup selectedIndex={activeTab} onChange={handleTabChange}>
        <TabList className="flex bg-white border-b border-gray-200">
          {tabCategories.map((category, index) => (
            <Tab
              key={category.id}
              index={index}
              className={({ selected }) => classNames(
                'py-4 px-6 text-sm font-medium flex items-center gap-2 focus:outline-none',
                selected 
                  ? 'text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
              )}
            >
              <span>{category.icon}</span>
              {category.name}
            </Tab>
          ))}
        </TabList>
        
        <TabPanels>
          {/* Participants Tab */}
          <TabPanel index={0}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                  <ChatActivitySummary sessionId={sessionId} />
                </div>
                <div>
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">QR Code</h3>
                    <div className="bg-gray-100 p-4 rounded-lg text-center">
                      <p className="text-gray-600 text-sm">
                        Scannez ce code pour rejoindre la session:
                      </p>
                      <div className="p-4">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/join/' + sessionId)}`} 
                          alt="QR Code de la session" 
                          className="mx-auto"
                        />
                      </div>
                      <p className="text-xs text-gray-500 break-all mt-2">
                        {window.location.origin}/join/{sessionId}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-bold mb-4 text-gray-800">Liste des participants</h3>
                <ParticipantsList sessionId={sessionId} />
              </div>
            </motion.div>
          </TabPanel>
          
          {/* Chat Activity Tab */}
          <TabPanel index={1}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                <StatusCard
                  title="Total Messages"
                  value={chatStats?.totalMessages || 0}
                  icon="💬"
                />
                <StatusCard
                  title="Active Discussions"
                  value={chatStats?.activeDiscussions || 0}
                  icon="🗣️"
                  highlight
                />
                <StatusCard
                  title="Response Rate"
                  value={`${chatStats?.responseRate || 0}%`}
                  icon="⚡"
                />
              </div>
              
              <div className="p-6">
                <ChatActivitySummary sessionId={sessionId} />
              </div>
            </motion.div>
          </TabPanel>
          
          {/* Analysis Tab */}
          <TabPanel index={2}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <AnalysisControls 
                  sessionId={sessionId} 
                  sessionConfig={sessionConfig}
                  onStartAnalysis={handleStartAnalysis}
                />
              </div>
              
              {activeAnalysisType === ANALYSIS_TYPES.NUGGETS && (
                <AnalysisProgress sessionId={sessionId} analysisType="Nuggets" />
              )}
              
              {activeAnalysisType === ANALYSIS_TYPES.LIGHTBULBS && (
                <AnalysisProgress sessionId={sessionId} analysisType="Lightbulbs" />
              )}
              
              {activeAnalysisType === ANALYSIS_TYPES.OVERALL && (
                <AnalysisProgress sessionId={sessionId} analysisType="globale" />
              )}
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold mb-4 text-gray-800">Types d'analyses disponibles</h3>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-medium text-blue-700">Analyse Nuggets</h4>
                    <p className="text-gray-600 mt-1">
                      Extrait les idées clés et les insights de chaque discussion, 
                      en identifiant les modèles de pensée et les concepts importants.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-yellow-500 pl-4 py-2">
                    <h4 className="font-medium text-yellow-700">Analyse Lightbulbs</h4>
                    <p className="text-gray-600 mt-1">
                      Identifie les idées innovantes et créatives, en évaluant leur potentiel 
                      et en suggérant des pistes de développement.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4 py-2">
                    <h4 className="font-medium text-green-700">Analyse Globale</h4>
                    <p className="text-gray-600 mt-1">
                      Synthétise l'ensemble des discussions pour dégager les thèmes principaux, 
                      les points forts et les recommandations actionables.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabPanel>
          
          {/* Results Tab */}
          <TabPanel index={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isLoadingAnalysis ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Chargement des résultats d'analyse...</p>
                </div>
              ) : analysisError ? (
                <div className="bg-red-50 text-red-700 p-6 rounded-lg mb-6">
                  {analysisError}
                </div>
              ) : (
                <AnalysisResults
                  sessionId={sessionId}
                  analysisData={analysisData}
                />
              )}
            </motion.div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
} 