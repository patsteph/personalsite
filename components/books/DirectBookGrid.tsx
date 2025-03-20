import { useState, useEffect } from 'react';
import { Book } from '@/types/book';

type DirectBookGridProps = {
  initialBooks?: Book[];
};

export default function DirectBookGrid({ initialBooks = [] }: DirectBookGridProps) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  // Get books directly from Firebase
  useEffect(() => {
    async function loadBooks() {
      try {
        console.log('Loading books directly from Firebase...');
        
        // Make sure Firebase is initialized
        if (typeof window !== 'undefined') {
          // Ensure Firebase is available
          if (!window.firebase && typeof firebase !== 'undefined') {
            // @ts-ignore - global firebase may be available
            window.firebase = firebase;
          }
          
          // Fallback if Firebase isn't initialized
          if (!window.firebase) {
            console.log('Firebase not available, using fallback books');
            setBooks(initialBooks || []);
            setLoading(false);
            return;
          }
          
          // Try to get books collection
          const db = window.firebase.firestore();
          
          if (!db) {
            console.error('Firestore not available');
            setBooks(initialBooks || []);
            setLoading(false);
            return;
          }
          
          // Get books from Firestore
          const snapshot = await db.collection('books').get();
          
          if (snapshot.empty) {
            console.log('No books found in Firestore');
            setBooks(initialBooks || []);
          } else {
            const loadedBooks = snapshot.docs.map(doc => {
              const data = doc.data();
              
              // Ensure every book has an authors array
              if (!data.authors || !Array.isArray(data.authors)) {
                data.authors = ['Unknown Author'];
              }
              
              return {
                id: doc.id,
                ...data,
                // Make sure dateAdded is a string for serialization
                dateAdded: data.dateAdded ? 
                  (typeof data.dateAdded === 'string' ? 
                    data.dateAdded : 
                    data.dateAdded.toDate?.() ? 
                      data.dateAdded.toDate().toISOString() : 
                      new Date().toISOString()
                  ) : 
                  new Date().toISOString()
              };
            });
            
            console.log(`Loaded ${loadedBooks.length} books directly from Firestore`);
            setBooks(loadedBooks);
          }
        }
      } catch (error) {
        console.error('Error loading books directly:', error);
        setBooks(initialBooks || []);
      } finally {
        setLoading(false);
      }
    }
    
    loadBooks();
  }, [initialBooks]);
  
  // Create a simple book display component
  const BookItem = ({ book }: { book: Book }) => {
    // Create a color based on the book title
    const getColor = (title: string) => {
      const hash = title.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      
      const hue = Math.abs(hash % 360);
      return `hsl(${hue}, 70%, 45%)`;
    };
    
    // Get cover image if available
    const coverImage = book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail;
    
    // Format authors safely
    const authorText = Array.isArray(book.authors) && book.authors.length > 0 
      ? book.authors.join(', ')
      : 'Unknown Author';
      
    return (
      <div 
        className="h-40 w-28 cursor-pointer transition-transform duration-300 flex flex-col items-center rounded overflow-hidden shadow-md select-none m-1"
        onClick={() => setSelectedBook(book)}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-10px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        title={`${book.title} by ${authorText}`}
      >
        {/* Book cover */}
        <div className="relative w-full h-32 bg-gray-200 flex items-center justify-center overflow-hidden">
          {coverImage ? (
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${coverImage})` }}
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center p-2"
              style={{ backgroundColor: getColor(book.title) }}
            >
              <p className="text-xs text-center font-medium text-white line-clamp-3">
                {book.title}
              </p>
            </div>
          )}
        </div>
        
        {/* Book title and author */}
        <div className="w-full p-1 bg-white text-center">
          <h4 className="text-xs font-medium text-gray-800 truncate">{book.title}</h4>
          <p className="text-[10px] text-gray-600 truncate">
            {authorText}
          </p>
        </div>
      </div>
    );
  };
  
  // Simple book details modal
  const BookDetailsModal = ({ book, onClose }: { book: Book, onClose: () => void }) => {
    // Format authors safely
    const authorText = Array.isArray(book.authors) && book.authors.length > 0 
      ? book.authors.join(', ')
      : 'Unknown Author';
      
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-blue-700">{book.title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <p className="text-lg mb-2">by {authorText}</p>
          
          <div className="my-4">
            <p className="text-gray-700">{book.description || 'No description available.'}</p>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
            {book.publisher && (
              <div><span className="font-semibold">Publisher:</span> {book.publisher}</div>
            )}
            {book.publishedDate && (
              <div><span className="font-semibold">Published:</span> {book.publishedDate}</div>
            )}
            {book.pageCount && (
              <div><span className="font-semibold">Pages:</span> {book.pageCount}</div>
            )}
            {book.isbn && (
              <div><span className="font-semibold">ISBN:</span> {book.isbn}</div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-2 text-gray-600">Loading books...</p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Grid of books */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {books.map(book => (
          <BookItem key={book.id} book={book} />
        ))}
      </div>
      
      {/* Book details modal */}
      {selectedBook && (
        <BookDetailsModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
      
      {/* Empty state */}
      {books.length === 0 && (
        <div className="py-8 text-center bg-white rounded-lg shadow">
          <p className="text-xl text-gray-700">No books found in your collection.</p>
          <p className="mt-2 text-gray-600">Add some books to see them here!</p>
        </div>
      )}
    </div>
  );
}