import { Book, BookSearchResult, BookStatus } from '@/types/book';
import { auth } from '@/lib/firebase';

// Get authentication token
const getAuthToken = async (): Promise<string | null> => {
  try {
    // Get token from localStorage instead of Firebase SDK
    return localStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Fetch book by ISBN using Google Books API via our server API
export const fetchBookByISBN = async (isbn: string): Promise<BookSearchResult | null> => {
  try {
    // Use server API instead of direct Google Books API access
    const response = await fetch(`/api/books?isbn=${isbn}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.warn(`No books found with ISBN: ${isbn}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.success || !data.data) {
      console.warn(`No books found with ISBN: ${isbn}`);
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching book:', error);
    throw error;
  }
};

// Search books by title or author using server API
export const searchBooks = async (query: string, maxResults = 10): Promise<BookSearchResult[]> => {
  try {
    // Use server API instead of direct Google Books API access
    const response = await fetch(`/api/books-search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.warn(`Error searching books: ${response.statusText}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.success || !data.data || !Array.isArray(data.data)) {
      console.warn(`No books found for query: ${query}`);
      return [];
    }
    
    return data.data;
  } catch (error) {
    console.error('Error searching books:', error);
    return [];
  }
};

// Add a book to the collection
export const addBook = async (book: Book): Promise<string> => {
  try {
    console.log('Adding new book to collection:', book.title);
    
    // Use the server API endpoint
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required to add books');
    }
    
    const response = await fetch('/api/books', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(book)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add book: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error adding book');
    }
    
    console.log('Book added successfully:', data.data.id);
    return data.data.id;
  } catch (error) {
    console.error('Error adding book:', error);
    throw error;
  }
};

// Update a book
export const updateBook = async (id: string, updates: Partial<Book>): Promise<void> => {
  try {
    console.log('Updating book:', id);
    
    // Use the server API endpoint
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required to update books');
    }
    
    const response = await fetch(`/api/books?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update book: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error updating book');
    }
    
    console.log('Book updated successfully');
  } catch (error) {
    console.error('Error updating book:', error);
    throw error;
  }
};

// Delete a book
export const deleteBook = async (id: string): Promise<void> => {
  try {
    console.log('Deleting book:', id);
    
    // Use the server API endpoint
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required to delete books');
    }
    
    const response = await fetch(`/api/books?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete book: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error deleting book');
    }
    
    console.log('Book deleted successfully');
  } catch (error) {
    console.error('Error deleting book:', error);
    throw error;
  }
};

// Get book statistics
export const getBookStats = async (): Promise<{
  total: number;
  read: number;
  reading: number;
  toRead: number;
}> => {
  try {
    const books = await getBooks();
    
    // Calculate status counts
    const total = books.length;
    const read = books.filter(book => book.status === 'read').length;
    const reading = books.filter(book => book.status === 'reading').length;
    const toRead = books.filter(book => book.status === 'toRead').length;
    
    return {
      total,
      read,
      reading,
      toRead
    };
  } catch (error) {
    console.error('Error calculating book stats:', error);
    return {
      total: 0,
      read: 0,
      reading: 0,
      toRead: 0
    };
  }
};

// Get book by ID 
export const getBookById = async (id: string): Promise<Book | null> => {
  try {
    // Use the server API endpoint
    const token = await getAuthToken();
    
    // Headers object
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`/api/books?id=${id}`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      console.error(`Error fetching book: ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.success || !data.data) {
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error(`Error getting book with ID ${id}:`, error);
    return null;
  }
};

// Get all books
export const getBooks = async (): Promise<Book[]> => {
  try {
    // Use the API endpoint
    const token = await getAuthToken();
    
    // Headers object
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Try public endpoint first
    try {
      const response = await fetch('/api/public-books', {
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Successfully fetched ${data.data?.length || 0} books from public API`);
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (publicError) {
      console.error('Error fetching from public books API:', publicError);
    }
    
    // If public fails, try admin endpoint
    if (token) {
      try {
        const response = await fetch('/api/books', {
          method: 'GET',
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Successfully fetched ${data.data?.length || 0} books from admin API`);
          if (data.success && Array.isArray(data.data)) {
            return data.data;
          }
        }
      } catch (adminError) {
        console.error('Error fetching from admin books API:', adminError);
      }
    }
    
    // If all endpoints fail, try debug API
    try {
      const response = await fetch('/api/books-debug');
      if (response.ok) {
        const data = await response.json();
        console.log('Books retrieved from debug API as fallback');
        if (data.data && data.data.length > 0) {
          return data.data;
        }
      }
    } catch (debugError) {
      console.error('Error using debug API as fallback:', debugError);
    }
    
    // If all else fails, return empty array
    console.warn('All book API endpoints failed, returning empty array');
    return [];
  } catch (outerError) {
    console.error('Unhandled error in getBooks:', outerError);
    return [];
  }
};