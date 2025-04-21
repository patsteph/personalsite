// lib/api/signals.ts

import { getCurrentUserToken } from './auth';

console.log('--- lib/api/signals.ts: Module evaluation starting ---');

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
    // Try server API first
    const token = await getCurrentUserToken();
    
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/api/signals`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.success ? data.data : [];
        }
      } catch (error) {
        console.error('Server API error:', error);
        // Continue with fallback
      }
    }
    
    // No client-side fallback. All signal fetching must go through the server API.
    return [];

  } catch (error) {
    console.error('Error getting signals:', error);
    return [];
  }
}

// Function to fetch signals by type
export async function getSignalsByType(type: string): Promise<any[]> {
  try {
    // Try server API first
    const token = await getCurrentUserToken();
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/api/signals?type=${type}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.success ? data.data : [];
        }
      } catch (error) {
        console.error('Server API error:', error);
        // Continue with fallback
      }
    }
    
    // No client-side fallback. All signal fetching must go through the server API.
    return [];

  } catch (error) {
    console.error(`Error getting signals by type ${type}:`, error);
    return [];
  }
}

// Function to add a new signal
export async function addSignal(signalData: Record<string, any>): Promise<any | null> {
  console.log('addSignal: Sending data to API:', signalData);
  try {
    const token = await getCurrentUserToken();
    if (token) {
      try {
        const response = await fetch(`${SIGNALS_API_URL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(signalData)
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.success ? data.data : null;
        }
      } catch (error) {
        console.error('Server API error:', error);
        // Continue with fallback
      }
    }
    
    // No client-side fallback. All signal creation must go through the server API.
    return null;

  } catch (error) {
    console.error('Error adding signal:', error);
    return null;
  }
}

// Function to update an existing signal
export async function updateSignal(signal: Record<string, any>): Promise<boolean> {
  if (!signal.id) return false;
  
  try {
    // Try server API first
    const token = await getCurrentUserToken();
    if (token) {
      try {
        const response = await fetch(`${SIGNALS_API_URL}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(signal)
        });
        
        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.error('Server API error:', error);
        return false;
      }
    }
    
    return false;

  } catch (error) {
    console.error('Error updating signal:', error);
    return false;
  }
}

// Function to delete a signal
export async function deleteSignal(id: string): Promise<boolean> {
  console.log(`deleteSignal: Requesting deletion for ID ${id} from API`);
  try {
    const token = await getCurrentUserToken();
    if (!token) {
      return false;
    }
    
    try {
      const response = await fetch(`${SIGNALS_API_URL}?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        return true;
      }
    } catch (error) {
      console.error('Server API error:', error);
      // Continue with fallback
    }
    
    // No client-side fallback. All signal deletions must go through the server API.
    return false;

  } catch (error) {
    console.error('Error deleting signal:', error);
    return false;
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