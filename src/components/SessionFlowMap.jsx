import React, { useState, useEffect } from 'react';
const { useTranslation } = require('./LocaleProvider');
const FlowMapAnalysisOrder = require('./FlowMapAnalysisOrder');

/**
 * SessionFlowMap Component
 * 
 * A visual flowchart representation of the session flow,
 * displaying steps as connected boxes with directional arrows.
 * Features modern design elements with clean visualization.
 * 
 * INTEGRATION NOTES:
 * 
 * 1. For the timer configuration to work, the parent component should pass
 *    a sessionConfig object that includes:
 *    - settings.ai_configuration.timerEnabled (boolean)
 *    - settings.ai_configuration.timerDuration (number)
 * 
 * 2. For the analysis reordering to work, the parent component should pass:
 *    - settings.finalAnalysis.items (array of analysis items)
 *    or
 *    - analysisConfiguration.items (array of analysis items)
 *
 * 3. The sessionConfig object should also include an onConfigChange function
 *    that handles updates to the configuration, like:
 *    sessionConfig = {
 *      ...sessionData,
 *      onConfigChange: (updatedConfig) => updateSessionData(updatedConfig)
 *    }
 *
 * Note: This component now uses simplified versions of FlowMapTimer and
 * FlowMapAnalysisOrder that do not require external UI component libraries.
 */
const SessionFlowMap = ({ 
  activeStep = 'basic-info',
  onStepChange,
  sessionConfig,
}) => {
  // Animation states
  const [animatingStep, setAnimatingStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  
  // Access translations if available
  const { t } = useTranslation ? useTranslation() : { t: (key) => key };

  // Ensure translation keys return strings
  const safeT = (key, defaultValue) => {
    const result = t(key, defaultValue);
    return typeof result === 'string' ? result : defaultValue || key;
  };

  // Get dynamic analysis steps based on the configuration
  const getDynamicAnalysisSteps = () => {
    if (!sessionConfig.analysisConfiguration?.items || !Array.isArray(sessionConfig.analysisConfiguration.items)) {
      // Fallback to default steps if items not configured
      return [
        'nuggets-1', 
        'nuggets-2', 
        'overall'
      ];
    }
    
    // Map the configured items to step IDs
    return sessionConfig.analysisConfiguration.items
      .filter(item => item.enabled)
      .map((item, index) => {
        if (item.type === 'nuggets') return 'nuggets-analysis';
        if (item.type === 'lightbulbs') return 'lightbulbs-analysis';
        if (item.type === 'overall') return 'overall-analysis';
        return `unknown-${index}`;
      });
  };

  // Handle timer settings changes
  const handleTimerEnabledChange = (enabled) => {
    if (!sessionConfig) return;
    
    let updatedConfig;
    
    // Determine where the timer settings exist
    if (sessionConfig.timerEnabled !== undefined) {
      // Timer settings at top level
      updatedConfig = {
        ...sessionConfig,
        timerEnabled: enabled
      };
    } else if (sessionConfig.settings?.ai_configuration) {
      // Timer settings in ai_configuration
      updatedConfig = {
        ...sessionConfig,
        settings: {
          ...sessionConfig.settings,
          ai_configuration: {
            ...sessionConfig.settings.ai_configuration,
            timerEnabled: enabled
          }
        }
      };
    } else {
      // No existing timer settings, create at top level
      updatedConfig = {
        ...sessionConfig,
        timerEnabled: enabled
      };
    }
    
    // If there's an onConfigChange handler in the parent, call it
    if (sessionConfig.onConfigChange) {
      sessionConfig.onConfigChange(updatedConfig);
    }
  };
  
  const handleTimerDurationChange = (duration) => {
    if (!sessionConfig) return;
    
    let updatedConfig;
    
    // Determine where the timer settings exist
    if (sessionConfig.timerDuration !== undefined) {
      // Timer settings at top level
      updatedConfig = {
        ...sessionConfig,
        timerDuration: duration
      };
    } else if (sessionConfig.settings?.ai_configuration) {
      // Timer settings in ai_configuration
      updatedConfig = {
        ...sessionConfig,
        settings: {
          ...sessionConfig.settings,
          ai_configuration: {
            ...sessionConfig.settings.ai_configuration,
            timerDuration: duration
          }
        }
      };
    } else {
      // No existing timer settings, create at top level
      updatedConfig = {
        ...sessionConfig,
        timerDuration: duration
      };
    }
    
    // If there's an onConfigChange handler in the parent, call it
    if (sessionConfig.onConfigChange) {
      sessionConfig.onConfigChange(updatedConfig);
    }
  };
  
  // Handle analysis items reordering
  const handleAnalysisReorder = (newItems) => {
    if (!sessionConfig) return;
    
    let updatedConfig;
    
    // Determine which format we're using
    if (sessionConfig.analysisConfiguration) {
      // New format
      updatedConfig = {
        ...sessionConfig,
        analysisConfiguration: {
          ...sessionConfig.analysisConfiguration,
          items: newItems
        }
      };
    } else if (sessionConfig.settings?.finalAnalysis) {
      // Old format
      updatedConfig = {
        ...sessionConfig,
        settings: {
          ...sessionConfig.settings,
          finalAnalysis: {
            ...sessionConfig.settings.finalAnalysis,
            items: newItems
          }
        }
      };
    } else {
      // Neither format exists, create using new format
      updatedConfig = {
        ...sessionConfig,
        analysisConfiguration: {
          items: newItems
        }
      };
    }
    
    // If there's an onConfigChange handler in the parent, call it
    if (sessionConfig.onConfigChange) {
      sessionConfig.onConfigChange(updatedConfig);
    }
  };
  
  // Handle toggling analysis items
  const handleToggleAnalysisItem = (itemId) => {
    // Get the current items
    const currentItems = getAnalysisItems();
    if (!currentItems || !currentItems.length) return;
    
    // Update the enabled status
    const updatedItems = currentItems.map(item => 
      item.id === itemId ? { ...item, enabled: !item.enabled } : item
    );
    
    // Apply the same changes as in handleAnalysisReorder
    let updatedConfig;
    
    // Determine which format we're using
    if (sessionConfig.analysisConfiguration) {
      // New format
      updatedConfig = {
        ...sessionConfig,
        analysisConfiguration: {
          ...sessionConfig.analysisConfiguration,
          items: updatedItems
        }
      };
    } else if (sessionConfig.settings?.finalAnalysis) {
      // Old format
      updatedConfig = {
        ...sessionConfig,
        settings: {
          ...sessionConfig.settings,
          finalAnalysis: {
            ...sessionConfig.settings.finalAnalysis,
            items: updatedItems
          }
        }
      };
    } else {
      // Neither format exists, create using new format
      updatedConfig = {
        ...sessionConfig,
        analysisConfiguration: {
          items: updatedItems
        }
      };
    }
    
    // If there's an onConfigChange handler in the parent, call it
    if (sessionConfig.onConfigChange) {
      sessionConfig.onConfigChange(updatedConfig);
    }
  };

  // Update completed steps based on active step
  useEffect(() => {
    const baseSteps = [
      'basic-info', 'connection', 'discussion', 'timer-config', 'ai-interaction', 
      'lightbulb', 'analysis-config'
    ];
    
    const analysisSteps = getDynamicAnalysisSteps();
    const steps = [...baseSteps, ...analysisSteps];
    
    const currentIndex = steps.indexOf(activeStep);
    if (currentIndex > 0) {
      setCompletedSteps(steps.slice(0, currentIndex));
    }
    
    // Trigger animation on step change
    setAnimatingStep(activeStep);
    const timer = setTimeout(() => setAnimatingStep(null), 600);
    
    return () => clearTimeout(timer);
  }, [activeStep, sessionConfig]);

  // Steps in the session flow with detailed descriptions and SVG icons
  const baseSteps = [
    { 
      id: 'basic-info',
      title: safeT('session.flow.basic_info', 'Basic Information'),
      shortTitle: safeT('session.flow.basic_info_short', 'Basic Info'),
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'blue',
      description: safeT('session.flow.basic_info_desc', 'Enter the basic session information, such as title, description, and duration.')
    },
    { 
      id: 'connection',
      title: safeT('session.flow.connection', 'User Connection'),
      shortTitle: safeT('session.flow.connection_short', 'User Connection'),
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'teal',
      description: safeT('session.flow.connection_desc', 'Define how users will connect and what information will be visible.')
    },
    { 
      id: 'discussion',
      title: safeT('session.flow.discussion', 'Discussion & Votes'),
      shortTitle: safeT('session.flow.discussion_short', 'Discussion & Votes'),
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'violet',
      description: safeT('session.flow.discussion_desc', 'Configure parameters for the discussion and voting phase between participants.')
    },
    { 
      id: 'timer-config',
      title: 'Timer Settings',
      shortTitle: 'Timer',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'red',
      description: 'Configure the timer settings for the discussion phase.'
    },
    { 
      id: 'ai-interaction',
      title: safeT('session.flow.ai_interaction', 'AI Journalist: Nuggets'),
      shortTitle: safeT('session.flow.ai_nuggets_short', 'AI Nuggets'),
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 12C22 12 19 5 12 5C5 5 2 12 2 12C2 12 5 19 12 19C19 19 22 12 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'purple',
      description: safeT('session.flow.ai_interaction_desc', 'Set up the interaction between the AI Journalist and selected participants.')
    },
    { 
      id: 'lightbulb',
      title: safeT('session.flow.lightbulb', 'AI Journalist: Lightbulbs'),
      shortTitle: safeT('session.flow.lightbulb_short', 'AI Lightbulbs'),
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707M12 21v-1M5.6 18.6l.7-.7m12.1.7l-.7-.7M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'yellow',
      description: safeT('session.flow.lightbulb_desc', 'Allow non-selected participants to share ideas inspired by the discussions.')
    },
    {
      id: 'analysis-config',
      title: 'Configure Analysis',
      shortTitle: 'Analysis Config',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'blue',
      description: 'Configure and reorder the analysis steps.'
    },
  ];
  
  // Dynamic analysis steps based on configuration
  const getAnalysisSteps = () => {
    if (!sessionConfig.analysisConfiguration?.items || !Array.isArray(sessionConfig.analysisConfiguration.items)) {
      // Fallback to default analysis steps
      return [
        {
          id: 'nuggets-analysis',
          title: safeT('session.flow.nuggets_analysis', 'Nuggets Analysis'),
          shortTitle: safeT('session.flow.nuggets_analysis_short', '1. Nuggets'),
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l4 4M17 3h-4v4M13 21l4-4M17 21h-4v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          color: 'green',
          description: safeT('session.flow.nuggets_analysis_desc', 'Analysis of AI Nuggets conversations.')
        },
        {
          id: 'lightbulbs-analysis',
          title: safeT('session.flow.lightbulbs_analysis', 'Lightbulbs Analysis'),
          shortTitle: safeT('session.flow.lightbulbs_analysis_short', '2. Lightbulbs'),
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707M12 21v-1M5.6 18.6l.7-.7m12.1.7l-.7-.7M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          color: 'yellow',
          description: safeT('session.flow.lightbulbs_analysis_desc', 'Analysis of AI Lightbulbs conversations.')
        },
        {
          id: 'overall-analysis',
          title: safeT('session.flow.overall_analysis', 'Overall Analysis'),
          shortTitle: safeT('session.flow.overall_analysis_short', '3. Overall'),
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 11v5m-3-2.5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          color: 'green',
          description: safeT('session.flow.overall_analysis_desc', 'Overall session analysis combining all conversations.')
        }
      ];
    }
    
    // Use the configured analysis items to determine the steps,
    // preserving their order and numbering them accordingly
    return sessionConfig.analysisConfiguration.items
      .filter(item => item.enabled)
      .map((item, index) => {
        // Choose icon and color based on item type
        let icon, color, title, shortTitle, description;
        
        if (item.type === 'nuggets') {
          icon = (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l4 4M17 3h-4v4M13 21l4-4M17 21h-4v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          );
          color = 'green';
          title = safeT('session.flow.nuggets_analysis', 'Nuggets Analysis');
          shortTitle = `${index + 1}. Nuggets`;
          description = safeT('session.flow.nuggets_analysis_desc', 'Analysis of AI Nuggets conversations.');
        } else if (item.type === 'lightbulbs') {
          icon = (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707M12 21v-1M5.6 18.6l.7-.7m12.1.7l-.7-.7M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          );
          color = 'yellow';
          title = safeT('session.flow.lightbulbs_analysis', 'Lightbulbs Analysis');
          shortTitle = `${index + 1}. Lightbulbs`;
          description = safeT('session.flow.lightbulbs_analysis_desc', 'Analysis of AI Lightbulbs conversations.');
        } else { // overall
          icon = (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 11v5m-3-2.5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          );
          color = 'green';
          title = safeT('session.flow.overall_analysis', 'Overall Analysis');
          shortTitle = `${index + 1}. Overall`;
          description = safeT('session.flow.overall_analysis_desc', 'Overall session analysis combining all conversations.');
        }
        
        return {
          id: `${item.type}-analysis`,
          title,
          shortTitle,
          icon,
          color,
          description
        };
      });
  };
  
  // Combine base steps with dynamic analysis steps
  const steps = [...baseSteps, ...getAnalysisSteps()];

  // Helper function to get step by ID
  const getStepById = (id) => steps.find(step => step.id === id) || {};

  // Get color classes based on step status
  const getColorClasses = (step) => {
    const isCompleted = completedSteps.includes(step.id);
    const isActive = step.id === activeStep;
    const isAnimating = step.id === animatingStep;
    
    const colorMap = {
      blue: { 
        bg: 'bg-blue-100',
        border: 'border-blue-400',
        text: 'text-blue-700',
        activeGradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
        icon: 'text-blue-600'
      },
      teal: { 
        bg: 'bg-teal-50', 
        border: 'border-teal-400',
        text: 'text-teal-700',
        activeGradient: 'bg-gradient-to-r from-teal-500 to-teal-600',
        icon: 'text-teal-600'
      },
      violet: { 
        bg: 'bg-violet-50', 
        border: 'border-violet-400',
        text: 'text-violet-700',
        activeGradient: 'bg-gradient-to-r from-violet-500 to-violet-600',
        icon: 'text-violet-600'
      },
      purple: { 
        bg: 'bg-purple-50', 
        border: 'border-purple-400',
        text: 'text-purple-700',
        activeGradient: 'bg-gradient-to-r from-purple-500 to-purple-600',
        icon: 'text-purple-600'
      },
      green: { 
        bg: 'bg-green-50', 
        border: 'border-green-400',
        text: 'text-green-700',
        activeGradient: 'bg-gradient-to-r from-green-500 to-green-600',
        icon: 'text-green-600'
      },
      yellow: { 
        bg: 'bg-yellow-50', 
        border: 'border-yellow-400',
        text: 'text-yellow-700',
        activeGradient: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
        icon: 'text-yellow-600'
      },
      orange: { 
        bg: 'bg-orange-50', 
        border: 'border-orange-400',
        text: 'text-orange-700',
        activeGradient: 'bg-gradient-to-r from-orange-500 to-orange-600', 
        icon: 'text-orange-600'
      },
      red: { 
        bg: 'bg-red-50', 
        border: 'border-red-400',
        text: 'text-red-700',
        activeGradient: 'bg-gradient-to-r from-red-500 to-red-600',
        icon: 'text-red-600'
      },
    };

    const colors = colorMap[step.color] || colorMap.blue;
    const baseClasses = 'transition-all duration-300 ease-in-out';
    
    // Active step
    if (isActive) {
      return `${colors.activeGradient} text-white shadow-md ${baseClasses} ${isAnimating ? 'animate-pulse' : ''}`;
    }
    
    // Completed step
    if (isCompleted) {
      return `${colors.bg} ${colors.border} border ${colors.text} shadow-sm ${baseClasses}`;
    }
    
    // Other steps
    return `bg-white border border-gray-300 text-gray-700 hover:${colors.bg} hover:${colors.border} hover:border ${baseClasses}`;
  };

  // Calculate the percentage of completed steps
  const progressPercentage = () => {
    const totalSteps = steps.length;
    const currentIndex = steps.findIndex(step => step.id === activeStep);
    return Math.round((currentIndex / (totalSteps - 1)) * 100);
  };

  // Define isAIActive here so it's available throughout the component
  const isAIActive = activeStep === 'ai-interaction' || activeStep === 'lightbulb';

  // Simplified arrow for connecting steps
  const Arrow = ({ highlighted = false }) => {
    const colorClass = highlighted ? "text-purple-400" : "text-gray-300";

  return (
      <div className={`h-7 flex justify-center ${colorClass} transition-colors duration-300`}>
        <svg className="w-5 h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5v14m-5-5l5 5 5-5" stroke="currentColor" strokeWidth={highlighted ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  };

  // Box component for representing a step
  const StepBox = ({ step, isActive, isCompleted, onClick }) => {
    const stepColors = {
      blue: 'bg-blue-500',
      teal: 'bg-teal-500',
      violet: 'bg-violet-500',
      purple: 'bg-purple-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
    };
    
    const iconBgColor = stepColors[step.color] || 'bg-blue-500';
    
    return (
      <div className="w-full">
              <button
          onClick={onClick}
          className={`relative w-full px-3 py-2 rounded-md ${getColorClasses(step)}
            hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${step.color}-300
            flex items-center ${isActive ? '' : 'hover:bg-gray-50'}`}
        >
          <div className={`mr-3 flex-shrink-0 h-8 w-8 rounded-md ${isActive ? 'bg-white text-current' : iconBgColor + ' text-white'} flex items-center justify-center`}>
            {step.icon}
          </div>
          
          <div className="flex-grow text-left">
            <div className="font-medium">{step.shortTitle || step.title}</div>
          </div>
          
          {isCompleted && !isActive && (
            <div className="flex-shrink-0 ml-2 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center text-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      </div>
    );
  };

  // The special AI section with two steps side by side
  const AISection = () => {
    // Remove duplicate declaration and use the one from parent scope
    const aiStep = getStepById('ai-interaction');
    const lightbulbStep = getStepById('lightbulb');
    
    // Extract timer settings
    const timerSettings = getTimerSettings();
    
    return (
      <div className="w-full mb-3">
        <div className="border-2 border-dashed border-red-300 rounded-lg p-3 relative">
          <div className="absolute -top-3 right-2">
            <button
              onClick={() => onStepChange('timer-config')}
              className="flex items-center space-x-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs px-2 py-1 rounded-full shadow-sm"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{timerSettings.enabled ? `${timerSettings.duration} min` : 'Timer off'}</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <StepBox 
              step={aiStep} 
              isActive={activeStep === 'ai-interaction'}
              isCompleted={completedSteps.includes('ai-interaction')} 
              onClick={() => onStepChange('ai-interaction')}
            />
            
            <StepBox 
              step={lightbulbStep} 
              isActive={activeStep === 'lightbulb'}
              isCompleted={completedSteps.includes('lightbulb')} 
              onClick={() => onStepChange('lightbulb')}
            />
          </div>
          
          <div className="mt-2 text-xs text-gray-600 italic text-center">
            Le timer est configuré globalement pour toutes les interactions AI
          </div>
        </div>
      </div>
    );
  };

  // Extract timer settings from the session config
  const getTimerSettings = () => {
    // Check for top-level timer settings first
    if (sessionConfig?.timerEnabled !== undefined || sessionConfig?.timerDuration !== undefined) {
      return {
        enabled: sessionConfig.timerEnabled !== undefined ? sessionConfig.timerEnabled : true,
        duration: sessionConfig.timerDuration || 15
      };
    }
    
    // Then check in ai_configuration
    const ai_settings = sessionConfig?.settings?.ai_configuration || {};
    if (ai_settings.timerEnabled !== undefined || ai_settings.timerDuration !== undefined) {
      return {
        enabled: ai_settings.timerEnabled !== undefined ? ai_settings.timerEnabled : true,
        duration: ai_settings.timerDuration || 15
      };
    }
    
    // Default values
    return {
      enabled: true,
      duration: 15
    };
  };
  
  // Extract analysis items from the session config
  const getAnalysisItems = () => {
    // First check the analysisConfiguration (new format)
    if (sessionConfig?.analysisConfiguration?.items) {
      return sessionConfig.analysisConfiguration.items;
    }
    
    // Then check the settings.finalAnalysis (old format)
    if (sessionConfig?.settings?.finalAnalysis?.items) {
      return sessionConfig.settings.finalAnalysis.items;
    }
    
    // Return empty array as fallback
    return [];
  };

  // Render the flow map with dynamic steps
  return (
    <div className="session-flow-map mx-auto w-full max-w-xl p-4">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Session Flow Map</h2>
      <div className="progress-bar w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-300"
          style={{ width: `${completedSteps.length / (steps.length - 1) * 100}%` }}
        ></div>
      </div>
      
      <div className="flex flex-col items-center space-y-2">
        {/* Basic Info */}
        <StepBox 
          step={getStepById('basic-info')} 
          isActive={activeStep === 'basic-info'}
          isCompleted={completedSteps.includes('basic-info')} 
          onClick={() => onStepChange('basic-info')}
        />
        
        <Arrow highlighted={activeStep === 'basic-info' || activeStep === 'connection'} />
        
        {/* User Connection */}
        <StepBox 
          step={getStepById('connection')} 
          isActive={activeStep === 'connection'}
          isCompleted={completedSteps.includes('connection')} 
          onClick={() => onStepChange('connection')}
        />
        
        <Arrow highlighted={activeStep === 'connection' || activeStep === 'discussion'} />
        
        {/* Discussion & Votes */}
        <div className="relative">
          <StepBox 
            step={getStepById('discussion')} 
            isActive={activeStep === 'discussion'}
            isCompleted={completedSteps.includes('discussion')} 
            onClick={() => onStepChange('discussion')}
          />
          <div className="absolute -right-1 top-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs shadow-sm">
            20
          </div>
        </div>
        
        <Arrow highlighted={activeStep === 'discussion' || isAIActive} />
        
        {/* AI Journalist section */}
        <AISection />
        
        <Arrow highlighted={activeStep === 'analysis-config' || getAnalysisSteps().some(step => activeStep === step.id)} />
        
        {/* Analysis Config Step */}
        <StepBox 
          step={getStepById('analysis-config')} 
          isActive={activeStep === 'analysis-config'}
          isCompleted={completedSteps.includes('analysis-config')} 
          onClick={() => onStepChange('analysis-config')}
        />
        
        <Arrow highlighted={getAnalysisSteps().some(step => activeStep === step.id)} />
        
        {/* Analysis Section - with grouped border */}
        <div className="w-full mb-3">
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-3 relative pb-6">
            <div className="absolute -top-3 right-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-sm">
              AI ANALYSIS
            </div>
            
            {/* Check if we're on the analysis configuration section */}
            {activeStep === 'analysis-config' ? (
              <div className="mt-2">
                <FlowMapAnalysisOrder
                  items={getAnalysisItems()}
                  onReorder={handleAnalysisReorder}
                  onToggleItem={handleToggleAnalysisItem}
                />
              </div>
            ) : (
              /* Dynamic Analysis Steps */
              <div className="flex flex-col space-y-3">
                {getAnalysisSteps().map((step, index) => (
                  <React.Fragment key={step.id}>
                    {index > 0 && <div className="h-2 w-1 mx-auto bg-gray-200"></div>}
                    <StepBox 
                      step={step} 
                      isActive={activeStep === step.id}
                      isCompleted={completedSteps.includes(step.id)} 
                      onClick={() => onStepChange(step.id)}
                    />
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

module.exports = SessionFlowMap; 