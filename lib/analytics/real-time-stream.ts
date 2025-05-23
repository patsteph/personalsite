/**
 * Real-Time Analytics Streaming System
 *
 * Implements real-time analytics data streaming using Server-Sent Events (SSE)
 * for live dashboard updates and real-time monitoring.
 */

import { EventEmitter } from "events";
import { getAdminFirestore } from "@/lib/firebase-admin";

export interface RealTimeEvent {
  id: string;
  type: "user_event" | "system_event" | "alert" | "metric_update";
  category: string;
  data: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
}

export interface StreamSubscription {
  id: string;
  clientId: string;
  filters: StreamFilter[];
  isActive: boolean;
  lastHeartbeat: Date;
  response?: any; // SSE response object
}

export interface StreamFilter {
  type: "event_type" | "category" | "user_id" | "session_id" | "metric";
  operator: "equals" | "contains" | "in" | "greater_than" | "less_than";
  value: string | string[] | number;
}

export interface RealTimeMetrics {
  activeUsers: number;
  currentPageViews: number;
  eventsPerMinute: number;
  topPages: Array<{ page: string; views: number }>;
  recentEvents: RealTimeEvent[];
  systemHealth: {
    status: "healthy" | "warning" | "critical";
    metrics: Record<string, number>;
  };
}

export interface Alert {
  id: string;
  type: "traffic_spike" | "error_rate" | "performance" | "system" | "custom";
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  data: Record<string, any>;
  timestamp: Date;
  acknowledged: boolean;
}

export class RealTimeAnalyticsStream extends EventEmitter {
  private db: FirebaseFirestore.Firestore;
  private subscriptions: Map<string, StreamSubscription> = new Map();
  private eventBuffer: RealTimeEvent[] = [];
  private metricsCache: RealTimeMetrics | null = null;
  private alerts: Alert[] = [];
  private isRunning: boolean = false;
  private heartbeatInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private bufferFlushInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.db = getAdminFirestore();
    this.setupEventListeners();
  }

  /**
   * Start the real-time streaming service
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;

    // Start heartbeat to clean up inactive subscriptions
    this.heartbeatInterval = setInterval(() => {
      this.cleanupInactiveSubscriptions();
    }, 30000); // 30 seconds

    // Start metrics calculation
    this.metricsInterval = setInterval(() => {
      this.updateRealTimeMetrics();
    }, 5000); // 5 seconds

    // Start buffer flushing
    this.bufferFlushInterval = setInterval(() => {
      this.flushEventBuffer();
    }, 1000); // 1 second

    console.log("Real-time analytics streaming started");
  }

  /**
   * Stop the real-time streaming service
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }

    // Close all active subscriptions
    for (const subscription of this.subscriptions.values()) {
      this.closeSubscription(subscription.id);
    }

    console.log("Real-time analytics streaming stopped");
  }

  /**
   * Create new SSE subscription for a client
   */
  createSubscription(
    clientId: string,
    response: any,
    filters: StreamFilter[] = [],
  ): string {
    const subscriptionId = this.generateSubscriptionId();

    const subscription: StreamSubscription = {
      id: subscriptionId,
      clientId,
      filters,
      isActive: true,
      lastHeartbeat: new Date(),
      response,
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Set up SSE headers
    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    // Send initial connection event
    this.sendSSEMessage(subscriptionId, {
      type: "connection",
      data: { subscriptionId, status: "connected" },
    });

    // Send current metrics
    if (this.metricsCache) {
      this.sendSSEMessage(subscriptionId, {
        type: "metrics",
        data: this.metricsCache,
      });
    }

    // Handle client disconnect
    response.on("close", () => {
      this.closeSubscription(subscriptionId);
    });

    console.log(
      `SSE subscription created: ${subscriptionId} for client: ${clientId}`,
    );
    return subscriptionId;
  }

  /**
   * Close a subscription
   */
  closeSubscription(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.isActive = false;
      if (subscription.response && !subscription.response.destroyed) {
        subscription.response.end();
      }
      this.subscriptions.delete(subscriptionId);
      console.log(`SSE subscription closed: ${subscriptionId}`);
    }
  }

  /**
   * Process incoming analytics event
   */
  processEvent(event: Omit<RealTimeEvent, "id" | "timestamp">): void {
    const realTimeEvent: RealTimeEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
    };

    // Add to buffer
    this.eventBuffer.push(realTimeEvent);

    // Check for alerts
    this.checkForAlerts(realTimeEvent);

    // Emit event for internal processing
    this.emit("event", realTimeEvent);
  }

  /**
   * Get current real-time metrics
   */
  getCurrentMetrics(): RealTimeMetrics | null {
    return this.metricsCache;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter((alert) => !alert.acknowledged);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.broadcastToSubscriptions({
        type: "alert_acknowledged",
        data: { alertId },
      });
    }
  }

  /**
   * Add custom alert
   */
  createAlert(
    type: Alert["type"],
    severity: Alert["severity"],
    title: string,
    description: string,
    data: Record<string, any> = {},
  ): string {
    const alert: Alert = {
      id: this.generateAlertId(),
      type,
      severity,
      title,
      description,
      data,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.push(alert);

    // Broadcast alert to all subscriptions
    this.broadcastToSubscriptions({
      type: "alert",
      data: alert,
    });

    return alert.id;
  }

  // Private methods

  private setupEventListeners(): void {
    // Listen for internal events
    this.on("event", (event: RealTimeEvent) => {
      this.broadcastEventToSubscriptions(event);
    });

    this.on("metrics_update", (metrics: RealTimeMetrics) => {
      this.broadcastToSubscriptions({
        type: "metrics",
        data: metrics,
      });
    });
  }

  private async updateRealTimeMetrics(): Promise<void> {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

      // Active users (sessions with activity in last 5 minutes)
      const activeSessionsQuery = await this.db
        .collection("analytics_sessions")
        .where("updatedAt", ">=", fiveMinutesAgo)
        .get();

      const activeUsers = activeSessionsQuery.size;

      // Current page views (last 30 minutes)
      const pageViewsQuery = await this.db
        .collection("analytics_events")
        .where("type", "==", "page_view")
        .where("timestamp", ">=", thirtyMinutesAgo)
        .get();

      const currentPageViews = pageViewsQuery.size;

      // Events per minute (last 5 minutes)
      const eventsQuery = await this.db
        .collection("analytics_events")
        .where("timestamp", ">=", fiveMinutesAgo)
        .get();

      const eventsPerMinute = eventsQuery.size / 5;

      // Top pages (last 30 minutes)
      const pageViews = pageViewsQuery.docs.map((doc) => doc.data());
      const pageViewCounts: Record<string, number> = {};

      pageViews.forEach((pv: any) => {
        const page = pv.page || "unknown";
        pageViewCounts[page] = (pageViewCounts[page] || 0) + 1;
      });

      const topPages = Object.entries(pageViewCounts)
        .map(([page, views]) => ({ page, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Recent events from buffer
      const recentEvents = this.eventBuffer
        .filter((event) => event.timestamp.getTime() > fiveMinutesAgo.getTime())
        .slice(-20);

      // System health (simplified)
      const systemHealth = {
        status: "healthy" as const,
        metrics: {
          responseTime: 100, // Would calculate from performance data
          errorRate: 0.001,
          memoryUsage: 0.6,
        },
      };

      this.metricsCache = {
        activeUsers,
        currentPageViews,
        eventsPerMinute,
        topPages,
        recentEvents,
        systemHealth,
      };

      this.emit("metrics_update", this.metricsCache);
    } catch (error) {
      console.error("Error updating real-time metrics:", error);
    }
  }

  private flushEventBuffer(): void {
    // Keep only recent events in buffer (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    this.eventBuffer = this.eventBuffer.filter(
      (event) => event.timestamp.getTime() > tenMinutesAgo.getTime(),
    );
  }

  private checkForAlerts(event: RealTimeEvent): void {
    // Check for traffic spikes
    if (event.type === "user_event" && event.category === "page_view") {
      const recentPageViews = this.eventBuffer.filter(
        (e) =>
          e.category === "page_view" &&
          e.timestamp.getTime() > Date.now() - 60000, // Last minute
      ).length;

      if (recentPageViews > 100) {
        // Threshold for traffic spike
        this.createAlert(
          "traffic_spike",
          "warning",
          "Traffic Spike Detected",
          `${recentPageViews} page views in the last minute`,
          { pageViews: recentPageViews, threshold: 100 },
        );
      }
    }

    // Check for error rate
    if (event.type === "user_event" && event.category === "error") {
      const recentErrors = this.eventBuffer.filter(
        (e) =>
          e.category === "error" && e.timestamp.getTime() > Date.now() - 300000, // Last 5 minutes
      ).length;

      const recentEvents = this.eventBuffer.filter(
        (e) => e.timestamp.getTime() > Date.now() - 300000,
      ).length;

      const errorRate = recentEvents > 0 ? recentErrors / recentEvents : 0;

      if (errorRate > 0.05) {
        // 5% error rate threshold
        this.createAlert(
          "error_rate",
          "critical",
          "High Error Rate",
          `Error rate of ${(errorRate * 100).toFixed(1)}% detected`,
          { errorRate, threshold: 0.05 },
        );
      }
    }
  }

  private broadcastEventToSubscriptions(event: RealTimeEvent): void {
    for (const subscription of this.subscriptions.values()) {
      if (
        subscription.isActive &&
        this.eventMatchesFilters(event, subscription.filters)
      ) {
        this.sendSSEMessage(subscription.id, {
          type: "event",
          data: event,
        });
      }
    }
  }

  private broadcastToSubscriptions(message: { type: string; data: any }): void {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.isActive) {
        this.sendSSEMessage(subscription.id, message);
      }
    }
  }

  private sendSSEMessage(
    subscriptionId: string,
    message: { type: string; data: any },
  ): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (
      !subscription ||
      !subscription.isActive ||
      subscription.response.destroyed
    ) {
      return;
    }

    try {
      const sseData = `data: ${JSON.stringify(message)}\n\n`;
      subscription.response.write(sseData);
      subscription.lastHeartbeat = new Date();
    } catch (error) {
      console.error(`Error sending SSE message to ${subscriptionId}:`, error);
      this.closeSubscription(subscriptionId);
    }
  }

  private eventMatchesFilters(
    event: RealTimeEvent,
    filters: StreamFilter[],
  ): boolean {
    if (filters.length === 0) return true;

    return filters.some((filter) => {
      let value: any;

      switch (filter.type) {
        case "event_type":
          value = event.type;
          break;
        case "category":
          value = event.category;
          break;
        case "user_id":
          value = event.userId;
          break;
        case "session_id":
          value = event.sessionId;
          break;
        case "metric":
          value = event.data[filter.value as string];
          break;
        default:
          return false;
      }

      return this.evaluateFilterCondition(value, filter.operator, filter.value);
    });
  }

  private evaluateFilterCondition(
    contextValue: any,
    operator: string,
    filterValue: any,
  ): boolean {
    switch (operator) {
      case "equals":
        return contextValue === filterValue;
      case "contains":
        return String(contextValue).includes(String(filterValue));
      case "in":
        return Array.isArray(filterValue) && filterValue.includes(contextValue);
      case "greater_than":
        return Number(contextValue) > Number(filterValue);
      case "less_than":
        return Number(contextValue) < Number(filterValue);
      default:
        return false;
    }
  }

  private cleanupInactiveSubscriptions(): void {
    const now = new Date();
    const timeout = 60000; // 1 minute timeout

    for (const [id, subscription] of this.subscriptions.entries()) {
      if (now.getTime() - subscription.lastHeartbeat.getTime() > timeout) {
        console.log(`Cleaning up inactive subscription: ${id}`);
        this.closeSubscription(id);
      }
    }
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const realTimeAnalyticsStream = new RealTimeAnalyticsStream();

// Auto-start if not in test environment
if (process.env.NODE_ENV !== "test") {
  realTimeAnalyticsStream.start();
}

// Graceful shutdown
process.on("SIGTERM", () => {
  realTimeAnalyticsStream.stop();
});

process.on("SIGINT", () => {
  realTimeAnalyticsStream.stop();
});
