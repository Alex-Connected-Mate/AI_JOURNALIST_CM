import { useState, useEffect } from 'react';

const VoteSettings = ({ initialSettings, onChange }) => {
  const [settings, setSettings] = useState({
    max_votes_per_participant: 3,
    require_reason: false,
    voting_duration: 1200, // 20 minutes en secondes
    top_voted_count: 3,
    ...initialSettings
  });

  useEffect(() => {
    if (onChange) {
      onChange(settings);
    }
  }, [settings, onChange]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
    }));
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="first-level-block p-6 space-y-6">
      <h2 className="text-xl font-bold mb-4 font-bricolage">Configuration du système de vote</h2>
      
      <p className="text-gray-600 mb-6">
        Configurez comment les participants pourront voter les uns pour les autres pendant la session.
      </p>
      
      <div className="space-y-6">
        {/* Nombre maximum de votes par participant */}
        <div>
          <label htmlFor="max_votes_per_participant" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre maximum de votes par participant
          </label>
          <div className="flex items-center">
            <input
              type="number"
              id="max_votes_per_participant"
              name="max_votes_per_participant"
              value={settings.max_votes_per_participant}
              onChange={handleChange}
              min={1}
              max={10}
              className="cm-input w-24"
            />
            <span className="ml-2 text-sm text-gray-500">vote(s) par personne</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Chaque participant pourra voter pour ce nombre maximum de personnes pendant la session.
          </p>
        </div>
        
        {/* Nombre de participants "top-voted" */}
        <div>
          <label htmlFor="top_voted_count" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de participants sélectionnés pour les "nuggets"
          </label>
          <div className="flex items-center">
            <input
              type="number"
              id="top_voted_count"
              name="top_voted_count"
              value={settings.top_voted_count}
              onChange={handleChange}
              min={1}
              max={10}
              className="cm-input w-24"
            />
            <span className="ml-2 text-sm text-gray-500">participant(s) les mieux votés</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Les participants avec le plus de votes seront invités à échanger avec l'IA "nuggets".
          </p>
        </div>
        
        {/* Durée du vote */}
        <div>
          <label htmlFor="voting_duration" className="block text-sm font-medium text-gray-700 mb-1">
            Durée de la phase de vote
          </label>
          <div className="flex items-center gap-3">
            <select
              id="voting_duration"
              name="voting_duration"
              value={settings.voting_duration}
              onChange={handleChange}
              className="cm-input"
            >
              <option value={600}>10 minutes</option>
              <option value={900}>15 minutes</option>
              <option value={1200}>20 minutes</option>
              <option value={1800}>30 minutes</option>
              <option value={2700}>45 minutes</option>
              <option value={3600}>60 minutes</option>
              <option value={7200}>2 heures</option>
            </select>
            <span className="text-sm text-gray-500">
              Durée: {formatDuration(settings.voting_duration)}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            La phase de vote durera ce temps avant de passer automatiquement à la phase suivante.
          </p>
        </div>
        
        {/* Exiger une raison */}
        <div>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="require_reason"
                name="require_reason"
                type="checkbox"
                checked={settings.require_reason}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="require_reason" className="font-medium text-gray-700">
                Exiger une raison pour chaque vote
              </label>
              <p className="text-gray-500">
                Les participants devront expliquer brièvement pourquoi ils votent pour quelqu'un.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <h3 className="text-md font-semibold text-blue-800 mb-2">Comment fonctionne le vote?</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Les participants se connectent et interagissent entre eux physiquement</li>
          <li>Quand ils rencontrent quelqu'un d'intéressant, ils votent pour cette personne</li>
          <li>À la fin du timer, les {settings.top_voted_count} participants avec le plus de votes interagiront avec l'IA "nuggets"</li>
          <li>Les autres participants pourront soit discuter avec l'IA "light bulbs", soit attendre</li>
        </ol>
      </div>
    </div>
  );
};

export default VoteSettings; 