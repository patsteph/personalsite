import React, { useState, useEffect, useRef } from 'react';
import { Book } from '@/types/book';
import { trackBookInteraction } from '@/lib/analytics';
import BookModal from '@/components/books/BookModal';
import Image from 'next/image';
import useBooks from '@/lib/hooks/useBooks';

// Props type for the component
type SimpleBookGridProps = {
  initialBooks: Book[];
  totalBooks: number;
  statusFilter: string;
  ratingFilter: number | '';
  genreFilter: string;
};

export default function SimpleBookGrid({
  initialBooks,
  totalBooks,
  statusFilter,
  ratingFilter,
  genreFilter,
}: SimpleBookGridProps) {
  // Use our custom hook to handle all data fetching logic
  const { books, loading, hasMore, loadMoreBooks } = useBooks({
    initialBooks,
    totalBooks,
    statusFilter,
    ratingFilter,
    genreFilter,
  });

  // UI state (separate from data fetching)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Ref for intersection observer
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          console.log("Intersection observer triggered loadMoreBooks");
          loadMoreBooks();
        }
      },
      { threshold: 0.8 } // Trigger when 80% visible
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadMoreBooks]);

  // --- Modal Handling ---  
  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    // Track the interaction
    trackBookInteraction('detail');
  };

  // --- Render Loading State ---
  const renderLoadingState = () => {
    if (!loading) return null;
    return (
      <div className="col-span-full flex justify-center items-center py-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <span className="ml-2">Loading more books...</span>
      </div>
    );
  };

  // --- Render No Results ---
  const renderNoResults = () => {
    if (books.length > 0 || loading) return null;
    return (
      <div className="col-span-full text-center py-8">
        <h3 className="text-xl font-medium">No books found</h3>
        <p className="text-gray-600 mt-2">
          Try adjusting your filters or adding new books.
        </p>
      </div>
    );
  };

  // --- Render Book Cards ---
  const renderBookCards = () => {
    return books.map((book) => (
      <div
        key={book.id}
        className="group relative overflow-hidden rounded-md border border-gray-300 shadow-sm transition-shadow hover:shadow-md cursor-pointer bg-white p-2"
        onClick={() => handleBookClick(book)}
      >
        <div className="relative h-[180px] w-full bg-gray-100">
          {/* Book Cover Image with Next.js Image optimization */}
          {book.imageLinks?.thumbnail ? (
            <Image
              src={book.imageLinks.thumbnail}
              alt={`Cover of ${book.title}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain"
              // Add a placeholder or fallback
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
        <div className="mt-2">
          <h3 className="font-medium line-clamp-2" title={book.title}>
            {book.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-1">
            {book.authors?.length ? book.authors.join(', ') : 'Unknown author'}
          </p>
          {/* Rating Stars (if rated) */}
          {book.userRating && (
            <div className="mt-1 flex items-center">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-sm ${i < book.userRating! ? 'text-yellow-400' : 'text-gray-300'}`}>
                  ★
                </span>
              ))}
            </div>
          )}
          {/* Book Status Badge */}
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
    ));
  };

  return (
    <div>
      {/* Book Grid Container */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {renderBookCards()}
        {renderNoResults()}
        {renderLoadingState()}

        {/* Intersection Observer Target - Only render if hasMore is true */}
        {hasMore && (
          <div ref={observerTarget} className="col-span-full h-8 w-full" />
        )}
      </div>

      {/* Book Detail Modal */}
      {selectedBook && (
        <BookModal 
          book={selectedBook} 
          onClose={() => setSelectedBook(null)} 
        />
      )}
    </div>
  );
}