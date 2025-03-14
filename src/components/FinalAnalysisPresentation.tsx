import React from 'react';
import { AnalysisItem } from '@/config/ai-agents';
import { Card } from '@/components/ui/card';
import { AnalysisResult } from '@/lib/analysis-service';
import AnalysisResultCard from './AnalysisResultCard';

interface FinalAnalysisPresentationProps {
  analysisItems: AnalysisItem[];
  nuggetsAnalysis?: AnalysisResult;
  lightbulbsAnalysis?: AnalysisResult;
  globalAnalysis?: AnalysisResult;
  isLoading?: boolean;
}

/**
 * FinalAnalysisPresentation Component
 * 
 * Affiche les différentes analyses (AI Nuggets, AI Lightbulbs, Globale) 
 * dans l'ordre configuré par le professeur, en respectant les activations/désactivations.
 */
const FinalAnalysisPresentation: React.FC<FinalAnalysisPresentationProps> = ({
  analysisItems,
  nuggetsAnalysis,
  lightbulbsAnalysis,
  globalAnalysis,
  isLoading = false
}) => {
  // Filtrer les analyses activées
  const enabledAnalysisItems = analysisItems.filter(item => item.enabled);

  // Si aucune analyse n'est activée, afficher un message
  if (enabledAnalysisItems.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune analyse configurée</h3>
        <p className="text-gray-500">
          L'administrateur de session n'a pas activé d'analyses finales pour cette session.
        </p>
      </div>
    );
  }

  // Obtenir la couleur d'accent selon le type d'analyse
  const getAccentColor = (type: string): 'blue' | 'amber' | 'purple' | 'gray' => {
    switch (type) {
      case 'nuggets':
        return 'blue';
      case 'lightbulbs':
        return 'amber';
      case 'global':
        return 'purple';
      default:
        return 'gray';
    }
  };

  // Obtenir l'analyse correspondant au type
  const getAnalysis = (type: string): AnalysisResult | undefined => {
    switch (type) {
      case 'nuggets':
        return nuggetsAnalysis;
      case 'lightbulbs':
        return lightbulbsAnalysis;
      case 'global':
        return globalAnalysis;
      default:
        return undefined;
    }
  };

  // Rendu du contenu d'analyse en fonction du type
  const renderAnalysisContent = (item: AnalysisItem) => {
    const analysis = getAnalysis(item.type);
    const accentColor = getAccentColor(item.type);
    
    if (analysis) {
      return <AnalysisResultCard analysis={analysis} accentColor={accentColor} />;
    }
    
    // Afficher un placeholder si l'analyse n'est pas disponible
    return (
      <Card className="p-6">
        <div className="text-center py-4">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className={`h-4 bg-${accentColor}-200 rounded w-3/4 mx-auto`}></div>
              <div className={`h-4 bg-${accentColor}-200 rounded w-1/2 mx-auto`}></div>
              <div className={`h-4 bg-${accentColor}-200 rounded w-2/3 mx-auto`}></div>
            </div>
          ) : (
            <p className="text-gray-500">
              {item.type === 'nuggets' 
                ? 'Analyse AI Nuggets non disponible.' 
                : item.type === 'lightbulbs' 
                  ? 'Analyse AI Lightbulbs non disponible.' 
                  : 'Analyse globale non disponible.'}
            </p>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-center mb-8">Analyse de la Session</h2>
      
      {enabledAnalysisItems.map((item, index) => {
        const accentColor = getAccentColor(item.type);
        
        return (
          <div key={item.id} className="mb-10 animate-fadeIn" style={{ animationDelay: `${index * 0.2}s` }}>
            <div className={`bg-${accentColor}-50 border-l-4 border-${accentColor}-500 p-4 rounded-r-md mb-4`}>
              <h3 className={`font-semibold text-${accentColor}-800 text-xl`}>{item.title}</h3>
              <p className={`text-${accentColor}-700`}>{item.description}</p>
            </div>
            
            {renderAnalysisContent(item)}
          </div>
        );
      })}
    </div>
  );
};

export default FinalAnalysisPresentation; 