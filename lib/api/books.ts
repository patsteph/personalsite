/**
 * Books API module
 * 
 * This module handles all book-related interactions with server API endpoints
 * using the standardized API service utility.
 */
import { Book } from '@/types/book';
import { apiGet, apiPost, apiPut, apiDelete, ApiResponse } from '@/lib/utils/api-service';

/**
 * Get all books with automatic fallback to public endpoint
 * @returns Promise resolving to an array of books
 */
export async function getAllBooks(): Promise<Book[]> {
  // Try the authenticated endpoint first
  const adminResponse = await apiGet<Book[]>('/api/books');
  
  if (adminResponse.success && adminResponse.data) {
    return adminResponse.data;
  }
  
  // Fall back to public endpoint if admin fails
  const publicResponse = await apiGet<Book[]>('/api/public-books', false);
  
  return publicResponse.success && publicResponse.data ? publicResponse.data : [];
}

/**
 * Get book by ID with automatic fallback to public endpoint
 * @param id Book ID
 * @returns Promise resolving to a book or null
 */
export async function getBookById(id: string): Promise<Book | null> {
  // Try the authenticated endpoint first
  const adminResponse = await apiGet<Book>(`/api/books/${id}`);
  
  if (adminResponse.success && adminResponse.data) {
    return adminResponse.data;
  }
  
  // Fall back to public endpoint if admin fails
  const publicResponse = await apiGet<Book>(`/api/public-books/${id}`, false);
  
  return publicResponse.success && publicResponse.data ? publicResponse.data : null;
}

/**
 * Add new book - always use server API
 */
export async function addBook(book: Omit<Book, 'id'>): Promise<Book | null> {
  try {
    const bookData = {
      ...book,
      dateAdded: book.dateAdded || new Date().toISOString()
    };
    
    const response = await apiPost<Book, Omit<Book, 'id'>>('/api/books', bookData);
    return response.success && response.data ? response.data : null;
  } catch (error) {
    console.error('API: Error adding book:', error);
    return null;
  }
}

/**
 * Update book - requires authentication
 * @param book Book object with updated fields
 * @returns Promise resolving to the updated book or null
 */
export async function updateBook(book: Book): Promise<Book | null> {
  const response = await apiPut<Book, Book>(`/api/books/${book.id}`, book);
  return response.success && response.data ? response.data : null;
}

/**
 * Delete book - always use server API
 */
export async function deleteBook(id: string): Promise<boolean> {
  try {
    const response = await apiDelete(`/api/books/${id}`);
    return response.success;
  } catch (error) {
    console.error(`API: Error deleting book with ID ${id}:`, error);
    return false;
  }
}

/**
 * Get favourite books - always use server API
 */
/**
 * Get favourite books
 * @returns Promise resolving to an array of favourite books
 */
export async function getFavouriteBooks(): Promise<Book[]> {
  const response = await apiGet<Book[]>('/api/public-books?favourite=true', false);
  return response.success && response.data ? response.data : [];
}

/**
 * Look up book by ISBN using server API to Google Books
 * @param isbn ISBN to search for
 * @returns Promise resolving to partial book data or null
 */
export async function lookupBookByIsbn(isbn: string): Promise<Partial<Book> | null> {
  const response = await apiGet<Partial<Book>>(`/api/books?isbn=${isbn}`, false);
  return response.success && response.data ? response.data : null;
}

/**
 * Search books by title or author using server API to Google Books
 * @param query Search query string
 * @param maxResults Maximum number of results to return
 * @returns Promise resolving to array of partial book data
 */
export async function searchBooks(query: string, maxResults: number = 10): Promise<Partial<Book>[]> {
  const endpoint = `/api/books-search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
  const response = await apiGet<Partial<Book>[]>(endpoint, false);
  return response.success && response.data ? response.data : [];
}