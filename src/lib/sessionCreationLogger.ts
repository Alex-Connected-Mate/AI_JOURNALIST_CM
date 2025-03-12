import { useEffect, useRef } from 'react';

// Types d'actions pour la création de session
export enum SessionCreationAction {
  STEP_CHANGE = 'step_change',
  FIELD_UPDATE = 'field_update',
  VALIDATION_ERROR = 'validation_error',
  TEMPLATE_USED = 'template_used', 
  DEFAULT_VALUE_USED = 'default_value_used',
  PROFILE_INFO_USED = 'profile_info_used',
  FIELD_RESET = 'field_reset',
  IMAGE_SELECTED = 'image_selected',
  IMAGE_UPLOADED = 'image_uploaded',
  API_CALL_START = 'api_call_start',
  API_CALL_SUCCESS = 'api_call_success',
  API_CALL_ERROR = 'api_call_error',
  NAVIGATION = 'navigation'
}

// Interface pour le log d'action
export interface SessionCreationLog {
  timestamp: string;
  action: SessionCreationAction | string; // Permet aussi des strings pour compatibilité
  step?: string;
  field?: string;
  value?: any;
  details?: object;
  message?: string;
}

// Interface pour le contexte de création de session
export interface SessionCreationContext {
  userId: string | null;
  startedAt: string;
  steps: {
    [key: string]: {
      visited: boolean;
      completedAt: string | null;
      timeSpent: number;
    }
  };
  currentValues: Record<string, any>;
  fieldHistory: {
    [key: string]: Array<{
      timestamp: string;
      value: any;
      source: 'user' | 'profile' | 'default' | 'template';
    }>
  };
  logs: SessionCreationLog[];
}

// Crée un nouveau contexte vide
const createNewContext = (userId: string | null): SessionCreationContext => ({
  userId,
  startedAt: new Date().toISOString(),
  steps: {},
  currentValues: {},
  fieldHistory: {},
  logs: []
});

// Hook personnalisé pour le logging de création de session
export const useSessionCreationLogger = (userId: string | null) => {
  // Utiliser useRef pour stocker le contexte afin d'éviter les re-renders
  const contextRef = useRef<SessionCreationContext>(createNewContext(userId));
  
  // Réinitialiser le contexte si l'userId change
  useEffect(() => {
    contextRef.current = createNewContext(userId);
  }, [userId]);
  
  // Fonction pour ajouter un log
  const logAction = (
    action: SessionCreationAction | string,
    details: {
      step?: string;
      field?: string;
      value?: any;
      details?: object;
      message?: string;
    } = {}
  ) => {
    const log: SessionCreationLog = {
      timestamp: new Date().toISOString(),
      action,
      ...details
    };
    
    // Ajouter au tableau de logs
    contextRef.current.logs.push(log);
    
    // Mise à jour du contexte en fonction de l'action
    switch (action) {
      case SessionCreationAction.STEP_CHANGE:
        if (details.step) {
          // Initialiser l'étape si c'est la première visite
          if (!contextRef.current.steps[details.step]) {
            contextRef.current.steps[details.step] = {
              visited: true,
              completedAt: null,
              timeSpent: 0
            };
          }
        }
        break;
        
      case SessionCreationAction.FIELD_UPDATE:
        if (details.field) {
          // Mettre à jour la valeur actuelle
          contextRef.current.currentValues[details.field] = details.value;
          
          // Ajouter à l'historique du champ
          if (!contextRef.current.fieldHistory[details.field]) {
            contextRef.current.fieldHistory[details.field] = [];
          }
          
          contextRef.current.fieldHistory[details.field].push({
            timestamp: log.timestamp,
            value: details.value,
            source: 'user'
          });
        }
        break;
        
      case SessionCreationAction.PROFILE_INFO_USED:
        if (details.field) {
          // Mettre à jour la valeur actuelle
          contextRef.current.currentValues[details.field] = details.value;
          
          // Ajouter à l'historique du champ
          if (!contextRef.current.fieldHistory[details.field]) {
            contextRef.current.fieldHistory[details.field] = [];
          }
          
          contextRef.current.fieldHistory[details.field].push({
            timestamp: log.timestamp,
            value: details.value,
            source: 'profile'
          });
        }
        break;
        
      case SessionCreationAction.DEFAULT_VALUE_USED:
      case SessionCreationAction.TEMPLATE_USED:
        if (details.field) {
          // Mettre à jour la valeur actuelle
          contextRef.current.currentValues[details.field] = details.value;
          
          // Ajouter à l'historique du champ
          if (!contextRef.current.fieldHistory[details.field]) {
            contextRef.current.fieldHistory[details.field] = [];
          }
          
          contextRef.current.fieldHistory[details.field].push({
            timestamp: log.timestamp,
            value: details.value,
            source: action === SessionCreationAction.TEMPLATE_USED ? 'template' : 'default'
          });
        }
        break;
    }
    
    // Afficher dans la console pour debugging
    console.log(`🔍 [SESSION_CREATION] ${action}`, details);
    
    return log;
  };
  
  // Fonction pour marquer une étape comme complétée
  const completeStep = (step: string) => {
    if (contextRef.current.steps[step]) {
      contextRef.current.steps[step].completedAt = new Date().toISOString();
      logAction(SessionCreationAction.STEP_CHANGE, { 
        step, 
        message: `Step ${step} completed` 
      });
    }
  };
  
  // Obtenir un résumé de la session en cours
  const getSessionSummary = () => {
    const { logs, currentValues, steps, startedAt } = contextRef.current;
    
    // Calculer des statistiques
    const totalDuration = new Date().getTime() - new Date(startedAt).getTime();
    const fieldsChanged = Object.keys(currentValues).length;
    const stepsVisited = Object.keys(steps).length;
    const stepsCompleted = Object.values(steps).filter(s => s.completedAt).length;
    
    return {
      startedAt,
      duration: totalDuration,
      fieldsChanged,
      stepsVisited,
      stepsCompleted,
      finalValues: { ...currentValues },
      logs: [...logs]
    };
  };
  
  // Exporter les logs pour débogage
  const exportLogs = () => {
    return contextRef.current.logs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      let message = `[${time}] [${log.action}]`;
      
      if (log.step) message += ` STEP: ${log.step}`;
      if (log.field) message += ` FIELD: ${log.field}`;
      if (log.value !== undefined) {
        const valueStr = typeof log.value === 'object' 
          ? JSON.stringify(log.value) 
          : String(log.value);
        message += ` VALUE: ${valueStr.substring(0, 50)}${valueStr.length > 50 ? '...' : ''}`;
      }
      if (log.message) message += ` - ${log.message}`;
      
      return message;
    }).join('\n');
  };
  
  return {
    logAction,
    completeStep,
    getSessionSummary,
    exportLogs,
    context: contextRef.current
  };
}; 