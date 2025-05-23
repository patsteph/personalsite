/**
 * Bundle optimization - Lightweight performance improvements
 * Only loads heavy optimization libraries when needed
 */

import React from "react";

// Conditional imports - only load when actually needed
const loadOptimizationLibraries = async () => {
  // Only import heavy libraries in production and when specifically requested
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_ADVANCED_OPTIMIZATION === "true"
  ) {
    const { performanceOptimizer } = await import(
      "../optimization/performance-optimizer"
    );
    const { autoMaintenance } = await import("../maintenance/auto-maintenance");
    const { operationalIntelligence } = await import(
      "../intelligence/operational-intelligence"
    );

    return { performanceOptimizer, autoMaintenance, operationalIntelligence };
  }
  return null;
};

// Lightweight performance utilities that are always available
export const lightweightOptimizations = {
  // Simple memoization
  memoize: <T extends (...args: any[]) => any>(fn: T): T => {
    const cache = new Map();
    return ((...args: any[]) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) return cache.get(key);
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  // Debounce for performance
  debounce: <T extends (...args: any[]) => any>(fn: T, delay: number): T => {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
  },

  // Lazy component loading
  lazyLoad: (importFn: () => Promise<any>) => {
    return React.lazy(importFn);
  },

  // Simple performance measurement
  measure: async <T>(name: string, fn: () => Promise<T> | T): Promise<T> => {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    if (duration > 100) {
      // Only log slow operations
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    }

    return result;
  },
};

// Only enable advanced features when explicitly configured
export const getOptimizationFeatures = async () => {
  // Check if user wants advanced features
  if (typeof window !== "undefined") {
    const enableAdvanced =
      localStorage.getItem("enableAdvancedOptimization") === "true";
    if (enableAdvanced) {
      return await loadOptimizationLibraries();
    }
  }

  return null;
};

// Simple React hook for basic optimizations
export const usePerformanceOptimization = () => {
  const [advancedFeatures, setAdvancedFeatures] = React.useState<any>(null);

  React.useEffect(() => {
    // Only load if user explicitly enables
    const checkForAdvancedFeatures = async () => {
      const features = await getOptimizationFeatures();
      if (features) {
        setAdvancedFeatures(features);
      }
    };

    checkForAdvancedFeatures();
  }, []);

  return {
    ...lightweightOptimizations,
    advanced: advancedFeatures,
  };
};

// Export only lightweight optimizations by default
export default lightweightOptimizations;
