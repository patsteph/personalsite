/**
 * API module index
 * 
 * This module exports all API functions from the auth, books, blog, and signals modules.
 * Also includes utility functions for API URL handling.
 */

// Re-export all functions from auth API
export * as auth from './auth';

// Re-export all functions from books API
export * as books from './books';

// Re-export all functions from blog API
export * as blog from './blog';

// Re-export all functions from signals API
export * as signals from './signals';

// Re-export server-auth for API routes
export * as serverAuth from './server-auth';

/**
 * Helper to get API URL - ensures we use relative URLs during development
 * and never hardcode production domains.
 */
export function getApiUrl(path: string): string {
  // Check if the URL contains our production domain and remove it
  if (typeof path === 'string' && path.includes('personalsite77.vercel.app')) {
    console.warn('Replacing hardcoded production domain in API URL:', path);
    try {
      const url = new URL(path);
      path = url.pathname + url.search + url.hash;
    } catch (e) {
      console.error('Failed to parse URL:', e);
    }
  }
  
  // Ensure path starts with /
  if (typeof path === 'string' && !path.startsWith('/') && !path.startsWith('http')) {
    path = '/' + path;
  }
  
  return path;
}

// Main API object for convenience
const api = {
  auth: require('./auth'),
  books: require('./books'),
  blog: require('./blog'),
  signals: require('./signals'),
  serverAuth: require('./server-auth'),
  getApiUrl
};

export default api;