/**
 * Client-Side Analytics Tracker
 *
 * Handles client-side event tracking, session management,
 * and real-time analytics data collection.
 */

import {
  EventType,
  UserEvent,
  DeviceInfo,
  LocationInfo,
} from "./user-behavior";

export interface TrackingConfig {
  enabled: boolean;
  apiEndpoint: string;
  sessionTimeout: number; // milliseconds
  batchSize: number;
  flushInterval: number; // milliseconds
  enablePerformanceTracking: boolean;
  enableScrollTracking: boolean;
  enableClickTracking: boolean;
  enableFormTracking: boolean;
  enableErrorTracking: boolean;
}

export interface TrackingOptions {
  category?: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  immediate?: boolean; // Skip batching and send immediately
}

export class ClientAnalyticsTracker {
  private config: TrackingConfig;
  private sessionId: string;
  private userId?: string;
  private eventQueue: Omit<UserEvent, "eventId" | "timestamp">[] = [];
  private flushTimer?: NodeJS.Timeout;
  private sessionTimer?: NodeJS.Timeout;
  private pageStartTime: number = Date.now();
  private scrollDepth: number = 0;
  private maxScrollDepth: number = 0;
  private isTracking: boolean = false;

  constructor(config: Partial<TrackingConfig> = {}) {
    this.config = {
      enabled: true,
      apiEndpoint: "/api/analytics/events",
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      batchSize: 10,
      flushInterval: 5000, // 5 seconds
      enablePerformanceTracking: true,
      enableScrollTracking: true,
      enableClickTracking: true,
      enableFormTracking: true,
      enableErrorTracking: true,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  /**
   * Initialize tracking and event listeners
   */
  private initializeTracking(): void {
    if (!this.config.enabled || typeof window === "undefined") {
      return;
    }

    this.isTracking = true;

    // Start session
    this.startSession();

    // Set up automatic event listeners
    this.setupEventListeners();

    // Set up batch flushing
    this.startBatchFlushing();

    // Set up session timeout
    this.resetSessionTimeout();

    // Track initial page view
    this.trackPageView();
  }

  /**
   * Set up automatic event listeners
   */
  private setupEventListeners(): void {
    if (typeof window === "undefined") return;

    // Page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.flushEvents(true);
      } else {
        this.resetSessionTimeout();
      }
    });

    // Before page unload
    window.addEventListener("beforeunload", () => {
      this.endSession();
      this.flushEvents(true);
    });

    // Scroll tracking
    if (this.config.enableScrollTracking) {
      this.setupScrollTracking();
    }

    // Click tracking
    if (this.config.enableClickTracking) {
      this.setupClickTracking();
    }

    // Form tracking
    if (this.config.enableFormTracking) {
      this.setupFormTracking();
    }

    // Error tracking
    if (this.config.enableErrorTracking) {
      this.setupErrorTracking();
    }

    // Performance tracking
    if (this.config.enablePerformanceTracking) {
      this.setupPerformanceTracking();
    }
  }

  /**
   * Track custom event
   */
  track(type: EventType, action: string, options: TrackingOptions = {}): void {
    if (!this.isTracking) return;

    const event: Omit<UserEvent, "eventId" | "timestamp"> = {
      sessionId: this.sessionId,
      type,
      category: options.category || "general",
      action,
      label: options.label,
      value: options.value,
      metadata: {
        ...options.metadata,
        userId: this.userId,
        page: window.location.pathname,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      },
      page: window.location.pathname,
      scrollDepth: this.maxScrollDepth,
      timeOnPage: Date.now() - this.pageStartTime,
    };

    if (options.immediate) {
      this.sendEvent(event);
    } else {
      this.queueEvent(event);
    }

    this.resetSessionTimeout();
  }

  /**
   * Track page view
   */
  trackPageView(page?: string): void {
    const currentPage = page || window.location.pathname;

    this.track("page_view", "view", {
      category: "navigation",
      metadata: {
        title: document.title,
        url: window.location.href,
        referrer: document.referrer,
      },
    });

    // Reset page timing
    this.pageStartTime = Date.now();
    this.scrollDepth = 0;
    this.maxScrollDepth = 0;
  }

  /**
   * Track user interaction
   */
  trackClick(element: HTMLElement, options: TrackingOptions = {}): void {
    const elementInfo = this.getElementInfo(element);

    this.track("click", "click", {
      category: "interaction",
      label: elementInfo.text || elementInfo.id || elementInfo.className,
      metadata: {
        ...options.metadata,
        element: elementInfo,
        coordinates: this.getClickCoordinates(element),
      },
    });
  }

  /**
   * Track form submission
   */
  trackFormSubmit(form: HTMLFormElement, options: TrackingOptions = {}): void {
    const formInfo = this.getFormInfo(form);

    this.track("form_submit", "submit", {
      category: "form",
      label: formInfo.name || formInfo.id,
      metadata: {
        ...options.metadata,
        form: formInfo,
      },
    });
  }

  /**
   * Track download
   */
  trackDownload(
    url: string,
    fileName: string,
    options: TrackingOptions = {},
  ): void {
    this.track("download", "download", {
      category: "file",
      label: fileName,
      metadata: {
        ...options.metadata,
        url,
        fileName,
        fileType: this.getFileType(fileName),
      },
    });
  }

  /**
   * Track social share
   */
  trackSocialShare(
    platform: string,
    url: string,
    options: TrackingOptions = {},
  ): void {
    this.track("social_share", "share", {
      category: "social",
      label: platform,
      metadata: {
        ...options.metadata,
        platform,
        url,
        content: document.title,
      },
    });
  }

  /**
   * Track blog reaction
   */
  trackBlogReaction(
    postId: string,
    reactionType: string,
    options: TrackingOptions = {},
  ): void {
    this.track("blog_reaction", reactionType, {
      category: "blog",
      label: postId,
      value: 1,
      metadata: {
        ...options.metadata,
        postId,
        reactionType,
      },
      immediate: true, // Blog reactions should be tracked immediately
    });
  }

  /**
   * Track book interaction
   */
  trackBookInteraction(
    bookId: string,
    action: string,
    options: TrackingOptions = {},
  ): void {
    this.track("book_interaction", action, {
      category: "books",
      label: bookId,
      metadata: {
        ...options.metadata,
        bookId,
        action,
      },
    });
  }

  /**
   * Track search
   */
  trackSearch(
    query: string,
    results: number,
    options: TrackingOptions = {},
  ): void {
    this.track("search", "search", {
      category: "search",
      label: query,
      value: results,
      metadata: {
        ...options.metadata,
        query,
        resultsCount: results,
      },
    });
  }

  /**
   * Track error
   */
  trackError(
    error: Error,
    context?: string,
    options: TrackingOptions = {},
  ): void {
    this.track("error", "error", {
      category: "error",
      label: error.message,
      metadata: {
        ...options.metadata,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        context,
        url: window.location.href,
      },
      immediate: true, // Errors should be tracked immediately
    });
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;

    // Track user identification
    this.track("session_start", "identify", {
      category: "user",
      metadata: {
        userId,
        sessionId: this.sessionId,
      },
      immediate: true,
    });
  }

  /**
   * Start new session
   */
  private startSession(): void {
    const deviceInfo = this.getDeviceInfo();
    const locationInfo = this.getLocationInfo();

    // Send session start event
    this.track("session_start", "start", {
      category: "session",
      metadata: {
        sessionId: this.sessionId,
        device: deviceInfo,
        location: locationInfo,
        startTime: new Date().toISOString(),
      },
      immediate: true,
    });
  }

  /**
   * End current session
   */
  private endSession(): void {
    this.track("session_end", "end", {
      category: "session",
      metadata: {
        sessionId: this.sessionId,
        duration: Date.now() - this.getSessionStartTime(),
        endTime: new Date().toISOString(),
      },
      immediate: true,
    });
  }

  /**
   * Set up scroll tracking
   */
  private setupScrollTracking(): void {
    let scrollTimeout: NodeJS.Timeout;

    window.addEventListener("scroll", () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.updateScrollDepth();
      }, 100);
    });
  }

  /**
   * Update scroll depth tracking
   */
  private updateScrollDepth(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / documentHeight) * 100);

    this.scrollDepth = scrollPercent;
    this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercent);

    // Track scroll milestones
    const milestones = [25, 50, 75, 90, 100];
    milestones.forEach((milestone) => {
      if (scrollPercent >= milestone && !this.hasScrollMilestone(milestone)) {
        this.track("scroll", "milestone", {
          category: "engagement",
          label: `${milestone}%`,
          value: milestone,
          metadata: {
            scrollDepth: milestone,
          },
        });
        this.setScrollMilestone(milestone);
      }
    });
  }

  /**
   * Set up click tracking
   */
  private setupClickTracking(): void {
    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;

      // Skip tracking for certain elements
      if (this.shouldSkipElement(target)) {
        return;
      }

      this.trackClick(target);
    });
  }

  /**
   * Set up form tracking
   */
  private setupFormTracking(): void {
    document.addEventListener("submit", (event) => {
      const form = event.target as HTMLFormElement;
      if (form.tagName === "FORM") {
        this.trackFormSubmit(form);
      }
    });
  }

  /**
   * Set up error tracking
   */
  private setupErrorTracking(): void {
    window.addEventListener("error", (event) => {
      this.trackError(new Error(event.message), "global", {
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.trackError(new Error(event.reason), "promise");
    });
  }

  /**
   * Set up performance tracking
   */
  private setupPerformanceTracking(): void {
    if ("performance" in window) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType(
            "navigation",
          )[0] as PerformanceNavigationTiming;
          const paint = performance.getEntriesByType("paint");

          this.track("performance", "page_load", {
            category: "performance",
            metadata: {
              loadTime: navigation.loadEventEnd - navigation.loadEventStart,
              domContentLoaded:
                navigation.domContentLoadedEventEnd -
                navigation.domContentLoadedEventStart,
              firstPaint: paint.find((p) => p.name === "first-paint")
                ?.startTime,
              firstContentfulPaint: paint.find(
                (p) => p.name === "first-contentful-paint",
              )?.startTime,
            },
          });
        }, 0);
      });
    }
  }

  /**
   * Queue event for batch processing
   */
  private queueEvent(event: Omit<UserEvent, "eventId" | "timestamp">): void {
    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.config.batchSize) {
      this.flushEvents();
    }
  }

  /**
   * Send single event immediately
   */
  private async sendEvent(
    event: Omit<UserEvent, "eventId" | "timestamp">,
  ): Promise<void> {
    try {
      await fetch(this.config.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events: [event] }),
        keepalive: true,
      });
    } catch (error) {
      console.warn("Failed to send analytics event:", error);
    }
  }

  /**
   * Flush queued events
   */
  private async flushEvents(force: boolean = false): Promise<void> {
    if (this.eventQueue.length === 0) return;
    if (!force && this.eventQueue.length < this.config.batchSize) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await fetch(this.config.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events }),
        keepalive: true,
      });
    } catch (error) {
      console.warn("Failed to flush analytics events:", error);
      // Re-queue events if they failed to send
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Start batch flushing timer
   */
  private startBatchFlushing(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.config.flushInterval);
  }

  /**
   * Reset session timeout
   */
  private resetSessionTimeout(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(() => {
      this.endSession();
      this.sessionId = this.generateSessionId();
      this.startSession();
    }, this.config.sessionTimeout);
  }

  // Helper methods
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionStartTime(): number {
    // Get from session storage or estimate
    const stored = sessionStorage.getItem(
      `analytics_session_${this.sessionId}`,
    );
    return stored ? parseInt(stored) : Date.now();
  }

  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;

    return {
      type: this.getDeviceType(),
      os: this.getOS(userAgent),
      browser: this.getBrowser(userAgent),
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };
  }

  private getLocationInfo(): LocationInfo {
    // Basic location info (could be enhanced with IP geolocation)
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private getDeviceType(): "desktop" | "tablet" | "mobile" {
    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }

  private getOS(userAgent: string): string {
    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac")) return "macOS";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("iOS")) return "iOS";
    return "Unknown";
  }

  private getBrowser(userAgent: string): string {
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown";
  }

  private getElementInfo(element: HTMLElement) {
    return {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      text: element.textContent?.slice(0, 100),
      href: (element as HTMLAnchorElement).href,
      type: (element as HTMLInputElement).type,
    };
  }

  private getFormInfo(form: HTMLFormElement) {
    return {
      name: form.name,
      id: form.id,
      method: form.method,
      action: form.action,
      fieldCount: form.elements.length,
    };
  }

  private getClickCoordinates(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split(".").pop()?.toLowerCase();
    return extension || "unknown";
  }

  private shouldSkipElement(element: HTMLElement): boolean {
    // Skip tracking for certain elements or classes
    const skipClasses = ["no-track", "analytics-ignore"];
    return skipClasses.some((cls) => element.classList.contains(cls));
  }

  private hasScrollMilestone(milestone: number): boolean {
    const key = `scroll_${this.sessionId}_${milestone}`;
    return sessionStorage.getItem(key) === "true";
  }

  private setScrollMilestone(milestone: number): void {
    const key = `scroll_${this.sessionId}_${milestone}`;
    sessionStorage.setItem(key, "true");
  }

  /**
   * Cleanup and stop tracking
   */
  destroy(): void {
    this.isTracking = false;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.flushEvents(true);
  }
}

// Create global instance
let analyticsTracker: ClientAnalyticsTracker;

export function initializeAnalytics(
  config?: Partial<TrackingConfig>,
): ClientAnalyticsTracker {
  if (!analyticsTracker) {
    analyticsTracker = new ClientAnalyticsTracker(config);
  }
  return analyticsTracker;
}

export function getAnalyticsTracker(): ClientAnalyticsTracker | null {
  return analyticsTracker || null;
}

export { analyticsTracker };
