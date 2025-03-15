import React from 'react';

/**
 * FlowMapTimer Component
 * 
 * Displays the timer in the flow map and allows users to modify it
 * by clicking on it, which directly triggers the callbacks for timer configuration.
 * 
 * @param {boolean} enabled - Whether the timer is enabled
 * @param {number} duration - The duration of the timer in minutes
 * @param {Function} onEnabledChange - Callback when timer enabled state changes
 * @param {Function} onDurationChange - Callback when timer duration changes
 */
const FlowMapTimer = ({
  enabled = true,
  duration = 15,
  onEnabledChange,
  onDurationChange
}) => {
  // Simplified version that just toggles the timer on/off when clicked
  const handleClick = () => {
    if (enabled) {
      // When enabled, just toggle it off
      onEnabledChange(false);
    } else {
      // When disabled, toggle it on with default duration
      onEnabledChange(true);
    }
  };

  if (!enabled) {
    return (
      <div 
        className="inline-flex items-center px-2.5 py-1 rounded-full text-gray-600 bg-gray-100 border border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={handleClick}
      >
        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-xs font-medium">Timer désactivé</span>
      </div>
    );
  }

  return (
    <div 
      className="inline-flex items-center px-2.5 py-1 rounded-full text-red-600 bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
      onClick={handleClick}
    >
      <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-xs font-medium">{duration} MIN TIMER</span>
    </div>
  );
};

export default FlowMapTimer; 