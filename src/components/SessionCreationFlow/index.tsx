import { FC, useState, useEffect } from 'react';
import { SessionConfigType } from '@/types/session';

interface SessionCreationFlowProps {
  initialConfig: SessionConfigType;
  onSubmit: (config: Partial<SessionConfigType>) => Promise<void>;
  isSubmitting: boolean;
  currentStep: 'basic' | 'ai' | 'review';
  onStepChange: (step: 'basic' | 'ai' | 'review') => void;
}

const SessionCreationFlow: FC<SessionCreationFlowProps> = ({
  initialConfig,
  onSubmit,
  isSubmitting,
  currentStep,
  onStepChange
}) => {
  const [config, setConfig] = useState<SessionConfigType>(initialConfig);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleChange = (field: keyof SessionConfigType, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  return (
    <div className="space-y-6">
      {currentStep === 'basic' && (
        <div className="basic-info">
          <h2 className="text-xl font-semibold mb-4">Informations de base</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom de la session*
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={config.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Institution
              </label>
              <input
                type="text"
                value={config.institution}
                onChange={(e) => handleChange('institution', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom du professeur
              </label>
              <input
                type="text"
                value={config.professorName}
                onChange={(e) => handleChange('professorName', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre maximum de participants*
              </label>
              <input
                type="number"
                value={config.maxParticipants}
                onChange={(e) => handleChange('maxParticipants', parseInt(e.target.value))}
                min="1"
                max="9999"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={config.showProfessorName}
                onChange={(e) => handleChange('showProfessorName', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Afficher le nom du professeur
              </label>
            </div>
          </form>
        </div>
      )}

      {currentStep === 'ai' && (
        <div className="ai-config">
          <h2 className="text-xl font-semibold mb-4">Configuration de l'IA</h2>
          <div className="space-y-6">
            <div className="nuggets-config">
              <h3 className="text-lg font-medium mb-3">Configuration Nuggets</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Style d'extraction
                  </label>
                  <textarea
                    value={JSON.stringify(config.aiInteraction.configuration.nuggets.style, null, 2)}
                    onChange={(e) => {
                      try {
                        const style = JSON.parse(e.target.value);
                        handleChange('aiInteraction', {
                          ...config.aiInteraction,
                          configuration: {
                            ...config.aiInteraction.configuration,
                            nuggets: {
                              ...config.aiInteraction.configuration.nuggets,
                              style
                            }
                          }
                        });
                      } catch (err) {
                        // Ignorer les erreurs de parsing JSON
                      }
                    }}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Règles d'extraction
                  </label>
                  <textarea
                    value={config.aiInteraction.configuration.nuggets.rules.join('\n')}
                    onChange={(e) => {
                      const rules = e.target.value.split('\n').filter(rule => rule.trim());
                      handleChange('aiInteraction', {
                        ...config.aiInteraction,
                        configuration: {
                          ...config.aiInteraction.configuration,
                          nuggets: {
                            ...config.aiInteraction.configuration.nuggets,
                            rules
                          }
                        }
                      });
                    }}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Une règle par ligne"
                  />
                </div>
              </div>
            </div>

            <div className="lightbulbs-config">
              <h3 className="text-lg font-medium mb-3">Configuration Lightbulbs</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Style de génération
                  </label>
                  <textarea
                    value={JSON.stringify(config.aiInteraction.configuration.lightbulbs.style, null, 2)}
                    onChange={(e) => {
                      try {
                        const style = JSON.parse(e.target.value);
                        handleChange('aiInteraction', {
                          ...config.aiInteraction,
                          configuration: {
                            ...config.aiInteraction.configuration,
                            lightbulbs: {
                              ...config.aiInteraction.configuration.lightbulbs,
                              style
                            }
                          }
                        });
                      } catch (err) {
                        // Ignorer les erreurs de parsing JSON
                      }
                    }}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Règles de génération
                  </label>
                  <textarea
                    value={config.aiInteraction.configuration.lightbulbs.rules.join('\n')}
                    onChange={(e) => {
                      const rules = e.target.value.split('\n').filter(rule => rule.trim());
                      handleChange('aiInteraction', {
                        ...config.aiInteraction,
                        configuration: {
                          ...config.aiInteraction.configuration,
                          lightbulbs: {
                            ...config.aiInteraction.configuration.lightbulbs,
                            rules
                          }
                        }
                      });
                    }}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Une règle par ligne"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'review' && (
        <div className="review">
          <h2 className="text-xl font-semibold mb-4">Vérification finale</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Informations de base</h3>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nom</dt>
                  <dd className="mt-1 text-sm text-gray-900">{config.title}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{config.description || 'Non spécifiée'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Institution</dt>
                  <dd className="mt-1 text-sm text-gray-900">{config.institution || 'Non spécifiée'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Professeur</dt>
                  <dd className="mt-1 text-sm text-gray-900">{config.professorName || 'Non spécifié'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Participants maximum</dt>
                  <dd className="mt-1 text-sm text-gray-900">{config.maxParticipants}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">Configuration IA</h3>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Règles Nuggets</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <ul className="list-disc pl-5">
                      {config.aiInteraction.configuration.nuggets.rules.map((rule, index) => (
                        <li key={index}>{rule}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Règles Lightbulbs</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <ul className="list-disc pl-5">
                      {config.aiInteraction.configuration.lightbulbs.rules.map((rule, index) => (
                        <li key={index}>{rule}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-6">
        {currentStep !== 'basic' && (
          <button
            type="button"
            onClick={() => onStepChange(currentStep === 'review' ? 'ai' : 'basic')}
            className="cm-button-secondary"
          >
            Retour
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="cm-button"
        >
          {isSubmitting ? 'Création...' : currentStep === 'review' ? 'Créer la session' : 'Continuer'}
        </button>
      </div>
    </div>
  );
};

export default SessionCreationFlow; 