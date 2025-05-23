/**
 * Advanced debugging and diagnostic tools
 * Provides comprehensive error tracking, performance profiling, and diagnostic capabilities
 */

export interface ErrorContext {
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  timestamp: number;
  component?: string;
  action?: string;
  props?: any;
  state?: any;
  stackTrace: string;
  sourceMap?: boolean;
}

export interface PerformanceTrace {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, string>;
  spans: PerformanceSpan[];
  metadata: Record<string, any>;
}

export interface PerformanceSpan {
  id: string;
  traceId: string;
  parentId?: string;
  operation: string;
  startTime: number;
  duration: number;
  tags: Record<string, string>;
  logs: SpanLog[];
}

export interface SpanLog {
  timestamp: number;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  fields?: Record<string, any>;
}

export interface DiagnosticReport {
  id: string;
  timestamp: number;
  type: "error" | "performance" | "user-action" | "system";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  context: ErrorContext;
  traces: PerformanceTrace[];
  suggestions: string[];
  automated: boolean;
}

export interface DebuggerConfig {
  enabled: boolean;
  captureErrors: boolean;
  capturePerformance: boolean;
  captureUserActions: boolean;
  maxTraces: number;
  maxSpans: number;
  samplingRate: number;
  enableSourceMaps: boolean;
  enableMemoryProfiling: boolean;
}

export class AdvancedDebugger {
  private errors: Map<string, DiagnosticReport> = new Map();
  private traces: Map<string, PerformanceTrace> = new Map();
  private activeSpans: Map<string, PerformanceSpan> = new Map();
  private userSessions: Map<string, any> = new Map();
  private memorySnapshots: any[] = [];
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(
    private config: DebuggerConfig = {
      enabled: true,
      captureErrors: true,
      capturePerformance: true,
      captureUserActions: true,
      maxTraces: 1000,
      maxSpans: 5000,
      samplingRate: 0.1, // 10% sampling
      enableSourceMaps: true,
      enableMemoryProfiling: false,
    },
  ) {
    this.initialize();
  }

  /**
   * Initialize debugging system
   */
  private initialize(): void {
    if (!this.config.enabled) return;

    // Global error handler
    if (typeof window !== "undefined" && this.config.captureErrors) {
      window.addEventListener("error", (event) => {
        this.captureError(event.error, {
          url: window.location.href,
          userAgent: navigator.userAgent,
          sessionId: this.getSessionId(),
          timestamp: Date.now(),
          stackTrace: event.error?.stack || "No stack trace available",
        });
      });

      window.addEventListener("unhandledrejection", (event) => {
        this.captureError(event.reason, {
          url: window.location.href,
          userAgent: navigator.userAgent,
          sessionId: this.getSessionId(),
          timestamp: Date.now(),
          stackTrace: event.reason?.stack || "No stack trace available",
        });
      });
    }

    // Performance observer
    if (typeof window !== "undefined" && this.config.capturePerformance) {
      this.initializePerformanceObserver();
    }

    // User action tracking
    if (typeof window !== "undefined" && this.config.captureUserActions) {
      this.initializeUserActionTracking();
    }

    // Memory profiling
    if (this.config.enableMemoryProfiling) {
      this.startMemoryProfiling();
    }
  }

  /**
   * Capture and analyze an error
   */
  captureError(
    error: Error | string,
    context: Partial<ErrorContext> = {},
  ): string {
    const errorId = this.generateId();
    const errorObj = error instanceof Error ? error : new Error(String(error));

    const fullContext: ErrorContext = {
      sessionId: this.getSessionId(),
      url: typeof window !== "undefined" ? window.location.href : "server",
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "server",
      timestamp: Date.now(),
      stackTrace: errorObj.stack || "No stack trace available",
      ...context,
    };

    const report: DiagnosticReport = {
      id: errorId,
      timestamp: fullContext.timestamp,
      type: "error",
      severity: this.classifyErrorSeverity(errorObj),
      title: errorObj.message,
      description: this.generateErrorDescription(errorObj, fullContext),
      context: fullContext,
      traces: this.getRelevantTraces(fullContext.timestamp),
      suggestions: this.generateErrorSuggestions(errorObj, fullContext),
      automated: true,
    };

    this.errors.set(errorId, report);
    this.emit("error", report);

    // Auto-fix if possible
    this.attemptAutoFix(report);

    return errorId;
  }

  /**
   * Start a performance trace
   */
  startTrace(name: string, tags: Record<string, string> = {}): string {
    const traceId = this.generateId();

    const trace: PerformanceTrace = {
      id: traceId,
      name,
      startTime: performance.now(),
      tags,
      spans: [],
      metadata: {},
    };

    this.traces.set(traceId, trace);
    return traceId;
  }

  /**
   * End a performance trace
   */
  endTrace(traceId: string): void {
    const trace = this.traces.get(traceId);
    if (trace) {
      trace.endTime = performance.now();
      trace.duration = trace.endTime - trace.startTime;

      // Analyze trace performance
      this.analyzeTrace(trace);
    }
  }

  /**
   * Start a performance span within a trace
   */
  startSpan(traceId: string, operation: string, parentId?: string): string {
    const spanId = this.generateId();

    const span: PerformanceSpan = {
      id: spanId,
      traceId,
      parentId,
      operation,
      startTime: performance.now(),
      duration: 0,
      tags: {},
      logs: [],
    };

    this.activeSpans.set(spanId, span);
    return spanId;
  }

  /**
   * End a performance span
   */
  endSpan(spanId: string): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.duration = performance.now() - span.startTime;

      const trace = this.traces.get(span.traceId);
      if (trace) {
        trace.spans.push(span);
      }

      this.activeSpans.delete(spanId);
    }
  }

  /**
   * Add log to a span
   */
  logToSpan(
    spanId: string,
    level: SpanLog["level"],
    message: string,
    fields?: Record<string, any>,
  ): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: performance.now(),
        level,
        message,
        fields,
      });
    }
  }

  /**
   * Create a diagnostic report
   */
  createDiagnosticReport(
    type: DiagnosticReport["type"],
    title: string,
    description: string,
    context: Partial<ErrorContext> = {},
  ): string {
    const reportId = this.generateId();

    const report: DiagnosticReport = {
      id: reportId,
      timestamp: Date.now(),
      type,
      severity: "medium",
      title,
      description,
      context: {
        sessionId: this.getSessionId(),
        url: typeof window !== "undefined" ? window.location.href : "server",
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "server",
        timestamp: Date.now(),
        stackTrace: "",
        ...context,
      },
      traces: this.getRelevantTraces(Date.now()),
      suggestions: [],
      automated: false,
    };

    this.errors.set(reportId, report);
    return reportId;
  }

  /**
   * Get performance flame graph data
   */
  getFlameGraphData(traceId?: string): any {
    const traces = traceId
      ? [this.traces.get(traceId)].filter(
          (trace): trace is PerformanceTrace => trace !== undefined,
        )
      : Array.from(this.traces.values());

    return traces.map((trace) => ({
      name: trace.name,
      duration: trace.duration,
      spans: trace.spans.map((span) => ({
        name: span.operation,
        start: span.startTime - trace.startTime,
        duration: span.duration,
        parent: span.parentId,
      })),
    }));
  }

  /**
   * Get error analytics
   */
  getErrorAnalytics(timeRange: number = 24 * 60 * 60 * 1000): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    topErrors: DiagnosticReport[];
    errorTrends: Array<{ timestamp: number; count: number }>;
  } {
    const cutoff = Date.now() - timeRange;
    const recentErrors = Array.from(this.errors.values()).filter(
      (error) => error.timestamp > cutoff,
    );

    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    recentErrors.forEach((error) => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] =
        (errorsBySeverity[error.severity] || 0) + 1;
    });

    const topErrors = recentErrors
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    // Group errors by hour for trend analysis
    const errorTrends = this.groupErrorsByTime(recentErrors, 60 * 60 * 1000);

    return {
      totalErrors: recentErrors.length,
      errorsByType,
      errorsBySeverity,
      topErrors,
      errorTrends,
    };
  }

  /**
   * Get performance insights
   */
  getPerformanceInsights(): {
    slowestTraces: PerformanceTrace[];
    averageResponseTime: number;
    performanceScore: number;
    bottlenecks: Array<{
      operation: string;
      avgDuration: number;
      count: number;
    }>;
  } {
    const traces = Array.from(this.traces.values()).filter((t) => t.duration);

    const slowestTraces = traces
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    const avgResponseTime =
      traces.length > 0
        ? traces.reduce((sum, trace) => sum + (trace.duration || 0), 0) /
          traces.length
        : 0;

    const performanceScore = this.calculatePerformanceScore(traces);
    const bottlenecks = this.identifyBottlenecks(traces);

    return {
      slowestTraces,
      averageResponseTime: avgResponseTime,
      performanceScore,
      bottlenecks,
    };
  }

  /**
   * Export debug data
   */
  exportDebugData(format: "json" | "csv" = "json"): string {
    const data = {
      errors: Array.from(this.errors.values()),
      traces: Array.from(this.traces.values()),
      memorySnapshots: this.memorySnapshots,
    };

    if (format === "csv") {
      return this.convertToCSV(data);
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear debug data
   */
  clearDebugData(): void {
    this.errors.clear();
    this.traces.clear();
    this.activeSpans.clear();
    this.memorySnapshots = [];
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  private initializePerformanceObserver(): void {
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (Math.random() < this.config.samplingRate) {
            this.recordPerformanceEntry(entry);
          }
        });
      });

      observer.observe({
        entryTypes: ["navigation", "resource", "measure", "mark"],
      });
    }
  }

  private initializeUserActionTracking(): void {
    // Track clicks
    document.addEventListener("click", (event) => {
      if (Math.random() < this.config.samplingRate) {
        this.recordUserAction("click", event.target as Element);
      }
    });

    // Track form submissions
    document.addEventListener("submit", (event) => {
      this.recordUserAction("submit", event.target as Element);
    });

    // Track navigation
    window.addEventListener("popstate", () => {
      this.recordUserAction("navigation", null);
    });
  }

  private startMemoryProfiling(): void {
    if (
      typeof window !== "undefined" &&
      "performance" in window &&
      "memory" in (window.performance as any)
    ) {
      setInterval(() => {
        const memory = (window.performance as any).memory;
        this.memorySnapshots.push({
          timestamp: Date.now(),
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });

        // Keep only recent snapshots
        if (this.memorySnapshots.length > 1000) {
          this.memorySnapshots = this.memorySnapshots.slice(-1000);
        }
      }, 10000); // Every 10 seconds
    }
  }

  private recordPerformanceEntry(entry: PerformanceEntry): void {
    const traceId = this.startTrace(entry.name, {
      type: entry.entryType,
      duration: entry.duration.toString(),
    });

    setTimeout(() => this.endTrace(traceId), 0);
  }

  private recordUserAction(action: string, element: Element | null): void {
    const report = this.createDiagnosticReport(
      "user-action",
      `User ${action}`,
      `User performed ${action} action`,
      {
        action,
        component: element?.tagName || "unknown",
      },
    );
  }

  private classifyErrorSeverity(error: Error): DiagnosticReport["severity"] {
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) {
      return "medium";
    }
    if (message.includes("permission") || message.includes("security")) {
      return "high";
    }
    if (message.includes("cannot read") || message.includes("undefined")) {
      return "critical";
    }

    return "medium";
  }

  private generateErrorDescription(
    error: Error,
    context: ErrorContext,
  ): string {
    return `Error occurred in ${context.component || "unknown component"} at ${context.url}. ${error.message}`;
  }

  private generateErrorSuggestions(
    error: Error,
    context: ErrorContext,
  ): string[] {
    const suggestions: string[] = [];
    const message = error.message.toLowerCase();

    if (message.includes("cannot read property")) {
      suggestions.push(
        "Check for null/undefined values before accessing properties",
      );
      suggestions.push("Add proper error boundaries");
    }

    if (message.includes("network")) {
      suggestions.push("Implement retry logic for network requests");
      suggestions.push("Add offline handling");
    }

    if (message.includes("cors")) {
      suggestions.push("Configure CORS headers on server");
      suggestions.push("Use proxy for development");
    }

    return suggestions;
  }

  private getRelevantTraces(timestamp: number): PerformanceTrace[] {
    const timeWindow = 5000; // 5 seconds
    return Array.from(this.traces.values()).filter(
      (trace) => Math.abs(trace.startTime - timestamp) < timeWindow,
    );
  }

  private analyzeTrace(trace: PerformanceTrace): void {
    if (trace.duration && trace.duration > 1000) {
      // Slow trace
      this.createDiagnosticReport(
        "performance",
        "Slow Performance Detected",
        `Trace ${trace.name} took ${trace.duration.toFixed(2)}ms`,
        { action: trace.name },
      );
    }
  }

  private attemptAutoFix(report: DiagnosticReport): void {
    // Simple auto-fix strategies
    if (
      report.title.includes("memory") &&
      typeof global !== "undefined" &&
      global.gc
    ) {
      global.gc();
    }
  }

  private groupErrorsByTime(
    errors: DiagnosticReport[],
    interval: number,
  ): Array<{ timestamp: number; count: number }> {
    const groups: Record<number, number> = {};

    errors.forEach((error) => {
      const bucket = Math.floor(error.timestamp / interval) * interval;
      groups[bucket] = (groups[bucket] || 0) + 1;
    });

    return Object.entries(groups).map(([timestamp, count]) => ({
      timestamp: parseInt(timestamp),
      count,
    }));
  }

  private calculatePerformanceScore(traces: PerformanceTrace[]): number {
    if (traces.length === 0) return 100;

    const avgDuration =
      traces.reduce((sum, trace) => sum + (trace.duration || 0), 0) /
      traces.length;
    return Math.max(0, 100 - avgDuration / 10); // Rough scoring
  }

  private identifyBottlenecks(
    traces: PerformanceTrace[],
  ): Array<{ operation: string; avgDuration: number; count: number }> {
    const operations: Record<string, { total: number; count: number }> = {};

    traces.forEach((trace) => {
      trace.spans.forEach((span) => {
        if (!operations[span.operation]) {
          operations[span.operation] = { total: 0, count: 0 };
        }
        operations[span.operation].total += span.duration;
        operations[span.operation].count++;
      });
    });

    return Object.entries(operations)
      .map(([operation, data]) => ({
        operation,
        avgDuration: data.total / data.count,
        count: data.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion
    const errors = data.errors.map((error: DiagnosticReport) => ({
      timestamp: new Date(error.timestamp).toISOString(),
      type: error.type,
      severity: error.severity,
      title: error.title,
      url: error.context.url,
    }));

    const headers = Object.keys(errors[0] || {});
    const rows = errors.map((error: any) =>
      headers.map((header) => error[header]).join(","),
    );

    return [headers.join(","), ...rows].join("\n");
  }

  private getSessionId(): string {
    if (typeof window !== "undefined") {
      let sessionId = sessionStorage.getItem("debug-session-id");
      if (!sessionId) {
        sessionId = this.generateId();
        sessionStorage.setItem("debug-session-id", sessionId);
      }
      return sessionId;
    }
    return "server-session";
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const advancedDebugger = new AdvancedDebugger();

// React hook for debugging
export function useAdvancedDebugger() {
  return {
    captureError: advancedDebugger.captureError.bind(advancedDebugger),
    startTrace: advancedDebugger.startTrace.bind(advancedDebugger),
    endTrace: advancedDebugger.endTrace.bind(advancedDebugger),
    createReport:
      advancedDebugger.createDiagnosticReport.bind(advancedDebugger),
    getAnalytics: advancedDebugger.getErrorAnalytics.bind(advancedDebugger),
  };
}
