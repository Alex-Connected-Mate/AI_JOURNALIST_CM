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
import { toast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';

// Nuggets prompt template
const NUGGETS_PROMPT_TEMPLATE = `# Objective
You are a dedicated support agent named "{agentName}" responsible for engaging participants in the "{programName}" event questionnaire. Your main goal is to collect accurate and structured responses to key questions while adhering to identification protocols for secure and personalized interactions.

# Context
{programContext}

# Style
{style}

# Questions
{questions}

# Rules
{rules}

# Interaction Example
### Step 1: Welcome
- Start the conversation with a personalized greeting that references the context: 
  "Hi! Welcome to *{programName}*! I heard you had a great story to share! I'm your AI Journalist for today, and I'm excited to hear about your experience here at {programContext}. 😊"

### Step 2: Closing the Discussion
- End on a positive and engaging note that references the context:  
  "Ok, now let's refocus back on *{teacherName}* and we'll take a look at everyone's input together! Thanks so much for your time and your responses. I hope you're enjoying your time here at {programContext}. If there's anything else you'd like to share, feel free to reach out. Have an amazing day! 🚀"`;

// Lightbulbs prompt template
const LIGHTBULBS_PROMPT_TEMPLATE = `You are a dedicated support agent named "{agentName}" responsible for conducting the "{programName}" "Final Light Bulb Questionnaire." Your objective is to guide each participant through every mandatory question, ensuring responses are complete and detailed, while making the conversation engaging and personalized by referencing the program's unique context.

# Context
{programContext}

# Style
{style}

# Steps
{questions}

# Rules
{rules}

# Closing the Discussion
After confirming all responses are complete, the agent should conclude with a personalized and lighthearted closing message.

Rules for the Closing Message:
1. Reference the specific program context ({programContext}) to make the conversation more personal
2. Include a reference to the discussion to tie it back to the participant's contributions or insights
3. Add a touch of humor or warmth that relates to the program's location or setting
4. Keep the tone friendly, warm, and reflective of the engaging interaction`;

// Predefined styles for agents
const AGENT_STYLES = {
  nuggets: [
    {
      id: 'professional',
      name: 'Professional & Clear',
      style: "Maintain a professional and clear tone while being approachable. Use structured sentences and occasional emojis to keep the conversation engaging but focused. Reference the program context naturally to create a personalized experience. Format responses with bullet points for clarity.",
    },
    {
      id: 'friendly',
      name: 'Friendly & Casual',
      style: "Keep the conversation warm and friendly, using a casual tone that puts participants at ease. Use emojis frequently 😊, share enthusiasm, and create a comfortable atmosphere. Make frequent references to the program context to maintain a personal connection. Structure information in an easy-to-read format.",
    },
    {
      id: 'academic',
      name: 'Academic & Formal',
      style: "Adopt a more formal, academic tone while remaining accessible. Use precise language and clear structure. Minimize emoji usage but maintain warmth through word choice. Reference the program context thoughtfully to create relevance. Present information in a structured, analytical format.",
    },
    {
      id: 'coach',
      name: 'Motivational Coach',
      style: "Take on an encouraging, coach-like tone that motivates participants. Use positive reinforcement and energetic language 💪. Include emojis strategically to boost motivation. Reference the program context to create meaningful connections. Structure responses to highlight progress and potential.",
    }
  ],
  lightbulbs: [
    {
      id: 'creative',
      name: 'Creative & Inspiring',
      style: "Foster creativity with an enthusiastic and imaginative tone. Use colorful language and inspiring emojis ✨. Reference the program context to spark innovative thinking. Structure responses to highlight creative possibilities and connections.",
    },
    {
      id: 'analytical',
      name: 'Analytical & Structured',
      style: "Balance creativity with analytical thinking. Use clear, structured language while maintaining an open mind to new ideas. Use emojis sparingly 🎯. Reference the program context to ground ideas in reality. Present information in a logical, step-by-step format.",
    },
    {
      id: 'collaborative',
      name: 'Collaborative & Supportive',
      style: "Create a collaborative atmosphere that encourages idea sharing. Use inclusive language and supportive emojis 🤝. Reference the program context to build shared understanding. Structure responses to highlight connections and build upon ideas.",
    },
    {
      id: 'visionary',
      name: 'Visionary & Forward-thinking',
      style: "Inspire big-picture thinking with a forward-looking tone. Use expansive language and aspirational emojis 🚀. Reference the program context to bridge present reality with future possibilities. Structure responses to emphasize potential impact and transformation.",
    }
  ]
};

// Default values for Nuggets prompt
const DEFAULT_NUGGETS_STYLE = "Maintain a professional and friendly tone to make participants feel comfortable and engaged. Use clear sentences, bullet points for clarity, and light emojis to keep the conversation approachable but professional. Reference the program context naturally throughout the conversation to maintain a personalized feel.";

const DEFAULT_NUGGETS_RULES = [
  "Assure participants that there information will remain confidential and used solely for identification purposes if they ask us to delete their workshop data.",
  "Sequential Flow:\n   - Ask each required question in order and proceed only after receiving a full response.",
  "Clarification:\n   - If a response is incomplete or unclear, ask for additional details politely before moving on.",
  "No Skipped Questions:\n   - All the required questions must be addressed without skipping or rephrasing unless necessary for clarity.",
  "End of Conversation:\n   - Conclude the conversation only after confirming that all responses are complete."
];

const DEFAULT_NUGGETS_QUESTIONS = [
  {
    id: '1',
    question: 'Problem and Opportunity:\n"What is the main problem or opportunity your business is addressing?"'
  },
  {
    id: '2',
    question: 'Unique Solution:\n"How does your solution stand out from others in the market?"'
  },
  {
    id: '3',
    question: 'Target Audience:\n"Who are your primary customers or users, and what do they value most?"'
  },
  {
    id: '4',
    question: 'Impact and Results:\n"What measurable impact have you achieved so far, or what are you aiming for?"'
  },
  {
    id: '5',
    question: 'Scalability and Vision:\n"How do you plan to scale this solution, and what is your long-term vision?"'
  }
];

// Default values for Lightbulbs prompt
const DEFAULT_LIGHTBULBS_STYLE = "Your tone should be professional, supportive, and attentive. Structure the conversation to promote clarity and ease, utilizing bullet points, well-organized steps, and supportive language. Add emojis as needed to make the interaction engaging and welcoming. Incorporate references to the program context to create a more personalized experience.";

const DEFAULT_LIGHTBULBS_RULES = [
  "Sequential Questioning: Follow the designated order for each question, only proceeding after receiving a complete response.",
  "Cross-Referencing: Ensure each response ties back to the 'nugget' that inspired the participant, prompting elaboration if connections aren't clear",
  "Clarification: Seek detailed clarifications when responses lack depth or completeness.",
  "Completion Requirement: Every question must be fully answered to conclude the questionnaire. Confirm all necessary details are captured for each response."
];

const DEFAULT_LIGHTBULBS_QUESTIONS = [
  {
    id: '1',
    question: 'Step 1: Inspiration Nugget Reference\n"Which nugget specifically inspired you? Could you briefly describe it?"\nObjective: "Identify the inspiration source to ensure a clear cross-reference between nuggets and insights."'
  },
  {
    id: '2',
    question: 'Step 2: Light Bulb Moment\n"What about this nugget inspired you to think, \'We could try this here\'?"\nObjective: "Capture what resonated with the participant, highlighting the motivational trigger."'
  },
  {
    id: '3',
    question: 'Step 4: From Inspiration to Action\n"What did this nugget inspire you to do? Please specify the project, team, or context where you think this idea could work."\nObjective: "Link inspiration to a concrete action plan or context for application."'
  },
  {
    id: '4',
    question: 'Step 5: Implementation Steps\n"What concrete steps will you take to bring this idea to life in your own context?"\nObjective: "Define specific, actionable steps, encouraging clear and practical strategies."'
  },
  {
    id: '5',
    question: 'Step 6: Timeline for Action\n"By when do you plan to test or implement this idea?"\nObjective: "Establish a timeline, prompting commitment to a timeframe."'
  },
  {
    id: '6',
    question: 'Step 7: Testing and Success Measures\n"How will you test this idea to see if it gains traction? What will success look like?"\nObjective: "Promote experimentation, defining success metrics for evaluation."'
  },
  {
    id: '7',
    question: 'Step 8: Challenges and Solutions\n"What potential challenges do you anticipate in implementing this idea, and how could you overcome them?"\nObjective: "Encourage proactive thinking about obstacles and solutions."'
  },
  {
    id: '8',
    question: 'Step 9: Long-Term Impact\n"If this idea works, what could the long-term impact be for your team or business unit?"\nObjective: "Have participants reflect on potential broader impacts and strategic alignment with Nexus goals."'
  }
];

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
  const router = useRouter();
  
  // Check for client-side rendering
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  
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
      variables.programContext = sessionConfig.programContext || '';
    } else if (activeAgentType === 'lightbulbs') {
      // Variables spécifiques à Lightbulbs
      variables.agentName = agent?.agentName || agentName;
      variables.programName = sessionConfig.title || '';
      variables.programContext = sessionConfig.programContext || '';
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
      if (variables.programContext) {
        updatedPrompt = updatedPrompt.replace(/\{programContext}/g, variables.programContext);
      }
    } else if (activeAgentType === 'lightbulbs') {
      if (variables.agentName) {
        updatedPrompt = updatedPrompt.replace(/\"AGENT NAME\"/g, `"${variables.agentName}"`);
      }
      if (variables.programName) {
        updatedPrompt = updatedPrompt.replace(/\"PRGRAMENAME\"/g, `"${variables.programName}"`);
      }
      if (variables.programContext) {
        updatedPrompt = updatedPrompt.replace(/\{programContext}/g, variables.programContext);
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

  // Function to copy the full prompt to clipboard
  const copyPromptToClipboard = () => {
    if (!isClient) return;
    
    const prompt = generateFullPrompt();
    
    navigator.clipboard.writeText(prompt)
      .then(() => {
        toast({
          title: "Prompt copied to clipboard!",
          description: "The full prompt has been copied to your clipboard.",
          variant: "default",
        });
      })
      .catch(err => {
        toast({
          title: "Failed to copy prompt",
          description: err.message,
          variant: "destructive",
        });
      });
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
    
    // State for prompt variables
    const [promptData, setPromptData] = useState({
      agentName: agent.agentName || agentName,
      programName: sessionConfig.title || '',
      teacherName: sessionConfig.teacherName || '',
      programContext: sessionConfig.programContext || '',
      style: activeAgentType === 'nuggets' ? DEFAULT_NUGGETS_STYLE : DEFAULT_LIGHTBULBS_STYLE,
      rules: activeAgentType === 'nuggets' ? DEFAULT_NUGGETS_RULES : DEFAULT_LIGHTBULBS_RULES,
      questions: activeAgentType === 'nuggets' ? DEFAULT_NUGGETS_QUESTIONS : DEFAULT_LIGHTBULBS_QUESTIONS,
      showRawPrompt: false,
      newRule: '',
      newQuestion: ''
    });
    
    // Function to update prompt data fields
    const updatePromptData = (field, value) => {
      setPromptData(prev => ({
        ...prev,
        [field]: value
      }));
    };
    
    // Function to add a new rule
    const addRule = () => {
      if (!promptData.newRule.trim()) return;
      setPromptData(prev => ({
        ...prev,
        rules: [...prev.rules, prev.newRule.trim()],
        newRule: ''
      }));
    };
    
    // Function to remove a rule
    const removeRule = (index) => {
      setPromptData(prev => ({
        ...prev,
        rules: prev.rules.filter((_, i) => i !== index)
      }));
    };
    
    // Function to update a rule
    const updateRule = (index, value) => {
      setPromptData(prev => ({
        ...prev,
        rules: prev.rules.map((rule, i) => i === index ? value : rule)
      }));
    };
    
    // Function to add a new question
    const addQuestion = () => {
      if (!promptData.newQuestion.trim()) return;
      setPromptData(prev => ({
        ...prev,
        questions: [
          ...prev.questions, 
          { 
            id: String(prev.questions.length + 1), 
            question: prev.newQuestion.trim()
          }
        ],
        newQuestion: ''
      }));
    };
    
    // Function to remove a question
    const removeQuestion = (id) => {
      setPromptData(prev => ({
        ...prev,
        questions: prev.questions.filter(q => q.id !== id)
      }));
    };
    
    // Function to update a question
    const updateQuestion = (id, value) => {
      setPromptData(prev => ({
        ...prev,
        questions: prev.questions.map(q => q.id === id ? { ...q, question: value } : q)
      }));
    };
    
    // Function to generate the full prompt
    const generateFullPrompt = () => {
      if (activeAgentType === 'nuggets') {
        let fullPrompt = NUGGETS_PROMPT_TEMPLATE;
        
        // Replace variables
        fullPrompt = fullPrompt
          .replace('{agentName}', promptData.agentName)
          .replace('{programName}', promptData.programName)
          .replace('{teacherName}', promptData.teacherName)
          .replace('{programContext}', promptData.programContext)
          .replace('{style}', promptData.style);
        
        // Format and replace rules
        const formattedRules = promptData.rules.map((rule, index) => `${index + 1}. ${rule}`).join('\n');
        fullPrompt = fullPrompt.replace('{rules}', formattedRules);
        
        // Format and replace questions
        const formattedQuestions = promptData.questions.map(q => q.question).join('\n\n');
        fullPrompt = fullPrompt.replace('{questions}', formattedQuestions);
        
        return fullPrompt;
      } else {
        // Lightbulbs prompt
        let fullPrompt = LIGHTBULBS_PROMPT_TEMPLATE;
        
        // Replace variables
        fullPrompt = fullPrompt
          .replace('{agentName}', promptData.agentName)
          .replace('{programName}', promptData.programName)
          .replace('{programContext}', promptData.programContext);
        
        // Replace style
        fullPrompt = fullPrompt.replace('{style}', promptData.style || DEFAULT_LIGHTBULBS_STYLE);
        
        // Format and replace rules
        const formattedRules = promptData.rules.map((rule, index) => `${index + 1}. ${rule}`).join('\n');
        fullPrompt = fullPrompt.replace('{rules}', formattedRules);
        
        // Format and replace questions (steps)
        const formattedQuestions = promptData.questions.map(q => q.question).join('\n\n');
        fullPrompt = fullPrompt.replace('{questions}', formattedQuestions);
        
        return fullPrompt;
      }
    };
    
    // Effect to update the agent prompt when promptData changes
    useEffect(() => {
      const generatedPrompt = generateFullPrompt();
      handleAgentChange('prompt', generatedPrompt);
    }, [promptData]);
    
    // Initialize the prompt data from the agent's prompt if it exists
    useEffect(() => {
      if (activeAgentType === 'nuggets') {
        setPromptData(prev => ({
          ...prev,
          agentName: agent.agentName || agentName,
          programName: sessionConfig.title || '',
          teacherName: sessionConfig.teacherName || '',
          programContext: sessionConfig.programContext || '',
          style: DEFAULT_NUGGETS_STYLE,
          rules: DEFAULT_NUGGETS_RULES,
          questions: DEFAULT_NUGGETS_QUESTIONS
        }));
      } else {
        setPromptData(prev => ({
          ...prev,
          agentName: agent.agentName || agentName,
          programName: sessionConfig.title || '',
          programContext: sessionConfig.programContext || '',
          style: DEFAULT_LIGHTBULBS_STYLE,
          rules: DEFAULT_LIGHTBULBS_RULES,
          questions: DEFAULT_LIGHTBULBS_QUESTIONS
        }));
      }
    }, [agent.prompt, activeAgentType, agent.agentName, agentName, sessionConfig.title, sessionConfig.teacherName, sessionConfig.programContext]);
    
    // Render the new UI with tabs for the structured prompt editor
    return (
      <div className="space-y-6">
        <div className={`bg-${primaryColor}-50 border-l-4 border-${primaryColor}-500 p-4 rounded-r-md mb-4`}>
          <h3 className={`font-semibold text-${primaryColor}-800 mb-2`}>Prompt Builder</h3>
          <p className={`text-${primaryColor}-700 text-sm`}>
            Configure the behavior and questions for agent {promptData.agentName || agentName}
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
                    value={promptData.agentName}
                    onChange={(e) => {
                      updatePromptData('agentName', e.target.value);
                      handleAgentChange('agentName', e.target.value);
                    }}
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
          
          {/* Basic Information */}
          <Card className="p-4 border-t-4 border-t-blue-500">
            <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Program Name
                  <span className="ml-1 text-xs text-white bg-blue-500 px-1.5 py-0.5 rounded-full">Required</span>
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  value={promptData.programName}
                  onChange={(e) => {
                    updatePromptData('programName', e.target.value);
                    updateSessionConfig({
                      ...sessionConfig,
                      title: e.target.value
                    });
                  }}
                  placeholder="Enter program name"
                />
                <p className="text-xs text-gray-500 mt-1">Displayed in the welcome message</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Program Context
                  <span className="ml-1 text-xs text-white bg-green-500 px-1.5 py-0.5 rounded-full">Recommended</span>
                </label>
                <textarea
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  value={promptData.programContext}
                  onChange={(e) => {
                    updatePromptData('programContext', e.target.value);
                    updateSessionConfig({
                      ...sessionConfig,
                      programContext: e.target.value
                    });
                  }}
                  placeholder="Ex: The program takes place in Fontainebleau, in the heart of the forest..."
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">These details will be used to personalize interactions</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Teacher Name
                  <span className="ml-1 text-xs text-white bg-blue-500 px-1.5 py-0.5 rounded-full">Required</span>
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  value={promptData.teacherName}
                  onChange={(e) => {
                    updatePromptData('teacherName', e.target.value);
                    updateSessionConfig({
                      ...sessionConfig,
                      teacherName: e.target.value
                    });
                  }}
                  placeholder="Enter teacher name"
                />
                <p className="text-xs text-gray-500 mt-1">Used in the closing message</p>
              </div>
            </div>
          </Card>

          {/* Controls Section */}
          <div className="flex justify-between items-center pt-4">
            <button 
              onClick={() => setPromptData({
                agentName: agent.agentName || agentName,
                programName: sessionConfig.title || '',
                teacherName: sessionConfig.teacherName || '',
                programContext: sessionConfig.programContext || '',
                style: DEFAULT_NUGGETS_STYLE,
                rules: DEFAULT_NUGGETS_RULES,
                questions: DEFAULT_NUGGETS_QUESTIONS,
                showRawPrompt: promptData.showRawPrompt,
                newRule: '',
                newQuestion: ''
              })}
              className="text-sm px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Reset
            </button>
            
            <button
              onClick={() => updatePromptData('showRawPrompt', true)}
              className="text-sm px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              View Complete Prompt
            </button>
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
      mode: 'book-only',
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
      {activeSection === "config" && previewMode && renderPreviewSection()}
    </div>
  );
};

export default AIInteractionConfig;