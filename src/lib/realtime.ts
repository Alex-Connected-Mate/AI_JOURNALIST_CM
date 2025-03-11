import { RealtimeChannel, RealtimePresence } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface RealtimeConfig {
  sessionId: string;
  onPresenceChange?: (state: Record<string, any>) => void;
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
}

// Singleton pour gérer toutes les connexions Realtime
class RealtimeConnectionManager {
  private static instance: RealtimeConnectionManager;
  private connections: Map<string, RealtimeManager> = new Map();
  private connectionCount = 0;
  private readonly MAX_CONNECTIONS = 5;

  private constructor() {}

  static getInstance(): RealtimeConnectionManager {
    if (!RealtimeConnectionManager.instance) {
      RealtimeConnectionManager.instance = new RealtimeConnectionManager();
    }
    return RealtimeConnectionManager.instance;
  }

  async getConnection(config: RealtimeConfig): Promise<RealtimeManager> {
    const existingConnection = this.connections.get(config.sessionId);
    if (existingConnection) {
      return existingConnection;
    }

    if (this.connectionCount >= this.MAX_CONNECTIONS) {
      // Fermer la connexion la plus ancienne si nous atteignons la limite
      const firstKey = Array.from(this.connections.keys())[0];
      if (firstKey) {
        await this.closeConnection(firstKey);
      }
    }

    const newConnection = new RealtimeManager(config);
    this.connections.set(config.sessionId, newConnection);
    this.connectionCount++;
    return newConnection;
  }

  async closeConnection(sessionId: string): Promise<void> {
    const connection = this.connections.get(sessionId);
    if (connection) {
      await connection.disconnect();
      this.connections.delete(sessionId);
      this.connectionCount--;
    }
  }

  async closeAllConnections(): Promise<void> {
    const sessionIds = Array.from(this.connections.keys());
    for (const sessionId of sessionIds) {
      await this.closeConnection(sessionId);
    }
  }
}

class RealtimeManager {
  private channel: RealtimeChannel | null = null;
  private presence: RealtimePresence | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private config: RealtimeConfig;
  private messageQueue: any[] = [];
  private isProcessingQueue = false;
  private readonly MAX_QUEUE_SIZE = 100;

  constructor(config: RealtimeConfig) {
    this.config = config;
  }

  async connect() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const presenceKey = user?.id || 'anonymous';

      this.channel = supabase.channel(`session:${this.config.sessionId}`, {
        config: {
          presence: {
            key: presenceKey,
          },
        },
      });

      if (this.config.onPresenceChange) {
        this.presence = this.channel.presence;
        this.channel.on('presence', { event: 'sync' }, () => {
          const state = this.presence?.state || {};
          this.config.onPresenceChange?.(state);
        });
      }

      // Optimisation du traitement des messages avec une file d'attente
      this.channel.on('broadcast', { event: 'message' }, ({ payload }) => {
        this.queueMessage(payload);
      });

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

      const status = await this.channel.subscribe();
      if (!status || (status as any).error) {
        throw new Error(`Failed to subscribe to channel: ${(status as any).error?.message || 'Unknown error'}`);
      }

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

  private async queueMessage(message: any) {
    if (this.messageQueue.length >= this.MAX_QUEUE_SIZE) {
      this.messageQueue.shift(); // Supprimer le message le plus ancien si la file est pleine
    }
    this.messageQueue.push(message);
    
    if (!this.isProcessingQueue) {
      await this.processMessageQueue();
    }
  }

  private async processMessageQueue() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) return;

    this.isProcessingQueue = true;
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      try {
        await this.config.onMessage?.(message);
      } catch (error) {
        this.handleError(error as Error);
      }
      // Petite pause entre chaque traitement pour éviter de bloquer le thread
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    this.isProcessingQueue = false;
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
      if (!this.channel || !this.presence) {
        throw new Error('Channel or presence not initialized');
      }

      await this.channel.track(state);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async disconnect() {
    try {
      if (this.channel) {
        if (this.presence) {
          await this.channel.untrack();
        }
        await this.channel.unsubscribe();
      }
    } catch (error) {
      this.handleError(error as Error);
    }
  }
}

// Export singleton instance
export const realtimeManager = RealtimeConnectionManager.getInstance();
export function createRealtimeManager(config: RealtimeConfig) {
  return realtimeManager.getConnection(config);
} 