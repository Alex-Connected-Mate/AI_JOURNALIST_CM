import { useState, useEffect, useCallback } from 'react';
import { Session, Message, SessionParticipant } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface UseRealtimeSessionOptions {
  sessionId: string;
  userId: string;
  onError?: (error: Error) => void;
}

interface RealtimeSessionState {
  session: Session | null;
  messages: Message[];
  participants: Record<string, SessionParticipant>;
  isLoading: boolean;
  error: Error | null;
}

export function useRealtimeSession({
  sessionId,
  userId,
  onError
}: UseRealtimeSessionOptions) {
  const [state, setState] = useState<RealtimeSessionState>({
    session: null,
    messages: [],
    participants: {},
    isLoading: true,
    error: null
  });

  const handleError = useCallback((error: unknown) => {
    console.error('Session error:', error);
    const formattedError = error instanceof Error ? error : new Error(String(error));
    setState(prev => ({ ...prev, error: formattedError }));
    onError?.(formattedError);
  }, [onError]);

  const fetchSessionData = useCallback(async () => {
    if (!sessionId) return;

    try {
      const [sessionResult, messagesResult, participantsResult] = await Promise.all([
        // Charger la session
        supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single(),

        // Charger les messages
        supabase
          .from('messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(50),

        // Charger les participants
        supabase
          .from('session_participants')
          .select('*')
          .eq('session_id', sessionId)
      ]);

      // Vérifier les erreurs
      if (sessionResult.error) throw sessionResult.error;
      if (messagesResult.error) throw messagesResult.error;
      if (participantsResult.error) throw participantsResult.error;

      // Mettre à jour l'état
      setState(prev => ({
        ...prev,
        session: sessionResult.data,
        messages: messagesResult.data || [],
        participants: (participantsResult.data || []).reduce((acc, p) => ({
          ...acc,
          [p.user_id]: p
        }), {}),
        isLoading: false,
        error: null
      }));

    } catch (error) {
      handleError(error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [sessionId, handleError]);

  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    const startPolling = async () => {
      if (!mounted) return;
      
      try {
        await fetchSessionData();
        
        if (mounted) {
          pollInterval = setInterval(fetchSessionData, 5000);
        }
      } catch (error) {
        handleError(error);
      }
    };

    startPolling();

    return () => {
      mounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [fetchSessionData, handleError]);

  const actions = {
    sendMessage: async (content: string) => {
      if (!content.trim()) return;

      try {
        const message = {
          session_id: sessionId,
          user_id: userId,
          content: content.trim(),
          type: 'text',
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('messages')
          .insert(message)
          .single();

        if (error) throw error;

        setState(prev => ({
          ...prev,
          messages: [data, ...prev.messages].slice(0, 50)
        }));

        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    updateSession: async (updates: Partial<Session>) => {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .update(updates)
          .eq('id', sessionId)
          .single();

        if (error) throw error;

        setState(prev => ({
          ...prev,
          session: { ...prev.session, ...updates } as Session
        }));

        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    refresh: async () => {
      try {
        await fetchSessionData();
      } catch (error) {
        handleError(error);
      }
    }
  };

  return {
    ...state,
    actions
  };
} 