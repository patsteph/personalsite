/**
 * Load balancing and traffic distribution utilities
 * Implements client-side load balancing and health checking
 */

export interface Server {
  id: string;
  url: string;
  weight: number;
  healthy: boolean;
  responseTime: number;
  activeConnections: number;
  lastHealthCheck: number;
  metadata?: Record<string, any>;
}

export interface LoadBalancerConfig {
  algorithm:
    | "round-robin"
    | "weighted-round-robin"
    | "least-connections"
    | "weighted-least-connections"
    | "fastest-response";
  healthCheckInterval: number;
  healthCheckTimeout: number;
  maxRetries: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

export interface HealthCheckResult {
  healthy: boolean;
  responseTime: number;
  error?: string;
}

export interface LoadBalancingResult {
  server: Server;
  attempt: number;
  totalAttempts: number;
}

export class LoadBalancer {
  private servers: Map<string, Server> = new Map();
  private currentIndex = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private circuitBreakers: Map<
    string,
    {
      failures: number;
      lastFailure: number;
      isOpen: boolean;
    }
  > = new Map();

  constructor(
    protected config: LoadBalancerConfig = {
      algorithm: "weighted-round-robin",
      healthCheckInterval: 30000, // 30 seconds
      healthCheckTimeout: 5000, // 5 seconds
      maxRetries: 3,
      retryDelay: 1000,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000, // 1 minute
    },
  ) {
    this.startHealthChecking();
  }

  /**
   * Add server to the load balancer
   */
  addServer(
    server: Omit<
      Server,
      "healthy" | "responseTime" | "activeConnections" | "lastHealthCheck"
    >,
  ): void {
    const fullServer: Server = {
      ...server,
      healthy: true,
      responseTime: 0,
      activeConnections: 0,
      lastHealthCheck: Date.now(),
    };

    this.servers.set(server.id, fullServer);
    this.circuitBreakers.set(server.id, {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    });
  }

  /**
   * Remove server from the load balancer
   */
  removeServer(serverId: string): boolean {
    const removed = this.servers.delete(serverId);
    this.circuitBreakers.delete(serverId);
    return removed;
  }

  /**
   * Get next server based on load balancing algorithm
   */
  getServer(): Server | null {
    const healthyServers = Array.from(this.servers.values()).filter(
      (server) => server.healthy && !this.isCircuitBreakerOpen(server.id),
    );

    if (healthyServers.length === 0) {
      return null;
    }

    switch (this.config.algorithm) {
      case "round-robin":
        return this.roundRobin(healthyServers);
      case "weighted-round-robin":
        return this.weightedRoundRobin(healthyServers);
      case "least-connections":
        return this.leastConnections(healthyServers);
      case "weighted-least-connections":
        return this.weightedLeastConnections(healthyServers);
      case "fastest-response":
        return this.fastestResponse(healthyServers);
      default:
        return this.roundRobin(healthyServers);
    }
  }

  /**
   * Execute request with automatic failover
   */
  async executeRequest<T>(
    requestFn: (serverUrl: string) => Promise<T>,
    options: {
      retries?: number;
      timeout?: number;
      onServerSelected?: (server: Server) => void;
      onRetry?: (attempt: number, error: Error) => void;
    } = {},
  ): Promise<{ result: T; server: Server; attempts: number }> {
    const maxRetries = options.retries ?? this.config.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const server = this.getServer();

      if (!server) {
        throw new Error("No healthy servers available");
      }

      try {
        options.onServerSelected?.(server);

        // Track connection
        this.incrementConnections(server.id);

        const startTime = Date.now();
        const result = await this.executeWithTimeout(
          () => requestFn(server.url),
          options.timeout || 10000,
        );

        // Update server metrics
        const responseTime = Date.now() - startTime;
        this.updateServerMetrics(server.id, responseTime, true);

        return { result, server, attempts: attempt };
      } catch (error: any) {
        lastError = error;

        // Update server metrics and circuit breaker
        this.updateServerMetrics(server.id, 0, false);
        this.recordFailure(server.id);

        options.onRetry?.(attempt, error);

        if (attempt < maxRetries) {
          await this.delay(this.config.retryDelay * attempt);
        }
      } finally {
        this.decrementConnections(server.id);
      }
    }

    throw lastError || new Error("All retry attempts failed");
  }

  /**
   * Get load balancer statistics
   */
  getStats(): {
    servers: Array<Server & { circuitBreaker: any }>;
    totalServers: number;
    healthyServers: number;
    algorithm: string;
    totalRequests: number;
  } {
    const servers = Array.from(this.servers.values()).map((server) => ({
      ...server,
      circuitBreaker: this.circuitBreakers.get(server.id),
    }));

    return {
      servers,
      totalServers: this.servers.size,
      healthyServers: servers.filter((s) => s.healthy).length,
      algorithm: this.config.algorithm,
      totalRequests: servers.reduce(
        (sum, s) => sum + (s.metadata?.totalRequests || 0),
        0,
      ),
    };
  }

  /**
   * Manual health check for all servers
   */
  async performHealthCheck(): Promise<Map<string, HealthCheckResult>> {
    const results = new Map<string, HealthCheckResult>();
    const promises = Array.from(this.servers.values()).map(async (server) => {
      const result = await this.checkServerHealth(server);
      results.set(server.id, result);
      return result;
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Update server configuration
   */
  updateServer(serverId: string, updates: Partial<Server>): boolean {
    const server = this.servers.get(serverId);
    if (!server) return false;

    Object.assign(server, updates);
    this.servers.set(serverId, server);
    return true;
  }

  /**
   * Shutdown load balancer
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  private roundRobin(servers: Server[]): Server {
    const server = servers[this.currentIndex % servers.length];
    this.currentIndex++;
    return server;
  }

  private weightedRoundRobin(servers: Server[]): Server {
    // Create weighted array
    const weighted: Server[] = [];
    servers.forEach((server) => {
      for (let i = 0; i < server.weight; i++) {
        weighted.push(server);
      }
    });

    const server = weighted[this.currentIndex % weighted.length];
    this.currentIndex++;
    return server;
  }

  private leastConnections(servers: Server[]): Server {
    return servers.reduce((least, current) =>
      current.activeConnections < least.activeConnections ? current : least,
    );
  }

  private weightedLeastConnections(servers: Server[]): Server {
    return servers.reduce((best, current) => {
      const currentRatio = current.activeConnections / current.weight;
      const bestRatio = best.activeConnections / best.weight;
      return currentRatio < bestRatio ? current : best;
    });
  }

  private fastestResponse(servers: Server[]): Server {
    return servers.reduce((fastest, current) =>
      current.responseTime < fastest.responseTime ? current : fastest,
    );
  }

  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheckCycle();
    }, this.config.healthCheckInterval);
  }

  private async performHealthCheckCycle(): Promise<void> {
    const promises = Array.from(this.servers.values()).map(async (server) => {
      const result = await this.checkServerHealth(server);

      // Update server health
      server.healthy = result.healthy;
      server.responseTime = result.responseTime;
      server.lastHealthCheck = Date.now();

      // Reset circuit breaker if server is healthy
      if (result.healthy) {
        const circuitBreaker = this.circuitBreakers.get(server.id);
        if (circuitBreaker) {
          circuitBreaker.failures = 0;
          circuitBreaker.isOpen = false;
        }
      }
    });

    await Promise.allSettled(promises);
  }

  private async checkServerHealth(server: Server): Promise<HealthCheckResult> {
    try {
      const startTime = Date.now();

      // Perform health check (ping endpoint)
      const response = await this.executeWithTimeout(
        () => fetch(`${server.url}/health`, { method: "HEAD" }),
        this.config.healthCheckTimeout,
      );

      const responseTime = Date.now() - startTime;
      const healthy = response.ok;

      return { healthy, responseTime };
    } catch (error: any) {
      return {
        healthy: false,
        responseTime: this.config.healthCheckTimeout,
        error: error.message,
      };
    }
  }

  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Request timeout"));
      }, timeout);

      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer));
    });
  }

  private incrementConnections(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.activeConnections++;
    }
  }

  private decrementConnections(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.activeConnections = Math.max(0, server.activeConnections - 1);
    }
  }

  private updateServerMetrics(
    serverId: string,
    responseTime: number,
    success: boolean,
  ): void {
    const server = this.servers.get(serverId);
    if (!server) return;

    // Update response time (exponential moving average)
    if (success && responseTime > 0) {
      server.responseTime =
        server.responseTime === 0
          ? responseTime
          : server.responseTime * 0.8 + responseTime * 0.2;
    }

    // Update metadata
    if (!server.metadata) server.metadata = {};
    server.metadata.totalRequests = (server.metadata.totalRequests || 0) + 1;
    if (success) {
      server.metadata.successfulRequests =
        (server.metadata.successfulRequests || 0) + 1;
    }
  }

  private recordFailure(serverId: string): void {
    const circuitBreaker = this.circuitBreakers.get(serverId);
    if (!circuitBreaker) return;

    circuitBreaker.failures++;
    circuitBreaker.lastFailure = Date.now();

    if (circuitBreaker.failures >= this.config.circuitBreakerThreshold) {
      circuitBreaker.isOpen = true;
    }
  }

  private isCircuitBreakerOpen(serverId: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(serverId);
    if (!circuitBreaker || !circuitBreaker.isOpen) return false;

    // Check if circuit breaker timeout has passed
    const timeSinceFailure = Date.now() - circuitBreaker.lastFailure;
    if (timeSinceFailure > this.config.circuitBreakerTimeout) {
      circuitBreaker.isOpen = false;
      circuitBreaker.failures = 0;
      return false;
    }

    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Regional load balancer for geographic distribution
export class RegionalLoadBalancer extends LoadBalancer {
  private regions: Map<string, LoadBalancer> = new Map();

  addRegion(regionId: string, config?: LoadBalancerConfig): void {
    this.regions.set(regionId, new LoadBalancer(config || this.config));
  }

  addServerToRegion(
    regionId: string,
    server: Omit<
      Server,
      "healthy" | "responseTime" | "activeConnections" | "lastHealthCheck"
    >,
  ): void {
    const regionalBalancer = this.regions.get(regionId);
    if (regionalBalancer) {
      regionalBalancer.addServer(server);
    }
  }

  getServerFromRegion(regionId: string): Server | null {
    const regionalBalancer = this.regions.get(regionId);
    return regionalBalancer ? regionalBalancer.getServer() : null;
  }

  async executeRegionalRequest<T>(
    regionId: string,
    requestFn: (serverUrl: string) => Promise<T>,
    options?: any,
  ): Promise<{ result: T; server: Server; attempts: number }> {
    const regionalBalancer = this.regions.get(regionId);
    if (!regionalBalancer) {
      throw new Error(`Region ${regionId} not found`);
    }

    return regionalBalancer.executeRequest(requestFn, options);
  }

  getRegionalStats(): Map<string, any> {
    const stats = new Map();
    this.regions.forEach((balancer, regionId) => {
      stats.set(regionId, balancer.getStats());
    });
    return stats;
  }

  shutdown(): void {
    super.shutdown();
    this.regions.forEach((balancer) => balancer.shutdown());
  }
}

// Factory for creating load balancers
export class LoadBalancerFactory {
  static createAPILoadBalancer(): LoadBalancer {
    return new LoadBalancer({
      algorithm: "weighted-least-connections",
      healthCheckInterval: 30000,
      healthCheckTimeout: 5000,
      maxRetries: 3,
      retryDelay: 1000,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
    });
  }

  static createDatabaseLoadBalancer(): LoadBalancer {
    return new LoadBalancer({
      algorithm: "least-connections",
      healthCheckInterval: 60000,
      healthCheckTimeout: 10000,
      maxRetries: 2,
      retryDelay: 2000,
      circuitBreakerThreshold: 3,
      circuitBreakerTimeout: 120000,
    });
  }

  static createCDNLoadBalancer(): LoadBalancer {
    return new LoadBalancer({
      algorithm: "fastest-response",
      healthCheckInterval: 120000,
      healthCheckTimeout: 3000,
      maxRetries: 4,
      retryDelay: 500,
      circuitBreakerThreshold: 10,
      circuitBreakerTimeout: 30000,
    });
  }
}

// Client-side geographic load balancer
export function detectUserRegion(): string {
  // This would typically use a geolocation service
  // For now, use timezone as a rough approximation
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (timezone.includes("America")) return "us";
  if (timezone.includes("Europe")) return "eu";
  if (timezone.includes("Asia")) return "asia";

  return "us"; // default
}

// Singleton instances
export const apiLoadBalancer = LoadBalancerFactory.createAPILoadBalancer();
export const dbLoadBalancer = LoadBalancerFactory.createDatabaseLoadBalancer();
export const cdnLoadBalancer = LoadBalancerFactory.createCDNLoadBalancer();
