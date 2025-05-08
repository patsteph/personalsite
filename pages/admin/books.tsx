import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import BookForm from '@/components/admin/BookForm';
import { useAuth } from '@/lib/hooks/useAuth';
import { getBooks, getBookById, deleteBook } from '@/lib/books';
import { Book } from '@/types/book';
import { useTranslation } from '@/lib/translations';

export default function AdminBooksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [pageLoading, setPageLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(true);
  
  // After auth state is determined, set page loading to false
  useEffect(() => {
    if (!loading) {
      setPageLoading(false);
      
      // If authenticated, load books
      if (user) {
        loadBooks();
      }
    }
  }, [loading, user]);
  
  // Load books from Firestore
  const loadBooks = async () => {
    try {
      const booksData = await getBooks();
      setBooks(booksData);
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };
  
  // Detect duplicate books in the collection
  const duplicateGroups = useMemo(() => {
    const duplicatesByIsbn = new Map<string, Book[]>();
    const duplicatesByTitle = new Map<string, Book[]>();
    
    // Group books by ISBN (ignore empty ISBNs)
    books.forEach(book => {
      if (book.isbn) {
        const normalizedIsbn = book.isbn.replace(/-/g, '').trim();
        if (normalizedIsbn) {
          const existing = duplicatesByIsbn.get(normalizedIsbn) || [];
          duplicatesByIsbn.set(normalizedIsbn, [...existing, book]);
        }
      }
    });
    
    // Group books by title (case insensitive)
    books.forEach(book => {
      if (book.title) {
        const normalizedTitle = book.title.toLowerCase().trim();
        if (normalizedTitle) {
          const existing = duplicatesByTitle.get(normalizedTitle) || [];
          duplicatesByTitle.set(normalizedTitle, [...existing, book]);
        }
      }
    });
    
    // Filter out groups with only one book
    return {
      byIsbn: Array.from(duplicatesByIsbn.values()).filter(group => group.length > 1),
      byTitle: Array.from(duplicatesByTitle.values()).filter(group => group.length > 1)
    };
  }, [books]);
  
  // Get all duplicate book IDs for highlighting
  const duplicateBookIds = useMemo(() => {
    const ids = new Set<string>();
    
    // Add ISBN duplicates
    duplicateGroups.byIsbn.forEach(group => {
      group.forEach(book => ids.add(book.id));
    });
    
    // Add title duplicates that aren't already counted
    duplicateGroups.byTitle.forEach(group => {
      group.forEach(book => ids.add(book.id));
    });
    
    return ids;
  }, [duplicateGroups]);
  
  // Handle successful login
  const handleLoginSuccess = () => {
    // Refresh the page to show the admin dashboard
    router.reload();
  };
  
  // Handle successful book operation
  const handleBookSuccess = () => {
    // Reload books
    loadBooks();
    // Reset selection
    setSelectedBook(null);
    setShowAddForm(false);
  };
  
  // Handle book selection
  const handleSelectBook = async (id: string) => {
    try {
      const book = await getBookById(id);
      if (book) {
        setSelectedBook(book);
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error fetching book:', error);
    }
  };
  
  // Handle book deletion
  const handleDeleteBook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) {
      return;
    }
    
    try {
      await deleteBook(id);
      handleBookSuccess();
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };
  
  // AdminLayout handles both loading and auth states for us
  return (
    <>
      <Head>
        <title>Book Management | Admin</title>
      </Head>
      
      <AdminLayout pageTitle="Book Management" loading={pageLoading || !user}>
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-accent mb-6">
          Book Management
        </h1>
        
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-600 text-sm">Total Books</p>
            <p className="text-2xl font-bold text-indigo-600">{books.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-600 text-sm">Read</p>
            <p className="text-2xl font-bold text-green-600">
              {books.filter(book => book.status === 'read').length}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-600 text-sm">Reading</p>
            <p className="text-2xl font-bold text-amber-600">
              {books.filter(book => book.status === 'reading').length}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-600 text-sm">To Read</p>
            <p className="text-2xl font-bold text-blue-600">
              {books.filter(book => book.status === 'to-read').length}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-600 text-sm">Duplicates</p>
            <p className="text-2xl font-bold text-red-600">
              {Object.values(duplicateGroups).flat().length}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-600 text-sm">Last 45 Days</p>
            <p className="text-2xl font-bold text-purple-600">
              {books.filter(book => {
                if (!book.dateAdded) return false;
                const now = new Date();
                const daysAgo45 = new Date();
                daysAgo45.setDate(now.getDate() - 45);
                return new Date(book.dateAdded) > daysAgo45;
              }).length}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Book list */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-steel-blue">
                  Books ({books.length})
                </h2>
                
                <button
                  onClick={() => {
                    setSelectedBook(null);
                    setShowAddForm(true);
                  }}
                  className="text-steel-blue hover:text-accent text-sm"
                >
                  + Add New Book
                </button>
              </div>
              
              {/* Duplicate information */}
              {duplicateBookIds.size > 0 && (
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-amber-700">
                    <span className="font-medium">{duplicateBookIds.size} potential duplicates found</span>
                  </div>
                  <button 
                    onClick={() => setShowDuplicates(!showDuplicates)}
                    className="text-xs text-gray-600 hover:text-steel-blue"
                  >
                    {showDuplicates ? 'Hide indicators' : 'Show indicators'}
                  </button>
                </div>
              )}
            </div>
            
            {books.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {books.map(book => (
                  <div 
                    key={book.id}
                    className={`
                      p-3 rounded-lg transition-colors
                      ${selectedBook?.id === book.id ? 'bg-light-accent border-l-4 border-steel-blue' : 'hover:bg-gray-50'}
                      ${showDuplicates && duplicateBookIds.has(book.id) ? 'border-l-4 border-amber-500' : ''}
                    `}
                  >
                    <div className="flex justify-between">
                      <div className="w-5/6 cursor-pointer" onClick={() => handleSelectBook(book.id)}>
                        <div className="font-medium truncate">
                          {book.title}
                          {showDuplicates && duplicateBookIds.has(book.id) && (
                            <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-md text-xs font-semibold">
                              Duplicate
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {book.authors.join(', ')}
                        </div>
                        <div className="flex mt-1">
                          <span className={`
                            text-xs px-2 py-0.5 rounded-full
                            ${book.status === 'to-read' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${book.status === 'reading' ? 'bg-blue-100 text-blue-800' : ''}
                            ${book.status === 'read' ? 'bg-green-100 text-green-800' : ''}
                          `}>
                            {book.status === 'read' ? 'Read' : 
                             book.status === 'reading' ? 'Reading' : 'To Read'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBook(book.id);
                          }}
                          className="text-red-500 hover:text-red-700"
                          aria-label="Delete book"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No books in your collection yet.
              </div>
            )}
          </div>
        </div>
        
        {/* Book form */}
        <div className="md:col-span-2">
          {showAddForm ? (
            <BookForm onSuccess={handleBookSuccess} />
          ) : selectedBook ? (
            <BookForm existingBook={selectedBook} onSuccess={handleBookSuccess} />
          ) : (
            <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <p className="mb-4">Select a book to edit or add a new one.</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Add New Book
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </AdminLayout>
    </>
  );
}