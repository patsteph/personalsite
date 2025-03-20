// types/book.ts
export type BookStatus = 'read' | 'reading' | 'toRead';

export type BookFilter = 'all' | BookStatus;

export type BookSortOption = 'title' | 'author' | 'genre' | 'rating';

export interface Book {
  id: string;
  isbn: string;
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
  status: BookStatus;
  notes?: string;
  userRating?: number; // 1-5 stars
  dateAdded: string;
}

export interface BookSearchResult {
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