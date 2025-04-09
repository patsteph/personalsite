/**
 * Books API module
 * 
 * This module handles all book-related interactions with server API endpoints
 */
import { Book } from '@/types/book';
import { getCurrentUserToken } from './auth';

// API endpoint base
const API_BASE = '/api';

/**
 * Get all books - always use server API
 */
export async function getAllBooks(): Promise<Book[]> {
  try {
    // Get auth token if available
    const token = await getCurrentUserToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Try admin endpoint if authenticated
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/books`, {
          method: 'GET',
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.success ? data.data : [];
        }
      } catch (adminError) {
        console.error('Error accessing admin books API:', adminError);
      }
    }
    
    // Try public endpoint as fallback
    try {
      const response = await fetch(`${API_BASE}/public-books`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : [];
      }
    } catch (publicError) {
      console.error('Error accessing public books API:', publicError);
    }
    
    // Return empty array if all attempts fail
    console.warn('Failed to fetch books from any API endpoint');
    return [];
  } catch (error) {
    console.error('API: Error fetching books:', error);
    return [];
  }
}

/**
 * Get book by ID - always use server API
 */
export async function getBookById(id: string): Promise<Book | null> {
  try {
    // Get auth token if available
    const token = await getCurrentUserToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Try admin endpoint if authenticated
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/books?id=${id}`, {
          method: 'GET',
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.success ? data.data : null;
        }
      } catch (adminError) {
        console.error('Error accessing admin book API:', adminError);
      }
    }
    
    // Try public endpoint as fallback
    try {
      const response = await fetch(`${API_BASE}/public-books?id=${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : null;
      }
    } catch (publicError) {
      console.error('Error accessing public book API:', publicError);
    }
    
    return null;
  } catch (error) {
    console.error(`API: Error fetching book with ID ${id}:`, error);
    return null;
  }
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
    
    // Get auth token - required for adding books
    const token = await getCurrentUserToken();
    if (!token) {
      throw new Error('Authentication required to add books');
    }
    
    const response = await fetch(`${API_BASE}/books`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookData)
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('API: Error adding book:', error);
    return null;
  }
}

/**
 * Update existing book - always use server API
 */
export async function updateBook(id: string, book: Partial<Book>): Promise<boolean> {
  try {
    const bookData = {
      ...book,
      updatedAt: new Date().toISOString()
    };
    
    // Get auth token - required for updating books
    const token = await getCurrentUserToken();
    if (!token) {
      throw new Error('Authentication required to update books');
    }
    
    const response = await fetch(`${API_BASE}/books?id=${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookData)
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error(`API: Error updating book with ID ${id}:`, error);
    return false;
  }
}

/**
 * Delete book - always use server API
 */
export async function deleteBook(id: string): Promise<boolean> {
  try {
    // Get auth token - required for deleting books
    const token = await getCurrentUserToken();
    if (!token) {
      throw new Error('Authentication required to delete books');
    }
    
    const response = await fetch(`${API_BASE}/books?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error(`API: Error deleting book with ID ${id}:`, error);
    return false;
  }
}

/**
 * Get favourite books - always use server API
 */
export async function getFavouriteBooks(): Promise<Book[]> {
  try {
    // Try public endpoint
    const response = await fetch(`${API_BASE}/public-books?favourite=true`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      console.warn('Error fetching favourite books');
      return [];
    }
    
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('API: Error fetching favourite books:', error);
    return [];
  }
}

/**
 * Look up book by ISBN using server API to Google Books
 */
export async function lookupBookByIsbn(isbn: string): Promise<Partial<Book> | null> {
  try {
    const response = await fetch(`${API_BASE}/books?isbn=${isbn}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      console.warn(`No books found with ISBN: ${isbn}`);
      return null;
    }
    
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error(`API: Error looking up book with ISBN ${isbn}:`, error);
    return null;
  }
}

/**
 * Search books by title or author using server API to Google Books
 */
export async function searchBooks(query: string, maxResults: number = 10): Promise<Partial<Book>[]> {
  try {
    const response = await fetch(`${API_BASE}/books-search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      console.warn(`Error searching books with query: ${query}`);
      return [];
    }
    
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error(`API: Error searching books with query "${query}":`, error);
    return [];
  }
}