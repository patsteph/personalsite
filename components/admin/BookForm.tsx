import { useState } from 'react';
import { Book } from '@/types/book';
import { fetchBookByISBN, addBook, updateBook, deleteBook } from '@/lib/books';
import { useTranslation } from '@/lib/translations';

type BookFormProps = {
  existingBook?: Book;
  onSuccess?: () => void;
};

export default function BookForm({ existingBook, onSuccess }: BookFormProps) {
  const [isbn, setIsbn] = useState(existingBook?.isbn || '');
  const [status, setStatus] = useState(existingBook?.status || 'toRead');
  const [notes, setNotes] = useState(existingBook?.notes || '');
  const [bookData, setBookData] = useState<Partial<Book> | null>(existingBook || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { t } = useTranslation();
  
  // Look up book by ISBN
  const handleLookup = async () => {
    if (!isbn) {
      setError('Please enter an ISBN');
      return;
    }
    
    setLoading(true);
    setError('');
    
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
        status,
        notes,
        dateAdded: new Date().toISOString(),
      } as Book;
      
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
      setError('Error adding book. Please try again.');
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
            placeholder="Enter ISBN"
          />
          {!existingBook && (
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
          )}
        </div>
      </div>
      
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
              {bookData.categories && (
                <p className="text-xs text-gray-600 mt-1">{bookData.categories.join(', ')}</p>
              )}
            </div>
          </div>
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