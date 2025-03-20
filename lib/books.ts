import { Book, BookSearchResult, BookStatus } from '@/types/book';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  Firestore,
  serverTimestamp 
} from 'firebase/firestore';

// Initialize Firebase if not already initialized
let firestore: Firestore | null = null;
let app: FirebaseApp | null = null;

const initFirebase = () => {
  console.log('Initializing Firebase for Books module');
  
  // Check if Firebase apps already initialized
  if (getApps().length > 0) {
    console.log('Firebase already initialized, reusing app');
    app = getApps()[0];
    firestore = getFirestore(app);
    return firestore;
  }
  
  // If not initialized, initialize now
  let firebaseConfig: any = {};
  
  // On client-side, try different config sources
  if (typeof window !== 'undefined') {
    try {
      // Try SECURE_CONFIG first (direct-admin page)
      if (window.SECURE_CONFIG?.firebase?.apiKey) {
        console.log('Using Firebase config from SECURE_CONFIG');
        firebaseConfig = window.SECURE_CONFIG.firebase;
      } 
      // Then try runtimeConfig (main site)
      else if (window.runtimeConfig?.firebase?.apiKey) {
        console.log('Using Firebase config from runtimeConfig');
        firebaseConfig = window.runtimeConfig.firebase;
      }
    } catch (error) {
      console.warn('Error accessing window configs:', error);
    }
  }

  // Log warning if no configuration is available
  if (!firebaseConfig.apiKey) {
    console.warn('No Firebase config available from environment or runtime configuration');
    // We'll continue with empty config, which will cause initialization to fail gracefully
  }
  
  // Only initialize if we have a config with at least a projectId
  if (firebaseConfig && firebaseConfig.projectId) {
    console.log('Initializing Firebase with config:', { 
      projectId: firebaseConfig.projectId,
      hasApiKey: !!firebaseConfig.apiKey
    });
    try {
      app = initializeApp(firebaseConfig);
      firestore = getFirestore(app);
      console.log('Firebase initialized successfully for Books');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  } else {
    console.warn('Missing Firebase config, cannot initialize Firebase');
  }
  
  return firestore;
};

// Fetch book by ISBN using Google Books API
export const fetchBookByISBN = async (isbn: string): Promise<BookSearchResult | null> => {
  try {
    // Get API key from secure config if available
    let apiKey = '';
    
    if (typeof window !== 'undefined') {
      try {
        if (window.SECURE_CONFIG?.googleBooks?.apiKey) {
          apiKey = `&key=${window.SECURE_CONFIG.googleBooks.apiKey}`;
        }
      } catch (error) {
        console.warn('Error accessing Google Books API key:', error);
      }
    }
    
    // Make API request
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${apiKey}`);
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.warn(`No books found with ISBN: ${isbn}`);
      return null;
    }
    
    const bookData = data.items[0].volumeInfo;
    
    return {
      isbn,
      title: bookData.title,
      authors: bookData.authors || ['Unknown Author'],
      publisher: bookData.publisher,
      publishedDate: bookData.publishedDate,
      description: bookData.description,
      pageCount: bookData.pageCount,
      categories: bookData.categories,
      imageLinks: bookData.imageLinks,
      averageRating: bookData.averageRating,
      ratingsCount: bookData.ratingsCount,
    };
  } catch (error) {
    console.error('Error fetching book:', error);
    throw error;
  }
};

// Search books by title or author
export const searchBooks = async (query: string, maxResults = 10): Promise<BookSearchResult[]> => {
  try {
    // Get API key from secure config if available
    let apiKey = '';
    
    if (typeof window !== 'undefined') {
      try {
        if (window.SECURE_CONFIG?.googleBooks?.apiKey) {
          apiKey = `&key=${window.SECURE_CONFIG.googleBooks.apiKey}`;
        }
      } catch (error) {
        console.warn('Error accessing Google Books API key:', error);
      }
    }
    
    // Make API request
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}${apiKey}`);
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.warn(`No books found for query: ${query}`);
      return [];
    }
    
    // Convert results to BookSearchResult format
    return data.items.map((item: any) => {
      const bookData = item.volumeInfo;
      const industryIdentifiers = bookData.industryIdentifiers || [];
      const isbn = industryIdentifiers.find((id: any) => id.type === 'ISBN_13')?.identifier || 
                 industryIdentifiers.find((id: any) => id.type === 'ISBN_10')?.identifier || '';
                 
      return {
        isbn,
        title: bookData.title,
        authors: bookData.authors || ['Unknown Author'],
        publisher: bookData.publisher,
        publishedDate: bookData.publishedDate,
        description: bookData.description,
        pageCount: bookData.pageCount,
        categories: bookData.categories,
        imageLinks: bookData.imageLinks,
        averageRating: bookData.averageRating,
        ratingsCount: bookData.ratingsCount,
      };
    });
  } catch (error) {
    console.error('Error searching books:', error);
    return [];
  }
};

// Add a book to the collection
export const addBook = async (book: Book): Promise<string> => {
  try {
    const db = initFirebase();
    if (!db) throw new Error('Firebase is not initialized');
    
    const booksCollection = collection(db, 'books');
    const newBookRef = await addDoc(booksCollection, {
      ...book,
      dateAdded: serverTimestamp(),
    });
    
    return newBookRef.id;
  } catch (error) {
    console.error('Error adding book:', error);
    throw error;
  }
};

// Update a book
export const updateBook = async (id: string, updates: Partial<Book>): Promise<void> => {
  try {
    const db = initFirebase();
    if (!db) throw new Error('Firebase is not initialized');
    
    const bookRef = doc(db, 'books', id);
    await updateDoc(bookRef, updates);
  } catch (error) {
    console.error('Error updating book:', error);
    throw error;
  }
};

// Delete a book
export const deleteBook = async (id: string): Promise<void> => {
  try {
    const db = initFirebase();
    if (!db) throw new Error('Firebase is not initialized');
    
    const bookRef = doc(db, 'books', id);
    await deleteDoc(bookRef);
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

// Get book by ID (re-export from API)
export const getBookById = async (id: string): Promise<Book | null> => {
  try {
    // Initialize Firebase
    const db = initFirebase();
    if (!db) {
      console.warn('Firebase not initialized, cannot get book by ID');
      return null;
    }
    
    // Get all books and find the one matching the ID
    const books = await getBooks();
    return books.find(book => book.id === id) || null;
  } catch (error) {
    console.error(`Error getting book with ID ${id}:`, error);
    return null;
  }
};

// Get all books
export const getBooks = async (): Promise<Book[]> => {
  try {
    // First try initializing Firebase
    const db = initFirebase();
    
    if (!db) {
      console.warn('Firebase not initialized, returning empty array');
      return [];
    }
    
    console.log('Firebase initialized successfully, attempting to get books collection');
    
    // Try both 'books' and 'Books' collections since Firebase is case-sensitive
    const collectionNames = ['books', 'Books'];
    let books: Book[] = [];
    let collectionSuccess = false;
    
    for (const collName of collectionNames) {
      try {
        const booksCollection = collection(db, collName);
        console.log(`Attempting to query "${collName}" collection`);
        
        // With no filters, just get all books
        const snapshot = await getDocs(booksCollection);
        
        if (!snapshot.empty) {
          books = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // Convert Firestore Timestamps to ISO strings for serialization
            const serializedData: any = {};
            Object.keys(data).forEach(key => {
              // Convert any Firestore timestamps to ISO strings
              if (data[key] && typeof data[key].toDate === 'function') {
                serializedData[key] = data[key].toDate().toISOString();
              } else {
                serializedData[key] = data[key];
              }
            });
            
            // Sanitize data before returning
            const safeData = {
              id: doc.id,
              ...serializedData,
              // Ensure critical fields have safe defaults
              title: serializedData.title || 'Untitled Book',
              // Handle authors field which can be string, array, or undefined
              authors: Array.isArray(serializedData.authors) ? serializedData.authors : 
                      typeof serializedData.authors === 'string' ? [serializedData.authors] : 
                      ['Unknown Author'],
              status: serializedData.status || 'read',
              dateAdded: serializedData.dateAdded || new Date().toISOString()
            };
            
            console.log(`Sanitized book ${doc.id}, authors: ${JSON.stringify(safeData.authors)}`);
            return safeData;
          }) as Book[];
          
          console.log(`Retrieved ${books.length} books from Firestore "${collName}" collection:`, books);
          collectionSuccess = true;
          break; // Exit the loop if we found books
        } else {
          console.warn(`Collection "${collName}" exists but is empty`);
        }
      } catch (collError) {
        console.error(`Error querying collection "${collName}":`, collError);
      }
    }
    
    // If no books found in any collection, return empty array
    if (!collectionSuccess || books.length === 0) {
      console.warn('No books found in Firestore, returning empty array');
      return [];
    }
    
    return books;
  } catch (error) {
    console.error('Error getting books:', error);
    
    // Return empty array if there's an error getting books
    console.warn('Returning empty array due to error');
    return [];
  }
};

