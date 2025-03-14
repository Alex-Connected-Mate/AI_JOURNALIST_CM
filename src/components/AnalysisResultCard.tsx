import React from 'react';
import { Card } from '@/components/ui/card';
import { AnalysisResult } from '@/lib/analysis-service';

interface AnalysisResultCardProps {
  analysis: AnalysisResult;
  accentColor: 'blue' | 'amber' | 'purple' | 'gray';
}

/**
 * Composant pour afficher un résultat d'analyse de manière visuelle
 */
const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({ 
  analysis, 
  accentColor 
}) => {
  // Obtenir les couleurs spécifiques selon l'accent choisi
  const getBgColor = () => {
    switch (accentColor) {
      case 'blue': return 'bg-blue-50';
      case 'amber': return 'bg-amber-50';
      case 'purple': return 'bg-purple-50';
      default: return 'bg-gray-50';
    }
  };
  
  const getBorderColor = () => {
    switch (accentColor) {
      case 'blue': return 'border-blue-200';
      case 'amber': return 'border-amber-200';
      case 'purple': return 'border-purple-200';
      default: return 'border-gray-200';
    }
  };
  
  const getTextColor = () => {
    switch (accentColor) {
      case 'blue': return 'text-blue-800';
      case 'amber': return 'text-amber-800';
      case 'purple': return 'text-purple-800';
      default: return 'text-gray-800';
    }
  };
  
  const getTagBgColor = () => {
    switch (accentColor) {
      case 'blue': return 'bg-blue-100';
      case 'amber': return 'bg-amber-100';
      case 'purple': return 'bg-purple-100';
      default: return 'bg-gray-100';
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <div className={`p-4 ${getBgColor()} ${getBorderColor()} border-b`}>
        <h3 className={`text-xl font-bold ${getTextColor()}`}>{analysis.title}</h3>
      </div>
      
      <div className="p-6">
        <p className="text-gray-700 mb-6">{analysis.content}</p>
        
        <h4 className="font-semibold text-lg mb-3">Insights Clés</h4>
        <ul className="space-y-3 mb-6">
          {analysis.insights.map((insight, index) => (
            <li key={index} className="flex items-start">
              <div className={`mt-1 mr-3 h-4 w-4 rounded-full flex-shrink-0 ${getBgColor()} ${getBorderColor()} border`}></div>
              <span className="text-gray-700">{insight}</span>
            </li>
          ))}
        </ul>
        
        {analysis.tags && analysis.tags.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className={`px-3 py-1 rounded-full text-sm ${getTagBgColor()} ${getTextColor()} border ${getBorderColor()}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AnalysisResultCard; 