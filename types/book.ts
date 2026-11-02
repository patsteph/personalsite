// types/book.ts
export type BookStatus = 'to-read' | 'reading' | 'read' | 'did-not-finish' | 'on-hold';

export type BookFilter = 'all' | BookStatus;

export type BookSortOption = 'title' | 'author' | 'genre' | 'rating';

// Represents the structure of a book object in the application
export type Book = {
  id: string;
  title: string;
  authors: string[];
  googleBooksId?: string; // Optional: Google Books Volume ID
  status: BookStatus;
  dateAdded: string | null;
  lastUpdated: string | null;
  isbn?: string;
  publishedDate?: string;
  description?: string;
  categories?: string[]; // Added to align with BookSearchResult and usage
  pageCount?: number;
  genres?: string[];
  averageRating?: number;
  ratingsCount?: number; // Added to align with BookSearchResult and usage
  userRating?: number | null;
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
  };
  notes?: string;
  publisher?: string;
};

export type BookWithId = Book & { id: string };

// Buckets used for display stats. Older documents in Firestore predate the
// canonical BookStatus values above and store status as "Read", "To Read",
// "toRead", "Currently Reading", etc. - this is the one place that maps all
// known variants (canonical and legacy) to a display bucket.
export type BookStatusBucket = 'read' | 'reading' | 'to-read' | 'other';

const READ_VALUES = new Set(['read', 'Read']);
const READING_VALUES = new Set(['reading', 'Currently Reading', 'currentlyReading']);
const TO_READ_VALUES = new Set(['to-read', 'To Read', 'toRead', 'to read']);

export function categorizeBookStatus(status: unknown): BookStatusBucket {
  if (typeof status !== 'string') return 'other';
  if (READ_VALUES.has(status)) return 'read';
  if (READING_VALUES.has(status)) return 'reading';
  if (TO_READ_VALUES.has(status)) return 'to-read';
  return 'other';
}

export interface BookSearchResult {
  id: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  averageRating?: number;
  ratingsCount?: number;
  isbn: string;
}