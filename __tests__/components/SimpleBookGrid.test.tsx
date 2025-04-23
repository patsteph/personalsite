// __tests__/components/SimpleBookGrid.test.tsx
import React from 'react';
import { render, screen } from '../test-utils';
import SimpleBookGrid from '@/components/books/SimpleBookGrid';
import { useBooks } from '@/lib/hooks/useBooks';
import { mockBooks } from '../../__mocks__/firebase-mocks';
import { Book } from '@/types/book';
import '@testing-library/jest-dom';

// Mock the useBooks hook
jest.mock('@/lib/hooks/useBooks');

describe('SimpleBookGrid Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should render loading state', () => {
    // Mock the hook to return loading state
    (useBooks as jest.Mock).mockReturnValue({
      books: [],
      loading: true,
      hasMore: false,
      lastVisible: null,
      loadMoreBooks: jest.fn(),
    });

    const props = {
      initialBooks: [] as Book[],
      totalBooks: 0,
      statusFilter: '',
      ratingFilter: '' as const,
      genreFilter: ''
    };

    render(<SimpleBookGrid {...props} />);
    
    // Check for loading indicator
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render books when loaded', () => {
    // Mock the hook to return books
    (useBooks as jest.Mock).mockReturnValue({
      books: mockBooks as unknown as Book[],
      loading: false,
      hasMore: false,
      lastVisible: null,
      loadMoreBooks: jest.fn(),
    });

    const props = {
      initialBooks: [] as Book[],
      totalBooks: mockBooks.length,
      statusFilter: '',
      ratingFilter: '' as const,
      genreFilter: ''
    };

    render(<SimpleBookGrid {...props} />);
    
    // Check for book titles
    expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    expect(screen.getByText('Test Book 2')).toBeInTheDocument();
    expect(screen.getByText('Test Book 3')).toBeInTheDocument();
  });

  it('should render no books message', () => {
    // Mock the hook to return empty books array (no error in our actual implementation)
    (useBooks as jest.Mock).mockReturnValue({
      books: [],
      loading: false,
      hasMore: false,
      lastVisible: null,
      loadMoreBooks: jest.fn(),
    });

    const props = {
      initialBooks: [] as Book[],
      totalBooks: 0,
      statusFilter: '',
      ratingFilter: '' as const,
      genreFilter: ''
    };

    render(<SimpleBookGrid {...props} />);
    
    // Check for no books message
    expect(screen.getByText(/no books/i)).toBeInTheDocument();
  });

  it('should offer to load more when hasMore is true', () => {
    // Mock the hook to return more books available
    const loadMoreBooksMock = jest.fn();
    (useBooks as jest.Mock).mockReturnValue({
      books: mockBooks as unknown as Book[],
      loading: false,
      hasMore: true,
      lastVisible: {} as any,
      loadMoreBooks: loadMoreBooksMock,
    });

    const props = {
      initialBooks: [] as Book[],
      totalBooks: mockBooks.length * 2, // More books available
      statusFilter: '',
      ratingFilter: '' as const,
      genreFilter: ''
    };

    render(<SimpleBookGrid {...props} />);
    
    // Check for load more button
    const loadMoreButton = screen.getByText(/load more/i);
    expect(loadMoreButton).toBeInTheDocument();
    
    // Click the button and check if the function was called
    loadMoreButton.click();
    expect(loadMoreBooksMock).toHaveBeenCalled();
  });
});
