import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import LoginForm from '@/components/admin/LoginForm';
import BookForm from '@/components/admin/BookForm';
import { useAuth } from '@/lib/auth';
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
  
  // Handle book deletion (commented out for now until UI wires it up)
  const _handleDeleteBook = async (id: string) => {
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
  
  if (pageLoading) {
    return (
      <Layout section="admin">
        <div className="flex justify-center items-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-steel-blue border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      </Layout>
    );
  }
  
  // If not authenticated, show login form
  if (!user) {
    return (
      <Layout section="admin">
        <h1 className="text-3xl md:text-4xl font-bold text-accent mb-8">
          {t('admin.login', 'Admin Login')}
        </h1>
        
        <LoginForm onSuccess={handleLoginSuccess} />
      </Layout>
    );
  }
  
  // If authenticated, show book management
  return (
    <Layout 
      section="admin"
      title="Book Management"
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-accent">
          Book Management
        </h1>
        
        <Link
          href="/admin"
          className="inline-flex items-center text-steel-blue hover:text-accent transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Book list */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
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
            
            {books.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {books.map(book => (
                  <div 
                    key={book.id}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-colors
                      ${selectedBook?.id === book.id ? 'bg-light-accent border-l-4 border-steel-blue' : 'hover:bg-gray-50'}
                    `}
                    onClick={() => handleSelectBook(book.id)}
                  >
                    <div className="font-medium truncate">{book.title}</div>
                    <div className="text-sm text-gray-600 truncate">
                      {book.authors.join(', ')}
                    </div>
                    <div className="flex mt-1">
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full
                        ${book.status === 'read' ? 'bg-green-100 text-green-800' : ''}
                        ${book.status === 'reading' ? 'bg-blue-100 text-blue-800' : ''}
                        ${book.status === 'toRead' ? 'bg-yellow-100 text-yellow-800' : ''}
                      `}>
                        {book.status === 'read' ? 'Read' : 
                         book.status === 'reading' ? 'Reading' : 'To Read'}
                      </span>
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
    </Layout>
  );
}