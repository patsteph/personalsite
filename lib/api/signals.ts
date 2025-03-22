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
 * Get all signals with optional filtering
 */
export async function getAllSignals(options: {
  type?: 'newsletter' | 'article';
  featured?: boolean;
  limit?: number;
  tags?: string[];
} = {}): Promise<Signal[]> {
  try {
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
    const db = await getFirestoreInstance();
    if (!db) throw new Error('Firestore not initialized');

    const docRef = await addDoc(collection(db, SIGNALS_COLLECTION), {
      ...signal,
      dateAdded: new Date().toISOString()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating signal:', error);
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