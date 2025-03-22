/**
 * API module index
 * 
 * This module exports all API functions from the auth, books, blog, and signals modules.
 */

// Re-export all functions from auth API
export * as auth from './auth';

// Re-export all functions from books API
export * as books from './books';

// Re-export all functions from blog API
export * as blog from './blog';

// Re-export all functions from signals API
export * as signals from './signals';

// Main API object for convenience
const api = {
  auth: require('./auth'),
  books: require('./books'),
  blog: require('./blog'),
  signals: require('./signals')
};

export default api;