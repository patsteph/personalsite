import { Book } from '@/types/book';
import { useTranslation } from '@/lib/translations';
import Image from 'next/image';

type BookDetailsProps = {
  book: Book;
  onClose?: () => void;
};

export default function BookDetails({ book, onClose }: BookDetailsProps) {
  const { t } = useTranslation();
  
  // Format reading status
  const formatStatus = (status: string): string => {
    switch (status) {
      case 'read':
        return t('books.read', 'Read');
      case 'reading':
        return t('books.reading', 'Currently Reading');
      case 'toRead':
        return t('books.toRead', 'Want to Read');
      default:
        return status;
    }
  };
  
  // Default image if no thumbnail available
  const coverImage = book.imageLinks?.thumbnail || '/images/default-book-cover.jpg';
  
  return (
    <div className="bg-white rounded-lg p-6 shadow-md mt-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Book cover */}
        <div className="w-40 h-60 bg-gray-100 flex-shrink-0 mx-auto md:mx-0">
          <div className="relative w-full h-full">
            <Image
              src={coverImage}
              alt={`Cover of ${book.title}`}
              layout="fill"
              objectFit="cover"
              className="rounded"
              unoptimized // For static export
            />
          </div>
        </div>
        
        {/* Book info */}
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-accent">{book.title}</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          
          <p className="text-lg mb-2">
            {t('books.by', 'by')} {book.authors.join(', ')}
          </p>
          
          {book.categories && (
            <p className="text-sm text-gray-600 mb-1">
              {book.categories.join(', ')}
            </p>
          )}
          
          {book.averageRating !== undefined && (
            <p className="text-sm text-gray-600 mb-4">
              {book.averageRating.toFixed(1)} / 5
              {book.ratingsCount && ` (${book.ratingsCount} ratings)`}
            </p>
          )}
          
          {/* Status badge */}
          <div className="mb-4">
            <span className="text-sm font-semibold mr-2">
              {t('books.status', 'Status:')}
            </span>
            <span className={`
              px-3 py-1 rounded-full text-xs font-medium
              ${book.status === 'read' ? 'bg-green-100 text-green-800' : ''}
              ${book.status === 'reading' ? 'bg-blue-100 text-blue-800' : ''}
              ${book.status === 'toRead' ? 'bg-yellow-100 text-yellow-800' : ''}
            `}>
              {formatStatus(book.status)}
            </span>
          </div>
          
          {/* Description */}
          <div className="my-4">
            <p className="text-gray-700">
              {book.description || 'No description available.'}
            </p>
          </div>
          
          {/* User notes */}
          {book.notes && (
            <div className="mt-4 bg-light-accent p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">
                {t('books.myNotes', 'My Notes')}
              </h3>
              <p className="italic">{book.notes}</p>
            </div>
          )}
          
          {/* Book metadata */}
          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
            {book.publisher && (
              <div>
                <span className="font-semibold">Publisher:</span> {book.publisher}
              </div>
            )}
            {book.publishedDate && (
              <div>
                <span className="font-semibold">Published:</span> {book.publishedDate}
              </div>
            )}
            {book.pageCount && (
              <div>
                <span className="font-semibold">Pages:</span> {book.pageCount}
              </div>
            )}
            {book.isbn && (
              <div>
                <span className="font-semibold">ISBN:</span> {book.isbn}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}