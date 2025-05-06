import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import BookRecommender from '@/components/books/BookRecommender';
import { Book } from '@/types/book';
import { useTranslation } from '@/lib/translations';
import { getAdminFirestore } from '@/lib/firebase-admin';
import BooksFilter from '../components/BooksFilter';
import BooksList from '../components/BooksList';

// Props type definition
type BooksPageProps = {
  initialStats: {
    total: number;
    read: number;
    reading: number;
    toRead: number;
  };
  error?: string; // Add optional error prop
};

export default function BooksPage({ initialStats, error }: BooksPageProps) {
  const { t } = useTranslation();
  const stats = initialStats;
  
  // State for book recommendations
  const [showRecommender, setShowRecommender] = useState<boolean>(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // State for Algolia search filters
  const [searchFilters, setSearchFilters] = useState({
    search: '',
    filters: ''
  });
  
  // Handle book selection for modals
  const handleViewBook = (book: Book) => {
    setSelectedBook(book);
  };

  // Handle filter changes from the BooksFilter component
  const handleFilterChange = (filters: any) => {
    setSearchFilters(filters);
  };

  // Handle potential error passed from getStaticProps
  if (error) {
    return (
      <Layout section="books">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">{t('books.title')}</h1>
          <p className="text-red-500">Error loading books: {error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout section="books">
      {/* Apply consistent H1 style */}
      <h1 className="text-3xl md:text-4xl font-bold text-accent mb-6">
        {t('books.title')}
      </h1>
      {/* Apply consistent intro paragraph style */}
      <p className="text-xl text-steel-blue mb-8"> 
        {t('books.intro', "Here's a look at the books I've read, am reading, and plan to tackle next.")}
      </p>

      {/* Stats Display */}
      <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-gray-200">
        {/* Subheading style seems consistent, keep as text-gray-700 */}
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Collection Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            {/* Revert stats colors */}
            <span className="block text-2xl font-bold text-indigo-600">{stats.total}</span>
            <span className="text-sm text-gray-600">Total Books</span>
          </div>
          <div>
            <span className="block text-2xl font-bold text-green-600">{stats.read}</span>
            <span className="text-sm text-gray-600">Read</span>
          </div>
          <div>
            <span className="block text-2xl font-bold text-yellow-600">{stats.reading}</span>
            <span className="text-sm text-gray-600">Currently Reading</span>
          </div>
          <div>
            <span className="block text-2xl font-bold text-purple-600">{stats.toRead}</span>
            <span className="text-sm text-gray-600">To Read</span>
          </div>
        </div>
      </div>

      {/* Filter Controls Section with Custom Algolia Components */}
      <div className="bg-slate-100 p-4 rounded-lg shadow-sm mb-8">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-700">Find Books</h2>
          <button
            onClick={() => setShowRecommender(!showRecommender)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showRecommender ? 'Hide AI Recommendations' : 'Get AI Recommendations'}
          </button>
        </div>
        
        <div className="books-container">
          <BooksFilter onFilterChange={handleFilterChange} />
          <BooksList filters={searchFilters} />
        </div>
      </div>

      {/* AI Book Recommender */}
      {showRecommender && (
        <BookRecommender 
          books={[]} // Algolia will handle book data
          onViewBook={handleViewBook}
        />
      )}
    </Layout>
  );
}

export async function getStaticProps() {
  try {
    const db = getAdminFirestore();
    
    // Get book collection stats
    const booksSnapshot = await db.collection('books').get();
    const allBooks = booksSnapshot.docs;
    
    // Calculate stats - account for different case variations
    const readBooks = allBooks.filter(doc => {
      const status = doc.data().status;
      return status === 'Read' || status === 'read';
    });
    const readingBooks = allBooks.filter(doc => {
      const status = doc.data().status;
      return status === 'Currently Reading' || status === 'reading' || status === 'currentlyReading';
    });
    const toReadBooks = allBooks.filter(doc => {
      const status = doc.data().status;
      return status === 'To Read' || status === 'toRead' || status === 'to read';
    });
    
    const initialStats = {
      total: allBooks.length,
      read: readBooks.length,
      reading: readingBooks.length,
      toRead: toReadBooks.length,
    };

    return {
      props: {
        initialStats,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error: any) {
    console.error('Books getStaticProps: Error fetching books:', error);
    // Return error state
    return {
      props: {
        initialBooks: [],
        initialStats: { total: 0, read: 0, reading: 0, toRead: 0 },
        totalBooks: 0,
        error: `Failed to load initial books: ${error.message || 'Unknown error'}`, // Pass error message
      },
      revalidate: 60, // Revalidate quickly after error
    };
  }
};