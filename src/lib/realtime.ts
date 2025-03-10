import { RealtimeChannel, RealtimePresence } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface RealtimeConfig {
  sessionId: string;
  onPresenceChange?: (state: Record<string, any>) => void;
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
}

class RealtimeManager {
  private channel: RealtimeChannel | null = null;
  private presence: RealtimePresence | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private config: RealtimeConfig;

  constructor(config: RealtimeConfig) {
    this.config = config;
  }

  async connect() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const presenceKey = user?.id || 'anonymous';

      // Subscribe to the session channel
      this.channel = supabase.channel(`session:${this.config.sessionId}`, {
        config: {
          presence: {
            key: presenceKey,
          },
        },
      });

      // Set up presence handling
      if (this.config.onPresenceChange) {
        this.presence = this.channel.presence;
        this.channel.on('presence', { event: 'sync' }, () => {
          const state = this.presence?.state || {};
          this.config.onPresenceChange?.(state);
        });
      }

      // Set up message handling
      this.channel.on('broadcast', { event: 'message' }, ({ payload }) => {
        this.config.onMessage?.(payload);
      });

      // Handle connection state changes
      this.channel.on('system', { event: '*' }, ({ event }) => {
        switch (event) {
          case 'disconnect':
            this.handleDisconnect();
            break;
          case 'reconnect':
            this.reconnectAttempts = 0;
            break;
          case 'error':
            this.handleError(new Error('Realtime connection error'));
            break;
        }
      });

      // Subscribe to the channel
      const { error } = await this.channel.subscribe();
      if (error) {
        throw new Error(`Failed to subscribe to channel: ${error.message}`);
      }

      // Track presence
      if (this.presence) {
        await this.channel.track({
          online_at: new Date().toISOString(),
          user_id: presenceKey,
        });
      }
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private async handleDisconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handleError(new Error('Maximum reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.handleError(error as Error);
      }
    }, delay);
  }

  private handleError(error: Error) {
    console.error('Realtime error:', error);
    this.config.onError?.(error);
  }

  async sendMessage(message: any) {
    try {
      if (!this.channel) {
        throw new Error('Channel not initialized');
      }

      await this.channel.send({
        type: 'broadcast',
        event: 'message',
        payload: message,
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async updatePresence(state: Record<string, any>) {
    try {
      if (!this.presence) {
        throw new Error('Presence not initialized');
      }

      await this.presence.update(state);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async disconnect() {
    try {
      if (this.presence) {
        await this.presence.leave();
      }
      if (this.channel) {
        await this.channel.unsubscribe();
      }
    } catch (error) {
      this.handleError(error as Error);
    }
  }
}

export function createRealtimeManager(config: RealtimeConfig) {
  return new RealtimeManager(config);
} 