/**
 * Infrastructure monitoring and auto-scaling system
 * Monitors performance metrics and triggers scaling actions
 */

export interface MetricThreshold {
  warning: number;
  critical: number;
  unit: string;
  direction: "above" | "below";
}

export interface MonitoringConfig {
  metrics: Record<string, MetricThreshold>;
  checkInterval: number;
  retentionPeriod: number;
  alertingEnabled: boolean;
  autoScalingEnabled: boolean;
  scalingCooldown: number;
}

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    available: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connectionsActive: number;
    connectionsWaiting: number;
  };
  application: {
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    activeUsers: number;
  };
  database: {
    connectionCount: number;
    queryTime: number;
    readsPerSecond: number;
    writesPerSecond: number;
  };
  cache: {
    hitRate: number;
    memoryUsage: number;
    evictions: number;
  };
}

export interface Alert {
  id: string;
  level: "warning" | "critical";
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  resolved: boolean;
}

export interface ScalingAction {
  id: string;
  type: "scale-up" | "scale-down";
  resource: string;
  currentInstances: number;
  targetInstances: number;
  reason: string;
  timestamp: number;
  status: "pending" | "in-progress" | "completed" | "failed";
}

export interface HealthCheck {
  service: string;
  status: "healthy" | "degraded" | "unhealthy";
  responseTime: number;
  lastCheck: number;
  errorMessage?: string;
}

export class InfrastructureMonitor {
  private metrics: SystemMetrics[] = [];
  private alerts: Map<string, Alert> = new Map();
  private scalingActions: Map<string, ScalingAction> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastScalingAction = 0;

  constructor(
    private config: MonitoringConfig = {
      metrics: {
        "cpu.usage": {
          warning: 70,
          critical: 85,
          unit: "%",
          direction: "above",
        },
        "memory.percentage": {
          warning: 80,
          critical: 90,
          unit: "%",
          direction: "above",
        },
        "application.errorRate": {
          warning: 5,
          critical: 10,
          unit: "%",
          direction: "above",
        },
        "application.responseTime": {
          warning: 1000,
          critical: 2000,
          unit: "ms",
          direction: "above",
        },
        "database.connectionCount": {
          warning: 80,
          critical: 95,
          unit: "count",
          direction: "above",
        },
        "cache.hitRate": {
          warning: 80,
          critical: 70,
          unit: "%",
          direction: "below",
        },
      },
      checkInterval: 30000, // 30 seconds
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      alertingEnabled: true,
      autoScalingEnabled: true,
      scalingCooldown: 5 * 60 * 1000, // 5 minutes
    },
  ) {
    this.startMonitoring();
  }

  /**
   * Start monitoring system
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.checkInterval);
  }

  /**
   * Stop monitoring system
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Collect current system metrics
   */
  async collectMetrics(): Promise<SystemMetrics> {
    const metrics: SystemMetrics = {
      timestamp: Date.now(),
      cpu: await this.getCPUMetrics(),
      memory: await this.getMemoryMetrics(),
      network: await this.getNetworkMetrics(),
      application: await this.getApplicationMetrics(),
      database: await this.getDatabaseMetrics(),
      cache: await this.getCacheMetrics(),
    };

    // Store metrics
    this.metrics.push(metrics);
    this.cleanupOldMetrics();

    // Check thresholds and trigger alerts
    await this.checkThresholds(metrics);

    // Check if auto-scaling is needed
    if (this.config.autoScalingEnabled) {
      await this.checkAutoScaling(metrics);
    }

    return metrics;
  }

  /**
   * Get current system health status
   */
  async getHealthStatus(): Promise<{
    overall: "healthy" | "degraded" | "unhealthy";
    services: HealthCheck[];
    activeAlerts: Alert[];
    uptime: number;
  }> {
    const services = Array.from(this.healthChecks.values());
    const activeAlerts = Array.from(this.alerts.values()).filter(
      (alert) => !alert.resolved,
    );

    const unhealthyServices = services.filter(
      (s) => s.status === "unhealthy",
    ).length;
    const degradedServices = services.filter(
      (s) => s.status === "degraded",
    ).length;
    const criticalAlerts = activeAlerts.filter(
      (a) => a.level === "critical",
    ).length;

    let overall: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (unhealthyServices > 0 || criticalAlerts > 0) {
      overall = "unhealthy";
    } else if (degradedServices > 0 || activeAlerts.length > 0) {
      overall = "degraded";
    }

    return {
      overall,
      services,
      activeAlerts,
      uptime: this.getUptime(),
    };
  }

  /**
   * Trigger manual scaling action
   */
  async triggerScaling(
    resource: string,
    action: "scale-up" | "scale-down",
    targetInstances: number,
    reason: string,
  ): Promise<string> {
    const scalingAction: ScalingAction = {
      id: this.generateId(),
      type: action,
      resource,
      currentInstances: await this.getCurrentInstances(resource),
      targetInstances,
      reason,
      timestamp: Date.now(),
      status: "pending",
    };

    this.scalingActions.set(scalingAction.id, scalingAction);
    await this.executeScaling(scalingAction);

    return scalingAction.id;
  }

  /**
   * Add or update health check
   */
  addHealthCheck(
    service: string,
    checkFunction: () => Promise<{
      healthy: boolean;
      responseTime: number;
      error?: string;
    }>,
  ): void {
    setInterval(async () => {
      try {
        const startTime = Date.now();
        const result = await checkFunction();
        const responseTime = Date.now() - startTime;

        const healthCheck: HealthCheck = {
          service,
          status: result.healthy ? "healthy" : "unhealthy",
          responseTime: result.responseTime || responseTime,
          lastCheck: Date.now(),
          errorMessage: result.error,
        };

        this.healthChecks.set(service, healthCheck);
      } catch (error) {
        this.healthChecks.set(service, {
          service,
          status: "unhealthy",
          responseTime: 0,
          lastCheck: Date.now(),
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
    }, this.config.checkInterval);
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(
    timeRange: number = 60 * 60 * 1000, // 1 hour
    metric?: string,
  ): SystemMetrics[] {
    const cutoff = Date.now() - timeRange;
    let filteredMetrics = this.metrics.filter((m) => m.timestamp > cutoff);

    if (metric) {
      // Extract specific metric from each entry
      return filteredMetrics.map((m) => {
        const parts = metric.split(".");
        let value = m as any;
        for (const part of parts) {
          value = value[part];
        }
        return { timestamp: m.timestamp, value } as any;
      });
    }

    return filteredMetrics;
  }

  /**
   * Get performance insights and recommendations
   */
  getPerformanceInsights(): {
    insights: string[];
    recommendations: string[];
    trends: Record<string, "improving" | "stable" | "degrading">;
  } {
    const recent = this.getMetricsHistory(60 * 60 * 1000); // Last hour
    const insights: string[] = [];
    const recommendations: string[] = [];
    const trends: Record<string, "improving" | "stable" | "degrading"> = {};

    if (recent.length < 2) {
      return {
        insights: ["Insufficient data for analysis"],
        recommendations: [],
        trends: {},
      };
    }

    // Analyze CPU trends
    const cpuTrend = this.analyzeTrend(recent.map((m) => m.cpu.usage));
    trends.cpu = cpuTrend;

    if (cpuTrend === "degrading") {
      insights.push("CPU usage is trending upward");
      recommendations.push(
        "Consider scaling up or optimizing CPU-intensive operations",
      );
    }

    // Analyze memory trends
    const memoryTrend = this.analyzeTrend(
      recent.map((m) => m.memory.percentage),
    );
    trends.memory = memoryTrend;

    if (memoryTrend === "degrading") {
      insights.push("Memory usage is increasing consistently");
      recommendations.push(
        "Check for memory leaks or consider adding more memory",
      );
    }

    // Analyze response time trends
    const responseTrend = this.analyzeTrend(
      recent.map((m) => m.application.averageResponseTime),
    );
    trends.responseTime = responseTrend;

    if (responseTrend === "degrading") {
      insights.push("Response times are getting slower");
      recommendations.push("Optimize database queries and enable caching");
    }

    // Analyze error rate
    const avgErrorRate =
      recent.reduce((sum, m) => sum + m.application.errorRate, 0) /
      recent.length;
    if (avgErrorRate > 2) {
      insights.push(`Error rate is elevated at ${avgErrorRate.toFixed(2)}%`);
      recommendations.push("Investigate error logs and fix recurring issues");
    }

    return { insights, recommendations, trends };
  }

  /**
   * Export metrics for external systems
   */
  exportMetrics(format: "json" | "csv" | "prometheus" = "json"): string {
    switch (format) {
      case "csv":
        return this.exportCSV();
      case "prometheus":
        return this.exportPrometheus();
      default:
        return JSON.stringify(this.metrics, null, 2);
    }
  }

  private async getCPUMetrics(): Promise<SystemMetrics["cpu"]> {
    // In a real implementation, this would collect actual CPU metrics
    return {
      usage: Math.random() * 100,
      cores: 4,
      loadAverage: [0.5, 0.7, 0.8],
    };
  }

  private async getMemoryMetrics(): Promise<SystemMetrics["memory"]> {
    // In a real implementation, this would collect actual memory metrics
    const total = 8 * 1024 * 1024 * 1024; // 8GB
    const used = total * (0.3 + Math.random() * 0.4); // 30-70% usage

    return {
      used,
      total,
      percentage: (used / total) * 100,
      available: total - used,
    };
  }

  private async getNetworkMetrics(): Promise<SystemMetrics["network"]> {
    return {
      bytesIn: Math.random() * 1000000,
      bytesOut: Math.random() * 1000000,
      connectionsActive: Math.floor(Math.random() * 100),
      connectionsWaiting: Math.floor(Math.random() * 10),
    };
  }

  private async getApplicationMetrics(): Promise<SystemMetrics["application"]> {
    return {
      requestsPerSecond: Math.random() * 100,
      averageResponseTime: 200 + Math.random() * 800,
      errorRate: Math.random() * 5,
      activeUsers: Math.floor(Math.random() * 1000),
    };
  }

  private async getDatabaseMetrics(): Promise<SystemMetrics["database"]> {
    return {
      connectionCount: Math.floor(Math.random() * 50),
      queryTime: 10 + Math.random() * 90,
      readsPerSecond: Math.random() * 100,
      writesPerSecond: Math.random() * 20,
    };
  }

  private async getCacheMetrics(): Promise<SystemMetrics["cache"]> {
    return {
      hitRate: 80 + Math.random() * 15,
      memoryUsage: Math.random() * 100,
      evictions: Math.floor(Math.random() * 10),
    };
  }

  private async checkThresholds(metrics: SystemMetrics): Promise<void> {
    if (!this.config.alertingEnabled) return;

    for (const [metricPath, threshold] of Object.entries(this.config.metrics)) {
      const value = this.getMetricValue(metrics, metricPath);
      const isViolated =
        threshold.direction === "above"
          ? value > threshold.critical
          : value < threshold.critical;

      if (isViolated) {
        await this.createAlert(
          "critical",
          metricPath,
          value,
          threshold.critical,
        );
      } else if (
        threshold.direction === "above"
          ? value > threshold.warning
          : value < threshold.warning
      ) {
        await this.createAlert("warning", metricPath, value, threshold.warning);
      }
    }
  }

  private async checkAutoScaling(metrics: SystemMetrics): Promise<void> {
    const now = Date.now();

    // Check cooldown period
    if (now - this.lastScalingAction < this.config.scalingCooldown) {
      return;
    }

    // Check CPU-based scaling
    if (metrics.cpu.usage > 80) {
      await this.triggerScaling(
        "web-servers",
        "scale-up",
        (await this.getCurrentInstances("web-servers")) + 1,
        `High CPU usage: ${metrics.cpu.usage.toFixed(1)}%`,
      );
    } else if (
      metrics.cpu.usage < 30 &&
      (await this.getCurrentInstances("web-servers")) > 1
    ) {
      await this.triggerScaling(
        "web-servers",
        "scale-down",
        (await this.getCurrentInstances("web-servers")) - 1,
        `Low CPU usage: ${metrics.cpu.usage.toFixed(1)}%`,
      );
    }

    // Check memory-based scaling
    if (metrics.memory.percentage > 85) {
      await this.triggerScaling(
        "web-servers",
        "scale-up",
        (await this.getCurrentInstances("web-servers")) + 1,
        `High memory usage: ${metrics.memory.percentage.toFixed(1)}%`,
      );
    }

    // Check response time-based scaling
    if (metrics.application.averageResponseTime > 2000) {
      await this.triggerScaling(
        "web-servers",
        "scale-up",
        (await this.getCurrentInstances("web-servers")) + 1,
        `High response time: ${metrics.application.averageResponseTime.toFixed(0)}ms`,
      );
    }
  }

  private async createAlert(
    level: "warning" | "critical",
    metric: string,
    value: number,
    threshold: number,
  ): Promise<void> {
    const alertId = `${metric}-${level}-${Date.now()}`;

    const alert: Alert = {
      id: alertId,
      level,
      metric,
      value,
      threshold,
      message: `${metric} is ${value} (threshold: ${threshold})`,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false,
    };

    this.alerts.set(alertId, alert);

    // In a real implementation, this would send notifications
    console.warn(`ALERT [${level.toUpperCase()}]: ${alert.message}`);
  }

  private async executeScaling(action: ScalingAction): Promise<void> {
    action.status = "in-progress";
    this.lastScalingAction = Date.now();

    try {
      // In a real implementation, this would make API calls to cloud providers
      console.log(
        `Executing scaling action: ${action.type} ${action.resource} to ${action.targetInstances} instances`,
      );

      // Simulate scaling delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      action.status = "completed";
    } catch (error) {
      action.status = "failed";
      console.error("Scaling action failed:", error);
    }
  }

  private getMetricValue(metrics: SystemMetrics, path: string): number {
    const parts = path.split(".");
    let value: any = metrics;

    for (const part of parts) {
      value = value[part];
    }

    return typeof value === "number" ? value : 0;
  }

  private async getCurrentInstances(resource: string): Promise<number> {
    // In a real implementation, this would query cloud provider APIs
    return 2; // Default instance count
  }

  private analyzeTrend(values: number[]): "improving" | "stable" | "degrading" {
    if (values.length < 5) return "stable";

    const recent = values.slice(-5);
    const older = values.slice(-10, -5);

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;

    const change = (recentAvg - olderAvg) / olderAvg;

    if (change > 0.1) return "degrading";
    if (change < -0.1) return "improving";
    return "stable";
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.config.retentionPeriod;
    this.metrics = this.metrics.filter((m) => m.timestamp > cutoff);
  }

  private getUptime(): number {
    return process.uptime() * 1000; // Convert to milliseconds
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private exportCSV(): string {
    const headers = [
      "timestamp",
      "cpu_usage",
      "memory_percentage",
      "requests_per_second",
      "response_time",
      "error_rate",
      "db_connections",
      "cache_hit_rate",
    ];

    const rows = this.metrics.map((m) => [
      new Date(m.timestamp).toISOString(),
      m.cpu.usage,
      m.memory.percentage,
      m.application.requestsPerSecond,
      m.application.averageResponseTime,
      m.application.errorRate,
      m.database.connectionCount,
      m.cache.hitRate,
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }

  private exportPrometheus(): string {
    const latest = this.metrics[this.metrics.length - 1];
    if (!latest) return "";

    return `
# HELP cpu_usage CPU usage percentage
# TYPE cpu_usage gauge
cpu_usage ${latest.cpu.usage}

# HELP memory_usage Memory usage percentage
# TYPE memory_usage gauge
memory_usage ${latest.memory.percentage}

# HELP http_requests_per_second HTTP requests per second
# TYPE http_requests_per_second gauge
http_requests_per_second ${latest.application.requestsPerSecond}

# HELP http_response_time Average HTTP response time in milliseconds
# TYPE http_response_time gauge
http_response_time ${latest.application.averageResponseTime}

# HELP http_error_rate HTTP error rate percentage
# TYPE http_error_rate gauge
http_error_rate ${latest.application.errorRate}
    `.trim();
  }
}

// Singleton instance
export const infrastructureMonitor = new InfrastructureMonitor();

// Auto-start monitoring in production
if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
  infrastructureMonitor.startMonitoring();
}
