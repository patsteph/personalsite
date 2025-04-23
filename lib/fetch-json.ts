/**
 * Utility for making JSON API requests with proper error handling
 */
export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
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
    
    return data;
  } catch (error) {
    console.error('Error in fetchJson:', error);
    throw error;
  }
}
