import { supabase } from '@/lib/supabase';

export class AgentService {
  /**
   * Create a new agent with all its configurations
   */
  static async createAgent(agentData) {
    try {
      // 1. Create the main agent record
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .insert([{
          name: agentData.name,
          description: agentData.description,
          image_url: agentData.imageUrl,
          agent_type: agentData.agentType,
          created_by: agentData.userId
        }])
        .select()
        .single();

      if (agentError) throw agentError;

      // 2. Create the prompt configuration
      const { error: promptError } = await supabase
        .from('agent_prompts')
        .insert([{
          agent_id: agent.id,
          style: agentData.style,
          rules: agentData.rules,
          questions: agentData.questions,
          template_version: '1.0',
          base_prompt: agentData.basePrompt,
          created_by: agentData.userId
        }]);

      if (promptError) throw promptError;

      // 3. Create the analysis configuration
      const { error: analysisError } = await supabase
        .from('agent_analysis_config')
        .insert([{
          agent_id: agent.id,
          analysis_type: agentData.analysisType,
          parameters: agentData.analysisParameters,
          enabled: true
        }]);

      if (analysisError) throw analysisError;

      // 4. Create the book configuration if provided
      if (agentData.book) {
        const { error: bookError } = await supabase
          .from('agent_books')
          .insert([{
            agent_id: agent.id,
            title: agentData.book.title,
            description: agentData.book.description,
            content: agentData.book.content,
            settings: agentData.book.settings
          }]);

        if (bookError) throw bookError;
      }

      return agent;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  }

  /**
   * Get complete agent configuration including prompts, analysis, and book
   */
  static async getAgentConfiguration(agentId) {
    try {
      const [
        { data: agent, error: agentError },
        { data: prompt, error: promptError },
        { data: analysis, error: analysisError },
        { data: book, error: bookError }
      ] = await Promise.all([
        supabase.from('agents').select('*').eq('id', agentId).single(),
        supabase.from('agent_prompts').select('*').eq('agent_id', agentId).single(),
        supabase.from('agent_analysis_config').select('*').eq('agent_id', agentId).single(),
        supabase.from('agent_books').select('*').eq('agent_id', agentId).single()
      ]);

      if (agentError) throw agentError;

      return {
        ...agent,
        prompt,
        analysis,
        book
      };
    } catch (error) {
      console.error('Error fetching agent configuration:', error);
      throw error;
    }
  }

  /**
   * Update agent configuration
   */
  static async updateAgentConfiguration(agentId, configData) {
    try {
      const updates = [];

      // Update main agent data if provided
      if (configData.agent) {
        updates.push(
          supabase
            .from('agents')
            .update(configData.agent)
            .eq('id', agentId)
        );
      }

      // Update prompt if provided
      if (configData.prompt) {
        updates.push(
          supabase
            .from('agent_prompts')
            .update(configData.prompt)
            .eq('agent_id', agentId)
        );
      }

      // Update analysis config if provided
      if (configData.analysis) {
        updates.push(
          supabase
            .from('agent_analysis_config')
            .update(configData.analysis)
            .eq('agent_id', agentId)
        );
      }

      // Update book if provided
      if (configData.book) {
        updates.push(
          supabase
            .from('agent_books')
            .update(configData.book)
            .eq('agent_id', agentId)
        );
      }

      await Promise.all(updates);

      return await this.getAgentConfiguration(agentId);
    } catch (error) {
      console.error('Error updating agent configuration:', error);
      throw error;
    }
  }
} 