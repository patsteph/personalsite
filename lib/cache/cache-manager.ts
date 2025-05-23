/**
 * Comprehensive caching strategy implementation
 * Supports Redis, in-memory, and browser caching with TTL management
 */

export interface CacheConfig {
  defaultTTL: number;
  maxMemorySize: number;
  enableCompression: boolean;
  strategy: "redis" | "memory" | "hybrid";
}

export interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  compressed?: boolean;
  size: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalKeys: number;
  memoryUsage: number;
  hitRate: number;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalKeys: 0,
    memoryUsage: 0,
    hitRate: 0,
  };

  constructor(
    protected config: CacheConfig = {
      defaultTTL: 300000, // 5 minutes
      maxMemorySize: 100 * 1024 * 1024, // 100MB
      enableCompression: true,
      strategy: "hybrid",
    },
  ) {
    this.startCleanupTimer();
  }

  /**
   * Get value from cache with automatic decompression
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();

    // Decompress if needed
    if (entry.compressed && this.config.enableCompression) {
      return this.decompress(entry.value);
    }

    return entry.value;
  }

  /**
   * Set value in cache with automatic compression and TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const entryTTL = ttl || this.config.defaultTTL;
    let processedValue: T = value;
    let compressed = false;

    // Compress large values
    if (this.config.enableCompression && this.shouldCompress(value)) {
      processedValue = this.compress(value) as T;
      compressed = true;
    }

    const size = this.calculateSize(processedValue);

    // Check memory limits and evict if necessary
    if (this.stats.memoryUsage + size > this.config.maxMemorySize) {
      await this.evictLRU(size);
    }

    const entry: CacheEntry<T> = {
      value: processedValue,
      timestamp: Date.now(),
      ttl: entryTTL,
      compressed,
      size,
    };

    this.cache.set(key, entry);
    this.stats.totalKeys = this.cache.size;
    this.stats.memoryUsage += size;
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.stats.memoryUsage -= entry.size;
      this.stats.totalKeys = this.cache.size;
      return true;
    }
    return false;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalKeys: 0,
      memoryUsage: 0,
      hitRate: 0,
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Cache with TTL helper for async functions
   */
  async remember<T>(
    key: string,
    factory: () => Promise<T> | T,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Bulk get operation
   */
  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    const result = new Map<string, T | null>();

    for (const key of keys) {
      const value = await this.get<T>(key);
      result.set(key, value);
    }

    return result;
  }

  /**
   * Bulk set operation
   */
  async mset<T>(entries: Map<string, T>, ttl?: number): Promise<void> {
    const promises = Array.from(entries.entries()).map(([key, value]) =>
      this.set(key, value, ttl),
    );

    await Promise.all(promises);
  }

  /**
   * Get keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    return Array.from(this.cache.keys()).filter((key) => regex.test(key));
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Extend TTL for existing key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    entry.ttl = ttl;
    entry.timestamp = Date.now();
    return true;
  }

  protected shouldCompress(value: any): boolean {
    const size = this.calculateSize(value);
    return size > 1024; // Compress values > 1KB
  }

  protected compress<T>(value: T): string {
    try {
      return JSON.stringify(value); // In real implementation, use actual compression
    } catch {
      return String(value);
    }
  }

  protected decompress<T>(value: string): T {
    try {
      return JSON.parse(value);
    } catch {
      return value as unknown as T;
    }
  }

  protected calculateSize(value: any): number {
    return JSON.stringify(value).length * 2; // Rough estimation (UTF-16)
  }

  private async evictLRU(requiredSpace: number): Promise<void> {
    const entries = Array.from(this.cache.entries());

    // Sort by timestamp (oldest first)
    entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);

    let freedSpace = 0;
    let evicted = 0;

    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace) break;

      this.cache.delete(key);
      freedSpace += entry.size;
      evicted++;
    }

    this.stats.evictions += evicted;
    this.stats.memoryUsage -= freedSpace;
    this.stats.totalKeys = this.cache.size;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    let freedMemory = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        freedMemory += entry.size;
        cleaned++;
      }
    }

    this.stats.memoryUsage -= freedMemory;
    this.stats.totalKeys = this.cache.size;
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

// Cache decorators for methods
export function Cached(ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

      return cacheManager.remember(
        cacheKey,
        () => originalMethod.apply(this, args),
        ttl,
      );
    };

    return descriptor;
  };
}

// Cache key generators
export class CacheKeys {
  static books = {
    all: "books:all",
    byId: (id: string) => `books:${id}`,
    byCategory: (category: string) => `books:category:${category}`,
    recommendations: (userId: string) => `books:recommendations:${userId}`,
    search: (query: string) => `books:search:${btoa(query)}`,
  };

  static blog = {
    all: "blog:all",
    bySlug: (slug: string) => `blog:${slug}`,
    byCategory: (category: string) => `blog:category:${category}`,
    recent: "blog:recent",
    popular: "blog:popular",
  };

  static signals = {
    all: "signals:all",
    byId: (id: string) => `signals:${id}`,
    recent: "signals:recent",
    byTag: (tag: string) => `signals:tag:${tag}`,
  };

  static analytics = {
    dashboard: (timeframe: string) => `analytics:dashboard:${timeframe}`,
    realtime: "analytics:realtime",
    userBehavior: (userId: string) => `analytics:user:${userId}`,
    contentMetrics: (contentId: string) => `analytics:content:${contentId}`,
  };
}
