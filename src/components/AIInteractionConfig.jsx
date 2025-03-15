import React, { useState, useEffect } from 'react';
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
  const [activeSection, setActiveSection] = useState(currentSection || 'config');
  
  // State for preview mode
  const [previewMode, setPreviewMode] = useState(false);
  const [previewInput, setPreviewInput] = useState('');
  const [previewResponse, setPreviewResponse] = useState('');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Determine which agent to display based on the mode parameter
  const activeAgentType = mode === 'lightbulb' ? 'lightbulbs' : 'nuggets';

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
    console.log(`Mode changed to: ${mode}, activeAgentType set to: ${activeAgentType}`);
  }, [mode, currentStep, activeAgentType]);
  
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

  // Handler for timer settings changes
  const handleTimerEnabledChange = (enabled) => {
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
  };
  
  const handleTimerDurationChange = (duration) => {
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
  };
  
  // Handlers for agent configuration changes
  const handleNuggetsChange = (field, value) => {
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
  };
  
  const handleLightbulbsChange = (field, value) => {
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
  };

  // Handle book configuration changes
  const handleNuggetsBookConfigChange = (bookConfig) => {
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
  };
  
  const handleLightbulbsBookConfigChange = (bookConfig) => {
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
  };

  // Handle analysis items changes
  const handleAnalysisItemsChange = (newItems) => {
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
  };

  // Toggle analysis item enabled state
  const toggleAnalysisItemEnabled = (id) => {
    const updatedItems = analysisItems.map(item => 
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    handleAnalysisItemsChange(updatedItems);
  };

  // Function to generate a preview response
  const generatePreview = async () => {
    if (!previewInput.trim()) return;
    
    setIsGeneratingPreview(true);
    
    try {
      // Simulate API call for preview
      setTimeout(() => {
        const agentName = activeAgentType === 'nuggets' ? nuggets.agentName : lightbulbs.agentName;
        const agentType = activeAgentType === 'nuggets' ? 'Nuggets' : 'Lightbulbs';
        setPreviewResponse(`
          As ${agentName}, here's my response:
          
          ${previewInput.includes('?') 
            ? `Thank you for your question. As an AI ${agentType} agent, I'll help you ${activeAgentType === 'nuggets' ? 'identify important information' : 'develop this creative idea'}.`
            : `I've analyzed your message and here are my observations as an AI ${agentType} agent.`}
          
          ${activeAgentType === 'nuggets' 
            ? 'Key points identified:\n- Important business insight\n- Strategic observation\n- Development opportunity'
            : 'Creative development:\n- Innovative concept based on your idea\n- Potential applications\n- Recommended next steps'}
          
          Feel free to ask more questions to explore these points further.
        `);
        setIsGeneratingPreview(false);
      }, 1500);
    } catch (error) {
      setPreviewResponse("An error occurred while generating the preview.");
      setIsGeneratingPreview(false);
    }
  };

  // Handlers for agent images with the new component
  const handleNuggetsImageUploaded = (imageUrl) => {
    console.log('New AI Nuggets image:', imageUrl);
    handleNuggetsChange('imageUrl', imageUrl);
  };

  const handleLightbulbsImageUploaded = (imageUrl) => {
    console.log('New AI Lightbulbs image:', imageUrl);
    handleLightbulbsChange('imageUrl', imageUrl);
  };

  const resetNuggetsImage = () => {
    handleNuggetsChange('imageUrl', DEFAULT_AGENT_IMAGES.nuggets);
  };

  const resetLightbulbsImage = () => {
    handleLightbulbsChange('imageUrl', DEFAULT_AGENT_IMAGES.lightbulbs);
  };

  // Helper function to get current agent data based on mode parameter
  const getCurrentAgent = () => {
    return activeAgentType === 'nuggets' ? nuggets : lightbulbs;
  };

  // Helper function to get current agent handler based on mode parameter
  const getCurrentAgentHandler = () => {
    return activeAgentType === 'nuggets' ? handleNuggetsChange : handleLightbulbsChange;
  };

  // Render agent configuration section
  const renderAgentConfigSection = () => {
    const agent = getCurrentAgent();
    const handleAgentChange = getCurrentAgentHandler();
    const handleImageUploaded = activeAgentType === 'nuggets' ? handleNuggetsImageUploaded : handleLightbulbsImageUploaded;
    const resetImage = activeAgentType === 'nuggets' ? resetNuggetsImage : resetLightbulbsImage;
    const defaultImage = activeAgentType === 'nuggets' ? DEFAULT_AGENT_IMAGES.nuggets : DEFAULT_AGENT_IMAGES.lightbulbs;
    const primaryColor = activeAgentType === 'nuggets' ? 'blue' : 'amber';
    const agentName = activeAgentType === 'nuggets' ? 'Elias' : 'Sonia';
    
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
            <div className="flex flex-col items-center">
              <ImageUploader
                bucket="ai-agent"
                defaultImage={agent.imageUrl || defaultImage}
                onImageUploaded={handleImageUploaded}
                filePrefix={`ai-${activeAgentType}`}
                size="lg"
                shape="circle"
                buttonText="Change Image"
                resetButton={true}
                onReset={resetImage}
                resetButtonText="Reset"
                className="mb-4"
              />
              
              <div className="space-y-2 w-full">                    
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                  <input
                    type="text"
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm p-2`}
                    value={agent.agentName}
                    onChange={(e) => handleAgentChange('agentName', e.target.value)}
                    placeholder={`Name for the ${activeAgentType === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'} agent`}
                  />
                </div>
              </div>
            </div>
          </div>
              
          {/* Agent configuration */}
          <div className="w-full md:w-2/3">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeAgentType === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'} Agent Prompt
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {activeAgentType === 'nuggets'
                ? 'This agent extracts valuable information from discussions and synthesizes important ideas.'
                : 'This agent helps develop creative ideas and innovative concepts based on discussions.'}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agent Prompt</label>
                <textarea
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm p-2 min-h-[150px]`}
                  value={agent.prompt}
                  onChange={(e) => handleAgentChange('prompt', e.target.value)}
                  placeholder={`Detailed instructions for the ${activeAgentType === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'} agent`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Define the instructions that the agent should follow when interacting with participants.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AI Model</label>
                  <select
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500 sm:text-sm`}
                    value={agent.model || "gpt-4"}
                    onChange={(e) => handleAgentChange('model', e.target.value)}
                  >
                    <option value="gpt-4">GPT-4 (Recommended)</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>
          
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    className="w-full"
                    value={agent.temperature || (activeAgentType === 'nuggets' ? 0.7 : 0.8)}
                    onChange={(e) => handleAgentChange('temperature', parseFloat(e.target.value))}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Precise (0)</span>
                    <span>{agent.temperature || (activeAgentType === 'nuggets' ? 0.7 : 0.8)}</span>
                    <span>Creative (1)</span>
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
        agentName: activeAgentType === 'nuggets' ? nuggets.agentName : lightbulbs.agentName,
        programName: '',
        teacherName: '',
        customRules: [],
        customQuestions: [],
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

  // Render final analysis section with drag and drop and configuration
  const renderFinalAnalysisSection = () => {
    // Initialize analysisConfiguration if it doesn't exist
    const analysisConfiguration = sessionConfig.analysisConfiguration || {
      includeParticipantNames: true,
      includeQuotesInAnalysis: true,
      generateKeyInsights: true,
      analysisGenerationTime: 60
    };
    
    // Find the selected item object
    const selectedItem = analysisItems.find(item => item.id === selectedAnalysisItemId);
    
    return (
      <div className="space-y-6">
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-md mb-4">
          <h3 className="font-semibold text-purple-800 mb-2">Final Analysis Configuration</h3>
          <p className="text-purple-700 text-sm">
            Organize the presentation order of the different analyses and configure each section according to your needs.
            Use the left panel to reorganize the analyses, and the right panel to configure the selected analysis.
          </p>
        </div>
        
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Panel - Analysis Order List */}
            <div className="border-r pr-6">
              <AnalysisOrderList 
                items={analysisItems}
                onReorder={handleAnalysisItemsChange}
                onToggleItem={toggleAnalysisItemEnabled}
                selectedItemId={selectedAnalysisItemId}
                onSelectItem={setSelectedAnalysisItemId}
              />
              
              <div className="mt-6 bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">Usage Tips</h4>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  <li>The order of analyses directly impacts the learning experience</li>
                  <li>Start with the most relevant analysis for your educational context</li>
                  <li>The global analysis is generally more effective as a conclusion</li>
                </ul>
              </div>
            </div>
            
            {/* Right Panel - Analysis Configuration */}
            <div className="pl-0 md:pl-6">
              <AnalysisConfigPanel
                selectedItem={selectedItem}
                items={analysisItems}
                updateSessionConfig={updateSessionConfig}
                sessionConfig={sessionConfig}
                analysisConfiguration={analysisConfiguration}
              />
            </div>
          </div>
        </Card>
      </div>
    );
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
                onClick={generatePreview}
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

  // Main rendering logic based on current step
  if (currentStep === 'final-analysis') {
    // For final analysis, only show the analysis configuration
    return renderFinalAnalysisSection();
  }
  
  // For AI agents (nuggets/lightbulbs), show the relevant config based on activeSection
  return (
    <div className="space-y-8">
      {/* Agent-specific tabs for subsections */}
      <Tabs defaultValue={activeSection} value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="config">Agent Configuration</TabsTrigger>
          <TabsTrigger value="analysis">Analysis Configuration</TabsTrigger>
          <TabsTrigger value="book">Book</TabsTrigger>
        </TabsList>
      
        <TabsContent value="config">
          {renderAgentConfigSection()}
        </TabsContent>
        
        <TabsContent value="analysis">
          {renderAgentAnalysisSection()}
        </TabsContent>
        
        <TabsContent value="book">
          {renderBookConfigSection()}
        </TabsContent>
      </Tabs>
      
      {/* Preview Section */}
      {previewMode && renderPreviewSection()}
    </div>
  );
};

// Export helper function to get default timer values - can be used in flow map
export const getDefaultTimerConfig = () => {
  return {
    enabled: DEFAULT_AI_CONFIGURATION.timerEnabled || true,
    duration: DEFAULT_AI_CONFIGURATION.timerDuration || 15
  };
};

// Export helper function to get default analysis items - can be used in flow map
export const getDefaultAnalysisOrder = () => {
  return DEFAULT_AI_CONFIGURATION.finalAnalysis.items || [];
};

export default AIInteractionConfig; 
