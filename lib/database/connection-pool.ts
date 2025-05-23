/**
 * Firebase Admin connection pooling and optimization
 * Manages Firebase Admin connections for optimal performance
 */

import {
  App,
  initializeApp,
  getApps,
  cert,
  ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import { getStorage, Storage } from "firebase-admin/storage";

export interface ConnectionPoolConfig {
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableMetrics: boolean;
}

export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  failedConnections: number;
  averageResponseTime: number;
  peakConnections: number;
}

interface PooledConnection {
  app: App;
  firestore: Firestore;
  auth: Auth;
  storage: Storage;
  createdAt: number;
  lastUsed: number;
  isActive: boolean;
  requestCount: number;
}

export class FirebaseConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private metrics: ConnectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    failedConnections: 0,
    averageResponseTime: 0,
    peakConnections: 0,
  };
  private responseTimes: number[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private config: ConnectionPoolConfig = {
      maxConnections: 10,
      connectionTimeout: 30000,
      idleTimeout: 300000, // 5 minutes
      retryAttempts: 3,
      retryDelay: 1000,
      enableMetrics: true,
    },
  ) {
    this.startCleanupTimer();
  }

  /**
   * Get or create a pooled connection
   */
  async getConnection(
    connectionId: string = "default",
  ): Promise<PooledConnection> {
    const startTime = Date.now();

    try {
      // Check for existing connection
      let connection = this.connections.get(connectionId);

      if (connection && this.isConnectionValid(connection)) {
        connection.lastUsed = Date.now();
        connection.requestCount++;
        this.updateMetrics(startTime);
        return connection;
      }

      // Create new connection if pool has space
      if (this.connections.size >= this.config.maxConnections) {
        // Remove oldest idle connection
        const oldestConnection = this.findOldestIdleConnection();
        if (oldestConnection) {
          await this.closeConnection(oldestConnection);
        } else {
          throw new Error("Connection pool exhausted");
        }
      }

      connection = await this.createConnection(connectionId);
      this.connections.set(connectionId, connection);

      this.updateMetrics(startTime);
      this.updatePeakConnections();

      return connection;
    } catch (error) {
      this.metrics.failedConnections++;
      console.error("Failed to get connection:", error);
      throw error;
    }
  }

  /**
   * Release a connection back to the pool
   */
  releaseConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.isActive = false;
      connection.lastUsed = Date.now();
    }
  }

  /**
   * Close a specific connection
   */
  async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      try {
        // Firebase apps are managed automatically, no need to explicitly delete
        this.connections.delete(connectionId);
        this.updateConnectionCounts();
      } catch (error) {
        console.error("Failed to close connection:", error);
      }
    }
  }

  /**
   * Close all connections
   */
  async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.connections.keys()).map((id) =>
      this.closeConnection(id),
    );

    await Promise.all(closePromises);

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get connection pool metrics
   */
  getMetrics(): ConnectionMetrics {
    this.updateConnectionCounts();
    return { ...this.metrics };
  }

  /**
   * Execute operation with automatic connection management
   */
  async withConnection<T>(
    operation: (connection: PooledConnection) => Promise<T>,
    connectionId: string = "default",
  ): Promise<T> {
    const connection = await this.getConnection(connectionId);

    try {
      connection.isActive = true;
      const result = await this.executeWithRetry(operation, connection);
      return result;
    } finally {
      this.releaseConnection(connectionId);
    }
  }

  /**
   * Health check for all connections
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    connections: Array<{
      id: string;
      status: "healthy" | "unhealthy" | "idle";
      lastUsed: number;
      requestCount: number;
    }>;
  }> {
    const connectionStatuses: Array<{
      id: string;
      status: "healthy" | "unhealthy" | "idle";
      lastUsed: number;
      requestCount: number;
    }> = [];
    let allHealthy = true;

    for (const [id, connection] of this.connections) {
      try {
        // Test connection with a simple operation
        await connection.firestore.listCollections();
        connectionStatuses.push({
          id,
          status: connection.isActive ? "healthy" : "idle",
          lastUsed: connection.lastUsed,
          requestCount: connection.requestCount,
        });
      } catch (error) {
        allHealthy = false;
        connectionStatuses.push({
          id,
          status: "unhealthy",
          lastUsed: connection.lastUsed,
          requestCount: connection.requestCount,
        });
      }
    }

    return {
      healthy: allHealthy,
      connections: connectionStatuses,
    };
  }

  private async createConnection(
    connectionId: string,
  ): Promise<PooledConnection> {
    try {
      // Check if app already exists
      const existingApps = getApps();
      const existingApp = existingApps.find((app) => app.name === connectionId);

      let app: App;

      if (existingApp) {
        app = existingApp;
      } else {
        const serviceAccount: ServiceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        };

        app = initializeApp(
          {
            credential: cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          },
          connectionId,
        );
      }

      const firestore = getFirestore(app);
      const auth = getAuth(app);
      const storage = getStorage(app);

      // Configure Firestore settings for performance
      firestore.settings({
        ignoreUndefinedProperties: true,
        preferRest: false, // Use gRPC for better performance
      });

      const connection: PooledConnection = {
        app,
        firestore,
        auth,
        storage,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        isActive: false,
        requestCount: 0,
      };

      this.metrics.totalConnections++;

      return connection;
    } catch (error) {
      console.error("Failed to create Firebase connection:", error);
      throw error;
    }
  }

  private isConnectionValid(connection: PooledConnection): boolean {
    const now = Date.now();
    const isNotExpired = now - connection.lastUsed < this.config.idleTimeout;
    const isNotTimedOut =
      now - connection.createdAt < this.config.connectionTimeout;

    return isNotExpired && isNotTimedOut;
  }

  private findOldestIdleConnection(): string | null {
    let oldestTime = Date.now();
    let oldestId: string | null = null;

    for (const [id, connection] of this.connections) {
      if (!connection.isActive && connection.lastUsed < oldestTime) {
        oldestTime = connection.lastUsed;
        oldestId = id;
      }
    }

    return oldestId;
  }

  private async executeWithRetry<T>(
    operation: (connection: PooledConnection) => Promise<T>,
    connection: PooledConnection,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await operation(connection);
      } catch (error: any) {
        lastError = error;

        if (
          attempt === this.config.retryAttempts ||
          !this.isRetryableError(error)
        ) {
          throw error;
        }

        // Exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  private isRetryableError(error: any): boolean {
    const retryableCodes = [
      "unavailable",
      "deadline-exceeded",
      "resource-exhausted",
      "aborted",
      "cancelled",
      "unknown",
    ];

    return (
      retryableCodes.includes(error.code) ||
      error.message?.includes("DEADLINE_EXCEEDED") ||
      error.message?.includes("UNAVAILABLE")
    );
  }

  private updateMetrics(startTime: number): void {
    if (!this.config.enableMetrics) return;

    const responseTime = Date.now() - startTime;
    this.responseTimes.push(responseTime);

    // Keep only last 100 response times for average calculation
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }

    this.metrics.averageResponseTime =
      this.responseTimes.reduce((sum, time) => sum + time, 0) /
      this.responseTimes.length;
  }

  private updateConnectionCounts(): void {
    let active = 0;
    let idle = 0;

    for (const connection of this.connections.values()) {
      if (connection.isActive) {
        active++;
      } else {
        idle++;
      }
    }

    this.metrics.activeConnections = active;
    this.metrics.idleConnections = idle;
  }

  private updatePeakConnections(): void {
    const currentTotal = this.connections.size;
    if (currentTotal > this.metrics.peakConnections) {
      this.metrics.peakConnections = currentTotal;
    }
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, 60000); // Cleanup every minute
  }

  private async cleanupIdleConnections(): Promise<void> {
    const now = Date.now();
    const connectionsToClose: string[] = [];

    for (const [id, connection] of this.connections) {
      if (
        !connection.isActive &&
        now - connection.lastUsed > this.config.idleTimeout
      ) {
        connectionsToClose.push(id);
      }
    }

    for (const id of connectionsToClose) {
      await this.closeConnection(id);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const connectionPool = new FirebaseConnectionPool();

// Helper functions for common operations
export async function withFirestore<T>(
  operation: (firestore: Firestore) => Promise<T>,
  connectionId?: string,
): Promise<T> {
  return connectionPool.withConnection(
    async (connection) => operation(connection.firestore),
    connectionId,
  );
}

export async function withAuth<T>(
  operation: (auth: Auth) => Promise<T>,
  connectionId?: string,
): Promise<T> {
  return connectionPool.withConnection(
    async (connection) => operation(connection.auth),
    connectionId,
  );
}

export async function withStorage<T>(
  operation: (storage: Storage) => Promise<T>,
  connectionId?: string,
): Promise<T> {
  return connectionPool.withConnection(
    async (connection) => operation(connection.storage),
    connectionId,
  );
}
