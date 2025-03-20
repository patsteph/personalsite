import { GetStaticProps } from 'next';
import Layout from '@/components/layout/Layout';
import SimpleBookGrid from '@/components/books/SimpleBookGrid';
import { getBooks, getBookStats } from '@/lib/books';
import { Book } from '@/types/book';
import { useTranslation } from '@/lib/translations';
import { useEffect, useState } from 'react';

// Props type definition
type BooksPageProps = {
  initialBooks: Book[];
  initialStats: {
    total: number;
    read: number;
    reading: number;
    toRead: number;
  };
};

export default function BooksPage({ initialBooks, initialStats }: BooksPageProps) {
  const { t } = useTranslation();
  const [stats, setStats] = useState(initialStats);
  
  // Refresh stats on client side
  useEffect(() => {
    async function refreshStats() {
      try {
        const freshStats = await getBookStats();
        setStats(freshStats);
      } catch (error) {
        console.error('Error refreshing book stats:', error);
      }
    }
    
    refreshStats();
  }, []);
  
  // Add script tag for Firebase check
  useEffect(() => {
    // Only run on client
    if (typeof window !== 'undefined') {
      // Add script to head
      const script = document.createElement('script');
      script.src = '/firebase-check.js';
      script.async = true;
      document.head.appendChild(script);
      
      // Clean up
      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
    
    // Return empty cleanup function for server-side rendering
    return () => {}; 
  }, []);

  return (
    <Layout section="books">
      <h1 className="text-3xl md:text-4xl font-bold text-accent mb-3">
        {t('books.title', 'My Book Collection')}
      </h1>
      
      {/* Book stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-steel-blue">{stats.total}</div>
          <div className="text-sm text-gray-600">{t('books.totalBooks', 'Total Books')}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.read}</div>
          <div className="text-sm text-gray-600">{t('books.read', 'Read')}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.reading}</div>
          <div className="text-sm text-gray-600">{t('books.reading', 'Currently Reading')}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats.toRead}</div>
          <div className="text-sm text-gray-600">{t('books.toRead', 'Want to Read')}</div>
        </div>
      </div>
      
      {/* Introduction */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <p className="text-steel-blue leading-relaxed">
          Browse my book collection to see what I've been reading. I believe in continuous learning 
          and often find inspiration in books related to technology, leadership, and business strategy. 
        </p>
      </div>
      
      {/* Use SimpleBookGrid for a more reliable and modern book display */}
      <SimpleBookGrid initialBooks={initialBooks} />
    </Layout>
  );
}

// Fetch data at build time
export const getStaticProps: GetStaticProps<BooksPageProps> = async () => {
  try {
    // Start with empty arrays - books will be loaded client-side from Firebase
    const emptyBooks: Book[] = [];
    
    // Default empty stats - will be updated client-side
    const defaultStats = {
      total: 0,
      read: 0,
      reading: 0,
      toRead: 0,
    };
    
    return {
      props: {
        initialBooks: emptyBooks,
        initialStats: defaultStats,
      }
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    
    // Return empty data on error
    return {
      props: {
        initialBooks: [],
        initialStats: {
          total: 0,
          read: 0,
          reading: 0,
          toRead: 0,
        },
      },
    };
  }
};