import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface TimerSettingsProps {
  timerEnabled: boolean;
  timerDuration: number;
  onTimerEnabledChange: (enabled: boolean) => void;
  onTimerDurationChange: (duration: number) => void;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({
  timerEnabled,
  timerDuration,
  onTimerEnabledChange,
  onTimerDurationChange
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900">Timer pour les interactions IA</h3>
        
        <p className="text-sm text-gray-600">
          Le timer définit la durée maximale pendant laquelle les participants peuvent interagir avec les agents IA.
          Désactiver le timer permettra des interactions sans limite de temps.
        </p>
        
        <div className="mt-3 flex items-center space-x-2">
          <Switch 
            id="timer-enabled" 
            checked={timerEnabled}
            onChange={(e) => onTimerEnabledChange(e.target.checked)}
          />
          <Label htmlFor="timer-enabled">Activer le timer pour les interactions IA</Label>
        </div>
      </div>
      
      {timerEnabled && (
        <div className="space-y-2">
          <Label htmlFor="timer-duration">Durée du timer (minutes)</Label>
          <div className="flex items-center">
            <button 
              onClick={() => onTimerDurationChange(Math.max(1, timerDuration - 1))}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-l-md border border-gray-300"
            >
              -
            </button>
            <Input 
              id="timer-duration"
              type="number" 
              min="1" 
              max="60"
              value={timerDuration} 
              onChange={(e) => onTimerDurationChange(Number(e.target.value))}
              className="rounded-none text-center border-l-0 border-r-0"
            />
            <button 
              onClick={() => onTimerDurationChange(Math.min(60, timerDuration + 1))}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-r-md border border-gray-300"
            >
              +
            </button>
          </div>
          <p className="text-sm text-gray-600">
            La durée maximale pour chaque interaction avec un agent IA. Après {timerDuration} minute{timerDuration > 1 ? 's' : ''},
            l'interaction sera automatiquement terminée et les insights générés seront sauvegardés.
          </p>
          <p className="text-sm font-medium text-gray-700 mt-2">
            Ce timer s'applique globalement à toutes les interactions IA, quel que soit l'agent utilisé.
          </p>
        </div>
      )}
    </div>
  );
};

export default TimerSettings; 