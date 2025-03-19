/**
 * Books API module
 * 
 * This module handles all book-related interactions with Firebase
 * and Google Books API for ISBN lookup
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { firestore } from '../firebase';
import { Firestore } from 'firebase/firestore';
import { Book } from '@/types/book';
import { getCurrentUserToken } from './auth';

// Firestore collection name
const COLLECTION_NAME = 'books';
const API_BASE = '/api';

/**
 * Convert Firestore document to Book type
 */
function convertDocToBook(doc: QueryDocumentSnapshot<DocumentData>): Book {
  const data = doc.data();
  return {
    id: doc.id,
    isbn: data.isbn || '',
    title: data.title || '',
    authors: data.authors || ['Unknown'],
    description: data.description || '',
    publisher: data.publisher || '',
    publishedDate: data.publishedDate || '',
    status: data.status || 'read',
    notes: data.notes || '',
    userRating: data.userRating || 0,
    dateAdded: data.dateAdded || new Date().toISOString(),
    imageLinks: data.imageLinks || {},
    categories: data.categories || [],
    pageCount: data.pageCount || 0,
    averageRating: data.averageRating || 0,
    ratingsCount: data.ratingsCount || 0
  };
}

/**
 * Get all books - tries server API first, falls back to client
 */
export async function getAllBooks(): Promise<Book[]> {
  try {
    // Try server API first
    const token = await getCurrentUserToken();
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/books`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.success ? data.data : [];
        }
        // If server API fails, log error and continue with client-side fallback
        console.warn('Server API failed, falling back to client-side API');
      } catch (serverError) {
        console.error('Server API error, falling back to client-side:', serverError);
      }
    }
    
    // Client-side fallback
    if (!firestore) {
      console.warn('Firestore not initialized, returning empty books array');
      return [];
    }
    
    const booksQuery = query(
      collection(firestore as Firestore, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(booksQuery);
    return querySnapshot.docs.map(convertDocToBook);
  } catch (error) {
    console.error('API: Error fetching books:', error);
    return [];
  }
}

/**
 * Get book by ID - tries server API first, falls back to client
 */
export async function getBookById(id: string): Promise<Book | null> {
  try {
    // Try server API first
    const token = await getCurrentUserToken();
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/books?id=${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.success ? data.data : null;
        }
        // If server API fails, log error and continue with client-side fallback
        console.warn('Server API failed, falling back to client-side API');
      } catch (serverError) {
        console.error('Server API error, falling back to client-side:', serverError);
      }
    }
    
    // Client-side fallback
    if (!firestore) {
      console.warn('Firestore not initialized, returning null for book ID');
      return null;
    }
    
    const docRef = doc(firestore as Firestore, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return convertDocToBook(docSnap);
    }
    
    return null;
  } catch (error) {
    console.error(`API: Error fetching book with ID ${id}:`, error);
    return null;
  }
}

/**
 * Add new book - tries server API first, falls back to client
 */
export async function addBook(book: Omit<Book, 'id'>): Promise<Book | null> {
  try {
    const bookData = {
      ...book,
      dateAdded: book.dateAdded || new Date().toISOString()
    };
    
    // Try server API first
    const token = await getCurrentUserToken();
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/books`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bookData)
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.success ? data.data : null;
        }
        // If server API fails, log error and continue with client-side fallback
        console.warn('Server API failed, falling back to client-side API');
      } catch (serverError) {
        console.error('Server API error, falling back to client-side:', serverError);
      }
    }
    
    // Client-side fallback
    if (!firestore) {
      console.warn('Firestore not initialized, cannot add book');
      return null;
    }
    
    const docRef = await addDoc(collection(firestore as Firestore, COLLECTION_NAME), bookData);
    
    return {
      ...book,
      id: docRef.id,
    };
  } catch (error) {
    console.error('API: Error adding book:', error);
    return null;
  }
}

/**
 * Update existing book - tries server API first, falls back to client
 */
export async function updateBook(id: string, book: Partial<Book>): Promise<boolean> {
  try {
    const bookData = {
      ...book,
      updatedAt: new Date().toISOString()
    };
    
    // Try server API first
    const token = await getCurrentUserToken();
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/books?id=${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bookData)
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.success;
        }
        // If server API fails, log error and continue with client-side fallback
        console.warn('Server API failed, falling back to client-side API');
      } catch (serverError) {
        console.error('Server API error, falling back to client-side:', serverError);
      }
    }
    
    // Client-side fallback
    if (!firestore) {
      console.warn('Firestore not initialized, cannot update book');
      return false;
    }
    
    const docRef = doc(firestore as Firestore, COLLECTION_NAME, id);
    await updateDoc(docRef, bookData);
    
    return true;
  } catch (error) {
    console.error(`API: Error updating book with ID ${id}:`, error);
    return false;
  }
}

/**
 * Delete book - tries server API first, falls back to client
 */
export async function deleteBook(id: string): Promise<boolean> {
  try {
    // Try server API first
    const token = await getCurrentUserToken();
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/books?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.success;
        }
        // If server API fails, log error and continue with client-side fallback
        console.warn('Server API failed, falling back to client-side API');
      } catch (serverError) {
        console.error('Server API error, falling back to client-side:', serverError);
      }
    }
    
    // Client-side fallback
    if (!firestore) {
      console.warn('Firestore not initialized, cannot delete book');
      return false;
    }
    
    const docRef = doc(firestore as Firestore, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    
    return true;
  } catch (error) {
    console.error(`API: Error deleting book with ID ${id}:`, error);
    return false;
  }
}

/**
 * Get favourite books
 */
export async function getFavouriteBooks(): Promise<Book[]> {
  try {
    if (!firestore) {
      console.warn('Firestore not initialized, returning empty favorite books array');
      return [];
    }
    
    const booksQuery = query(
      collection(firestore as Firestore, COLLECTION_NAME),
      where('favourite', '==', true),
      orderBy('rating', 'desc')
    );
    
    const querySnapshot = await getDocs(booksQuery);
    return querySnapshot.docs.map(convertDocToBook);
  } catch (error) {
    console.error('API: Error fetching favourite books:', error);
    return [];
  }
}

/**
 * Google Books API related functions
 */

/**
 * Get the Google Books API key from secure config
 */
function getGoogleBooksApiKey(): string {
  if (typeof window !== 'undefined') {
    try {
      if (window.SECURE_CONFIG?.googleBooks?.apiKey) {
        return window.SECURE_CONFIG.googleBooks.apiKey;
      }
    } catch (error) {
      console.warn('Error accessing Google Books API key:', error);
    }
  }
  return '';
}

/**
 * Look up book by ISBN using Google Books API
 */
export async function lookupBookByIsbn(isbn: string): Promise<Partial<Book> | null> {
  try {
    const apiKey = getGoogleBooksApiKey();
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${apiKey ? `&key=${apiKey}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Google Books API error: ${response.statusText}`);
    
    const data = await response.json();
    
    if (data.totalItems === 0) {
      console.warn(`No books found with ISBN: ${isbn}`);
      return null;
    }
    
    // Parse the first result
    const bookData = data.items[0].volumeInfo;
    
    return {
      isbn: isbn,
      title: bookData.title,
      authors: bookData.authors || ['Unknown'],
      description: bookData.description || '',
      publisher: bookData.publisher || '',
      publishedDate: bookData.publishedDate || '',
      imageLinks: bookData.imageLinks || {},
      categories: bookData.categories || [],
      pageCount: bookData.pageCount || 0,
      averageRating: bookData.averageRating || 0,
      ratingsCount: bookData.ratingsCount || 0,
      dateAdded: new Date().toISOString(),
      status: 'toRead',
      notes: '',
      userRating: 0
    };
  } catch (error) {
    console.error(`API: Error looking up book with ISBN ${isbn}:`, error);
    return null;
  }
}

/**
 * Search books by title or author using Google Books API
 */
export async function searchBooks(query: string, maxResults: number = 10): Promise<Partial<Book>[]> {
  try {
    const apiKey = getGoogleBooksApiKey();
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}${apiKey ? `&key=${apiKey}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Google Books API error: ${response.statusText}`);
    
    const data = await response.json();
    
    if (data.totalItems === 0) {
      console.warn(`No books found for query: ${query}`);
      return [];
    }
    
    // Parse results
    return data.items.map((item: any) => {
      const bookData = item.volumeInfo;
      const industryIdentifiers = bookData.industryIdentifiers || [];
      const isbn = industryIdentifiers.find((id: any) => id.type === 'ISBN_13')?.identifier || 
                 industryIdentifiers.find((id: any) => id.type === 'ISBN_10')?.identifier || '';
                 
      return {
        isbn: isbn,
        title: bookData.title,
        authors: bookData.authors || ['Unknown'],
        description: bookData.description || '',
        publisher: bookData.publisher || '',
        publishedDate: bookData.publishedDate || '',
        imageLinks: bookData.imageLinks || {},
        categories: bookData.categories || [],
        pageCount: bookData.pageCount || 0,
        averageRating: bookData.averageRating || 0,
        ratingsCount: bookData.ratingsCount || 0,
        dateAdded: new Date().toISOString(),
        status: 'toRead',
        notes: '',
        userRating: 0
      };
    });
  } catch (error) {
    console.error(`API: Error searching books with query "${query}":`, error);
    return [];
  }
}