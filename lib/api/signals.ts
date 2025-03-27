/**
 * Signals API functions
 */
import { getFirestoreInstance } from '../firebase';
import { Signal, Newsletter, Article } from '@/types';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

// Collection references
const SIGNALS_COLLECTION = 'signals';

/**
 * Get all signals with optional filtering - now with content-items endpoint fallback
 */
export async function getAllSignals(options: {
  type?: 'newsletter' | 'article';
  featured?: boolean;
  limit?: number;
  tags?: string[];
} = {}): Promise<Signal[]> {
  try {
    // First try the client-side fetch to content-items if we're in the browser
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/content-items');
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          let signals = data.data || [];
          
          // Apply filters client-side
          if (options.type) {
            signals = signals.filter((signal: Signal) => signal.type === options.type);
          }
          
          if (options.featured !== undefined) {
            signals = signals.filter((signal: Signal) => signal.featured === options.featured);
          }
          
          if (options.tags && options.tags.length > 0) {
            signals = signals.filter((signal: Signal) => 
              signal.tags && options.tags?.some(tag => signal.tags.includes(tag))
            );
          }
          
          // Sort by dateAdded
          signals = signals.sort((a: Signal, b: Signal) => 
            new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
          );
          
          // Apply limit
          if (options.limit) {
            signals = signals.slice(0, options.limit);
          }
          
          return signals;
        }
      } catch (fetchError) {
        console.error('Error fetching from content-items endpoint:', fetchError);
        // Fall through to the server-side implementation
      }
    }

    // Server-side implementation
    const db = await getFirestoreInstance();
    if (!db) throw new Error('Firestore not initialized');

    let q = collection(db, SIGNALS_COLLECTION);
    
    // Create the query with filters
    const constraints = [];
    
    if (options.type) {
      constraints.push(where('type', '==', options.type));
    }

    if (options.featured !== undefined) {
      constraints.push(where('featured', '==', options.featured));
    }

    if (options.tags && options.tags.length > 0) {
      // For simplicity, just filter on the first tag
      // More complex tag filtering would require multiple queries
      constraints.push(where('tags', 'array-contains', options.tags[0]));
    }

    // Always order by dateAdded descending (newest first)
    constraints.push(orderBy('dateAdded', 'desc'));
    
    if (options.limit) {
      constraints.push(limit(options.limit));
    }

    const querySnapshot = await getDocs(query(q, ...constraints));
    
    const signals: Signal[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      signals.push({
        id: doc.id,
        ...data,
        dateAdded: data.dateAdded?.toDate?.() 
          ? data.dateAdded.toDate().toISOString() 
          : data.dateAdded
      } as Signal);
    });

    return signals;
  } catch (error) {
    console.error('Error getting signals:', error);
    return [];
  }
}

/**
 * Get a signal by ID
 */
export async function getSignalById(id: string): Promise<Signal | null> {
  try {
    const db = await getFirestoreInstance();
    if (!db) throw new Error('Firestore not initialized');

    const docRef = doc(db, SIGNALS_COLLECTION, id);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        dateAdded: data.dateAdded?.toDate?.() 
          ? data.dateAdded.toDate().toISOString() 
          : data.dateAdded
      } as Signal;
    }

    return null;
  } catch (error) {
    console.error('Error getting signal by ID:', error);
    return null;
  }
}

/**
 * Create a new signal (either newsletter or article)
 */
export async function createSignal(signal: Omit<Signal, 'id'>): Promise<string | null> {
  try {
    console.log('Creating new signal with data:', JSON.stringify(signal));
    
    const db = await getFirestoreInstance();
    if (!db) {
      console.error('Firestore not initialized in createSignal');
      throw new Error('Firestore not initialized');
    }

    // Prepare data for Firestore
    const signalData = {
      ...signal,
      dateAdded: new Date().toISOString()
    };
    
    console.log('Adding document to collection:', SIGNALS_COLLECTION);
    const docRef = await addDoc(collection(db, SIGNALS_COLLECTION), signalData);
    console.log('Signal created with ID:', docRef.id);

    return docRef.id;
  } catch (error) {
    console.error('Error creating signal:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
}

/**
 * Update an existing signal
 */
export async function updateSignal(id: string, signal: Partial<Signal>): Promise<boolean> {
  try {
    const db = await getFirestoreInstance();
    if (!db) throw new Error('Firestore not initialized');

    const docRef = doc(db, SIGNALS_COLLECTION, id);
    await updateDoc(docRef, signal);

    return true;
  } catch (error) {
    console.error('Error updating signal:', error);
    return false;
  }
}

/**
 * Delete a signal
 */
export async function deleteSignal(id: string): Promise<boolean> {
  try {
    const db = await getFirestoreInstance();
    if (!db) throw new Error('Firestore not initialized');

    const docRef = doc(db, SIGNALS_COLLECTION, id);
    await deleteDoc(docRef);

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
  const signals = await getAllSignals({
    type: 'newsletter',
    featured: options.featured,
    limit: options.limit
  });
  return signals as Newsletter[];
}

/**
 * Get all articles
 */
export async function getAllArticles(options: {
  featured?: boolean;
  limit?: number;
} = {}): Promise<Article[]> {
  const signals = await getAllSignals({
    type: 'article',
    featured: options.featured,
    limit: options.limit
  });
  return signals as Article[];
}