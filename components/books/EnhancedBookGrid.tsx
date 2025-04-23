// components/books/EnhancedBookGrid.tsx
import React, { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Book } from '@/types/book';
import BookModal from './BookModal';
import { trackBookInteraction } from '@/lib/analytics';
import useInfiniteBooks from '@/lib/hooks/useQueryBooks';
import { useInView } from 'react-intersection-observer';

// Types
type EnhancedBookGridProps = {
  initialBooks?: Book[];
  statusFilter: string;
  ratingFilter: number | '';
  genreFilter: string;
};

/**
 * EnhancedBookGrid uses React Query for optimized data fetching
 * and infinite scrolling with proper loading states
 */
export default function EnhancedBookGrid({
  initialBooks = [],
  statusFilter,
  ratingFilter,
  genreFilter,
}: EnhancedBookGridProps) {
  // Setup react-query with our custom hook
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteBooks(
    { statusFilter, ratingFilter, genreFilter },
    { field: 'title', direction: 'asc' }
  );

  // UI state
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // IntersectionObserver for infinite scrolling
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '0px 0px 500px 0px', // Load more earlier for smoother experience
  });

  // Trigger next page fetch when bottom is in view
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Extract and flatten books from all pages
  const books = useMemo(() => {
    // If no data yet, return initial books if provided
    if (!data?.pages) return initialBooks;
    
    // Flatten the pages of books
    return data.pages.flatMap(page => page.books);
  }, [data, initialBooks]);

  // Memoized handler for book selection
  const handleBookClick = useCallback((book: Book) => {
    setSelectedBook(book);
    trackBookInteraction('detail');
  }, []);

  // Error state
  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading books</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state (no books & not loading)
  if (books.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-md">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No books found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your filters or add some books to your collection.
        </p>
      </div>
    );
  }

  // Render grid with books, loading states, and load more trigger
  return (
    <div className="space-y-6">
      {/* Book Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {books.map((book) => (
          <BookCard key={book.id} book={book} onClick={handleBookClick} />
        ))}
        
        {/* Initial loading skeleton */}
        {isLoading && (
          <>
            {Array.from({ length: 12 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </>
        )}
      </div>

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Intersection observer target */}
      {hasNextPage && <div ref={ref} className="h-10 mt-2" />}
      
      {/* End of list message */}
      {!hasNextPage && !isLoading && books.length > 0 && (
        <p className="text-center text-gray-500 py-4">
          You've reached the end of your book collection
        </p>
      )}

      {/* Book Modal */}
      {selectedBook && (
        <BookModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
}

// Memoized Book Card Component
const BookCard = React.memo(({ book, onClick }: { book: Book; onClick: (book: Book) => void }) => {
  return (
    <div
      className="group relative overflow-hidden rounded-md border border-gray-300 shadow-sm transition-shadow hover:shadow-md cursor-pointer bg-white"
      onClick={() => onClick(book)}
    >
      <div className="relative h-[180px] w-full bg-gray-100">
        {book.imageLinks?.thumbnail ? (
          <Image
            src={book.imageLinks.thumbnail}
            alt={`Cover of ${book.title}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain"
            loading="lazy"
            onError={(e) => {
              // @ts-ignore - Handle image load error
              e.target.src = '/placeholder-book.png';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200">
            <span className="text-sm text-gray-500">No cover available</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium line-clamp-2" title={book.title}>
          {book.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-1">
          {book.authors?.length ? book.authors.join(', ') : 'Unknown author'}
        </p>
        {/* Rating Stars */}
        {book.userRating && (
          <div className="mt-1 flex items-center">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`text-sm ${i < book.userRating! ? 'text-yellow-400' : 'text-gray-300'}`}>
                ★
              </span>
            ))}
          </div>
        )}
        {/* Status Badge */}
        <div className="mt-1">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              book.status?.toLowerCase() === 'read' || book.status?.toLowerCase() === 'read'
                ? 'bg-green-100 text-green-800'
                : book.status?.toLowerCase() === 'currently reading' || book.status?.toLowerCase() === 'reading'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {book.status}
          </span>
        </div>
      </div>
    </div>
  );
});

BookCard.displayName = 'BookCard';

// Loading skeleton
const BookCardSkeleton = () => (
  <div className="rounded-md border border-gray-300 shadow-sm bg-white overflow-hidden">
    <div className="h-[180px] w-full bg-gray-200 animate-pulse" />
    <div className="p-3 space-y-2">
      <div className="h-5 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
      <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
    </div>
  </div>
);
