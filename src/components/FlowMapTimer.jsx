import React from 'react';
import { Clock } from 'lucide-react';
import TimerConfigPopover from './TimerConfigPopover';

/**
 * FlowMapTimer Component
 * 
 * Displays the timer in the flow map and allows users to modify it
 * by clicking on it, which opens a popover with timer configuration.
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
  if (!enabled) {
    return (
      <TimerConfigPopover
        timerEnabled={enabled}
        timerDuration={duration}
        onTimerEnabledChange={onEnabledChange}
        onTimerDurationChange={onDurationChange}
      >
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-gray-600 bg-gray-100 border border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors">
          <Clock size={14} className="mr-1" />
          <span className="text-xs font-medium">Timer désactivé</span>
        </div>
      </TimerConfigPopover>
    );
  }

  return (
    <TimerConfigPopover
      timerEnabled={enabled}
      timerDuration={duration}
      onTimerEnabledChange={onEnabledChange}
      onTimerDurationChange={onDurationChange}
    >
      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-red-600 bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors">
        <Clock size={14} className="mr-1" />
        <span className="text-xs font-medium">{duration} MIN TIMER</span>
      </div>
    </TimerConfigPopover>
  );
};

export default FlowMapTimer; 