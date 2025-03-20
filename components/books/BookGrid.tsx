import { useState, useEffect, useMemo } from 'react';
import { Book, BookFilter, BookSortOption, BookStatus } from '@/types/book';
import { getBooks } from '@/lib/books';
import BookSpine from './BookSpine';
import BookDetails from './BookDetails';
import { useTranslation } from '@/lib/translations';

type BookGridProps = {
  initialBooks?: Book[];
};

export default function BookGrid({ initialBooks }: BookGridProps) {
  const [allBooks, setAllBooks] = useState<Book[]>(initialBooks || []);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [filter, setFilter] = useState<BookFilter>('all');
  const [sortBy, setSortBy] = useState<BookSortOption>('title');
  const [loading, setLoading] = useState(!initialBooks);
  const { t } = useTranslation();
  
  // Fetch books when component mounts
  useEffect(() => {
    async function loadBooks() {
      setLoading(true);
      try {
        console.log('Loading books - will attempt Firebase but fallback to sample data');
        
        // Get all books from Firebase - will fall back to sample books if none found
        try {
          const bookData = await getBooks();
          console.log('Loaded books from Firebase:', bookData);
          
          // Ensure we always have books to display
          if (bookData && bookData.length > 0) {
            setAllBooks(bookData);
            return; // Successfully loaded books from Firebase
          }
          console.warn('No books returned from Firebase');
        } catch (firebaseError) {
          console.error('Error loading books from Firebase:', firebaseError);
        }
        
        // If we get here, Firebase loading failed - use empty array
        console.log('Firebase loading failed, using empty array');
        setAllBooks([]);
      } catch (error) {
        console.error('Top-level error loading books:', error);
        // Use empty array as fallback
        console.log('Error loading books, using empty array');
        setAllBooks([]);
      } finally {
        setLoading(false);
      }
    }
    
    // Always reload books even if initialBooks is provided
    loadBooks();
  }, []); 

  // Apply filters and sorting
  const filteredAndSortedBooks = useMemo(() => {
    // Apply filter
    let result = [...allBooks];
    if (filter !== 'all') {
      result = result.filter(book => book.status === filter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'author') {
        return a.authors[0]?.localeCompare(b.authors[0] || '') || 0;
      } else if (sortBy === 'genre') {
        return (a.categories?.[0] || '').localeCompare(b.categories?.[0] || '');
      } else if (sortBy === 'rating') {
        const ratingA = a.userRating || a.averageRating || 0;
        const ratingB = b.userRating || b.averageRating || 0;
        return ratingB - ratingA; // Descending order for ratings
      }
      return 0;
    });
    
    return result;
  }, [allBooks, filter, sortBy]);
  
  return (
    <div className="space-y-8">
      {/* Controls for filtering and sorting */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="book-filter" className="text-sm font-medium">
              {t('books.view', 'View:')}
            </label>
            <select 
              id="book-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as BookFilter)}
              className="px-3 py-2 rounded border border-steel-blue bg-linen text-sm"
            >
              <option value="all">{t('books.all', 'All Books')}</option>
              <option value="read">{t('books.read', 'Read')}</option>
              <option value="reading">{t('books.reading', 'Currently Reading')}</option>
              <option value="toRead">{t('books.toRead', 'Want to Read')}</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="book-sort" className="text-sm font-medium">
              {t('books.sortBy', 'Sort By:')}
            </label>
            <select 
              id="book-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as BookSortOption)}
              className="px-3 py-2 rounded border border-steel-blue bg-linen text-sm"
            >
              <option value="title">{t('books.title', 'Title')}</option>
              <option value="author">{t('books.author', 'Author')}</option>
              <option value="genre">{t('books.genre', 'Genre')}</option>
              <option value="rating">{t('books.rating', 'Rating')}</option>
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-steel-blue border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-gray-600">Loading books...</p>
        </div>
      ) : (
        <>
          {/* Book Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredAndSortedBooks.map(book => (
              <BookSpine
                key={book.id}
                book={book}
                onClick={() => setSelectedBook(book)}
              />
            ))}
          </div>
          
          {/* Selected book details */}
          {selectedBook && (
            <BookDetails 
              book={selectedBook} 
              onClose={() => setSelectedBook(null)} 
            />
          )}
          
          {/* Empty state */}
          {filteredAndSortedBooks.length === 0 && (
            <div className="py-8 text-center bg-white rounded-lg shadow">
              <p className="text-xl text-gray-700">No books found in your collection.</p>
              <p className="mt-2 text-gray-600">
                {filter === 'all' 
                  ? 'Add some books to see them here!'
                  : `No books with "${filter}" status found. Try another filter.`}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}