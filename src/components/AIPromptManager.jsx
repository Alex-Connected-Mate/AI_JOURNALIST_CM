import React, { useState, useEffect } from 'react';
const { useToast } = require('@/components/ui/use-toast');
const { Card, CardContent } = require('@/components/ui/card');
const { Button } = require('@/components/ui/button');
const { Tabs, TabsContent, TabsList, TabsTrigger } = require('@/components/ui/tabs');
const AIPromptEditor = require('@/components/AIPromptEditor');
const { supabase } = require('@/lib/supabase');

/**
 * AI Prompt Manager Component
 *
 * This component is responsible for managing AI prompts for Nuggets and Lightbulbs agents.
 * It integrates with OpenAI for prompt validation and Supabase for data persistence.
 */
const AIPromptManager = ({ 
  agentType = 'nuggets',
  workshop = null,
  userId = null,
  onSaveComplete
}) => {
  const { toast } = useToast();
  const [promptConfig, setPromptConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(agentType);

  // Load the current prompt configuration from the database
  useEffect(() => {
    const loadPromptConfig = async () => {
      if (!workshop?.id) return;
      
      setIsLoading(true);
      
      try {
        // Query the database for the current prompt configuration
        const { data, error } = await supabase
          .from('agent_prompts')
          .select('*')
          .eq('workshop_id', workshop.id)
          .eq('agent_type', activeTab)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
          console.error('Error loading prompt config:', error);
          return;
        }
        
        // Create default configuration based on workshop data and agent type
        const defaultConfig = {
          agentName: activeTab === 'nuggets' ? 'Elias' : 'Sonia',
          programName: workshop.name || 'Connected Mate Workshop',
          teacherName: workshop.instructor || workshop.teacher_name || 'the instructor',
          organizationName: workshop.organization || 'Connected Mate',
          styleDescription: activeTab === 'nuggets' 
            ? "Maintain a professional and friendly tone to make participants feel comfortable and engaged. Use clear sentences, bullet points for clarity, and light emojis to keep the conversation approachable but professional."
            : "Your tone should be professional, supportive, and attentive. Structure the conversation to promote clarity and ease, utilizing bullet points, well-organized steps, and supportive language. Add emojis as needed to make the interaction engaging and welcoming.",
          rules: [],
          questions: [],
          customContext: '',
          rawPrompt: null
        };
        
        if (data) {
          // Convert from database format to component format, using workshop data as fallback
          setPromptConfig({
            agentName: data.agent_name || defaultConfig.agentName,
            programName: data.program_name || defaultConfig.programName,
            teacherName: data.teacher_name || defaultConfig.teacherName,
            organizationName: data.organization_name || defaultConfig.organizationName,
            styleDescription: data.style_description || defaultConfig.styleDescription,
            rules: data.rules || [],
            questions: data.questions || [],
            customContext: data.custom_context || '',
            rawPrompt: data.raw_prompt,
            generatedPrompt: data.generated_prompt
          });
        } else {
          // No existing configuration, use defaults
          setPromptConfig(defaultConfig);
        }
      } catch (error) {
        console.error('Error in loadPromptConfig:', error);
        toast({
          variant: "destructive",
          title: "Error loading prompt configuration",
          description: error.message
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPromptConfig();
  }, [workshop, activeTab]);

  // Validate the prompt with OpenAI
  const validatePrompt = async (prompt) => {
    try {
      // This would actually call the OpenAI API in production
      // For now, we'll mock it with a simple timeout
      
      // The validation prompt sent to OpenAI could look something like:
      const validationPrompt = `
        You are an AI system prompt evaluator. Please analyze the following system prompt for clarity,
        coherence, and effectiveness. The prompt is intended for an AI assistant conducting user interviews.
        
        PROMPT TO EVALUATE:
        ${prompt}
        
        Please provide a structured evaluation with:
        1. Whether the prompt is valid (clear, coherent, and effective)
        2. Feedback on the prompt's strengths and weaknesses
        3. Specific suggestions for improvement (if any)
        
        Format your response as JSON:
        {
          "valid": true/false,
          "feedback": "Your overall feedback here",
          "suggestions": ["Suggestion 1", "Suggestion 2", ...]
        }
      `;
      
      // In production, you would call the OpenAI API here
      // const response = await openai.createChatCompletion({...});
      
      // For now, mock a successful response
      return {
        valid: true,
        feedback: "This prompt is clear, coherent, and provides good guidance for the AI agent. It effectively structures the interview process and provides clear examples.",
        suggestions: [
          "Consider adding instructions for handling technical issues during the conversation",
          "You might want to include more specific examples of follow-up questions",
          "Adding guidelines for handling sensitive or personal information could improve data protection"
        ]
      };
    } catch (error) {
      console.error('Error validating prompt:', error);
      throw error;
    }
  };

  // Save the prompt configuration to the database
  const savePromptConfig = async (config) => {
    if (!workshop?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Workshop ID is required to save prompt configuration"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Convert component format to database format
      const dbRecord = {
        workshop_id: workshop.id,
        agent_type: activeTab,
        agent_name: config.agentName,
        program_name: config.programName,
        teacher_name: config.teacherName,
        organization_name: config.organizationName,
        style_description: config.styleDescription,
        rules: config.rules,
        questions: config.questions,
        custom_context: config.customContext,
        raw_prompt: config.rawPrompt,
        generated_prompt: config.generatedPrompt,
        updated_by: userId || null,
        updated_at: new Date()
      };
      
      // Check if a record already exists
      const { data: existingData, error: checkError } = await supabase
        .from('agent_prompts')
        .select('id')
        .eq('workshop_id', workshop.id)
        .eq('agent_type', activeTab)
        .single();
      
      let result;
      
      if (existingData) {
        // Update existing record
        result = await supabase
          .from('agent_prompts')
          .update(dbRecord)
          .eq('id', existingData.id);
      } else {
        // Insert new record
        result = await supabase
          .from('agent_prompts')
          .insert([dbRecord]);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast({
        title: "Prompt configuration saved",
        description: "The prompt has been successfully saved and is ready to use."
      });
      
      // Notify parent component that save is complete
      if (onSaveComplete) {
        onSaveComplete(activeTab, config);
      }
      
    } catch (error) {
      console.error('Error saving prompt config:', error);
      toast({
        variant: "destructive",
        title: "Error saving prompt configuration",
        description: error.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="ai-prompt-manager space-y-6">
      <h1 className="text-2xl font-bold mb-4">AI Agent Prompt Configuration</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="nuggets">Nuggets Agent (Elias)</TabsTrigger>
          <TabsTrigger value="lightbulbs">Lightbulbs Agent (Sonia)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="nuggets" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Configure Nuggets Agent (Elias)</h2>
              <p className="text-gray-600 mb-6">
                This agent collects insights and information from participants. Customize how it interacts and what questions it asks.
              </p>
              
              {isLoading ? (
                <div className="py-20 text-center">
                  <p className="text-gray-500">Loading prompt configuration...</p>
                </div>
              ) : (
                <AIPromptEditor
                  initialConfig={promptConfig}
                  onSave={savePromptConfig}
                  onValidate={validatePrompt}
                  agentType="nuggets"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="lightbulbs" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Configure Lightbulbs Agent (Sonia)</h2>
              <p className="text-gray-600 mb-6">
                This agent generates creative ideas and solutions based on participant input. Customize its approach and guidance.
              </p>
              
              {isLoading ? (
                <div className="py-20 text-center">
                  <p className="text-gray-500">Loading prompt configuration...</p>
                </div>
              ) : (
                <AIPromptEditor
                  initialConfig={promptConfig}
                  onSave={savePromptConfig}
                  onValidate={validatePrompt}
                  agentType="lightbulbs"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button 
          disabled={isSaving || isLoading}
          onClick={() => {
            if (promptConfig) {
              savePromptConfig(promptConfig);
            }
          }}
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
};

module.exports = AIPromptManager; 