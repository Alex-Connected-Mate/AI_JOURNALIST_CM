import OpenAI from 'openai';
import { supabase } from './supabase';
import { checkAIUsage } from './sessionLimits';

class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIError';
  }
}

class AIManager {
  private openai: OpenAI;
  private userId: string;
  private sessionId: string;

  constructor(apiKey: string, userId: string, sessionId: string) {
    this.openai = new OpenAI({ apiKey });
    this.userId = userId;
    this.sessionId = sessionId;
  }

  private async checkUsageLimit(): Promise<void> {
    const { canUse, reason } = await checkAIUsage(this.userId);
    if (!canUse) {
      throw new AIError(
        reason || 'AI usage limit reached',
        'USAGE_LIMIT_EXCEEDED',
        false
      );
    }
  }

  private async updateTokenUsage(tokens: number): Promise<void> {
    try {
      await supabase.rpc('increment_ai_tokens', {
        p_user_id: this.userId,
        p_tokens: tokens,
      });
    } catch (error) {
      console.error('Failed to update token usage:', error);
    }
  }

  private async handleAPIError(error: any): Promise<never> {
    console.error('OpenAI API Error:', error);

    if (error instanceof OpenAI.APIError) {
      switch (error.status) {
        case 401:
          throw new AIError('Invalid API key', 'INVALID_API_KEY', false);
        case 429:
          throw new AIError('Rate limit exceeded', 'RATE_LIMIT', true);
        case 500:
          throw new AIError('OpenAI server error', 'SERVER_ERROR', true);
        default:
          throw new AIError(
            error.message || 'Unknown API error',
            'API_ERROR',
            error.status < 500
          );
      }
    }

    throw new AIError(
      error.message || 'Unknown error',
      'UNKNOWN_ERROR',
      false
    );
  }

  async generateResponse(
    prompt: string,
    config: {
      model: string;
      temperature?: number;
      max_tokens?: number;
      presence_penalty?: number;
      frequency_penalty?: number;
    }
  ): Promise<string> {
    try {
      // Check usage limits
      await this.checkUsageLimit();

      // Make API call
      const completion = await this.openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: config.model,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.max_tokens ?? 2000,
        presence_penalty: config.presence_penalty ?? 0,
        frequency_penalty: config.frequency_penalty ?? 0,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new AIError('No response from AI', 'NO_RESPONSE', true);
      }

      // Update token usage
      await this.updateTokenUsage(completion.usage?.total_tokens || 0);

      // Log the interaction
      await supabase.from('ai_interactions').insert({
        session_id: this.sessionId,
        user_id: this.userId,
        prompt,
        response,
        tokens_used: completion.usage?.total_tokens || 0,
        model: config.model,
        created_at: new Date().toISOString(),
      });

      return response;
    } catch (error) {
      return this.handleAPIError(error);
    }
  }

  async analyzeSession(): Promise<{
    summary: string;
    keyInsights: string[];
    recommendations: string[];
  }> {
    try {
      // Get session messages
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('content, is_ai')
        .eq('session_id', this.sessionId)
        .order('created_at', { ascending: true });

      if (!messages || messages.length === 0) {
        throw new AIError('No messages to analyze', 'NO_CONTENT', false);
      }

      // Prepare conversation history
      const conversation = messages
        .map((m) => `${m.is_ai ? 'AI' : 'User'}: ${m.content}`)
        .join('\n');

      // Generate analysis
      const analysisPrompt = `
        Analyze this conversation and provide:
        1. A concise summary
        2. Key insights (maximum 5)
        3. Actionable recommendations (maximum 3)

        Conversation:
        ${conversation}
      `;

      const response = await this.generateResponse(analysisPrompt, {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 1000,
      });

      // Parse response
      const sections = response.split('\n\n');
      return {
        summary: sections[0]?.replace('Summary:', '').trim() || '',
        keyInsights: sections[1]
          ?.replace('Key Insights:', '')
          .trim()
          .split('\n')
          .map((s) => s.replace(/^\d+\.\s*/, ''))
          .filter(Boolean) || [],
        recommendations: sections[2]
          ?.replace('Recommendations:', '')
          .trim()
          .split('\n')
          .map((s) => s.replace(/^\d+\.\s*/, ''))
          .filter(Boolean) || [],
      };
    } catch (error) {
      return this.handleAPIError(error);
    }
  }
}

export function createAIManager(apiKey: string, userId: string, sessionId: string) {
  return new AIManager(apiKey, userId, sessionId);
} 