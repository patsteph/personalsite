/**
 * Performance Monitoring Utilities
 * Tracks Core Web Vitals and performance metrics
 */
import React from "react";

// Types for performance metrics
export interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: number;
}

export interface CoreWebVitals {
  CLS?: PerformanceMetric;
  FID?: PerformanceMetric;
  FCP?: PerformanceMetric;
  LCP?: PerformanceMetric;
  TTFB?: PerformanceMetric;
  INP?: PerformanceMetric;
}

// Thresholds for Core Web Vitals (based on Google's recommendations)
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

// Rating function
function getRating(
  value: number,
  thresholds: { good: number; poor: number },
): "good" | "needs-improvement" | "poor" {
  if (value <= thresholds.good) return "good";
  if (value <= thresholds.poor) return "needs-improvement";
  return "poor";
}

// Performance metrics collection
export class PerformanceMonitor {
  private metrics: CoreWebVitals = {};
  private isServer = typeof window === "undefined";

  constructor() {
    if (!this.isServer) {
      this.initializeWebVitals();
    }
  }

  private initializeWebVitals() {
    // Import web-vitals dynamically to avoid SSR issues
    import("web-vitals")
      .then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
        onCLS(this.onCLS.bind(this));
        onFCP(this.onFCP.bind(this));
        onLCP(this.onLCP.bind(this));
        onTTFB(this.onTTFB.bind(this));
        onINP(this.onINP.bind(this));
      })
      .catch((error) => {
        console.warn("Failed to load web-vitals:", error);
      });
  }

  private onCLS(metric: any) {
    this.metrics.CLS = {
      name: "CLS",
      value: metric.value,
      rating: getRating(metric.value, THRESHOLDS.CLS),
      timestamp: Date.now(),
    };
    this.reportMetric(this.metrics.CLS);
  }

  private onFID(metric: any) {
    this.metrics.FID = {
      name: "FID",
      value: metric.value,
      rating: getRating(metric.value, THRESHOLDS.FID),
      timestamp: Date.now(),
    };
    this.reportMetric(this.metrics.FID);
  }

  private onFCP(metric: any) {
    this.metrics.FCP = {
      name: "FCP",
      value: metric.value,
      rating: getRating(metric.value, THRESHOLDS.FCP),
      timestamp: Date.now(),
    };
    this.reportMetric(this.metrics.FCP);
  }

  private onLCP(metric: any) {
    this.metrics.LCP = {
      name: "LCP",
      value: metric.value,
      rating: getRating(metric.value, THRESHOLDS.LCP),
      timestamp: Date.now(),
    };
    this.reportMetric(this.metrics.LCP);
  }

  private onTTFB(metric: any) {
    this.metrics.TTFB = {
      name: "TTFB",
      value: metric.value,
      rating: getRating(metric.value, THRESHOLDS.TTFB),
      timestamp: Date.now(),
    };
    this.reportMetric(this.metrics.TTFB);
  }

  private onINP(metric: any) {
    this.metrics.INP = {
      name: "INP",
      value: metric.value,
      rating: getRating(metric.value, THRESHOLDS.INP),
      timestamp: Date.now(),
    };
    this.reportMetric(this.metrics.INP);
  }

  private reportMetric(metric: PerformanceMetric) {
    // In development, log to console
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Performance] ${metric.name}: ${metric.value}ms (${metric.rating})`,
      );
    }

    // Send to analytics service
    this.sendToAnalytics(metric);
  }

  private async sendToAnalytics(metric: PerformanceMetric) {
    try {
      // Send to your analytics endpoint
      await fetch("/api/analytics/performance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metric,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: metric.timestamp,
        }),
      });
    } catch (error) {
      // Fail silently in production
      if (process.env.NODE_ENV === "development") {
        console.warn("Failed to send performance metric:", error);
      }
    }
  }

  // Manual performance measurement
  public measureFunction<T>(name: string, fn: () => T): T {
    if (this.isServer) return fn();

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }

    return result;
  }

  // Async function measurement
  public async measureAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    if (this.isServer) return fn();

    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }

    return result;
  }

  // Get current metrics
  public getMetrics(): CoreWebVitals {
    return { ...this.metrics };
  }

  // Resource timing analysis
  public analyzeResourceTiming() {
    if (this.isServer) return;

    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];
    const analysis = {
      totalResources: resources.length,
      totalSize: 0,
      slowestResources: [] as any[],
      resourceTypes: {} as Record<string, number>,
    };

    resources.forEach((resource) => {
      // Calculate resource size (approximation)
      const size = resource.transferSize || resource.encodedBodySize || 0;
      analysis.totalSize += size;

      // Count by type
      const type = this.getResourceType(resource.name);
      analysis.resourceTypes[type] = (analysis.resourceTypes[type] || 0) + 1;

      // Track slow resources
      const duration = resource.responseEnd - resource.requestStart;
      if (duration > 500) {
        // Resources taking more than 500ms
        analysis.slowestResources.push({
          name: resource.name,
          duration: Math.round(duration),
          size: Math.round(size / 1024), // KB
          type,
        });
      }
    });

    // Sort slowest resources by duration
    analysis.slowestResources.sort((a, b) => b.duration - a.duration);

    if (process.env.NODE_ENV === "development") {
      console.log("[Performance] Resource Analysis:", analysis);
    }

    return analysis;
  }

  private getResourceType(url: string): string {
    if (url.includes(".js")) return "JavaScript";
    if (url.includes(".css")) return "CSS";
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return "Image";
    if (url.includes(".woff") || url.includes(".ttf")) return "Font";
    return "Other";
  }

  // Bundle size tracking
  public trackBundleSize() {
    if (this.isServer) return;

    // Get JavaScript bundle sizes
    const scripts = Array.from(
      document.querySelectorAll("script[src]"),
    ) as HTMLScriptElement[];
    const bundleInfo = scripts.map((script) => ({
      src: script.src,
      async: script.async,
      defer: script.defer,
    }));

    if (process.env.NODE_ENV === "development") {
      console.log("[Performance] Bundle Info:", bundleInfo);
    }

    return bundleInfo;
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = getPerformanceMonitor();

  return {
    measure: monitor.measureFunction.bind(monitor),
    measureAsync: monitor.measureAsyncFunction.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
    analyzeResources: monitor.analyzeResourceTiming.bind(monitor),
    trackBundles: monitor.trackBundleSize.bind(monitor),
  };
}

// Page performance tracking HOC
export function withPerformanceTracking<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentName?: string,
): React.ComponentType<T> {
  const displayName =
    componentName ||
    WrappedComponent.displayName ||
    WrappedComponent.name ||
    "Component";

  const PerformanceTrackedComponent = (props: T) => {
    const monitor = getPerformanceMonitor();

    React.useEffect(() => {
      const startTime = performance.now();

      return () => {
        const renderTime = performance.now() - startTime;
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Performance] ${displayName} total time: ${renderTime.toFixed(2)}ms`,
          );
        }
      };
    }, []);

    return React.createElement(WrappedComponent, props);
  };

  PerformanceTrackedComponent.displayName = `withPerformanceTracking(${displayName})`;

  return PerformanceTrackedComponent;
}

export default PerformanceMonitor;
