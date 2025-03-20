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
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';
import { AgentService } from '@/lib/services/agentService';
import { useSessionConfigStore } from '@/lib/store/sessionConfigStore';
import { debounce } from 'lodash';

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

// Styles prédéfinis pour les agents
const AGENT_STYLES = {
  nuggets: [
    {
      id: 'professional',
      name: 'Professionnel',
      style: "Maintain a professional and clear tone while being approachable. Use structured sentences and occasional emojis to keep the conversation engaging but focused. Reference the program context naturally to create a personalized experience. Format responses with bullet points for clarity.",
    },
    {
      id: 'friendly',
      name: 'Amical et Décontracté',
      style: "Keep the conversation warm and friendly, using a casual tone that puts participants at ease. Use emojis frequently 😊, share enthusiasm, and create a comfortable atmosphere. Make frequent references to the program context to maintain a personal connection. Structure information in an easy-to-read format.",
    },
    {
      id: 'academic',
      name: 'Académique',
      style: "Adopt a more formal, academic tone while remaining accessible. Use precise language and clear structure. Minimize emoji usage but maintain warmth through word choice. Reference the program context thoughtfully to create relevance. Present information in a structured, analytical format.",
    },
    {
      id: 'coach',
      name: 'Coach Motivant',
      style: "Take on an encouraging, coach-like tone that motivates participants. Use positive reinforcement and energetic language 💪. Include emojis strategically to boost motivation. Reference the program context to create meaningful connections. Structure responses to highlight progress and potential.",
    }
  ],
  lightbulbs: [
    {
      id: 'creative',
      name: 'Créatif et Inspirant',
      style: "Foster creativity with an enthusiastic and imaginative tone. Use colorful language and inspiring emojis ✨. Reference the program context to spark innovative thinking. Structure responses to highlight creative possibilities and connections.",
    },
    {
      id: 'analytical',
      name: 'Analytique et Structuré',
      style: "Balance creativity with analytical thinking. Use clear, structured language while maintaining an open mind to new ideas. Use emojis sparingly 🎯. Reference the program context to ground ideas in reality. Present information in a logical, step-by-step format.",
    },
    {
      id: 'collaborative',
      name: 'Collaboratif et Encourageant',
      style: "Create a collaborative atmosphere that encourages idea sharing. Use inclusive language and supportive emojis 🤝. Reference the program context to build shared understanding. Structure responses to highlight connections and build upon ideas.",
    },
    {
      id: 'visionary',
      name: 'Visionnaire',
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
  const { toast } = useToast();
  
  // Check for client-side rendering
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Utilisation du store pour l'état temporaire
  const { tempConfig, updateConfig, history, restoreFromHistory } = isClient ? useSessionConfigStore() : {
    tempConfig: null,
    updateConfig: () => {},
    history: [],
    restoreFromHistory: () => {}
  };
  
  // État pour le feedback de sauvegarde
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

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

  // Add configuration history support
  const [showHistory, setShowHistory] = useState(false);
  const [configHistory, setConfigHistory] = useState([]);

  // Optimized save function with local storage
  const saveSessionConfig = useCallback(async (config) => {
    setIsSaving(true);
    try {
      // Mettre à jour le store local
      updateConfig(config);
      
      setLastSaved(new Date());
      setIsSaving(false);
      
      toast({
        title: "Configuration sauvegardée",
        description: "Vos modifications ont été enregistrées localement.",
        variant: "default",
      });
      
      return true;
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder la configuration. Veuillez réessayer.",
        variant: "destructive",
      });
      setIsSaving(false);
      return false;
    }
  }, [updateConfig, toast]);

  // Load from local storage
  const loadSavedConfig = useCallback(() => {
    if (tempConfig) {
      updateSessionConfig(tempConfig);
      setLastSaved(new Date());
      
      toast({
        title: "Configuration chargée",
        description: "Les paramètres sauvegardés ont été restaurés.",
        variant: "default",
      });
    }
  }, [tempConfig, updateSessionConfig, toast]);

  // Load configuration history
  const loadConfigHistory = useCallback(() => {
    setConfigHistory(history);
  }, [history]);

  // Restore configuration from history
  const restoreConfiguration = useCallback((index) => {
    try {
      restoreFromHistory(index);
      loadSavedConfig();
      
      toast({
        title: "Configuration restaurée",
        description: "La configuration a été restaurée avec succès.",
        variant: "default",
      });
      
      setShowHistory(false);
    } catch (error) {
      console.error('Error restoring configuration:', error);
      toast({
        title: "Erreur",
        description: "Impossible de restaurer la configuration.",
        variant: "destructive",
      });
    }
  }, [restoreFromHistory, loadSavedConfig, toast]);

  // Update all handlers to use saveSessionConfig instead of updateSessionConfig
  const handleNuggetsChange = useCallback((field, value) => {
    saveSessionConfig({
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
  }, [sessionConfig, saveSessionConfig, ai_settings, nuggets]);

  const handleLightbulbsChange = useCallback((field, value) => {
    saveSessionConfig({
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
  }, [sessionConfig, saveSessionConfig, ai_settings, lightbulbs]);

  const handleNuggetsBookConfigChange = useCallback((bookConfig) => {
    saveSessionConfig({
      ...sessionConfig,
      settings: {
        ...sessionConfig.settings,
        ai_configuration: {
          ...ai_settings,
          nuggets: {
            ...nuggets,
            bookConfig: {
              ...bookConfig,
              id: 'nuggets-book'
            }
          }
        }
      }
    });
  }, [sessionConfig, saveSessionConfig, ai_settings, nuggets]);

  const handleLightbulbsBookConfigChange = useCallback((bookConfig) => {
    saveSessionConfig({
      ...sessionConfig,
      settings: {
        ...sessionConfig.settings,
        ai_configuration: {
          ...ai_settings,
          lightbulbs: {
            ...lightbulbs,
            bookConfig: {
              ...bookConfig,
              id: 'lightbulbs-book'
            }
          }
        }
      }
    });
  }, [sessionConfig, saveSessionConfig, ai_settings, lightbulbs]);

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
    
    saveSessionConfig(updatedConfig);
    
    // Notify parent component if callback provided (for flow map updates)
    if (onAnalysisOrderChange) {
      onAnalysisOrderChange(newItems);
    }
  }, [sessionConfig, saveSessionConfig, onAnalysisOrderChange]);

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
    const agent = activeAgentType === 'nuggets' ? nuggets : lightbulbs;
    const handleAgentChange = activeAgentType === 'nuggets' ? handleNuggetsChange : handleLightbulbsChange;
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
    }, [promptData.style, promptData.rules, promptData.questions, promptData.agentName, promptData.programName, promptData.teacherName, promptData.programContext]);
    
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
          <h3 className={`font-semibold text-${primaryColor}-800 mb-2`}>Configuration of {activeAgentType === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'}</h3>
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
          
          {/* Agent prompt builder */}
          <div className="w-full md:w-2/3">
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                    </svg>
                    Éditeur de Prompt
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Configurez le comportement et les questions de l'agent {promptData.agentName || agentName}
                      </p>
                    </div>
                <div className="flex space-x-2">
                              <button
                    onClick={() => updatePromptData('showRawPrompt', !promptData.showRawPrompt)}
                    className={`text-sm px-3 py-2 rounded border flex items-center hover:bg-gray-50`}
                              >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                    {promptData.showRawPrompt ? "Retour à l'éditeur" : "Voir le prompt complet"}
                              </button>
                          <button
                    onClick={copyPromptToClipboard}
                    disabled={!isClient}
                    className={`text-sm px-3 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                      <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                            </svg>
                    Copier le prompt
                          </button>
                        </div>
                      </div>
                      
              {promptData.showRawPrompt ? (
                <div className="mb-4">
                  <div className="bg-gray-50 p-4 rounded-md mb-4 border-l-4 border-blue-500">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Prompt complet généré
                    </h4>
                    <p className="text-sm text-gray-600">
                      Ce prompt est généré automatiquement à partir des informations que vous avez saisies. 
                      Vous pouvez le copier pour l'utiliser ailleurs ou revenir à l'éditeur structuré pour continuer à le personnaliser.
                    </p>
                  </div>
                  
                  <div className="relative">
                              <textarea
                      className="w-full h-96 p-3 font-mono text-sm border rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
                      value={generateFullPrompt()}
                                readOnly
                    ></textarea>
                    
                    <div className="absolute right-2 top-2 flex space-x-2">
                              <button
                        onClick={copyPromptToClipboard}
                        disabled={!isClient}
                        className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center"
                        title="Copier le prompt"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                </svg>
                        Copier
                              </button>
                      
                          <button
                        onClick={() => updatePromptData('showRawPrompt', false)}
                        className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center"
                        title="Retourner à l'éditeur"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                        Retour à l'éditeur
                          </button>
                        </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                      <h5 className="font-medium text-blue-800 mb-1 text-sm">Comment utiliser ce prompt?</h5>
                      <p className="text-xs text-blue-700">
                        Ce prompt définit le comportement et les questions que l'agent IA posera aux participants. 
                        Vous pouvez le copier et l'utiliser comme base pour d'autres agents similaires.
                        </p>
                      </div>
                    
                    <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                      <h5 className="font-medium text-amber-800 mb-1 text-sm">Structure du prompt</h5>
                      <p className="text-xs text-amber-700">
                        Le prompt est divisé en sections: Objectif, Style, Règles et Exemple d'interaction. 
                        Chaque section influence différents aspects du comportement de l'agent.
                      </p>
                    </div>
                </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Program and Teacher Names */}
                  <Card className="p-4 border-t-4 border-t-blue-500">
                    <h4 className="font-medium text-gray-900 mb-3">Informations de base</h4>
                    <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          Nom du programme
                          <span className="ml-1 text-xs text-white bg-blue-500 px-1.5 py-0.5 rounded-full">Obligatoire</span>
                      </label>
                      <input
                        type="text"
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                          value={promptData.programName}
                        onChange={(e) => {
                            updatePromptData('programName', e.target.value);
                            // Also update the session config
                          saveSessionConfig({
                            ...sessionConfig,
                            title: e.target.value
                          });
                        }}
                          placeholder="Entrez le nom du programme"
                      />
                        <p className="text-xs text-gray-500 mt-1">Affiché dans le message d'accueil</p>
                    </div>
                    
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          Contexte du programme
                          <span className="ml-1 text-xs text-white bg-green-500 px-1.5 py-0.5 rounded-full">Recommandé</span>
                        </label>
                        <textarea
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                          value={promptData.programContext}
                          onChange={(e) => {
                            updatePromptData('programContext', e.target.value);
                            // Also update the session config
                            saveSessionConfig({
                              ...sessionConfig,
                              programContext: e.target.value
                            });
                          }}
                          placeholder="Ex: Le programme se déroule à Fontainebleau, au cœur de la forêt..."
                          rows={3}
                        />
                        <p className="text-xs text-gray-500 mt-1">Ces détails seront utilisés pour personnaliser les interactions</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          Nom du formateur
                          <span className="ml-1 text-xs text-white bg-blue-500 px-1.5 py-0.5 rounded-full">Obligatoire</span>
                        </label>
                        <input
                          type="text"
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                          value={promptData.teacherName}
                          onChange={(e) => {
                            updatePromptData('teacherName', e.target.value);
                            // Also update the session config
                            saveSessionConfig({
                              ...sessionConfig,
                              teacherName: e.target.value
                            });
                          }}
                          placeholder="Entrez le nom du formateur"
                        />
                        <p className="text-xs text-gray-500 mt-1">Utilisé dans le message de conclusion</p>
                      </div>
                  </div>
                  </Card>
                  
                  {/* Agent Style */}
                  <Card className="p-4 border-t-4 border-t-green-500">
                    <h4 className="font-medium text-gray-900 mb-3">Style de l'agent</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Choisissez un style prédéfini</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {AGENT_STYLES[activeAgentType].map((styleOption) => (
                          <div
                            key={styleOption.id}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              promptData.style === styleOption.style
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-green-300'
                            }`}
                            onClick={() => updatePromptData('style', styleOption.style)}
                          >
                            <h5 className="font-medium text-gray-900 mb-1">{styleOption.name}</h5>
                            <p className="text-sm text-gray-600">{styleOption.style.substring(0, 100)}...</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                          Personnaliser le style
                          <span className="ml-2 text-xs text-gray-500">(optionnel)</span>
                      </label>
                        <div className="mb-2 p-2 bg-green-50 rounded text-xs text-green-800">
                          <p className="font-medium">Conseil:</p>
                          <p>Vous pouvez personnaliser le style en modifiant directement le texte ci-dessous. N'oubliez pas d'inclure des indications sur l'utilisation des emojis et les références au contexte.</p>
                        </div>
                        <textarea
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                          value={promptData.style}
                          onChange={(e) => updatePromptData('style', e.target.value)}
                          rows={4}
                          placeholder="Personnalisez le style de communication de l'agent..."
                        ></textarea>
                      </div>
                    </div>
                  </Card>
                  
                  {/* Rules Section */}
                  <Card className="p-4 border-t-4 border-t-amber-500">
                    <h4 className="font-medium text-gray-900 mb-3">Règles de conversation</h4>
                    <div>
                      <div className="mb-2 p-2 bg-amber-50 rounded text-xs text-amber-800">
                        <p className="font-medium">À quoi servent les règles:</p>
                        <p>Les règles définissent comment l'agent doit mener la conversation (ex: ordre des questions, gestion des réponses incomplètes, conditions de fin...).</p>
                      </div>
                      
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-gray-700">Liste des règles</label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            className="text-sm p-2 border rounded w-64"
                            value={promptData.newRule}
                            onChange={(e) => updatePromptData('newRule', e.target.value)}
                            placeholder="Nouvelle règle..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && promptData.newRule.trim()) {
                                addRule();
                              }
                            }}
                          />
                          <button 
                            onClick={addRule}
                            disabled={!promptData.newRule.trim()}
                            className="text-sm px-3 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Ajouter
                          </button>
                        </div>
                    </div>
                    
                      <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded bg-white">
                        {promptData.rules.length === 0 ? (
                          <div className="text-center p-4 text-sm text-gray-500">
                            Aucune règle définie. Ajoutez des règles pour guider le comportement de l'agent.
                          </div>
                        ) : (
                          promptData.rules.map((rule, index) => (
                            <div key={index} className="relative p-3 border border-amber-200 rounded-md group hover:border-amber-400 bg-white shadow-sm">
                              <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => removeRule(index)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Supprimer cette règle"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                              <span className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full mb-2">Règle {index + 1}</span>
                              <textarea
                                className="w-full p-2 border-none focus:ring-1 focus:ring-amber-300 bg-white text-sm rounded-md"
                                value={rule}
                                onChange={(e) => updateRule(index, e.target.value)}
                                rows={2}
                              ></textarea>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </Card>
                  
                  {/* Questions Section */}
                  <Card className="p-4 border-t-4 border-t-purple-500">
                    <h4 className="font-medium text-gray-900 mb-3">Questions à poser</h4>
                    <div>
                      <div className="mb-2 p-2 bg-purple-50 rounded text-xs text-purple-800">
                        <p className="font-medium">Structure des questions:</p>
                        <p>Chaque question doit comporter un titre court suivi du texte complet. Exemple: "Objectif: Quel est l'objectif principal de votre entreprise ?"</p>
                      </div>
                      
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-gray-700">Liste des questions</label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            className="text-sm p-2 border rounded w-64"
                            value={promptData.newQuestion}
                            onChange={(e) => updatePromptData('newQuestion', e.target.value)}
                            placeholder="Nouvelle question..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && promptData.newQuestion.trim()) {
                                addQuestion();
                              }
                            }}
                          />
                          <button 
                            onClick={addQuestion}
                            disabled={!promptData.newQuestion.trim()}
                            className="text-sm px-3 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Ajouter
                          </button>
                    </div>
                  </div>
                      
                      <div className="space-y-3 max-h-80 overflow-y-auto p-2 border rounded bg-white">
                        {promptData.questions.length === 0 ? (
                          <div className="text-center p-4 text-sm text-gray-500">
                            Aucune question définie. Ajoutez des questions pour que l'agent puisse interagir avec les participants.
                </div>
                        ) : (
                          promptData.questions.map((q) => (
                            <div key={q.id} className="relative p-3 border border-purple-200 rounded-md group hover:border-purple-400 bg-white shadow-sm">
                              <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => removeQuestion(q.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Supprimer cette question"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                              <div className="flex items-center mb-2">
                                <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mr-2">{q.id}</span>
                                <span className="text-xs text-gray-500">Question</span>
                              </div>
                              <textarea
                                className="w-full p-2 border-none focus:ring-1 focus:ring-purple-300 bg-white text-sm rounded-md"
                                value={q.question}
                                onChange={(e) => updateQuestion(q.id, e.target.value)}
                                rows={3}
                              ></textarea>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {promptData.questions.length > 0 && (
                        <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                          <span>{promptData.questions.length} question(s) configurée(s)</span>
                          <span>Faites glisser pour réorganiser (bientôt disponible)</span>
                        </div>
                      )}
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
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110 2H5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Réinitialiser
                    </button>
                    
                    <button
                      onClick={() => updatePromptData('showRawPrompt', true)}
                      className="text-sm px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      Voir le prompt complet
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // Render agent analysis section
  const renderAgentAnalysisSection = () => {
    const agent = activeAgentType === 'nuggets' ? nuggets : lightbulbs;
    const handleAgentChange = activeAgentType === 'nuggets' ? handleNuggetsChange : handleLightbulbsChange;
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
    const currentAgent = activeAgentType === 'nuggets' ? nuggets : lightbulbs;
    const bookConfigProps = {
      initialConfig: {
        agentName: currentAgent.agentName,
        programName: sessionConfig.title || '',
        teacherName: sessionConfig.teacherName || '',
        customRules: [],
        customQuestions: [],
        analysisConfig: {
          themes: [],
          keywordsPerTheme: {},
          sentimentAnalysis: true,
          extractKeyInsights: true
        },
        bookConfig: {
          ...(activeAgentType === 'nuggets' 
            ? (nuggets.bookConfig || { sections: [], visualStyle: {}, id: 'nuggets-book' }) 
            : (lightbulbs.bookConfig || { sections: [], visualStyle: {}, id: 'lightbulbs-book' })),
          id: activeAgentType === 'nuggets' ? 'nuggets-book' : 'lightbulbs-book'
        }
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

  // Effect to ensure book configurations remain separate
  useEffect(() => {
    if (nuggets.bookConfig?.id === 'lightbulbs-book') {
      // Fix nuggets book config if it was accidentally set to lightbulbs
      handleNuggetsBookConfigChange({ 
        ...nuggets.bookConfig, 
        id: 'nuggets-book' 
      });
    }
    if (lightbulbs.bookConfig?.id === 'nuggets-book') {
      // Fix lightbulbs book config if it was accidentally set to nuggets
      handleLightbulbsBookConfigChange({ 
        ...lightbulbs.bookConfig, 
        id: 'lightbulbs-book' 
      });
    }
  }, [nuggets.bookConfig, lightbulbs.bookConfig]);

  // Load saved configuration on mount and when switching agents
  useEffect(() => {
    loadSavedConfig();
  }, [loadSavedConfig, currentStep]);

  // Add validation before navigation
  const handleNavigation = useCallback(async () => {
    if (isSaving) return; // Prevent multiple saves
    
    const saved = await saveSessionConfig(sessionConfig);
    if (!saved) {
      // Show confirmation dialog if save failed
      const shouldProceed = window.confirm(
        "La sauvegarde de la configuration a échoué. Voulez-vous quand même quitter la page ?"
      );
      if (!shouldProceed) {
        // Prevent navigation
        window.history.pushState(null, '', window.location.href);
      }
    }
  }, [isSaving, saveSessionConfig, sessionConfig]);

  // Add navigation confirmation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isSaving) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSaving]);

  // Add history button to the UI
  const renderHistoryButton = () => (
    <button
      onClick={() => {
        setShowHistory(true);
        loadConfigHistory();
      }}
      className={`ml-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${primaryColor}-500`}
    >
      Historique
    </button>
  );

  // Add history modal
  const renderHistoryModal = () => (
    showHistory && (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Historique des configurations</h3>
          
          <div className="max-h-96 overflow-y-auto">
            {configHistory.map((item, index) => (
              <div key={index} className="border-b border-gray-200 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">
                      Modifié le : {new Date(item.updated_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Créé le : {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => restoreConfiguration(item.updated_at)}
                    className={`px-4 py-2 text-sm font-medium text-white bg-${primaryColor}-600 rounded-md hover:bg-${primaryColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${primaryColor}-500`}
                  >
                    Restaurer
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowHistory(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    )
  );

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
      {/* Add history button next to the tabs */}
      <div className="flex items-center justify-between">
        <Tabs defaultValue={activeSection} value={activeSection} onValueChange={setActiveSection}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="config">Agent Configuration</TabsTrigger>
            <TabsTrigger value="analysis">Analysis Configuration</TabsTrigger>
            <TabsTrigger value="book">Book</TabsTrigger>
          </TabsList>
        </Tabs>
        {renderHistoryButton()}
      </div>
      
      {/* Rest of the existing UI */}
      <TabsContent value="config">
        {renderAgentConfigSection()}
      </TabsContent>
      
      <TabsContent value="analysis">
        {renderAgentAnalysisSection()}
      </TabsContent>
      
      <TabsContent value="book">
        {renderBookConfigSection()}
      </TabsContent>
      
      {/* Preview Section */}
      {activeSection === "config" && previewMode && renderPreviewSection()}

      {/* History Modal */}
      {renderHistoryModal()}

      {/* SaveStatusIndicator */}
      <SaveStatusIndicator isSaving={isSaving} lastSaved={lastSaved} />
    </div>
  );
};

// SaveStatusIndicator component
const SaveStatusIndicator = ({ isSaving, lastSaved }) => (
  <div className="fixed bottom-4 right-4 flex items-center space-x-2 bg-white rounded-lg shadow-lg p-3 z-50">
    {isSaving ? (
      <>
        <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm text-gray-600">Sauvegarde en cours...</span>
      </>
    ) : lastSaved ? (
      <>
        <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-sm text-gray-600">
          Dernière sauvegarde : {new Date(lastSaved).toLocaleTimeString()}
        </span>
      </>
    ) : null}
  </div>
);

export default AIInteractionConfig;