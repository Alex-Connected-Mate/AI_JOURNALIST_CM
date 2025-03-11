'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function SessionReportPage() {
  const params = useParams();
  
  // Vérification de sécurité pour s'assurer que l'ID est présent
  if (!params?.id) {
    return <div>ID de session invalide</div>;
  }

  const sessionId = params.id as string;

  const { data: sessionData, isLoading, error } = useQuery({
    queryKey: ['session-report', sessionId],
    queryFn: async () => {
      try {
        const [session, messages, participants] = await Promise.all([
          supabase.from('sessions').select('*').eq('id', sessionId).single(),
          supabase.from('messages').select('*').eq('session_id', sessionId),
          supabase.from('session_participants').select('*').eq('session_id', sessionId)
        ]);

        if (!session.data) {
          throw new Error('Session non trouvée');
        }

        return {
          session: session.data,
          messages: messages.data || [],
          participants: participants.data || []
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        throw error;
      }
    }
  });

  const generateReport = () => {
    if (!sessionData) return null;

    const messagesByParticipant = sessionData.messages.reduce((acc, message) => {
      acc[message.user_id] = (acc[message.user_id] || 0) + 1;
      return acc;
    }, {});

    const participationData = sessionData.participants.map(participant => ({
      name: participant.name,
      messages: messagesByParticipant[participant.id] || 0
    }));

    return {
      participationData,
      totalMessages: sessionData.messages.length,
      averageMessagesPerParticipant: Math.round(
        sessionData.messages.length / sessionData.participants.length
      ),
      duration: Math.round(
        (new Date(sessionData.session.ended_at).getTime() -
          new Date(sessionData.session.started_at).getTime()) /
          (1000 * 60)
      )
    };
  };

  const exportData = async (format: 'csv' | 'json') => {
    if (!sessionData) return;

    const data = {
      session: sessionData.session,
      messages: sessionData.messages,
      participants: sessionData.participants
    };

    if (format === 'csv') {
      const csvContent = [
        // En-têtes
        ['Message ID', 'User ID', 'Content', 'Timestamp'].join(','),
        // Données
        ...sessionData.messages.map(msg =>
          [msg.id, msg.user_id, `"${msg.content}"`, msg.created_at].join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${sessionId}-export.csv`;
      a.click();
    } else {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${sessionId}-export.json`;
      a.click();
    }
  };

  if (isLoading) {
    return <div>Chargement du rapport...</div>;
  }

  const report = generateReport();
  if (!report) return <div>Aucune donnée disponible</div>;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Rapport de Session</h1>

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Messages Totaux</h3>
          <p className="text-3xl font-bold">{report.totalMessages}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Moyenne par Participant</h3>
          <p className="text-3xl font-bold">
            {report.averageMessagesPerParticipant}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Durée (minutes)</h3>
          <p className="text-3xl font-bold">{report.duration}</p>
        </Card>
      </div>

      {/* Graphique de participation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Participation par Utilisateur</h3>
        <div className="w-full overflow-x-auto">
          <BarChart
            width={800}
            height={400}
            data={report.participationData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="messages" fill="#8884d8" name="Messages envoyés" />
          </BarChart>
        </div>
      </Card>

      {/* Export des données */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Exporter les données</h3>
        <div className="flex gap-4">
          <Button onClick={() => exportData('csv')}>
            Exporter en CSV
          </Button>
          <Button onClick={() => exportData('json')}>
            Exporter en JSON
          </Button>
        </div>
      </Card>
    </div>
  );
} 