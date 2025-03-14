import React, { useState, useEffect } from 'react';
import { DEFAULT_NUGGETS_AGENT, DEFAULT_LIGHTBULBS_AGENT, DEFAULT_AI_CONFIGURATION, AnalysisItem } from '@/config/ai-agents';
import { AnalysisService, AnalysisResult } from '@/lib/analysis-service';
import FinalAnalysisPresentation from '@/components/FinalAnalysisPresentation';
import { Card } from '@/components/ui/card';

/**
 * Page d'exemple pour montrer l'utilisation du composant FinalAnalysisPresentation
 * et du service d'analyse
 */
export default function AnalysisExamplePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [analyses, setAnalyses] = useState<{
    nuggets?: AnalysisResult;
    lightbulbs?: AnalysisResult;
    global?: AnalysisResult;
  }>({});

  // Simuler les conversations
  const mockConversations = {
    nuggets: [
      { 
        participantId: 'user1', 
        messages: [
          { role: 'user', content: 'Nous avons développé une application de logistique durable.' },
          { role: 'assistant', content: 'C\'est intéressant, pouvez-vous m\'en dire plus sur votre approche?' }
        ] 
      },
      { 
        participantId: 'user2', 
        messages: [
          { role: 'user', content: 'Notre stratégie de pénétration de marché repose sur des partenariats locaux.' },
          { role: 'assistant', content: 'Comment avez-vous identifié ces partenaires potentiels?' }
        ] 
      }
    ],
    lightbulbs: [
      { 
        participantId: 'user3', 
        messages: [
          { role: 'user', content: 'Et si on créait une plateforme d\'échange de compétences avec une monnaie alternative?' },
          { role: 'assistant', content: 'Comment imagineriez-vous la valorisation de ces compétences?' }
        ] 
      },
      { 
        participantId: 'user4', 
        messages: [
          { role: 'user', content: 'On pourrait développer un système d\'apprentissage intégré aux moments d\'attente quotidiens.' },
          { role: 'assistant', content: 'Quels types de contenus seraient les plus adaptés à ces micro-moments?' }
        ] 
      }
    ]
  };
  
  // Ordre des analyses défini par l'utilisateur
  const analysisOrder = DEFAULT_AI_CONFIGURATION.finalAnalysis.items as AnalysisItem[];

  useEffect(() => {
    // Simuler un chargement d'API
    const loadAnalyses = async () => {
      setIsLoading(true);
      try {
        // Dans un cas réel, nous récupérerions ces données depuis une API
        // Ici, nous utilisons directement notre service d'analyse avec des données simulées
        const results = await AnalysisService.generateAllAnalyses(
          DEFAULT_NUGGETS_AGENT,
          DEFAULT_LIGHTBULBS_AGENT,
          mockConversations
        );
        
        setAnalyses(results);
      } catch (error) {
        console.error('Erreur lors du chargement des analyses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAnalyses();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Card className="p-8 mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">Présentation des Analyses Finales</h1>
        <p className="text-gray-600 text-center mb-6">
          Exemple de présentation des analyses générées par AI Nuggets et AI Lightbulbs.
          L'ordre d'affichage est configurable par le professeur.
        </p>
        
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Configuration actuelle</h2>
          <div className="space-y-2">
            {analysisOrder.map((item, index) => (
              <div key={item.id} className="flex items-center">
                <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center mr-3">
                  {index + 1}
                </span>
                <span className={`px-2 py-1 rounded text-sm ${
                  item.type === 'nuggets' 
                    ? 'bg-blue-100 text-blue-800' 
                    : item.type === 'lightbulbs'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-purple-100 text-purple-800'
                }`}>
                  {item.title}
                </span>
                <span className="ml-2 text-sm">
                  ({item.enabled ? 'Activé' : 'Désactivé'})
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
      
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <FinalAnalysisPresentation
          analysisItems={analysisOrder}
          nuggetsAnalysis={analyses.nuggets}
          lightbulbsAnalysis={analyses.lightbulbs}
          globalAnalysis={analyses.global}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
} 