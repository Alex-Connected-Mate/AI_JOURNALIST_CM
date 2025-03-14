import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import TimerSettings from './TimerSettings';
import Image from 'next/image';
import ImageUploader from './ImageUploader';
import { 
  DEFAULT_AGENT_IMAGES, 
  DEFAULT_NUGGETS_AGENT, 
  DEFAULT_LIGHTBULBS_AGENT,
  DEFAULT_AI_CONFIGURATION
} from '@/config/ai-agents';

/**
 * AIInteractionConfig Component
 * 
 * Provides comprehensive configuration options for AI agents:
 * - AI Nuggets configuration (prompt, image, custom instructions)
 * - AI Lightbulbs configuration (prompt, image, custom instructions)
 * - Global timer settings for all AI interactions
 * - Preview functionality to test agent responses
 */
const AIInteractionConfig = ({ sessionConfig = {}, updateSessionConfig, mode = 'standard' }) => {
  // Active tab state
  const [activeTab, setActiveTab] = useState('global');
  
  // State for preview mode
  const [previewMode, setPreviewMode] = useState(false);
  const [previewInput, setPreviewInput] = useState('');
  const [previewResponse, setPreviewResponse] = useState('');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  
  // Extract settings from sessionConfig
  const ai_settings = sessionConfig.settings?.ai_configuration || {};
  
  // Global timer settings
  const timerEnabled = sessionConfig.timerEnabled || ai_settings.timerEnabled || DEFAULT_AI_CONFIGURATION.timerEnabled;
  const timerDuration = sessionConfig.timerDuration || ai_settings.timerDuration || DEFAULT_AI_CONFIGURATION.timerDuration;
  
  // Agent configurations
  const nuggets = ai_settings.nuggets || DEFAULT_NUGGETS_AGENT;
  const lightbulbs = ai_settings.lightbulbs || DEFAULT_LIGHTBULBS_AGENT;

  // Handler for timer settings changes
  const handleTimerEnabledChange = (enabled) => {
    updateSessionConfig({
      ...sessionConfig,
      timerEnabled: enabled,
      settings: {
        ...sessionConfig.settings,
        ai_configuration: {
          ...(sessionConfig.settings?.ai_configuration || {}),
          timerEnabled: enabled
        }
      }
    });
  };

  const handleTimerDurationChange = (duration) => {
    updateSessionConfig({
      ...sessionConfig,
      timerDuration: duration,
      settings: {
        ...sessionConfig.settings,
        ai_configuration: {
          ...(sessionConfig.settings?.ai_configuration || {}),
          timerDuration: duration
        }
      }
    });
  };

  // Handler for nuggets configuration changes
  const handleNuggetsChange = (field, value) => {
    updateSessionConfig({
      ...sessionConfig,
      settings: {
        ...sessionConfig.settings,
        ai_configuration: {
          ...(sessionConfig.settings?.ai_configuration || {}),
          nuggets: {
            ...(sessionConfig.settings?.ai_configuration?.nuggets || {}),
            [field]: value
          }
        }
      }
    });
  };

  // Handler for lightbulbs configuration changes
  const handleLightbulbsChange = (field, value) => {
    updateSessionConfig({
      ...sessionConfig,
      settings: {
        ...sessionConfig.settings,
        ai_configuration: {
          ...(sessionConfig.settings?.ai_configuration || {}),
          lightbulbs: {
            ...(sessionConfig.settings?.ai_configuration?.lightbulbs || {}),
            [field]: value
          }
        }
      }
    });
  };

  // Function to generate a preview response
  const generatePreview = async () => {
    if (!previewInput.trim()) return;
    
    setIsGeneratingPreview(true);
    
    try {
      // Simulate API call for preview
      setTimeout(() => {
        const agentType = activeTab === 'nuggets' ? 'Nuggets' : 'Lightbulbs';
        setPreviewResponse(`
          En tant que ${activeTab === 'nuggets' ? nuggets.agentName : lightbulbs.agentName}, voici ma réponse:
          
          ${previewInput.includes('?') 
            ? `Merci pour votre question. En tant qu'agent AI ${agentType}, je vais vous aider à ${activeTab === 'nuggets' ? 'identifier les informations importantes' : 'développer cette idée créative'}.`
            : `J'ai analysé votre message et voici mes observations en tant qu'agent AI ${agentType}.`}
          
          ${activeTab === 'nuggets' 
            ? 'Points clés identifiés:\n- Insight commercial important\n- Observation stratégique\n- Opportunité de développement'
            : 'Développement créatif:\n- Concept innovant basé sur votre idée\n- Applications potentielles\n- Prochaines étapes recommandées'}
          
          N'hésitez pas à me poser d'autres questions pour approfondir ces points.
        `);
        setIsGeneratingPreview(false);
      }, 1500);
    } catch (error) {
      setPreviewResponse("Une erreur est survenue lors de la génération de l'aperçu.");
      setIsGeneratingPreview(false);
    }
  };

  // Handlers pour gérer les images des agents avec le nouveau composant
  const handleNuggetsImageUploaded = (imageUrl) => {
    console.log('Nouvelle image AI Nuggets:', imageUrl);
    handleNuggetsChange('imageUrl', imageUrl);
  };

  const handleLightbulbsImageUploaded = (imageUrl) => {
    console.log('Nouvelle image AI Lightbulbs:', imageUrl);
    handleLightbulbsChange('imageUrl', imageUrl);
  };

  const resetNuggetsImage = () => {
    handleNuggetsChange('imageUrl', DEFAULT_AGENT_IMAGES.nuggets);
  };

  const resetLightbulbsImage = () => {
    handleLightbulbsChange('imageUrl', DEFAULT_AGENT_IMAGES.lightbulbs);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md mb-4">
        <h3 className="font-semibold text-blue-800 mb-2">Configuration des Agents AI</h3>
        <p className="text-blue-700 text-sm">
          Personnalisez les agents AI qui interagiront avec les participants pendant la session.
          Configurez le timer global, les prompts spécifiques et les images de profil pour chaque agent.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="global" className="flex-1">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Configuration Globale
            </span>
          </TabsTrigger>
          <TabsTrigger value="nuggets" className="flex-1">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              AI Nuggets
            </span>
          </TabsTrigger>
          <TabsTrigger value="lightbulbs" className="flex-1">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
              AI Lightbulbs
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="pt-2">
          <Card className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration Globale des Interactions AI</h3>
            
            <TimerSettings
              timerEnabled={timerEnabled}
              timerDuration={timerDuration}
              onTimerEnabledChange={handleTimerEnabledChange}
              onTimerDurationChange={handleTimerDurationChange}
            />
          </Card>
        </TabsContent>

        <TabsContent value="nuggets" className="pt-2">
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Agent image and basic info */}
              <div className="w-full md:w-1/3">
                <div className="flex flex-col items-center">
                  <ImageUploader
                    bucket="ai-agent"
                    defaultImage={nuggets.imageUrl || DEFAULT_AGENT_IMAGES.nuggets}
                    onImageUploaded={handleNuggetsImageUploaded}
                    filePrefix="ai-nuggets"
                    size="lg"
                    shape="circle"
                    buttonText="Modifier l'image"
                    resetButton={true}
                    onReset={resetNuggetsImage}
                    resetButtonText="Réinitialiser"
                    className="mb-4"
                  />
                  
                  <div className="space-y-2 w-full">                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'agent</label>
                      <input
                        type="text"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                        value={nuggets.agentName}
                        onChange={(e) => handleNuggetsChange('agentName', e.target.value)}
                        placeholder="Nom de l'agent AI Nuggets"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Agent configuration */}
              <div className="w-full md:w-2/3">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Configuration de l'agent AI Nuggets</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Cet agent extrait des informations précieuses des discussions et synthétise les idées importantes.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prompt de l'agent</label>
                    <textarea
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 min-h-[150px]"
                      value={nuggets.prompt}
                      onChange={(e) => handleNuggetsChange('prompt', e.target.value)}
                      placeholder="Instructions détaillées pour l'agent AI Nuggets"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Définissez les instructions que l'agent AI Nuggets doit suivre pour interagir avec les participants.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Modèle d'IA</label>
                      <select
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={nuggets.model || "gpt-4"}
                        onChange={(e) => handleNuggetsChange('model', e.target.value)}
                      >
                        <option value="gpt-4">GPT-4 (Recommandé)</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Température</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        className="w-full"
                        value={nuggets.temperature || 0.7}
                        onChange={(e) => handleNuggetsChange('temperature', parseFloat(e.target.value))}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Précis (0)</span>
                        <span>{nuggets.temperature || 0.7}</span>
                        <span>Créatif (1)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Preview section */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Prévisualisation de l'agent</h4>
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {previewMode ? "Masquer" : "Afficher"} la prévisualisation
                    </button>
                  </div>
                  
                  {previewMode && (
                    <div className="bg-gray-50 rounded-md p-3 mt-2">
                      <textarea
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 mb-2"
                        value={previewInput}
                        onChange={(e) => setPreviewInput(e.target.value)}
                        placeholder="Entrez un message pour tester l'agent..."
                        rows={2}
                      />
                      
                      <div className="flex justify-end">
                        <button
                          onClick={generatePreview}
                          disabled={isGeneratingPreview || !previewInput.trim()}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm disabled:bg-blue-300"
                        >
                          {isGeneratingPreview ? "Génération..." : "Générer une réponse"}
                        </button>
                      </div>
                      
                      {previewResponse && (
                        <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Réponse de l'agent:</h5>
                          <div className="text-sm whitespace-pre-wrap">{previewResponse}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="lightbulbs" className="pt-2">
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Agent image and basic info */}
              <div className="w-full md:w-1/3">
                <div className="flex flex-col items-center">
                  <ImageUploader
                    bucket="ai-agent"
                    defaultImage={lightbulbs.imageUrl || DEFAULT_AGENT_IMAGES.lightbulbs}
                    onImageUploaded={handleLightbulbsImageUploaded}
                    filePrefix="ai-lightbulbs"
                    size="lg"
                    shape="circle"
                    buttonText="Modifier l'image"
                    resetButton={true}
                    onReset={resetLightbulbsImage}
                    resetButtonText="Réinitialiser"
                    className="mb-4"
                  />
                  
                  <div className="space-y-2 w-full">
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'agent</label>
                      <input
                        type="text"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2"
                        value={lightbulbs.agentName}
                        onChange={(e) => handleLightbulbsChange('agentName', e.target.value)}
                        placeholder="Nom de l'agent AI Lightbulbs"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Agent configuration */}
              <div className="w-full md:w-2/3">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Configuration de l'agent AI Lightbulbs</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Cet agent aide à développer des idées créatives et des concepts innovants basés sur les discussions.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prompt de l'agent</label>
                    <textarea
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 min-h-[150px]"
                      value={lightbulbs.prompt}
                      onChange={(e) => handleLightbulbsChange('prompt', e.target.value)}
                      placeholder="Instructions détaillées pour l'agent AI Lightbulbs"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Définissez les instructions que l'agent AI Lightbulbs doit suivre pour développer des idées créatives.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Modèle d'IA</label>
                      <select
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                        value={lightbulbs.model || "gpt-4"}
                        onChange={(e) => handleLightbulbsChange('model', e.target.value)}
                      >
                        <option value="gpt-4">GPT-4 (Recommandé)</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Température</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        className="w-full"
                        value={lightbulbs.temperature || 0.8}
                        onChange={(e) => handleLightbulbsChange('temperature', parseFloat(e.target.value))}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Précis (0)</span>
                        <span>{lightbulbs.temperature || 0.8}</span>
                        <span>Créatif (1)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Preview section */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Prévisualisation de l'agent</h4>
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className="text-sm text-amber-600 hover:text-amber-800"
                    >
                      {previewMode ? "Masquer" : "Afficher"} la prévisualisation
                    </button>
                  </div>
                  
                  {previewMode && (
                    <div className="bg-gray-50 rounded-md p-3 mt-2">
                      <textarea
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 mb-2"
                        value={previewInput}
                        onChange={(e) => setPreviewInput(e.target.value)}
                        placeholder="Entrez un message pour tester l'agent..."
                        rows={2}
                      />
                      
                      <div className="flex justify-end">
                        <button
                          onClick={generatePreview}
                          disabled={isGeneratingPreview || !previewInput.trim()}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-sm disabled:bg-amber-300"
                        >
                          {isGeneratingPreview ? "Génération..." : "Générer une réponse"}
                        </button>
                      </div>
                      
                      {previewResponse && (
                        <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Réponse de l'agent:</h5>
                          <div className="text-sm whitespace-pre-wrap">{previewResponse}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIInteractionConfig;
