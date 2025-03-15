import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * FlowMapTimer Component
 * 
 * Displays the timer in the flow map and allows users to modify it.
 * Uses React Portal to render the popup in a stable manner that won't be affected by parent renders.
 * The popup remains open until the user explicitly closes it.
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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [localDuration, setLocalDuration] = useState(duration);
  const [portalContainer, setPortalContainer] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const timerButtonRef = useRef(null);

  // Create portal container on mount and manage timer button position
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPortalContainer(document.body);
    }
    
    // Update local duration when prop changes
    setLocalDuration(duration);
  }, [duration]);

  // Update popover position when it opens
  useEffect(() => {
    if (isPopoverOpen && timerButtonRef.current) {
      const rect = timerButtonRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    }
  }, [isPopoverOpen]);

  // Toggle timer enabled/disabled
  const handleToggleTimer = (e) => {
    if (e) e.stopPropagation();
    onEnabledChange(!enabled);
  };

  // Toggle popover
  const togglePopover = (e) => {
    if (e) e.stopPropagation();
    setIsPopoverOpen(!isPopoverOpen);
  };

  // Set preset duration
  const setPresetDuration = (value) => {
    setLocalDuration(value);
  };

  // Apply duration changes and close popover
  const handleApply = (e) => {
    if (e) e.stopPropagation();
    onDurationChange(localDuration);
    setIsPopoverOpen(false);
  };

  return (
    <div className="relative">
      {/* Timer Button */}
      <div 
        ref={timerButtonRef}
        className={`inline-flex items-center px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
          enabled 
            ? "text-red-600 bg-red-50 border border-red-200 hover:bg-red-100" 
            : "text-gray-600 bg-gray-100 border border-gray-300 hover:bg-gray-200"
        }`}
        onClick={togglePopover}
      >
        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-xs font-medium">
          {enabled ? `${duration} MIN TIMER` : "Timer disabled"}
        </span>
      </div>
      
      {/* Popover Portal */}
      {isPopoverOpen && portalContainer && createPortal(
        <div className="fixed inset-0 z-50" style={{ pointerEvents: 'none' }}>
          {/* This div catches clicks outside the popover */}
          <div 
            className="absolute inset-0" 
            onClick={togglePopover}
            style={{ pointerEvents: 'auto' }}
          />
          
          {/* Popover Content - Don't close when clicking inside it */}
          <div 
            className="absolute bg-white rounded-lg shadow-xl border border-gray-200 w-64"
            style={{ 
              top: popoverPosition.top + 'px', 
              left: popoverPosition.left + 'px',
              pointerEvents: 'auto' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Timer Configuration</h3>
                <button 
                  onClick={togglePopover}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Enable timer</span>
                <button 
                  className={`relative inline-flex items-center h-5 rounded-full w-10 ${enabled ? 'bg-purple-600' : 'bg-gray-300'}`}
                  onClick={handleToggleTimer}
                >
                  <span 
                    className={`${enabled ? 'translate-x-5' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </button>
              </div>
              
              {enabled && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Duration (minutes)</span>
                      <span className="text-sm font-medium text-purple-600">{localDuration} min</span>
                    </div>
                    
                    <input
                      type="range"
                      min="1"
                      max="60"
                      step="1"
                      value={localDuration}
                      onChange={(e) => setLocalDuration(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1 min</span>
                      <span>30 min</span>
                      <span>60 min</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between gap-2">
                    {[5, 10, 15, 30].map(value => (
                      <button 
                        key={value}
                        onClick={() => setPresetDuration(value)}
                        className={`px-2 py-1 text-xs font-medium border rounded ${
                          localDuration === value 
                            ? 'bg-purple-50 border-purple-300 text-purple-700' 
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {value} min
                      </button>
                    ))}
                  </div>
                </>
              )}
              
              <div className="pt-2">
                <button
                  onClick={handleApply}
                  className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>,
        portalContainer
      )}
    </div>
  );
};

export default FlowMapTimer;