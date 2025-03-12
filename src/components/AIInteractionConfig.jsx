import React, { useState, useEffect } from 'react';
import Input from './Input';
import Checkbox from './Checkbox';
import NumberInput from './NumberInput';
import NexusAIJournalist from './NexusAIJournalist';
import FinalAnalysisConfig from './FinalAnalysisConfig';

// Import our new AI Nuggets prompt configuration
import { AI_NUGGETS_PROMPT, DEFAULT_AI_NUGGETS_CONFIG } from '../lib/prompts';

// Import useStore to access user profile
import { useStore } from '../lib/store';

/**
 * AIInteractionConfig Component
 * 
 * Configuration for the AI interaction phase:
 * - AI Nuggets for top-voted participants (mandatory)
 * - AI Lightbulbs for participants who choose to discuss (optional)
 * - Book generation settings for both agents
 */
const AIInteractionConfig = ({ sessionConfig = {}, updateSessionConfig, mode = "standard" }) => {
  // State for collapsible sections
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [showBookConfig, setShowBookConfig] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [bookPreviewOpen, setBookPreviewOpen] = useState(false);
  const [showFinalAnalysisConfig, setShowFinalAnalysisConfig] = useState(false);
  
  // State for final analysis configuration
  const [analysisItems, setAnalysisItems] = useState(
    sessionConfig.analysisConfiguration?.items || [
      { id: 'nuggets-analysis', type: 'nuggets', enabled: true, title: 'Nuggets Analysis' },
      { id: 'lightbulbs-analysis', type: 'lightbulbs', enabled: true, title: 'Lightbulbs Analysis' },
      { id: 'overall-analysis', type: 'overall', enabled: true, title: 'Overall Analysis' }
    ]
  );
  
  // Simplified function to move an item up in the list
  const moveItemUp = (id) => {
    const index = analysisItems.findIndex(item => item.id === id);
    if (index <= 0) return; // Already at the top
    
    const newItems = [...analysisItems];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    
    setAnalysisItems(newItems);
    updateSessionConfig({
      ...sessionConfig,
      analysisConfiguration: {
        ...sessionConfig.analysisConfiguration,
        items: newItems
      }
    });
  };
  
  // Simplified function to move an item down in the list
  const moveItemDown = (id) => {
    const index = analysisItems.findIndex(item => item.id === id);
    if (index >= analysisItems.length - 1) return; // Already at the bottom
    
    const newItems = [...analysisItems];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    
    setAnalysisItems(newItems);
    updateSessionConfig({
      ...sessionConfig,
      analysisConfiguration: {
        ...sessionConfig.analysisConfiguration,
        items: newItems
      }
    });
  };
  
  // Toggle analysis item enabled/disabled
  const toggleAnalysisItem = (id) => {
    const newItems = analysisItems.map(item => 
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    
    setAnalysisItems(newItems);
    updateSessionConfig({
      ...sessionConfig,
      analysisConfiguration: {
        ...sessionConfig.analysisConfiguration,
        items: newItems
      }
    });
  };
  
  // Default configuration values
  const defaultNuggetsPromptConfig = {
    agentName: DEFAULT_AI_NUGGETS_CONFIG.agentName,
    programName: DEFAULT_AI_NUGGETS_CONFIG.programName,
    teacherName: DEFAULT_AI_NUGGETS_CONFIG.teacherName,
    location: "",
    venue: "",
    agentPersonality: "conversational, curious and journalistic",
    rules: [
      "Acknowledge Selection: Begin by congratulating the participant for being selected by their peers for their interesting story, making them feel valued.",
      "Sequential Storytelling: Guide participants through sharing their story chronologically, asking follow-up questions for clarity.",
      "Business Focus: While allowing natural storytelling, direct questions toward business challenges, solutions, and insights.",
      "Deep Diving: When participants mention interesting business points, probe deeper with follow-up questions.",
      "Complete Picture: Ensure all key aspects of their business story are covered: origin, challenges, solutions, results, and learnings.",
      "Confidentiality Assurance: Reassure participants that their information will be used responsibly within the program context.",
      "Synthesis Support: Periodically summarize key points to validate understanding and help the participant refine their story."
    ],
    questions: [
      {
        title: "Origin Story",
        question: "What inspired you to start this business journey? What problem or opportunity did you initially identify?"
      },
      {
        title: "Challenge & Solution",
        question: "What was the biggest challenge you faced, and how did you overcome it? What made your approach unique?"
      },
      {
        title: "Market & Customer Insights",
        question: "What have you learned about your market and customers that others might not realize?"
      },
      {
        title: "Business Model Evolution",
        question: "How has your business model or approach evolved since you started? What prompted these changes?"
      },
      {
        title: "Key Learnings",
        question: "What's the most valuable business lesson from your experience that could benefit others in the room?"
      },
      {
        title: "Future Vision",
        question: "Where do you see this journey taking you next? What's your vision for growth or impact?"
      }
    ]
  };
  
  // Mettre à jour le defaultLightbulbsPromptConfig pour utiliser le nouveau format
  const defaultLightbulbsPromptConfig = {
    agentName: "LightBulb Agent",
    programName: "Workshop",
    location: "Annecy",
    venue: "Palace de Menthon",
    agentPersonality: "professional, supportive, attentive",
    rules: [
      "Sequential Questioning: Follow the designated order for each question, only proceeding after receiving a complete response.",
      "Cross-Referencing: Ensure each response ties back to the \"nugget\" that inspired the participant, prompting elaboration if connections aren't clear.",
      "Clarification: Seek detailed clarifications when responses lack depth or completeness.",
      "Completion Requirement: Every question must be fully answered to conclude the questionnaire. Confirm all necessary details are captured for each response."
    ],
    questions: [
      {
        title: "Inspiration Nugget Reference",
        question: "Which nugget specifically inspired you? Could you briefly describe it?",
        objective: "Identify the inspiration source to ensure a clear cross-reference between nuggets and insights."
      },
      {
        title: "Light Bulb Moment",
        question: "What about this nugget inspired you to think, 'We could try this here'?",
        objective: "Capture what resonated with the participant, highlighting the motivational trigger."
      },
      {
        title: "From Inspiration to Action",
        question: "What did this nugget inspire you to do? Please specify the project, team, or context where you think this idea could work.",
        objective: "Link inspiration to a concrete action plan or context for application."
      },
      {
        title: "Implementation Steps",
        question: "What concrete steps will you take to bring this idea to life in your own context?",
        objective: "Define specific, actionable steps, encouraging clear and practical strategies."
      },
      {
        title: "Timeline for Action",
        question: "By when do you plan to test or implement this idea?",
        objective: "Establish a timeline, prompting commitment to a timeframe."
      },
      {
        title: "Testing and Success Measures",
        question: "How will you test this idea to see if it gains traction? What will success look like?",
        objective: "Promote experimentation, defining success metrics for evaluation."
      },
      {
        title: "Challenges and Solutions",
        question: "What potential challenges do you anticipate in implementing this idea, and how could you overcome them?",
        objective: "Encourage proactive thinking about obstacles and solutions."
      },
      {
        title: "Long-Term Impact",
        question: "If this idea works, what could the long-term impact be for your team or business unit?",
        objective: "Have participants reflect on potential broader impacts and strategic alignment with Nexus goals."
      }
    ]
  };
  
  // Local state for form values
  const [localConfig, setLocalConfig] = useState({
    agentName: "",
    programName: "",
    teacherName: "",
    location: "",
    venue: "",
    agentPersonality: "",
    // ... other fields
  });

  // Validation state
  const [validationState, setValidationState] = useState({
    agentName: { isValid: true, message: '' },
    programName: { isValid: true, message: '' },
    teacherName: { isValid: true, message: '' },
    location: { isValid: true, message: '' },
    venue: { isValid: true, message: '' },
    agentPersonality: { isValid: true, message: '' }
  });
  
  // Inside component, add this near the other useState declarations
  const { userProfile } = useStore();
  
  // Initialize local config once when component mounts or when sessionConfig changes
  useEffect(() => {
    // Initialize with default values
    const initialConfig = {
      // Always start with the default AI Nuggets config
      ...defaultNuggetsPromptConfig
    };
    
    // Auto-populate teacherName from user profile if available
    if (userProfile && userProfile.full_name) {
      initialConfig.teacherName = userProfile.full_name;
    }
    
    // If there's saved config, use it, but ensure we have all required fields
    if (sessionConfig && sessionConfig.nuggetsPromptConfig) {
      Object.assign(initialConfig, {
        ...sessionConfig.nuggetsPromptConfig,
        // Ensure arrays are never undefined
        rules: sessionConfig.nuggetsPromptConfig.rules || defaultNuggetsPromptConfig.rules,
        questions: sessionConfig.nuggetsPromptConfig.questions || defaultNuggetsPromptConfig.questions
      });
    }
    
    // Set the local config with these properly initialized values
    setLocalConfig(initialConfig);

    // Initialize lightbulbs config if we're in lightbulb mode
    if (mode === "lightbulb" && sessionConfig && sessionConfig.lightbulbsPromptConfig) {
      setLocalConfig({
        ...defaultLightbulbsPromptConfig,
        ...sessionConfig.lightbulbsPromptConfig,
        // Ensure arrays are never undefined
        rules: sessionConfig.lightbulbsPromptConfig.rules || defaultLightbulbsPromptConfig.rules,
        questions: sessionConfig.lightbulbsPromptConfig.questions || defaultLightbulbsPromptConfig.questions
      });
    }
  }, [sessionConfig, mode, userProfile]);
  
  // Add useEffect to ensure rules and questions are initialized
  useEffect(() => {
    // Ensure rules are properly initialized
    if (!localConfig.rules || localConfig.rules.length === 0) {
      setLocalConfig(prev => ({
        ...prev,
        rules: defaultNuggetsPromptConfig.rules
      }));
    }
    
    // Ensure questions are properly initialized
    if (!localConfig.questions || localConfig.questions.length === 0) {
      setLocalConfig(prev => ({
        ...prev,
        questions: defaultNuggetsPromptConfig.questions
      }));
    }
  }, [localConfig.rules, localConfig.questions]);
  
  const {
    // AI Nuggets (mandatory for top-voted participants)
    enableTopVotedInteraction = true,
    topVotedPrompt = "Tell me more about this insight. What emotions did you experience?",
    
    // AI Lightbulbs (optional for participants who choose to discuss)
    enableIdeaSharingInteraction = mode === "lightbulb" ? false : true,
    ideaSharingPrompt = "What idea did you have while listening to others' stories? How is it inspiring?",
    
    // Questionnaire AI Journalist (Nexus X Insead)
    enableQuestionnaireInteraction = true,
    questionnaireConfig = {
      agentName: "Elias",
      targetQuestions: "Nexus X Insead questionnaire",
      companyName: "Nexus",
      previousNuggets: "previously discussed insight and connections",
      requiredStructure: "ensure structure and clarity",
      identityAttributes: "french, energetic, a journalist"
    },
    
    // Book Generation
    enableBookGeneration = true,
    bookGenerationTime = 60, // seconds
    
    // AI Settings
    showGeneratedBooksToAll = true,
    aiResponseTime = 120, // Always set to maximum
    
    // Timer Settings
    hasAIInteractionTimer = false,
    aiInteractionDuration = 300, // 5 minutes
    
    // Prompts
    nuggetsPrompt = "Which nugget specifically inspired you? Could you briefly describe it?",
    lightBulbsPrompt = "What idea did you have while listening to others' stories? How is it inspiring?",
    
    // Book settings
    nuggetsBookTitle = "Insights Collection",
    lightBulbsBookTitle = "Ideas Collection",
    nuggetsBookColor = "#4F46E5", // Indigo
    lightBulbsBookColor = "#F59E0B", // Amber
    includeParticipantInfo = true,
    bookImageStyle = "watercolor",
    bookLayout = "magazine",
    bookCover = "minimal",
    bookImagePrompt = "",
    generateBookCoverImage = true,

    // Advanced prompt settings for AI Nuggets
    nuggetsPromptConfig = defaultNuggetsPromptConfig,
    
    // Analysis configuration
    analysisConfiguration = {
      includeParticipantNames: true,
      includeQuotesInAnalysis: true,
      generateKeyInsights: true,
      analysisGenerationTime: 60
    }
  } = sessionConfig;

  const handleChange = (field, value) => {
    updateSessionConfig({
      ...sessionConfig,
      [field]: value
    });
  };

  const handleQuestionnaireConfigChange = (newConfig) => {
    updateSessionConfig({
      ...sessionConfig,
      questionnaireConfig: newConfig
    });
  };

  // Add a state to track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Mise à jour de la fonction handleLocalChange pour garantir qu'elle ne provoque pas de validation ni de perte de focus
  const handleLocalChange = (field, value) => {
    // Mise à jour de la configuration locale sans aucune validation
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Indiquer qu'il y a des modifications non enregistrées
    setHasUnsavedChanges(true);
  };

  // Simplifier la fonction de validation pour qu'elle soit rapide et synchrone
  const validateField = (field, value) => {
    // Ne pas valider les champs vides sauf s'ils sont requis
    if (!value || value.trim() === '') {
      return { isValid: true, message: '' };
    }

    let isValid = true;
    let message = '';

    switch (field) {
      case 'agentName':
        isValid = value.length >= 2;
        message = isValid ? '' : 'Le nom de l\'agent doit contenir au moins 2 caractères';
        break;
      case 'programName':
        isValid = value.length >= 3;
        message = isValid ? '' : 'Le nom du programme doit contenir au moins 3 caractères';
        break;
      default:
        return { isValid: true, message: '' };
    }

    return { isValid, message };
  };

  // Simplifier applyChanges pour éviter les appels asynchrones inutiles
  const applyChanges = () => {
    const fields = ['agentName', 'programName', 'teacherName', 'location', 'venue', 'agentPersonality'];
    let isValid = true;
    const newValidationState = {};

    // Valider tous les champs lors de la soumission (de manière synchrone)
    fields.forEach(field => {
      const result = validateField(field, localConfig[field]);
      newValidationState[field] = result;
      if (!result.isValid) isValid = false;
    });

    setValidationState(newValidationState);

    if (isValid) {
      updateSessionConfig({
        ...sessionConfig,
        nuggetsPromptConfig: {
          ...localConfig,
          rules: localConfig.rules || defaultNuggetsPromptConfig.rules,
          questions: localConfig.questions || defaultNuggetsPromptConfig.questions
        }
      });
      
      // Réinitialiser le drapeau de modifications non enregistrées
      setHasUnsavedChanges(false);
      
      // Afficher un message de succès
      alert("Configuration AI enregistrée avec succès !");
      return true;
    }
    return false;
  };

  // Generate the complete prompt based on the template and configuration
  const generateCompleteNuggetsPrompt = () => {
    // Ensure we always have a valid config with required properties
    const config = {
      ...defaultNuggetsPromptConfig,
      ...(localConfig || {}),
      rules: (localConfig && localConfig.rules) || defaultNuggetsPromptConfig.rules,
      questions: (localConfig && localConfig.questions) || defaultNuggetsPromptConfig.questions
    };
    
    // Use the imported AI_NUGGETS_PROMPT as the base template
    let prompt = AI_NUGGETS_PROMPT;
    
    // Replace template variables
    prompt = prompt.replace(/\{programName\}/g, config.programName || "Workshop");
    prompt = prompt.replace(/\{teacherName\}/g, config.teacherName || "the facilitator");
    
    // If agentName is provided, customize the agent name in the introduction
    if (config.agentName && config.agentName !== DEFAULT_AI_NUGGETS_CONFIG.agentName) {
      prompt = prompt.replace(
        "I'm AI Nuggets, your AI Journalist",
        `I'm ${config.agentName}, your AI Journalist`
      );
    }
    
    // For advanced configuration, we could override the rules and questions sections here
    
    return prompt;
  };

  // Generate the complete prompt based on the template and configuration for Lightbulbs
  const generateCompleteLightbulbsPrompt = () => {
    // Ensure we always have a valid config with required properties
    const config = {
      ...defaultLightbulbsPromptConfig,
      ...(localConfig || {}),
      rules: (localConfig && localConfig.rules) || defaultLightbulbsPromptConfig.rules,
      questions: (localConfig && localConfig.questions) || defaultLightbulbsPromptConfig.questions
    };
    
    // Build the prompt using the updated format based on the user-provided template
    return `You are a dedicated support agent named "${config.agentName || "AI LightBulb"}" responsible for conducting the "${config.programName || "Workshop"}" "Final Light Bulb Questionnaire." Your objective is to guide each participant through every mandatory question, ensuring responses are complete, detailed, and reflect the transition from inspiration to action within the "Nexus" framework. Use cross-referencing to link responses to previously identified nuggets where relevant, and maintain focus on actionable plans and future impact.

Style:

Your tone should be ${config.agentPersonality || "professional, supportive, and attentive"}. Structure the conversation to promote clarity and ease, utilizing bullet points, well-organized steps, and supportive language. Add emojis as needed to make the interaction engaging and welcoming.

Rules:
${config.rules.map((rule, index) => `${index + 1}. ${rule}`).join('\n')}

Steps:
${config.questions.map((q, index) => `
Step ${index + 1}: ${q.title}
• Required Question: "${q.question}"
• Objective: "${q.objective || "Gather detailed information for this step."}"
`).join('\n')}

Closing the Discussion:

After confirming all responses are complete, the agent should conclude with a personalized and lighthearted closing message.

Rules for the Closing Message:
1. Mention ${config.location || "Annecy"} and the specific context (e.g., being at the ${config.venue || "Palace de Menthon"}, the weather, etc.).
2. Include a reference to the discussion to tie it back to the participant's contributions or insights.
3. Add a touch of humor to make the participant smile (e.g., a joke about the rain, the lake, or the setting).
4. Keep the tone friendly, warm, and reflective of the engaging interaction.`;
  };

  // Update local lightbulbs state without immediately updating parent state
  const handleLocalLightbulbsChange = (field, value) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Collapsible section component
  const CollapsibleSection = ({ title, isOpen, onToggle, children, icon, color = "purple" }) => {
    const colorClasses = {
      purple: "bg-purple-100 border-purple-400 text-purple-900 shadow-md",
      amber: "bg-amber-100 border-amber-400 text-amber-900 shadow-md",
      indigo: "bg-indigo-100 border-indigo-400 text-indigo-900 shadow-md",
      gray: "bg-gray-100 border-gray-400 text-gray-900 shadow-md"
  };

  return (
      <div className="border-2 rounded-lg overflow-hidden mb-8 shadow-lg transition-all duration-300 hover:shadow-xl">
        <button
          onClick={onToggle}
          className={`w-full p-5 text-left font-medium flex items-center justify-between ${colorClasses[color]} focus:outline-none transition-colors duration-200`}
        >
          <div className="flex items-center">
            {icon && <span className="mr-3 text-xl">{icon}</span>}
            <span className="text-lg">{title}</span>
          </div>
          <svg
            className={`w-6 h-6 transform transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="p-6 border-t bg-white">{children}</div>
        )}
      </div>
    );
  };

  // Sample book layouts
  const bookLayouts = [
    { id: "magazine", name: "Magazine", description: "Modern editorial layout with featured blocks" },
    { id: "book", name: "Book", description: "Traditional book layout with chapters" },
    { id: "report", name: "Report", description: "Professional business report style" },
    { id: "journal", name: "Journal", description: "Personal journal with handwritten feel" },
    { id: "letter", name: "Letter", description: "Intimate letter format addressing the reader directly" }
  ];
  
  // Sample cover styles
  const bookCoverStyles = [
    { id: "minimal", name: "Minimal", description: "Clean, elegant design with simple typography" },
    { id: "artistic", name: "Artistic", description: "Creative cover with abstract visual elements" },
    { id: "photographic", name: "Photographic", description: "Photo-based cover highlighting key imagery" },
    { id: "vintage", name: "Vintage", description: "Classic retro style with aged texture" },
    { id: "corporate", name: "Corporate", description: "Professional business style" }
  ];
  
  // Sample image styles for AI generation
  const imageStyles = [
    { id: "watercolor", name: "Watercolor", description: "Soft, flowing watercolor painting style" },
    { id: "digital", name: "Digital Art", description: "Modern digital illustration style" },
    { id: "sketch", name: "Sketch", description: "Hand-drawn pencil or pen sketch style" },
    { id: "abstract", name: "Abstract", description: "Non-representational abstract art" },
    { id: "photorealistic", name: "Photorealistic", description: "Highly detailed realistic style" },
    { id: "pop-art", name: "Pop Art", description: "Bold colors and comic-like style" },
    { id: "impressionist", name: "Impressionist", description: "Light, visible brushstrokes like Monet" },
    { id: "3d-render", name: "3D Render", description: "Three-dimensional computer-generated imagery" }
  ];

  // Book preview component
  const BookPreview = ({ title, color, coverStyle, imageStyle, layout }) => {
    const getCoverPreviewUrl = () => {
      const baseStyle = coverStyle || 'minimal';
      const imgStyle = imageStyle || 'watercolor';
      
      // Maps of style-based gradients and patterns
      const styleGradients = {
        minimal: "bg-gradient-to-br from-gray-50 to-gray-200",
        artistic: "bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300",
        photographic: "bg-gradient-to-br from-blue-100 to-blue-200",
        vintage: "bg-gradient-to-br from-amber-100 to-amber-200",
        corporate: "bg-gradient-to-br from-slate-100 to-slate-300",
      };
      
      // For a real implementation, you would have different images for each combination
      // This is a placeholder that at least reflects the style
      return `https://via.placeholder.com/300x400/f5f5f5/333333?text=${baseStyle}+${imgStyle}`;
    };
    
    // Style-based transformations and effects
    const getBookStyles = () => {
      const baseStyle = coverStyle || 'minimal';
      
      // Définition des dégradés de style pour chaque type de couverture
      const styleGradients = {
        minimal: "bg-gradient-to-br from-gray-50 to-gray-200",
        artistic: "bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300",
        photographic: "bg-gradient-to-br from-blue-100 to-blue-200",
        vintage: "bg-gradient-to-br from-amber-100 to-amber-200",
        corporate: "bg-gradient-to-br from-slate-100 to-slate-300",
      };
      
      // Book shape and shadow variations
      const shapes = {
        minimal: {
          borderRadius: '0.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          transform: 'perspective(1000px)'
        },
        artistic: {
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          transform: 'perspective(1000px) rotateY(5deg)'
        },
        photographic: {
          borderRadius: '0.25rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          transform: 'perspective(1000px) rotateY(-2deg)'
        },
        vintage: {
          borderRadius: '0',
          boxShadow: '0 20px 25px -5px rgba(139, 69, 19, 0.2), 0 10px 10px -5px rgba(139, 69, 19, 0.1)',
          transform: 'perspective(1000px) rotateY(3deg)'
        },
        corporate: {
          borderRadius: '0.125rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          transform: 'perspective(1000px)'
        }
      };
      
      // Layout-specific styles
      const layoutStyles = {
        magazine: { fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont' },
        book: { fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
        report: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas' },
        journal: { fontFamily: '"Segoe Print", "Bradley Hand", Chilanka, cursive' },
        letter: { fontFamily: '"Brush Script MT", cursive' }
      };
      
      return {
        book: shapes[baseStyle],
        text: layoutStyles[layout || 'magazine'],
        gradient: styleGradients[baseStyle]
      };
    };
    
    // Get dynamic styles based on user selections
    const bookStyles = getBookStyles();
    
    // Book spine effect - only show for certain styles
    const showSpine = ['book', 'report', 'journal'].includes(layout || 'magazine');
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative mb-12 transition-all duration-500 transform hover:scale-105 group">
          {/* Book container with 3D effect */}
          <div className="w-80 perspective-1000">
            {/* Book spine (if applicable) */}
            {showSpine && (
              <div 
                className="absolute -left-3 top-0 bottom-0 w-6 z-0 transition-all duration-300"
                style={{
                  backgroundColor: color,
                  backgroundImage: bookStyles.gradient,
                  borderTopLeftRadius: bookStyles.book.borderRadius,
                  borderBottomLeftRadius: bookStyles.book.borderRadius,
                  transform: 'rotateY(15deg)',
                  boxShadow: '-2px 0 10px rgba(0,0,0,0.15)'
                }}
              >
                <div className="h-full flex items-center justify-center">
                  <span 
                    className="text-white text-xs font-bold uppercase tracking-widest whitespace-nowrap transform -rotate-90"
                    style={bookStyles.text}
                  >
                    {title || "Untitled"}
                  </span>
                </div>
              </div>
            )}
            
            {/* Book cover with dynamic styling */}
            <div 
              className="w-full h-96 overflow-hidden relative transform transition-all duration-500 origin-left hover:rotate-y-10 group-hover:rotate-y-20"
              style={{
                backgroundColor: color,
                backgroundImage: bookStyles.gradient,
                borderRadius: bookStyles.book.borderRadius,
                boxShadow: bookStyles.book.boxShadow,
                transform: bookStyles.book.transform
              }}
            >
              {/* Cover image with style-specific overlay */}
              <div className="absolute inset-0 bg-blend-multiply" 
                style={{
                  opacity: coverStyle === 'minimal' ? 0.3 : 0.6
                }}
              >
                <img 
                  src={getCoverPreviewUrl()} 
                  alt="Cover preview" 
                  className="w-full h-full object-cover"
                  style={{
                    filter: imageStyle === 'vintage' ? 'sepia(0.5)' : 
                           imageStyle === 'abstract' ? 'saturate(1.5)' : 
                           imageStyle === 'watercolor' ? 'contrast(0.9) brightness(1.1)' :
                           imageStyle === 'pop-art' ? 'saturate(2) contrast(1.3)' :
                           imageStyle === 'sketch' ? 'grayscale(0.8) contrast(1.2)' :
                           'none'
                  }}
                />
              </div>
              
              {/* Title overlay with dynamic text styling */}
              <div className="absolute inset-0 flex flex-col justify-between p-8">
                <div 
                  className="text-white text-xs uppercase tracking-wide font-medium backdrop-blur-sm bg-black/10 p-2 rounded"
                  style={bookStyles.text}
                >
                  {layout === 'magazine' ? 'Special Edition' : 
                   layout === 'book' ? 'A Novel' :
                   layout === 'report' ? 'Insights Report' :
                   layout === 'journal' ? 'Personal Journal' :
                   'Connected Mate Collection'}
                </div>
                
                {/* Dynamic title styling based on cover style and layout */}
                <div className="backdrop-blur-sm bg-black/10 p-3 rounded">
                  <h3 
                    className="text-white text-3xl font-bold mb-3 drop-shadow-md animate-text-shadow"
                    style={{
                      ...bookStyles.text,
                      textTransform: coverStyle === 'vintage' ? 'uppercase' : 'none',
                      letterSpacing: coverStyle === 'minimal' ? '0.05em' : 'normal',
                      fontStyle: layout === 'journal' || layout === 'letter' ? 'italic' : 'normal'
                    }}
                  >
                    {title || "Untitled Collection"}
                  </h3>
                  <div 
                    className="text-white text-sm opacity-90"
                    style={bookStyles.text}
                  >
                    Connected Mate • {new Date().getFullYear()}
                  </div>
                </div>
              </div>
              
              {/* Style-specific decorative elements */}
              {coverStyle === 'vintage' && (
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNjY2MiPjwvcmVjdD4KPC9zdmc+')] opacity-10"></div>
              )}
              
              {coverStyle === 'artistic' && (
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-white opacity-10 rounded-tl-full"></div>
              )}
              
              {coverStyle === 'corporate' && (
                <div className="absolute top-0 right-0 border-t-[40px] border-r-[40px] border-t-white/20 border-r-transparent"></div>
              )}
            </div>
          </div>
          
          {/* Page edges effect */}
          <div 
            className="absolute -right-2 top-1 bottom-1 w-3 bg-white rounded-r-sm shadow-inner transform"
            style={{
              backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.02) 100%)',
              transform: bookStyles.book.transform
            }}
          >
            <div className="h-full flex flex-col justify-between py-8">
              <div className="w-full h-1/3 bg-gradient-to-b from-transparent to-gray-100"></div>
              <div className="w-full h-1/3 bg-gradient-to-t from-transparent to-gray-100"></div>
            </div>
          </div>
          
          {/* Book label */}
          <div className="bg-white py-3 px-5 rounded-md shadow-lg absolute -bottom-7 left-1/2 transform -translate-x-1/2 text-center min-w-40 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center space-x-3">
              {/* Cover style indicator */}
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              ></div>
              
              <p className="text-sm font-medium text-gray-700">
                {coverStyle || "Minimal"} style • {layout || "Magazine"} layout
              </p>
            </div>
          </div>
      </div>

        {/* Sample pages preview with layout-specific styling */}
        <div className="w-full mt-10 grid grid-cols-2 gap-6">
          {/* Left page - adapts to layout style */}
          <div 
            className="bg-white rounded-md shadow-md p-5 h-48 overflow-hidden transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            style={{
              fontFamily: bookStyles.text.fontFamily
            }}
          >
            <div className="w-full h-5 bg-gray-200 rounded mb-3" style={{
              borderRadius: layout === 'vintage' ? '0' : '0.25rem'
            }}></div>
            <div className="w-3/4 h-5 bg-gray-200 rounded mb-4" style={{
              borderRadius: layout === 'vintage' ? '0' : '0.25rem'
            }}></div>
            
            {/* Content blocks that adapt to layout style */}
            {layout === 'magazine' ? (
              <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
                  <div className="w-full h-3 bg-gray-100 rounded"></div>
                  <div className="w-full h-3 bg-gray-100 rounded"></div>
                  <div className="w-2/3 h-3 bg-gray-100 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-3 bg-gray-100 rounded"></div>
                  <div className="w-full h-3 bg-gray-100 rounded"></div>
                  <div className="w-2/3 h-3 bg-gray-100 rounded"></div>
                </div>
              </div>
            ) : layout === 'book' ? (
              <div className="space-y-2">
                <div className="w-full h-3 bg-gray-100 rounded"></div>
                <div className="w-full h-3 bg-gray-100 rounded"></div>
                <div className="w-full h-3 bg-gray-100 rounded"></div>
                <div className="w-full h-3 bg-gray-100 rounded"></div>
                <div className="w-2/3 h-3 bg-gray-100 rounded"></div>
              </div>
            ) : layout === 'report' ? (
              <div className="space-y-3">
                <div className="flex">
                  <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                  <div className="space-y-2 flex-1">
                    <div className="w-1/2 h-3 bg-gray-100 rounded"></div>
                    <div className="w-3/4 h-3 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded"></div>
                <div className="w-full h-3 bg-gray-100 rounded"></div>
              </div>
            ) : (
              <div className="space-y-2" style={{ 
                transform: layout === 'journal' ? 'rotate(-1deg)' : 'none'
              }}>
                <div className="w-full h-3 bg-gray-100 rounded"></div>
                <div className="w-full h-3 bg-gray-100 rounded"></div>
                <div className="w-5/6 h-3 bg-gray-100 rounded"></div>
                <div className="w-full h-3 bg-gray-100 rounded"></div>
              </div>
            )}
          </div>
          
          {/* Right page */}
          <div 
            className="bg-white rounded-md shadow-md p-5 h-48 overflow-hidden transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            style={{
              fontFamily: bookStyles.text.fontFamily
            }}
          >
            {layout === 'magazine' || layout === 'report' ? (
              <div className="flex mb-4">
                <div 
                  className="w-1/3 h-24 bg-gray-200 rounded mr-3"
                  style={{
                    borderRadius: layout === 'vintage' ? '0' : '0.25rem'
                  }}
                ></div>
                <div className="flex-1 space-y-2">
                  <div className="w-full h-3 bg-gray-100 rounded"></div>
                  <div className="w-full h-3 bg-gray-100 rounded"></div>
                  <div className="w-2/3 h-3 bg-gray-100 rounded"></div>
                  <div className="w-full h-3 bg-gray-100 rounded"></div>
                </div>
              </div>
            ) : layout === 'book' ? (
              <div className="mb-4 space-y-2">
                <div className="w-full h-3 bg-gray-100 rounded"></div>
                <div className="w-full h-3 bg-gray-100 rounded"></div>
                <div className="w-full h-3 bg-gray-100 rounded"></div>
                <div className="w-full h-3 bg-gray-100 rounded"></div>
                <div className="w-3/4 h-3 bg-gray-100 rounded"></div>
              </div>
            ) : layout === 'journal' ? (
              <div className="mb-4 space-y-2" style={{ transform: 'rotate(0.5deg)' }}>
                <div className="w-full h-3 bg-gray-100 rounded"></div>
                <div className="w-5/6 h-3 bg-gray-100 rounded"></div>
                <div className="w-full h-3 bg-gray-100 rounded"></div>
                <div className="w-4/5 h-3 bg-gray-100 rounded"></div>
              </div>
            ) : (
              <div className="mb-4 space-y-2">
                <div className="w-full h-3 bg-gray-100 rounded"></div>
                <div className="w-full h-3 bg-gray-100 rounded"></div>
                <div className="w-5/6 h-3 bg-gray-100 rounded"></div>
              </div>
            )}
            
            {/* Dynamic footer content based on layout */}
            <div className="w-full h-3 bg-gray-100 rounded mb-2"></div>
            <div className="w-5/6 h-3 bg-gray-100 rounded mb-2"></div>
            
            {layout === 'report' && (
              <div className="flex justify-between mt-5">
                <div className="w-16 h-2 bg-gray-100 rounded"></div>
                <div className="w-10 h-6 bg-gray-200 rounded"></div>
              </div>
            )}
            
            {layout === 'book' && (
              <div className="flex justify-center mt-5">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // CSS animations and utility classes
  const animationStyles = `
    @keyframes text-shadow-pulse {
      0% { text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
      50% { text-shadow: 1px 1px 5px rgba(0,0,0,0.5); }
      100% { text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
    }
    
    @keyframes page-turn {
      0% { transform: perspective(1000px) rotateY(0deg); }
      100% { transform: perspective(1000px) rotateY(20deg); }
    }
    
    .animate-text-shadow {
      animation: text-shadow-pulse 3s infinite;
    }
    
    .hover\\:rotate-y-10:hover {
      transform: perspective(1000px) rotateY(10deg);
    }
    
    .group-hover\\:rotate-y-20 {
      transform: perspective(1000px) rotateY(0deg);
    }
    
    .group:hover .group-hover\\:rotate-y-20 {
      transform: perspective(1000px) rotateY(20deg);
    }
    
    .perspective-1000 {
      perspective: 1000px;
    }
  `;

  // If in questionnaire mode, render the Nexus AI Journalist component
  if (mode === "questionnaire") {
  return (
    <div className="space-y-6">
        <div className="bg-purple-100 border-l-4 border-purple-500 p-6 mb-8 rounded-r-lg shadow-md">
          <p className="text-purple-800 text-lg">
            Configure the AI Journalist for the Nexus X Insead questionnaire.
            This specialized AI agent will guide participants through the questionnaire process.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <NexusAIJournalist 
              config={questionnaireConfig} 
              onChange={handleQuestionnaireConfigChange}
            />
          </div>
        </div>
      </div>
    );
  }

  // If in nuggets mode, render a simplified version for AI Nuggets
  if (mode === "nuggets") {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-purple-100 to-indigo-50 border-l-4 border-purple-500 p-6 mb-8 rounded-r-lg shadow-md">
          <p className="text-purple-800 text-lg">
            Configure the AI Journalist for participants who received the most votes during the discussion.
            This AI agent will engage with them to develop their insights further.
          </p>
        </div>

        {/* AI Nuggets Analysis Configuration with enhanced visual indicators */}
        <div className="relative bg-white p-6 rounded-xl shadow-md mb-6 border border-indigo-200">
          <div className="absolute -top-4 -right-4 flex items-center justify-center bg-indigo-500 text-white w-10 h-10 rounded-full shadow-md">
            <span className="text-xl" role="img" aria-label="Analysis">💎</span>
          </div>
          <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
            <span className="mr-2">Nuggets Analysis Configuration</span>
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">AI Analysis</span>
          </h3>
          
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-indigo-800">
              Configure how the AI will analyze Nuggets interactions. These settings determine what's included in 
              the analysis and how it's presented to you at the end of the session.
            </p>
          </div>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="flex items-center space-x-2">
            <Checkbox
                  checked={analysisConfiguration?.includeParticipantNames ?? true}
                  onChange={(value) => updateSessionConfig({
                    ...sessionConfig,
                    analysisConfiguration: {
                      ...analysisConfiguration,
                      includeParticipantNames: value
                    }
                  })}
                />
                <span className="text-gray-700">Include participant names in analysis</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                When enabled, participant names will be mentioned in the analysis.
            </p>
          </div>

            <div>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={analysisConfiguration?.includeQuotesInAnalysis ?? true}
                  onChange={(value) => updateSessionConfig({
                    ...sessionConfig,
                    analysisConfiguration: {
                      ...analysisConfiguration,
                      includeQuotesInAnalysis: value
                    }
                  })}
                />
                <span className="text-gray-700">Include direct quotes in analysis</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                When enabled, the analysis will include direct quotes from the conversations.
              </p>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={analysisConfiguration?.generateKeyInsights ?? true}
                  onChange={(value) => updateSessionConfig({
                    ...sessionConfig,
                    analysisConfiguration: {
                      ...analysisConfiguration,
                      generateKeyInsights: value
                    }
                  })}
                />
                <span className="text-gray-700">Generate key insights section</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                When enabled, the analysis will include a section highlighting key insights.
              </p>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={analysisConfiguration?.enableWordCloud ?? true}
                  onChange={(value) => updateSessionConfig({
                    ...sessionConfig,
                    analysisConfiguration: {
                      ...analysisConfiguration,
                      enableWordCloud: value
                    }
                  })}
                />
                <span className="text-gray-700">Enable word cloud visualization</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                Creates a word cloud highlighting key themes and terms from the conversations.
              </p>
          </div>

            <div>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={analysisConfiguration?.enableThemeNetwork ?? true}
                  onChange={(value) => updateSessionConfig({
                    ...sessionConfig,
                    analysisConfiguration: {
                      ...analysisConfiguration,
                      enableThemeNetwork: value
                    }
                  })}
                />
                <span className="text-gray-700">Enable theme network visualization</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                Shows connections between different themes and concepts discussed.
              </p>
                </div>
                </div>
          
          <div className="bg-indigo-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-indigo-800 mb-2">Analysis Rules</h4>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="text-indigo-500 mr-2">•</span>
                <p className="text-sm text-gray-700">Focus on key insights and actionable takeaways</p>
              </div>
              <div className="flex items-start">
                <span className="text-indigo-500 mr-2">•</span>
                <p className="text-sm text-gray-700">Identify patterns across different conversations</p>
                </div>
              <div className="flex items-start">
                <span className="text-indigo-500 mr-2">•</span>
                <p className="text-sm text-gray-700">Connect insights to concrete examples from the discussions</p>
                </div>
              </div>
            </div>
          
          <NumberInput
            label="Analysis Generation Time (seconds)"
            value={analysisConfiguration?.analysisGenerationTime ?? 60}
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
          <p className="text-sm text-gray-600 mt-2 mb-6">
            Time needed for the AI to generate the Nuggets analysis.
          </p>
          </div>
          
        {/* Continue with existing Nuggets configuration */}
        <CollapsibleSection 
          title="Configure your AI" 
          isOpen={showAIConfig}
          onToggle={() => setShowAIConfig(!showAIConfig)}
          icon="🤖"
          color="purple"
        >
          <div className="space-y-8">
            {/* Add an instruction banner at the top of the form */}
            <div className="p-4 mb-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">À propos de ce formulaire</h3>
                  <div className="mt-1 text-sm text-blue-700">
                    <p>Les modifications ne sont <strong>pas sauvegardées automatiquement</strong>. Après avoir effectué vos modifications, cliquez sur le bouton <strong>Enregistrer</strong> en bas de chaque section pour les appliquer.</p>
                    {hasUnsavedChanges && (
                      <p className="mt-1 font-medium text-orange-600">
                        ⚠️ Vous avez des modifications non enregistrées. N'oubliez pas de cliquer sur "Enregistrer" !
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-xl mb-6 shadow-inner">
              <h3 className="font-medium text-indigo-900 mb-3 text-xl">Prompt Template Variables</h3>
              <p className="text-indigo-700 mb-4">
                Customize the template by editing these variables. You can also modify rules and questions below.
              </p>
            </div>
            
            {/* Basic Information */}
            <div>
              <h4 className="font-medium text-gray-800 mb-4 text-lg border-b pb-2">Basic Information</h4>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-700 text-sm">
                  <span className="font-semibold">💡 Tip:</span> Please fill in the fields below to customize your AI Nuggets experience. These settings will be used throughout your session.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <Input
                    label="Agent Name"
                    value={localConfig.agentName}
                    onChange={(e) => {
                      setLocalConfig(prev => ({
                        ...prev,
                        agentName: e.target.value
                      }));
                      setHasUnsavedChanges(true);
                    }}
                    error={validationState.agentName?.message}
                    placeholder="Enter the AI agent's name (e.g., Elias, Sonia)"
                    className="focus:ring-2 focus:ring-purple-400"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    The name your AI agent will use when interacting with participants.
            </p>
          </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <Input
                    label="Program Name"
                    value={localConfig.programName}
                    onChange={(e) => {
                      setLocalConfig(prev => ({
                        ...prev,
                        programName: e.target.value
                      }));
                      setHasUnsavedChanges(true);
                    }}
                    error={validationState.programName?.message}
                    placeholder="Enter your program or event name (e.g., Nuggets Workshop)"
                    className="focus:ring-2 focus:ring-purple-400"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    The name of the program or event this session is for.
            </p>
          </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <Input
                    label="Teacher Name"
                    value={localConfig.teacherName || ""}
                    onChange={(e) => {
                      setLocalConfig(prev => ({
                        ...prev,
                        teacherName: e.target.value
                      }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Enter the teacher or facilitator's name (e.g., John Doe)"
                    className="focus:ring-2 focus:ring-purple-400"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    The name of the teacher or facilitator mentioned in the closing message.
              </p>
            </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <Input
                    label="Location"
                    value={localConfig.location || ""}
                    onChange={(e) => {
                      setLocalConfig(prev => ({
                        ...prev,
                        location: e.target.value
                      }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Enter the city or location (e.g., Paris, New York)"
                    className="focus:ring-2 focus:ring-purple-400"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    The city or location where the event is taking place.
                  </p>
          </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <Input
                    label="Venue"
                    value={localConfig.venue || ""}
                    onChange={(e) => {
                      setLocalConfig(prev => ({
                        ...prev,
                        venue: e.target.value
                      }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Enter the specific venue (e.g., Conference Center, Grand Hotel)"
                    className="focus:ring-2 focus:ring-purple-400"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    The specific venue or building where the event is being held.
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agent Personality
                  </label>
                  <select
                    value={localConfig.agentPersonality || "conversational, curious and journalistic"}
                    onChange={(e) => {
                      setLocalConfig(prev => ({
                        ...prev,
                        agentPersonality: e.target.value
                      }));
                      setHasUnsavedChanges(true);
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-white transition duration-150 ease-in-out"
                  >
                    <option value="conversational, curious and journalistic">Conversational Journalist (Default)</option>
                    <option value="professional, analytical, thorough">Professional Analyst</option>
                    <option value="friendly, enthusiastic, supportive">Friendly Supporter</option>
                    <option value="direct, concise, practical">Direct Interviewer</option>
                    <option value="warm, empathetic, understanding">Empathetic Listener</option>
                  </select>
                  <p className="text-sm text-gray-600 mt-2">
                    Personality traits that define how the AI agent communicates with participants.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={applyChanges}
                  className={`px-6 py-2 bg-gradient-to-r ${hasUnsavedChanges ? 'from-orange-600 to-red-600' : 'from-purple-600 to-indigo-600'} text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0`}
                >
                  {hasUnsavedChanges ? 'Save Changes*' : 'Save Changes'}
                </button>
                </div>
                </div>
            
            {/* Rules Configuration */}
            <div className="mt-10 border-t pt-8">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-medium text-gray-800 text-lg">Conversation Rules</h4>
                <button
                  onClick={() => {
                    const newRules = [...(localConfig.rules || defaultNuggetsPromptConfig.rules), "Nouvelle règle: Description de la règle"];
                    setLocalConfig(prev => ({
                      ...prev,
                      rules: newRules
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
                >
                  <span className="mr-2">+</span> Add Rule
                </button>
              </div>
              
              <div className="space-y-4">
                {(localConfig.rules || defaultNuggetsPromptConfig.rules).map((rule, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative">
                    <Input
                      label={`Rule ${index + 1}`}
                      value={rule}
                      onChange={(e) => {
                        const newRules = [...(localConfig.rules || defaultNuggetsPromptConfig.rules)];
                        newRules[index] = e.target.value;
                        setLocalConfig(prev => ({
                          ...prev,
                          rules: newRules
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Enter rule description"
                      className="focus:ring-2 focus:ring-purple-400"
                    />
                    
                    <button
                      onClick={() => {
                        const newRules = [...(localConfig.rules || defaultNuggetsPromptConfig.rules)];
                        newRules.splice(index, 1);
                        setLocalConfig(prev => ({
                          ...prev,
                          rules: newRules
                        }));
                      }}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Questions Configuration */}
            <div className="mt-10 border-t pt-8">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-medium text-gray-800 text-lg">Template Questions</h4>
                <button
                  onClick={() => {
                    const newQuestions = [...(localConfig.questions || defaultNuggetsPromptConfig.questions), 
                      {
                        title: "Nouvelle Question",
                        question: "Entrez votre nouvelle question ici ?"
                      }
                    ];
                    setLocalConfig(prev => ({
                      ...prev,
                      questions: newQuestions
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
                >
                  <span className="mr-2">+</span> Add Question
                </button>
              </div>
              
              <div className="space-y-6">
                {(localConfig.questions || defaultNuggetsPromptConfig.questions).map((questionObj, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative">
                    <Input
                      label={`Question ${index + 1} Title`}
                      value={questionObj.title}
                      onChange={(e) => {
                        const newQuestions = [...(localConfig.questions || defaultNuggetsPromptConfig.questions)];
                        newQuestions[index] = {
                          ...newQuestions[index],
                          title: e.target.value
                        };
                        setLocalConfig(prev => ({
                          ...prev,
                          questions: newQuestions
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Enter question title (e.g., Origin Story)"
                      className="focus:ring-2 focus:ring-purple-400 mb-4"
                    />
                    
                    <Input
                      label="Question Text"
                      value={questionObj.question}
                      onChange={(e) => {
                        const newQuestions = [...(localConfig.questions || defaultNuggetsPromptConfig.questions)];
                        newQuestions[index] = {
                          ...newQuestions[index],
                          question: e.target.value
                        };
                        setLocalConfig(prev => ({
                          ...prev,
                          questions: newQuestions
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Enter the actual question text"
                      className="focus:ring-2 focus:ring-purple-400"
                    />
                    
                    <button
                      onClick={() => {
                        const newQuestions = [...(localConfig.questions || defaultNuggetsPromptConfig.questions)];
                        newQuestions.splice(index, 1);
                        setLocalConfig(prev => ({
                          ...prev,
                          questions: newQuestions
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Prompt Preview */}
            <div className="mt-8 pt-6 border-t">
              <CollapsibleSection 
                title="Preview Complete Prompt" 
                isOpen={showPromptPreview}
                onToggle={() => setShowPromptPreview(!showPromptPreview)}
                icon="📝"
                color="indigo"
              >
                <div className="bg-gray-50 p-5 rounded-xl border-2 border-indigo-100 max-h-96 overflow-y-auto shadow-inner">
                  <pre className="text-sm whitespace-pre-wrap font-mono text-gray-700">
                    {generateCompleteNuggetsPrompt()}
                  </pre>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      // Implement validation logic here
                      alert("Prompt validation logic not implemented yet");
                    }}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0"
                  >
                    Validate with OpenAI
                  </button>
                </div>
              </CollapsibleSection>
            </div>
          </div>
        </CollapsibleSection>
        
        {/* Book Configuration */}
        <CollapsibleSection 
          title="Configure the book" 
          isOpen={showBookConfig}
          onToggle={() => setShowBookConfig(!showBookConfig)}
          icon="📘"
          color="amber"
        >
          <div className="space-y-8">
            {/* Book Preview Toggle */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setBookPreviewOpen(!bookPreviewOpen)}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0 flex items-center"
              >
                <span className="mr-2">{bookPreviewOpen ? "Hide" : "Show"} Book Preview</span>
                <svg className={`w-5 h-5 transform transition-transform duration-300 ${bookPreviewOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {/* Book Preview */}
            {bookPreviewOpen && (
              <div className="p-6 bg-gradient-to-r from-gray-50 to-amber-50 rounded-xl shadow-inner mb-8">
                <BookPreview 
                  title={nuggetsBookTitle} 
                  color={nuggetsBookColor}
                  coverStyle={bookCover}
                  imageStyle={bookImageStyle}
                  layout={bookLayout}
                />
              </div>
            )}
            
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
              <Input
                label="Book Title"
                value={nuggetsBookTitle}
                onChange={(e) => handleChange('nuggetsBookTitle', e.target.value)}
                placeholder="Title for the generated insights book"
                className="focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Book Accent Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  value={nuggetsBookColor}
                  onChange={(e) => handleChange('nuggetsBookColor', e.target.value)}
                  className="h-12 w-24 rounded cursor-pointer"
                />
                <div 
                  className="ml-4 w-16 h-16 rounded-full shadow-md" 
                  style={{ backgroundColor: nuggetsBookColor }}
                ></div>
              </div>
            </div>
            
            {/* New Book Layout Selection */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Book Layout
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookLayouts.map(layout => (
                  <div 
                    key={layout.id}
                    onClick={() => handleChange('bookLayout', layout.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      bookLayout === layout.id 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                    }`}
                  >
                    <h4 className="font-medium text-gray-800">{layout.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{layout.description}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Book Cover Style */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Book Cover Style
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookCoverStyles.map(style => (
                  <div 
                    key={style.id}
                    onClick={() => handleChange('bookCover', style.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      bookCover === style.id 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                    }`}
                  >
                    <h4 className="font-medium text-gray-800">{style.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{style.description}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Cover Image Generation */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
              <div className="flex items-start mb-4">
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700">
                    Generate AI Cover Image
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    Use DALL-E to generate a custom cover image based on the book content
                  </p>
                </div>
                <div>
            <Checkbox
                    checked={generateBookCoverImage}
                    onChange={(value) => handleChange('generateBookCoverImage', value)}
                  />
                </div>
              </div>
              
              {generateBookCoverImage && (
                <>
                  {/* Image Style Selection */}
                  <div className="mb-6 mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image Style
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {imageStyles.map(style => (
                        <div 
                          key={style.id}
                          onClick={() => handleChange('bookImageStyle', style.id)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 text-center ${
                            bookImageStyle === style.id 
                              ? 'border-indigo-500 bg-indigo-50' 
                              : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                          }`}
                        >
                          <h4 className="font-medium text-gray-800 text-sm">{style.name}</h4>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Selected: {imageStyles.find(s => s.id === bookImageStyle)?.description || ""}
            </p>
          </div>

                  {/* Custom Image Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Image Prompt (Optional)
                    </label>
                    <textarea
                      value={bookImagePrompt}
                      onChange={(e) => handleChange('bookImagePrompt', e.target.value)}
                      className="input w-full h-20 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 transition-shadow duration-200"
                      placeholder="Additional details for image generation (e.g., 'an abstract representation of creative ideas flowing')"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to auto-generate based on book content
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {/* Participant Information */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
              <div className="flex items-start">
                <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700">
                    Include Participant Information
              </label>
                  <p className="text-sm text-gray-500 mt-1">
                    Add participant's name and details in the book
                  </p>
                </div>
                <div>
                  <Checkbox
                    checked={includeParticipantInfo}
                    onChange={(value) => handleChange('includeParticipantInfo', value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
              <NumberInput
                label="Book Generation Time (seconds)"
                value={bookGenerationTime}
                onChange={(value) => handleChange('bookGenerationTime', value)}
                min={30}
                max={300}
                step={10}
              />
              <p className="text-sm text-gray-600 mt-2">
                Time needed for the AI to generate the insights book.
              </p>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
              <Checkbox
                label="Show books to all participants"
                checked={showGeneratedBooksToAll}
                onChange={(value) => handleChange('showGeneratedBooksToAll', value)}
              />
              <p className="text-sm text-gray-600 ml-6 mt-2">
                If enabled, all participants will be able to see the generated books.
              </p>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    );
  }

  // If in lightbulb mode, render the AI Lightbulbs configuration
  if (mode === "lightbulb") {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-amber-100/80 to-yellow-50/80 border-l-4 border-amber-500 p-6 mb-8 rounded-r-lg shadow-md">
          <p className="text-amber-800 text-lg">
            Configure the AI Lightbulbs agent that will interact with participants to capture their ideas inspired by nuggets.
          </p>
        </div>

        {/* Add an instruction banner at the top */}
        <div className="p-4 mb-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">À propos de ce formulaire</h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>Les modifications ne sont <strong>pas sauvegardées automatiquement</strong>. Après avoir effectué vos modifications, cliquez sur le bouton <strong>Enregistrer</strong> en bas de chaque section pour les appliquer.</p>
                {hasUnsavedChanges && (
                  <p className="mt-1 font-medium text-orange-600">
                    ⚠️ Vous avez des modifications non enregistrées. N'oubliez pas de cliquer sur "Enregistrer" !
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <CollapsibleSection 
          title="Configure your AI" 
          isOpen={showAIConfig}
          onToggle={() => setShowAIConfig(!showAIConfig)}
          icon="💡"
          color="amber"
        >
          <div className="space-y-8">
            <div className="p-5 bg-gradient-to-r from-amber-50/80 to-yellow-50/80 rounded-xl mb-6 shadow-inner">
              <h3 className="font-medium text-amber-900 mb-3 text-xl">Prompt Template Variables</h3>
              <p className="text-amber-700 mb-4">
                Customize the template by editing these variables. You can also modify rules and steps below.
              </p>
            </div>
            
            {/* Basic Information */}
            <div>
              <h4 className="font-medium text-gray-800 mb-4 text-lg border-b pb-2">Basic Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <Input
                    label="Agent Name"
                    value={localConfig.agentName || ""}
                    onChange={(e) => {
                      setLocalConfig(prev => ({
                        ...prev,
                        agentName: e.target.value
                      }));
                      setHasUnsavedChanges(true);
                    }}
                    error={validationState.agentName?.message}
                    placeholder="Enter the AI agent's name"
                    className="focus:ring-2 focus:ring-amber-400"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    The name your AI agent will use when interacting with participants.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <Input
                    label="Program Name"
                    value={localConfig.programName || ""}
                    onChange={(e) => {
                      setLocalConfig(prev => ({
                        ...prev,
                        programName: e.target.value
                      }));
                      setHasUnsavedChanges(true);
                    }}
                    error={validationState.programName?.message}
                    placeholder="Enter your program or event name"
                    className="focus:ring-2 focus:ring-amber-400"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    The name of the program or event this session is for.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <Input
                    label="Location"
                    value={localConfig.location || ""}
                    onChange={(e) => {
                      setLocalConfig(prev => ({
                        ...prev,
                        location: e.target.value
                      }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Enter the city or location (default: Annecy)"
                    className="focus:ring-2 focus:ring-amber-400"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    The city or location where the event is taking place.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <Input
                    label="Venue"
                    value={localConfig.venue || ""}
                    onChange={(e) => {
                      setLocalConfig(prev => ({
                        ...prev,
                        venue: e.target.value
                      }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Enter the specific venue (default: Palace de Menthon)"
                    className="focus:ring-2 focus:ring-amber-400"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    The specific venue or building where the event is being held.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agent Personality
                  </label>
                  <select
                    value={localConfig.agentPersonality || "professional, supportive, attentive"}
                    onChange={(e) => {
                      setLocalConfig(prev => ({
                        ...prev,
                        agentPersonality: e.target.value
                      }));
                      setHasUnsavedChanges(true);
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white transition duration-150 ease-in-out"
                  >
                    <option value="professional, supportive, attentive">Professional & Supportive (Default)</option>
                    <option value="friendly, enthusiastic, encouraging">Friendly & Enthusiastic</option>
                    <option value="analytical, precise, methodical">Analytical & Precise</option>
                    <option value="empathetic, understanding, patient">Empathetic & Patient</option>
                    <option value="direct, concise, focused">Direct & Focused</option>
                  </select>
                  <p className="text-sm text-gray-600 mt-2">
                    Personality traits that define how the AI agent communicates with participants.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={applyChanges}
                  className={`px-6 py-2 bg-gradient-to-r ${hasUnsavedChanges ? 'from-orange-600 to-red-600' : 'from-amber-600 to-orange-500'} text-white rounded-md hover:from-amber-700 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0`}
                >
                  {hasUnsavedChanges ? 'Save Changes*' : 'Save Changes'}
                </button>
              </div>
            </div>
              
            {/* Rules Configuration */}
            <div className="mt-10 border-t pt-8">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-medium text-gray-800 text-lg">Conversation Rules</h4>
                <button
                  onClick={() => {
                    const newRules = [...(localConfig.rules || defaultLightbulbsPromptConfig.rules), "New rule: Description of the rule"];
                    setLocalConfig(prev => ({
                      ...prev,
                      rules: newRules
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-500 text-white text-sm rounded-lg hover:from-amber-700 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
                >
                  <span className="mr-2">+</span> Add Rule
                </button>
              </div>
              
              <div className="space-y-4">
                {(localConfig.rules || defaultLightbulbsPromptConfig.rules).map((rule, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative">
                    <Input
                      label={`Rule ${index + 1}`}
                      value={rule}
                      onChange={(e) => {
                        const newRules = [...(localConfig.rules || defaultLightbulbsPromptConfig.rules)];
                        newRules[index] = e.target.value;
                        setLocalConfig(prev => ({
                          ...prev,
                          rules: newRules
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Enter rule description"
                      className="focus:ring-2 focus:ring-amber-400"
                    />
                    
                    <button
                      onClick={() => {
                        const newRules = [...(localConfig.rules || defaultLightbulbsPromptConfig.rules)];
                        newRules.splice(index, 1);
                        setLocalConfig(prev => ({
                          ...prev,
                          rules: newRules
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Steps & Questions Configuration */}
            <div className="mt-10 border-t pt-8">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-medium text-gray-800 text-lg">Steps & Questions</h4>
                <button
                  onClick={() => {
                    const newQuestions = [...(localConfig.questions || defaultLightbulbsPromptConfig.questions), 
                      {
                        title: "New Step",
                        question: "Enter the question for this step",
                        objective: "Enter the objective for this question"
                      }
                    ];
                    setLocalConfig(prev => ({
                      ...prev,
                      questions: newQuestions
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-500 text-white text-sm rounded-lg hover:from-amber-700 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
                >
                  <span className="mr-2">+</span> Add Step
                </button>
              </div>
              
              <div className="space-y-6">
                {(localConfig.questions || defaultLightbulbsPromptConfig.questions).map((questionObj, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative">
                    <div className="mb-2 flex items-center">
                      <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-xs font-medium">
                        Step {index + 1}
                      </span>
                    </div>
                    
                    <Input
                      label="Step Title"
                      value={questionObj.title}
                      onChange={(e) => {
                        const newQuestions = [...(localConfig.questions || defaultLightbulbsPromptConfig.questions)];
                        newQuestions[index] = {
                          ...newQuestions[index],
                          title: e.target.value
                        };
                        setLocalConfig(prev => ({
                          ...prev,
                          questions: newQuestions
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Enter step title (e.g., Inspiration Nugget Reference)"
                      className="focus:ring-2 focus:ring-amber-400 mb-4"
                    />
                    
                    <Input
                      label="Question"
                      value={questionObj.question}
                      onChange={(e) => {
                        const newQuestions = [...(localConfig.questions || defaultLightbulbsPromptConfig.questions)];
                        newQuestions[index] = {
                          ...newQuestions[index],
                          question: e.target.value
                        };
                        setLocalConfig(prev => ({
                          ...prev,
                          questions: newQuestions
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Enter the question text"
                      className="focus:ring-2 focus:ring-amber-400 mb-4"
                    />
                    
                    <Input
                      label="Objective"
                      value={questionObj.objective || ""}
                      onChange={(e) => {
                        const newQuestions = [...(localConfig.questions || defaultLightbulbsPromptConfig.questions)];
                        newQuestions[index] = {
                          ...newQuestions[index],
                          objective: e.target.value
                        };
                        setLocalConfig(prev => ({
                          ...prev,
                          questions: newQuestions
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Enter the objective for this question"
                      className="focus:ring-2 focus:ring-amber-400"
                    />
                    
                    <button
                      onClick={() => {
                        const newQuestions = [...(localConfig.questions || defaultLightbulbsPromptConfig.questions)];
                        newQuestions.splice(index, 1);
                        setLocalConfig(prev => ({
                          ...prev,
                          questions: newQuestions
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Closing Message Configuration */}
            <div className="mt-10 border-t pt-8">
              <h4 className="font-medium text-gray-800 mb-4 text-lg">Closing Message Rules</h4>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <p className="text-sm text-gray-700 mb-4">
                  Configure the rules for the closing message that the AI will use to conclude the discussion.
                </p>
                
                <div className="space-y-4">
                  <div className="bg-amber-50 p-3 rounded-md">
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">1.</span> Mention the location and context (e.g., being at {localConfig.venue || "Palace de Menthon"} in {localConfig.location || "Annecy"}).
                    </p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-md">
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">2.</span> Include a reference to the discussion to tie it back to the participant's contributions.
                    </p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-md">
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">3.</span> Add a touch of humor to make the participant smile (e.g., a joke about the setting).
                    </p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-md">
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">4.</span> Keep the tone friendly, warm, and reflective of the engaging interaction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Prompt Preview */}
            <div className="mt-8 pt-6 border-t">
              <CollapsibleSection 
                title="Preview Complete Prompt" 
                isOpen={showPromptPreview}
                onToggle={() => setShowPromptPreview(!showPromptPreview)}
                icon="📝"
                color="amber"
              >
                <div className="bg-gray-50 p-5 rounded-xl border-2 border-amber-100 max-h-96 overflow-y-auto shadow-inner">
                  <pre className="text-sm whitespace-pre-wrap font-mono text-gray-700">
                    {generateCompleteLightbulbsPrompt()}
                  </pre>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      // Implement validation logic here
                      alert("Prompt validation logic not implemented yet");
                    }}
                    className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-lg hover:from-amber-700 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0"
                  >
                    Validate with OpenAI
                  </button>
                </div>
              </CollapsibleSection>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection 
          title="Book Generation Settings" 
          isOpen={showBookConfig}
          onToggle={() => setShowBookConfig(!showBookConfig)}
          icon="📚"
          color="amber"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <Input
                  label="Book Title"
                  value={lightBulbsBookTitle}
                  onChange={(e) => {
                    setLocalConfig(prev => ({
                      ...prev,
                      lightBulbsBookTitle: e.target.value
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Enter the book title"
                  className="focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Book Color Theme
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleChange('lightBulbsBookColor', '#F59E0B')}
                    className={`w-8 h-8 rounded-full bg-amber-500 ${lightBulbsBookColor === '#F59E0B' ? 'ring-2 ring-offset-2 ring-amber-500' : ''}`}
                  />
                  <button
                    onClick={() => handleChange('lightBulbsBookColor', '#EF4444')}
                    className={`w-8 h-8 rounded-full bg-red-500 ${lightBulbsBookColor === '#EF4444' ? 'ring-2 ring-offset-2 ring-red-500' : ''}`}
                  />
                  <button
                    onClick={() => handleChange('lightBulbsBookColor', '#10B981')}
                    className={`w-8 h-8 rounded-full bg-emerald-500 ${lightBulbsBookColor === '#10B981' ? 'ring-2 ring-offset-2 ring-emerald-500' : ''}`}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
              <NumberInput
                label="Book Generation Time (seconds)"
                value={bookGenerationTime}
                onChange={(value) => handleChange('bookGenerationTime', value)}
                min={30}
                max={300}
                step={10}
              />
              <p className="text-sm text-gray-600 mt-2">
                Time needed for the AI to generate the ideas book.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
              <Checkbox
                label="Show books to all participants"
                checked={showGeneratedBooksToAll}
                onChange={(value) => handleChange('showGeneratedBooksToAll', value)}
              />
              <p className="text-sm text-gray-600 ml-6 mt-2">
                If enabled, all participants will be able to see the generated books.
              </p>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    );
  }

  // Standard mode is no longer needed as we're using specific modes
  return (
    <div className="space-y-8">
      {/* Inject the animation styles */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      <div className="bg-gradient-to-r from-gray-100 to-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg shadow-md">
        <p className="text-blue-800 text-lg">
          Please select either "nuggets" or "lightbulb" mode to configure the AI Journalist.
        </p>
      </div>
    </div>
  );
};

export default AIInteractionConfig; 