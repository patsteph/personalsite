import { GetStaticProps } from 'next';
import Layout from '@/components/layout/Layout';
import BookGrid from '@/components/books/BookGrid';
import DirectBookGrid from '@/components/books/DirectBookGrid';
import { getBooks, getBookStats } from '@/lib/books';
import { Book } from '@/types/book';
import { useTranslation } from '@/lib/translations';
import { useEffect, useState } from 'react';
import Script from 'next/script';

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
      {/* Inline configuration backup script */}
      <Script id="config-backup" strategy="beforeInteractive">
        {`
          // Ensure runtimeConfig exists
          if (typeof window !== 'undefined' && !window.runtimeConfig) {
            console.log('Creating fallback runtimeConfig');
            window.runtimeConfig = {
              firebase: {
                projectId: "personalsite-19189",
                apiKey: "AIzaSyD4a8iaxHP9xPGV5tR5LwvzDVa5Y9o5wGQ",
                authDomain: "personalsite-19189.firebaseapp.com",
                storageBucket: "personalsite-19189.appspot.com",
                messagingSenderId: "892517360036",
                appId: "1:892517360036:web:36dda234d9f3f79562e131"
              },
              isProduction: true,
              basePath: ""
            };
          }
          
          // Ensure SECURE_CONFIG exists
          if (typeof window !== 'undefined' && !window.SECURE_CONFIG) {
            console.log('Creating fallback SECURE_CONFIG');
            window.SECURE_CONFIG = {
              firebase: {
                projectId: "personalsite-19189",
                apiKey: "AIzaSyD4a8iaxHP9xPGV5tR5LwvzDVa5Y9o5wGQ",
                authDomain: "personalsite-19189.firebaseapp.com",
                storageBucket: "personalsite-19189.appspot.com",
                messagingSenderId: "892517360036",
                appId: "1:892517360036:web:36dda234d9f3f79562e131"
              },
              basePath: ""
            };
          }
        `}
      </Script>
      
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
      
      {/* Use DirectBookGrid as a more reliable fallback */}
      <DirectBookGrid initialBooks={initialBooks} />
    </Layout>
  );
}

// Fetch data at build time
export const getStaticProps: GetStaticProps<BooksPageProps> = async () => {
  try {
    // For simplicity and to avoid SSG serialization issues, 
    // return empty array for initialBooks
    // The actual books will be loaded client-side
    
    // Get book statistics
    const stats = await getBookStats();
    
    return {
      props: {
        initialBooks: [], // Empty array to avoid serialization issues
        initialStats: stats,
      }
    };
  } catch (error) {
    console.error('Error fetching book data:', error);
    
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