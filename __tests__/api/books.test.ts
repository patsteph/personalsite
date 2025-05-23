import { createMocks } from "node-mocks-http";
import handler from "@/pages/api/books";
import type { NextApiRequest, NextApiResponse } from "next";

// Mock Firebase Admin
const mockDoc = {
  get: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  set: jest.fn(),
};

const mockCollection = {
  add: jest.fn(),
  doc: jest.fn(() => mockDoc),
  where: jest.fn(() => ({
    get: jest.fn(),
  })),
  get: jest.fn(),
};

jest.mock("@/lib/firebase-admin", () => ({
  initializeAdminApp: jest.fn(),
  getAdminFirestore: jest.fn(() => ({
    collection: jest.fn(() => mockCollection),
  })),
  getAdminAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(() => Promise.resolve({ uid: "test-user" })),
  })),
}));

// Mock Google Books API
jest.mock("@/lib/google-books", () => ({
  searchGoogleBooks: jest.fn(),
  getBookDetails: jest.fn(),
}));

describe("/api/books", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET requests", () => {
    it("fetches all books for authenticated user", async () => {
      const mockBooks = [
        {
          id: "book1",
          data: () => ({
            title: "Test Book 1",
            authors: ["Author 1"],
            status: "read",
            dateAdded: new Date(),
          }),
        },
        {
          id: "book2",
          data: () => ({
            title: "Test Book 2",
            authors: ["Author 2"],
            status: "to-read",
            dateAdded: new Date(),
          }),
        },
      ];

      mockCollection.get.mockResolvedValue({
        docs: mockBooks,
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        headers: { authorization: "Bearer valid-token" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.books).toHaveLength(2);
      expect(data.books[0].title).toBe("Test Book 1");
    });

    it("filters books by status", async () => {
      const mockBooks = [
        {
          id: "book1",
          data: () => ({ title: "Read Book", status: "read" }),
        },
      ];

      mockCollection.where().get.mockResolvedValue({
        docs: mockBooks,
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        query: { status: "read" },
        headers: { authorization: "Bearer valid-token" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockCollection.where).toHaveBeenCalledWith("status", "==", "read");
    });

    it("searches books by title", async () => {
      const mockBooks = [
        {
          id: "book1",
          data: () => ({ title: "Matching Book", authors: ["Author"] }),
        },
      ];

      mockCollection.get.mockResolvedValue({
        docs: mockBooks,
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        query: { search: "Matching" },
        headers: { authorization: "Bearer valid-token" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.books).toHaveLength(1);
    });

    it("requires authentication for GET", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("No token provided");
    });
  });

  describe("POST requests", () => {
    it("adds a new book successfully", async () => {
      const mockDocRef = { id: "new-book-id" };
      mockCollection.add.mockResolvedValue(mockDocRef);

      // Mock duplicate check
      mockCollection.where().get.mockResolvedValue({ empty: true });

      const bookData = {
        title: "New Book",
        authors: ["New Author"],
        isbn: "1234567890",
        googleBooksId: "google123",
        status: "to-read",
      };

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: bookData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.book.id).toBe("new-book-id");
      expect(mockCollection.add).toHaveBeenCalled();
    });

    it("validates required fields", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          // Missing title and authors
          isbn: "1234567890",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain("required");
    });

    it("prevents duplicate books by ISBN", async () => {
      // Mock finding existing book
      mockCollection.where().get.mockResolvedValue({
        empty: false,
        docs: [
          { id: "existing-book", data: () => ({ title: "Existing Book" }) },
        ],
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          title: "Duplicate Book",
          authors: ["Author"],
          isbn: "1234567890",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(409);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain("already exists");
    });

    it("prevents duplicate books by Google Books ID", async () => {
      // Mock ISBN check (empty)
      mockCollection
        .where()
        .get.mockResolvedValueOnce({ empty: true })
        .mockResolvedValueOnce({
          empty: false,
          docs: [
            { id: "existing-book", data: () => ({ title: "Existing Book" }) },
          ],
        });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          title: "Duplicate Book",
          authors: ["Author"],
          googleBooksId: "google123",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(409);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain("already exists");
    });

    it("handles invalid authors array", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          title: "Test Book",
          authors: "Not an array", // Invalid format
          status: "to-read",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain("array");
    });
  });

  describe("PUT requests", () => {
    it("updates existing book", async () => {
      const mockUpdatedDoc = {
        id: "book-id",
        exists: true,
        data: () => ({
          title: "Updated Book",
          authors: ["Updated Author"],
          status: "read",
        }),
      };

      mockDoc.update.mockResolvedValue(undefined);
      mockDoc.get.mockResolvedValue(mockUpdatedDoc);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "PUT",
        query: { id: "book-id" },
        headers: { authorization: "Bearer valid-token" },
        body: {
          title: "Updated Book",
          status: "read",
          userRating: 5,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.book.title).toBe("Updated Book");
      expect(mockDoc.update).toHaveBeenCalled();
    });

    it("validates book ID for updates", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "PUT",
        headers: { authorization: "Bearer valid-token" },
        body: { title: "Updated Book" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Book ID is required");
    });

    it("handles non-existent book updates", async () => {
      mockDoc.update.mockResolvedValue(undefined);
      mockDoc.get.mockResolvedValue({ exists: false });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "PUT",
        query: { id: "non-existent" },
        headers: { authorization: "Bearer valid-token" },
        body: { title: "Updated Book" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Book not found after update");
    });

    it("validates user rating range", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "PUT",
        query: { id: "book-id" },
        headers: { authorization: "Bearer valid-token" },
        body: {
          userRating: 6, // Invalid rating (should be 1-5)
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain("rating");
    });
  });

  describe("DELETE requests", () => {
    it("deletes existing book", async () => {
      mockDoc.delete.mockResolvedValue(undefined);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "DELETE",
        query: { id: "book-to-delete" },
        headers: { authorization: "Bearer valid-token" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.message).toBe("Book deleted successfully");
      expect(mockDoc.delete).toHaveBeenCalled();
    });

    it("validates book ID for deletion", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "DELETE",
        headers: { authorization: "Bearer valid-token" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Book ID is required");
    });
  });

  describe("Authentication and Authorization", () => {
    it("handles invalid tokens", async () => {
      jest
        .mocked(require("@/lib/firebase-admin").getAdminAuth)
        .mockReturnValue({
          verifyIdToken: jest.fn(() =>
            Promise.reject(new Error("Invalid token")),
          ),
        });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        headers: { authorization: "Bearer invalid-token" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });

    it("handles missing authorization header", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: { title: "Test Book", authors: ["Author"] },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("No token provided");
    });
  });

  describe("Error handling", () => {
    it("handles database connection errors", async () => {
      mockCollection.get.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        headers: { authorization: "Bearer valid-token" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Database connection failed");
    });

    it("handles malformed request body", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
      });

      // Simulate malformed body
      req.body = undefined;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain("required");
    });
  });

  describe("Data validation and sanitization", () => {
    it("sanitizes book title and author inputs", async () => {
      mockCollection.where().get.mockResolvedValue({ empty: true });
      mockCollection.add.mockResolvedValue({ id: "new-book" });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          title: "  Test Book  ", // Extra whitespace
          authors: ["  Author Name  "],
          status: "to-read",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Book", // Trimmed
          authors: ["Author Name"], // Trimmed
        }),
      );
    });

    it("validates book status values", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          title: "Test Book",
          authors: ["Author"],
          status: "invalid-status", // Invalid status
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain("status");
    });
  });

  describe("Unsupported methods", () => {
    it("returns 405 for unsupported HTTP methods", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "PATCH",
        headers: { authorization: "Bearer valid-token" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Method not allowed");
    });
  });
});
