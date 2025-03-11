import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AIPromptConfigProps {
  onSave: (config: AIPromptConfig) => void;
  initialConfig?: AIPromptConfig;
}

interface AIPromptConfig {
  agentName: string;
  programName: string;
  teacherName: string;
  customQuestions: {
    id: string;
    question: string;
  }[];
}

const DEFAULT_QUESTIONS = [
  {
    id: '1',
    question: 'What is the main problem or opportunity your business is addressing?'
  },
  {
    id: '2',
    question: 'How does your solution stand out from others in the market?'
  },
  {
    id: '3',
    question: 'Who are your primary customers or users, and what do they value most?'
  },
  {
    id: '4',
    question: 'What measurable impact have you achieved so far, or what are you aiming for?'
  },
  {
    id: '5',
    question: 'How do you plan to scale this solution, and what is your long-term vision?'
  }
];

export function AIPromptConfig({ onSave, initialConfig }: AIPromptConfigProps) {
  const [config, setConfig] = useState<AIPromptConfig>({
    agentName: initialConfig?.agentName || '',
    programName: initialConfig?.programName || '',
    teacherName: initialConfig?.teacherName || '',
    customQuestions: initialConfig?.customQuestions || DEFAULT_QUESTIONS
  });

  const [activeTab, setActiveTab] = useState('config');

  const updateConfig = (field: keyof AIPromptConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuestionChange = (id: string, newQuestion: string) => {
    setConfig(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.map(q =>
        q.id === id ? { ...q, question: newQuestion } : q
      )
    }));
  };

  const addQuestion = () => {
    const newId = (config.customQuestions.length + 1).toString();
    setConfig(prev => ({
      ...prev,
      customQuestions: [
        ...prev.customQuestions,
        { id: newId, question: '' }
      ]
    }));
  };

  const removeQuestion = (id: string) => {
    setConfig(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.filter(q => q.id !== id)
    }));
  };

  const generatePrompt = () => {
    return `# Objective
You are a dedicated support agent named "${config.agentName}" responsible for engaging participants in the "${config.programName}" event questionnaire. Your main goal is to collect accurate and structured responses to key questions while adhering to identification protocols for secure and personalized interactions.

# Style
"Maintain a professional and friendly tone to make participants feel comfortable and engaged. Use clear sentences, bullet points for clarity, and light emojis to keep the conversation approachable but professional."

# Rules
1. Assure participants that there information will remain confidential and used solely for identification purposes if they ask us to delete their workshop data.
2. **Sequential Flow**:
   - Ask each required question in order and proceed only after receiving a full response.
3. **Clarification**:
   - If a response is incomplete or unclear, ask for additional details politely before moving on.
4. **No Skipped Questions**:
   - All the required questions must be addressed without skipping or rephrasing unless necessary for clarity.
5. **End of Conversation**:
   - Conclude the conversation only after confirming that all responses are complete.

# Interaction Example

### Step 1: Identification
- Start the conversation:
  "Hi! Welcome to "${config.programName}". Participants told me that you had a great story! I'm your AI Journalist for today. So tell me what's your famous story! 😊"

### Step 2: Required Questions
${config.customQuestions.map((q, index) => `
${index + 1}. **Question ${index + 1}**:
   "${q.question}"
`).join('\n')}

### Step 3: Closing the Discussion
- End on a positive and engaging note:
  "Ok, now let's refocus back on "${config.teacherName}", and we'll take a look at everyone's input together! Thanks so much for your time and your responses. If there's anything else you'd like to share, feel free to reach out. Have an amazing day!"`;
  };

  return (
    <Card className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Configuration</h3>
              <Input
                label="Agent Name"
                value={config.agentName}
                onChange={(e) => updateConfig('agentName', e.target.value)}
                placeholder="Enter agent name"
              />
              <Input
                label="Program Name"
                value={config.programName}
                onChange={(e) => updateConfig('programName', e.target.value)}
                placeholder="Enter program name"
              />
              <Input
                label="Teacher Name"
                value={config.teacherName}
                onChange={(e) => updateConfig('teacherName', e.target.value)}
                placeholder="Enter teacher name"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Custom Questions</h3>
                <Button onClick={addQuestion} variant="outline" size="sm">
                  Add Question
                </Button>
              </div>
              
              {config.customQuestions.map((q, index) => (
                <div key={q.id} className="flex gap-2">
                  <Input
                    value={q.question}
                    onChange={(e) => handleQuestionChange(q.id, e.target.value)}
                    placeholder={`Question ${index + 1}`}
                  />
                  <Button
                    onClick={() => removeQuestion(q.id)}
                    variant="destructive"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <Button onClick={() => onSave(config)} className="w-full">
              Save Configuration
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm">
              {generatePrompt()}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 