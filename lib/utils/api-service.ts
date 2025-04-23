/**
 * API Service Utility
 * 
 * Provides standardized methods for API interactions with consistent 
 * error handling, authentication, and response formatting.
 */
import { auth } from '../firebase-client';
import { FirebaseError } from 'firebase/app';
import { getIdToken } from 'firebase/auth';

// Standard API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Error handler for standardized error responses
 * @param error Any error thrown by API calls
 * @returns Standardized API error response
 */
export function handleApiError(error: unknown): ApiResponse {
  console.error('API Error:', error);
  
  // Handle Firebase errors
  if ((error as FirebaseError).code) {
    const fbError = error as FirebaseError;
    return {
      success: false,
      error: {
        code: fbError.code,
        message: fbError.message,
        details: fbError
      }
    };
  }
  
  // Handle network errors
  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: 'api/unknown-error',
        message: error.message,
        details: error
      }
    };
  }
  
  // Fallback for unknown error types
  return {
    success: false,
    error: {
      code: 'api/unknown-error',
      message: 'An unknown error occurred',
      details: error
    }
  };
}

/**
 * Get authentication token for API requests
 * @param forceRefresh Whether to force a token refresh
 * @returns Promise resolving to token or null if not authenticated
 */
export async function getAuthToken(forceRefresh = false): Promise<string | null> {
  if (!auth?.currentUser) return null;
  
  try {
    return await auth.currentUser.getIdToken(forceRefresh);
  } catch (error) {
    console.warn('Failed to get auth token:', error);
    return null;
  }
}

/**
 * Build request headers with optional authentication
 * @param includeAuth Whether to include auth token in headers
 * @returns Promise resolving to headers object
 */
export async function buildHeaders(includeAuth = true): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (includeAuth) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

/**
 * Get API base URL based on environment
 * @returns Base URL for API requests
 */
export function getApiBaseUrl(): string {
  return typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' // Server-side needs full URL
    : ''; // Client-side uses relative path
}

/**
 * Make authenticated API request with standardized error handling
 * @param endpoint API endpoint path (e.g., '/api/books')
 * @param options Fetch options
 * @returns Promise resolving to typed API response
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: {
          code: `api/${response.status}`,
          message: data.message || `API error: ${response.statusText}`,
          details: data
        }
      };
    }
    
    return {
      success: true,
      data: data.data || data
    };
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Helper for GET requests
 * @param endpoint API endpoint
 * @param authenticated Whether to include auth token
 * @returns Promise resolving to typed API response
 */
export async function apiGet<T = any>(
  endpoint: string,
  authenticated = true
): Promise<ApiResponse<T>> {
  const headers = await buildHeaders(authenticated);
  
  return apiRequest<T>(endpoint, {
    method: 'GET',
    headers
  });
}

/**
 * Helper for POST requests
 * @param endpoint API endpoint
 * @param data Request payload
 * @param authenticated Whether to include auth token
 * @returns Promise resolving to typed API response
 */
export async function apiPost<T = any, D = any>(
  endpoint: string,
  data: D,
  authenticated = true
): Promise<ApiResponse<T>> {
  const headers = await buildHeaders(authenticated);
  
  return apiRequest<T>(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
}

/**
 * Helper for PUT requests
 * @param endpoint API endpoint
 * @param data Request payload
 * @param authenticated Whether to include auth token
 * @returns Promise resolving to typed API response
 */
export async function apiPut<T = any, D = any>(
  endpoint: string,
  data: D,
  authenticated = true
): Promise<ApiResponse<T>> {
  const headers = await buildHeaders(authenticated);
  
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data)
  });
}

/**
 * Helper for DELETE requests
 * @param endpoint API endpoint
 * @param authenticated Whether to include auth token
 * @returns Promise resolving to typed API response
 */
export async function apiDelete<T = any>(
  endpoint: string,
  authenticated = true
): Promise<ApiResponse<T>> {
  const headers = await buildHeaders(authenticated);
  
  return apiRequest<T>(endpoint, {
    method: 'DELETE',
    headers
  });
}
