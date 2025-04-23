// __mocks__/firebase-mocks.ts
import { User } from 'firebase/auth';

// Mock Firebase Auth User
// Create a partial implementation and then cast as User to avoid TypeScript errors
export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  isAnonymous: false,
  photoURL: null,
  providerData: [],
  metadata: {
    creationTime: '2025-01-01T00:00:00Z',
    lastSignInTime: '2025-04-01T00:00:00Z',
  },
  getIdToken: jest.fn().mockResolvedValue('mock-token'),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  delete: jest.fn(),
  toJSON: jest.fn(),
  tenantId: null,
  phoneNumber: null,
  providerId: 'password',
  // Added required properties for User type
  refreshToken: 'mock-refresh-token',
  stsTokenManager: {
    refreshToken: 'mock-refresh-token',
    accessToken: 'mock-access-token',
    expirationTime: Date.now() + 3600000,
  },
} as User;

// Mock Firestore Data
export const mockBooks = [
  {
    id: 'book-1',
    title: 'Test Book 1',
    authors: ['Author One'],
    status: 'Read',
    dateAdded: { toDate: () => new Date('2025-01-01') },
    userRating: 4,
    imageLinks: {
      thumbnail: 'https://example.com/thumbnail1.jpg',
    },
    categories: ['Fiction', 'Fantasy'],
  },
  {
    id: 'book-2',
    title: 'Test Book 2',
    authors: ['Author Two'],
    status: 'Currently Reading',
    dateAdded: { toDate: () => new Date('2025-02-01') },
    userRating: 3,
    imageLinks: {
      thumbnail: null, // Testing null handling
    },
    categories: ['Non-fiction', 'Science'],
  },
  {
    id: 'book-3',
    title: 'Test Book 3',
    authors: ['Author Three'],
    status: 'To Read',
    dateAdded: { toDate: () => new Date('2025-03-01') },
    // No userRating - testing undefined handling
    // No imageLinks - testing undefined handling
    categories: ['Biography'],
  },
];

// Mock Signals data, ensuring null values (not undefined) for Firestore compatibility
export const mockSignals = [
  {
    id: 'signal-1',
    type: 'article',
    title: 'Test Article',
    url: 'https://example.com/article',
    imageUrl: 'https://example.com/image.jpg',
    description: 'This is a test article',
    author: 'Test Author',
    source: 'Test Source',
    publishDate: '2025-03-01T00:00:00Z',
    dateAdded: { toDate: () => new Date('2025-03-01') },
    readingTime: 5,
    tags: ['tech', 'programming'],
    featured: true,
  },
  {
    id: 'signal-2',
    type: 'newsletter',
    title: 'Test Newsletter',
    url: 'https://example.com/newsletter',
    imageUrl: null, // Null instead of undefined for Firestore compatibility
    description: 'This is a test newsletter',
    publisher: 'Test Publisher',
    frequency: 'weekly',
    dateAdded: { toDate: () => new Date('2025-02-15') },
    tags: ['business', 'finance'],
    featured: false,
    subscriptionUrl: 'https://example.com/subscribe',
  },
];

// Mock Firestore Documents
export const createMockDoc = (id: string, data: any) => ({
  id,
  data: () => data,
  exists: () => !!data,
  ref: {
    id,
    path: `mocks/${id}`,
  },
});

// Mock Firestore Query Snapshot
export const createMockQuerySnapshot = (docs: any[]) => ({
  docs: docs.map(doc => createMockDoc(doc.id, doc)),
  empty: docs.length === 0,
  size: docs.length,
  forEach: (callback: (doc: any) => void) => docs.forEach(doc => callback(createMockDoc(doc.id, doc))),
});
