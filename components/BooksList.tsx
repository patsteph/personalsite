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
};

type BooksListProps = {
  filters: {
    search: string;
    filters: string;
  };
  className?: string;
};

const BookCard = ({ book }: { book: Book }) => {
  return (
    <div className="book-card">
      {book.imageUrl && (
        <div className="book-image">
          <Image 
            src={book.imageUrl} 
            alt={book.title}
            width={100}
            height={150}
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}
      <div className="book-info">
        <h3>{book.title}</h3>
        <p className="author">by {book.author}</p>
        <div className="book-meta">
          <span className="category">{book.category || (book.categories ? book.categories[0] : '')}</span>
          <span className="status">{book.status}</span>
          <span className="rating">{'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}</span>
        </div>
      </div>
    </div>
  );
};

export default function BooksList({ filters, className = '' }: BooksListProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalHits, setTotalHits] = useState(0);
  const debouncedFilters = useRef(filters);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map(book => (
          <BookCard key={book.objectID} book={book} />
        ))}
      </div>
    </div>
  );
}
