import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Book } from '@/types/book';
import { trackBookInteraction } from '@/lib/analytics';
// Import Firebase client SDK modules - ADD where for query building
import { getFirestore, collection, query, orderBy, startAfter, limit, getDocs, DocumentSnapshot, DocumentData, Timestamp, where, QueryConstraint } from 'firebase/firestore'; // Add where, QueryConstraint
import { app, db } from '@/lib/firebase-client'; // Lint error 6b40f28f persists here
import BookModal from '@/components/books/BookModal'; // Corrected import path
import Image from 'next/image'; // Use Next Image for optimization

const BOOKS_PER_PAGE = 24; // Must match getStaticProps

// --- Update Props Type ---
type SimpleBookGridProps = {
  initialBooks: Book[];
  totalBooks: number; // Total unfiltered count from getStaticProps
  statusFilter: string;
  ratingFilter: number | '';
  genreFilter: string;
};

export default function SimpleBookGrid({
  initialBooks,
  totalBooks: initialTotalBooks, // Rename to avoid confusion with filtered total
  statusFilter,
  ratingFilter,
  genreFilter,
}: SimpleBookGridProps) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [loading, setLoading] = useState<boolean>(false);
  // Use DocumentSnapshot<DocumentData> for more specific typing
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(initialBooks.length < initialTotalBooks && initialBooks.length > 0); // Initial check based on props
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Ref for intersection observer
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // --- Reset and Load on Filter Change ---
  useEffect(() => {
    console.log('Filters changed:', { statusFilter, ratingFilter, genreFilter });
    // Reset state when filters change to trigger a fresh load
    setBooks([]); // Clear current books
    setLastVisible(null); // Reset pagination cursor
    setHasMore(true); // Assume there might be books with the new filter
    setLoading(true); // Set loading state
    // Immediately call loadMoreBooks to fetch the first page with new filters
    // Note: This call happens after the state resets have been queued.
    loadMoreBooks(true); // Pass a flag to indicate it's a reset load
  }, [statusFilter, ratingFilter, genreFilter]); // Dependencies: run when filters change

  // --- Updated Load More Books Function ---
  const loadMoreBooks = useCallback(async (isFilterReset = false) => {
    // --- Add null check for db ---
    if (!db) {
        console.warn("Firestore client (db) not initialized, cannot load books.");
        setLoading(false); // Ensure loading state is reset
        setHasMore(false); // Cannot load more if db is missing
        return;
    }
    // --- End null check ---

    // Prevent loading if already loading or no more books expected
    // Allow loading if it's triggered by a filter reset, even if hasMore was previously false
    if (loading && !isFilterReset) return;
    if (!hasMore && !isFilterReset) {
      console.log("LoadMoreBooks: No more books to load.");
      return;
    }

    // Set loading state only if it's not a filter reset (already set in useEffect)
    if (!isFilterReset) {
      setLoading(true);
    }
    console.log("LoadMoreBooks: Fetching...", { lastVisible: lastVisible?.id, hasMore, isFilterReset });

    try {
      // Base query reference (not the query itself yet)
      const booksCollRef = collection(db, 'books');

      // Array to hold query constraints (where clauses, orderBy, limit, startAfter)
      const constraints: QueryConstraint[] = [];

      // --- Dynamically add WHERE clauses based on filters ---
      if (statusFilter) {
        constraints.push(where('status', '==', statusFilter));
      }
      if (ratingFilter !== '') {
        // Ensure ratingFilter is treated as a number for comparison
        constraints.push(where('userRating', '>=', Number(ratingFilter)));
      }
      if (genreFilter) {
        // Assumes 'genres' field in Firestore is an array - renamed from categories
        constraints.push(where('genres', 'array-contains', genreFilter));
      }
      // --- End WHERE clauses ---

      // Add default sorting (e.g., by title) - adjust if needed
      // IMPORTANT: Any field used in orderBy must also be the first field in an inequality filter (<, <=, >, >=) if one exists.
      // If filtering by rating (>=), we might need to order by rating first, then title.
      // Let's keep title for now, but be aware index might be needed or order adjusted.
      constraints.push(orderBy('title', 'asc'));

      // Add pagination limit
      constraints.push(limit(BOOKS_PER_PAGE));

      // Add cursor for pagination if lastVisible exists
      // Only add startAfter if it's NOT a filter reset load
      if (lastVisible && !isFilterReset) {
        constraints.push(startAfter(lastVisible));
      }

      // Construct the final query
      const finalQuery = query(booksCollRef, ...constraints);

      const documentSnapshots = await getDocs(finalQuery);

      const newBooks: Book[] = [];
      documentSnapshots.forEach((doc) => {
        // Basic serialization, assuming Firestore data matches Book type closely
        const data = doc.data();
        const book: Book = {
          id: doc.id,
          // Map fields, ensuring correct types and handling potential undefined/null
          title: data.title || 'Untitled',
          authors: data.authors || [],
          googleBooksId: data.googleBooksId || undefined, // Use undefined if not present
          // isbn: data.isbn || '', // Use optional fields from type
          // publisher: data.publisher || '',
          // publishedDate: data.publishedDate || '',
          // description: data.description || '',
          // pageCount: data.pageCount || 0,
          // thumbnailUrl: data.thumbnailUrl || '/placeholder-book.png', // Use imageLinks instead
          status: data.status || 'To Read', // Ensure this matches BookStatus type ('Read', 'Currently Reading', 'To Read')
          dateAdded: data.dateAdded instanceof Timestamp ? data.dateAdded.toDate().toISOString() : null,
          // Add mapping for other fields defined in the Book type
          lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate().toISOString() : null,
          isbn: data.isbn || undefined,
          publishedDate: data.publishedDate || undefined,
          description: data.description || undefined,
          pageCount: data.pageCount || undefined,
          // --- Corrected Image Handling ---
          imageLinks: {
              smallThumbnail: data.imageLinks?.smallThumbnail || data.thumbnailUrl || undefined,
              thumbnail: data.imageLinks?.thumbnail || data.thumbnailUrl || undefined,
          },
          // --- End Corrected Image Handling ---
          genres: data.genres || [], // Ensure this matches Firestore field name ('genres' not 'categories')
          averageRating: data.averageRating || undefined,
          userRating: data.userRating === undefined ? null : data.userRating,
          notes: data.notes || null,
          publisher: data.publisher || undefined,
        };
        newBooks.push(book);
      });

      // Update lastVisible document for pagination
      const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      setLastVisible(lastDoc || null);

      // Update books state: replace on filter reset, append otherwise
      setBooks(prevBooks => isFilterReset ? newBooks : [...prevBooks, ...newBooks]);

      // Determine if there are more books to load
      setHasMore(documentSnapshots.docs.length === BOOKS_PER_PAGE);

      console.log(`LoadMoreBooks: Fetched ${newBooks.length} books. HasMore: ${documentSnapshots.docs.length === BOOKS_PER_PAGE}`);

    } catch (error) { 
      console.error("Error loading more books:", error);
      // Optionally, set an error state to display to the user
      setHasMore(false); // Stop trying to load more on error
    } finally {
      setLoading(false);
    }
    // Add filters to useCallback dependencies
  }, [loading, hasMore, lastVisible, statusFilter, ratingFilter, genreFilter, initialBooks]);

  // --- Intersection Observer Logic (mostly unchanged) ---
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
  }, [hasMore, loading, loadMoreBooks]); // Ensure loadMoreBooks is stable or included

  // --- Modal Handling (modified) ---
  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    // Track the interaction type. Currently doesn't support passing extra properties.
    trackBookInteraction('detail'); 
  };

  // --- Render Logic (minor adjustments for filter info) ---
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
        {books.map((book) => (
          <div
            key={book.id}
            className="group relative flex flex-col bg-white border shadow-sm rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            onClick={() => handleBookClick(book)}
            role="button" // Accessibility
            aria-label={`View details for ${book.title}`}
          >
            {/* Status Badge */}
            {book.status && (
              <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full z-10 ${ 
                book.status === 'read' ? 'bg-green-100 text-green-800' : 
                book.status === 'reading' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-purple-100 text-purple-800' // To Read or default
              }`}> 
                {book.status}
              </span>
            )}
            {/* --- Apply Aspect Ratio to Image Container --- */}
            <div className="relative w-full bg-gray-200 aspect-[2/3]"> {/* Remove h-48/h-64, add aspect-[2/3] */}
              <Image
                // Use book.id for key if googleBooksId might not be unique or present
                key={book.id || book.googleBooksId}
                src={book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || '/placeholder-book.png'} // Use imageLinks with fallback
                alt={book.title}
                layout="fill"
                objectFit="cover" // Change back to cover
                className="transition-transform duration-300 ease-in-out group-hover:scale-105"
                onError={(e) => {
                  // Optional: Handle image load errors, e.g., set to placeholder
                }}
              />
            </div>
            {/* --- End Image Container --- */}
            <div className="p-4 flex flex-col flex-grow">
              {/* Remove h-10, add line-clamp-2 */}
              <h3 className="text-md font-semibold mb-1 text-steel-blue leading-tight line-clamp-2 group-hover:line-clamp-none"> {/* Show full title on hover */}
                {book.title}
              </h3>
              {/* Remove h-8, add line-clamp-1 */}
              <p className="text-sm text-gray-600 mb-2 flex-grow line-clamp-1">
                {book.authors?.join(', ') || 'Unknown Author'}
              </p>
              {/* User Rating */}
              {book.userRating && book.userRating > 0 && (
                <div className="mt-2 flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-3 h-3 ${book.userRating! > i ? 'text-yellow-400' : 'text-gray-300'}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  {/* Optional: Display notes indicator */}
                  {book.notes && <span className="ml-2 text-xs text-blue-500" title="Has notes">📝</span>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Loading Indicator */}
      {loading && <div className="text-center py-4 text-gray-500">Loading more books...</div>}

      {/* Observer Target */}
      {!loading && hasMore && (
         <div ref={observerTarget} style={{ height: '50px', margin: '20px 0' }}></div>
      )}
       {!hasMore && books.length > 0 && (
         <div className="text-center py-8 text-gray-500 italic">End of bookshelf.</div>
       )}
       {books.length === 0 && (
         <div className="text-center py-8 text-gray-500 italic">No books match the current filters.</div>
       )}

      {/* Book Modal */}
      {selectedBook && (
        <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
}