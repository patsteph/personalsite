/**
 * Common API response interface that can be extended by specific endpoints
 */
export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Utility for making JSON API requests with proper error handling
 */
export async function fetchJson<T extends ApiResponse>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      },
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
