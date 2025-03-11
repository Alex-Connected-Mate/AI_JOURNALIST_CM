import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface StatCard {
  title: string;
  value: number;
  description: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function Statistics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [sessionsCount, participantsCount, messagesCount] = await Promise.all([
        supabase.from('sessions').count(),
        supabase.from('session_participants').count(),
        supabase.from('messages').count()
      ]);

      return {
        sessions: sessionsCount.count || 0,
        participants: participantsCount.count || 0,
        messages: messagesCount.count || 0
      };
    }
  });

  const statCards: StatCard[] = [
    {
      title: 'Sessions Totales',
      value: stats?.sessions || 0,
      description: 'Sessions créées',
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Participants',
      value: stats?.participants || 0,
      description: 'Participants actifs',
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Messages',
      value: stats?.messages || 0,
      description: 'Messages échangés',
      trend: { value: 24, isPositive: true }
    }
  ];

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
      ))}
    </div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">{stat.title}</h3>
            {stat.trend && (
              <span className={`flex items-center ${stat.trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {stat.trend.isPositive ? '↑' : '↓'} {stat.trend.value}%
              </span>
            )}
          </div>
          <p className="text-3xl font-bold mt-2">{stat.value.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
        </Card>
      ))}
    </div>
  );
} 