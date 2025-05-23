// Enhanced Firebase mocks for testing
export const mockFirestore = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  get: jest.fn(),
  add: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  set: jest.fn(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  startAfter: jest.fn().mockReturnThis(),
};

export const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  setPersistence: jest.fn(),
};

export const mockDocSnapshot = {
  exists: true,
  id: "mock-doc-id",
  data: jest.fn(() => ({ title: "Mock Document" })),
  ref: { path: "mock/path" },
};

export const mockQuerySnapshot = {
  empty: false,
  size: 1,
  docs: [mockDocSnapshot],
  forEach: jest.fn((callback) => [mockDocSnapshot].forEach(callback)),
};

export const createMockFirebaseDoc = (data: any) => ({
  exists: () => true,
  data: () => data,
  id: "mock-id",
  ref: { path: "mock/path" },
});

export const createMockFirebaseCollection = (docs: any[]) => ({
  empty: docs.length === 0,
  size: docs.length,
  docs: docs.map(createMockFirebaseDoc),
  forEach: jest.fn((callback) => docs.forEach(callback)),
});

// Mock Firebase admin functions
export const mockFirebaseAdmin = {
  firestore: () => mockFirestore,
  auth: () => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: "test-user-id",
      email: "test@example.com",
    }),
    getUser: jest.fn().mockResolvedValue({
      uid: "test-user-id",
      email: "test@example.com",
    }),
  }),
};
