import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SessionFlowMap from './SessionFlowMap';
import BasicInfoStep from './BasicInfoStep';
import ConnectionPhaseConfig from './ConnectionPhaseConfig';
import DiscussionPhaseConfig from './DiscussionPhaseConfig';
import AIInteractionConfig from './AIInteractionConfig';
import AnalysisPhaseConfig from './AnalysisPhaseConfig';
import ReadingPhaseConfig from './ReadingPhaseConfig';
import logger from '@/lib/logger';
import ConnectionSettings from './ConnectionSettings';
import { useStore } from '@/lib/store';
import ImageSelector from './ImageSelector';

/**
 * SessionCreationFlow Component
 * 
 * Main component that orchestrates the session creation process using a flow map visualization.
 * - Manages step navigation
 * - Maintains session configuration state
 * - Handles submission and validation
 */
const SessionCreationFlow = ({ initialConfig = {}, onSubmit, isSubmitting, currentStep, onStepChange }) => {
  const router = useRouter();
  const { userProfile } = useStore();
  const [sessionConfig, setSessionConfig] = useState({
    basicInfo: {
      title: initialConfig.title || '',
      description: initialConfig.description || '',
      institution: initialConfig.institution || '',
      date: new Date().toISOString().split('T')[0]
    },
    connection: {
      loginMethod: 'email',
      anonymityLevel: 'semi-anonymous',
      approvalRequired: false
    },
    settings: {
      institution: initialConfig.institution || '',
      professorName: initialConfig.professorName || '',
      showProfessorName: initialConfig.showProfessorName ?? true,
      maxParticipants: initialConfig.maxParticipants || 30,
      connection: {
        anonymityLevel: 'semi-anonymous',
        loginMethod: 'email',
        approvalRequired: false
      },
      aiInteraction: {
        enabled: true,
        configuration: {
          nuggets: {
            style: {},
            rules: [],
            enabled: true
          },
          lightbulbs: {
            style: {},
            rules: [],
            enabled: true
          }
        }
      }
    },
    // Default analysis rules configuration
    nuggetsRules: {
      focusOnKeyInsights: true,
      discoverPatterns: true,
      quoteRelevantExamples: true,
      customRules: ''
    },
    lightbulbsRules: {
      captureInnovativeThinking: true,
      identifyCrossPollination: true,
      evaluatePracticalApplications: true,
      customRules: ''
    },
    overallRules: {
      synthesizeAllInsights: true,
      extractActionableRecommendations: true,
      provideSessionSummary: true,
      customRules: ''
    },
    // Add timer settings from initialConfig
    timerEnabled: initialConfig.timerEnabled !== undefined ? initialConfig.timerEnabled : false,
    timerDuration: initialConfig.timerDuration || 5,
    // Visualization defaults
    enableWordCloud: true,
    enableThemeNetwork: true,
    enableLightbulbCategorization: true,
    enableIdeaImpactMatrix: true,
    enableEngagementChart: true,
    showTopThemes: true,
    // Content settings
    includeParticipantNames: true,
    includeQuotesInAnalysis: true,
    generateKeyInsights: true,
    // Professor controls
    allowProfessorCustomComments: true,
    enablePresentationMode: true,
    autoExportSessionData: false,
    // other default sections...
    title: initialConfig.title || '',
    professorName: initialConfig.professorName || '',
    showInstitution: initialConfig.showInstitution ?? true,
    showProfessorName: initialConfig.showProfessorName ?? true,
    maxParticipants: initialConfig.maxParticipants || 30,
    companyLogos: initialConfig.companyLogos || [],
    // New image settings
    useProfileAvatar: initialConfig.useProfileAvatar !== undefined ? initialConfig.useProfileAvatar : false,
    companyLogo: initialConfig.companyLogo || null,
  });
  
  const [errors, setErrors] = useState({});

  // Log component initialization
  useEffect(() => {
    logger.info('[SESSION_CREATION] SessionCreationFlow component initialized', {
      initialConfig,
      sessionConfig
    });
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateAllSteps()) {
      return;
    }
    
    try {
      // Prepare session data for submission
      const sessionData = {
        title: sessionConfig.title,
        description: sessionConfig.description || sessionConfig.basicInfo.description,
        institution: sessionConfig.institution || sessionConfig.basicInfo.institution,
        professor_name: sessionConfig.professorName,
        show_professor_name: sessionConfig.showProfessorName,
        max_participants: sessionConfig.maxParticipants,
        settings: {
          ...sessionConfig.settings,
          institution: sessionConfig.institution || sessionConfig.basicInfo.institution,
          professorName: sessionConfig.professorName,
          showProfessorName: sessionConfig.showProfessorName,
          maxParticipants: sessionConfig.maxParticipants,
          connection: sessionConfig.connection,
          aiInteraction: {
            enabled: true,
            configuration: {
              nuggets: {
                style: {},
                rules: sessionConfig.nuggetsRules,
                enabled: true
              },
              lightbulbs: {
                style: {},
                rules: sessionConfig.lightbulbsRules,
                enabled: true
              }
            }
          }
        }
      };
      
      logger.info('[SESSION_CREATION] Submitting session data', sessionData);
      await onSubmit(sessionData);
    } catch (error) {
      logger.error('[SESSION_CREATION] Error submitting session', error);
      setErrors({
        submit: error.message || 'Une erreur est survenue lors de la création de la session'
      });
    }
  };

  // Validate all steps before submission
  const validateAllSteps = () => {
    const newErrors = {};
    let isValid = true;
    
    // Validate basic info
    if (!sessionConfig.title) {
      newErrors.title = 'Le titre de la session est requis';
      isValid = false;
    }
    
    if (!sessionConfig.institution && !sessionConfig.basicInfo?.institution) {
      newErrors.institution = "Le nom de l'institution est requis";
      isValid = false;
    }
    
    setErrors(newErrors);
    
    if (!isValid) {
      // If basic info validation fails, go to that step
      if (newErrors.title || newErrors.institution) {
        onStepChange('basic');
      }
    }
    
    return isValid;
  };

  const handleCancel = () => {
    logger.info('Cancel button clicked');
    if (confirm('Êtes-vous sûr de vouloir annuler la création de cette session ? Toutes les modifications seront perdues.')) {
      logger.info('Session creation cancelled by user');
      router.push('/sessions');
    }
  };

  const handleConfigChange = (field, value) => {
    setSessionConfig(prevConfig => ({
      ...prevConfig,
      [field]: value
    }));
  };

        return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info Step */}
      {currentStep === 'basic' && (
          <BasicInfoStep 
          config={sessionConfig}
          onChange={handleConfigChange}
            errors={errors}
          />
      )}
      
      {/* AI Interaction Step */}
      {currentStep === 'ai' && (
          <AIInteractionConfig 
          config={sessionConfig}
          onChange={handleConfigChange}
            errors={errors}
        />
      )}
      
      {/* Review Step */}
      {currentStep === 'review' && (
          <div className="space-y-6">
          <h3 className="text-lg font-semibold">Vérification finale</h3>
          
          <div className="grid grid-cols-2 gap-6">
              <div>
              <h4 className="font-medium mb-2">Informations de base</h4>
              <dl className="space-y-2">
                <dt className="text-sm text-gray-600">Titre</dt>
                <dd>{sessionConfig.title || sessionConfig.sessionName}</dd>
                
                <dt className="text-sm text-gray-600">Institution</dt>
                <dd>{sessionConfig.institution}</dd>
                
                <dt className="text-sm text-gray-600">Professeur</dt>
                <dd>{sessionConfig.professorName}</dd>
                
                <dt className="text-sm text-gray-600">Participants maximum</dt>
                <dd>{sessionConfig.maxParticipants}</dd>
              </dl>
                </div>
                
              <div>
              <h4 className="font-medium mb-2">Configuration IA</h4>
              <dl className="space-y-2">
                <dt className="text-sm text-gray-600">Mode de connexion</dt>
                <dd>{sessionConfig.connection.loginMethod}</dd>
                
                <dt className="text-sm text-gray-600">Niveau d'anonymat</dt>
                <dd>{sessionConfig.connection.anonymityLevel}</dd>
                
                <dt className="text-sm text-gray-600">Timer</dt>
                <dd>{sessionConfig.timerEnabled ? `${sessionConfig.timerDuration} minutes` : 'Désactivé'}</dd>
              </dl>
                  </div>
                  </div>
                </div>
      )}
      
      {/* Error Messages */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.submit}
                  </div>
      )}
      
      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handleCancel}
          className="cm-button-outline"
          >
            Annuler
          </button>
          
        <div className="space-x-4">
          {currentStep !== 'basic' && (
              <button
                type="button"
              onClick={() => onStepChange(currentStep === 'review' ? 'ai' : 'basic')}
              className="cm-button-secondary"
              >
                Retour
              </button>
            )}
            
          {currentStep === 'review' ? (
            <button
              type="submit"
              className="cm-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Création...' : 'Créer la session'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onStepChange(currentStep === 'basic' ? 'ai' : 'review')}
              className="cm-button"
            >
              Suivant
            </button>
          )}
            </div>
          </div>
    </form>
  );
};

export default SessionCreationFlow; 