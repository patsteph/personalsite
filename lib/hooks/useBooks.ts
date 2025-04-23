import { useState, useEffect, useCallback } from 'react';
import { Book } from '@/types/book';
import { getFirestore, collection, query, orderBy, startAfter, limit, getDocs, DocumentSnapshot, DocumentData, Timestamp, where, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

export const BOOKS_PER_PAGE = 24;

type UseBooksProps = {
  initialBooks: Book[];
  totalBooks: number;
  statusFilter: string;
  ratingFilter: number | '';
  genreFilter: string;
};

type UseBooksResult = {
  books: Book[];
  loading: boolean;
  hasMore: boolean;
  lastVisible: DocumentSnapshot<DocumentData> | null;
  loadMoreBooks: (isFilterReset?: boolean) => Promise<void>;
};

/**
 * Custom hook for fetching and managing books data with pagination and filtering
 */
export function useBooks({
  initialBooks,
  totalBooks: initialTotalBooks,
  statusFilter,
  ratingFilter,
  genreFilter,
}: UseBooksProps): UseBooksResult {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(initialBooks.length < initialTotalBooks && initialBooks.length > 0);

  // Reset and load books when filters change
  useEffect(() => {
    console.log('Filters changed:', { statusFilter, ratingFilter, genreFilter });
    // Reset state when filters change to trigger a fresh load
    setBooks([]); 
    setLastVisible(null);
    setHasMore(true);
    setLoading(true);
    // Immediately call loadMoreBooks to fetch the first page with new filters
    loadMoreBooks(true);
  }, [statusFilter, ratingFilter, genreFilter]);

  // Convert Firestore document to Book object
  const convertDocToBook = (doc: DocumentSnapshot<DocumentData>): Book => {
    const data = doc.data();
    if (!data) {
      throw new Error(`No data found for book document with ID: ${doc.id}`);
    }

    return {
      id: doc.id,
      title: data.title || 'Untitled',
      authors: data.authors || [],
      googleBooksId: data.googleBooksId || null,
      status: data.status || 'To Read',
      dateAdded: data.dateAdded instanceof Timestamp ? data.dateAdded.toDate().toISOString() : null,
      lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate().toISOString() : null,
      isbn: data.isbn || null,
      publishedDate: data.publishedDate || null,
      description: data.description || null,
      pageCount: data.pageCount || null,
      imageLinks: {
        smallThumbnail: data.imageLinks?.smallThumbnail || data.thumbnailUrl || null,
        thumbnail: data.imageLinks?.thumbnail || data.thumbnailUrl || null,
      },
      // Use categories for genres (field name consistency)
      categories: data.categories || [],
      averageRating: data.averageRating || null,
      userRating: data.userRating === undefined ? null : data.userRating,
      notes: data.notes || null,
      publisher: data.publisher || null,
    };
  };

  // Load more books function
  const loadMoreBooks = useCallback(async (isFilterReset = false) => {
    if (!db) {
      console.warn("Firestore client (db) not initialized, cannot load books.");
      setLoading(false);
      setHasMore(false);
      return;
    }

    // Prevent loading if already loading or no more books expected
    if (loading && !isFilterReset) return;
    if (!hasMore && !isFilterReset) {
      console.log("LoadMoreBooks: No more books to load.");
      return;
    }

    // Set loading state only if it's not a filter reset (already set in useEffect)
    if (!isFilterReset) {
      setLoading(true);
    }
    
    try {
      // Base query reference
      const booksCollRef = collection(db, 'books');

      // Array to hold query constraints
      const constraints: QueryConstraint[] = [];

      // Add WHERE clauses based on filters
      if (statusFilter) {
        constraints.push(where('status', '==', statusFilter));
      }
      if (ratingFilter !== '') {
        constraints.push(where('userRating', '>=', Number(ratingFilter)));
      }
      if (genreFilter) {
        // Use the 'categories' field which stores genre information in book documents
        constraints.push(where('categories', 'array-contains', genreFilter));
      }

      // Add sorting
      constraints.push(orderBy('title', 'asc'));

      // Add pagination limit
      constraints.push(limit(BOOKS_PER_PAGE));

      // Add cursor for pagination if lastVisible exists
      if (lastVisible && !isFilterReset) {
        constraints.push(startAfter(lastVisible));
      }

      // Construct the final query
      const finalQuery = query(booksCollRef, ...constraints);

      const documentSnapshots = await getDocs(finalQuery);

      // Convert documents to Book objects
      const newBooks: Book[] = [];
      documentSnapshots.forEach((doc) => {
        try {
          const book = convertDocToBook(doc);
          newBooks.push(book);
        } catch (error) {
          console.error(`Error converting doc ${doc.id} to Book:`, error);
        }
      });

      // Update lastVisible document for pagination
      const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      setLastVisible(lastDoc || null);

      // Update books state: replace on filter reset, append otherwise
      setBooks(prevBooks => isFilterReset ? newBooks : [...prevBooks, ...newBooks]);

      // Determine if there are more books to load
      setHasMore(documentSnapshots.docs.length === BOOKS_PER_PAGE);

    } catch (error) { 
      console.error("Error loading more books:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, lastVisible, statusFilter, ratingFilter, genreFilter]);

  return {
    books,
    loading,
    hasMore,
    lastVisible,
    loadMoreBooks,
  };
}

export default useBooks;
