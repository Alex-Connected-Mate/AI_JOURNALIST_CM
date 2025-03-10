import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

interface CacheConfig {
  ttl: number; // Time to live in seconds
  prefix: string;
}

const DEFAULT_CONFIG: CacheConfig = {
  ttl: 3600, // 1 hour
  prefix: 'cache:',
};

export class Cache {
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(this.getKey(key));
      return data ? (JSON.parse(data) as T) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const cacheKey = this.getKey(key);
      const serializedValue = JSON.stringify(value);
      await redis.set(cacheKey, serializedValue, {
        ex: ttl || this.config.ttl,
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await redis.del(this.getKey(key));
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(`${this.config.prefix}${pattern}`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
    }
  }
}

// Export instances préconfigurées pour différents cas d'usage
export const sessionCache = new Cache({ prefix: 'session:', ttl: 3600 });
export const userCache = new Cache({ prefix: 'user:', ttl: 1800 });
export const metricsCache = new Cache({ prefix: 'metrics:', ttl: 300 }); 