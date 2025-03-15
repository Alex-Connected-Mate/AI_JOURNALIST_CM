import React, { useState, useRef, useEffect } from 'react';

/**
 * FlowMapTimer Component
 * 
 * Displays the timer in the flow map and allows users to modify it
 * by clicking on it, which opens a small popover with timer configuration.
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
  const [showPopover, setShowPopover] = useState(false);
  const [localDuration, setLocalDuration] = useState(duration);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && 
          !popoverRef.current.contains(event.target) && 
          buttonRef.current && 
          !buttonRef.current.contains(event.target)) {
        setShowPopover(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle timer without popover
  const handleToggleTimer = (e) => {
    e.stopPropagation();
    onEnabledChange(!enabled);
  };

  // Apply duration change
  const handleApplyDuration = () => {
    onDurationChange(localDuration);
    setShowPopover(false);
  };

  // Set preset duration
  const setPresetDuration = (value) => {
    setLocalDuration(value);
  };

  const timerButton = (
    <div 
      ref={buttonRef}
      className={`inline-flex items-center px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
        enabled 
          ? "text-red-600 bg-red-50 border border-red-200 hover:bg-red-100" 
          : "text-gray-600 bg-gray-100 border border-gray-300 hover:bg-gray-200"
      }`}
      onClick={() => setShowPopover(!showPopover)}
    >
      <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-xs font-medium">
        {enabled ? `${duration} MIN TIMER` : "Timer désactivé"}
      </span>
    </div>
  );

  return (
    <div className="relative">
      {timerButton}
      
      {showPopover && (
        <div 
          ref={popoverRef}
          className="absolute z-50 right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200"
        >
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Configuration du Timer</h3>
              <button 
                onClick={() => setShowPopover(false)}
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
              <span className="text-sm font-medium text-gray-700">Activer le timer</span>
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
                    <span className="text-sm font-medium text-gray-700">Durée (minutes)</span>
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
                onClick={handleApplyDuration}
                className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowMapTimer; 