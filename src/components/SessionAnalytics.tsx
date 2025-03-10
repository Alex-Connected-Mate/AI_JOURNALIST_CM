'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { SessionAnalytics } from '@/lib/types';

interface SessionAnalyticsProps {
  sessionId: string;
}

export default function SessionAnalyticsView({ sessionId }: SessionAnalyticsProps) {
  const { getSessionAnalytics } = useStore();
  const [analytics, setAnalytics] = useState<SessionAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const data = await getSessionAnalytics(sessionId);
        setAnalytics(data);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [sessionId, getSessionAnalytics]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Statistiques générales */}
        <div className="first-level-block p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vue d'ensemble</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total des participants</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.find(a => a.analysis_type === 'overview')?.data.total_participants || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Temps moyen de participation</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.find(a => a.analysis_type === 'overview')?.data.average_duration || '0min'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Taux d'engagement</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.find(a => a.analysis_type === 'overview')?.data.engagement_rate || '0%'}
              </p>
            </div>
          </div>
        </div>

        {/* Analyse des votes */}
        <div className="first-level-block p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyse des votes</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total des votes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.find(a => a.analysis_type === 'votes')?.data.total_votes || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Participants les plus votés</p>
              <div className="mt-2 space-y-2">
                {analytics.find(a => a.analysis_type === 'votes')?.data.top_voted?.map((participant: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{participant.name}</span>
                    <span className="text-sm font-medium text-gray-900">{participant.votes} votes</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Analyse des interactions IA */}
        <div className="first-level-block p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Interactions IA</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total des interactions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.find(a => a.analysis_type === 'ai')?.data.total_interactions || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Temps moyen de réponse</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.find(a => a.analysis_type === 'ai')?.data.average_response_time || '0s'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Taux de satisfaction</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.find(a => a.analysis_type === 'ai')?.data.satisfaction_rate || '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques et visualisations */}
      <div className="first-level-block p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Visualisations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ici, vous pouvez ajouter des graphiques avec une bibliothèque comme Chart.js ou D3.js */}
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Graphique d'engagement</p>
          </div>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Distribution des votes</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button className="cm-button-secondary">
          Exporter les données
        </button>
        <button className="cm-button">
          Générer un rapport
        </button>
      </div>
    </div>
  );
} 