// lib/api/signals.ts
import { 
  collection, 
  getDocs, 
  query, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  Firestore 
} from 'firebase/firestore';
import { firestore } from '../firebase';
import { getCurrentUserToken } from './auth';

// API base URL
const API_BASE = '/api';

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
        const response = await fetch(`${API_BASE}/signals`, {
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
    
    // Client-side fallback
    if (!firestore) {
      console.warn('Firestore not initialized, returning empty signals array');
      return [];
    }
    
    const signalsRef = collection(firestore as Firestore, 'signals');
    const signalsQuery = query(signalsRef);
    const querySnapshot = await getDocs(signalsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Signal));
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
        const response = await fetch(`${API_BASE}/signals?type=${type}`, {
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
    
    // Client-side fallback
    const signals = await getAllSignals();
    return signals.filter(signal => signal.type === type);
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
        const response = await fetch(`${API_BASE}/signals`, {
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
    
    // Client-side fallback
    if (!firestore) {
      console.warn('Firestore not initialized, cannot add signal');
      return null;
    }
    
    const signalsRef = collection(firestore as Firestore, 'signals');
    const now = new Date().toISOString();
    const signalWithTimestamp = {
      ...signal,
      dateAdded: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(signalsRef, signalWithTimestamp);
    return { ...signalWithTimestamp, id: docRef.id };
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
        const response = await fetch(`${API_BASE}/signals`, {
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
        // Continue with fallback
      }
    }
    
    // Client-side fallback
    if (!firestore) {
      console.warn('Firestore not initialized, cannot update signal');
      return false;
    }
    
    const updatedSignal = {
      ...signal,
      updatedAt: new Date().toISOString()
    };
    
    const signalRef = doc(firestore as Firestore, 'signals', signal.id);
    await updateDoc(signalRef, updatedSignal);
    return true;
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
        const response = await fetch(`${API_BASE}/signals?id=${id}`, {
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
    
    // Client-side fallback
    if (!firestore) {
      console.warn('Firestore not initialized, cannot delete signal');
      return false;
    }
    
    const signalRef = doc(firestore as Firestore, 'signals', id);
    await deleteDoc(signalRef);
    return true;
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