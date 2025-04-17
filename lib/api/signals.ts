// lib/api/signals.ts


import { getCurrentUserToken } from './auth';

// Determine API base URL based on environment
const API_BASE = typeof window === 'undefined' 
  ? process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' // Server-side needs full URL
  : ''; // Client-side uses relative path starting with /api

// Signal types
export type SignalType = 'newsletter' | 'article';

// Signal interface
export interface Signal {
  id?: string;
  type: SignalType;
  title: string;
  description: string;
  url: string;
  source: string;
  author?: string;
  dateAdded?: string;
  featured?: boolean;
  tags?: string[];
  imageUrl?: string;
  socialShare?: {
    linkedin?: boolean;
    twitter?: boolean;
    bluesky?: boolean;
  };
}

// Newsletter interface
export interface Newsletter extends Signal {
  type: 'newsletter';
  issueNumber?: string;
  frequency?: string;
}

// Article interface
export interface Article extends Signal {
  type: 'article';
  publicationName?: string;
  readingTime?: number;
}

// Get all signals
export async function getAllSignals(): Promise<Signal[]> {
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

// Get signals by type
export async function getSignalsByType(type: SignalType): Promise<Signal[]> {
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

// Add a new signal
export async function addSignal(signal: Signal): Promise<Signal | null> {
  try {
    // Try server API first
    const token = await getCurrentUserToken();
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/api/signals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(signal)
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

// Update a signal
export async function updateSignal(signal: Signal): Promise<boolean> {
  if (!signal.id) return false;
  
  try {
    // Try server API first
    const token = await getCurrentUserToken();
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/api/signals`, {
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

// Delete a signal
export async function deleteSignal(id: string): Promise<boolean> {
  try {
    // Try server API first
    const token = await getCurrentUserToken();
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/api/signals?id=${id}`, {
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
    }
    
    // No client-side fallback. All signal deletions must go through the server API.
    return false;

  } catch (error) {
    console.error('Error deleting signal:', error);
    return false;
  }
}

/**
 * Get all newsletters
 */
export async function getAllNewsletters(options: {
  featured?: boolean;
  limit?: number;
} = {}): Promise<Newsletter[]> {
  const signals = await getAllSignals();
  let newsletters = signals.filter(s => s.type === 'newsletter') as Newsletter[];
  
  if (options.featured !== undefined) {
    newsletters = newsletters.filter(n => n.featured === options.featured);
  }
  
  if (options.limit && options.limit > 0) {
    newsletters = newsletters.slice(0, options.limit);
  }
  
  return newsletters;
}

/**
 * Get all articles
 */
export async function getAllArticles(options: {
  featured?: boolean;
  limit?: number;
} = {}): Promise<Article[]> {
  const signals = await getAllSignals();
  let articles = signals.filter(s => s.type === 'article') as Article[];
  
  if (options.featured !== undefined) {
    articles = articles.filter(a => a.featured === options.featured);
  }
  
  if (options.limit && options.limit > 0) {
    articles = articles.slice(0, options.limit);
  }
  
  return articles;
}