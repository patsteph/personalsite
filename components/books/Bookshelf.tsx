import { useState, useEffect } from 'react';
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
  const [books, setBooks] = useState<Book[]>(initialBooks || []);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [filter, setFilter] = useState<BookFilter>('all');
  const [sortBy, setSortBy] = useState<BookSortOption>('title');
  const [loading, setLoading] = useState(!initialBooks);
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Fetch books when filter or sorting changes
  useEffect(() => {
    if (initialBooks && !loading) {
      return; // Skip fetching if initialBooks were provided and not in loading state
    }
    
    async function loadBooks() {
      setLoading(true);
      try {
        const bookData = await getBooks(filter, sortBy);
        setBooks(bookData);
      } catch (error) {
        console.error('Error loading books:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadBooks();
  }, [filter, sortBy, initialBooks, loading]);
  
  // Calculate how many shelves we need
  const shelfCount = Math.max(1, Math.ceil(books.length / booksPerShelf));
  
  // Get books to display on each shelf
  const getBooksForShelf = (shelfIndex: number) => {
    const start = shelfIndex * booksPerShelf;
    const end = start + booksPerShelf;
    return books.slice(start, end);
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
        
        {/* Admin button (only shown if user is authenticated) */}
        {user && <AdminButton />}
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
                className="h-44 bg-amber-900 rounded relative flex items-end px-2 shadow-lg after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-2 after:-mb-2 after:bg-amber-950 after:rounded-b"
              >
                {/* Books on this shelf */}
                {shelfBooks.map(book => (
                  <BookSpine
                    key={book.id}
                    book={book}
                    onClick={() => setSelectedBook(book)}
                  />
                ))}
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
          {books.length === 0 && (
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