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
    
    // Determine base URL based on environment
    const baseUrl = typeof window === 'undefined' 
      ? process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000' // Server-side needs full URL
      : API_BASE; // Client-side uses relative path
      
    if (token) {
      try {
        const response = await fetch(`${baseUrl}/signals`, {
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
    
    // Clean up the signal object by removing undefined values
    // Firestore accepts null but not undefined
    const cleanedSignal: Record<string, any> = {};
    
    // Process all properties to replace undefined with null
    Object.entries(signal).forEach(([key, value]) => {
      cleanedSignal[key] = value === undefined ? null : value;
    });
    
    // Ensure minimum required fields
    if (!cleanedSignal.type) cleanedSignal.type = signal.type;
    if (!cleanedSignal.title) cleanedSignal.title = '';
    if (!cleanedSignal.description) cleanedSignal.description = '';
    if (!cleanedSignal.url) cleanedSignal.url = '';
    if (!cleanedSignal.source) cleanedSignal.source = '';
    
    // Add timestamp fields
    const signalWithTimestamp = {
      ...cleanedSignal,
      dateAdded: now,
      updatedAt: now
    } as Record<string, any>;
    
    console.log('Adding signal to Firestore with cleaned data:', signalWithTimestamp);
    
    // Validate required fields specifically for null or undefined
    const requiredFields = ['type', 'title', 'description', 'url', 'source'];
    for (const field of requiredFields) {
      if (signalWithTimestamp[field] === null || signalWithTimestamp[field] === undefined) {
        console.error(`Missing or invalid required field ${field} in signal data`);
        return null;
      }
    }
    
    const docRef = await addDoc(signalsRef, signalWithTimestamp);
    
    // Create a properly typed Signal object with all fields
    const returnSignal: Signal = {
      id: docRef.id,
      type: signalWithTimestamp.type as SignalType,
      title: signalWithTimestamp.title as string,
      description: signalWithTimestamp.description as string,
      url: signalWithTimestamp.url as string,
      source: signalWithTimestamp.source as string,
      // Include optional fields if present
      ...(signalWithTimestamp.author !== undefined && { author: signalWithTimestamp.author as string }),
      dateAdded: signalWithTimestamp.dateAdded as string,
      ...(signalWithTimestamp.featured !== undefined && { featured: signalWithTimestamp.featured as boolean }),
      ...(signalWithTimestamp.tags !== undefined && { tags: signalWithTimestamp.tags as string[] }),
      ...(signalWithTimestamp.imageUrl !== undefined && { imageUrl: signalWithTimestamp.imageUrl as string }),
      ...(signalWithTimestamp.socialShare !== undefined && { socialShare: signalWithTimestamp.socialShare as Signal['socialShare'] })
    };
    
    return returnSignal;
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
    
    // Clean up the signal object by removing undefined values
    // Firestore accepts null but not undefined
    const cleanedSignal: Record<string, any> = {};
    
    // Process all properties to replace undefined with null
    Object.entries(signal).forEach(([key, value]) => {
      if (key !== 'id') { // Skip the id field
        cleanedSignal[key] = value === undefined ? null : value;
      }
    });
    
    const updatedSignal = {
      ...cleanedSignal,
      updatedAt: new Date().toISOString()
    };
    
    console.log('Updating signal in Firestore with cleaned data:', updatedSignal);
    
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