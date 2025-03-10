import React, { useState, useEffect } from 'react';
import Input from './Input';
import Checkbox from './Checkbox';
import NumberInput from './NumberInput';
import NexusAIJournalist from './NexusAIJournalist';
import FinalAnalysisConfig from './FinalAnalysisConfig';

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
    agentName: "",
    programName: "",
    teacherName: "",
    location: "",
    venue: "",
    agentPersonality: "",
    rules: [
      "Assure participants that there information will remain confidential and used solely for identification purposes if they ask us to delete their workshop data.",
      "Sequential Flow: Ask each required question in order and proceed only after receiving a full response.",
      "Clarification: If a response is incomplete or unclear, ask for additional details politely before moving on.",
      "No Skipped Questions: All the required questions must be addressed without skipping or rephrasing unless necessary for clarity.",
      "End of Conversation: Conclude the conversation only after confirming that all responses are complete."
    ],
    questions: [
      {
        title: "Problem and Opportunity",
        question: "What is the main problem or opportunity your business is addressing?"
      },
      {
        title: "Unique Solution",
        question: "How does your solution stand out from others in the market?"
      },
      {
        title: "Target Audience",
        question: "Who are your primary customers or users, and what do they value most?"
      },
      {
        title: "Impact and Results",
        question: "What measurable impact have you achieved so far, or what are you aiming for?"
      },
      {
        title: "Scalability and Vision",
        question: "How do you plan to scale this solution, and what is your long-term vision?"
      }
    ]
  };
  
  // Default configuration values for Lightbulbs
  const defaultLightbulbsPromptConfig = {
    agentName: "",
    programName: "",
    questionnaireName: "", 
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
        question: "Which story specifically inspired you? Could you briefly describe it?"
      },
      {
        title: "Light Bulb Moment",
        question: "What about this nugget inspired you to think, 'We could try this here'?"
      },
      {
        title: "From Inspiration to Action",
        question: "What did this nugget inspire you to do? Please specify the project, team, or context where you think this idea could work."
      },
      {
        title: "Implementation Steps",
        question: "What concrete steps will you take to bring this idea to life in your own context?"
      },
      {
        title: "Timeline for Action",
        question: "By when do you plan to test or implement this idea?"
      },
      {
        title: "Testing and Success Measures",
        question: "How will you test this idea to see if it gains traction? What will success look like?"
      },
      {
        title: "Challenges and Solutions",
        question: "What potential challenges do you anticipate in implementing this idea, and how could you overcome them?"
      },
      {
        title: "Long-Term Impact",
        question: "If this idea works, what could the long-term impact be for your team or business unit?"
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
  
  // Initialize local config once when component mounts or when sessionConfig changes
  useEffect(() => {
    if (sessionConfig && sessionConfig.nuggetsPromptConfig) {
      // Ensure all required properties exist by merging with defaults
      setLocalConfig({
        ...defaultNuggetsPromptConfig,
        ...sessionConfig.nuggetsPromptConfig,
        // Ensure arrays are never undefined
        rules: sessionConfig.nuggetsPromptConfig.rules || defaultNuggetsPromptConfig.rules,
        questions: sessionConfig.nuggetsPromptConfig.questions || defaultNuggetsPromptConfig.questions
      });
    }
    
    if (sessionConfig && sessionConfig.lightbulbsPromptConfig) {
      // Ensure all required properties exist by merging with defaults
      setLocalConfig({
        ...defaultLightbulbsPromptConfig,
        ...sessionConfig.lightbulbsPromptConfig,
        // Ensure arrays are never undefined
        rules: sessionConfig.lightbulbsPromptConfig.rules || defaultLightbulbsPromptConfig.rules,
        questions: sessionConfig.lightbulbsPromptConfig.questions || defaultLightbulbsPromptConfig.questions
      });
    }
  }, [sessionConfig]);
  
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

  // Update local state without immediately validating
  const handleLocalChange = (field, value) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Don't clear validation state immediately, let the Input component handle it
    handleChange(field, value);
  };

  // Validate a single field
  const validateField = async (field, value) => {
    // Ne pas valider les champs vides pendant la saisie
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
      // Les autres champs ne nécessitent pas de validation pendant la saisie
      default:
        return { isValid: true, message: '' };
    }

    return { isValid, message };
  };

  // Apply all local changes to the parent state
  const applyChanges = async () => {
    const fields = ['agentName', 'programName', 'teacherName', 'location', 'venue', 'agentPersonality'];
    let isValid = true;
    const newValidationState = {};

    // Valider tous les champs lors de la soumission
    await Promise.all(
      fields.map(async (field) => {
        const result = await validateField(field, localConfig[field]);
        newValidationState[field] = result;
        if (!result.isValid) isValid = false;
      })
    );

    setValidationState(newValidationState);

    if (isValid) {
      updateSessionConfig({
        ...sessionConfig,
        ...localConfig
      });
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
    
    // Generate rules section with safe access
    const rulesSection = (config.rules || []).map((rule, index) => 
      `${index + 1}. ${rule.startsWith("**") ? rule : `**${(rule.split(":")[0] || "Rule")}**: ${(rule.split(":")[1] || rule)}`}`
    ).join("\n");
    
    // Generate questions section with safe access
    const questionsSection = (config.questions || []).map((q, index) => 
      `${index + 1}. **${q.title || `Question ${index + 1}`}**:  \n   "${q.question || "No question provided"}"\n   `
    ).join("\n");
    
    return `# Objective
You are a dedicated support agent named "${config.agentName || "AI Agent"}" responsible for engaging participants in the "${config.programName || "Workshop"}" event questionnaire. Your main goal is to collect accurate and structured responses to key questions while adhering to identification protocols for secure and personalized interactions.

# Style
"Maintain a ${config.agentPersonality || "professional, friendly"} tone to make participants feel comfortable and engaged. Use clear sentences, bullet points for clarity, and light emojis to keep the conversation approachable but professional."

# Rules

${rulesSection}

# Interaction Example

### Step 1: Identification
- Start the conversation: 
  "Hi! Welcome to "${config.programName || "Workshop"}". Participants told ole that your had a great story ! Im your AI Journalist for today. So tell me what's your famous story !  😊"

### Step 2: Required Questions (this question are template)
${questionsSection}

### Step 3: Closing the Discussion
- End on a positive and engaging note:  
  "Ok, now let's refocus back on "${config.teacherName || "the facilitator"}", and we'll take a look at everyone's input together! Thanks so much for your time and your responses. If there's anything else you'd like to share, feel free to reach out. Have an amazing day! 🚀"`;
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
    
    // Build the prompt using the configuration
    return `You are ${config.agentName || "an AI assistant"} ${config.agentPersonality ? `with a ${config.agentPersonality} personality` : ""}.

This is a Lightbulbs session for the ${config.programName || "[program name]"} ${config.questionnaireName ? `in the "${config.questionnaireName}" questionnaire` : ""}.
${config.location ? `You are interacting with participants at ${config.location}` : ""}
${config.venue ? `The venue is ${config.venue}` : ""}

Your job is to facilitate the sharing of ideas that participants have gained from listening to others' stories.

Follow these rules:
${config.rules.map(rule => `- ${rule}`).join('\n')}

Ask the following questions in order:
${config.questions.map(q => `- ${q.title}: ${q.question}`).join('\n')}

Begin by introducing yourself and asking the first question.`;
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
            <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl mb-6 shadow-inner">
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
                    onChange={(e) => handleLocalChange('agentName', e.target.value)}
                    validate={(value) => validateField('agentName', value)}
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
                    onChange={(e) => handleLocalChange('programName', e.target.value)}
                    validate={(value) => validateField('programName', value)}
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
                    onChange={(e) => handleLocalChange('teacherName', e.target.value)}
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
                    onChange={(e) => handleLocalChange('location', e.target.value)}
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
                    onChange={(e) => handleLocalChange('venue', e.target.value)}
                    placeholder="Enter the specific venue (e.g., Conference Center, Grand Hotel)"
                    className="focus:ring-2 focus:ring-purple-400"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    The specific venue or building where the event is being held.
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <Input
                    label="Agent Personality"
                    value={localConfig.agentPersonality || ""}
                    onChange={(e) => handleLocalChange('agentPersonality', e.target.value)}
                    placeholder="Enter personality traits (e.g., professional, friendly, energetic, young)"
                    className="focus:ring-2 focus:ring-purple-400"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Personality traits that define how the AI agent communicates (comma-separated).
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={applyChanges}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0"
                >
                  Save Changes
                </button>
                </div>
                </div>
            
            {/* Rules Configuration */}
            <div className="mt-10 border-t pt-8">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-medium text-gray-800 text-lg">Conversation Rules</h4>
                <button
                  onClick={() => {
                    const newRules = [...localConfig.rules, "New rule: Description of the rule"];
                    handleLocalChange('rules', newRules);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
                >
                  <span className="mr-2">+</span> Add Rule
                </button>
              </div>
              
              <div className="space-y-6 mb-6">
                {(localConfig.rules || []).map((rule, index) => (
                  <div key={index} className="flex items-start gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
                    <div className="flex-grow">
              <textarea
                        value={rule}
                        onChange={(e) => {
                          const newRules = [...localConfig.rules];
                          newRules[index] = e.target.value;
                          handleLocalChange('rules', newRules);
                        }}
                        className="input w-full h-28 p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 transition-shadow duration-200"
                        placeholder="Rule description..."
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        Tip: Use "Title: Description" format for better formatting.
              </p>
            </div>
                    <button
                      onClick={() => {
                        const newRules = localConfig.rules.filter((_, i) => i !== index);
                        handleLocalChange('rules', newRules);
                      }}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm hover:shadow-md"
                    >
                      ✕
                    </button>
          </div>
                ))}
        </div>
        
              <div className="mt-6 flex justify-end">
                <button
                  onClick={applyChanges}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0"
                >
                  Save Rules
                </button>
              </div>
            </div>
            
            {/* Questions Configuration */}
            <div className="mt-10 border-t pt-8">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-medium text-gray-800 text-lg">Template Questions</h4>
                <button
                  onClick={() => {
                    const newQuestions = [...localConfig.questions, { title: "New Question", question: "" }];
                    handleLocalChange('questions', newQuestions);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
                >
                  <span className="mr-2">+</span> Add Question
                </button>
              </div>
              
              <div className="space-y-8 mb-6">
                {(localConfig.questions || []).map((q, index) => (
                  <div key={index} className="border-2 rounded-xl p-6 bg-gradient-to-r from-gray-50 to-white shadow-md transition-all duration-300 hover:shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="font-medium text-lg text-gray-800">Question {index + 1}</h5>
                      <button
                        onClick={() => {
                          const newQuestions = localConfig.questions.filter((_, i) => i !== index);
                          handleLocalChange('questions', newQuestions);
                        }}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm hover:shadow-md"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="space-y-5">
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title
                        </label>
                        <Input
                          value={q.title || ""}
                          onChange={(e) => {
                            const newQuestions = localConfig.questions.map((q, i) =>
                              i === index ? { ...q, title: e.target.value } : q
                            );
                            handleLocalChange('questions', newQuestions);
                          }}
                          placeholder="Question title/category"
                          className="focus:ring-2 focus:ring-purple-400"
                        />
          </div>

                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question
              </label>
              <textarea
                          value={q.question || ""}
                          onChange={(e) => {
                            const newQuestions = localConfig.questions.map((q, i) =>
                              i === index ? { ...q, question: e.target.value } : q
                            );
                            handleLocalChange('questions', newQuestions);
                          }}
                          className="input w-full h-28 p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 transition-shadow duration-200"
                          placeholder="The actual question text..."
                        />
            </div>
          </div>
                  </div>
                ))}
        </div>
        
              <div className="mt-6 flex justify-end">
                <button
                  onClick={applyChanges}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0"
                >
                  Save Questions
                </button>
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
        <div className="bg-gradient-to-r from-amber-100 to-yellow-50 border-l-4 border-amber-500 p-6 mb-8 rounded-r-lg shadow-md">
          <p className="text-amber-800 text-lg">
            Configure the AI Lightbulbs agent that will interact with participants who choose to discuss their ideas.
            This is optional and can be turned off if not needed.
          </p>
        </div>

        {/* AI Lightbulbs Configuration */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-6 border border-amber-200">
          <Checkbox
            label="Enable AI Lightbulbs"
            checked={enableIdeaSharingInteraction !== false}
            onChange={(value) => handleChange('enableIdeaSharingInteraction', value)}
          />
          <p className="text-sm text-gray-600 ml-6 mt-2">
            When enabled, participants can choose to discuss their ideas with the AI Lightbulbs agent.
          </p>
        </div>

        {enableIdeaSharingInteraction !== false && (
          <>
            <CollapsibleSection 
              title="Configure your AI" 
              isOpen={showAIConfig}
              onToggle={() => setShowAIConfig(!showAIConfig)}
              icon="💡"
              color="amber"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <Input
                    label="Agent Name"
                    value={localConfig.agentName || ""}
                    onChange={(e) => handleLocalChange('agentName', e.target.value)}
                    validate={(value) => validateField('agentName', value)}
                    error={validationState.agentName?.message}
                    placeholder="Enter the AI agent's name (e.g., Elias, Sonia)"
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
                    onChange={(e) => handleLocalChange('programName', e.target.value)}
                    validate={(value) => validateField('programName', value)}
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
                    onChange={(e) => handleLocalChange('location', e.target.value)}
                    placeholder="Enter the city or location"
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
                    onChange={(e) => handleLocalChange('venue', e.target.value)}
                    placeholder="Enter the specific venue"
                    className="focus:ring-2 focus:ring-amber-400"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    The specific venue or building where the event is being held.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <Input
                    label="Agent Personality"
                    value={localConfig.agentPersonality || ""}
                    onChange={(e) => handleLocalChange('agentPersonality', e.target.value)}
                    placeholder="Enter personality traits"
                    className="focus:ring-2 focus:ring-amber-400"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Personality traits that define how the AI agent communicates.
                  </p>
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
                      onChange={(e) => handleChange('lightBulbsBookTitle', e.target.value)}
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
          </>
        )}
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