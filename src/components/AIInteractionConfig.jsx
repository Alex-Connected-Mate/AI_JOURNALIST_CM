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
  // Active agent state
  const [activeAgent, setActiveAgent] = useState('nuggets');
  
  // Active section state (config vs analysis)
  const [activeSection, setActiveSection] = useState('config');
  
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
        const agentName = activeAgent === 'nuggets' ? nuggets.agentName : lightbulbs.agentName;
        const agentType = activeAgent === 'nuggets' ? 'Nuggets' : 'Lightbulbs';
        setPreviewResponse(`
          En tant que ${agentName}, voici ma réponse:
          
          ${previewInput.includes('?') 
            ? `Merci pour votre question. En tant qu'agent AI ${agentType}, je vais vous aider à ${activeAgent === 'nuggets' ? 'identifier les informations importantes' : 'développer cette idée créative'}.`
            : `J'ai analysé votre message et voici mes observations en tant qu'agent AI ${agentType}.`}
          
          ${activeAgent === 'nuggets' 
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

  // Helper function to get current agent data based on active tab
  const getCurrentAgent = () => {
    return activeAgent === 'nuggets' ? nuggets : lightbulbs;
  };

  // Helper function to get current agent handler based on active tab
  const getCurrentAgentHandler = () => {
    return activeAgent === 'nuggets' ? handleNuggetsChange : handleLightbulbsChange;
  };

  // Render agent configuration section
  const renderAgentConfigSection = () => {
    const agent = getCurrentAgent();
    const handleAgentChange = getCurrentAgentHandler();
    const handleImageUploaded = activeAgent === 'nuggets' ? handleNuggetsImageUploaded : handleLightbulbsImageUploaded;
    const resetImage = activeAgent === 'nuggets' ? resetNuggetsImage : resetLightbulbsImage;
    const defaultImage = activeAgent === 'nuggets' ? DEFAULT_AGENT_IMAGES.nuggets : DEFAULT_AGENT_IMAGES.lightbulbs;
    const primaryColor = activeAgent === 'nuggets' ? 'blue' : 'amber';

    return (
      <div className="space-y-6">
        <div className={`bg-${primaryColor}-50 border-l-4 border-${primaryColor}-500 p-4 rounded-r-md mb-4`}>
          <h3 className={`font-semibold text-${primaryColor}-800 mb-2`}>Configuration de l'agent {activeAgent === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'}</h3>
          <p className={`text-${primaryColor}-700 text-sm`}>
            {activeAgent === 'nuggets' 
              ? 'Personnalisez l\'agent AI Nuggets (Elias) qui extrait les informations importantes des discussions.'
              : 'Personnalisez l\'agent AI Lightbulbs (Sonia) qui développe des idées créatives basées sur les discussions.'}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Agent image and basic info */}
          <div className="w-full md:w-1/3">
            <div className="flex flex-col items-center">
              <ImageUploader
                bucket="ai-agent"
                defaultImage={agent.imageUrl || defaultImage}
                onImageUploaded={handleImageUploaded}
                filePrefix={`ai-${activeAgent}`}
                size="lg"
                shape="circle"
                buttonText="Modifier l'image"
                resetButton={true}
                onReset={resetImage}
                resetButtonText="Réinitialiser"
                className="mb-4"
              />
              
              <div className="space-y-2 w-full">                    
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'agent</label>
                  <input
                    type="text"
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm p-2`}
                    value={agent.agentName}
                    onChange={(e) => handleAgentChange('agentName', e.target.value)}
                    placeholder={`Nom de l'agent ${activeAgent === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'}`}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Agent configuration */}
          <div className="w-full md:w-2/3">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Prompt de l'agent {activeAgent === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {activeAgent === 'nuggets'
                ? 'Cet agent extrait des informations précieuses des discussions et synthétise les idées importantes.'
                : 'Cet agent aide à développer des idées créatives et des concepts innovants basés sur les discussions.'}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prompt de l'agent</label>
                <textarea
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm p-2 min-h-[150px]`}
                  value={agent.prompt}
                  onChange={(e) => handleAgentChange('prompt', e.target.value)}
                  placeholder={`Instructions détaillées pour l'agent ${activeAgent === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'}`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Définissez les instructions que l'agent doit suivre pour interagir avec les participants.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modèle d'IA</label>
                  <select
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm`}
                    value={agent.model || "gpt-4"}
                    onChange={(e) => handleAgentChange('model', e.target.value)}
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
                    value={agent.temperature || (activeAgent === 'nuggets' ? 0.7 : 0.8)}
                    onChange={(e) => handleAgentChange('temperature', parseFloat(e.target.value))}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Précis (0)</span>
                    <span>{agent.temperature || (activeAgent === 'nuggets' ? 0.7 : 0.8)}</span>
                    <span>Créatif (1)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render agent analysis section
  const renderAgentAnalysisSection = () => {
    const agent = getCurrentAgent();
    const handleAgentChange = getCurrentAgentHandler();
    const primaryColor = activeAgent === 'nuggets' ? 'blue' : 'amber';

    return (
      <div className="space-y-6">
        <div className={`bg-${primaryColor}-50 border-l-4 border-${primaryColor}-500 p-4 rounded-r-md mb-4`}>
          <h3 className={`font-semibold text-${primaryColor}-800 mb-2`}>
            Analyse des conversations pour {activeAgent === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'}
          </h3>
          <p className={`text-${primaryColor}-700 text-sm`}>
            {activeAgent === 'nuggets'
              ? 'Configurez comment l\'agent AI Nuggets (Elias) analyse et extrait les informations des discussions.'
              : 'Configurez comment l\'agent AI Lightbulbs (Sonia) identifie et développe les idées créatives.'}
          </p>
        </div>

        <Card className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Paramètres d'analyse</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {activeAgent === 'nuggets' ? 'Critères d\'extraction des nuggets' : 'Critères de développement des idées'}
              </label>
              <textarea
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm p-2 min-h-[100px]`}
                value={agent.analysisCriteria || ''}
                onChange={(e) => handleAgentChange('analysisCriteria', e.target.value)}
                placeholder={activeAgent === 'nuggets'
                  ? 'Ex: Extraire les informations ayant un impact stratégique, les insights pertinents, les concepts innovants...'
                  : 'Ex: Identifier les idées ayant un potentiel de développement, les concepts disruptifs, les opportunités d\'innovation...'}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format des réponses</label>
              <select
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm`}
                value={agent.responseFormat || 'bullet'}
                onChange={(e) => handleAgentChange('responseFormat', e.target.value)}
              >
                <option value="bullet">Points clés (bullet points)</option>
                <option value="paragraph">Paragraphes</option>
                <option value="structured">Structure hiérarchique</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructions spécifiques pour l'analyse
              </label>
              <textarea
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm p-2 min-h-[150px]`}
                value={agent.analysisInstructions || ''}
                onChange={(e) => handleAgentChange('analysisInstructions', e.target.value)}
                placeholder={activeAgent === 'nuggets'
                  ? 'Instructions détaillées pour l\'extraction des informations importantes...'
                  : 'Instructions détaillées pour le développement des idées créatives...'}
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className={`rounded border-gray-300 text-${primaryColor}-600 shadow-sm focus:border-${primaryColor}-300 focus:ring focus:ring-${primaryColor}-200 focus:ring-opacity-50`}
                  checked={agent.summarizeConversation || false}
                  onChange={(e) => handleAgentChange('summarizeConversation', e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-700">
                  Résumer la conversation avant analyse
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className={`rounded border-gray-300 text-${primaryColor}-600 shadow-sm focus:border-${primaryColor}-300 focus:ring focus:ring-${primaryColor}-200 focus:ring-opacity-50`}
                  checked={agent.includeParticipantInfo || false}
                  onChange={(e) => handleAgentChange('includeParticipantInfo', e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-700">
                  Inclure les informations des participants dans l'analyse
                </span>
              </label>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Render preview section
  const renderPreviewSection = () => {
    const primaryColor = activeAgent === 'nuggets' ? 'blue' : 'amber';
    
    return (
      <div className="mt-6 border-t pt-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Prévisualisation de l'agent</h4>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`text-sm text-${primaryColor}-600 hover:text-${primaryColor}-800`}
          >
            {previewMode ? "Masquer" : "Afficher"} la prévisualisation
          </button>
        </div>
        
        {previewMode && (
          <div className="bg-gray-50 rounded-md p-3 mt-2">
            <textarea
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm p-2 mb-2`}
              value={previewInput}
              onChange={(e) => setPreviewInput(e.target.value)}
              placeholder="Entrez un message pour tester l'agent..."
              rows={2}
            />
            
            <div className="flex justify-end">
              <button
                onClick={generatePreview}
                disabled={isGeneratingPreview || !previewInput.trim()}
                className={`px-3 py-1 bg-${primaryColor}-500 hover:bg-${primaryColor}-600 text-white rounded text-sm disabled:bg-${primaryColor}-300`}
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
    );
  };

  return (
    <div className="space-y-6">
      {/* Agent selector + Global timer */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="w-full md:w-2/3">
          <Card className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sélection de l'agent AI</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`p-4 flex flex-col items-center justify-center rounded-lg border-2 ${
                  activeAgent === 'nuggets' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                }`}
                onClick={() => setActiveAgent('nuggets')}
              >
                <div className="relative w-16 h-16 mb-2 overflow-hidden rounded-full">
                  <Image
                    src={nuggets.imageUrl || DEFAULT_AGENT_IMAGES.nuggets}
                    alt="AI Nuggets - Elias"
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
                <span className="font-medium">AI Nuggets</span>
                <span className="text-sm text-gray-500">Elias</span>
              </button>
              
              <button
                className={`p-4 flex flex-col items-center justify-center rounded-lg border-2 ${
                  activeAgent === 'lightbulbs' 
                    ? 'border-amber-500 bg-amber-50 text-amber-700' 
                    : 'border-gray-200 hover:border-amber-200 hover:bg-amber-50'
                }`}
                onClick={() => setActiveAgent('lightbulbs')}
              >
                <div className="relative w-16 h-16 mb-2 overflow-hidden rounded-full">
                  <Image
                    src={lightbulbs.imageUrl || DEFAULT_AGENT_IMAGES.lightbulbs}
                    alt="AI Lightbulbs - Sonia"
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
                <span className="font-medium">AI Lightbulbs</span>
                <span className="text-sm text-gray-500">Sonia</span>
              </button>
            </div>
          </Card>
        </div>
        
        <div className="w-full md:w-1/3">
          <Card className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Timer Global</h3>
            <TimerSettings
              timerEnabled={timerEnabled}
              timerDuration={timerDuration}
              onTimerEnabledChange={handleTimerEnabledChange}
              onTimerDurationChange={handleTimerDurationChange}
            />
          </Card>
        </div>
      </div>

      {/* Configuration and Analysis tabs */}
      <Card className="p-4">
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex">
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeSection === 'config'
                  ? activeAgent === 'nuggets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveSection('config')}
            >
              Configuration de l'agent
            </button>
            <button
              className={`ml-8 py-2 px-4 border-b-2 font-medium text-sm ${
                activeSection === 'analysis'
                  ? activeAgent === 'nuggets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveSection('analysis')}
            >
              Analyse des conversations
            </button>
          </nav>
        </div>

        {/* Content based on selected section */}
        {activeSection === 'config' ? renderAgentConfigSection() : renderAgentAnalysisSection()}
        
        {/* Preview section */}
        {renderPreviewSection()}
      </Card>
    </div>
  );
};

export default AIInteractionConfig;
