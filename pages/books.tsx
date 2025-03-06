import { GetStaticProps } from 'next';
import Layout from '@/components/layout/Layout';
import Bookshelf from '@/components/books/Bookshelf';
import { getBooks, getBookStats } from '@/lib/books';
import { Book } from '@/types/book';
import { useTranslation } from '@/lib/translations';

// Props type definition
type BooksPageProps = {
  initialBooks: Book[];
  stats: {
    total: number;
    read: number;
    reading: number;
    toRead: number;
  };
};

export default function BooksPage({ initialBooks, stats }: BooksPageProps) {
  const { t } = useTranslation();
  
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
          Browse my virtual bookshelf to see what I've been reading. I believe in continuous learning 
          and often find inspiration in books related to technology, leadership, and business strategy. 
          You can filter by reading status or sort by different criteria to explore the collection.
        </p>
      </div>
      
      {/* Bookshelf component */}
      <Bookshelf initialBooks={initialBooks} booksPerShelf={16} />
    </Layout>
  );
}

// Fetch data at build time
export const getStaticProps: GetStaticProps<BooksPageProps> = async () => {
  try {
    // Get all books (for initial static generation)
    const books = await getBooks();
    
    // Get book statistics
    const stats = await getBookStats();
    
    return {
      props: {
        initialBooks: books,
        stats,
      },
    };
  } catch (error) {
    console.error('Error fetching book data:', error);
    
    // Return empty data on error
    return {
      props: {
        initialBooks: [],
        stats: {
          total: 0,
          read: 0,
          reading: 0,
          toRead: 0,
        },
      },
      // Retry sooner on error
      revalidate: 60,
    };
  }
};