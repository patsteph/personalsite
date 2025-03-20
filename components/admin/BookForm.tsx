import { useState } from 'react';
import { Book } from '@/types/book';
import { fetchBookByISBN, searchBooks, addBook, updateBook, deleteBook } from '@/lib/books';
import { useTranslation } from '@/lib/translations';

type BookFormProps = {
  existingBook?: Book;
  onSuccess?: () => void;
};

export default function BookForm({ existingBook, onSuccess }: BookFormProps) {
  const [isbn, setIsbn] = useState(existingBook?.isbn || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState(existingBook?.status || 'toRead');
  const [notes, setNotes] = useState(existingBook?.notes || '');
  const [bookData, setBookData] = useState<Partial<Book> | null>(existingBook || null);
  const [searchResults, setSearchResults] = useState<Partial<Book>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchMode, setSearchMode] = useState<'isbn' | 'title'>('isbn'); // Track which search mode we're in
  const { t } = useTranslation();
  
  // Look up book by ISBN
  const handleLookup = async () => {
    if (!isbn) {
      setError('Please enter an ISBN');
      return;
    }
    
    setLoading(true);
    setError('');
    setSearchResults([]);
    
    try {
      const data = await fetchBookByISBN(isbn);
      if (data) {
        setBookData(data);
      } else {
        setError('Book not found. Please check the ISBN and try again.');
      }
    } catch (error) {
      console.error('Error looking up book:', error);
      setError('Error looking up book. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Search books by title or author
  const handleSearch = async () => {
    if (!searchQuery) {
      setError('Please enter a search term');
      return;
    }
    
    setLoading(true);
    setError('');
    setBookData(null);
    
    try {
      const results = await searchBooks(searchQuery);
      if (results && results.length > 0) {
        setSearchResults(results);
      } else {
        setSearchResults([]);
        setError('No books found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Error searching books:', error);
      setError('Error searching books. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Select a book from search results
  const handleSelectBook = (book: Partial<Book>) => {
    setBookData(book);
    setSearchResults([]);
  };
  
  // Add book to collection
  const handleAddBook = async () => {
    if (!bookData) {
      setError('Please look up a book first');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const completeBookData = {
        ...bookData,
        ...(bookData.averageRating !== undefined ? {} : { averageRating: null }),
        status,
        notes,
        dateAdded: new Date().toISOString(),
      } as Book;
      
      if (completeBookData.averageRating !== undefined) {
        // Convert to number if it's a string
        const rating = Number(completeBookData.averageRating);
        
        // Check if it's a valid number
        if (isNaN(rating)) {
          throw new Error("Rating must be a valid number");
        }
        
        // Ensure it's within expected range (typically 0-5)
        if (rating < 0 || rating > 5) {
          console.warn(`Rating outside normal range: ${rating}, adjusting to limit`);
          completeBookData.averageRating = Math.max(0, Math.min(5, rating));
        } else {
          // Store as number, not string
          completeBookData.averageRating = rating;
        }
      } else {
        // Ensure null for missing ratings
        completeBookData.averageRating = undefined;
      }
      
      // Log the sanitized data to help with debugging
      console.log("Formatted book data:", completeBookData);

      await addBook(completeBookData);
      setSuccess('Book added successfully!');
      
      // Reset form
      setIsbn('');
      setStatus('toRead');
      setNotes('');
      setBookData(null);
      
      // Call success callback
    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    console.error('Error adding book:', error);
    setError(`Error adding book: ${error instanceof Error ? error.message : 'Please try again.'}`);
  } finally {
    setLoading(false);
  }
};
  
  // Update existing book
  const handleUpdateBook = async () => {
    if (!existingBook) {
      setError('No book to update');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await updateBook(existingBook.id, {
        status,
        notes,
      });
      
      setSuccess('Book updated successfully!');
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating book:', error);
      setError('Error updating book. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete book
  const handleDeleteBook = async () => {
    if (!existingBook) {
      return;
    }
    
    if (!confirm('Are you sure you want to delete this book?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await deleteBook(existingBook.id);
      setSuccess('Book deleted successfully!');
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      setError('Error deleting book. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-accent mb-6">
        {existingBook ? t('admin.bookManagement', 'Edit Book') : t('admin.bookManagement', 'Add New Book')}
      </h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {!existingBook && (
        <div className="mb-4">
          <div className="flex mb-4">
            <button
              type="button"
              onClick={() => setSearchMode('isbn')}
              className={`flex-1 py-2 px-4 rounded-l-md ${
                searchMode === 'isbn'
                  ? 'bg-steel-blue text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('admin.searchByIsbn', 'Search by ISBN')}
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('title')}
              className={`flex-1 py-2 px-4 rounded-r-md ${
                searchMode === 'title'
                  ? 'bg-steel-blue text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('admin.searchByTitle', 'Search by Title/Author')}
            </button>
          </div>
        </div>
      )}
      
      {searchMode === 'isbn' && !existingBook ? (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('admin.isbn', 'ISBN:')}
          </label>
          <div className="flex">
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              disabled={!!existingBook}
              className={`
                flex-grow px-3 py-2 border border-gray-300 rounded-l-md 
                focus:outline-none focus:ring-steel-blue focus:border-steel-blue
                ${existingBook ? 'bg-gray-100' : ''}
              `}
              placeholder="Enter ISBN (e.g., 9780061122415)"
            />
            <button
              type="button"
              onClick={handleLookup}
              disabled={loading || !isbn}
              className={`
                bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded-r-md
                transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue
                ${(loading || !isbn) ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {loading ? 'Loading...' : t('admin.lookup', 'Lookup')}
            </button>
          </div>
        </div>
      ) : (!existingBook && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('admin.searchQuery', 'Title or Author:')}
          </label>
          <div className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-steel-blue focus:border-steel-blue"
              placeholder="Enter title or author name"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading || !searchQuery}
              className={`
                bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded-r-md
                transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue
                ${(loading || !searchQuery) ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {loading ? 'Searching...' : t('admin.search', 'Search')}
            </button>
          </div>
        </div>
      ))}
      
      {/* Display search results if we have them */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">{t('admin.searchResults', 'Search Results:')}</h3>
          <div className="max-h-80 overflow-y-auto">
            {searchResults.map((book, index) => (
              <div 
                key={`${book.isbn || ''}-${index}`}
                className="flex items-start p-3 border-b border-gray-200 hover:bg-light-accent cursor-pointer"
                onClick={() => handleSelectBook(book)}
              >
                <div className="flex-shrink-0 w-12 h-16 mr-3 bg-gray-200 flex items-center justify-center">
                  {book.imageLinks?.thumbnail ? (
                    <img 
                      src={book.imageLinks.thumbnail} 
                      alt={`Cover of ${book.title}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-500">No Cover</span>
                  )}
                </div>
                <div className="flex-grow">
                  <h4 className="font-medium">{book.title}</h4>
                  <p className="text-sm text-gray-600">{book.authors?.join(', ')}</p>
                  {book.publishedDate && <p className="text-xs text-gray-500">{book.publishedDate}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Display selected book details */}
      {bookData && (
        <div className="mb-6 p-4 bg-light-accent rounded-lg">
          <div className="flex items-start">
            {bookData.imageLinks?.thumbnail && (
              <img
                src={bookData.imageLinks.thumbnail}
                alt={`Cover of ${bookData.title}`}
                className="w-20 h-auto mr-4"
              />
            )}
            <div>
              <h3 className="font-bold text-lg">{bookData.title}</h3>
              <p className="text-sm">{bookData.authors?.join(', ')}</p>
              {bookData.publisher && (
                <p className="text-xs text-gray-600">{bookData.publisher}, {bookData.publishedDate}</p>
              )}
              {bookData.categories && (
                <p className="text-xs text-gray-600 mt-1">{bookData.categories.join(', ')}</p>
              )}
              {bookData.isbn && (
                <p className="text-xs text-gray-600 mt-1">ISBN: {bookData.isbn}</p>
              )}
            </div>
          </div>
          {bookData.description && (
            <div className="mt-3 text-sm max-h-32 overflow-y-auto">
              <p>{bookData.description}</p>
            </div>
          )}
        </div>
      )}
      
      <div className="mb-4">
        <label 
          htmlFor="status" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t('admin.status', 'Reading Status:')}
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-steel-blue focus:border-steel-blue"
        >
          <option value="read">{t('books.read', 'Read')}</option>
          <option value="reading">{t('books.reading', 'Currently Reading')}</option>
          <option value="toRead">{t('books.toRead', 'Want to Read')}</option>
        </select>
      </div>
      
      <div className="mb-6">
        <label 
          htmlFor="notes" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t('admin.notes', 'Your Notes:')}
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-steel-blue focus:border-steel-blue"
          placeholder="Your thoughts about this book..."
        />
      </div>
      
      <div className="flex justify-between">
        {existingBook ? (
          <>
            <button
              type="button"
              onClick={handleUpdateBook}
              disabled={loading}
              className={`
                bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded
                transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue
                ${loading ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {loading ? 'Saving...' : t('admin.update', 'Update Book')}
            </button>
            
            <button
              type="button"
              onClick={handleDeleteBook}
              disabled={loading}
              className={`
                bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded
                transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600
                ${loading ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {loading ? 'Deleting...' : t('admin.delete', 'Delete Book')}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleAddBook}
            disabled={loading || !bookData}
            className={`
              bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded
              transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue
              ${(loading || !bookData) ? 'opacity-70 cursor-not-allowed' : ''}
            `}
          >
            {loading ? 'Adding...' : t('admin.add', 'Add to Collection')}
          </button>
        )}
      </div>
    </div>
  );
}