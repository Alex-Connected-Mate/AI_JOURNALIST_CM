import { z } from 'zod';

export const sessionSettingsSchema = z.object({
  institution: z.string().optional(),
  professorName: z.string().optional(),
  showProfessorName: z.boolean().optional(),
  maxParticipants: z.number().min(1).max(9999),
  connection: z.object({
    anonymityLevel: z.enum(['semi-anonymous', 'anonymous', 'non-anonymous', 'fully-anonymous']),
    loginMethod: z.enum(['email', 'code', 'none']),
    approvalRequired: z.boolean(),
    color: z.string(),
    emoji: z.string()
  }),
  discussion: z.record(z.any()),
  aiInteraction: z.object({
    enabled: z.boolean(),
    configuration: z.object({
      nuggets: z.object({
        style: z.any(),
        rules: z.array(z.string()),
        enabled: z.boolean()
      }),
      lightbulbs: z.object({
        style: z.any(),
        rules: z.array(z.string()),
        enabled: z.boolean()
      })
    })
  })
});

export const validateSessionSettings = (settings: unknown) => {
  return sessionSettingsSchema.parse(settings);
}; 