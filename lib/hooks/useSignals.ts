import { useState, useEffect, useCallback } from 'react';
import { Signal, Newsletter, Article } from '@/types/signals';
import { collection, query, where, orderBy, limit, getDocs, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { handleApiError } from '@/lib/utils/error-handler';

export const SIGNALS_PER_PAGE = 9;

type UseSignalsProps = {
  initialSignals?: Signal[];
  type?: 'article' | 'newsletter' | 'all';
  tag?: string;
  featured?: boolean;
};

type UseSignalsResult = {
  signals: Signal[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  error: Error | null;
};

/**
 * Custom hook for fetching and managing signals data with pagination and filtering
 */
export function useSignals({
  initialSignals = [],
  type = 'all',
  tag,
  featured,
}: UseSignalsProps): UseSignalsResult {
  const [signals, setSignals] = useState<Signal[]>(initialSignals);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);

  // Reset data when filters change
  useEffect(() => {
    setSignals(initialSignals);
    setLastVisible(null);
    setHasMore(true);
    setError(null);
    
    // If no initial signals provided, load first page
    if (initialSignals.length === 0) {
      loadMore(true);
    }
  }, [type, tag, featured]);

  // Convert Firestore timestamp to ISO string
  const formatTimestamp = (timestamp: any): string | undefined => {
    if (!timestamp) return undefined;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    if (typeof timestamp === 'string') {
      return timestamp;
    }
    return undefined;
  };

  // Convert Firestore document to Signal object
  const convertDocToSignal = (doc: any): Signal => {
    const data = doc.data();
    const isNewsletter = data.type === 'newsletter';
    
    // Create base signal properties present in both types
    const baseSignal = {
      id: doc.id,
      title: data.title || 'Untitled',
      url: data.url || '',
      description: data.description || '',
      imageUrl: data.imageUrl,  // Optional field
      tags: data.tags || [],
      featured: !!data.featured,
      dateAdded: formatTimestamp(data.dateAdded) || new Date().toISOString(), // Default to now if missing
    };
    
    // Return either Newsletter or Article based on type
    if (isNewsletter) {
      return {
        ...baseSignal,
        type: 'newsletter' as const,
        frequency: (data.frequency || 'monthly') as Newsletter['frequency'],
        publisher: data.publisher || 'Unknown Publisher',
        subscriptionUrl: data.subscriptionUrl || data.url || '',
        sampleUrl: data.sampleUrl,
        affiliateCode: data.affiliateCode,
      };
    } else {
      return {
        ...baseSignal,
        type: 'article' as const,
        author: data.author || 'Unknown Author',
        source: data.source || 'Unknown Source',
        publishDate: formatTimestamp(data.publishDate || data.datePublished) || baseSignal.dateAdded,
        readingTime: data.readingTime,
        affiliateCode: data.affiliateCode,
      };
    }
  };

  // Load more signals with current filters
  const loadMore = useCallback(async (isReset = false) => {
    if (loading && !isReset) return;
    
    setLoading(true);

    try {
      if (!db) {
        throw new Error('Firestore client not initialized');
      }

      const signalsRef = collection(db, 'signals');
      
      // Build query with filters
      const constraints: any[] = [];
      
      // Type filter
      if (type !== 'all') {
        constraints.push(where('type', '==', type));
      }
      
      // Tag filter
      if (tag) {
        constraints.push(where('tags', 'array-contains', tag));
      }
      
      // Featured filter
      if (featured) {
        constraints.push(where('featured', '==', true));
      }
      
      // Add sorting
      constraints.push(orderBy('dateAdded', 'desc'));
      
      // Add cursor for pagination if not reset
      if (lastVisible && !isReset) {
        constraints.push(startAfter(lastVisible));
      }
      
      // Add limit
      constraints.push(limit(SIGNALS_PER_PAGE));
      
      // Execute query
      const signalsQuery = query(signalsRef, ...constraints);
      const [snapshot, error] = await handleApiError(getDocs(signalsQuery), 'useSignals.loadMore');
      
      if (error || !snapshot) {
        setError(new Error(error?.message || 'Failed to load signals'));
        return;
      }
      
      // Process results
      const newSignals = snapshot.docs.map(convertDocToSignal);
      
      // Update last visible for pagination
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(lastDoc || null);
      
      // Update signals state
      setSignals(prevSignals => isReset ? newSignals : [...prevSignals, ...newSignals]);
      
      // Update hasMore flag
      setHasMore(newSignals.length === SIGNALS_PER_PAGE);
      
    } catch (err) {
      console.error('Error in useSignals:', err);
      setError(err instanceof Error ? err : new Error('Failed to load signals'));
    } finally {
      setLoading(false);
    }
  }, [loading, lastVisible, type, tag, featured]);

  return {
    signals,
    loading,
    hasMore,
    loadMore,
    error,
  };
}

export default useSignals;
