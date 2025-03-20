import { useState, useEffect } from 'react';
import { Book, BookStatus } from '@/types/book';
import Image from 'next/image';
// Import Firebase modules directly at the top level
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Type augmentation for window global
declare global {
  interface Window {
    runtimeConfig?: {
      firebase?: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
      };
    };
    SECURE_CONFIG?: {
      firebase?: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
      };
    };
  }
}

type SimpleBookGridProps = {
  initialBooks: Book[];
};

export default function SimpleBookGrid({ initialBooks }: SimpleBookGridProps) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(!initialBooks.length);
  
  useEffect(() => {
    // Load books directly from Firebase client without dynamic imports
    async function loadFirebaseBooks() {
      try {
        setLoading(true);
        console.log('Loading books directly from Firebase client');
        
        if (typeof window === 'undefined') {
          console.log('Not in browser environment, skipping Firebase load');
          setLoading(false);
          return;
        }
        
        // Get config from window
        let firebaseConfig = null;
        
        // Try to use SECURE_CONFIG
        if (window.SECURE_CONFIG?.firebase?.apiKey) {
          console.log('Using Firebase config from SECURE_CONFIG');
          firebaseConfig = window.SECURE_CONFIG.firebase;
        } 
        // Fallback to runtimeConfig
        else if (window.runtimeConfig?.firebase?.apiKey) {
          console.log('Using Firebase config from runtimeConfig');
          firebaseConfig = window.runtimeConfig.firebase;
        }
        
        if (!firebaseConfig?.apiKey) {
          console.error('No Firebase config available');
          setLoading(false);
          return;
        }
        
        // Initialize Firebase (or reuse existing)
        let firestore;
        if (getApps().length > 0) {
          console.log('Firebase already initialized, reusing app');
          firestore = getFirestore(getApps()[0]);
        } else {
          console.log('Initializing Firebase with config');
          const app = initializeApp(firebaseConfig);
          firestore = getFirestore(app);
        }
        
        // Get books collection
        try {
          console.log('Querying books collection');
          const booksCollection = collection(firestore, 'books');
          const snapshot = await getDocs(booksCollection);
          
          if (snapshot.empty) {
            console.log('No books found in collection');
            setLoading(false);
            return;
          }
          
          // Convert data to books array
          const firebaseBooks: any[] = [];
          snapshot.forEach(doc => {
            firebaseBooks.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          // Process the books
          console.log(`Processing ${firebaseBooks.length} books from Firebase`);
          
          const validatedBooks: Book[] = firebaseBooks.map(rawBook => {
            const book: Record<string, any> = {...rawBook};
            
            // Process single author field
            if (book.author && !book.authors) {
              book.authors = [book.author];
            }
            
            // Default values for required fields
            if (!book.id) book.id = `temp-${Math.random().toString(36).substring(2, 9)}`;
            if (!book.title) book.title = 'Untitled Book';
            if (!book.status || !['read', 'reading', 'toRead'].includes(book.status)) book.status = 'read';
            if (!book.dateAdded) book.dateAdded = new Date().toISOString();
            if (!book.isbn) book.isbn = '';
            
            // Handle authors field
            if (!book.authors) {
              book.authors = ['Unknown Author'];
            } else if (typeof book.authors === 'string') {
              book.authors = [book.authors];
            } else if (!Array.isArray(book.authors)) {
              book.authors = ['Unknown Author'];
            }
            
            // Filter any non-string values from authors array
            if (Array.isArray(book.authors)) {
              book.authors = book.authors.filter(author => 
                author !== undefined && author !== null && typeof author === 'string'
              );
              
              if (book.authors.length === 0) {
                book.authors = ['Unknown Author'];
              }
            }
            
            // Ensure imageLinks is an object
            if (!book.imageLinks) book.imageLinks = {};
            
            // Convert to Book type
            return {
              id: book.id,
              isbn: book.isbn,
              title: book.title,
              authors: book.authors,
              status: book.status as BookStatus,
              dateAdded: book.dateAdded,
              publisher: book.publisher,
              publishedDate: book.publishedDate,
              description: book.description,
              pageCount: book.pageCount,
              categories: Array.isArray(book.categories) ? book.categories : [],
              imageLinks: book.imageLinks,
              userRating: typeof book.userRating === 'number' ? book.userRating : undefined,
              averageRating: typeof book.averageRating === 'number' ? book.averageRating : undefined,
              notes: book.notes
            };
          });
          
          console.log(`Successfully processed ${validatedBooks.length} books`);
          setBooks(validatedBooks);
        } catch (error) {
          console.error('Error querying books collection:', error);
        }
      } catch (error) {
        console.error('Error loading Firebase books:', error);
      } finally {
        setLoading(false);
      }
    }
    
    // Load the books
    loadFirebaseBooks();
  }, []);

  // Simple book card component
  const BookCard = ({ book }: { book: Book }) => {
    // Safety check for book object
    if (!book) {
      console.error('Received undefined book in BookCard');
      return null;
    }
    
    // Ultra-safe author text handling with fallbacks at every level
    let authorText = 'Unknown Author';
    
    try {
      // First, ensure authors exists
      if (book.authors !== undefined && book.authors !== null) {
        // Handle string case
        if (typeof book.authors === 'string') {
          authorText = book.authors;
        }
        // Handle array case with additional safety
        else if (Array.isArray(book.authors)) {
          // Additional safety: check if every element is a string
          const validAuthors = book.authors.filter(author => 
            author !== undefined && author !== null && typeof author === 'string'
          );
          
          if (validAuthors.length > 0) {
            authorText = validAuthors.join(', ');
          }
        }
      }
    } catch (error) {
      console.error('Error formatting author text:', error);
      // Fallback to unknown author on any error
    }
    
    // Default cover handling
    const coverImage = book.imageLinks?.thumbnail || 
                       book.imageLinks?.smallThumbnail || 
                       'https://placehold.co/200x300/e0e0e0/808080?text=No+Cover';
    
    // Status badge color
    const statusColor = {
      read: 'bg-green-100 text-green-800',
      reading: 'bg-blue-100 text-blue-800',
      toRead: 'bg-yellow-100 text-yellow-800'
    }[book.status] || 'bg-gray-100 text-gray-800';
    
    // Format book status
    const formatStatus = (status: string) => {
      switch (status) {
        case 'read': return 'Read';
        case 'reading': return 'Reading';
        case 'toRead': return 'To Read';
        default: return status;
      }
    };
    
    return (
      <div 
        className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:-translate-y-1 hover:shadow-lg"
        onClick={() => setSelectedBook(book)}
      >
        <div className="relative h-48 bg-gray-200">
          {/* Using div with background image for more reliable display */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${coverImage})` }}
          >
            {/* Empty image for sizing */}
            <img src={coverImage} alt="" className="opacity-0 w-full h-full" />
          </div>
          
          {/* Status badge */}
          <div className="absolute top-2 right-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}>
              {formatStatus(book.status)}
            </span>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-medium text-gray-900 line-clamp-1">{book.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-1">{authorText}</p>
          
          {/* Rating if available */}
          {(book.userRating || book.averageRating) && (
            <div className="mt-2 flex items-center">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg 
                    key={star}
                    className={`w-4 h-4 ${(book.userRating || book.averageRating || 0) >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="ml-1 text-xs text-gray-600">
                {book.userRating || book.averageRating}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Book details modal
  const BookDetailsModal = ({ book, onClose }: { book: Book, onClose: () => void }) => {
    // Safety check for book object
    if (!book) {
      console.error('Received undefined book in BookDetailsModal');
      return null;
    }
    
    // Ultra-safe author text handling with fallbacks at every level
    let authorText = 'Unknown Author';
    
    try {
      // First, ensure authors exists
      if (book.authors !== undefined && book.authors !== null) {
        // Handle string case
        if (typeof book.authors === 'string') {
          authorText = book.authors;
        }
        // Handle array case with additional safety
        else if (Array.isArray(book.authors)) {
          // Additional safety: check if every element is a string
          const validAuthors = book.authors.filter(author => 
            author !== undefined && author !== null && typeof author === 'string'
          );
          
          if (validAuthors.length > 0) {
            authorText = validAuthors.join(', ');
          }
        }
      }
    } catch (error) {
      console.error('Error formatting author text in modal:', error);
      // Fallback to unknown author on any error
    }
    
    const coverImage = book.imageLinks?.thumbnail || 
                       book.imageLinks?.smallThumbnail || 
                       'https://placehold.co/200x300/e0e0e0/808080?text=No+Cover';
                       
    // Ultra-safe category text handling with fallbacks at every level
    let categories = '';
    
    try {
      // First, ensure categories exists
      if (book.categories !== undefined && book.categories !== null) {
        // Handle string case
        if (typeof book.categories === 'string') {
          categories = book.categories;
        }
        // Handle array case with additional safety
        else if (Array.isArray(book.categories)) {
          // Additional safety: filter out invalid categories
          const validCategories = book.categories.filter(category => 
            category !== undefined && category !== null && typeof category === 'string'
          );
          
          if (validCategories.length > 0) {
            categories = validCategories.join(', ');
          }
        }
      }
    } catch (error) {
      console.error('Error formatting categories text:', error);
      // Empty string fallback on any error
    }
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex flex-col md:flex-row">
            {/* Book cover */}
            <div className="md:w-1/3 p-6 flex justify-center">
              <div className="w-48 h-64 relative bg-gray-200 shadow-lg">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${coverImage})` }}
                />
              </div>
            </div>
            
            {/* Book details */}
            <div className="md:w-2/3 p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900">{book.title}</h2>
                <button 
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="text-lg text-gray-700 mb-4">by {authorText}</div>
              
              {/* Rating */}
              {(book.userRating || book.averageRating) && (
                <div className="mb-4 flex items-center">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg 
                        key={star}
                        className={`w-5 h-5 ${(book.userRating || book.averageRating || 0) >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">
                    {book.userRating || book.averageRating}/5
                  </span>
                </div>
              )}
              
              {/* Categories */}
              {categories && (
                <div className="mb-4">
                  <span className="text-gray-600 text-sm">{categories}</span>
                </div>
              )}
              
              {/* Description */}
              {book.description && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                  <p className="text-gray-700">{book.description}</p>
                </div>
              )}
              
              {/* Book details grid */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                {book.publisher && (
                  <div>
                    <span className="font-medium text-gray-700">Publisher:</span>{' '}
                    <span className="text-gray-600">{book.publisher}</span>
                  </div>
                )}
                
                {book.publishedDate && (
                  <div>
                    <span className="font-medium text-gray-700">Published:</span>{' '}
                    <span className="text-gray-600">{book.publishedDate}</span>
                  </div>
                )}
                
                {book.pageCount && (
                  <div>
                    <span className="font-medium text-gray-700">Pages:</span>{' '}
                    <span className="text-gray-600">{book.pageCount}</span>
                  </div>
                )}
                
                {book.isbn && (
                  <div>
                    <span className="font-medium text-gray-700">ISBN:</span>{' '}
                    <span className="text-gray-600">{book.isbn}</span>
                  </div>
                )}
              </div>
              
              {/* Notes */}
              {book.notes && (
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">My Notes</h3>
                  <p className="text-gray-700 italic">{book.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Filter controls
  const [filter, setFilter] = useState('all');
  
  // Extra safety checks for filtering books
  const safeBooksArray = Array.isArray(books) ? books : [];
  
  // Additional safety: thoroughly validate books before filtering
  const validBooks = safeBooksArray.filter(book => {
    // Must have a defined book object
    if (!book) return false;
    
    // Must have an authors property that is an array (even if empty)
    // This is critical since we call .join() on authors
    if (book.authors === undefined || book.authors === null) return false;
    
    // Convert string authors to array if needed
    if (typeof book.authors === 'string') {
      book.authors = [book.authors];
    }
    
    // Ensure it's an array at this point (strict check)
    if (!Array.isArray(book.authors)) return false;
    
    return true;
  });
  
  const filteredBooks = filter === 'all' 
    ? validBooks 
    : validBooks.filter(book => book.status === filter);
  
  return (
    <div>
      {/* Filter controls */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          All Books
        </button>
        <button 
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'read' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Read
        </button>
        <button 
          onClick={() => setFilter('reading')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'reading' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Currently Reading
        </button>
        <button 
          onClick={() => setFilter('toRead')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'toRead' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Want to Read
        </button>
      </div>
      
      {loading ? (
        <div className="flex flex-col justify-center items-center py-12 bg-white rounded-lg shadow">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-3"></div>
          <span className="text-lg text-gray-700">Loading books from Firebase...</span>
          <p className="mt-2 text-sm text-gray-500">This may take a moment to connect securely...</p>
        </div>
      ) : (
        <>
          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredBooks.map(book => 
                book ? <BookCard key={book.id || `book-${Math.random()}`} book={book} /> : null
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-xl text-gray-700">No books found.</p>
              <p className="mt-2 text-gray-600">
                {filter === 'all' 
                  ? 'Firebase connection may have failed. Please check your network connection and try again.'
                  : `You don't have any books with "${filter}" status.`}
              </p>
              <div className="mt-4">
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          )}
          
          {/* Book details modal */}
          {selectedBook && (
            <BookDetailsModal book={selectedBook} onClose={() => setSelectedBook(null)} />
          )}
        </>
      )}
    </div>
  );
}