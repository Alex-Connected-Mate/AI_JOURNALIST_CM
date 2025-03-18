import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import TimerSettings from './TimerSettings';
import Image from 'next/image';
import ImageUploader from './ImageUploader';
import { AIPromptConfig } from './AIPromptConfig';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  DEFAULT_AGENT_IMAGES, 
  DEFAULT_NUGGETS_AGENT, 
  DEFAULT_LIGHTBULBS_AGENT,
  DEFAULT_AI_CONFIGURATION,
  AnalysisItem,
  FinalAnalysisConfig
} from '@/config/ai-agents';
import AnalysisOrderList from './AnalysisOrderList';
import AnalysisConfigPanel from './AnalysisConfigPanel';
import { useTranslation } from './LocaleProvider';
import AIPromptEditor from './AIPromptEditor';
import { getDefaultPrompt, parsePrompt, generatePrompt } from '@/lib/promptParser';

/**
 * AIInteractionConfig Component
 * 
 * Provides configuration options for the currently selected element in the session flow:
 * - When "AI Nuggets" is selected: Shows only Nuggets agent configuration (Elias)
 * - When "AI Lightbulbs" is selected: Shows only Lightbulbs agent configuration (Sonia)
 * - When "Analyse Finale" is selected: Shows only Final Analysis configuration
 * 
 * The component doesn't include navigation between these sections as that's handled by
 * the Session Flow Map in the parent component.
 * 
 * @param {Object} sessionConfig - The current session configuration
 * @param {Function} updateSessionConfig - Function to update the session configuration
 * @param {string} mode - The mode of the component (nuggets or lightbulb)
 * @param {string} currentStep - The currently selected step in the flow map (nuggets, lightbulbs, final-analysis)
 * @param {string} currentSection - The currently selected sub-section for agent config (config, analysis, book)
 * @param {Function} onTimerConfigChange - Optional callback when timer configuration changes, used by parent for flow map updates
 * @param {Function} onAnalysisOrderChange - Optional callback when analysis order changes, used by parent for flow map updates
 */
const AIInteractionConfig = ({ 
  sessionConfig = {}, 
  updateSessionConfig, 
  mode = 'standard', 
  currentStep = 'nuggets',
  currentSection = 'config',
  onTimerConfigChange = null,
  onAnalysisOrderChange = null
}) => {
  // Access translations
  const { t } = useTranslation ? useTranslation() : { t: (key) => key };
  
  // Active section state only used for agent config sub-sections
  const [activeSection, setActiveSection] = useState(currentSection || 'book');
  
  // State for preview mode
  const [previewMode, setPreviewMode] = useState(false);
  const [previewInput, setPreviewInput] = useState('');
  const [previewResponse, setPreviewResponse] = useState('');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  // État pour afficher le prompt complet
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  // Determine which agent to display based on the mode parameter
  const activeAgentType = mode === 'lightbulb' ? 'lightbulbs' : 'nuggets';
  
  // Extract settings from sessionConfig
  const ai_settings = sessionConfig.settings?.ai_configuration || {};
  
  // Global timer settings
  const timerEnabled = sessionConfig.timerEnabled || ai_settings.timerEnabled || DEFAULT_AI_CONFIGURATION.timerEnabled;
  const timerDuration = sessionConfig.timerDuration || ai_settings.timerDuration || DEFAULT_AI_CONFIGURATION.timerDuration;
  
  // Agent configurations
  const nuggets = ai_settings.nuggets || DEFAULT_NUGGETS_AGENT;
  const lightbulbs = ai_settings.lightbulbs || DEFAULT_LIGHTBULBS_AGENT;

  // Final analysis configuration
  const [analysisItems, setAnalysisItems] = useState(
    sessionConfig.settings?.finalAnalysis?.items || DEFAULT_AI_CONFIGURATION.finalAnalysis.items
  );

  // Selected analysis item for configuration in final analysis step
  const [selectedAnalysisItemId, setSelectedAnalysisItemId] = useState('');

  // Handlers for agent configuration changes - MOVED UP before they are used
  const handleNuggetsChange = useCallback((field, value) => {
    updateSessionConfig({
      ...sessionConfig,
      settings: {
        ...sessionConfig.settings,
        ai_configuration: {
          ...ai_settings,
          nuggets: {
            ...nuggets,
            [field]: value
          }
        }
      }
    });
  }, [sessionConfig, updateSessionConfig, ai_settings, nuggets]);
  
  const handleLightbulbsChange = useCallback((field, value) => {
    updateSessionConfig({
      ...sessionConfig,
      settings: {
        ...sessionConfig.settings,
        ai_configuration: {
          ...ai_settings,
          lightbulbs: {
            ...lightbulbs,
            [field]: value
          }
        }
      }
    });
  }, [sessionConfig, updateSessionConfig, ai_settings, lightbulbs]);

  // Helper function to get current agent data based on mode parameter
  const getCurrentAgent = useCallback(() => {
    return activeAgentType === 'nuggets' ? nuggets : lightbulbs;
  }, [activeAgentType, nuggets, lightbulbs]);

  // Helper function to get current agent handler based on mode parameter
  const getCurrentAgentHandler = useCallback(() => {
    return activeAgentType === 'nuggets' ? handleNuggetsChange : handleLightbulbsChange;
  }, [activeAgentType, handleNuggetsChange, handleLightbulbsChange]);

  // Update active section when currentSection changes
  useEffect(() => {
    if (currentSection && (currentStep === 'nuggets' || currentStep === 'lightbulbs')) {
      setActiveSection(currentSection);
    }
  }, [currentSection, currentStep]);
  
  // When mode or currentStep changes, we should update the UI completely
  useEffect(() => {
    // Reset preview state when switching agents
    setPreviewMode(false);
    setPreviewInput('');
    setPreviewResponse('');
    // Réinitialiser également l'état d'affichage du prompt complet
    setShowFullPrompt(false);
    console.log(`Mode changed to: ${mode}, activeAgentType set to: ${activeAgentType}`);
  }, [mode, currentStep, activeAgentType]);

  // Extraire les variables du template une seule fois au niveau principal
  const extractTemplateVariables = useCallback(() => {
    const agent = getCurrentAgent();
    const promptText = agent?.prompt || '';
    const variables = {};
    const agentName = activeAgentType === 'nuggets' ? 'Elias' : 'Sonia';
    
    if (activeAgentType === 'nuggets') {
      // Variables spécifiques à Nuggets
      variables.agentName = agent?.agentName || agentName;
      variables.programName = sessionConfig.title || '';
      variables.teacherName = sessionConfig.teacherName || '';
    } else if (activeAgentType === 'lightbulbs') {
      // Variables spécifiques à Lightbulbs
      variables.agentName = agent?.agentName || agentName;
      variables.programName = sessionConfig.title || '';
    }
    
    return variables;
  }, [activeAgentType, getCurrentAgent, sessionConfig]);
  
  // Fonction pour mettre à jour le prompt complet
  const updatePromptWithVariables = useCallback((variables) => {
    const agent = getCurrentAgent();
    // Ne pas modifier le prompt de base, juste pour l'affichage
    let updatedPrompt = agent?.prompt || '';
    
    // Remplacer les variables dans le prompt selon le type d'agent
    if (activeAgentType === 'nuggets') {
      if (variables.agentName) {
        updatedPrompt = updatedPrompt.replace(/\"AGENT NAMED\"/g, `"${variables.agentName}"`);
      }
      if (variables.programName) {
        updatedPrompt = updatedPrompt.replace(/\"PROGRAME NAME\"/g, `"${variables.programName}"`);
        updatedPrompt = updatedPrompt.replace(/\"PROGRAME NAMED\"/g, `"${variables.programName}"`);
      }
      if (variables.teacherName) {
        updatedPrompt = updatedPrompt.replace(/\"TEATCHER NAME\"/g, `"${variables.teacherName}"`);
      }
    } else if (activeAgentType === 'lightbulbs') {
      if (variables.agentName) {
        updatedPrompt = updatedPrompt.replace(/\"AGENT NAME\"/g, `"${variables.agentName}"`);
      }
      if (variables.programName) {
        updatedPrompt = updatedPrompt.replace(/\"PRGRAMENAME\"/g, `"${variables.programName}"`);
      }
    }
    
    return updatedPrompt;
  }, [activeAgentType, getCurrentAgent]);
  
  // Obtenir les variables du template une fois
  const templateVariables = extractTemplateVariables();
  
  // Prompt mis à jour avec les variables
  const displayPrompt = updatePromptWithVariables(templateVariables);

  // S'assurer que les prompts par défaut sont utilisés si nécessaire
  useEffect(() => {
    // Pour l'agent Nuggets
    if (activeAgentType === 'nuggets' && (!nuggets.prompt || nuggets.prompt.trim() === '')) {
      handleNuggetsChange('prompt', DEFAULT_NUGGETS_PROMPT);
    }
    // Pour l'agent Lightbulbs
    else if (activeAgentType === 'lightbulbs' && (!lightbulbs.prompt || lightbulbs.prompt.trim() === '')) {
      handleLightbulbsChange('prompt', DEFAULT_LIGHTBULBS_PROMPT);
    }
  }, [activeAgentType, nuggets, lightbulbs, handleNuggetsChange, handleLightbulbsChange]);

  // Handler for timer settings changes
  const handleTimerEnabledChange = useCallback((enabled) => {
    const updatedConfig = {
      ...sessionConfig,
      settings: {
        ...sessionConfig.settings,
        ai_configuration: {
          ...ai_settings,
          timerEnabled: enabled
        }
      }
    };
    
    updateSessionConfig(updatedConfig);
    
    // Notify parent component if callback provided (for flow map updates)
    if (onTimerConfigChange) {
      onTimerConfigChange({ enabled, duration: timerDuration });
    }
  }, [sessionConfig, updateSessionConfig, ai_settings, timerDuration, onTimerConfigChange]);
  
  const handleTimerDurationChange = useCallback((duration) => {
    const updatedConfig = {
      ...sessionConfig,
      settings: {
        ...sessionConfig.settings,
        ai_configuration: {
          ...ai_settings,
          timerDuration: duration
        }
      }
    };
    
    updateSessionConfig(updatedConfig);
    
    // Notify parent component if callback provided (for flow map updates)
    if (onTimerConfigChange) {
      onTimerConfigChange({ enabled: timerEnabled, duration });
    }
  }, [sessionConfig, updateSessionConfig, ai_settings, timerEnabled, onTimerConfigChange]);

  // Handle book configuration changes
  const handleNuggetsBookConfigChange = useCallback((bookConfig) => {
    updateSessionConfig({
      ...sessionConfig,
      settings: {
        ...sessionConfig.settings,
        ai_configuration: {
          ...ai_settings,
          nuggets: {
            ...nuggets,
            bookConfig: bookConfig
          }
        }
      }
    });
  }, [sessionConfig, updateSessionConfig, ai_settings, nuggets]);
  
  const handleLightbulbsBookConfigChange = useCallback((bookConfig) => {
    updateSessionConfig({
      ...sessionConfig,
      settings: {
        ...sessionConfig.settings,
        ai_configuration: {
          ...ai_settings,
          lightbulbs: {
            ...lightbulbs,
            bookConfig: bookConfig
          }
        }
      }
    });
  }, [sessionConfig, updateSessionConfig, ai_settings, lightbulbs]);

  // Handle analysis items changes
  const handleAnalysisItemsChange = useCallback((newItems) => {
    setAnalysisItems(newItems);
    
    const updatedConfig = {
      ...sessionConfig,
      settings: {
        ...sessionConfig.settings,
        finalAnalysis: {
          ...sessionConfig.settings?.finalAnalysis,
          items: newItems
        }
      }
    };
    
    updateSessionConfig(updatedConfig);
    
    // Notify parent component if callback provided (for flow map updates)
    if (onAnalysisOrderChange) {
      onAnalysisOrderChange(newItems);
    }
  }, [sessionConfig, updateSessionConfig, onAnalysisOrderChange]);

  // Toggle analysis item enabled state
  const toggleAnalysisItemEnabled = useCallback((id) => {
    const updatedItems = analysisItems.map(item => 
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    handleAnalysisItemsChange(updatedItems);
  }, [analysisItems, handleAnalysisItemsChange]);

  // Handle image upload for agents
  const handleNuggetsImageUploaded = useCallback((imageUrl) => {
    handleNuggetsChange('imageUrl', imageUrl);
  }, [handleNuggetsChange]);

  const handleLightbulbsImageUploaded = useCallback((imageUrl) => {
    handleLightbulbsChange('imageUrl', imageUrl);
  }, [handleLightbulbsChange]);

  // Reset agent images to defaults
  const resetNuggetsImage = useCallback(() => {
    handleNuggetsChange('imageUrl', DEFAULT_AGENT_IMAGES.nuggets);
  }, [handleNuggetsChange]);

  const resetLightbulbsImage = useCallback(() => {
    handleLightbulbsChange('imageUrl', DEFAULT_AGENT_IMAGES.lightbulbs);
  }, [handleLightbulbsChange]);

  // Function to generate a preview response
  const generatePreview = useCallback(() => {
    if (!previewInput.trim()) return;
    
    setIsGeneratingPreview(true);
    setPreviewResponse('');
    
    // Simulate API delay
    setTimeout(() => {
      let response = '';
      
      if (activeAgentType === 'nuggets') {
        response = `Based on your input, here are the key nuggets I've extracted:\n\n` +
                   `• Strategic insight: ${previewInput.substring(0, 50)}...\n` +
                   `• Important concept: Technology integration can enhance user experience\n` +
                   `• Key observation: Customer feedback patterns indicate a need for simplification`;
      } else {
        response = `Your input has sparked these creative ideas:\n\n` +
                   `• Development opportunity: ${previewInput.substring(0, 50)}...\n` +
                   `• Innovation concept: Implementing a user-centered design approach\n` +
                   `• Future direction: Exploring market expansion through strategic partnerships`;
      }
      
      setPreviewResponse(response);
      setIsGeneratingPreview(false);
    }, 1500);
  }, [activeAgentType, previewInput]);

  // Render agent configuration section
  const renderAgentConfigSection = () => {
    const agent = getCurrentAgent();
    const handleAgentChange = getCurrentAgentHandler();
    const handleImageUploaded = activeAgentType === 'nuggets' ? handleNuggetsImageUploaded : handleLightbulbsImageUploaded;
    const resetImage = activeAgentType === 'nuggets' ? resetNuggetsImage : resetLightbulbsImage;
    const defaultImage = activeAgentType === 'nuggets' ? DEFAULT_AGENT_IMAGES.nuggets : DEFAULT_AGENT_IMAGES.lightbulbs;
    const primaryColor = activeAgentType === 'nuggets' ? 'blue' : 'amber';
    const agentName = activeAgentType === 'nuggets' ? 'Elias' : 'Sonia';
    
    // État pour les fonctionnalités d'édition de prompt
    const [rawPrompt, setRawPrompt] = useState(agent.prompt || getDefaultPrompt(activeAgentType));
    const [parsedData, setParsedData] = useState({
      agentName: '',
      programName: '',
      teacherName: '',
      style: '',
      rules: [],
      questions: []
    });
    const [newRule, setNewRule] = useState('');
    const [newQuestion, setNewQuestion] = useState('');
    
    // Parse le prompt lorsque le composant est monté ou quand le prompt change
    useEffect(() => {
      if (agent.prompt) {
        const extracted = parsePrompt(agent.prompt);
        setParsedData(extracted);
        setRawPrompt(agent.prompt);
      } else {
        const defaultPrompt = getDefaultPrompt(activeAgentType);
        setRawPrompt(defaultPrompt);
        setParsedData(parsePrompt(defaultPrompt));
      }
    }, [agent.prompt, activeAgentType]);
    
    // Gestion des règles
    const handleAddRule = () => {
      if (!newRule.trim()) return;
      
      const updatedRules = [...parsedData.rules, newRule.trim()];
      const updatedData = {
        ...parsedData,
        rules: updatedRules
      };
      setParsedData(updatedData);
      
      // Générer le nouveau prompt et le sauvegarder
      const newPrompt = generatePrompt(updatedData, activeAgentType);
      setRawPrompt(newPrompt);
      handleAgentChange('prompt', newPrompt);
      setNewRule('');
    };
    
    const handleRemoveRule = (index) => {
      const updatedRules = parsedData.rules.filter((_, i) => i !== index);
      const updatedData = {
        ...parsedData,
        rules: updatedRules
      };
      setParsedData(updatedData);
      
      // Générer le nouveau prompt et le sauvegarder
      const newPrompt = generatePrompt(updatedData, activeAgentType);
      setRawPrompt(newPrompt);
      handleAgentChange('prompt', newPrompt);
    };
    
    // Gestion des questions
    const handleAddQuestion = () => {
      if (!newQuestion.trim()) return;
      
      const updatedQuestions = [...parsedData.questions, newQuestion.trim()];
      const updatedData = {
        ...parsedData,
        questions: updatedQuestions
      };
      setParsedData(updatedData);
      
      // Générer le nouveau prompt et le sauvegarder
      const newPrompt = generatePrompt(updatedData, activeAgentType);
      setRawPrompt(newPrompt);
      handleAgentChange('prompt', newPrompt);
      setNewQuestion('');
    };
    
    const handleRemoveQuestion = (index) => {
      const updatedQuestions = parsedData.questions.filter((_, i) => i !== index);
      const updatedData = {
        ...parsedData,
        questions: updatedQuestions
      };
      setParsedData(updatedData);
      
      // Générer le nouveau prompt et le sauvegarder
      const newPrompt = generatePrompt(updatedData, activeAgentType);
      setRawPrompt(newPrompt);
      handleAgentChange('prompt', newPrompt);
    };
    
    // Mise à jour du style
    const handleStyleChange = (e) => {
      const newStyle = e.target.value;
      const updatedData = {
        ...parsedData,
        style: newStyle
      };
      setParsedData(updatedData);
      
      // Générer le nouveau prompt et le sauvegarder
      const newPrompt = generatePrompt(updatedData, activeAgentType);
      setRawPrompt(newPrompt);
      handleAgentChange('prompt', newPrompt);
    };
    
    // Mise à jour directe du prompt raw
    const handleRawPromptChange = (e) => {
      const newPrompt = e.target.value;
      setRawPrompt(newPrompt);
      handleAgentChange('prompt', newPrompt);
      
      // Parser le nouveau prompt pour mettre à jour les champs
      const extracted = parsePrompt(newPrompt);
      setParsedData(extracted);
    };
    
    // Render preview section
    const renderPreviewSection = () => {
      const primaryColor = activeAgentType === 'nuggets' ? 'blue' : 'amber';
      
      return (
        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Agent Preview</h4>
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`text-sm text-${primaryColor}-600 hover:text-${primaryColor}-800`}
            >
              {previewMode ? "Hide" : "Show"} preview
            </button>
          </div>
            
          {previewMode && (
            <div className="bg-gray-50 rounded-md p-3 mt-2">
              <textarea
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm p-2 mb-2`}
                value={previewInput}
                onChange={(e) => setPreviewInput(e.target.value)}
                placeholder="Enter a message to test the agent..."
                rows={2}
              />
              
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setIsGeneratingPreview(true);
                    
                    // Simulation d'une réponse de l'IA (à remplacer par un vrai appel API)
                    setTimeout(() => {
                      // Ajoutez ici la logique pour générer une réponse en fonction du prompt et de l'entrée
                      const response = `This is a simulated response based on your prompt:\n\n${rawPrompt.slice(0, 100)}...\n\nInput: ${previewInput}`;
                      setPreviewResponse(response);
                      setIsGeneratingPreview(false);
                    }, 1500);
                  }}
                  disabled={isGeneratingPreview || !previewInput.trim()}
                  className={`px-3 py-1 bg-${primaryColor}-500 hover:bg-${primaryColor}-600 text-white rounded text-sm disabled:bg-${primaryColor}-300`}
                >
                  {isGeneratingPreview ? "Generating..." : "Generate a response"}
                </button>
              </div>
              
              {previewResponse && (
                <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Agent response:</h5>
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
        <div className={`bg-${primaryColor}-50 border-l-4 border-${primaryColor}-500 p-4 rounded-r-md mb-4`}>
          <h3 className={`font-semibold text-${primaryColor}-800 mb-2`}>Configuration of {activeAgentType === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'} Agent</h3>
          <p className={`text-${primaryColor}-700 text-sm`}>
            {activeAgentType === 'nuggets' 
              ? 'Customize the AI Nuggets agent (Elias) that extracts important information from discussions.'
              : 'Customize the AI Lightbulbs agent (Sonia) that develops creative ideas based on discussions.'}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Agent image and basic info */}
          <div className="w-full md:w-1/3">
            <Card className="p-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 relative">
                  <Image 
                    src={agent.imageUrl || defaultImage}
                    alt={`${agentName} avatar`}
                    width={128}
                    height={128}
                    className="object-cover"
                  />
                </div>
                
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    className={`text-center font-medium text-lg text-${primaryColor}-600 bg-transparent border-b border-${primaryColor}-300 focus:border-${primaryColor}-500 focus:ring-0 w-40`}
                    value={agent.agentName || agentName}
                    onChange={(e) => handleAgentChange('agentName', e.target.value)}
                    placeholder={agentName}
                  />
                  <span className="text-xs text-gray-500 mt-1">Agent Name</span>
                </div>
                
                <div className="flex space-x-2">
                  <ImageUploader onImageUploaded={handleImageUploaded} buttonStyle="secondary" buttonText="Upload Image" />
                  <button
                    onClick={resetImage}
                    className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Agent prompt and configuration */}
          <div className="w-full md:w-2/3">
            <Card className="p-4">
              <div className="flex flex-col space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-0">
                    <h4 className="text-base font-medium">Agent Prompt</h4>
                    <button 
                      onClick={() => setShowFullPrompt(!showFullPrompt)}
                      className={`text-xs text-${primaryColor}-600 hover:text-${primaryColor}-800`}
                    >
                      {showFullPrompt ? "Hide Full Prompt" : "Show Full Prompt"}
                    </button>
                  </div>
                  
                  {showFullPrompt ? (
                    <div className="space-y-3">
                      <textarea
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono p-2 min-h-[300px]"
                        value={rawPrompt}
                        onChange={handleRawPromptChange}
                        placeholder="Enter the raw prompt"
                      />
                      <p className="text-xs text-gray-500">
                        Edit the raw prompt directly. This gives you full control over the prompt structure and content.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-sm text-gray-500 mb-4">
                        Configure the parameters below to customize the agent's behavior.
                        The prompt template includes variables like agent name, program name, etc.
                      </p>
                      
                      {/* Style Description */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Style Description
                        </label>
                        <textarea
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 min-h-[100px]"
                          value={parsedData.style || ''}
                          onChange={handleStyleChange}
                          placeholder="Describe the agent's communication style"
                        />
                      </div>
                      
                      {/* Rules */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rules
                        </label>
                        <div className="space-y-2">
                          {parsedData.rules && parsedData.rules.map((rule, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <input
                                type="text"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                value={rule}
                                readOnly
                              />
                              <button
                                onClick={() => handleRemoveRule(index)}
                                className="p-1 text-red-500 hover:text-red-700"
                                title="Remove rule"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Add a new rule"
                            value={newRule}
                            onChange={(e) => setNewRule(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newRule.trim()) {
                                handleAddRule();
                              }
                            }}
                          />
                          <button
                            onClick={handleAddRule}
                            className="p-1 text-blue-500 hover:text-blue-700"
                            title="Add rule"
                            disabled={!newRule.trim()}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Questions */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Questions
                        </label>
                        <div className="space-y-2">
                          {parsedData.questions && parsedData.questions.map((question, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <textarea
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                                value={question}
                                readOnly
                                rows={2}
                              />
                              <button
                                onClick={() => handleRemoveQuestion(index)}
                                className="p-1 text-red-500 hover:text-red-700"
                                title="Remove question"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <textarea
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                            placeholder="Add a new question"
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            rows={2}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey && newQuestion.trim()) {
                                handleAddQuestion();
                              }
                            }}
                          />
                          <button
                            onClick={handleAddQuestion}
                            className="p-1 text-blue-500 hover:text-blue-700"
                            title="Add question"
                            disabled={!newQuestion.trim()}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Press Ctrl+Enter to add a new question
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4 mt-2">
                  <h4 className="text-base font-medium mb-3">General Settings</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program Name
                      </label>
                      <input
                        type="text"
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm`}
                        value={sessionConfig.title || ''}
                        onChange={(e) => {
                          updateSessionConfig({
                            ...sessionConfig,
                            title: e.target.value
                          });
                        }}
                        placeholder="Enter program name"
                      />
                    </div>
                    
                    {activeAgentType === 'nuggets' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teacher/Facilitator Name
                        </label>
                        <input
                          type="text"
                          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm`}
                          value={sessionConfig.teacherName || ''}
                          onChange={(e) => {
                            updateSessionConfig({
                              ...sessionConfig,
                              teacherName: e.target.value
                            });
                          }}
                          placeholder="Enter teacher/facilitator name"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Additional customization fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Agent Personality
                      </label>
                      <select
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm`}
                        value={agent.personality || 'professional'}
                        onChange={(e) => handleAgentChange('personality', e.target.value)}
                      >
                        <option value="professional">Professional & Formal</option>
                        <option value="friendly">Friendly & Approachable</option>
                        <option value="enthusiastic">Enthusiastic & Energetic</option>
                        <option value="concise">Concise & Direct</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Language Complexity
                      </label>
                      <select
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm`}
                        value={agent.languageComplexity || 'moderate'}
                        onChange={(e) => handleAgentChange('languageComplexity', e.target.value)}
                      >
                        <option value="simple">Simple & Accessible</option>
                        <option value="moderate">Moderate Complexity</option>
                        <option value="advanced">Advanced & Technical</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Preview Section (shown only when previewMode is true) */}
            {previewMode && renderPreviewSection()}
          </div>
        </div>
      </div>
    );
  };

  // Render agent analysis section
  const renderAgentAnalysisSection = () => {
    const agent = getCurrentAgent();
    const handleAgentChange = getCurrentAgentHandler();
    const primaryColor = activeAgentType === 'nuggets' ? 'blue' : 'amber';

    return (
      <div className="space-y-6">
        <div className={`bg-${primaryColor}-50 border-l-4 border-${primaryColor}-500 p-4 rounded-r-md mb-4`}>
          <h3 className={`font-semibold text-${primaryColor}-800 mb-2`}>
            Conversation Analysis for {activeAgentType === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'}
          </h3>
          <p className={`text-${primaryColor}-700 text-sm`}>
            {activeAgentType === 'nuggets'
              ? 'Configure how the AI Nuggets agent (Elias) analyzes and extracts information from discussions.'
              : 'Configure how the AI Lightbulbs agent (Sonia) identifies and develops creative ideas.'}
          </p>
        </div>
          
        <Card className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Analysis Parameters</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {activeAgentType === 'nuggets' ? 'Nugget Extraction Criteria' : 'Idea Development Criteria'}
              </label>
              <textarea
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm p-2 min-h-[100px]`}
                value={agent.analysisCriteria || ''}
                onChange={(e) => handleAgentChange('analysisCriteria', e.target.value)}
                placeholder={activeAgentType === 'nuggets'
                  ? 'Example: Extract information with strategic impact, relevant insights, innovative concepts...'
                  : 'Example: Identify ideas with development potential, disruptive concepts, innovation opportunities...'}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Response Format</label>
              <select
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm`}
                value={agent.responseFormat || 'bullet'}
                onChange={(e) => handleAgentChange('responseFormat', e.target.value)}
              >
                <option value="bullet">Key points (bullet points)</option>
                <option value="paragraph">Paragraphs</option>
                <option value="structured">Hierarchical structure</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specific Instructions for Analysis
              </label>
              <textarea
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm p-2 min-h-[150px]`}
                value={agent.analysisInstructions || ''}
                onChange={(e) => handleAgentChange('analysisInstructions', e.target.value)}
                placeholder={activeAgentType === 'nuggets'
                  ? 'Detailed instructions for extracting important information...'
                  : 'Detailed instructions for developing creative ideas...'}
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
                  Summarize conversation before analysis
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
                  Include participant information in analysis
                </span>
              </label>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Render book configuration section
  const renderBookConfigSection = () => {
    const bookConfigProps = {
      initialConfig: {
        prompt: '',
        programName: '',
        agentName: '',
        style: '',
        rules: [],
        questions: [],
        analysisConfig: {
          themes: [],
          keywordsPerTheme: {},
          sentimentAnalysis: true,
          extractKeyInsights: true
        },
        bookConfig: activeAgentType === 'nuggets' 
          ? (nuggets.bookConfig || { sections: [], visualStyle: {} }) 
          : (lightbulbs.bookConfig || { sections: [], visualStyle: {} })
      },
      agentType: activeAgentType,
      onSave: (config) => {
        if (activeAgentType === 'nuggets') {
          handleNuggetsBookConfigChange(config.bookConfig);
        } else {
          handleLightbulbsBookConfigChange(config.bookConfig);
        }
      }
    };

    const primaryColor = activeAgentType === 'nuggets' ? 'blue' : 'amber';
    
    return (
      <div className="space-y-6">
        <div className={`bg-${primaryColor}-50 border-l-4 border-${primaryColor}-500 p-4 rounded-r-md mb-4`}>
          <h3 className={`font-semibold text-${primaryColor}-800 mb-2`}>Book Configuration for {activeAgentType === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'}</h3>
          <p className={`text-${primaryColor}-700 text-sm`}>
            {activeAgentType === 'nuggets' 
              ? 'Customize the appearance and content of the book generated from AI Nuggets agent analyses.'
              : 'Customize the appearance and content of the book generated from AI Lightbulbs agent analyses.'}
          </p>
        </div>
        
        <AIPromptConfig {...bookConfigProps} />
      </div>
    );
  };

  // Main rendering logic based on current step
  if (currentStep === 'final-analysis') {
    // Render final analysis section
    return (
      <div className="space-y-6">
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-md mb-4">
          <h3 className="font-semibold text-purple-800 mb-2">Final Analysis Configuration</h3>
          <p className="text-purple-700 text-sm">
            Organize and configure how the different analyses will be presented to participants at the end of the session.
          </p>
        </div>
        
        <Card className="p-6">
          <p className="text-gray-600 mb-4">Configure the final analysis settings here...</p>
        </Card>
      </div>
    );
  }

  // For AI agents (nuggets/lightbulbs), show the relevant config based on activeSection
  return (
    <div className="space-y-8">
      {/* Agent-specific tabs for subsections - Show only Book for simplicity */}
      <div className="pb-4">
        <h2 className="text-xl font-semibold mb-2">
          {activeAgentType === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'} Book Configuration
        </h2>
        <p className="text-gray-600">
          Customize how insights will be presented in the book format.
        </p>
      </div>

      {renderBookConfigSection()}
      
      {/* Preview Section - Remove since we only show book config now */}
    </div>
  );
};

export default AIInteractionConfig;