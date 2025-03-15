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
  // État pour afficher le prompt complet
  const [showFullPrompt, setShowFullPrompt] = useState(false);

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
    // Réinitialiser également l'état d'affichage du prompt complet
    setShowFullPrompt(false);
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

  // Extraire les variables du template une seule fois au niveau principal
  const extractTemplateVariables = () => {
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
  };
  
  // Obtenir les variables du template une fois
  const templateVariables = extractTemplateVariables();
  
  // Fonction pour mettre à jour le prompt complet
  const updatePromptWithVariables = (variables) => {
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
  };
  
  // Prompt mis à jour avec les variables
  const displayPrompt = updatePromptWithVariables(templateVariables);

  // Final analysis configuration
  const [analysisItems, setAnalysisItems] = useState(
    sessionConfig.settings?.finalAnalysis?.items || DEFAULT_AI_CONFIGURATION.finalAnalysis.items
  );

  // Selected analysis item for configuration in final analysis step
  const [selectedAnalysisItemId, setSelectedAnalysisItemId] = useState('');

  // Default prompt for AI Nuggets
  const DEFAULT_NUGGETS_PROMPT = `# Objective
You are a dedicated support agent named "AGENT NAMED" responsible for engaging participants in the "PROGRAME NAME" event questionnaire. Your main goal is to collect accurate and structured responses to key questions while adhering to identification protocols for secure and personalized interactions.

# Style
"Maintain a professional and friendly tone to make participants feel comfortable and engaged. Use clear sentences, bullet points for clarity, and light emojis to keep the conversation approachable but professional."

# Rules

1.  Assure participants that there information will remain confidential and used solely for identification purposes if they ask us to delete their workshop data. 
2. **Sequential Flow**: 
   - Ask each required question in order and proceed only after receiving a full response.
3. **Clarification**: 
   - If a response is incomplete or unclear, ask for additional details politely before moving on.
4. **No Skipped Questions**: 
   - All the required questions must be addressed without skipping or rephrasing unless necessary for clarity.
5. **End of Conversation**: 
   - Conclude the conversation only after confirming that all responses are complete.

# Interaction Example

### Step 1: Welcome
- Start the conversation: 
  "Hi! Welcome to "PROGRAME NAMED". Participants told ole that your had a great story ! Im your AI Journalist for today. So tell me what's your famous story !  😊"

### Step 2: Required Questions (this question are template)
1. **Problem and Opportunity**:  
   "What is the main problem or opportunity your business is addressing?"
   
2. **Unique Solution**:  
   "How does your solution stand out from others in the market?"
   
3. **Target Audience**:  
   "Who are your primary customers or users, and what do they value most?"
   
4. **Impact and Results**:  
   "What measurable impact have you achieved so far, or what are you aiming for?"
   
5. **Scalability and Vision**:  
   "How do you plan to scale this solution, and what is your long-term vision?"

### Step 3: Closing the Discussion
- End on a positive and engaging note:  
  "Ok, now let's refocus back on "TEATCHER NAME", and we'll take a look at everyone's input together! Thanks so much for your time and your responses. If there's anything else you'd like to share, feel free to reach out. Have an amazing day! 🚀"`;

  // Default prompt for AI Lightbulbs
  const DEFAULT_LIGHTBULBS_PROMPT = `You are a dedicated support agent named "AGENT NAME" responsible for conducting the "PRGRAMENAME" "Final Light Bulb Questionnaire." Your objective is to guide each participant through every mandatory question, ensuring responses are complete, detailed, and reflect the transition from inspiration to action within the "Nexus" framework. Use cross-referencing to link responses to previously identified nuggets where relevant, and maintain focus on actionable plans and future impact.

Style:

Your tone should be professional, supportive, and attentive. Structure the conversation to promote clarity and ease, utilizing bullet points, well-organized steps, and supportive language. Add emojis as needed to make the interaction engaging and welcoming.

Rules:
	1.	Sequential Questioning: Follow the designated order for each question, only proceeding after receiving a complete response.
	2.	Cross-Referencing: Ensure each response ties back to the "nugget" that inspired the participant, prompting elaboration if connections aren't clear.
	3.	Clarification: Seek detailed clarifications when responses lack depth or completeness.
	4.	Completion Requirement: Every question must be fully answered to conclude the questionnaire. Confirm all necessary details are captured for each response.

Steps:

Step 1: Inspiration Nugget Reference
	•	Required Question: "Which nugget specifically inspired you? Could you briefly describe it?"
	•	Objective: "Identify the inspiration source to ensure a clear cross-reference between nuggets and insights."

Step 2: Light Bulb Moment
	•	Required Question: "What about this nugget inspired you to think, 'We could try this here'?"
	•	Objective: "Capture what resonated with the participant, highlighting the motivational trigger."

Step 4: From Inspiration to Action
	•	Required Question: "What did this nugget inspire you to do? Please specify the project, team, or context where you think this idea could work."
	•	Objective: "Link inspiration to a concrete action plan or context for application."

Step 5: Implementation Steps
	•	Required Question: "What concrete steps will you take to bring this idea to life in your own context?"
	•	Objective: "Define specific, actionable steps, encouraging clear and practical strategies."

Step 6: Timeline for Action
	•	Required Question: "By when do you plan to test or implement this idea?"
	•	Objective: "Establish a timeline, prompting commitment to a timeframe."

Step 7: Testing and Success Measures
	•	Required Question: "How will you test this idea to see if it gains traction? What will success look like?"
	•	Objective: "Promote experimentation, defining success metrics for evaluation."

Step 8: Challenges and Solutions
	•	Required Question: "What potential challenges do you anticipate in implementing this idea, and how could you overcome them?"
	•	Objective: "Encourage proactive thinking about obstacles and solutions."

Step 9: Long-Term Impact
	•	Required Question: "If this idea works, what could the long-term impact be for your team or business unit?"
	•	Objective: "Have participants reflect on potential broader impacts and strategic alignment with Nexus goals."

Closing the Discussion:

After confirming all responses are complete, the agent should conclude with a personalized and lighthearted closing message.

Rules for the Closing Message:
	1.	"Mention Annecy and the specific context (e.g., being at the Palace de Menthon, the weather, etc.)."
	2.	Include a reference to the discussion to tie it back to the participant's contributions or insights.
	3.	"Add a touch of humor to make the participant smile (e.g., a joke about the rain, the lake, or the setting)."
	4.	"Keep the tone friendly, warm, and reflective of the engaging interaction."`;

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
  }, [activeAgentType, nuggets, lightbulbs, handleNuggetsChange, handleLightbulbsChange, DEFAULT_NUGGETS_PROMPT, DEFAULT_LIGHTBULBS_PROMPT]);

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
              {activeAgentType === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'} Agent Configuration
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {activeAgentType === 'nuggets'
                ? 'This agent extracts valuable information from discussions and synthesizes important ideas.'
                : 'This agent helps develop creative ideas and innovative concepts based on discussions.'}
            </p>
            
            <div className="space-y-6">
              {/* Variables de template pour les deux agents */}
              <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3">Personnalisation du prompt</h4>
                <p className="text-sm text-blue-700 mb-4">
                  Complétez les informations ci-dessous pour personnaliser automatiquement le prompt de l'agent {activeAgentType === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'}.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'agent dans le prompt</label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                      value={agent.agentName}
                      onChange={(e) => handleAgentChange('agentName', e.target.value)}
                      placeholder="Nom de l'agent"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Ce nom sera utilisé pour remplacer "{activeAgentType === 'nuggets' ? 'AGENT NAMED' : 'AGENT NAME'}" dans le prompt.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du programme</label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                      value={sessionConfig.title || ''}
                      onChange={(e) => {
                        // Mise à jour du titre dans sessionConfig
                        updateSessionConfig({
                          ...sessionConfig,
                          title: e.target.value
                        });
                      }}
                      placeholder="Nom du programme ou de la session"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Ce nom sera utilisé pour remplacer "{activeAgentType === 'nuggets' ? 'PROGRAME NAME et PROGRAME NAMED' : 'PRGRAMENAME'}" dans le prompt.
                    </p>
                  </div>
                  
                  {activeAgentType === 'nuggets' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom du professeur</label>
                      <input
                        type="text"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                        value={sessionConfig.teacherName || ''}
                        onChange={(e) => {
                          // Mise à jour du nom du professeur dans sessionConfig
                          updateSessionConfig({
                            ...sessionConfig,
                            teacherName: e.target.value
                          });
                        }}
                        placeholder="Nom du professeur ou facilitateur"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Ce nom sera utilisé pour remplacer "TEATCHER NAME" dans le prompt.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Paramètres du modèle AI */}
              <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-3">Paramètres du modèle AI</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modèle AI</label>
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
                      value={agent.temperature || (activeAgentType === 'nuggets' ? 0.7 : 0.8)}
                      onChange={(e) => handleAgentChange('temperature', parseFloat(e.target.value))}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Précis (0)</span>
                      <span>{agent.temperature || (activeAgentType === 'nuggets' ? 0.7 : 0.8)}</span>
                      <span>Créatif (1)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bouton pour afficher/masquer le prompt complet */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowFullPrompt(!showFullPrompt)}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors"
                >
                  {showFullPrompt ? "Masquer le prompt complet" : "Voir le prompt complet"}
                </button>
              </div>
              
              {/* Affichage du prompt complet */}
              {showFullPrompt && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2">Prompt complet avec variables remplacées</h4>
                  <pre className="text-xs whitespace-pre-wrap bg-white p-3 rounded border border-gray-300 overflow-auto max-h-96">
                    {displayPrompt}
                  </pre>
                </div>
              )}
              
              {/* Section pour modifier directement le prompt complet */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Modifier le prompt complet (avancé)</label>
                <textarea
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 min-h-[150px]"
                  value={agent.prompt}
                  onChange={(e) => handleAgentChange('prompt', e.target.value)}
                  placeholder={`Prompt complet pour l'agent ${activeAgentType === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'}`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Modification avancée: les changements effectués ici remplaceront les variables personnalisées ci-dessus.
                </p>
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

  return (
    <div className="space-y-6">
      {activeSection === 'config' && (
        <>
          {renderAgentConfigSection()}
        </>
      )}
      {activeSection === 'analysis' && (
        <>
          {renderAgentAnalysisSection()}
        </>
      )}
    </div>
  );
};

export default AIInteractionConfig;