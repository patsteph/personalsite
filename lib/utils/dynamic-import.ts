/**
 * Utility functions for dynamic imports and code splitting
 */
import dynamic from 'next/dynamic';
import React from 'react';

/**
 * Simple spinner component for loading states during dynamic imports
 */
export const DefaultLoadingComponent = () => {
  return React.createElement('div', { className: 'flex justify-center py-4' },
    React.createElement('div', { 
      className: 'h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent'
    })
  );
};

/**
 * Create a dynamically loaded component with Next.js
 * 
 * @example
 * // In your component file:
 * const DynamicChart = dynamicImport(() => import('@/components/Chart'));
 * 
 * // Then in your JSX:
 * <DynamicChart data={chartData} />
 */
type DynamicImportOptions = {
  ssr?: boolean;
};

export function dynamicImport<P>(importFunc: () => Promise<{ default: React.ComponentType<P> }>, options: DynamicImportOptions = {}) {
  const { ssr = true } = options;
  
  return dynamic(importFunc, {
    loading: DefaultLoadingComponent,
    ssr,
  });
}

// For cleaner API to match other utilities in the project
export const createDynamicComponent = dynamicImport;

export default dynamicImport;
