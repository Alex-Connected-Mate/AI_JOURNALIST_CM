import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';

/**
 * TimerConfigPopover Component
 * 
 * A popover component that allows users to configure the timer directly from the flow map.
 * This component can be triggered by clicking on the timer in the flow map.
 * 
 * @param {boolean} timerEnabled - Whether the timer is enabled
 * @param {number} timerDuration - The duration of the timer in minutes
 * @param {Function} onTimerEnabledChange - Callback when timer enabled state changes
 * @param {Function} onTimerDurationChange - Callback when timer duration changes
 * @param {React.ReactNode} children - The trigger element (usually the timer display in the flow map)
 */
const TimerConfigPopover = ({
  timerEnabled = true,
  timerDuration = 15,
  onTimerEnabledChange,
  onTimerDurationChange,
  children
}) => {
  const [localDuration, setLocalDuration] = useState(timerDuration);
  const [localEnabled, setLocalEnabled] = useState(timerEnabled);
  const [isOpen, setIsOpen] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setLocalDuration(timerDuration);
    setLocalEnabled(timerEnabled);
  }, [timerDuration, timerEnabled]);

  // Apply changes when popover closes
  const handleClose = () => {
    if (localEnabled !== timerEnabled) {
      onTimerEnabledChange(localEnabled);
    }
    if (localDuration !== timerDuration) {
      onTimerDurationChange(localDuration);
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer" onClick={() => setIsOpen(true)}>
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="center">
        <Card className="border-0 shadow-none">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Configuration du Timer</h3>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8" 
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Activer le timer</span>
              <Switch 
                checked={localEnabled} 
                onCheckedChange={setLocalEnabled} 
              />
            </div>
            
            {localEnabled && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Durée (minutes)</span>
                    <span className="text-sm font-medium text-purple-600">{localDuration} min</span>
                  </div>
                  <Slider
                    min={1}
                    max={60}
                    step={1}
                    value={[localDuration]}
                    onValueChange={([value]) => setLocalDuration(value)}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 min</span>
                    <span>30 min</span>
                    <span>60 min</span>
                  </div>
                </div>
                
                <div className="flex justify-between gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocalDuration(5)}
                    className={localDuration === 5 ? "bg-purple-50" : ""}
                  >
                    5 min
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocalDuration(10)}
                    className={localDuration === 10 ? "bg-purple-50" : ""}
                  >
                    10 min
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocalDuration(15)}
                    className={localDuration === 15 ? "bg-purple-50" : ""}
                  >
                    15 min
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocalDuration(30)}
                    className={localDuration === 30 ? "bg-purple-50" : ""}
                  >
                    30 min
                  </Button>
                </div>
              </>
            )}
            
            <div className="pt-2">
              <Button 
                variant="default" 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handleClose}
              >
                Appliquer
              </Button>
            </div>
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default TimerConfigPopover; 