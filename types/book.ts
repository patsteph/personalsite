export type Book = {
  id: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  categories?: string[];
  pageCount?: number;
  averageRating?: number;
  ratingsCount?: number;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  status: 'read' | 'reading' | 'toRead';
  notes?: string;
  dateAdded: string;
  isbn: string;
}

export type BookFilter = 'all' | 'read' | 'reading' | 'toRead';
export type BookSortOption = 'title' | 'author' | 'genre' | 'rating';