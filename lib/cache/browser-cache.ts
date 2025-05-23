/**
 * Browser-side caching utilities
 * Implements client-side caching with IndexedDB, localStorage, and sessionStorage
 */

export interface BrowserCacheConfig {
  defaultTTL: number;
  maxLocalStorageSize: number;
  maxSessionStorageSize: number;
  enableIndexedDB: boolean;
  dbName: string;
  dbVersion: number;
}

export interface CachedItem<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

export type StorageType =
  | "localStorage"
  | "sessionStorage"
  | "indexedDB"
  | "memory";

export class BrowserCache {
  private memoryCache = new Map<string, CachedItem>();
  private db: IDBDatabase | null = null;
  private dbInitialized = false;

  constructor(
    private config: BrowserCacheConfig = {
      defaultTTL: 300000, // 5 minutes
      maxLocalStorageSize: 5 * 1024 * 1024, // 5MB
      maxSessionStorageSize: 10 * 1024 * 1024, // 10MB
      enableIndexedDB: true,
      dbName: "AppCache",
      dbVersion: 1,
    },
  ) {
    if (typeof window !== "undefined" && this.config.enableIndexedDB) {
      this.initializeIndexedDB();
    }
  }

  /**
   * Get item from cache with automatic storage selection
   */
  async get<T>(key: string, preferredStorage?: StorageType): Promise<T | null> {
    // Try memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && this.isValidItem(memoryItem)) {
      this.updateAccessStats(memoryItem);
      return memoryItem.value;
    }

    // Try IndexedDB if available and preferred
    if (
      this.dbInitialized &&
      (preferredStorage === "indexedDB" || !preferredStorage)
    ) {
      const dbItem = await this.getFromIndexedDB<T>(key);
      if (dbItem) {
        this.memoryCache.set(key, dbItem); // Cache in memory for faster access
        return dbItem.value;
      }
    }

    // Try localStorage
    if (preferredStorage === "localStorage" || !preferredStorage) {
      const localItem = this.getFromLocalStorage<T>(key);
      if (localItem) {
        this.memoryCache.set(key, localItem);
        return localItem.value;
      }
    }

    // Try sessionStorage
    if (preferredStorage === "sessionStorage" || !preferredStorage) {
      const sessionItem = this.getFromSessionStorage<T>(key);
      if (sessionItem) {
        this.memoryCache.set(key, sessionItem);
        return sessionItem.value;
      }
    }

    return null;
  }

  /**
   * Set item in cache with automatic storage selection
   */
  async set<T>(
    key: string,
    value: T,
    options: {
      ttl?: number;
      storage?: StorageType;
      persist?: boolean;
    } = {},
  ): Promise<void> {
    const ttl = options.ttl || this.config.defaultTTL;
    const item: CachedItem<T> = {
      value,
      timestamp: Date.now(),
      ttl,
      size: this.calculateSize(value),
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    // Always cache in memory for fast access
    this.memoryCache.set(key, item);

    // Determine storage strategy
    const storage = options.storage || this.selectOptimalStorage(item);

    switch (storage) {
      case "indexedDB":
        if (this.dbInitialized) {
          await this.setInIndexedDB(key, item);
        } else {
          await this.setInLocalStorage(key, item);
        }
        break;

      case "localStorage":
        await this.setInLocalStorage(key, item);
        break;

      case "sessionStorage":
        await this.setInSessionStorage(key, item);
        break;

      case "memory":
        // Already cached in memory
        break;
    }
  }

  /**
   * Delete item from all storage locations
   */
  async delete(key: string): Promise<boolean> {
    let deleted = false;

    // Remove from memory
    if (this.memoryCache.delete(key)) {
      deleted = true;
    }

    // Remove from IndexedDB
    if (this.dbInitialized) {
      const dbDeleted = await this.deleteFromIndexedDB(key);
      deleted = deleted || dbDeleted;
    }

    // Remove from localStorage
    try {
      localStorage.removeItem(key);
      deleted = true;
    } catch (error) {
      console.warn("Failed to remove from localStorage:", error);
    }

    // Remove from sessionStorage
    try {
      sessionStorage.removeItem(key);
      deleted = true;
    } catch (error) {
      console.warn("Failed to remove from sessionStorage:", error);
    }

    return deleted;
  }

  /**
   * Clear all cached items
   */
  async clear(storage?: StorageType): Promise<void> {
    if (!storage || storage === "memory") {
      this.memoryCache.clear();
    }

    if (!storage || storage === "indexedDB") {
      await this.clearIndexedDB();
    }

    if (!storage || storage === "localStorage") {
      try {
        localStorage.clear();
      } catch (error) {
        console.warn("Failed to clear localStorage:", error);
      }
    }

    if (!storage || storage === "sessionStorage") {
      try {
        sessionStorage.clear();
      } catch (error) {
        console.warn("Failed to clear sessionStorage:", error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memory: { size: number; count: number };
    localStorage: { size: number; available: number };
    sessionStorage: { size: number; available: number };
    indexedDB: { available: boolean; initialized: boolean };
  } {
    return {
      memory: {
        size: Array.from(this.memoryCache.values()).reduce(
          (sum, item) => sum + item.size,
          0,
        ),
        count: this.memoryCache.size,
      },
      localStorage: {
        size: this.getStorageSize("localStorage"),
        available: this.isStorageAvailable("localStorage")
          ? this.config.maxLocalStorageSize
          : 0,
      },
      sessionStorage: {
        size: this.getStorageSize("sessionStorage"),
        available: this.isStorageAvailable("sessionStorage")
          ? this.config.maxSessionStorageSize
          : 0,
      },
      indexedDB: {
        available: this.isIndexedDBAvailable(),
        initialized: this.dbInitialized,
      },
    };
  }

  /**
   * Cleanup expired items from all storage
   */
  async cleanup(): Promise<void> {
    // Cleanup memory cache
    const now = Date.now();
    for (const [key, item] of this.memoryCache.entries()) {
      if (!this.isValidItem(item)) {
        this.memoryCache.delete(key);
      }
    }

    // Cleanup localStorage
    this.cleanupWebStorage("localStorage");

    // Cleanup sessionStorage
    this.cleanupWebStorage("sessionStorage");

    // Cleanup IndexedDB
    if (this.dbInitialized) {
      await this.cleanupIndexedDB();
    }
  }

  /**
   * Cache with callback pattern
   */
  async remember<T>(
    key: string,
    factory: () => Promise<T> | T,
    options?: { ttl?: number; storage?: StorageType },
  ): Promise<T> {
    const cached = await this.get<T>(key, options?.storage);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  private async initializeIndexedDB(): Promise<void> {
    if (!this.isIndexedDBAvailable()) return;

    try {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion);

      request.onerror = () => {
        console.error("IndexedDB initialization failed");
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.dbInitialized = true;
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains("cache")) {
          const store = db.createObjectStore("cache", { keyPath: "key" });
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("ttl", "ttl", { unique: false });
        }
      };
    } catch (error) {
      console.error("Failed to initialize IndexedDB:", error);
    }
  }

  private async getFromIndexedDB<T>(
    key: string,
  ): Promise<CachedItem<T> | null> {
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(["cache"], "readonly");
      const store = transaction.objectStore("cache");
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result && this.isValidItem(result)) {
          resolve(result);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  }

  private async setInIndexedDB<T>(
    key: string,
    item: CachedItem<T>,
  ): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(["cache"], "readwrite");
      const store = transaction.objectStore("cache");

      store.put({ key, ...item });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  }

  private async deleteFromIndexedDB(key: string): Promise<boolean> {
    if (!this.db) return false;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(["cache"], "readwrite");
      const store = transaction.objectStore("cache");
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }

  private async clearIndexedDB(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(["cache"], "readwrite");
      const store = transaction.objectStore("cache");
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  private async cleanupIndexedDB(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(["cache"], "readwrite");
      const store = transaction.objectStore("cache");
      const index = store.index("timestamp");
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const item = cursor.value;
          if (!this.isValidItem(item)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  }

  private getFromLocalStorage<T>(key: string): CachedItem<T> | null {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;

      const item: CachedItem<T> = JSON.parse(data);
      return this.isValidItem(item) ? item : null;
    } catch (error) {
      return null;
    }
  }

  private async setInLocalStorage<T>(
    key: string,
    item: CachedItem<T>,
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(item);

      // Check size limits
      if (serialized.length > this.config.maxLocalStorageSize) {
        throw new Error("Item too large for localStorage");
      }

      // Check available space
      const currentSize = this.getStorageSize("localStorage");
      if (currentSize + serialized.length > this.config.maxLocalStorageSize) {
        await this.evictFromStorage("localStorage", serialized.length);
      }

      localStorage.setItem(key, serialized);
    } catch (error) {
      console.warn("Failed to set in localStorage:", error);
    }
  }

  private getFromSessionStorage<T>(key: string): CachedItem<T> | null {
    try {
      const data = sessionStorage.getItem(key);
      if (!data) return null;

      const item: CachedItem<T> = JSON.parse(data);
      return this.isValidItem(item) ? item : null;
    } catch (error) {
      return null;
    }
  }

  private async setInSessionStorage<T>(
    key: string,
    item: CachedItem<T>,
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(item);

      if (serialized.length > this.config.maxSessionStorageSize) {
        throw new Error("Item too large for sessionStorage");
      }

      const currentSize = this.getStorageSize("sessionStorage");
      if (currentSize + serialized.length > this.config.maxSessionStorageSize) {
        await this.evictFromStorage("sessionStorage", serialized.length);
      }

      sessionStorage.setItem(key, serialized);
    } catch (error) {
      console.warn("Failed to set in sessionStorage:", error);
    }
  }

  private selectOptimalStorage(item: CachedItem): StorageType {
    // Large items or long TTL -> IndexedDB
    if (item.size > 100 * 1024 || item.ttl > 24 * 60 * 60 * 1000) {
      return this.dbInitialized ? "indexedDB" : "localStorage";
    }

    // Session-specific data -> sessionStorage
    if (item.ttl < 60 * 60 * 1000) {
      // < 1 hour
      return "sessionStorage";
    }

    // Default to localStorage
    return "localStorage";
  }

  private isValidItem(item: CachedItem): boolean {
    const now = Date.now();
    return now - item.timestamp < item.ttl;
  }

  private updateAccessStats(item: CachedItem): void {
    item.accessCount++;
    item.lastAccessed = Date.now();
  }

  private calculateSize(value: any): number {
    return JSON.stringify(value).length * 2; // UTF-16 estimation
  }

  private getStorageSize(storage: "localStorage" | "sessionStorage"): number {
    let total = 0;
    const storageObj =
      storage === "localStorage" ? localStorage : sessionStorage;

    for (let i = 0; i < storageObj.length; i++) {
      const key = storageObj.key(i);
      if (key) {
        const value = storageObj.getItem(key);
        total += (key.length + (value?.length || 0)) * 2;
      }
    }

    return total;
  }

  private isStorageAvailable(
    storage: "localStorage" | "sessionStorage",
  ): boolean {
    try {
      const test = "test";
      const storageObj =
        storage === "localStorage" ? localStorage : sessionStorage;
      storageObj.setItem(test, test);
      storageObj.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private isIndexedDBAvailable(): boolean {
    return typeof window !== "undefined" && "indexedDB" in window;
  }

  private cleanupWebStorage(storage: "localStorage" | "sessionStorage"): void {
    const storageObj =
      storage === "localStorage" ? localStorage : sessionStorage;
    const keysToRemove: string[] = [];

    for (let i = 0; i < storageObj.length; i++) {
      const key = storageObj.key(i);
      if (key) {
        try {
          const data = storageObj.getItem(key);
          if (data) {
            const item = JSON.parse(data);
            if (!this.isValidItem(item)) {
              keysToRemove.push(key);
            }
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => storageObj.removeItem(key));
  }

  private async evictFromStorage(
    storage: "localStorage" | "sessionStorage",
    requiredSpace: number,
  ): Promise<void> {
    const storageObj =
      storage === "localStorage" ? localStorage : sessionStorage;
    const items: Array<{ key: string; item: CachedItem; size: number }> = [];

    // Collect all items with metadata
    for (let i = 0; i < storageObj.length; i++) {
      const key = storageObj.key(i);
      if (key) {
        try {
          const data = storageObj.getItem(key);
          if (data) {
            const item = JSON.parse(data);
            items.push({
              key,
              item,
              size: data.length * 2,
            });
          }
        } catch {
          // Remove invalid items
          storageObj.removeItem(key);
        }
      }
    }

    // Sort by access patterns (LRU + frequency)
    items.sort((a, b) => {
      const aScore = a.item.lastAccessed + a.item.accessCount * 1000;
      const bScore = b.item.lastAccessed + b.item.accessCount * 1000;
      return aScore - bScore;
    });

    // Evict items until we have enough space
    let freedSpace = 0;
    for (const { key, size } of items) {
      if (freedSpace >= requiredSpace) break;

      storageObj.removeItem(key);
      freedSpace += size;
    }
  }
}

// Singleton instance for browser cache
export const browserCache = new BrowserCache();

// React hook for browser caching
export function useBrowserCache() {
  return {
    get: browserCache.get.bind(browserCache),
    set: browserCache.set.bind(browserCache),
    delete: browserCache.delete.bind(browserCache),
    clear: browserCache.clear.bind(browserCache),
    remember: browserCache.remember.bind(browserCache),
    stats: browserCache.getStats.bind(browserCache),
  };
}
