const React = require('react');
const Checkbox = require('./Checkbox');
const Input = require('./Input');
const Select = require('./Select');
const NumberInput = require('./NumberInput');

/**
 * AnalysisPhaseConfig Component
 * 
 * Configuration for the final analysis phase:
 * - AI-generated summary of the entire session
 * - Data visualization options
 * - Professor control panel settings
 */
const AnalysisPhaseConfig = ({ sessionConfig, updateSessionConfig }) => {
  const {
    // Analysis generation
    enableAutoAnalysis = true,
    analysisGenerationTime = 15, // seconds
    
    // Data display options
    showMessageCount = true,
    showChatCount = true,
    showParticipantStats = true,
    showTopThemes = true,
    showCommonInsights = true,
    showSentimentAnalysis = false,
    
    // Visualizations
    enableWordCloud = true,
    enableThemeNetwork = true,
    enableEngagementChart = true,
    enableEmotionPieChart = false,
    
    // Professor controls
    allowProfessorCustomComments = true,
    enablePresentationMode = true,
    autoExportSessionData = true,
  } = sessionConfig;

  const handleChange = (field, value) => {
    updateSessionConfig({
      ...sessionConfig,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-blue-700">
          Configurez l'analyse finale de la session qui sera présentée à tous les participants.
          Cette phase permet au professeur de partager les insights et de conclure la session.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">Génération d'Analyse</h3>
          
          <div className="space-y-2">
            <Checkbox
              label="Générer automatiquement l'analyse"
              checked={enableAutoAnalysis}
              onChange={(value) => handleChange('enableAutoAnalysis', value)}
            />
            <p className="text-sm text-gray-500 ml-6">
              L'IA analysera automatiquement les discussions et générera un rapport détaillé.
            </p>
          </div>

          <div className={enableAutoAnalysis ? "" : "opacity-50 pointer-events-none"}>
            <div className="mt-4">
              <NumberInput
                label="Temps estimé pour la génération (secondes)"
                value={analysisGenerationTime}
                onChange={(value) => handleChange('analysisGenerationTime', value)}
                min={5}
                max={60}
                disabled={!enableAutoAnalysis}
              />
              <p className="text-sm text-gray-500 mt-1">
                Un message de chargement sera affiché pendant ce temps avant l'affichage des résultats.
              </p>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold border-b pb-2 mt-6">Données à Afficher</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Checkbox
                label="Nombre de messages échangés"
                checked={showMessageCount}
                onChange={(value) => handleChange('showMessageCount', value)}
              />
            </div>
            
            <div className="space-y-2">
              <Checkbox
                label="Nombre de conversations IA"
                checked={showChatCount}
                onChange={(value) => handleChange('showChatCount', value)}
              />
            </div>
            
            <div className="space-y-2">
              <Checkbox
                label="Statistiques des participants"
                checked={showParticipantStats}
                onChange={(value) => handleChange('showParticipantStats', value)}
              />
            </div>
            
            <div className="space-y-2">
              <Checkbox
                label="Thèmes principaux des discussions"
                checked={showTopThemes}
                onChange={(value) => handleChange('showTopThemes', value)}
              />
            </div>
            
            <div className="space-y-2">
              <Checkbox
                label="Insights communs entre les histoires"
                checked={showCommonInsights}
                onChange={(value) => handleChange('showCommonInsights', value)}
              />
            </div>
            
            <div className="space-y-2">
              <Checkbox
                label="Analyse des sentiments"
                checked={showSentimentAnalysis}
                onChange={(value) => handleChange('showSentimentAnalysis', value)}
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">Visualisations</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg bg-white">
              <div className="space-y-2">
                <Checkbox
                  label="Nuage de mots"
                  checked={enableWordCloud}
                  onChange={(value) => handleChange('enableWordCloud', value)}
                />
                <div className="h-24 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-500">
                  [Aperçu nuage de mots]
                </div>
              </div>
            </div>
            
            <div className="p-3 border rounded-lg bg-white">
              <div className="space-y-2">
                <Checkbox
                  label="Réseau de thèmes"
                  checked={enableThemeNetwork}
                  onChange={(value) => handleChange('enableThemeNetwork', value)}
                />
                <div className="h-24 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-500">
                  [Aperçu réseau]
                </div>
              </div>
            </div>
            
            <div className="p-3 border rounded-lg bg-white">
              <div className="space-y-2">
                <Checkbox
                  label="Graphique d'engagement"
                  checked={enableEngagementChart}
                  onChange={(value) => handleChange('enableEngagementChart', value)}
                />
                <div className="h-24 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-500">
                  [Aperçu graphique]
                </div>
              </div>
            </div>
            
            <div className="p-3 border rounded-lg bg-white">
              <div className="space-y-2">
                <Checkbox
                  label="Diagramme d'émotions"
                  checked={enableEmotionPieChart}
                  onChange={(value) => handleChange('enableEmotionPieChart', value)}
                />
                <div className="h-24 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-500">
                  [Aperçu diagramme]
                </div>
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold border-b pb-2 mt-6">Contrôles du Professeur</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Checkbox
                label="Permettre l'ajout de commentaires personnalisés"
                checked={allowProfessorCustomComments}
                onChange={(value) => handleChange('allowProfessorCustomComments', value)}
              />
              <p className="text-sm text-gray-500 ml-6">
                Le professeur pourra ajouter ses propres commentaires à l'analyse générée par l'IA.
              </p>
            </div>
            
            <div className="space-y-2">
              <Checkbox
                label="Activer le mode présentation"
                checked={enablePresentationMode}
                onChange={(value) => handleChange('enablePresentationMode', value)}
              />
              <p className="text-sm text-gray-500 ml-6">
                Interface optimisée pour présenter les résultats sur un grand écran.
              </p>
            </div>
            
            <div className="space-y-2">
              <Checkbox
                label="Exporter automatiquement les données"
                checked={autoExportSessionData}
                onChange={(value) => handleChange('autoExportSessionData', value)}
              />
              <p className="text-sm text-gray-500 ml-6">
                Les données de la session seront automatiquement exportées à la fin pour le professeur.
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
            <h4 className="font-semibold mb-3">Aperçu du Tableau de Bord d'Analyse</h4>
            
            <div className="bg-gray-100 p-3 rounded-md">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-sm">Session: {sessionConfig.sessionName || "Nom de la session"}</div>
                <div className="text-xs text-gray-500">Durée totale: 45 min</div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-white p-2 rounded shadow-sm text-center">
                  <div className="text-xs text-gray-500">Messages</div>
                  <div className="font-bold">542</div>
                </div>
                <div className="bg-white p-2 rounded shadow-sm text-center">
                  <div className="text-xs text-gray-500">Conversations IA</div>
                  <div className="font-bold">28</div>
                </div>
                <div className="bg-white p-2 rounded shadow-sm text-center">
                  <div className="text-xs text-gray-500">Participants</div>
                  <div className="font-bold">{sessionConfig.maxParticipants || 30}</div>
                </div>
              </div>
              
              <div className="h-24 bg-white rounded-md mb-2 p-2">
                <div className="text-xs font-medium mb-1">Thèmes Principaux</div>
                <div className="flex flex-wrap gap-1">
                  {["Innovation", "Leadership", "Collaboration", "Défis", "Apprentissage"].map(theme => (
                    <span key={theme} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-end">
                <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded">
                  Exporter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

module.exports = AnalysisPhaseConfig; 