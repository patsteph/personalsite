/**
 * API module index
 * 
 * This module exports all client-side API functions.
 * Server-side modules should be imported directly, not through this index.
 */

import * as auth from './auth';
import * as books from './books';
import * as blog from './blog';
import * as signals from './signals';

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

// Main API object for convenience (only include client-side modules)
const api = {
  auth,
  books,
  blog,
  signals,
  getApiUrl
};

export default api;