// components/books/BookModal.tsx
import React from 'react';
import { Book } from '@/types/book';
import Image from 'next/image';

type BookModalProps = {
  book: Book | null;
  onClose: () => void;
};

export default function BookModal({ book, onClose }: BookModalProps) {
  if (!book) return null;

  // Safe author handling
  const authorText = Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || 'Unknown Author');

  // Safe image handling
  const coverImage = book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || 'https://via.placeholder.com/128x192.png?text=No+Cover';

  // Safe category handling
  const categories = Array.isArray(book.categories) ? book.categories.join(', ') : (book.categories || '');

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto transform animate-scaleIn relative"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full p-2 z-10 transition-colors"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Book Cover */}
          <div className="md:w-1/3 p-6 flex justify-center items-start">
            <div className="relative w-48 h-auto aspect-[2/3] bg-gray-200 shadow-lg rounded overflow-hidden">
              <Image
                src={coverImage}
                alt={`Cover of ${book.title}`}
                layout="fill"
                objectFit="cover"
                unoptimized={process.env.NODE_ENV !== 'production'} // Consider removing if images are optimized
              />
            </div>
          </div>

          {/* Book Details */}
          <div className="md:w-2/3 p-6 pt-10 md:pt-6"> {/* Adjust padding for close button */}
            <h2 id="book-modal-title" className="text-2xl font-bold text-gray-900 mb-1">{book.title}</h2>
            <p className="text-lg text-gray-600 mb-4">by {authorText}</p>

            {/* Rating */}
            {(book.userRating || book.averageRating) && (
              <div className="mb-4 flex items-center">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${ (book.userRating || book.averageRating || 0) > i ? 'text-yellow-400' : 'text-gray-300' }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  ({book.userRating || book.averageRating}/5)
                </span>
              </div>
            )}

            {/* Categories */}
            {categories && (
              <div className="mb-4 text-sm text-gray-500">
                {categories}
              </div>
            )}

            {/* Description */}
            {book.description && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-1">Description</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{book.description}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-6">
              {book.publisher && (
                <div><span className="font-medium text-gray-700">Publisher:</span> {book.publisher}</div>
              )}
              {book.publishedDate && (
                <div><span className="font-medium text-gray-700">Published:</span> {book.publishedDate}</div>
              )}
              {book.pageCount && (
                <div><span className="font-medium text-gray-700">Pages:</span> {book.pageCount}</div>
              )}
              {book.isbn && (
                <div><span className="font-medium text-gray-700">ISBN:</span> {book.isbn}</div>
              )}
               {book.dateAdded && (
                // Safely format date, checking if it's a valid date string or null
                <div><span className="font-medium text-gray-700">Added:</span> {book.dateAdded ? new Date(book.dateAdded).toLocaleDateString() : 'N/A'}</div>
              )}
              {book.lastUpdated && (
                // Safely format date, checking if it's a valid date string or null
                <div><span className="font-medium text-gray-700">Updated:</span> {book.lastUpdated ? new Date(book.lastUpdated).toLocaleDateString() : 'N/A'}</div>
              )}
            </div>

            {/* Notes */}
            {book.notes && (
              <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-gray-800 mb-2">My Notes</h3>
                <p className="text-gray-700 text-sm italic whitespace-pre-wrap">{book.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
