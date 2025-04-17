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
  pageCount?: number;
  genres?: string[];
  averageRating?: number;
  userRating?: number | null;
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
  };
  notes?: string;
  publisher?: string;
};

export type BookWithId = Book & { id: string };

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