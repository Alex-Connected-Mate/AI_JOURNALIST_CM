import { supabase } from '@/lib/supabase';

// Mock OpenAI API key - in production, this would be loaded from environment variables
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'sk-mock-key';

/**
 * AI Agent Service
 * 
 * This service handles interactions with OpenAI for prompt validation and agent creation.
 */
class AIAgentService {
  /**
   * Validate a prompt with OpenAI
   * 
   * @param {string} prompt - The prompt to validate
   * @returns {Promise<Object>} - Validation results
   */
  static async validatePrompt(prompt) {
    try {
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
      
      // In development mode or without an API key, return mock data
      if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-mock-key' || process.env.NODE_ENV === 'development') {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return {
          valid: true,
          feedback: "This prompt is clear, coherent, and provides good guidance for the AI agent. It effectively structures the interview process and provides clear examples.",
          suggestions: [
            "Consider adding instructions for handling technical issues during the conversation",
            "You might want to include more specific examples of follow-up questions",
            "Adding guidelines for handling sensitive or personal information could improve data protection"
          ]
        };
      }
      
      // In production, call the OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are an expert prompt engineer and evaluator.' },
            { role: 'user', content: validationPrompt }
          ],
          temperature: 0.3
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      const resultContent = data.choices[0]?.message?.content;
      
      if (!resultContent) {
        throw new Error('Invalid response from OpenAI API');
      }
      
      try {
        // Try to parse the JSON response
        const parsedResult = JSON.parse(resultContent);
        return parsedResult;
      } catch (parseError) {
        // If JSON parsing fails, extract information from the text response
        console.error('Failed to parse JSON response:', parseError);
        
        // Simple fallback extraction
        const isValid = !resultContent.toLowerCase().includes('invalid') && 
                       !resultContent.toLowerCase().includes('unclear') &&
                       !resultContent.toLowerCase().includes('ineffective');
        
        return {
          valid: isValid,
          feedback: resultContent.split('\n').slice(0, 3).join(' '),
          suggestions: resultContent.toLowerCase().includes('suggestion') ? 
            resultContent.split('\n').filter(line => 
              line.includes('-') || line.includes('•') || /^\d+\./.test(line)
            ) : []
        };
      }
    } catch (error) {
      console.error('Error validating prompt:', error);
      throw error;
    }
  }
  
  /**
   * Create or update an OpenAI assistant with the given prompt
   * 
   * @param {string} agentType - The type of agent (nuggets or lightbulbs)
   * @param {string} prompt - The system prompt for the assistant
   * @param {string} workshopId - The ID of the workshop
   * @returns {Promise<Object>} - The created/updated assistant data
   */
  static async createOrUpdateAssistant(agentType, prompt, workshopId) {
    try {
      // Check if an assistant already exists for this workshop and agent type
      const { data: existingAssistant, error: queryError } = await supabase
        .from('ai_assistants')
        .select('*')
        .eq('workshop_id', workshopId)
        .eq('agent_type', agentType)
        .single();
      
      if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw queryError;
      }
      
      // In development mode or without an API key, use mock data
      if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-mock-key' || process.env.NODE_ENV === 'development') {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const assistantId = existingAssistant?.assistant_id || `asst_mock_${Date.now()}`;
        
        // Save the assistant data to the database
        if (existingAssistant) {
          // Update existing record
          const { error } = await supabase
            .from('ai_assistants')
            .update({
              assistant_id: assistantId,
              prompt: prompt,
              updated_at: new Date()
            })
            .eq('id', existingAssistant.id);
          
          if (error) throw error;
        } else {
          // Create new record
          const { error } = await supabase
            .from('ai_assistants')
            .insert([{
              workshop_id: workshopId,
              agent_type: agentType,
              assistant_id: assistantId,
              prompt: prompt,
              created_at: new Date(),
              updated_at: new Date()
            }]);
          
          if (error) throw error;
        }
        
        return {
          id: assistantId,
          name: agentType === 'nuggets' ? 'Elias (Nuggets Agent)' : 'Sonia (Lightbulbs Agent)',
          model: 'gpt-4',
          instructions: prompt
        };
      }
      
      // In production, call the OpenAI API
      let assistantId = existingAssistant?.assistant_id;
      let apiResponse;
      
      if (assistantId) {
        // Update existing assistant
        apiResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v1'
          },
          body: JSON.stringify({
            instructions: prompt,
            name: agentType === 'nuggets' ? 'Elias (Nuggets Agent)' : 'Sonia (Lightbulbs Agent)'
          })
        });
      } else {
        // Create new assistant
        apiResponse = await fetch('https://api.openai.com/v1/assistants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v1'
          },
          body: JSON.stringify({
            model: 'gpt-4-1106-preview',
            instructions: prompt,
            name: agentType === 'nuggets' ? 'Elias (Nuggets Agent)' : 'Sonia (Lightbulbs Agent)'
          })
        });
      }
      
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const assistant = await apiResponse.json();
      
      // Save the assistant data to the database
      if (existingAssistant) {
        // Update existing record
        const { error } = await supabase
          .from('ai_assistants')
          .update({
            assistant_id: assistant.id,
            prompt: prompt,
            updated_at: new Date()
          })
          .eq('id', existingAssistant.id);
        
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('ai_assistants')
          .insert([{
            workshop_id: workshopId,
            agent_type: agentType,
            assistant_id: assistant.id,
            prompt: prompt,
            created_at: new Date(),
            updated_at: new Date()
          }]);
        
        if (error) throw error;
      }
      
      return assistant;
    } catch (error) {
      console.error('Error creating/updating assistant:', error);
      throw error;
    }
  }
  
  /**
   * Create a new thread for a conversation with an assistant
   * 
   * @param {string} assistantId - The ID of the OpenAI assistant
   * @param {string} participantId - The ID of the participant
   * @returns {Promise<Object>} - The created thread data
   */
  static async createThread(assistantId, participantId) {
    try {
      // In development mode or without an API key, use mock data
      if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-mock-key' || process.env.NODE_ENV === 'development') {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const threadId = `thread_mock_${Date.now()}`;
        
        // Store the thread info in the database
        const { error } = await supabase
          .from('ai_threads')
          .insert([{
            thread_id: threadId,
            assistant_id: assistantId,
            participant_id: participantId,
            created_at: new Date()
          }]);
        
        if (error) throw error;
        
        return { id: threadId };
      }
      
      // In production, call the OpenAI API
      const response = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v1'
        },
        body: JSON.stringify({
          metadata: {
            participant_id: participantId
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const thread = await response.json();
      
      // Store the thread info in the database
      const { error } = await supabase
        .from('ai_threads')
        .insert([{
          thread_id: thread.id,
          assistant_id: assistantId,
          participant_id: participantId,
          created_at: new Date()
        }]);
      
      if (error) throw error;
      
      return thread;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }
}

export default AIAgentService; 