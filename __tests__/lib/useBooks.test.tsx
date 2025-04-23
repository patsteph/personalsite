// __tests__/lib/useBooks.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBooks } from '@/lib/hooks/useBooks';
import { mockBooks, createMockQuerySnapshot } from '../../__mocks__/firebase-mocks';
import * as firebaseFirestore from 'firebase/firestore';
import { Book } from '@/types/book';

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  getFirestore: jest.fn(),
}));

jest.mock('@/lib/firebase-client', () => ({
  db: jest.fn(),
}));

describe('useBooks Hook', () => {
  let queryClient: QueryClient;

  // Create a wrapper with React Query provider
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    // Reset query client before each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    // Reset mocks
    jest.clearAllMocks();
    
    // Mock getDocs to return mock books
    (firebaseFirestore.getDocs as jest.Mock).mockResolvedValue(
      createMockQuerySnapshot(mockBooks)
    );
  });

  it('should fetch books with required parameters', async () => {
    const mockInitialBooks = mockBooks as unknown as Book[];
    const mockProps = {
      initialBooks: mockInitialBooks,
      totalBooks: mockBooks.length,
      statusFilter: '',
      ratingFilter: '' as const, // Use const assertion to match the type
      genreFilter: ''
    };
    
    const { result } = renderHook(() => useBooks(mockProps), { wrapper });

    // Initial state should have the initialBooks
    expect(result.current.books).toEqual(mockInitialBooks);

    // Wait for any async operations
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify results
    expect(result.current.hasMore).toBe(false); // No more books to load
  });

  it('should handle loading more books', async () => {
    const mockInitialBooks = mockBooks as unknown as Book[];
    const mockProps = {
      initialBooks: mockInitialBooks,
      totalBooks: mockBooks.length * 2, // Pretend there are more books
      statusFilter: '',
      ratingFilter: '' as const, // Use const assertion to match the type
      genreFilter: ''
    };
    
    // Mock the getDocs to return more books on loadMoreBooks call
    (firebaseFirestore.getDocs as jest.Mock).mockResolvedValue(
      createMockQuerySnapshot(mockBooks) // Return the same books for simplicity
    );

    const { result } = renderHook(() => useBooks(mockProps), { wrapper });

    // Initial state
    expect(result.current.books.length).toBe(mockInitialBooks.length);
    
    // Call loadMoreBooks
    await result.current.loadMoreBooks();

    // Wait for the additional books to load
    await waitFor(() => {
      // We should have the original books plus the loaded books
      expect(result.current.books.length).toBeGreaterThan(mockInitialBooks.length);
    });
  });

  it('should handle filter changes', async () => {
    const mockInitialBooks = mockBooks as unknown as Book[];
    const mockProps = {
      initialBooks: mockInitialBooks,
      totalBooks: mockBooks.length,
      statusFilter: '',
      ratingFilter: '' as const, // Use const assertion to match the type
      genreFilter: ''
    };

    // Mock filtered results for a status filter
    const filteredBooks = mockBooks.filter(book => book.status === 'Read');
    (firebaseFirestore.getDocs as jest.Mock).mockResolvedValue(
      createMockQuerySnapshot(filteredBooks)
    );

    const { result, rerender } = renderHook(
      (props) => useBooks(props), 
      { 
        wrapper,
        initialProps: mockProps
      }
    );

    // Now update with a filter
    rerender({
      ...mockProps,
      statusFilter: 'Read'
    });

    // Wait for the filter to be applied
    await waitFor(() => {
      // After filter change, loadMoreBooks gets called automatically
      expect(firebaseFirestore.where).toHaveBeenCalled();
    });
  });

  it('should handle errors when loading more books', async () => {
    const mockInitialBooks = mockBooks as unknown as Book[];
    const mockProps = {
      initialBooks: mockInitialBooks,
      totalBooks: mockBooks.length * 2, // More books available
      statusFilter: '',
      ratingFilter: '' as const, // Use const assertion to match the type
      genreFilter: ''
    };

    // First make loadMoreBooks succeed
    const { result } = renderHook(() => useBooks(mockProps), { wrapper });

    // Then make the next call fail
    const testError = new Error('Test error');
    (firebaseFirestore.getDocs as jest.Mock).mockRejectedValue(testError);

    // Call loadMoreBooks which should now fail
    await result.current.loadMoreBooks();

    // The error won't be exposed in the returned object, but we can verify that
    // the loading state returns to false
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // And the books array should remain unchanged
    expect(result.current.books).toEqual(mockInitialBooks);
  });
});
