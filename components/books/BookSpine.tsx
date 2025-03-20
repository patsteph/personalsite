import { Book } from '@/types/book';
import { useMemo } from 'react';
import Image from 'next/image';

type BookSpineProps = {
  book: Book;
  onClick: () => void;
};

export default function BookSpine({ book, onClick }: BookSpineProps) {
  const hasCover = book.imageLinks && (book.imageLinks.thumbnail || book.imageLinks.smallThumbnail);
  
  // Generate a color based on the book's genre or first letter of title
  const bookColor = useMemo(() => {
    // Common genres and their colors
    const genreColors: Record<string, string> = {
      'Fiction': '#3498db',
      'Science Fiction': '#9b59b6',
      'Fantasy': '#8e44ad',
      'Mystery': '#34495e',
      'Thriller': '#2c3e50',
      'Romance': '#e74c3c',
      'Horror': '#c0392b',
      'Biography': '#f1c40f',
      'History': '#f39c12',
      'Business': '#2ecc71',
      'Self-help': '#27ae60',
      'Computers': '#1abc9c',
      'Programming': '#16a085',
      'Science': '#3498db',
      'Mathematics': '#2980b9',
      'Philosophy': '#7f8c8d',
      'Religion': '#bdc3c7',
      'Travel': '#e67e22',
      'Cooking': '#d35400'
    };
    
    // Check if book belongs to a genre with a predefined color
    if (book.categories) {
      for (const category of book.categories) {
        if (genreColors[category]) {
          return genreColors[category];
        }
      }
    }
    
    // If no matching genre, generate a color based on title
    const hash = book.title.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Generate hue (0-360), high saturation and medium lightness
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 45%)`;
  }, [book.title, book.categories]);
  
  // Make the spine width proportional to page count if available
  const spineWidth = useMemo(() => {
    if (!book.pageCount) return 30; // Default width
    
    const minWidth = 20;
    const maxWidth = 40;
    return Math.max(minWidth, Math.min(maxWidth, book.pageCount / 30));
  }, [book.pageCount]);

  // Get authors as a formatted string with fallback
  const authorText = useMemo(() => {
    if (!book.authors || !Array.isArray(book.authors) || book.authors.length === 0) {
      return 'Unknown Author';
    }
    return book.authors.join(', ');
  }, [book.authors]);

  // Determine if we should show book as cover or spine
  const showAsCover = true; // Always show as cover for now
  
  if (showAsCover) {
    // Show as book cover (front facing)
    return (
      <div
        className="h-40 w-28 cursor-pointer transition-transform duration-300 flex flex-col items-center rounded overflow-hidden shadow-md select-none m-1"
        onClick={onClick}
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
          {hasCover ? (
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail})` 
              }}
            >
              {/* Debug - if image fails to load, show error */}
              <img 
                src={book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail} 
                alt="" 
                className="hidden" 
                onError={(e) => {
                  console.error('Image failed to load:', book.imageLinks);
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-red-100 p-2"><p class="text-xs text-center font-medium text-red-700">Image Error</p></div>`;
                  }
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-300 p-2">
              <p className="text-xs text-center font-medium text-gray-700 line-clamp-3">
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
  } else {
    // Show as book spine (original style)
    const style = {
      backgroundColor: bookColor,
      width: `${spineWidth}px`,
      marginRight: '3px',
      writingMode: 'vertical-rl' as const,
      textOrientation: 'mixed' as const,
      backgroundSize: hasCover ? 'cover' : 'auto',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      ...(hasCover ? { backgroundImage: `url(${book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail})` } : {})
    };
  
    return (
      <div
        className={`h-40 cursor-pointer transition-transform duration-300 flex items-center justify-center text-white text-xs rounded-sm select-none ${hasCover ? 'book-with-cover' : ''}`}
        style={style}
        onClick={onClick}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-10px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        title={`${book.title} by ${authorText}`}
      >
        {!hasCover && (
          <div className="overflow-hidden p-1 text-center whitespace-nowrap text-ellipsis max-h-36">
            {book.title}
          </div>
        )}
      </div>
    );
  }
}