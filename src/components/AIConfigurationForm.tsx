'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { AIConfiguration } from '@/lib/types';

interface AIConfigurationFormProps {
  sessionId: string;
  onSave?: () => void;
}

export default function AIConfigurationForm({ sessionId, onSave }: AIConfigurationFormProps) {
  const { saveAIConfiguration, getAIConfiguration } = useStore();
  const [config, setConfig] = useState<Partial<AIConfiguration>>({
    session_id: sessionId,
    ai_type: 'gpt-4',
    prompt_template: '',
    temperature: 0.7,
    max_tokens: 2000
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      const existingConfig = await getAIConfiguration(sessionId);
      if (existingConfig) {
        setConfig(existingConfig);
      }
    };
    loadConfig();
  }, [sessionId, getAIConfiguration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveAIConfiguration(config);
      onSave?.();
    } catch (error) {
      console.error('Error saving AI configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Type d'IA
        </label>
        <select
          value={config.ai_type}
          onChange={(e) => setConfig({ ...config, ai_type: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Template de Prompt
        </label>
        <textarea
          value={config.prompt_template}
          onChange={(e) => setConfig({ ...config, prompt_template: e.target.value })}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Entrez votre template de prompt..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Température (0-1)
        </label>
        <input
          type="number"
          min="0"
          max="1"
          step="0.1"
          value={config.temperature}
          onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tokens Maximum
        </label>
        <input
          type="number"
          min="1"
          max="4000"
          value={config.max_tokens}
          onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
} 