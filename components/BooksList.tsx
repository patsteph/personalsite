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
  imageUrl?: string;
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

const BookCard = ({ book }: { book: Book }) => {
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
  
  return (
    <div className="book-card border border-gray-200 rounded-md p-3 flex flex-col hover:shadow-md transition-shadow h-full">
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
        <h3 className="font-semibold text-base line-clamp-2 mb-1">{book.title}</h3>
        <p className="text-gray-600 text-xs mb-2 line-clamp-1">by {book.author}</p>
        <div className="book-meta mt-auto flex flex-wrap gap-2 text-xs">
          <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-800 rounded-full">
            {book.category || (book.categories && book.categories.length > 0 ? book.categories[0] : 'Uncategorized')}
          </span>
          <span className="inline-block px-2 py-0.5 bg-green-50 text-green-800 rounded-full">
            {book.status || 'Unspecified'}
          </span>
          <span className="text-yellow-500">
            {'★'.repeat(Math.min(book.rating || 0, 5))}{'☆'.repeat(5 - Math.min(book.rating || 0, 5))}
          </span>
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
  const debouncedFilters = useRef(filters);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load initial sample of books, using localStorage to reduce API calls
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
          const searchParams: any = {
            hitsPerPage: 50
          };
          
          if (filters.filters) {
            searchParams.filters = filters.filters;
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
  
  return (
    <div className={`books-list ${className}`}>
      <div className="mb-4 text-sm text-gray-500">{totalHits} books found</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {books.map(book => (
          <BookCard key={book.objectID} book={book} />
        ))}
      </div>
    </div>
  );
}
