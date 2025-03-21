import { z } from 'zod';

const styleSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4096).optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  stopSequences: z.array(z.string()).optional(),
});

const agentConfigSchema = z.object({
  style: styleSchema,
  rules: z.array(z.string()),
  enabled: z.boolean(),
});

export const aiConfigSchema = z.object({
  nuggets: agentConfigSchema,
  lightbulbs: agentConfigSchema,
});

export const sessionAIConfigSchema = z.object({
  configuration: aiConfigSchema,
  settings: z.object({
    visibility: z.enum(['public', 'private', 'unlisted']),
    interaction_mode: z.enum(['realtime', 'delayed', 'manual']),
    response_delay: z.number().min(0).max(60).optional(),
    participation_rules: z.array(z.string()).optional(),
  }),
});

export type AIStyle = z.infer<typeof styleSchema>;
export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type AIConfig = z.infer<typeof aiConfigSchema>;
export type SessionAIConfig = z.infer<typeof sessionAIConfigSchema>;

export const aiConfigurationSchema = z.object({
  type: z.enum(['knowledge_extraction', 'idea_generation']),
  parameters: z.object({
    temperature: z.number().min(0).max(1),
    max_tokens: z.number().min(1).max(4000),
    prompt_template: z.string()
  }),
  enabled: z.boolean()
});

export const aiSettingsSchema = z.object({
  visibility: z.boolean(),
  interaction_mode: z.enum(['auto', 'manual']),
  response_delay: z.number().min(0),
  participation_rules: z.record(z.any())
});

export const validateAIConfiguration = (config: unknown) => {
  return aiConfigurationSchema.parse(config);
};

export const validateAISettings = (settings: unknown) => {
  return aiSettingsSchema.parse(settings);
}; 