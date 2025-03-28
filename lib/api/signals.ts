// lib/api/signals.ts
import { collection, getDocs, query, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { getCurrentUserToken } from '@/lib/auth';

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
    const signalsRef = collection(firestore, 'signals');
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
    const signalsRef = collection(firestore, 'signals');
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
    const updatedSignal = {
      ...signal,
      updatedAt: new Date().toISOString()
    };
    
    const signalRef = doc(firestore, 'signals', signal.id);
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
    const signalRef = doc(firestore, 'signals', id);
    await deleteDoc(signalRef);
    return true;
  } catch (error) {
    console.error('Error deleting signal:', error);
    return false;
  }
}