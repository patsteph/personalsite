// lib/api/signals.ts

// Determine API base URL based on environment
const API_BASE = typeof window === 'undefined' 
  ? process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' // Server-side needs full URL
  : ''; // Client-side uses relative paths

const SIGNALS_API_URL = `${API_BASE}/api/signals`;

// Helper to sanitize incoming API data (convert undefined to null)
export function sanitizeData(body: any): Record<string, any> {
  if (!body || typeof body !== 'object') return {};
  return Object.entries(body).reduce((acc, [key, value]) => {
    acc[key] = value === undefined ? null : value;
    return acc;
  }, {} as Record<string, any>);
}

// API Client Functions (Client-Side Safe)
// ---------------------------------------

// Function to fetch all signals
export async function getAllSignals(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE}/api/signals`);

    if (!response.ok) {
      console.error(`getAllSignals: API responded with status ${response.status}`);
      return []; // Return empty array if response not OK
    }

    const data = await response.json();
    return data.success ? data.data : []; // Return data if API success, else empty array

  } catch (error) {
    console.error('Error getting signals (network, parsing, etc.):', error);
    return []; // Return empty array on any exception
  }
}

// Function to fetch signals by type
export async function getSignalsByType(type: string): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE}/api/signals?type=${type}`);

    if (!response.ok) {
      console.error(`getSignalsByType (${type}): API responded with status ${response.status}`);
      return []; // Return empty array if response not OK
    }

    const data = await response.json();
    return data.success ? data.data : []; // Return data if API success, else empty array

  } catch (error) {
    console.error(`Error getting signals by type ${type} (network, parsing, etc.):`, error);
    return []; // Return empty array on any exception
  }
}

// Function to add a new signal
export async function addSignal(signalData: Record<string, any>): Promise<any | null> {
  try {
    // Single try block for fetch and processing
    const response = await fetch(`${SIGNALS_API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signalData)
    });

    if (!response.ok) {
      // Handle non-OK responses (e.g., 4xx, 5xx)
      console.error(`addSignal: API responded with status ${response.status}`);
      // Attempt to read error body for more context, but don't fail if it doesn't parse
      try { 
        const errorData = await response.json();
        console.error('addSignal: API error response body:', errorData);
      } catch { 
        // Ignore error if response body isn't valid JSON
      }
      return null; // Return null if response not OK
    }

    // Response is OK, parse JSON body
    const data = await response.json();
    return data.success ? data.data : null; // Return data if API reported success, else null

  } catch (error) { // Catches errors from fetch() or response.json()
    console.error('Error adding signal (network, parsing, etc.):', error);
    return null; // Return null on any exception during the process
  }
}

// Function to update an existing signal
export async function updateSignal(signal: Record<string, any>): Promise<boolean> {
  if (!signal.id) return false;
  
  try {
    const response = await fetch(`${SIGNALS_API_URL}`, { // Assuming PUT endpoint is /api/signals
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signal)
    });

    if (!response.ok) {
      console.error(`updateSignal (${signal.id}): API responded with status ${response.status}`);
      // Attempt to read error body
      try { 
        const errorData = await response.json();
        console.error('updateSignal: API error response body:', errorData);
      } catch { }
      return false; // Return false if response not OK
    }

    // Check response body for success if applicable, otherwise assume OK status means success
    // const data = await response.json(); 
    // return data.success; 
    return true; // Return true if response is OK

  } catch (error) {
    console.error(`Error updating signal ${signal.id} (network, parsing, etc.):`, error);
    return false; // Return false on any exception
  }
}

// Function to delete a signal
export async function deleteSignal(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${SIGNALS_API_URL}?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      console.error(`deleteSignal (${id}): API responded with status ${response.status}`);
      // Attempt to read error body
      try { 
        const errorData = await response.json();
        console.error('deleteSignal: API error response body:', errorData);
      } catch { }
      return false; // Return false if response not OK
    }

    // Check response body for success if applicable, otherwise assume OK status means success
    // const data = await response.json(); 
    // return data.success;
    return true; // Return true if response is OK

  } catch (error) {
    console.error(`Error deleting signal ${id} (network, parsing, etc.):`, error);
    return false; // Return false on any exception
  }
}

// Get all newsletters
export async function getAllNewsletters(options: {
  featured?: boolean;
  limit?: number;
} = {}): Promise<any[]> {
  const signals = await getAllSignals();
  let newsletters = signals.filter(s => s.type === 'newsletter');
  
  if (options.featured !== undefined) {
    newsletters = newsletters.filter(n => n.featured === options.featured);
  }
  
  if (options.limit && options.limit > 0) {
    newsletters = newsletters.slice(0, options.limit);
  }
  
  return newsletters;
}

// Get all articles
export async function getAllArticles(options: {
  featured?: boolean;
  limit?: number;
} = {}): Promise<any[]> {
  const signals = await getAllSignals();
  let articles = signals.filter(s => s.type === 'article');
  
  if (options.featured !== undefined) {
    articles = articles.filter(a => a.featured === options.featured);
  }
  
  if (options.limit && options.limit > 0) {
    articles = articles.slice(0, options.limit);
  }
  
  return articles;
}