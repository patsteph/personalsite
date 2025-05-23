/**
 * Firebase Firestore query optimization utilities
 * Implements efficient pagination, caching, and query patterns
 */

import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Query,
  QueryConstraint,
  getDocs,
  getDoc,
  doc,
  runTransaction,
  writeBatch,
  DocumentReference,
} from "firebase/firestore";
import { cacheManager, CacheKeys } from "../cache/cache-manager";

export interface PaginationOptions {
  pageSize: number;
  cursor?: DocumentSnapshot;
  direction: "next" | "previous";
}

export interface QueryOptions {
  cacheKey?: string;
  cacheTTL?: number;
  enableCache?: boolean;
  maxRetries?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor?: DocumentSnapshot;
  previousCursor?: DocumentSnapshot;
  hasNext: boolean;
  hasPrevious: boolean;
  totalCount?: number;
  pageInfo: {
    currentPage: number;
    pageSize: number;
    estimatedTotal?: number;
  };
}

export interface QueryBuilder<T> {
  collection: string;
  constraints: QueryConstraint[];
  options: QueryOptions;
}

export class FirestoreQueryOptimizer {
  private db = getFirestore();
  private queryCache = new Map<string, any>();

  /**
   * Create an optimized query builder
   */
  createQuery<T>(collectionName: string): QueryBuilder<T> {
    return {
      collection: collectionName,
      constraints: [],
      options: {
        enableCache: true,
        cacheTTL: 300000, // 5 minutes
        maxRetries: 3,
      },
    };
  }

  /**
   * Add query constraints with optimization
   */
  addConstraints<T>(
    builder: QueryBuilder<T>,
    ...constraints: QueryConstraint[]
  ): QueryBuilder<T> {
    // Optimize constraint order for better index utilization
    const optimizedConstraints = this.optimizeConstraintOrder([
      ...builder.constraints,
      ...constraints,
    ]);

    return {
      ...builder,
      constraints: optimizedConstraints,
    };
  }

  /**
   * Execute paginated query with caching
   */
  async executePaginated<T>(
    builder: QueryBuilder<T>,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<T>> {
    const cacheKey = this.generatePaginationCacheKey(builder, pagination);

    if (builder.options.enableCache) {
      const cached = await cacheManager.get<PaginatedResult<T>>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const result = await this.executePaginatedQuery<T>(builder, pagination);

      if (builder.options.enableCache) {
        await cacheManager.set(cacheKey, result, builder.options.cacheTTL);
      }

      return result;
    } catch (error) {
      console.error("Paginated query failed:", error);
      throw error;
    }
  }

  /**
   * Execute simple query with caching
   */
  async execute<T>(builder: QueryBuilder<T>): Promise<T[]> {
    const cacheKey = builder.options.cacheKey || this.generateCacheKey(builder);

    if (builder.options.enableCache) {
      const cached = await cacheManager.get<T[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const q = query(
        collection(this.db, builder.collection),
        ...builder.constraints,
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as T,
      );

      if (builder.options.enableCache) {
        await cacheManager.set(cacheKey, data, builder.options.cacheTTL);
      }

      return data;
    } catch (error) {
      console.error("Query execution failed:", error);
      throw error;
    }
  }

  /**
   * Get single document with caching
   */
  async getDocument<T>(
    collectionName: string,
    docId: string,
    options: QueryOptions = {},
  ): Promise<T | null> {
    const cacheKey = options.cacheKey || `${collectionName}:${docId}`;

    if (options.enableCache !== false) {
      const cached = await cacheManager.get<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const docRef = doc(this.db, collectionName, docId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      const data = {
        id: snapshot.id,
        ...snapshot.data(),
      } as T;

      if (options.enableCache !== false) {
        await cacheManager.set(cacheKey, data, options.cacheTTL || 300000);
      }

      return data;
    } catch (error) {
      console.error("Document fetch failed:", error);
      throw error;
    }
  }

  /**
   * Batch write operations with optimization
   */
  async batchWrite(
    operations: Array<{
      type: "set" | "update" | "delete";
      ref: DocumentReference;
      data?: any;
    }>,
  ): Promise<void> {
    const batchSize = 500; // Firestore limit
    const batches = this.chunkArray(operations, batchSize);

    for (const batchOps of batches) {
      const batch = writeBatch(this.db);

      for (const op of batchOps) {
        switch (op.type) {
          case "set":
            batch.set(op.ref, op.data);
            break;
          case "update":
            batch.update(op.ref, op.data);
            break;
          case "delete":
            batch.delete(op.ref);
            break;
        }
      }

      await batch.commit();
    }
  }

  /**
   * Transaction with retry logic
   */
  async executeTransaction<T>(
    operation: (transaction: any) => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        return await runTransaction(this.db, operation);
      } catch (error: any) {
        attempts++;

        if (attempts >= maxRetries || !this.isRetryableError(error)) {
          throw error;
        }

        // Exponential backoff
        await this.delay(Math.pow(2, attempts) * 100);
      }
    }

    throw new Error("Transaction failed after maximum retries");
  }

  /**
   * Bulk fetch documents efficiently
   */
  async bulkFetch<T>(
    collectionName: string,
    docIds: string[],
    options: QueryOptions = {},
  ): Promise<Map<string, T>> {
    const result = new Map<string, T>();
    const batchSize = 10; // Firestore 'in' query limit
    const chunks = this.chunkArray(docIds, batchSize);

    const fetchPromises = chunks.map(async (chunk) => {
      const cacheKeys = chunk.map((id) => `${collectionName}:${id}`);

      // Check cache first
      if (options.enableCache !== false) {
        const cached = await cacheManager.mget<T>(cacheKeys);

        const uncachedIds: string[] = [];
        cached.forEach((value, key) => {
          const docId = key.split(":")[1];
          if (value !== null) {
            result.set(docId, value);
          } else {
            uncachedIds.push(docId);
          }
        });

        if (uncachedIds.length === 0) {
          return;
        }

        chunk = uncachedIds;
      }

      // Fetch uncached documents
      if (chunk.length > 0) {
        const q = query(
          collection(this.db, collectionName),
          where(
            "__name__",
            "in",
            chunk.map((id) => doc(this.db, collectionName, id)),
          ),
        );

        const snapshot = await getDocs(q);
        const cacheEntries = new Map<string, T>();

        snapshot.docs.forEach((doc) => {
          const data = {
            id: doc.id,
            ...doc.data(),
          } as T;

          result.set(doc.id, data);
          cacheEntries.set(`${collectionName}:${doc.id}`, data);
        });

        // Cache the results
        if (options.enableCache !== false && cacheEntries.size > 0) {
          await cacheManager.mset(cacheEntries, options.cacheTTL);
        }
      }
    });

    await Promise.all(fetchPromises);
    return result;
  }

  /**
   * Aggregate data efficiently
   */
  async aggregate<T>(
    builder: QueryBuilder<T>,
    aggregations: {
      count?: boolean;
      sum?: string[];
      avg?: string[];
      min?: string[];
      max?: string[];
    },
  ): Promise<any> {
    const cacheKey = `aggregate:${this.generateCacheKey(builder)}:${JSON.stringify(aggregations)}`;

    if (builder.options.enableCache) {
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const q = query(
      collection(this.db, builder.collection),
      ...builder.constraints,
    );

    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map((doc) => doc.data());

    const result: any = {};

    if (aggregations.count) {
      result.count = docs.length;
    }

    if (aggregations.sum) {
      result.sum = {};
      aggregations.sum.forEach((field) => {
        result.sum[field] = docs.reduce(
          (sum, doc) => sum + (doc[field] || 0),
          0,
        );
      });
    }

    if (aggregations.avg) {
      result.avg = {};
      aggregations.avg.forEach((field) => {
        const sum = docs.reduce((sum, doc) => sum + (doc[field] || 0), 0);
        result.avg[field] = docs.length > 0 ? sum / docs.length : 0;
      });
    }

    if (aggregations.min) {
      result.min = {};
      aggregations.min.forEach((field) => {
        const values = docs
          .map((doc) => doc[field])
          .filter((val) => val != null);
        result.min[field] = values.length > 0 ? Math.min(...values) : null;
      });
    }

    if (aggregations.max) {
      result.max = {};
      aggregations.max.forEach((field) => {
        const values = docs
          .map((doc) => doc[field])
          .filter((val) => val != null);
        result.max[field] = values.length > 0 ? Math.max(...values) : null;
      });
    }

    if (builder.options.enableCache) {
      await cacheManager.set(cacheKey, result, builder.options.cacheTTL);
    }

    return result;
  }

  /**
   * Invalidate cache for collection patterns
   */
  async invalidateCache(patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      const keys = await cacheManager.keys(pattern);
      for (const key of keys) {
        await cacheManager.delete(key);
      }
    }
  }

  private async executePaginatedQuery<T>(
    builder: QueryBuilder<T>,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<T>> {
    let constraints = [...builder.constraints];

    // Add pagination constraints
    constraints.push(limit(pagination.pageSize + 1)); // +1 to check hasNext

    if (pagination.cursor) {
      if (pagination.direction === "next") {
        constraints.push(startAfter(pagination.cursor));
      } else {
        constraints.push(endBefore(pagination.cursor));
      }
    }

    const q = query(collection(this.db, builder.collection), ...constraints);
    const snapshot = await getDocs(q);

    const docs = snapshot.docs;
    const hasNext = docs.length > pagination.pageSize;
    const data = docs.slice(0, pagination.pageSize).map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as T,
    );

    const result: PaginatedResult<T> = {
      data,
      hasNext,
      hasPrevious: !!pagination.cursor,
      pageInfo: {
        currentPage: 1, // This would need more context to calculate properly
        pageSize: pagination.pageSize,
      },
    };

    if (hasNext && docs.length > 0) {
      result.nextCursor = docs[pagination.pageSize - 1];
    }

    if (pagination.cursor) {
      result.previousCursor = docs[0];
    }

    return result;
  }

  private optimizeConstraintOrder(
    constraints: QueryConstraint[],
  ): QueryConstraint[] {
    // Firestore optimization: equality constraints first, then range constraints, then orderBy
    const equality: QueryConstraint[] = [];
    const range: QueryConstraint[] = [];
    const order: QueryConstraint[] = [];
    const other: QueryConstraint[] = [];

    constraints.forEach((constraint) => {
      const constraintStr = constraint.toString();

      if (constraintStr.includes("==")) {
        equality.push(constraint);
      } else if (constraintStr.includes("orderBy")) {
        order.push(constraint);
      } else if (
        constraintStr.includes("<") ||
        constraintStr.includes(">") ||
        constraintStr.includes("in")
      ) {
        range.push(constraint);
      } else {
        other.push(constraint);
      }
    });

    return [...equality, ...range, ...order, ...other];
  }

  private generateCacheKey<T>(builder: QueryBuilder<T>): string {
    const constraintsStr = builder.constraints
      .map((c) => c.toString())
      .join("|");
    return `query:${builder.collection}:${btoa(constraintsStr)}`;
  }

  private generatePaginationCacheKey<T>(
    builder: QueryBuilder<T>,
    pagination: PaginationOptions,
  ): string {
    const baseKey = this.generateCacheKey(builder);
    const cursorId = pagination.cursor?.id || "start";
    return `${baseKey}:page:${pagination.direction}:${cursorId}:${pagination.pageSize}`;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private isRetryableError(error: any): boolean {
    const retryableCodes = [
      "unavailable",
      "deadline-exceeded",
      "resource-exhausted",
      "aborted",
    ];
    return retryableCodes.includes(error.code);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const queryOptimizer = new FirestoreQueryOptimizer();

// Query builder helper functions
export function createBooksQuery() {
  return queryOptimizer.createQuery("books");
}

export function createBlogQuery() {
  return queryOptimizer.createQuery("blog_posts");
}

export function createSignalsQuery() {
  return queryOptimizer.createQuery("signals");
}

export function createAnalyticsQuery() {
  return queryOptimizer.createQuery("analytics_events");
}
