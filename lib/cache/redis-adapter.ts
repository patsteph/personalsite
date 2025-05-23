/**
 * Redis adapter for production caching
 * Provides Redis integration with fallback to memory cache
 */

import { CacheManager, CacheConfig, CacheEntry } from "./cache-manager";

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  connectTimeout: number;
  lazyConnect: boolean;
}

export class RedisAdapter extends CacheManager {
  private redis: any = null;
  private connected = false;
  private fallbackToMemory = true;

  constructor(
    cacheConfig: CacheConfig,
    private redisConfig: RedisConfig = {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0"),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      lazyConnect: true,
    },
  ) {
    super(cacheConfig);
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Skip Redis initialization during build time
      if (process.env.NODE_ENV === "production" && !process.env.REDIS_HOST) {
        this.connected = false;
        return;
      }

      // Try to dynamically import Redis
      let Redis: any = null;
      try {
        // @ts-ignore - Redis is optional dependency
        const redisModule = await import("ioredis");
        Redis = redisModule.default;
      } catch (importError) {
        console.warn("Redis not available, falling back to memory cache");
        this.connected = false;
        return;
      }

      this.redis = new Redis({
        ...this.redisConfig,
        retryDelayOnFailover: this.redisConfig.retryDelayOnFailover,
        maxRetriesPerRequest: this.redisConfig.maxRetriesPerRequest,
        connectTimeout: this.redisConfig.connectTimeout,
        lazyConnect: this.redisConfig.lazyConnect,
      });

      this.redis.on("connect", () => {
        this.connected = true;
        console.log("Redis connected successfully");
      });

      this.redis.on("error", (error: Error) => {
        console.error("Redis connection error:", error);
        this.connected = false;
      });

      this.redis.on("close", () => {
        this.connected = false;
        console.log("Redis connection closed");
      });

      // Test connection
      await this.redis.ping();
      this.connected = true;
    } catch (error) {
      console.error("Failed to initialize Redis:", error);
      this.connected = false;

      if (!this.fallbackToMemory) {
        throw new Error("Redis initialization failed and fallback disabled");
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected || !this.redis) {
      return super.get<T>(key);
    }

    try {
      const data = await this.redis.get(key);
      if (!data) return null;

      const entry: CacheEntry<T> = JSON.parse(data);

      // Check TTL (Redis handles this but double-check for safety)
      if (Date.now() - entry.timestamp > entry.ttl) {
        await this.redis.del(key);
        return null;
      }

      // Decompress if needed
      if (entry.compressed) {
        return this.decompress(entry.value as string) as T;
      }

      return entry.value;
    } catch (error) {
      console.error("Redis get error:", error);
      return super.get<T>(key);
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.connected || !this.redis) {
      return super.set(key, value, ttl);
    }

    try {
      const entryTTL = ttl || this.config.defaultTTL;
      let processedValue = value;
      let compressed = false;

      // Compress large values
      if (this.config.enableCompression && this.shouldCompress(value)) {
        processedValue = this.compress(value) as T;
        compressed = true;
      }

      const entry: CacheEntry<T> = {
        value: processedValue,
        timestamp: Date.now(),
        ttl: entryTTL,
        compressed,
        size: this.calculateSize(processedValue),
      };

      const serialized = JSON.stringify(entry);

      // Set with TTL in Redis
      await this.redis.setex(key, Math.ceil(entryTTL / 1000), serialized);
    } catch (error) {
      console.error("Redis set error:", error);
      return super.set(key, value, ttl);
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.connected || !this.redis) {
      return super.delete(key);
    }

    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      console.error("Redis delete error:", error);
      return super.delete(key);
    }
  }

  async clear(): Promise<void> {
    if (!this.connected || !this.redis) {
      return super.clear();
    }

    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error("Redis clear error:", error);
      return super.clear();
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.connected || !this.redis) {
      return super.exists(key);
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error("Redis exists error:", error);
      return super.exists(key);
    }
  }

  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    if (!this.connected || !this.redis || keys.length === 0) {
      return super.mget<T>(keys);
    }

    try {
      const values = await this.redis.mget(...keys);
      const result = new Map<string, T | null>();

      for (let i = 0; i < keys.length; i++) {
        const value = values[i];
        if (value) {
          try {
            const entry: CacheEntry<T> = JSON.parse(value);

            // Check TTL
            if (Date.now() - entry.timestamp <= entry.ttl) {
              const processedValue = entry.compressed
                ? (this.decompress(entry.value as string) as T)
                : entry.value;
              result.set(keys[i], processedValue);
            } else {
              result.set(keys[i], null);
            }
          } catch {
            result.set(keys[i], null);
          }
        } else {
          result.set(keys[i], null);
        }
      }

      return result;
    } catch (error) {
      console.error("Redis mget error:", error);
      return super.mget<T>(keys);
    }
  }

  async mset<T>(entries: Map<string, T>, ttl?: number): Promise<void> {
    if (!this.connected || !this.redis || entries.size === 0) {
      return super.mset(entries, ttl);
    }

    try {
      const entryTTL = ttl || this.config.defaultTTL;
      const pipeline = this.redis.pipeline();

      for (const [key, value] of entries) {
        let processedValue = value;
        let compressed = false;

        if (this.config.enableCompression && this.shouldCompress(value)) {
          processedValue = this.compress(value) as T;
          compressed = true;
        }

        const entry: CacheEntry<T> = {
          value: processedValue,
          timestamp: Date.now(),
          ttl: entryTTL,
          compressed,
          size: this.calculateSize(processedValue),
        };

        const serialized = JSON.stringify(entry);
        pipeline.setex(key, Math.ceil(entryTTL / 1000), serialized);
      }

      await pipeline.exec();
    } catch (error) {
      console.error("Redis mset error:", error);
      return super.mset(entries, ttl);
    }
  }

  keys(pattern: string): Promise<string[]> {
    if (!this.connected || !this.redis) {
      return Promise.resolve(super.keys(pattern));
    }

    try {
      return this.redis.keys(pattern);
    } catch (error) {
      console.error("Redis keys error:", error);
      return Promise.resolve(super.keys(pattern));
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.connected || !this.redis) {
      return super.expire(key, ttl);
    }

    try {
      const result = await this.redis.expire(key, Math.ceil(ttl / 1000));
      return result === 1;
    } catch (error) {
      console.error("Redis expire error:", error);
      return super.expire(key, ttl);
    }
  }

  /**
   * Redis-specific operations
   */

  async increment(key: string, by: number = 1): Promise<number> {
    if (!this.connected || !this.redis) {
      throw new Error("Redis not available for increment operation");
    }

    try {
      return await this.redis.incrby(key, by);
    } catch (error) {
      console.error("Redis increment error:", error);
      throw error;
    }
  }

  async decrement(key: string, by: number = 1): Promise<number> {
    if (!this.connected || !this.redis) {
      throw new Error("Redis not available for decrement operation");
    }

    try {
      return await this.redis.decrby(key, by);
    } catch (error) {
      console.error("Redis decrement error:", error);
      throw error;
    }
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    if (!this.connected || !this.redis) {
      throw new Error("Redis not available for list operations");
    }

    try {
      return await this.redis.lpush(key, ...values);
    } catch (error) {
      console.error("Redis lpush error:", error);
      throw error;
    }
  }

  async rpop(key: string): Promise<string | null> {
    if (!this.connected || !this.redis) {
      throw new Error("Redis not available for list operations");
    }

    try {
      return await this.redis.rpop(key);
    } catch (error) {
      console.error("Redis rpop error:", error);
      throw error;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.connected || !this.redis) {
      throw new Error("Redis not available for list operations");
    }

    try {
      return await this.redis.lrange(key, start, stop);
    } catch (error) {
      console.error("Redis lrange error:", error);
      throw error;
    }
  }

  async getConnectionStatus(): Promise<{
    connected: boolean;
    latency?: number;
    memory?: string;
    keyspace?: any;
  }> {
    if (!this.redis) {
      return { connected: false };
    }

    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;

      const info = await this.redis.info("memory");
      const keyspace = await this.redis.info("keyspace");

      return {
        connected: this.connected,
        latency,
        memory: info,
        keyspace,
      };
    } catch (error) {
      return { connected: false };
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.connected = false;
    }
  }
}

// Factory function for cache adapter
export function createCacheAdapter(
  useRedis: boolean = process.env.NODE_ENV === "production",
): CacheManager {
  const config = {
    defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || "300000"), // 5 minutes
    maxMemorySize: parseInt(process.env.CACHE_MAX_MEMORY || "104857600"), // 100MB
    enableCompression: process.env.CACHE_COMPRESSION === "true",
    strategy: (process.env.CACHE_STRATEGY as any) || "hybrid",
  };

  if (useRedis && process.env.REDIS_HOST) {
    return new RedisAdapter(config);
  } else {
    return new CacheManager(config);
  }
}
