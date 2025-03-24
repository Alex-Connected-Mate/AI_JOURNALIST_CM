const React = require('react');
const Checkbox = require('./Checkbox');
const NumberInput = require('./NumberInput');

/**
 * AnalysisConfigPanel Component
 * 
 * Displays configuration options for the selected analysis type.
 * 
 * @param {Object} selectedItem - The currently selected analysis item
 * @param {Array} items - All analysis items
 * @param {Function} updateSessionConfig - Function to update session configuration
 * @param {Object} sessionConfig - Current session configuration
 * @param {Object} analysisConfiguration - Current analysis configuration
 */
const AnalysisConfigPanel = ({
  selectedItem,
  items,
  updateSessionConfig,
  sessionConfig,
  analysisConfiguration
}) => {
  // If no item is selected, show a placeholder
  if (!selectedItem) {
    return (
      <div className="w-full h-full flex items-center justify-center p-10">
        <div className="text-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium">Sélectionnez une analyse</h3>
          <p className="mt-2">Cliquez sur un élément dans la liste pour configurer ses paramètres.</p>
        </div>
      </div>
    );
  }

  // Icon and color maps for styling
  const iconMap = {
    'nuggets': '💎',
    'lightbulbs': '💡',
    'global': '📊'
  };
  
  const bgColorMap = {
    'nuggets': 'bg-indigo-100',
    'lightbulbs': 'bg-amber-100',
    'global': 'bg-emerald-100'
  };
  
  const borderColorMap = {
    'nuggets': 'border-indigo-300',
    'lightbulbs': 'border-amber-300',
    'global': 'border-emerald-300'
  };
  
  const textColorMap = {
    'nuggets': 'text-indigo-800',
    'lightbulbs': 'text-amber-800',
    'global': 'text-emerald-800'
  };

  // Render common configurations first
  return (
    <div className="w-full space-y-6">
      <div className={`p-4 rounded-lg ${bgColorMap[selectedItem.type]} ${borderColorMap[selectedItem.type]} border`}>
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">{iconMap[selectedItem.type]}</span>
          <h3 className={`text-lg font-medium ${textColorMap[selectedItem.type]}`}>
            Configuration: {selectedItem.title}
          </h3>
        </div>
        <p className="text-gray-700 text-sm">
          {selectedItem.type === 'nuggets' && 'Personnalisez les paramètres d\'analyse pour les extractions de AI Nuggets.'}
          {selectedItem.type === 'lightbulbs' && 'Personnalisez les paramètres d\'analyse pour les idées créatives de AI Lightbulbs.'}
          {selectedItem.type === 'global' && 'Personnalisez les paramètres de l\'analyse globale qui synthétise les insights des deux agents.'}
        </p>
      </div>

      {/* Common analysis options */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">Options générales d'analyse</h4>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={analysisConfiguration.includeParticipantNames}
                onChange={(value) => updateSessionConfig({
                  ...sessionConfig,
                  analysisConfiguration: {
                    ...analysisConfiguration,
                    includeParticipantNames: value
                  }
                })}
              />
              <span className="text-gray-700">Inclure les noms des participants</span>
            </label>
            <p className="text-xs text-gray-500 ml-6 mt-1">
              Lorsque activé, les noms des participants seront mentionnés dans l'analyse.
            </p>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={analysisConfiguration.includeQuotesInAnalysis}
                onChange={(value) => updateSessionConfig({
                  ...sessionConfig,
                  analysisConfiguration: {
                    ...analysisConfiguration,
                    includeQuotesInAnalysis: value
                  }
                })}
              />
              <span className="text-gray-700">Inclure des citations directes</span>
            </label>
            <p className="text-xs text-gray-500 ml-6 mt-1">
              Lorsque activé, l'analyse inclura des citations directes des conversations.
            </p>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={analysisConfiguration.generateKeyInsights}
                onChange={(value) => updateSessionConfig({
                  ...sessionConfig,
                  analysisConfiguration: {
                    ...analysisConfiguration,
                    generateKeyInsights: value
                  }
                })}
              />
              <span className="text-gray-700">Générer une section d'insights clés</span>
            </label>
            <p className="text-xs text-gray-500 ml-6 mt-1">
              Lorsque activé, l'analyse inclura une section mettant en évidence les insights clés.
            </p>
          </div>
        </div>
      </div>

      {/* Type-specific options */}
      {selectedItem.type === 'nuggets' && (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
          <h4 className="text-lg font-semibold text-gray-700 mb-4">Options spécifiques pour AI Nuggets</h4>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={analysisConfiguration.nuggetsCategorization || false}
                  onChange={(value) => updateSessionConfig({
                    ...sessionConfig,
                    analysisConfiguration: {
                      ...analysisConfiguration,
                      nuggetsCategorization: value
                    }
                  })}
                />
                <span className="text-gray-700">Catégoriser les extractions</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                Organise les extractions par catégories thématiques.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedItem.type === 'lightbulbs' && (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
          <h4 className="text-lg font-semibold text-gray-700 mb-4">Options spécifiques pour AI Lightbulbs</h4>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={analysisConfiguration.lightbulbsEvaluation || false}
                  onChange={(value) => updateSessionConfig({
                    ...sessionConfig,
                    analysisConfiguration: {
                      ...analysisConfiguration,
                      lightbulbsEvaluation: value
                    }
                  })}
                />
                <span className="text-gray-700">Évaluer les idées créatives</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                Évalue les idées créatives en termes de faisabilité et d'originalité.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedItem.type === 'global' && (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
          <h4 className="text-lg font-semibold text-gray-700 mb-4">Options spécifiques pour l'Analyse Globale</h4>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={analysisConfiguration.globalComparison || false}
                  onChange={(value) => updateSessionConfig({
                    ...sessionConfig,
                    analysisConfiguration: {
                      ...analysisConfiguration,
                      globalComparison: value
                    }
                  })}
                />
                <span className="text-gray-700">Comparaison des résultats</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                Compare les extractions et idées créatives pour identifier les synergies.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generation time settings */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
        <NumberInput
          label="Temps de génération de l'analyse (secondes)"
          value={analysisConfiguration.analysisGenerationTime}
          onChange={(value) => updateSessionConfig({
            ...sessionConfig,
            analysisConfiguration: {
              ...analysisConfiguration,
              analysisGenerationTime: value
            }
          })}
          min={30}
          max={300}
          step={10}
        />
        <p className="text-sm text-gray-600 mt-2">
          Temps nécessaire pour que l'IA génère l'analyse finale.
        </p>
      </div>
    </div>
  );
};

module.exports = AnalysisConfigPanel; 