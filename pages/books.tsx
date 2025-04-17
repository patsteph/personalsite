import { GetStaticProps } from 'next';
import { useState, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import SimpleBookGrid from '@/components/books/SimpleBookGrid';
import { Book } from '@/types/book';
import { useTranslation } from '@/lib/translations';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { Timestamp, QueryDocumentSnapshot, Query } from 'firebase-admin/firestore';

const BOOKS_PER_PAGE = 24; // Define page size

// Props type definition
type BooksPageProps = {
  initialBooks: Book[];
  initialStats: {
    total: number;
    read: number;
    reading: number;
    toRead: number;
  };
  // Add total count for pagination awareness on client
  totalBooks: number;
  error?: string; // Add optional error prop
};

export default function BooksPage({ initialBooks, initialStats, totalBooks, error }: BooksPageProps) {
  const { t } = useTranslation();
  const stats = initialStats;

  // --- Filter State ---
  const [statusFilter, setStatusFilter] = useState<string>(''); // 'Read', 'Currently Reading', 'To Read', or ''
  const [ratingFilter, setRatingFilter] = useState<number | ''>(''); // 1-5 or ''
  const [genreFilter, setGenreFilter] = useState<string>(''); // genre string or ''

  // Extract unique genres from initial books for the dropdown
  const genres = useMemo(() => {
    const allGenres = initialBooks.flatMap(book => book.genres || []);
    // Use Set for uniqueness and filter out any empty/null values
    return [...new Set(allGenres)].filter(Boolean).sort();
  }, [initialBooks]);
  // --- End Filter State ---

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

      {/* Filter Controls Section */}
      <div className="bg-slate-100 p-4 rounded-lg shadow-sm mb-8 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="Read">Read</option>
              <option value="Currently Reading">Currently Reading</option>
              <option value="To Read">To Read</option>
            </select>
          </div>

          {/* Rating Filter/Sort */}
          <div>
            <label htmlFor="rating-filter" className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
            <select
              id="rating-filter"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value ? parseInt(e.target.value) : '')}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">Any Rating</option>
              <option value="5">★★★★★</option>
              <option value="4">★★★★☆ & Up</option>
              <option value="3">★★★☆☆ & Up</option>
              <option value="2">★★☆☆☆ & Up</option>
              <option value="1">★☆☆☆☆ & Up</option>
            </select>
          </div>

          {/* Genre Filter */}
          <div>
            <label htmlFor="genre-filter" className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
            <select
              id="genre-filter"
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">All Genres</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pass filters and totalBooks to SimpleBookGrid */}
      <SimpleBookGrid
        initialBooks={initialBooks} // Still pass initial for first load
        totalBooks={totalBooks}
        statusFilter={statusFilter}
        ratingFilter={ratingFilter}
        genreFilter={genreFilter}
      />
    </Layout>
  );
}

// Helper function to safely convert potential Timestamp object to ISO string
const toISOString = (dateValue: any): string | null => {
  if (!dateValue) return null;
  // Check for Firestore Timestamp structure (_seconds or seconds)
  const seconds = dateValue.seconds ?? dateValue._seconds;
  const nanoseconds = dateValue.nanoseconds ?? dateValue._nanoseconds;
  if (typeof seconds === 'number' && typeof nanoseconds === 'number') {
    return new Date(seconds * 1000 + nanoseconds / 1000000).toISOString();
  }
  // Check if it's already a Date object or ISO string
  if (dateValue instanceof Date) return dateValue.toISOString();
  if (typeof dateValue === 'string') return dateValue; // Assume it's already ISO
  return null; // Cannot convert
};

// Serialize book data
const serializeBook = (doc: QueryDocumentSnapshot): Book => {
  const data = doc.data() as Record<string, any>; // Use Record for safer access
  return {
    id: doc.id,
    title: data.title || 'Untitled Book',
    authors: data.authors || ['Unknown Author'],
    status: data.status || 'toRead',
    dateAdded: toISOString(data.dateAdded),
    lastUpdated: toISOString(data.lastUpdated),
    isbn: data.isbn || '',
    publishedDate: data.publishedDate || '',
    description: data.description || '',
    pageCount: data.pageCount || 0,
    categories: data.categories || [],
    averageRating: data.averageRating || 0,
    // Handle undefined userRating explicitly
    userRating: data.userRating === undefined ? null : data.userRating,
    imageLinks: data.imageLinks || { smallThumbnail: '', thumbnail: '' },
    notes: data.notes || '',
  } as Book;
};


// Fetch data at build time
export const getStaticProps: GetStaticProps<BooksPageProps> = async () => {
  console.log('Books getStaticProps: Fetching initial books and stats...');
  try {
    const firestore = getAdminFirestore();
    const booksRef = firestore.collection('books');

    // 1. Fetch all book statuses for accurate stats calculation
    // Select only the 'status' field to minimize data transfer
    const allBooksSnapshot = await booksRef.select('status').get();
    const allStatuses = allBooksSnapshot.docs.map(doc => doc.data().status || 'toRead');

    const totalBooks = allStatuses.length;
    const stats = {
      total: totalBooks,
      read: allStatuses.filter(status => status === 'read').length,
      reading: allStatuses.filter(status => status === 'reading').length,
      toRead: allStatuses.filter(status => status === 'toRead').length,
    };

    // 2. Fetch the first page of books (full data), ordered by title
    const firstPageSnapshot = await booksRef.orderBy('title').limit(BOOKS_PER_PAGE).get();
    const initialBooks: Book[] = firstPageSnapshot.docs.map(serializeBook);

    console.log(`Books getStaticProps: Fetched ${initialBooks.length} initial books, calculated stats for ${totalBooks} total books.`);

    return {
      props: {
        initialBooks,
        initialStats: stats,
        totalBooks: totalBooks, // Pass total count
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