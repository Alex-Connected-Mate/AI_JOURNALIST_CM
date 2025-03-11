import useSWR, { SWRConfiguration } from 'swr';
import { supabase } from './supabase';
import {
  Session,
  User,
  Message,
  Analytics,
  CacheConfig,
  CacheKey,
  CacheKeyType
} from './types';

// Configuration par défaut pour SWR
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 0,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  dedupingInterval: 2000,
};

// Gestionnaire de cache en mémoire pour optimiser les performances
class MemoryCache {
  private static instance: MemoryCache;
  private cache: Map<string, any>;
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache();
    }
    return MemoryCache.instance;
  }

  set(key: string, value: any, ttl: number = this.DEFAULT_TTL): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = Array.from(this.cache.keys())[0];
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Instance du cache en mémoire
const memoryCache = MemoryCache.getInstance();

// Fonction pour générer une clé de cache unique
const generateCacheKey = (key: CacheKey): string => {
  const { type, id, params } = key;
  const baseKey = id ? `${type}:${id}` : type;
  return params ? `${baseKey}:${JSON.stringify(params)}` : baseKey;
};

// Fetchers optimisés pour différents types de données
const fetchers = {
  session: async (id: string): Promise<Session> => {
    const cacheKey = `session:${id}`;
    const cachedData = memoryCache.get(cacheKey);
    if (cachedData) return cachedData;

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    memoryCache.set(cacheKey, data);
    return data;
  },

  user: async (id: string): Promise<User> => {
    const cacheKey = `user:${id}`;
    const cachedData = memoryCache.get(cacheKey);
    if (cachedData) return cachedData;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    memoryCache.set(cacheKey, data);
    return data;
  },

  messages: async (sessionId: string, params?: { limit?: number; offset?: number }): Promise<Message[]> => {
    const cacheKey = `messages:${sessionId}:${JSON.stringify(params)}`;
    const cachedData = memoryCache.get(cacheKey);
    if (cachedData) return cachedData;

    let query = supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (params?.limit) {
      query = query.limit(params.limit);
    }
    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Cache messages avec un TTL plus court
    memoryCache.set(cacheKey, data, 30 * 1000); // 30 secondes
    return data;
  },

  analytics: async (sessionId: string): Promise<Analytics> => {
    const cacheKey = `analytics:${sessionId}`;
    const cachedData = memoryCache.get(cacheKey);
    if (cachedData) return cachedData;

    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (error) throw error;
    memoryCache.set(cacheKey, data);
    return data;
  },
};

// Hooks optimisés avec types
export function useSession(id: string, config?: CacheConfig) {
  return useSWR<Session>(
    generateCacheKey({ type: 'session', id }),
    () => fetchers.session(id),
    { ...defaultConfig, ...config }
  );
}

export function useUser(id: string, config?: CacheConfig) {
  return useSWR<User>(
    generateCacheKey({ type: 'user', id }),
    () => fetchers.user(id),
    { ...defaultConfig, ...config }
  );
}

export function useMessages(
  sessionId: string,
  params?: { limit?: number; offset?: number },
  config?: CacheConfig
) {
  return useSWR<Message[]>(
    generateCacheKey({ type: 'messages', id: sessionId, params }),
    () => fetchers.messages(sessionId, params),
    {
      ...defaultConfig,
      ...config,
      refreshInterval: 5000, // Rafraîchir les messages toutes les 5 secondes
    }
  );
}

export function useAnalytics(sessionId: string, config?: CacheConfig) {
  return useSWR<Analytics>(
    generateCacheKey({ type: 'analytics', id: sessionId }),
    () => fetchers.analytics(sessionId),
    { ...defaultConfig, ...config }
  );
}

// Fonction utilitaire pour invalider manuellement le cache
export function invalidateCache(key: CacheKey): void {
  const cacheKey = generateCacheKey(key);
  memoryCache.clear();
  const { mutate } = useSWR(cacheKey);
  mutate();
}

// Fonction utilitaire pour précharger les données
export async function prefetchData(key: CacheKey): Promise<void> {
  const { type, id, params } = key;
  
  if (!id || !fetchers[type]) return;
  
  try {
    const data = await fetchers[type](id, params);
    const cacheKey = generateCacheKey(key);
    memoryCache.set(cacheKey, data);
    const { mutate } = useSWR(cacheKey);
    mutate(data, false);
  } catch (error) {
    console.error('Prefetch error:', error);
  }
}

// Fonction pour nettoyer le cache périodiquement
export function initializeCacheCleanup(interval: number = 5 * 60 * 1000): () => void {
  const cleanup = setInterval(() => {
    memoryCache.clear();
  }, interval);

  return () => clearInterval(cleanup);
} 