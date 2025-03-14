import React from 'react';
import Checkbox from './Checkbox';
import NumberInput from './NumberInput';

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
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Timer pour les interactions IA</h3>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-4">
        <p className="text-sm text-blue-700">
          Le timer définit la durée maximale pendant laquelle les participants peuvent interagir avec les agents IA. 
          Désactiver le timer permettra des interactions sans limite de temps.
        </p>
      </div>
      
      <Checkbox
        label="Activer le timer pour les interactions IA"
        checked={timerEnabled}
        onChange={onTimerEnabledChange}
      />
      
      {timerEnabled && (
        <div className="pl-6 border-l-2 border-gray-200">
          <NumberInput
            label="Durée du timer (minutes)"
            value={timerDuration}
            onChange={onTimerDurationChange}
            min={1}
            max={60}
          />
          
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              La durée maximale pour chaque interaction avec un agent IA. Après {timerDuration} minute{timerDuration > 1 ? 's' : ''}, 
              l'interaction sera automatiquement terminée et les insights générés seront sauvegardés.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerSettings; 