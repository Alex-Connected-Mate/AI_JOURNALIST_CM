import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';

/**
 * Nuggets Agent Default Prompt Template
 */
const DEFAULT_NUGGETS_PROMPT = `# Objective
You are a dedicated support agent named "{{agentName}}" responsible for engaging participants in the "{{programName}}" event questionnaire. Your main goal is to collect accurate and structured responses to key questions while adhering to identification protocols for secure and personalized interactions.

# Style
"{{styleDescription}}"

# Rules
{{rules}}

# Interaction Example

### Step 1: Identification
- Start the conversation: 
  "Hi! Welcome to "{{programName}}". Participants told ole that your had a great story ! Im your AI Journalist for today. So tell me what's your famous story !  😊"

### Step 2: Required Questions (this question are template)
{{questions}}

### Step 3: Closing the Discussion
- End on a positive and engaging note:  
  "Ok, now let's refocus back on "{{teacherName}}", and we'll take a look at everyone's input together! Thanks so much for your time and your responses. If there's anything else you'd like to share, feel free to reach out. Have an amazing day! 🚀"`;

// Default values
const DEFAULT_AGENT_NAME = "Elias";
const DEFAULT_PROGRAM_NAME = "Connected Mate Workshop";
const DEFAULT_TEACHER_NAME = "the instructor";
const DEFAULT_STYLE = "Maintain a professional and friendly tone to make participants feel comfortable and engaged. Use clear sentences, bullet points for clarity, and light emojis to keep the conversation approachable but professional.";

const DEFAULT_RULES = [
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

const DEFAULT_QUESTIONS = [
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

/**
 * AI Prompt Editor Component
 * 
 * This component provides an interface for editing the AI prompt configuration
 * for the Nuggets agent. It allows customization of various parts of the prompt
 * including agent name, style, rules, and questions.
 */
const AIPromptEditor = ({ 
  initialConfig = null, 
  onSave, 
  onValidate, 
  agentType = 'nuggets'
}) => {
  // Initialize state with default or provided configuration
  const [config, setConfig] = useState({
    agentName: initialConfig?.agentName || DEFAULT_AGENT_NAME,
    programName: initialConfig?.programName || DEFAULT_PROGRAM_NAME,
    teacherName: initialConfig?.teacherName || DEFAULT_TEACHER_NAME,
    styleDescription: initialConfig?.styleDescription || DEFAULT_STYLE,
    rules: initialConfig?.rules || [...DEFAULT_RULES],
    questions: initialConfig?.questions || [...DEFAULT_QUESTIONS],
    customContext: initialConfig?.customContext || "",
    rawPrompt: initialConfig?.rawPrompt || null
  });

  const [activeTab, setActiveTab] = useState('basics');
  const [promptPreview, setPromptPreview] = useState('');
  const [useCustomPrompt, setUseCustomPrompt] = useState(!!config.rawPrompt);
  const [validation, setValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  // New item states
  const [newRule, setNewRule] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState({ title: '', text: '' });

  // Generate the complete prompt based on the configuration
  useEffect(() => {
    if (useCustomPrompt && config.rawPrompt) {
      setPromptPreview(config.rawPrompt);
      return;
    }

    let prompt = DEFAULT_NUGGETS_PROMPT;
    
    // Replace placeholders with values
    prompt = prompt.replace(/{{agentName}}/g, config.agentName);
    prompt = prompt.replace(/{{programName}}/g, config.programName);
    prompt = prompt.replace(/{{teacherName}}/g, config.teacherName);
    prompt = prompt.replace(/{{styleDescription}}/g, config.styleDescription);

    // Format rules
    const formattedRules = config.rules.map((rule, index) => 
      `${index + 1}. ${rule.text}`
    ).join('\n\n');
    prompt = prompt.replace(/{{rules}}/g, formattedRules);

    // Format questions
    const formattedQuestions = config.questions.map((question, index) => 
      `${index + 1}. **${question.title}**:  \n   "${question.text}"`
    ).join('\n   \n');
    prompt = prompt.replace(/{{questions}}/g, formattedQuestions);

    // Add custom context if provided
    if (config.customContext) {
      prompt = `${prompt}\n\n# Additional Context\n${config.customContext}`;
    }

    setPromptPreview(prompt);
  }, [config, useCustomPrompt]);

  // Handle changes to basic configuration
  const handleBasicConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle changes to custom prompt
  const handleCustomPromptChange = (value) => {
    setConfig(prev => ({
      ...prev,
      rawPrompt: value
    }));
  };

  // Add a new rule
  const handleAddRule = () => {
    if (!newRule.trim()) return;

    const rule = {
      id: `rule${Date.now()}`,
      text: newRule
    };

    setConfig(prev => ({
      ...prev,
      rules: [...prev.rules, rule]
    }));
    setNewRule('');
  };

  // Edit an existing rule
  const handleEditRule = (id, newText) => {
    setConfig(prev => ({
      ...prev,
      rules: prev.rules.map(rule => 
        rule.id === id ? { ...rule, text: newText } : rule
      )
    }));
  };

  // Delete a rule
  const handleDeleteRule = (id) => {
    setConfig(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule.id !== id)
    }));
  };

  // Start editing a question
  const startEditQuestion = (question) => {
    setEditingQuestionId(question.id);
    setEditingQuestion({
      title: question.title,
      text: question.text
    });
  };

  // Save edited question
  const saveEditedQuestion = () => {
    if (!editingQuestion.title || !editingQuestion.text) return;

    setConfig(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === editingQuestionId 
          ? { ...q, title: editingQuestion.title, text: editingQuestion.text } 
          : q
      )
    }));

    // Reset editing state
    setEditingQuestionId(null);
    setEditingQuestion({ title: '', text: '' });
  };

  // Cancel question editing
  const cancelEditQuestion = () => {
    setEditingQuestionId(null);
    setEditingQuestion({ title: '', text: '' });
  };

  // Add a new question
  const handleAddQuestion = () => {
    const newQuestion = {
      id: `q${Date.now()}`,
      title: "New Question",
      text: "Enter your question here"
    };

    setConfig(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    // Start editing the new question
    startEditQuestion(newQuestion);
  };

  // Delete a question
  const handleDeleteQuestion = (id) => {
    setConfig(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  };

  // Move a question up or down in the order
  const handleMoveQuestion = (id, direction) => {
    const questions = [...config.questions];
    const index = questions.findIndex(q => q.id === id);
    if (index < 0) return;

    // Calculate new index
    const newIndex = direction === 'up' 
      ? Math.max(0, index - 1) 
      : Math.min(questions.length - 1, index + 1);
    
    // Don't do anything if already at the limit
    if (newIndex === index) return;

    // Swap questions
    [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];

    setConfig(prev => ({
      ...prev,
      questions
    }));
  };

  // Toggle between custom and template prompt
  const handleToggleCustomPrompt = () => {
    if (!useCustomPrompt) {
      // Switching to custom prompt - use current generated prompt as starting point
      setConfig(prev => ({
        ...prev,
        rawPrompt: promptPreview
      }));
    }
    setUseCustomPrompt(!useCustomPrompt);
  };

  // Validate the prompt with OpenAI
  const handleValidatePrompt = async () => {
    setIsValidating(true);
    setValidation(null);

    try {
      // If onValidate is provided, call it with the current promptPreview
      if (onValidate) {
        const result = await onValidate(promptPreview);
        setValidation(result);
      } else {
        // Mock validation response for development
        setTimeout(() => {
          setValidation({
            valid: true,
            feedback: "This prompt is well-structured and clear. It provides good guidance for the AI agent to conduct interviews effectively.",
            suggestions: [
              "Consider adding more specific instructions about handling technical issues",
              "You might want to include examples of follow-up questions for clarity"
            ]
          });
        }, 1500);
      }
    } catch (error) {
      setValidation({
        valid: false,
        feedback: "An error occurred during validation",
        error: error.message
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Save the configuration
  const handleSave = () => {
    // Prepare the complete configuration including the generated prompt
    const finalConfig = {
      ...config,
      generatedPrompt: promptPreview
    };

    // Call the onSave callback with the final configuration
    if (onSave) {
      onSave(finalConfig);
    }
  };

  // Reset to default configuration
  const handleResetToDefault = () => {
    setConfig({
      agentName: DEFAULT_AGENT_NAME,
      programName: DEFAULT_PROGRAM_NAME,
      teacherName: DEFAULT_TEACHER_NAME,
      styleDescription: DEFAULT_STYLE,
      rules: [...DEFAULT_RULES],
      questions: [...DEFAULT_QUESTIONS],
      customContext: "",
      rawPrompt: null
    });
    setUseCustomPrompt(false);
  };

  return (
    <div className="ai-prompt-editor space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="basics" className="flex-1">Basic Info</TabsTrigger>
          <TabsTrigger value="style" className="flex-1">Communication Style</TabsTrigger>
          <TabsTrigger value="rules" className="flex-1">Rules</TabsTrigger>
          <TabsTrigger value="questions" className="flex-1">Questions</TabsTrigger>
          <TabsTrigger value="preview" className="flex-1">Preview & Validate</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basics" className="py-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-xl font-semibold mb-4">Basic Agent Configuration</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agentName">Agent Name</Label>
                  <Input
                    id="agentName"
                    value={config.agentName}
                    onChange={(e) => handleBasicConfigChange('agentName', e.target.value)}
                    placeholder="Enter agent name"
                  />
                  <p className="text-sm text-gray-500">
                    This name will be used to identify the AI agent in conversations
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="programName">Program Name</Label>
                  <Input
                    id="programName"
                    value={config.programName}
                    onChange={(e) => handleBasicConfigChange('programName', e.target.value)}
                    placeholder="Enter program name"
                  />
                  <p className="text-sm text-gray-500">
                    The name of the program or workshop this agent will be used in
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacherName">Instructor/Teacher Name</Label>
                  <Input
                    id="teacherName"
                    value={config.teacherName}
                    onChange={(e) => handleBasicConfigChange('teacherName', e.target.value)}
                    placeholder="Enter instructor name"
                  />
                  <p className="text-sm text-gray-500">
                    The name of the instructor or facilitator leading the session
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customContext">Additional Context (Optional)</Label>
                  <Textarea
                    id="customContext"
                    value={config.customContext}
                    onChange={(e) => handleBasicConfigChange('customContext', e.target.value)}
                    placeholder="Add any additional context or special instructions for the agent"
                    rows={4}
                  />
                  <p className="text-sm text-gray-500">
                    This additional context will be included at the end of the prompt
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication Style Tab */}
        <TabsContent value="style" className="py-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-xl font-semibold mb-4">Communication Style</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="styleDescription">Style Description</Label>
                  <Textarea
                    id="styleDescription"
                    value={config.styleDescription}
                    onChange={(e) => handleBasicConfigChange('styleDescription', e.target.value)}
                    placeholder="Describe how the AI should communicate"
                    rows={6}
                  />
                  <p className="text-sm text-gray-500">
                    Describe the tone, language style, and approach the agent should use
                  </p>
                </div>

                <div className="pt-4">
                  <h3 className="text-md font-medium mb-2">Style Presets</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleBasicConfigChange('styleDescription', "Maintain a professional and friendly tone to make participants feel comfortable and engaged. Use clear sentences, bullet points for clarity, and light emojis to keep the conversation approachable but professional.")}
                    >
                      Professional & Friendly
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleBasicConfigChange('styleDescription', "Be conversational and casual, using everyday language to create a relaxed atmosphere. Feel free to use emojis and casual expressions to make the participant feel like they're chatting with a friend.")}
                    >
                      Casual & Conversational
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleBasicConfigChange('styleDescription', "Use a direct, concise approach with minimal small talk. Focus on gathering information efficiently while still being polite. Avoid unnecessary chatter and keep the conversation focused on the questionnaire.")}
                    >
                      Direct & Efficient
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleBasicConfigChange('styleDescription', "Be enthusiastic and encouraging, using positive language and affirmations throughout the conversation. Celebrate the participant's responses and show genuine interest in their answers with supportive comments.")}
                    >
                      Enthusiastic & Supportive
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="py-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-xl font-semibold mb-4">Agent Rules</h2>
              
              <div className="space-y-6">
                {/* Add new rule */}
                <div className="flex gap-2">
                  <Textarea
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="Enter a new rule for the agent to follow"
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleAddRule} 
                    disabled={!newRule.trim()}
                    className="self-end"
                  >
                    Add Rule
                  </Button>
                </div>

                {/* Rules list */}
                <div className="space-y-4">
                  <h3 className="text-md font-medium">Current Rules</h3>
                  {config.rules.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No rules defined. Add some rules to guide the agent's behavior.</p>
                  ) : (
                    <div className="space-y-4">
                      {config.rules.map((rule, index) => (
                        <div key={rule.id} className="rounded-md border p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="font-medium">Rule {index + 1}</div>
                            <div className="flex space-x-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      onClick={() => handleDeleteRule(rule.id)}
                                    >
                                      Delete
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete this rule</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                          <Textarea
                            value={rule.text}
                            onChange={(e) => handleEditRule(rule.id, e.target.value)}
                            rows={3}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reset to default button */}
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      rules: [...DEFAULT_RULES]
                    }))}
                  >
                    Reset to Default Rules
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="py-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Interview Questions</h2>
                <Button onClick={handleAddQuestion}>
                  Add Question
                </Button>
              </div>
              
              <div className="space-y-6 mt-4">
                {config.questions.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No questions defined. Add some questions for the agent to ask participants.</p>
                ) : (
                  <div className="space-y-6">
                    {config.questions.map((question, index) => (
                      <div key={question.id} className="rounded-md border p-4 space-y-3">
                        {editingQuestionId === question.id ? (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`question-title-${question.id}`}>Question Title</Label>
                              <Input
                                id={`question-title-${question.id}`}
                                value={editingQuestion.title}
                                onChange={(e) => setEditingQuestion(prev => ({
                                  ...prev,
                                  title: e.target.value
                                }))}
                                placeholder="Enter question title"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`question-text-${question.id}`}>Question Text</Label>
                              <Textarea
                                id={`question-text-${question.id}`}
                                value={editingQuestion.text}
                                onChange={(e) => setEditingQuestion(prev => ({
                                  ...prev,
                                  text: e.target.value
                                }))}
                                placeholder="Enter question text"
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                onClick={cancelEditQuestion}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={saveEditedQuestion}
                                disabled={!editingQuestion.title || !editingQuestion.text}
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start">
                              <div className="font-medium">
                                Question {index + 1}: {question.title}
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleMoveQuestion(question.id, 'up')}
                                  disabled={index === 0}
                                >
                                  ↑
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleMoveQuestion(question.id, 'down')}
                                  disabled={index === config.questions.length - 1}
                                >
                                  ↓
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => startEditQuestion(question)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleDeleteQuestion(question.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-line">{question.text}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reset to default button */}
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      questions: [...DEFAULT_QUESTIONS]
                    }))}
                  >
                    Reset to Default Questions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview & Validate Tab */}
        <TabsContent value="preview" className="py-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Prompt Preview & Validation</h2>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="custom-prompt"
                    checked={useCustomPrompt}
                    onCheckedChange={handleToggleCustomPrompt}
                  />
                  <Label htmlFor="custom-prompt">Use Custom Prompt</Label>
                </div>
              </div>
              
              <div className="space-y-4">
                {useCustomPrompt ? (
                  <div className="space-y-2">
                    <Label htmlFor="rawPrompt">Custom Prompt</Label>
                    <Textarea
                      id="rawPrompt"
                      value={config.rawPrompt || ''}
                      onChange={(e) => handleCustomPromptChange(e.target.value)}
                      placeholder="Enter your custom prompt here"
                      rows={15}
                      className="font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500">
                      Warning: Using a custom prompt will override all other configurations
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Generated Prompt</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowFullPrompt(!showFullPrompt)}
                      >
                        {showFullPrompt ? 'Show Less' : 'Show Full Prompt'}
                      </Button>
                    </div>
                    <div className="relative">
                      <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap font-mono text-sm overflow-auto max-h-96">
                        {showFullPrompt ? promptPreview : promptPreview.split('\n').slice(0, 15).join('\n') + '\n...'}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 mt-6">
                  <Button onClick={handleValidatePrompt} disabled={isValidating}>
                    {isValidating ? 'Validating...' : 'Validate with OpenAI'}
                  </Button>
                  <Button variant="outline" onClick={handleResetToDefault}>
                    Reset to Default
                  </Button>
                </div>

                {/* Validation Results */}
                {validation && (
                  <div className={`p-4 rounded-md mt-4 ${validation.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <h3 className={`font-semibold ${validation.valid ? 'text-green-700' : 'text-red-700'}`}>
                      Validation {validation.valid ? 'Passed' : 'Failed'}
                    </h3>
                    <p className="mt-2">{validation.feedback}</p>
                    
                    {validation.suggestions && validation.suggestions.length > 0 && (
                      <div className="mt-3">
                        <h4 className="font-medium">Suggestions for improvement:</h4>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {validation.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm">{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Save button */}
              <div className="flex justify-end mt-6">
                <Button onClick={handleSave} size="lg">
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIPromptEditor; 