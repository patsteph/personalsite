import { useState, useEffect, useMemo } from 'react';
import { Book, BookFilter, BookSortOption } from '@/types/book';
import { getBooks } from '@/lib/books';
import BookSpine from './BookSpine';
import BookDetails from './BookDetails';
import { useTranslation } from '@/lib/translations';
import { useAuth } from '@/lib/auth';
import AdminButton from '../ui/AdminButton';

type BookshelfProps = {
  initialBooks?: Book[];
  booksPerShelf?: number;
};

export default function Bookshelf({ initialBooks, booksPerShelf = 16 }: BookshelfProps) {
  const [allBooks, setAllBooks] = useState<Book[]>(initialBooks || []);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [filter, setFilter] = useState<BookFilter>('all');
  const [sortBy, setSortBy] = useState<BookSortOption>('title');
  const [loading, setLoading] = useState(!initialBooks);
  
  // Skip translations temporarily to avoid build errors
  const t = (key: string, fallback: string) => fallback;
  const { user } = useAuth();
  
  // Fetch books when component mounts or filter/sort changes
  useEffect(() => {
    async function loadBooks() {
      setLoading(true);
      try {
        // Get all books from Firebase
        const bookData = await getBooks();
        console.log('Loaded books:', bookData);
        setAllBooks(bookData);
      } catch (error) {
        console.error('Error loading books:', error);
      } finally {
        setLoading(false);
      }
    }
    
    // Always reload books even if initialBooks is provided
    loadBooks();
  }, []); // Remove filter and sortBy dependencies to prevent constant reloading

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
  
  // Calculate how many shelves we need (reduced books per shelf to 12 for covers)
  const booksPerShelfForCovers = 12;
  const shelfCount = Math.max(1, Math.ceil(filteredAndSortedBooks.length / booksPerShelfForCovers));
  
  // Get books to display on each shelf
  const getBooksForShelf = (shelfIndex: number) => {
    const start = shelfIndex * booksPerShelfForCovers;
    const end = start + booksPerShelfForCovers;
    return filteredAndSortedBooks.slice(start, end);
  };
  
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
          {/* Bookshelves */}
          {Array.from({ length: shelfCount }).map((_, shelfIndex) => {
            // Get books for this shelf
            const shelfBooks = getBooksForShelf(shelfIndex);
            
            return (
              <div 
                key={`shelf-${shelfIndex}`} 
                className="min-h-[11rem] bg-amber-900 rounded relative flex flex-wrap items-end justify-center px-2 py-2 shadow-lg after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-2 after:-mb-2 after:bg-amber-950 after:rounded-b"
              >
                {/* Books on this shelf */}
                {shelfBooks.map(book => {
                  // Ensure book has an authors array before rendering
                  const safeBook = {
                    ...book,
                    authors: Array.isArray(book.authors) ? book.authors : ['Unknown Author']
                  };
                  
                  return (
                    <BookSpine
                      key={book.id}
                      book={safeBook}
                      onClick={() => setSelectedBook(safeBook)}
                    />
                  );
                })}
              </div>
            );
          })}
          
          {/* Selected book details */}
          {selectedBook && (
            <BookDetails 
              book={selectedBook} 
              onClose={() => setSelectedBook(null)} 
            />
          )}
          
          {/* Empty state */}
          {filteredAndSortedBooks.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-xl text-gray-700">No books found in your collection.</p>
              <p className="mt-2 text-gray-600">Add some books to see them on your shelves!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}