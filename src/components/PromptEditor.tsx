import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { parsePrompt, generatePrompt } from '@/lib/promptParser';
import { PlusCircle, Trash2, Save } from 'lucide-react';

interface PromptEditorProps {
  initialPrompt: string;
  agentType: 'nuggets' | 'lightbulbs';
  onSave: (prompt: string, parsedData: Record<string, any>) => void;
  workshopId: string;
}

export default function PromptEditor({ initialPrompt, agentType, onSave, workshopId }: PromptEditorProps) {
  const [activeTab, setActiveTab] = useState('simplified');
  const [rawPrompt, setRawPrompt] = useState(initialPrompt);
  const [parsedData, setParsedData] = useState<Record<string, any>>({
    agentName: '',
    programName: '',
    teacherName: '',
    style: '',
    rules: [],
    questions: []
  });
  const [newRule, setNewRule] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Parse the initial prompt when component mounts
  useEffect(() => {
    if (initialPrompt) {
      const extracted = parsePrompt(initialPrompt);
      setParsedData(extracted);
      setRawPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Update raw prompt when switching to complex view
  useEffect(() => {
    if (activeTab === 'complex' && isDirty) {
      const generated = generatePrompt(parsedData, agentType);
      setRawPrompt(generated);
    }
  }, [activeTab, parsedData, agentType, isDirty]);

  // Handle form field changes
  const handleInputChange = (field: string, value: string) => {
    setParsedData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  };

  // Add a new rule
  const addRule = () => {
    if (newRule.trim()) {
      setParsedData(prev => ({
        ...prev,
        rules: [...prev.rules, newRule.trim()]
      }));
      setNewRule('');
      setIsDirty(true);
    }
  };

  // Remove a rule
  const removeRule = (index: number) => {
    setParsedData(prev => ({
      ...prev,
      rules: prev.rules.filter((_: string, i: number) => i !== index)
    }));
    setIsDirty(true);
  };

  // Add a new question
  const addQuestion = () => {
    if (newQuestion.trim()) {
      setParsedData(prev => ({
        ...prev,
        questions: [...prev.questions, newQuestion.trim()]
      }));
      setNewQuestion('');
      setIsDirty(true);
    }
  };

  // Remove a question
  const removeQuestion = (index: number) => {
    setParsedData(prev => ({
      ...prev,
      questions: prev.questions.filter((_: string, i: number) => i !== index)
    }));
    setIsDirty(true);
  };

  // Handle raw prompt changes
  const handleRawPromptChange = (value: string) => {
    setRawPrompt(value);
    setIsDirty(true);
  };

  // Handle save
  const handleSave = () => {
    let finalPrompt = rawPrompt;
    let finalData = parsedData;

    // If we're in simplified view, generate the prompt from the form data
    if (activeTab === 'simplified') {
      finalPrompt = generatePrompt(parsedData, agentType);
    } else {
      // If we're in complex view, parse the raw prompt to get the structured data
      finalData = parsePrompt(rawPrompt);
    }

    onSave(finalPrompt, finalData);
    setIsDirty(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {agentType === 'nuggets' ? 'AI Nuggets Prompt Editor' : 'AI Lightbulbs Prompt Editor'}
        </CardTitle>
        <CardDescription>
          Edit the prompt for the {agentType === 'nuggets' ? 'Nuggets' : 'Lightbulbs'} AI agent
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="simplified">Simplified View</TabsTrigger>
            <TabsTrigger value="complex">Complex View</TabsTrigger>
          </TabsList>

          <TabsContent value="simplified">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="agentName">Agent Name</Label>
                <Input
                  id="agentName"
                  value={parsedData.agentName || ''}
                  onChange={(e) => handleInputChange('agentName', e.target.value)}
                  placeholder="Enter agent name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="programName">Program Name</Label>
                <Input
                  id="programName"
                  value={parsedData.programName || ''}
                  onChange={(e) => handleInputChange('programName', e.target.value)}
                  placeholder="Enter program name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacherName">Teacher Name</Label>
                <Input
                  id="teacherName"
                  value={parsedData.teacherName || ''}
                  onChange={(e) => handleInputChange('teacherName', e.target.value)}
                  placeholder="Enter teacher name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Style Description</Label>
                <Textarea
                  id="style"
                  value={parsedData.style || ''}
                  onChange={(e) => handleInputChange('style', e.target.value)}
                  placeholder="Describe the agent's communication style"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Rules</Label>
                <div className="space-y-2">
                  {parsedData.rules && parsedData.rules.map((rule: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={rule} readOnly className="flex-1" />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeRule(index)}
                        title="Remove rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="Add a new rule"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addRule}
                    title="Add rule"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Questions</Label>
                <div className="space-y-2">
                  {parsedData.questions && parsedData.questions.map((question: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Textarea
                        value={question}
                        readOnly
                        className="flex-1"
                        rows={2}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                        title="Remove question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Textarea
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Add a new question"
                    className="flex-1"
                    rows={2}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                    title="Add question"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="complex">
            <div className="space-y-4">
              <Label htmlFor="rawPrompt">Raw Prompt</Label>
              <Textarea
                id="rawPrompt"
                value={rawPrompt}
                onChange={(e) => handleRawPromptChange(e.target.value)}
                placeholder="Enter the raw prompt"
                className="font-mono text-sm"
                rows={20}
              />
              <p className="text-sm text-gray-500">
                Edit the raw prompt directly. This gives you full control over the prompt structure and content.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={!isDirty}>
            <Save className="mr-2 h-4 w-4" />
            Save Prompt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 