'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';
import QRCode from '@/components/QRCode';
import CopyButton from '@/components/CopyButton';
import { getSessionById } from '@/lib/supabase';

export default function SessionManagePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useStore();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  
  useEffect(() => {
    // Redirect to login if user not authenticated
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    const fetchSession = async () => {
      setLoading(true);
      try {
        // Add null check for params
        if (!params?.id) {
          throw new Error('Session ID not found');
        }
        
        const sessionId = params.id as string;
        const { data, error } = await getSessionById(sessionId);
        
        if (error) {
          throw new Error(error.message || 'Failed to fetch session');
        }
        
        if (!data) {
          throw new Error('Session not found');
        }
        
        // Verify the user is the owner of this session
        if (data.user_id !== user.id) {
          throw new Error('You do not have permission to manage this session');
        }
        
        // Verify session is active
        if (data.status !== 'active') {
          router.push(`/sessions/${sessionId}/preview`);
          return;
        }
        
        setSession(data);
        
        // Get participant count
        const { count } = await supabase
          .from('participants')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', sessionId);
          
        setParticipantCount(count || 0);
      } catch (err: any) {
        console.error('Error fetching session:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSession();
    
    // Set up real-time listener for participants
    const participantsSubscription = supabase
      .channel(`session_${params?.id || 'unknown'}_participants`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'participants',
        filter: `session_id=eq.${params?.id || 'unknown'}`
      }, (payload) => {
        // Update participant count
        if (payload.eventType === 'INSERT') {
          setParticipantCount(prev => prev + 1);
        } else if (payload.eventType === 'DELETE') {
          setParticipantCount(prev => Math.max(0, prev - 1));
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(participantsSubscription);
    };
  }, [user, params?.id, router]);
  
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Chargement de la session...</div>;
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg max-w-md w-full text-center">
          <h2 className="text-red-700 font-medium">Erreur</h2>
          <p className="text-red-600">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => router.push('/dashboard')}
          >
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return null;
  }
  
  // Create join URL for participants
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : '';
  const joinUrl = `${baseUrl}/join/${session.code}`;
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Session Header */}
          <div 
            className="p-6 text-white" 
            style={{ backgroundColor: session.settings?.connection?.color || '#3490dc' }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">{session.title || session.name}</h1>
                <p className="text-lg opacity-90">{session.institution || session.settings?.institution}</p>
                {(session.professor_name || session.settings?.professorName) && (
                  <p className="text-sm opacity-80 mt-1">
                    par {session.professor_name || session.settings?.professorName}
                  </p>
                )}
              </div>
              <div className="text-4xl">{session.settings?.connection?.emoji || '🎓'}</div>
            </div>
          </div>
          
          {/* Session Content */}
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Column - Session Status */}
              <div className="flex-1">
                <div className="bg-green-50 p-6 rounded-lg border border-green-100 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-500 rounded-full w-4 h-4 animate-pulse"></div>
                    <h2 className="text-xl font-semibold text-green-800">Session Active</h2>
                  </div>
                  <p className="text-green-700 mb-2">
                    Votre session est active et prête à recevoir des participants.
                  </p>
                  <p className="text-green-600 text-sm">
                    {participantCount} participant{participantCount !== 1 ? 's' : ''} connecté{participantCount !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
                  <h3 className="text-lg font-medium mb-4">Accès à la session</h3>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4 flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-shrink-0">
                      <QRCode value={joinUrl} size={150} />
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-gray-600 mb-2">Les participants peuvent rejoindre via :</p>
                      <div className="bg-white p-2 rounded border border-gray-200 flex items-center justify-between mb-3">
                        <span className="text-gray-800 font-mono text-sm">{joinUrl}</span>
                        <CopyButton textToCopy={joinUrl} />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Code d'accès :</span>
                        <span className="font-mono font-bold text-lg bg-primary/10 px-2 py-1 rounded text-primary">
                          {session.code || session.session_code || session.access_code}
                        </span>
                        <CopyButton textToCopy={session.code || session.session_code || session.access_code} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Actions */}
              <div className="lg:w-80 space-y-4">
                <Link
                  href={`/sessions/${session.id}/run`}
                  className="block w-full bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-lg text-center font-medium transition-colors"
                >
                  Lancer la présentation
                </Link>
                
                <Link
                  href={`/sessions/${session.id}`}
                  className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg text-center font-medium transition-colors"
                >
                  Gérer la session
                </Link>
                
                <Link
                  href={`/sessions/${session.id}/edit`}
                  className="block w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg text-center font-medium transition-colors"
                >
                  Modifier la session
                </Link>
                
                <Link
                  href="/dashboard"
                  className="block w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg text-center font-medium transition-colors"
                >
                  Retour au tableau de bord
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 