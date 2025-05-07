import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { booksIndex } from '../lib/algolia';

type Book = {
  objectID: string;
  title: string;
  author: string;
  category?: string;
  categories?: string[];
  status: string;
  rating: number;
  userRating?: number;
  imageUrl?: string;
  dateAdded?: string;
  dateStarted?: string;
  dateFinished?: string;
  notes?: string;
  // Add image links for Google Books API format
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
  };
};

type BooksListProps = {
  filters: {
    search: string;
    filters: string;
  };
  className?: string;
};

type BookDetailProps = {
  book: Book;
  onClose: () => void;
};

import { searchBook, formatGoogleBookData } from '../lib/google-books';

// Book Detail modal component
const BookDetail = ({ book, onClose }: BookDetailProps) => {
  const [googleBook, setGoogleBook] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch additional book details from Google Books API
  useEffect(() => {
    const fetchGoogleBookData = async () => {
      if (!book) return;
      
      setLoading(true);
      try {
        const result = await searchBook(book.title, book.author);
        if (result) {
          setGoogleBook(formatGoogleBookData(result));
        }
      } catch (error) {
        console.error('Error fetching Google book data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGoogleBookData();
  }, [book]);
  
  // Extract book cover URL from various possible sources
  const coverUrl = book.imageUrl || 
    (book.imageLinks && (book.imageLinks.thumbnail || book.imageLinks.smallThumbnail)) ||
    (googleBook && googleBook.imageLinks && (googleBook.imageLinks.thumbnail || googleBook.imageLinks.smallThumbnail)) ||
    'https://via.placeholder.com/240x340?text=No+Cover';
    
  // Get user rating or fall back to rating or default
  const userRating = typeof book.userRating === 'number' ? book.userRating : book.rating || 0;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-start p-4 border-b">
          <h2 className="text-xl font-bold">{book.title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <Image 
              src={coverUrl}
              alt={book.title}
              width={240}
              height={340}
              className="rounded shadow-md"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://via.placeholder.com/240x340?text=No+Cover';
              }}
              priority={true}
            />
          </div>
          <div className="flex-1">
            <p className="text-lg mb-2">by <span className="font-medium">{book.author}</span></p>
            
            <div className="mb-4 flex items-center">
              <div className="text-yellow-500 mr-2">
                {'★'.repeat(Math.min(userRating, 5))}{'☆'.repeat(5 - Math.min(userRating, 5))}
              </div>
              <span>({userRating}/5)</span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div><span className="font-semibold">Status:</span> {book.status}</div>
              <div><span className="font-semibold">Category:</span> {book.category || (book.categories && book.categories.join(', ')) || 'Uncategorized'}</div>
              {book.dateFinished && (
                <div><span className="font-semibold">Date Finished:</span> {new Date(book.dateFinished).toLocaleDateString()}</div>
              )}
            </div>
            
            {/* Google Books additional information */}
            {googleBook && (
              <div className="mt-4 border-t pt-4">
                {googleBook.description && (
                  <div className="mb-3">
                    <h3 className="font-semibold mb-2">Description:</h3>
                    <p className="text-sm text-gray-700" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {googleBook.description}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {googleBook.publisher && (
                    <div><span className="font-semibold">Publisher:</span> {googleBook.publisher}</div>
                  )}
                  {googleBook.publishedDate && (
                    <div><span className="font-semibold">Published:</span> {googleBook.publishedDate}</div>
                  )}
                  {googleBook.pageCount && (
                    <div><span className="font-semibold">Pages:</span> {googleBook.pageCount}</div>
                  )}
                  {googleBook.categories && googleBook.categories.length > 0 && (
                    <div><span className="font-semibold">Google Categories:</span> {googleBook.categories.join(', ')}</div>
                  )}
                </div>
                
                {googleBook.previewLink && (
                  <div className="mt-4">
                    <a 
                      href={googleBook.previewLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
                    >
                      View on Google Books
                    </a>
                  </div>
                )}
              </div>
            )}
            
            {/* User notes */}
            {book.notes && (
              <div className="mt-4 border-t pt-4">
                <h3 className="font-semibold mb-2">My Notes:</h3>
                <p className="text-gray-700">{book.notes}</p>
              </div>
            )}
            
            {loading && (
              <div className="flex justify-center items-center mt-4 pt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Book Card component
const BookCard = ({ book, onViewDetails }: { book: Book, onViewDetails: (book: Book) => void }) => {
  // State to handle image loading errors
  const [imgError, setImgError] = useState(false);
  
  // Extract fields that might contain cover images
  const bookCover = book.imageUrl || 
    (book.imageLinks && book.imageLinks.thumbnail) || 
    (book.imageLinks && book.imageLinks.smallThumbnail) ||
    null;
    
  // Choose between book cover or standard placeholder
  const coverUrl = imgError || !bookCover
    ? 'https://via.placeholder.com/120x180?text=No+Cover' // Standard placeholder
    : bookCover;
  
  // Convert numerical rating to stars
  const userRating = typeof book.userRating === 'number' ? book.userRating : book.rating || 0;
  
  return (
    <div 
      className="book-card border border-gray-200 rounded-md p-3 flex flex-col hover:shadow-md transition-shadow h-full cursor-pointer"
      onClick={() => onViewDetails(book)}
    >
      <div className="book-image mb-2 self-center">
        <Image 
          src={coverUrl} 
          alt={book.title}
          width={120}
          height={180}
          style={{ objectFit: 'contain' }}
          className="rounded shadow-sm max-w-full"
          onError={() => setImgError(true)}
          priority={true}
        />
      </div>
      <div className="book-info flex-1 flex flex-col">
        <h3 className="font-semibold text-base line-clamp-1 mb-1">{book.title}</h3>
        <p className="text-gray-600 text-xs mb-1 line-clamp-1">by {book.author}</p>
        <div className="book-meta mt-auto flex flex-wrap gap-1 text-xs">
          <div className="w-full flex justify-between items-center mb-1">
            <span className="inline-block px-2 py-0.5 bg-green-50 text-green-800 rounded-full text-xs">
              {book.status}
            </span>
            <span className="text-yellow-500">
              {'★'.repeat(Math.min(userRating, 5))}{'☆'.repeat(5 - Math.min(userRating, 5))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function BooksList({ filters, className = '' }: BooksListProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalHits, setTotalHits] = useState(0);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const debouncedFilters = useRef(filters);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchInitialBooks = async () => {
      try {
        // Check if we have cached books in localStorage
        const cachedBooks = localStorage.getItem('cachedBooks');
        const cacheTimestamp = localStorage.getItem('booksCacheTimestamp');
        const now = new Date().getTime();
        const cacheAge = cacheTimestamp ? now - parseInt(cacheTimestamp) : Infinity;
        
        // Use cache if it exists and is less than 24 hours old
        if (cachedBooks && cacheAge < 24 * 60 * 60 * 1000) {
          console.log('Using cached books data');
          const parsedCache = JSON.parse(cachedBooks);
          setBooks(parsedCache.books || []);
          setTotalHits(parsedCache.totalHits || 0);
        } else {
          // Fetch from Algolia if cache is missing or outdated
          console.log('Fetching fresh books data from Algolia');
          const response = await booksIndex.search('', {
            hitsPerPage: 10,
            filters: ''
          });
          
          const hits = response.hits || [];
          const nbHits = response.nbHits || 0;
          
          // Store in state
          setBooks(hits as Book[]);
          setTotalHits(nbHits);
          
          // Update cache
          localStorage.setItem('cachedBooks', JSON.stringify({
            books: hits,
            totalHits: nbHits
          }));
          localStorage.setItem('booksCacheTimestamp', now.toString());
        }
      } catch (err) {
        console.error('Error loading books:', err);
        setError('Failed to load books. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialBooks();
  }, []);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      debouncedFilters.current = filters;
      
      const searchBooks = async () => {
        setLoading(true);
        setError('');
        
        try {
          // Log the exact filter string for debugging
          console.log('DEBUG FILTERS:', filters.filters);
          
          const searchParams: any = {
            hitsPerPage: 50
          };
          
          if (filters.filters) {
            searchParams.filters = filters.filters;
            
            // Debugging insight: see what the filter string looks like
            console.log(`DEBUG: Using filter string: ${filters.filters}`);
          }
          
          const response = await booksIndex.search(filters.search, searchParams);
          
          const hits = response.hits || [];
          const nbHits = response.nbHits || 0;
          
          setBooks(hits as Book[]);
          setTotalHits(nbHits);
        } catch (err) {
          console.error('Error searching books:', err);
          setError('Failed to search books. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      searchBooks();
    }, 300);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [filters]);
  
  if (loading) {
    return <div className="py-8 text-center">Loading books...</div>;
  }
  
  if (error) {
    return <div className="py-8 text-center text-red-500">{error}</div>;
  }
  
  if (books.length === 0) {
    return <div className="py-8 text-center">No books found matching your criteria.</div>;
  }
  
  // Handle view book details
  const handleViewBook = (book: Book) => {
    setSelectedBook(book);
  };

  // Handle close book details
  const handleCloseDetails = () => {
    setSelectedBook(null);
  };

  return (
    <div className={`books-list ${className}`}>
      <div className="mb-4 text-sm text-gray-500">{totalHits} books found</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {books.map(book => (
          <BookCard 
            key={book.objectID} 
            book={book} 
            onViewDetails={handleViewBook}
          />
        ))}
      </div>

      {/* Book Detail Modal */}
      {selectedBook && (
        <BookDetail 
          book={selectedBook} 
          onClose={handleCloseDetails} 
        />
      )}
    </div>
  );
}
