/**
 * Type definitions index file
 * 
 * This file exports all types used in the application for convenient imports
 */

// Re-export blog types
export * from './blog';

// Re-export book types
export * from './book';

// Re-export CV types
export * from './cv';

// Re-export Signals types
export * from './signals';

// Re-export window types if they exist
try {
  // @ts-ignore - This may not exist
  export * from './window.d';
} catch (error) {
  // Ignore error
}

/**
 * Common types used across the application
 */

// Page routing types
export type RouteParams = {
  [key: string]: string;
};

// API Response types
export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};

// Theme type
export type Theme = 'light' | 'dark' | 'system';