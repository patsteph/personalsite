/**
 * Common API response interface that can be extended by specific endpoints
 */
export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

import { clientCookies, AUTH_COOKIE_NAME, FB_TOKEN_COOKIE_NAME } from './utils/cookies';
import { auth as firebaseAuth } from './firebase-client';

/**
 * Utility for making JSON API requests with proper error handling
 * Automatically adds authentication headers for admin API endpoints
 */
export async function fetchJson<T extends ApiResponse>(url: string, options?: RequestInit): Promise<T> {
  try {
    // Check if this is an admin API request that needs auth
    const isAdminRequest = url.includes('/api/admin/');
    
    // Prepare headers with authentication if needed
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    };
    
    // For admin endpoints, ensure we have authentication
    if (isAdminRequest) {
      // Add auth token if available
      const authToken = await getAuthToken();
      if (authToken) {
        // Use type assertion to handle the Authorization header
        (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
        console.log('Added authentication token to request');
      } else {
        console.warn('No auth token available for admin API request');
      }
    }
    
    const response = await fetch(url, {
      // Always include credentials to ensure cookies are sent with request
      credentials: 'include',
      headers,
      ...options
    });
    
    // Parse the JSON response
    const data = await response.json();
    
    // Handle API errors (non-2xx responses)
    if (!response.ok) {
      const error = new Error(data.error || response.statusText);
      (error as any).status = response.status;
      (error as any).data = data;
      throw error;
    }
    
    return data as T;
  } catch (error) {
    console.error('Error in fetchJson:', error);
    throw error;
  }
}

/**
 * Get the current Firebase auth token
 * This helper function ensures we always have a fresh token
 */
async function getAuthToken(): Promise<string | null> {
  try {
    // Check if we have Firebase auth
    if (!firebaseAuth || !firebaseAuth.currentUser) {
      return null;
    }
    
    // Get a fresh token
    const token = await firebaseAuth.currentUser.getIdToken(true);
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}
