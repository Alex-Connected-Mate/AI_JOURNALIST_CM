import { useState, useEffect, useCallback } from 'react';
import { Session, Message } from '@/lib/types';
import { useSession, useMessages, invalidateCache } from '@/lib/cache';
import { createRealtimeManager } from '@/lib/realtime';
import { supabase } from '@/lib/supabase';

interface UseRealtimeSessionOptions {
  sessionId: string;
  userId: string;
  onPresenceChange?: (presenceState: Record<string, any>) => void;
  onError?: (error: Error) => void;
}

interface RealtimeSessionState {
  session: Session | null;
  messages: Message[];
  participants: Record<string, any>;
  isLoading: boolean;
  error: Error | null;
}

export function useRealtimeSession({
  sessionId,
  userId,
  onPresenceChange,
  onError
}: UseRealtimeSessionOptions) {
  const [state, setState] = useState<RealtimeSessionState>({
    session: null,
    messages: [],
    participants: {},
    isLoading: true,
    error: null
  });

  // Utiliser nos hooks de cache optimisés
  const { data: sessionData, error: sessionError } = useSession(sessionId);
  const { data: messagesData, error: messagesError } = useMessages(sessionId, { limit: 50 });

  // Gestionnaire de messages en temps réel
  const handleMessage = useCallback((message: Message) => {
    setState(prev => ({
      ...prev,
      messages: [message, ...prev.messages].slice(0, 50) // Garder les 50 derniers messages
    }));

    // Invalider le cache des messages
    invalidateCache({ type: 'messages', id: sessionId });
  }, [sessionId]);

  // Gestionnaire de présence
  const handlePresence = useCallback((presenceState: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      participants: presenceState
    }));
    onPresenceChange?.(presenceState);
  }, [onPresenceChange]);

  // Gestionnaire d'erreur
  const handleError = useCallback((error: Error) => {
    setState(prev => ({
      ...prev,
      error
    }));
    onError?.(error);
  }, [onError]);

  // Effet pour la connexion en temps réel
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const initializeRealtime = async () => {
      try {
        const manager = await createRealtimeManager({
          sessionId,
          onMessage: handleMessage,
          onPresenceChange: handlePresence,
          onError: handleError
        });

        await manager.connect();

        cleanup = () => {
          manager.disconnect();
        };
      } catch (error) {
        handleError(error as Error);
      }
    };

    initializeRealtime();

    return () => {
      cleanup?.();
    };
  }, [sessionId, handleMessage, handlePresence, handleError]);

  // Mettre à jour l'état avec les données du cache
  useEffect(() => {
    setState(prev => ({
      ...prev,
      session: sessionData || null,
      messages: messagesData || [],
      isLoading: false,
      error: sessionError || messagesError || null
    }));
  }, [sessionData, messagesData, sessionError, messagesError]);

  // Actions pour interagir avec la session
  const actions = {
    // Envoyer un message
    sendMessage: async (content: string) => {
      try {
        const message: Partial<Message> = {
          session_id: sessionId,
          user_id: userId,
          content,
          type: 'text',
          created_at: new Date().toISOString()
        };

        // Optimistic update
        setState(prev => ({
          ...prev,
          messages: [message as Message, ...prev.messages]
        }));

        // Envoyer le message via Supabase
        const { data, error } = await supabase
          .from('messages')
          .insert(message)
          .single();

        if (error) throw error;

        // Invalider le cache des messages
        invalidateCache({ type: 'messages', id: sessionId });

        return data;
      } catch (error) {
        handleError(error as Error);
        // Rollback optimistic update
        setState(prev => ({
          ...prev,
          messages: prev.messages.filter(m => m.content !== content)
        }));
        throw error;
      }
    },

    // Mettre à jour la session
    updateSession: async (updates: Partial<Session>) => {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .update(updates)
          .eq('id', sessionId)
          .single();

        if (error) throw error;

        // Invalider le cache de la session
        invalidateCache({ type: 'session', id: sessionId });

        setState(prev => ({
          ...prev,
          session: { ...prev.session, ...updates } as Session
        }));

        return data;
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    }
  };

  return {
    ...state,
    actions
  };
} 