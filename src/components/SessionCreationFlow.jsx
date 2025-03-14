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
const SessionCreationFlow = ({ initialConfig = {}, onSubmit, isSubmitting }) => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState('basic-info');
  const { userProfile } = useStore();
  const [sessionConfig, setSessionConfig] = useState({
    basicInfo: {
      title: initialConfig.title || initialConfig.sessionName || '',
      description: initialConfig.description || '',
      institution: initialConfig.institution || '',
      date: new Date().toISOString().split('T')[0]
    },
    connection: {
      loginMethod: 'email',
      anonymityLevel: 'semi-anonymous',
      approvalRequired: false
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
    // Include settings structure for AI configuration
    settings: {
      ...initialConfig.settings,
      ai_configuration: {
        ...(initialConfig.settings?.ai_configuration || {}),
        timerEnabled: initialConfig.timerEnabled !== undefined ? initialConfig.timerEnabled : false,
        timerDuration: initialConfig.timerDuration || 5
      }
    },
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
    sessionName: initialConfig.title || initialConfig.sessionName || '',
    title: initialConfig.title || initialConfig.sessionName || '',
    professorName: initialConfig.professorName || '',
    showInstitution: initialConfig.showInstitution ?? true,
    showProfessorName: initialConfig.showProfessorName ?? true,
    maxParticipants: initialConfig.maxParticipants || 30,
    companyLogos: initialConfig.companyLogos || [],
    // New image settings
    useProfileAvatar: initialConfig.useProfileAvatar !== undefined ? initialConfig.useProfileAvatar : false,
    companyLogo: initialConfig.companyLogo || null,
    
    // Will be populated with defaults from each step component
    ...initialConfig
  });
  
  const [errors, setErrors] = useState({});

  // Log component initialization
  useEffect(() => {
    logger.info('SessionCreationFlow initialized', { config: sessionConfig });
  }, []);

  const updateSessionConfig = (newConfig) => {
    logger.debug('Updating session config', { 
      oldConfig: sessionConfig, 
      newConfig: newConfig
    });
    
    // Keep title and sessionName in sync
    if (newConfig.sessionName && newConfig.sessionName !== newConfig.title) {
      newConfig.title = newConfig.sessionName;
      // Also update in basicInfo if it exists
      if (newConfig.basicInfo) {
        newConfig.basicInfo = {
          ...newConfig.basicInfo,
          title: newConfig.sessionName
        };
      }
    } else if (newConfig.title && newConfig.title !== newConfig.sessionName) {
      newConfig.sessionName = newConfig.title;
    }
    
    // Always ensure title is set in both the root and basicInfo
    if (newConfig.basicInfo?.title && newConfig.basicInfo.title !== newConfig.title) {
      newConfig.title = newConfig.basicInfo.title;
      newConfig.sessionName = newConfig.basicInfo.title;
    }
    
    setSessionConfig(newConfig);
    validateStep(activeStep, newConfig);
  };

  const validateStep = (step, config = sessionConfig) => {
    const newErrors = { ...errors };
    let isValid = true;
    
    if (step === 'basic-info') {
      // Validate title (either in title, sessionName, or basicInfo.title)
      if (!config.title && !config.sessionName && !config.basicInfo?.title) {
        newErrors.title = 'Le titre de la session est requis';
        newErrors.sessionName = 'Le titre de la session est requis';
        isValid = false;
      } else {
        delete newErrors.title;
        delete newErrors.sessionName;
      }
      
      // Validate institution
      if (!config.institution && !config.basicInfo?.institution) {
        newErrors.institution = "Le nom de l'institution est requis";
        isValid = false;
      } else {
        delete newErrors.institution;
      }
    }
    
    // Validate nuggets analysis step
    if (step === 'nuggets-analysis') {
      const nuggetsRules = config.nuggetsRules || {};
      const hasSelectedRules = nuggetsRules.focusOnKeyInsights || 
                              nuggetsRules.discoverPatterns || 
                              nuggetsRules.quoteRelevantExamples;
      const hasCustomRules = nuggetsRules.customRules?.trim();
      
      if (!hasSelectedRules && !hasCustomRules) {
        newErrors.nuggetsRules = 'At least one analysis rule is required for Nuggets analysis';
        isValid = false;
      }
    }
    
    // Validate lightbulbs analysis step
    if (step === 'lightbulbs-analysis') {
      const lightbulbsRules = config.lightbulbsRules || {};
      const hasSelectedRules = lightbulbsRules.captureInnovativeThinking || 
                              lightbulbsRules.identifyCrossPollination || 
                              lightbulbsRules.evaluatePracticalApplications;
      const hasCustomRules = lightbulbsRules.customRules?.trim();
      
      if (!hasSelectedRules && !hasCustomRules) {
        newErrors.lightbulbsRules = 'At least one analysis rule is required for Lightbulbs analysis';
        isValid = false;
      }
    }
    
    // Validate overall analysis step
    if (step === 'overall-analysis') {
      const overallRules = config.overallRules || {};
      const hasSelectedRules = overallRules.synthesizeAllInsights || 
                              overallRules.extractActionableRecommendations || 
                              overallRules.provideSessionSummary;
      const hasCustomRules = overallRules.customRules?.trim();
      
      if (!hasSelectedRules && !hasCustomRules) {
        newErrors.overallRules = 'At least one analysis rule is required for Overall analysis';
        isValid = false;
      }
    }
    
    // Connection phase validation might include profile mode validation
    // Discussion phase validation could check timer settings
    // etc.
    
    setErrors(newErrors);
    
    return isValid;
  };

  const handleStepChange = (newStep) => {
    logger.info(`Attempting to change step from "${activeStep}" to "${newStep}"`);
    
    // Validate current step before moving
    if (validateStep(activeStep)) {
      setActiveStep(newStep);
      logger.info(`Step changed to "${newStep}"`);
    } else {
      logger.warning(`Step change prevented due to validation errors`);
    }
  };

  const handleNext = () => {
    // Get base steps and analysis steps based on configuration
    const baseSteps = [
      'basic-info', 
      'connection', 
      'discussion', 
      'ai-interaction', 
      'lightbulb',
      'analysis'
    ];
    
    // Generate analysis steps from configuration
    let analysisSteps = [];
    if (sessionConfig.analysisConfiguration?.items && Array.isArray(sessionConfig.analysisConfiguration.items)) {
      analysisSteps = sessionConfig.analysisConfiguration.items
        .filter(item => item.enabled)
        .map(item => `${item.type}-analysis`);
    } else {
      // Fallback to default analysis steps if not configured
      analysisSteps = ['nuggets-analysis', 'lightbulbs-analysis', 'overall-analysis'];
    }
    
    const steps = [...baseSteps, ...analysisSteps];
    const currentIndex = steps.indexOf(activeStep);
    
    logger.debug(`Attempting to proceed to next step. Current: ${activeStep}, Index: ${currentIndex}`);
    
    if (currentIndex < steps.length - 1) {
      handleStepChange(steps[currentIndex + 1]);
    } else {
      // On last step, handle submission
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    // Get base steps and analysis steps based on configuration
    const baseSteps = [
      'basic-info', 
      'connection', 
      'discussion', 
      'ai-interaction', 
      'lightbulb',
      'analysis'
    ];
    
    // Generate analysis steps from configuration
    let analysisSteps = [];
    if (sessionConfig.analysisConfiguration?.items && Array.isArray(sessionConfig.analysisConfiguration.items)) {
      analysisSteps = sessionConfig.analysisConfiguration.items
        .filter(item => item.enabled)
        .map(item => `${item.type}-analysis`);
    } else {
      // Fallback to default analysis steps if not configured
      analysisSteps = ['nuggets-analysis', 'lightbulbs-analysis', 'overall-analysis'];
    }
    
    const steps = [...baseSteps, ...analysisSteps];
    const currentIndex = steps.indexOf(activeStep);
    
    logger.debug(`Attempting to return to previous step. Current: ${activeStep}, Index: ${currentIndex}`);
    
    if (currentIndex > 0) {
      setActiveStep(steps[currentIndex - 1]);
      logger.info(`Moved back to step "${steps[currentIndex - 1]}"`);
    }
  };

  const handleSubmit = () => {
    logger.info('Attempting to submit session configuration');
    
    // Check if title/sessionName is set
    if (!sessionConfig.title && !sessionConfig.sessionName) {
      setErrors({
        ...errors,
        title: 'Le titre de la session est requis',
        sessionName: 'Le titre de la session est requis'
      });
      logger.warning('Session submission prevented: missing title');
      return;
    }
    
    // Ensure basicInfo.title is set from sessionName/title
    if (sessionConfig.sessionName || sessionConfig.title) {
      const titleValue = sessionConfig.title || sessionConfig.sessionName;
      
      // Update session config with title in all places
      const updatedConfig = {
        ...sessionConfig,
        title: titleValue,
        sessionName: titleValue,
        basicInfo: {
          ...sessionConfig.basicInfo,
          title: titleValue
        },
        // Ensure timer settings are included
        timerEnabled: sessionConfig.timerEnabled !== undefined ? sessionConfig.timerEnabled : false,
        timerDuration: sessionConfig.timerDuration || 5,
        // Ensure image settings are included
        useProfileAvatar: sessionConfig.useProfileAvatar !== undefined ? sessionConfig.useProfileAvatar : false,
        companyLogo: sessionConfig.companyLogo || null,
        // Ensure settings structure includes AI configuration
        settings: {
          ...sessionConfig.settings,
          ai_configuration: {
            ...(sessionConfig.settings?.ai_configuration || {}),
            timerEnabled: sessionConfig.timerEnabled !== undefined ? sessionConfig.timerEnabled : false,
            timerDuration: sessionConfig.timerDuration || 5
          }
        }
      };
      
      setSessionConfig(updatedConfig);
      
      // Final validation of all steps
      if (validateAllSteps()) {
        logger.info('Session validation successful, submitting data', updatedConfig);
        onSubmit(updatedConfig);
      } else {
        logger.warning('Session submission prevented due to validation errors');
      }
    } else {
      // Final validation of all steps
      if (validateAllSteps()) {
        logger.info('Session validation successful, submitting data');
        
        // Ensure title is properly set before submitting
        const finalConfig = { 
          ...sessionConfig,
          // Ensure timer settings are included
          timerEnabled: sessionConfig.timerEnabled !== undefined ? sessionConfig.timerEnabled : false,
          timerDuration: sessionConfig.timerDuration || 5,
          // Ensure image settings are included
          useProfileAvatar: sessionConfig.useProfileAvatar !== undefined ? sessionConfig.useProfileAvatar : false,
          companyLogo: sessionConfig.companyLogo || null,
          // Ensure settings structure includes AI configuration
          settings: {
            ...sessionConfig.settings,
            ai_configuration: {
              ...(sessionConfig.settings?.ai_configuration || {}),
              timerEnabled: sessionConfig.timerEnabled !== undefined ? sessionConfig.timerEnabled : false,
              timerDuration: sessionConfig.timerDuration || 5
            }
          }
        };
        
        if (finalConfig.basicInfo?.title && !finalConfig.title) {
          finalConfig.title = finalConfig.basicInfo.title;
        }
        
        if (finalConfig.sessionName && !finalConfig.title) {
          finalConfig.title = finalConfig.sessionName;
        }
        
        onSubmit(finalConfig);
      } else {
        logger.warning('Session submission prevented due to validation errors');
      }
    }
  };

  const validateAllSteps = () => {
    const newErrors = {};
    let isValid = true;
    
    // Validate basic info
    if (!sessionConfig.title && !sessionConfig.sessionName && !sessionConfig.basicInfo?.title) {
      newErrors.title = 'Le titre de la session est requis';
      newErrors.sessionName = 'Le titre de la session est requis';
      isValid = false;
    }
    
    if (!sessionConfig.institution && !sessionConfig.basicInfo?.institution) {
      newErrors.institution = "Le nom de l'institution est requis";
      isValid = false;
    }
    
    // Validate all steps and collect all errors
    const allSteps = ['basic-info', 'connection', 'discussion', 'ai-interaction', 'analysis'];
    for (const step of allSteps) {
      if (!validateStep(step)) {
        isValid = false;
        // If the step with errors is not the current step, navigate to it
        if (step !== activeStep) {
          logger.warning(`Navigating to step "${step}" with validation errors`);
          setActiveStep(step);
          break;
        }
      }
    }
    
    setErrors(newErrors);
    
    if (!isValid) {
      // If basic info validation fails, go to that step
      if (newErrors.title || newErrors.sessionName || newErrors.institution) {
        setActiveStep('basic-info');
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

  const renderStepContent = () => {
    logger.debug(`Rendering content for step: ${activeStep}`);
    
    switch (activeStep) {
      case 'basic-info':
        return (
          <BasicInfoStep 
            sessionConfig={sessionConfig} 
            updateSessionConfig={updateSessionConfig}
            errors={errors}
          />
        );
      case 'connection':
        return (
          <ConnectionSettings
            config={sessionConfig.connection || {}}
            onChange={(connectionConfig) => {
              handleConfigChange('connection', connectionConfig);
            }}
            errors={errors.connection || {}}
          />
        );
      case 'discussion':
        return (
          <DiscussionPhaseConfig 
            sessionConfig={sessionConfig} 
            updateSessionConfig={updateSessionConfig}
            errors={errors}
          />
        );
      case 'ai-interaction':
        return (
          <AIInteractionConfig 
            sessionConfig={sessionConfig} 
            updateSessionConfig={updateSessionConfig}
            errors={errors}
            mode="nuggets"
          />
        );
      case 'lightbulb':
        return (
          <AIInteractionConfig 
            sessionConfig={sessionConfig} 
            updateSessionConfig={updateSessionConfig}
            errors={errors}
            mode="lightbulb"
          />
        );
      case 'analysis':
        return null;
      case 'nuggets-analysis':
        return (
          <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 bg-indigo-500 rounded-full w-10 h-10 flex items-center justify-center text-white mr-4">
                <span className="text-2xl">💎</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-indigo-800">Nuggets Analysis</h3>
                <p className="text-gray-700">
                  Analysis of conversations from the AI Nuggets phase.
                </p>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm border border-indigo-100 transition-all duration-200 hover:shadow-md mb-6">
              <h4 className="text-lg font-medium text-indigo-700 mb-4">Analysis Rules</h4>
              <p className="text-sm text-gray-600 mb-4">
                Select which rules to include in your analysis. <span className="text-red-500 font-medium">At least one rule is required.</span>
              </p>
              
              <div className="space-y-4 mb-5">
                <div className="flex items-start">
                  <div className="pt-1">
                    <input 
                      type="checkbox" 
                      id="nuggets-rule-1"
                      className="form-checkbox h-5 w-5 text-indigo-600" 
                      checked={sessionConfig.nuggetsRules?.focusOnKeyInsights !== false}
                      onChange={(e) => updateSessionConfig({
                        ...sessionConfig,
                        nuggetsRules: {
                          ...(sessionConfig.nuggetsRules || {}),
                          focusOnKeyInsights: e.target.checked
                        }
                      })}
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="nuggets-rule-1" className="font-medium text-gray-800">Focus on key insights</label>
                    <p className="text-sm text-gray-600">Identify and highlight the most significant ideas from Nuggets conversations.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="pt-1">
                    <input 
                      type="checkbox" 
                      id="nuggets-rule-2"
                      className="form-checkbox h-5 w-5 text-indigo-600" 
                      checked={sessionConfig.nuggetsRules?.discoverPatterns !== false}
                      onChange={(e) => updateSessionConfig({
                        ...sessionConfig,
                        nuggetsRules: {
                          ...(sessionConfig.nuggetsRules || {}),
                          discoverPatterns: e.target.checked
                        }
                      })}
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="nuggets-rule-2" className="font-medium text-gray-800">Discover patterns</label>
                    <p className="text-sm text-gray-600">Connect ideas across different conversations to identify recurring themes.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="pt-1">
                    <input 
                      type="checkbox" 
                      id="nuggets-rule-3"
                      className="form-checkbox h-5 w-5 text-indigo-600" 
                      checked={sessionConfig.nuggetsRules?.quoteRelevantExamples !== false}
                      onChange={(e) => updateSessionConfig({
                        ...sessionConfig,
                        nuggetsRules: {
                          ...(sessionConfig.nuggetsRules || {}),
                          quoteRelevantExamples: e.target.checked
                        }
                      })}
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="nuggets-rule-3" className="font-medium text-gray-800">Quote relevant examples</label>
                    <p className="text-sm text-gray-600">Include direct quotes from participants to support analysis points.</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-5">
                <h5 className="font-medium text-gray-800 mb-2">Custom Rules</h5>
                <p className="text-sm text-gray-600 mb-3">
                  Add your own custom rules for the Nuggets analysis:
                </p>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 min-h-[120px]"
                  placeholder="Enter your custom rules here, one per line. Example:&#10;- Focus on contradictory views&#10;- Identify emotional responses&#10;- Compare regional differences"
                  value={sessionConfig.nuggetsRules?.customRules || ''}
                  onChange={(e) => updateSessionConfig({
                    ...sessionConfig,
                    nuggetsRules: {
                      ...(sessionConfig.nuggetsRules || {}),
                      customRules: e.target.value
                    }
                  })}
                />
                {(!sessionConfig.nuggetsRules?.focusOnKeyInsights && 
                  !sessionConfig.nuggetsRules?.discoverPatterns && 
                  !sessionConfig.nuggetsRules?.quoteRelevantExamples && 
                  !sessionConfig.nuggetsRules?.customRules?.trim()) && (
                  <p className="text-red-500 text-sm mt-2">
                    At least one rule is required for proper analysis. Please select a default rule or add a custom rule.
                  </p>
                )}
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm border border-indigo-100 transition-all duration-200 hover:shadow-md mb-6">
              <h4 className="text-lg font-medium text-indigo-700 mb-4">Visualization Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <div className="flex items-center mb-2">
                    <input 
                      type="checkbox" 
                      className="form-checkbox h-5 w-5 text-indigo-600" 
                      checked={sessionConfig.enableWordCloud !== false}
                      onChange={(e) => updateSessionConfig({
                        ...sessionConfig,
                        enableWordCloud: e.target.checked
                      })}
                    />
                    <label className="ml-2 text-gray-700 font-medium">Word Cloud</label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Generate a cloud of key terms from the Nuggets conversations.
                  </p>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <div className="flex items-center mb-2">
                    <input 
                      type="checkbox" 
                      className="form-checkbox h-5 w-5 text-indigo-600" 
                      checked={sessionConfig.enableThemeNetwork !== false}
                      onChange={(e) => updateSessionConfig({
                        ...sessionConfig,
                        enableThemeNetwork: e.target.checked
                      })}
                    />
                    <label className="ml-2 text-gray-700 font-medium">Theme Network</label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Show relationships between different ideas and concepts.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm border border-indigo-100 transition-all duration-200 hover:shadow-md mb-6">
              <h4 className="text-lg font-medium text-indigo-700 mb-4">Analysis Content</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-5 w-5 text-indigo-600" 
                    checked={sessionConfig.includeParticipantNames !== false}
                    onChange={(e) => updateSessionConfig({
                      ...sessionConfig,
                      includeParticipantNames: e.target.checked
                    })}
                  />
                  <label className="ml-2 text-gray-700">Include participant names</label>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-5 w-5 text-indigo-600" 
                    checked={sessionConfig.includeQuotesInAnalysis !== false}
                    onChange={(e) => updateSessionConfig({
                      ...sessionConfig,
                      includeQuotesInAnalysis: e.target.checked
                    })}
                  />
                  <label className="ml-2 text-gray-700">Include direct quotes</label>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-5 w-5 text-indigo-600" 
                    checked={sessionConfig.generateKeyInsights !== false}
                    onChange={(e) => updateSessionConfig({
                      ...sessionConfig,
                      generateKeyInsights: e.target.checked
                    })}
                  />
                  <label className="ml-2 text-gray-700">Generate key insights section</label>
                </div>
              </div>
            </div>
          </div>
        );
      case 'lightbulbs-analysis':
        return (
          <div className="p-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 bg-amber-500 rounded-full w-10 h-10 flex items-center justify-center text-white mr-4">
                <span className="text-2xl">💡</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-amber-800">Lightbulbs Analysis</h3>
                <p className="text-gray-700">
                  Analysis of conversations from the AI Lightbulbs phase.
                </p>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm border border-amber-100 transition-all duration-200 hover:shadow-md mb-6">
              <h4 className="text-lg font-medium text-amber-700 mb-4">Analysis Rules</h4>
              <p className="text-sm text-gray-600 mb-4">
                Select which rules to include in your analysis. <span className="text-red-500 font-medium">At least one rule is required.</span>
              </p>
              
              <div className="space-y-4 mb-5">
                <div className="flex items-start">
                  <div className="pt-1">
                    <input 
                      type="checkbox" 
                      id="lightbulbs-rule-1"
                      className="form-checkbox h-5 w-5 text-amber-600" 
                      checked={sessionConfig.lightbulbsRules?.captureInnovativeThinking !== false}
                      onChange={(e) => updateSessionConfig({
                        ...sessionConfig,
                        lightbulbsRules: {
                          ...(sessionConfig.lightbulbsRules || {}),
                          captureInnovativeThinking: e.target.checked
                        }
                      })}
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="lightbulbs-rule-1" className="font-medium text-gray-800">Capture innovative thinking</label>
                    <p className="text-sm text-gray-600">Highlight the most creative and original ideas from non-selected participants.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="pt-1">
                    <input 
                      type="checkbox" 
                      id="lightbulbs-rule-2"
                      className="form-checkbox h-5 w-5 text-amber-600" 
                      checked={sessionConfig.lightbulbsRules?.identifyCrossPollination !== false}
                      onChange={(e) => updateSessionConfig({
                        ...sessionConfig,
                        lightbulbsRules: {
                          ...(sessionConfig.lightbulbsRules || {}),
                          identifyCrossPollination: e.target.checked
                        }
                      })}
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="lightbulbs-rule-2" className="font-medium text-gray-800">Identify cross-pollination</label>
                    <p className="text-sm text-gray-600">Recognize how ideas from Nuggets conversations influenced Lightbulbs discussions.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="pt-1">
                    <input 
                      type="checkbox" 
                      id="lightbulbs-rule-3"
                      className="form-checkbox h-5 w-5 text-amber-600" 
                      checked={sessionConfig.lightbulbsRules?.evaluatePracticalApplications !== false}
                      onChange={(e) => updateSessionConfig({
                        ...sessionConfig,
                        lightbulbsRules: {
                          ...(sessionConfig.lightbulbsRules || {}),
                          evaluatePracticalApplications: e.target.checked
                        }
                      })}
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="lightbulbs-rule-3" className="font-medium text-gray-800">Evaluate practical applications</label>
                    <p className="text-sm text-gray-600">Assess feasibility and potential impact of proposed ideas.</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-5">
                <h5 className="font-medium text-gray-800 mb-2">Custom Rules</h5>
                <p className="text-sm text-gray-600 mb-3">
                  Add your own custom rules for the Lightbulbs analysis:
                </p>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 min-h-[120px]"
                  placeholder="Enter your custom rules here, one per line. Example:&#10;- Categorize ideas by theme&#10;- Identify market potential&#10;- Assess risk factors"
                  value={sessionConfig.lightbulbsRules?.customRules || ''}
                  onChange={(e) => updateSessionConfig({
                    ...sessionConfig,
                    lightbulbsRules: {
                      ...(sessionConfig.lightbulbsRules || {}),
                      customRules: e.target.value
                    }
                  })}
                />
                {(!sessionConfig.lightbulbsRules?.captureInnovativeThinking && 
                  !sessionConfig.lightbulbsRules?.identifyCrossPollination && 
                  !sessionConfig.lightbulbsRules?.evaluatePracticalApplications && 
                  !sessionConfig.lightbulbsRules?.customRules?.trim()) && (
                  <p className="text-red-500 text-sm mt-2">
                    At least one rule is required for proper analysis. Please select a default rule or add a custom rule.
                  </p>
                )}
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm border border-amber-100 transition-all duration-200 hover:shadow-md mb-6">
              <h4 className="text-lg font-medium text-amber-700 mb-4">Visualization Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <div className="flex items-center mb-2">
                    <input 
                      type="checkbox" 
                      className="form-checkbox h-5 w-5 text-amber-600" 
                      checked={sessionConfig.enableLightbulbCategorization !== false}
                      onChange={(e) => updateSessionConfig({
                        ...sessionConfig,
                        enableLightbulbCategorization: e.target.checked
                      })}
                    />
                    <label className="ml-2 text-gray-700 font-medium">Ideas Categorization</label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Group similar ideas together for better insight generation.
                  </p>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <div className="flex items-center mb-2">
                    <input 
                      type="checkbox" 
                      className="form-checkbox h-5 w-5 text-amber-600" 
                      checked={sessionConfig.enableIdeaImpactMatrix !== false}
                      onChange={(e) => updateSessionConfig({
                        ...sessionConfig,
                        enableIdeaImpactMatrix: e.target.checked
                      })}
                    />
                    <label className="ml-2 text-gray-700 font-medium">Impact Matrix</label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Visualize ideas based on potential impact and feasibility.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm border border-amber-100 transition-all duration-200 hover:shadow-md mb-6">
              <h4 className="text-lg font-medium text-amber-700 mb-4">Analysis Content</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-5 w-5 text-amber-600" 
                    checked={sessionConfig.includeParticipantNames !== false}
                    onChange={(e) => updateSessionConfig({
                      ...sessionConfig,
                      includeParticipantNames: e.target.checked
                    })}
                  />
                  <label className="ml-2 text-gray-700">Include participant names</label>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-5 w-5 text-amber-600" 
                    checked={sessionConfig.includeQuotesInAnalysis !== false}
                    onChange={(e) => updateSessionConfig({
                      ...sessionConfig,
                      includeQuotesInAnalysis: e.target.checked
                    })}
                  />
                  <label className="ml-2 text-gray-700">Include direct quotes</label>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-5 w-5 text-amber-600" 
                    checked={sessionConfig.generateKeyInsights !== false}
                    onChange={(e) => updateSessionConfig({
                      ...sessionConfig,
                      generateKeyInsights: e.target.checked
                    })}
                  />
                  <label className="ml-2 text-gray-700">Generate key insights section</label>
                </div>
              </div>
            </div>
          </div>
        );
      case 'overall-analysis':
        return (
          <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 bg-emerald-500 rounded-full w-10 h-10 flex items-center justify-center text-white mr-4">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-emerald-800">Overall Analysis</h3>
                <p className="text-gray-700">
                  Combined analysis of all AI interactions in the session.
                </p>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm border border-emerald-100 transition-all duration-200 hover:shadow-md mb-6">
              <h4 className="text-lg font-medium text-emerald-700 mb-4">Analysis Rules</h4>
              <p className="text-sm text-gray-600 mb-4">
                Select which rules to include in your analysis. <span className="text-red-500 font-medium">At least one rule is required.</span>
              </p>
              
              <div className="space-y-4 mb-5">
                <div className="flex items-start">
                  <div className="pt-1">
                    <input 
                      type="checkbox" 
                      id="overall-rule-1"
                      className="form-checkbox h-5 w-5 text-emerald-600" 
                      checked={sessionConfig.overallRules?.synthesizeAllInsights !== false}
                      onChange={(e) => updateSessionConfig({
                        ...sessionConfig,
                        overallRules: {
                          ...(sessionConfig.overallRules || {}),
                          synthesizeAllInsights: e.target.checked
                        }
                      })}
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="overall-rule-1" className="font-medium text-gray-800">Synthesize all insights</label>
                    <p className="text-sm text-gray-600">Create a cohesive narrative combining both Nuggets and Lightbulbs analyses.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="pt-1">
                    <input 
                      type="checkbox" 
                      id="overall-rule-2"
                      className="form-checkbox h-5 w-5 text-emerald-600" 
                      checked={sessionConfig.overallRules?.extractActionableRecommendations !== false}
                      onChange={(e) => updateSessionConfig({
                        ...sessionConfig,
                        overallRules: {
                          ...(sessionConfig.overallRules || {}),
                          extractActionableRecommendations: e.target.checked
                        }
                      })}
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="overall-rule-2" className="font-medium text-gray-800">Extract actionable recommendations</label>
                    <p className="text-sm text-gray-600">Identify concrete next steps based on the full session analysis.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="pt-1">
                    <input 
                      type="checkbox" 
                      id="overall-rule-3"
                      className="form-checkbox h-5 w-5 text-emerald-600" 
                      checked={sessionConfig.overallRules?.provideSessionSummary !== false}
                      onChange={(e) => updateSessionConfig({
                        ...sessionConfig,
                        overallRules: {
                          ...(sessionConfig.overallRules || {}),
                          provideSessionSummary: e.target.checked
                        }
                      })}
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="overall-rule-3" className="font-medium text-gray-800">Provide session summary</label>
                    <p className="text-sm text-gray-600">Create an executive summary of the entire session for quick reference.</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-5">
                <h5 className="font-medium text-gray-800 mb-2">Custom Rules</h5>
                <p className="text-sm text-gray-600 mb-3">
                  Add your own custom rules for the Overall analysis:
                </p>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 min-h-[120px]"
                  placeholder="Enter your custom rules here, one per line. Example:&#10;- Compare different perspectives&#10;- Evaluate consensus areas&#10;- Highlight areas for future exploration"
                  value={sessionConfig.overallRules?.customRules || ''}
                  onChange={(e) => updateSessionConfig({
                    ...sessionConfig,
                    overallRules: {
                      ...(sessionConfig.overallRules || {}),
                      customRules: e.target.value
                    }
                  })}
                />
                {(!sessionConfig.overallRules?.synthesizeAllInsights && 
                  !sessionConfig.overallRules?.extractActionableRecommendations && 
                  !sessionConfig.overallRules?.provideSessionSummary && 
                  !sessionConfig.overallRules?.customRules?.trim()) && (
                  <p className="text-red-500 text-sm mt-2">
                    At least one rule is required for proper analysis. Please select a default rule or add a custom rule.
                  </p>
                )}
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm border border-emerald-100 transition-all duration-200 hover:shadow-md mb-6">
              <h4 className="text-lg font-medium text-emerald-700 mb-4">Visualization Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                  <div className="flex items-center mb-2">
                    <input 
                      type="checkbox" 
                      className="form-checkbox h-5 w-5 text-emerald-600" 
                      checked={sessionConfig.enableEngagementChart !== false}
                      onChange={(e) => updateSessionConfig({
                        ...sessionConfig,
                        enableEngagementChart: e.target.checked
                      })}
                    />
                    <label className="ml-2 text-gray-700 font-medium">Engagement Graph</label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Show participation rates and engagement across different phases.
                  </p>
                </div>
                
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                  <div className="flex items-center mb-2">
                    <input 
                      type="checkbox" 
                      className="form-checkbox h-5 w-5 text-emerald-600" 
                      checked={sessionConfig.showTopThemes !== false}
                      onChange={(e) => updateSessionConfig({
                        ...sessionConfig,
                        showTopThemes: e.target.checked
                      })}
                    />
                    <label className="ml-2 text-gray-700 font-medium">Key Themes Chart</label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Visualize the most prominent themes from the entire session.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm border border-emerald-100 transition-all duration-200 hover:shadow-md mb-6">
              <h4 className="text-lg font-medium text-emerald-700 mb-4">Professor Controls</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-5 w-5 text-emerald-600" 
                    checked={sessionConfig.allowProfessorCustomComments !== false}
                    onChange={(e) => updateSessionConfig({
                      ...sessionConfig,
                      allowProfessorCustomComments: e.target.checked
                    })}
                  />
                  <label className="ml-2 text-gray-700">Enable professor comments</label>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-5 w-5 text-emerald-600" 
                    checked={sessionConfig.enablePresentationMode !== false}
                    onChange={(e) => updateSessionConfig({
                      ...sessionConfig,
                      enablePresentationMode: e.target.checked
                    })}
                  />
                  <label className="ml-2 text-gray-700">Enable presentation mode</label>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-5 w-5 text-emerald-600" 
                    checked={sessionConfig.autoExportSessionData !== false}
                    onChange={(e) => updateSessionConfig({
                      ...sessionConfig,
                      autoExportSessionData: e.target.checked
                    })}
                  />
                  <label className="ml-2 text-gray-700">Export session data automatically</label>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        logger.error(`Unknown step requested: ${activeStep}`);
        return null;
    }
  };

  // Generate dynamic steps based on configuration
  const getSteps = () => {
    // Base steps that are always included
    const baseSteps = [
      { id: 'basic-info', label: 'Session Details' },
      { id: 'connection', label: 'Participants Login' },
      { id: 'discussion', label: 'First Step' },
      { id: 'ai-interaction', label: 'AI Journalist: Nuggets' },
      { id: 'lightbulb', label: 'AI Journalist: Lightbulbs' },
      { id: 'analysis', label: 'Final Analysis' }
    ];
    
    // Analysis steps based on configuration
    let analysisSteps = [];
    if (sessionConfig.analysisConfiguration?.items && Array.isArray(sessionConfig.analysisConfiguration.items)) {
      analysisSteps = sessionConfig.analysisConfiguration.items
        .filter(item => item.enabled)
        .map((item, index) => {
          if (item.type === 'nuggets') {
            return { id: 'nuggets-analysis', label: `${index + 1}. Nuggets` };
          } else if (item.type === 'lightbulbs') {
            return { id: 'lightbulbs-analysis', label: `${index + 1}. Lightbulbs` };
          } else {
            return { id: 'overall-analysis', label: `${index + 1}. Overall` };
          }
        });
    } else {
      // Fallback to default steps
      analysisSteps = [
        { id: 'nuggets-analysis', label: '1. Nuggets' },
        { id: 'lightbulbs-analysis', label: '2. Lightbulbs' },
        { id: 'overall-analysis', label: '3. Overall' }
      ];
    }
    
    return [...baseSteps, ...analysisSteps];
  };

  const steps = getSteps();

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === activeStep);
  };

  const isLastStep = getCurrentStepIndex() === steps.length - 1;

  // Handle updates to specific sections of the session configuration
  const handleConfigChange = (section, newSectionConfig) => {
    updateSessionConfig({
      ...sessionConfig,
      [section]: newSectionConfig
    });
  };

  return (
    <div className="flex flex-row h-screen">
      {/* Left Column - Flow Map */}
      <div className="w-2/5 sticky top-0 h-screen overflow-auto pb-8 pr-4">
        <SessionFlowMap 
          activeStep={activeStep}
          onStepChange={handleStepChange}
          sessionConfig={sessionConfig}
        />
      </div>
      
      {/* Right Column - Step Content */}
      <div className="w-3/5 h-screen overflow-auto pb-8">
      <div className="second-level-block p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold font-bricolage">
            {steps.find(step => step.id === activeStep)?.label}
          </h3>
          <p className="text-gray-600 mt-1">
            Étape {getCurrentStepIndex() + 1} sur {steps.length}
          </p>
        </div>
        
        {renderStepContent()}
        
        {Object.keys(errors).length > 0 && (
          <div className="mt-6 p-4 border border-red-200 bg-red-50 rounded-md">
            <h4 className="text-red-800 font-medium mb-2">Erreurs de validation</h4>
            <ul className="list-disc pl-5 text-red-700">
              {Object.entries(errors).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-8 flex items-center justify-between border-t pt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="cm-button-secondary px-4 py-2"
          >
            Annuler
          </button>
          
          <div className="flex gap-4">
            {getCurrentStepIndex() > 0 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="cm-button-secondary px-4 py-2"
              >
                Retour
              </button>
            )}
            
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="cm-button-primary px-6 py-2"
            >
              {isLastStep ? 'Créer la session' : 'Continuer'}
              {isSubmitting && (
                <span className="ml-2 inline-block animate-spin">⟳</span>
              )}
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionCreationFlow; 