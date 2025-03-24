import React, { useState, useEffect } from 'react';
const { Card, CardContent } = require('@/components/ui/card');
const { Button } = require('@/components/ui/button');
const { Input } = require('@/components/ui/input');
const { Textarea } = require('@/components/ui/textarea');
const { Tabs, TabsContent, TabsList, TabsTrigger } = require('@/components/ui/tabs');
const { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,  } = require('@/components/ui/dialog');
const { Switch } = require('@/components/ui/switch');
const { Label } = require('@/components/ui/label');
const { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } = require('@/components/ui/tooltip');
const { parsePrompt, generatePrompt } = require('@/lib/promptParser');

/**
 * Nuggets Agent Default Prompt Template
 */
const DEFAULT_NUGGETS_PROMPT = `# Objective
You are a dedicated support agent named "{{agentName}}" responsible for engaging participants in the "{{programName}}" event questionnaire organized by "{{organizationName}}". Your main goal is to collect accurate and structured responses to key questions while adhering to identification protocols for secure and personalized interactions.

# Style
"{{styleDescription}}"

# Rules
{{rules}}

# Interaction Example

### Step 1: Identification
- Start the conversation: 
  "Hi! Welcome to "{{programName}}" by {{organizationName}}. Participants told me that you had a great story! I'm your AI Journalist for today. So tell me what's your famous story! 😊"

### Step 2: Required Questions (this question are template)
{{questions}}

### Step 3: Closing the Discussion
- End on a positive and engaging note:  
  "Ok, now let's refocus back on "{{teacherName}}", and we'll take a look at everyone's input together! Thanks so much for your time and your responses. If there's anything else you'd like to share, feel free to reach out. Have an amazing day! 🚀"`;

/**
 * Lightbulbs Agent Default Prompt Template
 */
const DEFAULT_LIGHTBULBS_PROMPT = `# Objective
You are a dedicated support agent named "{{agentName}}" responsible for conducting the "{{programName}}" "Final Light Bulb Questionnaire" for {{organizationName}}. Your objective is to guide each participant through every mandatory question, ensuring responses are complete, detailed, and reflect the transition from inspiration to action within the "Nexus" framework. Use cross-referencing to link responses to previously identified nuggets where relevant, and maintain focus on actionable plans and future impact.

# Style
{{styleDescription}}

# Rules
{{rules}}

# Steps
{{questions}}

# Closing the Discussion
After confirming all responses are complete, the agent should conclude with a personalized and lighthearted closing message.

Rules for the Closing Message:
1. Mention Annecy and the specific context (e.g., being at the Palace de Menthon, the weather, etc.).
2. Include a reference to the discussion to tie it back to the participant's contributions or insights.
3. Add a touch of humor to make the participant smile (e.g., a joke about the rain, the lake, or the setting).
4. Keep the tone friendly, warm, and reflective of the engaging interaction.

End with a reference back to "{{teacherName}}" to transition back to the workshop context.`;

// Nuggets agent default values
const DEFAULT_NUGGETS_AGENT_NAME = "Elias";
const DEFAULT_NUGGETS_PROGRAM_NAME = "Connected Mate Workshop";
const DEFAULT_NUGGETS_TEACHER_NAME = "the instructor";
const DEFAULT_NUGGETS_ORGANIZATION_NAME = "Connected Mate";
const DEFAULT_NUGGETS_STYLE = "Maintain a professional and friendly tone to make participants feel comfortable and engaged. Use clear sentences, bullet points for clarity, and light emojis to keep the conversation approachable but professional.";

const DEFAULT_NUGGETS_RULES = [
  {
    id: "rule1",
    text: "Assure participants that there information will remain confidential and used solely for identification purposes if they ask us to delete their workshop data."
  },
  {
    id: "rule2",
    text: "**Sequential Flow**: \n   - Ask each required question in order and proceed only after receiving a full response."
  },
  {
    id: "rule3",
    text: "**Clarification**: \n   - If a response is incomplete or unclear, ask for additional details politely before moving on."
  },
  {
    id: "rule4",
    text: "**No Skipped Questions**: \n   - All the required questions must be addressed without skipping or rephrasing unless necessary for clarity."
  },
  {
    id: "rule5",
    text: "**End of Conversation**: \n   - Conclude the conversation only after confirming that all responses are complete."
  }
];

const DEFAULT_NUGGETS_QUESTIONS = [
  {
    id: "q1",
    title: "Problem and Opportunity",
    text: "What is the main problem or opportunity your business is addressing?"
  },
  {
    id: "q2",
    title: "Unique Solution",
    text: "How does your solution stand out from others in the market?"
  },
  {
    id: "q3",
    title: "Target Audience",
    text: "Who are your primary customers or users, and what do they value most?"
  },
  {
    id: "q4",
    title: "Impact and Results",
    text: "What measurable impact have you achieved so far, or what are you aiming for?"
  },
  {
    id: "q5", 
    title: "Scalability and Vision",
    text: "How do you plan to scale this solution, and what is your long-term vision?"
  }
];

// Lightbulbs agent default values
const DEFAULT_LIGHTBULBS_AGENT_NAME = "Sonia";
const DEFAULT_LIGHTBULBS_PROGRAM_NAME = "Connected Mate Workshop";
const DEFAULT_LIGHTBULBS_TEACHER_NAME = "the instructor";
const DEFAULT_LIGHTBULBS_ORGANIZATION_NAME = "Connected Mate";
const DEFAULT_LIGHTBULBS_STYLE = "Your tone should be professional, supportive, and attentive. Structure the conversation to promote clarity and ease, utilizing bullet points, well-organized steps, and supportive language. Add emojis as needed to make the interaction engaging and welcoming.";

const DEFAULT_LIGHTBULBS_RULES = [
  {
    id: "rule1",
    text: "Sequential Questioning: Follow the designated order for each question, only proceeding after receiving a complete response."
  },
  {
    id: "rule2",
    text: "Cross-Referencing: Ensure each response ties back to the \"nugget\" that inspired the participant, prompting elaboration if connections aren't clear."
  },
  {
    id: "rule3",
    text: "Clarification: Seek detailed clarifications when responses lack depth or completeness."
  },
  {
    id: "rule4",
    text: "Completion Requirement: Every question must be fully answered to conclude the questionnaire. Confirm all necessary details are captured for each response."
  }
];

const DEFAULT_LIGHTBULBS_QUESTIONS = [
  {
    id: "q1",
    title: "Step 1: Inspiration Nugget Reference",
    text: "Which nugget specifically inspired you? Could you briefly describe it?\n\nObjective: Identify the inspiration source to ensure a clear cross-reference between nuggets and insights."
  },
  {
    id: "q2",
    title: "Step 2: Light Bulb Moment",
    text: "What about this nugget inspired you to think, 'We could try this here'?\n\nObjective: Capture what resonated with the participant, highlighting the motivational trigger."
  },
  {
    id: "q3",
    title: "Step 3: From Inspiration to Action",
    text: "What did this nugget inspire you to do? Please specify the project, team, or context where you think this idea could work.\n\nObjective: Link inspiration to a concrete action plan or context for application."
  },
  {
    id: "q4",
    title: "Step 4: Implementation Steps",
    text: "What concrete steps will you take to bring this idea to life in your own context?\n\nObjective: Define specific, actionable steps, encouraging clear and practical strategies."
  },
  {
    id: "q5",
    title: "Step 5: Timeline for Action",
    text: "By when do you plan to test or implement this idea?\n\nObjective: Establish a timeline, prompting commitment to a timeframe."
  },
  {
    id: "q6",
    title: "Step 6: Testing and Success Measures",
    text: "How will you test this idea to see if it gains traction? What will success look like?\n\nObjective: Promote experimentation, defining success metrics for evaluation."
  },
  {
    id: "q7",
    title: "Step 7: Challenges and Solutions",
    text: "What potential challenges do you anticipate in implementing this idea, and how could you overcome them?\n\nObjective: Encourage proactive thinking about obstacles and solutions."
  },
  {
    id: "q8",
    title: "Step 8: Long-Term Impact",
    text: "If this idea works, what could the long-term impact be for your team or business unit?\n\nObjective: Have participants reflect on potential broader impacts and strategic alignment with Nexus goals."
  }
];

/**
 * AIPromptEditor Component
 * 
 * A component for editing AI agent prompts that integrates with the Session Flow interface.
 * This component provides a simplified interface for editing the prompt and a raw view
 * for advanced users.
 * 
 * @param {Object} props - Component props
 * @param {string} props.initialPrompt - The initial prompt text
 * @param {'nuggets'|'lightbulbs'} props.agentType - The type of agent (nuggets or lightbulbs)
 * @param {Function} props.onPromptChange - Callback when the prompt changes
 * @param {boolean} props.showFullPrompt - Whether to show the full prompt or a simplified view
 * @param {Function} props.onToggleFullPrompt - Callback to toggle the full prompt view
 */
const AIPromptEditor = ({ 
  initialPrompt, 
  agentType, 
  onPromptChange,
  showFullPrompt = false,
  onToggleFullPrompt
}) => {
  const [rawPrompt, setRawPrompt] = useState(initialPrompt || '');
  const [parsedData, setParsedData] = useState({
    agentName: '',
    programName: '',
    teacherName: '',
    style: '',
    rules: [],
    questions: []
  });
  const [isDirty, setIsDirty] = useState(false);

  // Parse the initial prompt when component mounts or when initialPrompt changes
  useEffect(() => {
    if (initialPrompt) {
      const extracted = parsePrompt(initialPrompt);
      setParsedData(extracted);
      setRawPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Generate a new prompt when parsedData changes
  useEffect(() => {
    if (isDirty) {
      const generated = generatePrompt(parsedData, agentType);
      setRawPrompt(generated);
      onPromptChange(generated);
    }
  }, [parsedData, agentType, isDirty, onPromptChange]);

  // Handle form field changes
  const handleInputChange = (field, value) => {
    setParsedData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  };

  // Handle raw prompt changes
  const handleRawPromptChange = (e) => {
    const value = e.target.value;
    setRawPrompt(value);
    onPromptChange(value);
    
    // Parse the new prompt to update the form fields
    const extracted = parsePrompt(value);
    setParsedData(extracted);
    setIsDirty(false);
  };

  // Render the full prompt view (raw text)
  const renderFullPromptView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">Raw Prompt</label>
        <button 
          onClick={onToggleFullPrompt}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Hide Full Prompt
        </button>
      </div>
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
  );

  // Render the simplified prompt view (form fields)
  const renderSimplifiedPromptView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">Agent Prompt</label>
        <button 
          onClick={onToggleFullPrompt}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Show Full Prompt
        </button>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">
        Configure the parameters below to customize the agent's behavior.
        The prompt template includes variables like agent name, program name, etc.
      </p>
      
      {/* Form fields for editing the prompt */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Style Description
          </label>
          <textarea
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 min-h-[100px]"
            value={parsedData.style || ''}
            onChange={(e) => handleInputChange('style', e.target.value)}
            placeholder="Describe the agent's communication style"
          />
        </div>
        
        <div>
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
                  onChange={(e) => {
                    const newRules = [...parsedData.rules];
                    newRules[index] = e.target.value;
                    handleInputChange('rules', newRules);
                  }}
                />
                <button
                  onClick={() => {
                    const newRules = parsedData.rules.filter((_, i) => i !== index);
                    handleInputChange('rules', newRules);
                  }}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="Remove rule"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Add a new rule"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    const newRules = [...(parsedData.rules || []), e.target.value.trim()];
                    handleInputChange('rules', newRules);
                    e.target.value = '';
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.target.previousSibling;
                  if (input.value.trim()) {
                    const newRules = [...(parsedData.rules || []), input.value.trim()];
                    handleInputChange('rules', newRules);
                    input.value = '';
                  }
                }}
                className="p-1 text-blue-500 hover:text-blue-700"
                title="Add rule"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Questions
          </label>
          <div className="space-y-2">
            {parsedData.questions && parsedData.questions.map((question, index) => (
              <div key={index} className="flex items-center gap-2">
                <textarea
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                  value={question}
                  onChange={(e) => {
                    const newQuestions = [...parsedData.questions];
                    newQuestions[index] = e.target.value;
                    handleInputChange('questions', newQuestions);
                  }}
                  rows={2}
                />
                <button
                  onClick={() => {
                    const newQuestions = parsedData.questions.filter((_, i) => i !== index);
                    handleInputChange('questions', newQuestions);
                  }}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="Remove question"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            
            <div className="flex items-center gap-2">
              <textarea
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                placeholder="Add a new question"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey && e.target.value.trim()) {
                    const newQuestions = [...(parsedData.questions || []), e.target.value.trim()];
                    handleInputChange('questions', newQuestions);
                    e.target.value = '';
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const textarea = e.target.previousSibling;
                  if (textarea.value.trim()) {
                    const newQuestions = [...(parsedData.questions || []), textarea.value.trim()];
                    handleInputChange('questions', newQuestions);
                    textarea.value = '';
                  }
                }}
                className="p-1 text-blue-500 hover:text-blue-700"
                title="Add question"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Press Ctrl+Enter to add a new question
          </p>
        </div>
      </div>
    </div>
  );

  return showFullPrompt ? renderFullPromptView() : renderSimplifiedPromptView();
};

module.exports = AIPromptEditor; 