/**
 * Error Tracking and Monitoring
 * Comprehensive error handling with reporting to external services
 */

import { logError } from "@/lib/utils/error-handler";

// Configuration
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const IS_CLIENT = typeof window !== "undefined";

// Error tracking service configuration
interface ErrorTrackingConfig {
  dsn?: string;
  environment: string;
  userId?: string;
  sessionId?: string;
  release?: string;
}

// Enhanced error interface
interface TrackedError {
  message: string;
  stack?: string;
  code?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  context?: Record<string, any>;
  fingerprint?: string[];
}

class ErrorTracker {
  private config: ErrorTrackingConfig;
  private isInitialized = false;

  constructor(config: ErrorTrackingConfig) {
    this.config = config;
    this.initialize();
  }

  private initialize() {
    if (!IS_CLIENT || this.isInitialized) return;

    // Set up global error handlers
    this.setupGlobalErrorHandlers();

    // Set up unhandled promise rejection handler
    this.setupUnhandledRejectionHandler();

    // Set up React error boundary integration
    this.setupReactErrorHandler();

    this.isInitialized = true;
  }

  private setupGlobalErrorHandlers() {
    window.addEventListener("error", (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        severity: "medium",
        context: {
          line: event.lineno,
          column: event.colno,
          type: "javascript",
        },
      });
    });
  }

  private setupUnhandledRejectionHandler() {
    window.addEventListener("unhandledrejection", (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        severity: "high",
        context: {
          type: "unhandled_promise_rejection",
          reason: event.reason,
        },
      });
    });
  }

  private setupReactErrorHandler() {
    // This will be used by error boundaries
    (window as any).__ERROR_TRACKER__ = this;
  }

  public captureError(error: Partial<TrackedError>): void {
    const trackedError: TrackedError = {
      message: error.message || "Unknown error",
      stack: error.stack,
      code: error.code,
      userId: error.userId || this.getCurrentUserId(),
      sessionId: error.sessionId || this.getSessionId(),
      url: error.url || (IS_CLIENT ? window.location.href : undefined),
      userAgent:
        error.userAgent || (IS_CLIENT ? navigator.userAgent : undefined),
      timestamp: new Date().toISOString(),
      severity: error.severity || "medium",
      context: {
        environment: this.config.environment,
        release: this.config.release,
        ...error.context,
      },
      fingerprint: error.fingerprint || this.generateFingerprint(error),
    };

    // Log locally
    this.logError(trackedError);

    // Send to external service in production
    if (IS_PRODUCTION) {
      this.sendToExternalService(trackedError);
    }

    // Store for analytics
    this.storeForAnalytics(trackedError);
  }

  public captureException(
    exception: Error,
    context?: Record<string, any>,
  ): void {
    this.captureError({
      message: exception.message,
      stack: exception.stack,
      severity: "high",
      context,
    });
  }

  public captureMessage(
    message: string,
    severity: TrackedError["severity"] = "medium",
    context?: Record<string, any>,
  ): void {
    this.captureError({
      message,
      severity,
      context,
    });
  }

  private logError(error: TrackedError): void {
    // Use our existing error handler
    logError(error, "ErrorTracker");

    // Enhanced console logging in development
    if (!IS_PRODUCTION) {
      console.group(`🐛 Error Tracked [${error.severity.toUpperCase()}]`);
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
      console.error("Context:", error.context);
      console.error("Full Error:", error);
      console.groupEnd();
    }
  }

  private async sendToExternalService(error: TrackedError): Promise<void> {
    try {
      // Send to your error tracking service (Sentry, LogRocket, etc.)
      await fetch("/api/monitoring/errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(error),
      });
    } catch (sendError) {
      console.error("Failed to send error to tracking service:", sendError);
    }
  }

  private storeForAnalytics(error: TrackedError): void {
    try {
      // Store in localStorage for later analysis
      const errors = this.getStoredErrors();
      errors.push(error);

      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }

      localStorage.setItem("error_analytics", JSON.stringify(errors));
    } catch (storageError) {
      // Ignore storage errors
    }
  }

  public getStoredErrors(): TrackedError[] {
    try {
      const stored = localStorage.getItem("error_analytics");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public clearStoredErrors(): void {
    try {
      localStorage.removeItem("error_analytics");
    } catch {
      // Ignore
    }
  }

  private getCurrentUserId(): string | undefined {
    // Get from your auth system
    try {
      // This would integrate with your auth system
      return undefined;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string {
    try {
      let sessionId = sessionStorage.getItem("session_id");
      if (!sessionId) {
        sessionId = this.generateSessionId();
        sessionStorage.setItem("session_id", sessionId);
      }
      return sessionId;
    } catch {
      return this.generateSessionId();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(error: Partial<TrackedError>): string[] {
    const fingerprint = [];

    if (error.message) {
      // Create fingerprint from error message (normalized)
      const normalizedMessage = error.message
        .replace(/\d+/g, "X") // Replace numbers
        .replace(/['"]/g, "") // Remove quotes
        .toLowerCase();
      fingerprint.push(normalizedMessage);
    }

    if (error.stack) {
      // Extract function names from stack trace
      const functionNames = error.stack
        .split("\n")
        .slice(0, 3) // Top 3 stack frames
        .map((line) => {
          const match = line.match(/at\s+(.+?)\s+\(/);
          return match ? match[1] : null;
        })
        .filter((name): name is string => Boolean(name));

      fingerprint.push(...functionNames);
    }

    return fingerprint;
  }

  // Performance monitoring integration
  public trackPerformanceIssue(
    metric: string,
    value: number,
    threshold: number,
  ): void {
    if (value > threshold) {
      this.captureMessage(`Performance issue detected: ${metric}`, "medium", {
        metric,
        value,
        threshold,
        type: "performance",
      });
    }
  }

  // User interaction tracking
  public trackUserAction(action: string, context?: Record<string, any>): void {
    if (!IS_PRODUCTION) return;

    // Send user actions for context in error reports
    try {
      const actionData = {
        action,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        context,
      };

      // Store recent actions for error context
      const actions = JSON.parse(localStorage.getItem("user_actions") || "[]");
      actions.push(actionData);

      // Keep only last 20 actions
      if (actions.length > 20) {
        actions.splice(0, actions.length - 20);
      }

      localStorage.setItem("user_actions", JSON.stringify(actions));
    } catch {
      // Ignore storage errors
    }
  }
}

// Singleton instance
let errorTracker: ErrorTracker | null = null;

export function initializeErrorTracking(
  config?: Partial<ErrorTrackingConfig>,
): ErrorTracker {
  const defaultConfig: ErrorTrackingConfig = {
    environment: process.env.NODE_ENV || "development",
    release: process.env.NEXT_PUBLIC_VERSION || "unknown",
  };

  if (!errorTracker) {
    errorTracker = new ErrorTracker({ ...defaultConfig, ...config });
  }

  return errorTracker;
}

export function getErrorTracker(): ErrorTracker | null {
  return errorTracker;
}

// React Error Boundary integration
export function captureErrorBoundaryError(error: Error, errorInfo: any): void {
  const tracker = getErrorTracker();
  if (tracker) {
    tracker.captureError({
      message: error.message,
      stack: error.stack,
      severity: "critical",
      context: {
        componentStack: errorInfo.componentStack,
        type: "react_error_boundary",
      },
    });
  }
}

// Hook for React components
export function useErrorTracking() {
  const tracker = getErrorTracker();

  return {
    captureError: (error: Partial<TrackedError>) =>
      tracker?.captureError(error),
    captureException: (exception: Error, context?: Record<string, any>) =>
      tracker?.captureException(exception, context),
    captureMessage: (
      message: string,
      severity?: TrackedError["severity"],
      context?: Record<string, any>,
    ) => tracker?.captureMessage(message, severity, context),
    trackUserAction: (action: string, context?: Record<string, any>) =>
      tracker?.trackUserAction(action, context),
  };
}

export default ErrorTracker;
