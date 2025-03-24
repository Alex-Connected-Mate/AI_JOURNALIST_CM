import React, { useState } from 'react';
const Input = require('./Input');
const Checkbox = require('./Checkbox');

/**
 * NexusAIJournalist Component
 * 
 * A specialized AI Journalist configuration for the Nexus X Insead questionnaire.
 * This component provides:
 * - A block explaining the AI agent's purpose
 * - A collapsible menu to modify the agent's behavior
 * - A collapsible menu to modify the chat rendering
 */
const NexusAIJournalist = ({ config, onChange }) => {
  const {
    // Agent Configuration
    agentName = "Elias",
    targetQuestions = "Nexus X Insead Final Light Bulb Questionnaire",
    companyName = "Nexus",
    contextLocation = "Annecy, at the Palace de Menthon",
    
    // Chat Rendering Configuration
    useTypingIndicator = true,
    typingSpeed = "medium",
    showTimestamps = true,
    messageStyle = "bubble",
    
    // Advanced Configuration
    enableProdding = true,
    maxSilenceTime = 15, // seconds
    maxResponseTime = 30, // seconds
  } = config || {};

  // State for collapsible sections
  const [showAgentConfig, setShowAgentConfig] = useState(false);
  const [showChatConfig, setShowChatConfig] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  const handleChange = (field, value) => {
    onChange({ 
      ...config, 
      [field]: value 
    });
  };

  // Generate the prompt with current variables
  const generatePrompt = () => {
    return `You are a dedicated support agent named "${agentName}" responsible for conducting the "${companyName} X Insead" "Final Light Bulb Questionnaire." Your objective is to guide each participant through every mandatory question, ensuring responses are complete, detailed, and reflect the transition from inspiration to action within the "${companyName}" framework. Use cross-referencing to link responses to previously identified nuggets where relevant, and maintain focus on actionable plans and future impact.

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
	•	Objective: "Have participants reflect on potential broader impacts and strategic alignment with ${companyName} goals."

Closing the Discussion:

After confirming all responses are complete, the agent should conclude with a personalized and lighthearted closing message.

Rules for the Closing Message:
	1.	"Mention ${contextLocation} and the specific context (e.g., being at the Palace de Menthon, the weather, etc.)."
	2.	Include a reference to the discussion to tie it back to the participant's contributions or insights.
	3.	"Add a touch of humor to make the participant smile (e.g., a joke about the rain, the lake, or the setting)."
	4.	"Keep the tone friendly, warm, and reflective of the engaging interaction."`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6">
        <h3 className="font-medium text-purple-800 mb-2">AI Journalist for Nexus X Insead</h3>
        <p className="text-purple-700">
          This specialized AI agent guides participants through the Nexus X Insead questionnaire,
          helping them develop "light bulb moments" inspired by previous insights ("nuggets").
        </p>
      </div>

      {/* Agent Configuration Block */}
      <div className="border rounded-lg p-4">
        <button 
          className="flex justify-between items-center w-full text-left font-medium text-gray-700"
          onClick={() => setShowAgentConfig(!showAgentConfig)}
        >
          <span>Agent Configuration</span>
          <span>{showAgentConfig ? '−' : '+'}</span>
        </button>
        
        {showAgentConfig && (
          <div className="mt-4 space-y-4">
            <Input
              label="Agent Name"
              value={agentName}
              onChange={(e) => handleChange('agentName', e.target.value)}
              placeholder="e.g., Elias"
            />
            
            <Input
              label="Company Name"
              value={companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="e.g., Nexus"
            />
            
            <Input
              label="Context Location"
              value={contextLocation}
              onChange={(e) => handleChange('contextLocation', e.target.value)}
              placeholder="e.g., Annecy, at the Palace de Menthon"
            />
          </div>
        )}
      </div>

      {/* Chat Rendering Configuration Block */}
      <div className="border rounded-lg p-4">
        <button 
          className="flex justify-between items-center w-full text-left font-medium text-gray-700"
          onClick={() => setShowChatConfig(!showChatConfig)}
        >
          <span>Chat Rendering</span>
          <span>{showChatConfig ? '−' : '+'}</span>
        </button>
        
        {showChatConfig && (
          <div className="mt-4 space-y-4">
            <Checkbox
              label="Use Typing Indicator"
              checked={useTypingIndicator}
              onChange={(value) => handleChange('useTypingIndicator', value)}
            />
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Typing Speed</label>
              <select
                value={typingSpeed}
                onChange={(e) => handleChange('typingSpeed', e.target.value)}
                className="input"
                disabled={!useTypingIndicator}
              >
                <option value="slow">Slow</option>
                <option value="medium">Medium</option>
                <option value="fast">Fast</option>
              </select>
            </div>
            
            <Checkbox
              label="Show Timestamps"
              checked={showTimestamps}
              onChange={(value) => handleChange('showTimestamps', value)}
            />
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Message Style</label>
              <select
                value={messageStyle}
                onChange={(e) => handleChange('messageStyle', e.target.value)}
                className="input"
              >
                <option value="bubble">Bubble</option>
                <option value="flat">Flat</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Prompt Preview Block */}
      <div className="border rounded-lg p-4">
        <button 
          className="flex justify-between items-center w-full text-left font-medium text-gray-700"
          onClick={() => setShowPromptPreview(!showPromptPreview)}
        >
          <span>Prompt Preview</span>
          <span>{showPromptPreview ? '−' : '+'}</span>
        </button>
        
        {showPromptPreview && (
          <div className="mt-4">
            <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
              {generatePrompt()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

module.exports = NexusAIJournalist; 