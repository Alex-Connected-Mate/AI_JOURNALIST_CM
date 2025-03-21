export type AnonymityLevel = 'semi-anonymous' | 'anonymous' | 'non-anonymous' | 'fully-anonymous';
export type LoginMethod = 'email' | 'code' | 'none';

export interface SessionConfigType {
  title: string;
  description: string;
  maxParticipants: number;
  institution: string;
  professorName: string;
  showProfessorName: boolean;
  connection: {
    anonymityLevel: AnonymityLevel;
    loginMethod: LoginMethod;
    approvalRequired: boolean;
  };
  aiInteraction: {
    enabled: boolean;
    configuration: {
      nuggets: {
        style: Record<string, unknown>;
        rules: string[];
        enabled: boolean;
      };
      lightbulbs: {
        style: Record<string, unknown>;
        rules: string[];
        enabled: boolean;
      };
    };
  };
} 