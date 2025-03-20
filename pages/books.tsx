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
    // For simplicity and to avoid SSG serialization issues, 
    // provide sample books in case Firebase connection fails
    // The actual books will be loaded client-side when Firebase is available
    
    // Sample books to ensure page renders with content if Firebase fails
    const sampleBooks: Book[] = [
      {
        id: 'sample1',
        isbn: '9780553380958',
        title: 'A Brief History of Time',
        authors: ['Stephen Hawking'],
        publisher: 'Bantam',
        publishedDate: '1998-09-01',
        description: 'A landmark volume in science writing by one of the great minds of our time.',
        pageCount: 212,
        categories: ['Science', 'Physics'],
        imageLinks: {
          thumbnail: 'https://books.google.com/books/content?id=mZ8r9blrCIUC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
        },
        status: 'read',
        dateAdded: '2023-01-01T00:00:00.000Z'
      },
      {
        id: 'sample2',
        isbn: '9780060959470',
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        authors: ['Robert C. Martin'],
        publisher: 'Prentice Hall',
        publishedDate: '2008-08-01',
        description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.",
        pageCount: 464,
        categories: ['Computers', 'Software Development'],
        status: 'read',
        dateAdded: '2023-01-02T00:00:00.000Z'
      },
      {
        id: 'sample3',
        isbn: '9781449371876',
        title: 'Learning JavaScript Design Patterns',
        authors: ['Addy Osmani'],
        publisher: "O'Reilly Media",
        publishedDate: '2012-07-01',
        description: "With Learning JavaScript Design Patterns, you'll learn how to write beautiful, structured, and maintainable JavaScript.",
        pageCount: 254,
        categories: ['Computers', 'Web Development'],
        status: 'reading',
        dateAdded: '2023-01-03T00:00:00.000Z'
      }
    ];
    
    // Get book statistics or generate sample ones
    let stats;
    try {
      stats = await getBookStats();
    } catch (error) {
      stats = {
        total: sampleBooks.length,
        read: sampleBooks.filter(b => b.status === 'read').length,
        reading: sampleBooks.filter(b => b.status === 'reading').length,
        toRead: sampleBooks.filter(b => b.status === 'toRead').length,
      };
    }
    
    return {
      props: {
        initialBooks: sampleBooks,
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