import { Book } from '@/types/book';
import { useMemo } from 'react';

type BookSpineProps = {
  book: Book;
  onClick: () => void;
};

export default function BookSpine({ book, onClick }: BookSpineProps) {
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
  
  return (
    <div
      className="h-40 cursor-pointer transition-transform duration-300 flex items-center justify-center text-white text-xs rounded-sm select-none"
      style={{
        backgroundColor: bookColor,
        width: `${spineWidth}px`,
        marginRight: '3px',
        writingMode: 'vertical-rl',
        textOrientation: 'mixed'
      }}
      onClick={onClick}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-10px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      title={`${book.title} by ${book.authors.join(', ')}`}
    >
      <div className="overflow-hidden p-1 text-center whitespace-nowrap text-ellipsis max-h-36">
        {book.title}
      </div>
    </div>
  );
}