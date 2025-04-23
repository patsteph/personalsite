// lib/hooks/useQueryBooks.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Book } from '@/types/book';
import { getFirestore, collection, query, orderBy, startAfter, limit, getDocs, where, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { notifyError } from '@/lib/utils/error-handler';

// Constants
export const BOOKS_PER_PAGE = 24;

// Types
type BookFilter = {
  statusFilter?: string;
  ratingFilter?: number | '';
  genreFilter?: string;
};

type BookSort = {
  field: string;
  direction: 'asc' | 'desc';
};

/**
 * Convert Firestore document to Book object
 */
const convertDocToBook = (doc: any): Book => {
  const data = doc.data();
  if (!data) {
    throw new Error(`No data found for book document with ID: ${doc.id}`);
  }

  // Format timestamp fields
  const formatTimestamp = (timestamp: any): string | null => {
    if (!timestamp) return null;
    return timestamp.toDate ? timestamp.toDate().toISOString() : timestamp;
  };

  // Return properly formatted Book object
  return {
    id: doc.id,
    title: data.title || 'Untitled',
    authors: data.authors || [],
    googleBooksId: data.googleBooksId || null,
    status: data.status || 'To Read',
    dateAdded: formatTimestamp(data.dateAdded),
    lastUpdated: formatTimestamp(data.lastUpdated),
    isbn: data.isbn || null,
    publishedDate: data.publishedDate || null,
    description: data.description || null,
    pageCount: data.pageCount || null,
    imageLinks: {
      smallThumbnail: data.imageLinks?.smallThumbnail || data.thumbnailUrl || null,
      thumbnail: data.imageLinks?.thumbnail || data.thumbnailUrl || null,
    },
    categories: data.categories || [],
    averageRating: data.averageRating || null,
    userRating: data.userRating === undefined ? null : data.userRating,
    notes: data.notes || null,
    publisher: data.publisher || null,
  };
};

/**
 * Fetch books with pagination and filtering
 */
const fetchBooks = async (
  pageParam: any,
  filters: BookFilter,
  sort: BookSort = { field: 'title', direction: 'asc' }
): Promise<{ books: Book[], cursor: any }> => {
  if (!db) {
    throw new Error("Firestore client not initialized");
  }

  // Build query constraints
  const constraints: QueryConstraint[] = [];

  // Add filters
  if (filters.statusFilter) {
    constraints.push(where('status', '==', filters.statusFilter));
  }
  if (filters.ratingFilter !== '' && filters.ratingFilter !== undefined) {
    constraints.push(where('userRating', '>=', Number(filters.ratingFilter)));
  }
  if (filters.genreFilter) {
    constraints.push(where('categories', 'array-contains', filters.genreFilter));
  }

  // Add sorting
  constraints.push(orderBy(sort.field, sort.direction));

  // Add pagination
  constraints.push(limit(BOOKS_PER_PAGE));

  // Add cursor for pagination if pageParam exists
  if (pageParam) {
    constraints.push(startAfter(pageParam));
  }

  // Execute query
  const booksRef = collection(db, 'books');
  const booksQuery = query(booksRef, ...constraints);
  const snapshot = await getDocs(booksQuery);

  // Convert documents to Book objects
  const books: Book[] = [];
  snapshot.forEach((doc) => {
    try {
      const book = convertDocToBook(doc);
      books.push(book);
    } catch (error) {
      console.error(`Error converting doc ${doc.id} to Book:`, error);
    }
  });

  // Get cursor for next page
  const lastDoc = snapshot.docs[snapshot.docs.length - 1];

  return {
    books,
    cursor: lastDoc,
  };
};

/**
 * React Query hook for fetching books
 */
export function useBookQuery(bookId: string) {
  return useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      try {
        if (!db) throw new Error("Firestore not initialized");
        
        // Implement single book fetch logic here
        const bookRef = collection(db, 'books');
        const bookQuery = query(bookRef, where('id', '==', bookId), limit(1));
        const snapshot = await getDocs(bookQuery);
        
        if (snapshot.empty) {
          throw new Error(`Book not found with id: ${bookId}`);
        }
        
        return convertDocToBook(snapshot.docs[0]);
      } catch (error) {
        notifyError(error, 'useBookQuery');
        throw error;
      }
    },
    enabled: !!bookId && !!db,
  });
}

/**
 * React Query hook for fetching books with infinite pagination
 */
export function useInfiniteBooks(filters: BookFilter, sort?: BookSort) {
  return useInfiniteQuery({
    queryKey: ['books', filters, sort],
    queryFn: ({ pageParam }) => fetchBooks(pageParam, filters, sort),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.cursor || undefined,
    enabled: !!db,
  });
}

export default useInfiniteBooks;
