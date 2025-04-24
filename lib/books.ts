import { Book, BookWithId } from '@/types/book';
import { auth } from './firebase-client';
import { getIdToken } from 'firebase/auth';

// Fetch book by ISBN using Google Books API via our server API
export const fetchBookByISBN = async (isbn: string): Promise<BookWithId | null> => {
  try {
    let token: string | null = null;
    if (auth?.currentUser) {
      try {
        token = await auth.currentUser.getIdToken(true);
      } catch (error) {
        console.error('Failed to get ID token for fetchBookByISBN:', error);
      }
    }

    if (!token) {
      throw new Error('Authentication required to fetch book by ISBN.');
    }

    // Use the new server API endpoint
    const response = await fetch(`/api/google-books?isbn=${isbn}`, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Try to get error details
      console.error('Error fetching book by ISBN:', response.status, errorData);
      throw new Error(`Failed to fetch book by ISBN. Status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data && result.data.length > 0) {
      // Google Books API might return multiple editions, take the first one
      // TODO: Consider if the returned structure from mapGoogleBookToBook needs adapting to BookWithId
      return result.data[0] as BookWithId; // Assuming the structure is compatible enough
    } else {
      return null; // Not found or API error
    }
  } catch (error) {
    console.error('Error in fetchBookByISBN:', error);
    return null;
  }
};

// Search books by title or author using server API
export const searchBooks = async (query: string, maxResults = 10): Promise<BookWithId[]> => {
  try {
    let token: string | null = null;
    if (auth?.currentUser) {
      try {
        token = await auth.currentUser.getIdToken(true);
      } catch (error) {
        console.error('Failed to get ID token for searchBooks:', error);
      }
    }

    if (!token) {
      throw new Error('Authentication required to search books.');
    }
    // Use the new server API endpoint
    const response = await fetch(`/api/google-books?q=${encodeURIComponent(query)}&maxResults=${maxResults}`, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Try to get error details
      console.error('Error searching books:', response.status, errorData);
      throw new Error(`Failed to search books. Status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
       // TODO: Consider if the returned structure needs adapting to BookWithId
      return result.data as BookWithId[]; // Assuming the structure is compatible enough
    } else {
      return []; // No results or API error
    }

  } catch (error) {
    console.error('Error in searchBooks:', error);
    return [];
  }
};

// Add a book to the collection
export const addBook = async (book: Book): Promise<string> => {
  try {
    console.log('Adding new book to collection:', book.title);
    
    // Use the server API endpoint
    let token: string | null = null;
    if (auth?.currentUser) {
      try {
        token = await auth.currentUser.getIdToken(true);
      } catch (error) {
        console.error('Failed to get ID token for addBook:', error);
      }
    }
    
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
    let token: string | null = null;
    if (auth?.currentUser) {
      try {
        token = await auth.currentUser.getIdToken(true);
      } catch (error) {
        console.error('Failed to get ID token for updateBook:', error);
      }
    }
    
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
    let token: string | null = null;
    if (auth?.currentUser) {
      try {
        token = await auth.currentUser.getIdToken(true);
      } catch (error) {
        console.error('Failed to get ID token for deleteBook:', error);
      }
    }
    
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
    const toRead = books.filter(book => book.status === 'to-read').length;
    
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
export const getBookById = async (id: string): Promise<BookWithId | null> => {
  try {
    // Use the server API endpoint
    let token: string | null = null;
    if (auth?.currentUser) {
      try {
        token = await auth.currentUser.getIdToken(true);
      } catch (error) {
        console.error('Failed to get ID token for getBookById:', error);
      }
    }
    
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
// Check if a book already exists in the collection
export const checkBookExists = async (isbn: string, title: string): Promise<{ exists: boolean, count: number, duplicates: BookWithId[] }> => {
  try {
    let token: string | null = null;
    if (auth?.currentUser) {
      try {
        token = await auth.currentUser.getIdToken(true);
      } catch (error) {
        console.error('Failed to get ID token for checkBookExists:', error);
      }
    }

    if (!token) {
      throw new Error('Authentication required to check if book exists.');
    }

    // Get all books and check manually (since Firestore doesn't have great OR query support)
    const response = await fetch('/api/books', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to check for duplicate books. Status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.books) {
      throw new Error('Error fetching books data');
    }

    // Find books with matching ISBN or very similar title
    const duplicates = result.books.filter((book: BookWithId) => {
      // Check for ISBN match (exact)
      if (isbn && book.isbn && book.isbn.replace(/-/g, '') === isbn.replace(/-/g, '')) {
        return true;
      }
      
      // Check for title match (case insensitive)
      if (title && book.title && book.title.toLowerCase().trim() === title.toLowerCase().trim()) {
        return true;
      }
      
      return false;
    });

    return {
      exists: duplicates.length > 0,
      count: duplicates.length,
      duplicates
    };
  } catch (error) {
    console.error('Error in checkBookExists:', error);
    throw error;
  }
};

export const getBooks = async (): Promise<BookWithId[]> => {
  console.log('Attempting to fetch books...');

  let token: string | null = null;
  if (auth?.currentUser) {
    try {
      token = await auth.currentUser.getIdToken(true);
    } catch (error) {
      console.error('Failed to get ID token for getBooks:', error);
    }
  }

  // 1. Try fetching from the authenticated admin endpoint if token exists
  if (token) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      const response = await fetch('/api/books', {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        // Don't throw yet, just log and fall back
        console.error(`Admin book fetch failed: ${response.status} ${response.statusText}`);
      } else {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          console.log(`Successfully fetched ${result.data.length} books from admin API`);
          return result.data as BookWithId[];
        }
      }
    } catch (error) {
      console.error('Error fetching books from admin API:', error);
      // Fall through to next attempt
    }
  }

  // 2. Try fetching from the public endpoint (if no token or admin fetch failed)
  try {
    const response = await fetch('/api/public-books');
    if (!response.ok) {
      console.error(`Public book fetch failed: ${response.status} ${response.statusText}`);
      // Fall through
    } else {
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        console.log(`Successfully fetched ${result.data.length} books from public API`);
        return result.data as BookWithId[];
      }
    }
  } catch (error) {
    console.error('Error fetching books from public API:', error);
    // Fall through to next attempt
  }

  // 3. Try fetching from the debug endpoint as a last resort
  try {
    const response = await fetch('/api/books-debug');
    if (!response.ok) {
      console.error(`Debug book fetch failed: ${response.status} ${response.statusText}`);
      // Give up
    } else {
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        console.log(`Successfully fetched ${result.data.length} books from debug API`);
        return result.data as BookWithId[];
      }
    }
  } catch (error) {
    console.error('Error fetching books from debug API:', error);
  }

  // If all attempts fail
  console.error('All attempts to fetch books failed.');
  return [];
};