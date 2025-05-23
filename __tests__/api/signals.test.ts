import { createMocks } from "node-mocks-http";
import handler from "@/pages/api/signals";
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
    orderBy: jest.fn(() => ({
      limit: jest.fn(() => ({
        get: jest.fn(),
      })),
    })),
  })),
  orderBy: jest.fn(() => ({
    limit: jest.fn(() => ({
      get: jest.fn(),
    })),
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

// Mock signal schema validation
jest.mock("@/lib/schemas/signals", () => ({
  SignalSchema: {
    safeParse: jest.fn(() => ({
      success: true,
      data: {
        type: "article",
        title: "Test Signal",
        description: "Test description",
        url: "https://example.com",
        tags: ["test"],
      },
    })),
  },
}));

describe("/api/signals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET requests", () => {
    it("fetches all signals without authentication", async () => {
      const mockSignals = [
        {
          id: "signal1",
          data: () => ({
            type: "article",
            title: "Test Signal 1",
            description: "Description 1",
            url: "https://example1.com",
            tags: ["tech"],
            createdAt: new Date(),
            published: true,
          }),
        },
        {
          id: "signal2",
          data: () => ({
            type: "newsletter",
            title: "Test Signal 2",
            description: "Description 2",
            url: "https://example2.com",
            tags: ["business"],
            createdAt: new Date(),
            published: true,
          }),
        },
      ];

      mockCollection.orderBy().get.mockResolvedValue({
        docs: mockSignals,
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.signals).toHaveLength(2);
      expect(data.signals[0].title).toBe("Test Signal 1");
    });

    it("filters signals by type", async () => {
      const mockSignals = [
        {
          id: "signal1",
          data: () => ({ type: "article", title: "Article Signal" }),
        },
      ];

      mockCollection.where().orderBy().limit().get.mockResolvedValue({
        docs: mockSignals,
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        query: { type: "article" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockCollection.where).toHaveBeenCalledWith(
        "type",
        "==",
        "article",
      );
    });

    it("filters signals by tag", async () => {
      const mockSignals = [
        {
          id: "signal1",
          data: () => ({ title: "Tagged Signal", tags: ["tech"] }),
        },
      ];

      mockCollection.where().orderBy().limit().get.mockResolvedValue({
        docs: mockSignals,
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        query: { tag: "tech" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockCollection.where).toHaveBeenCalledWith(
        "tags",
        "array-contains",
        "tech",
      );
    });

    it("applies limit parameter", async () => {
      mockCollection.orderBy().limit().get.mockResolvedValue({
        docs: [],
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        query: { limit: "5" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockCollection.orderBy().limit).toHaveBeenCalledWith(5);
    });

    it("handles invalid limit parameter", async () => {
      mockCollection.orderBy().limit().get.mockResolvedValue({
        docs: [],
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        query: { limit: "invalid" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      // Should default to 20
      expect(mockCollection.orderBy().limit).toHaveBeenCalledWith(20);
    });
  });

  describe("POST requests", () => {
    it("creates new signal with valid data", async () => {
      const mockDocRef = { id: "new-signal-id" };
      mockCollection.add.mockResolvedValue(mockDocRef);

      const signalData = {
        type: "article",
        title: "New Signal",
        description: "Signal description",
        url: "https://example.com/article",
        tags: ["tech", "programming"],
        publisher: "Tech Blog",
      };

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: signalData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.signal.id).toBe("new-signal-id");
      expect(mockCollection.add).toHaveBeenCalled();
    });

    it("validates required authentication for POST", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          type: "article",
          title: "Test Signal",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("No token provided");
    });

    it("validates signal data with schema", async () => {
      // Mock validation failure
      jest
        .mocked(require("@/lib/schemas/signals").SignalSchema.safeParse)
        .mockReturnValue({
          success: false,
          error: { errors: [{ message: "Title is required" }] },
        });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          type: "article",
          // Missing required fields
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid signal data");
    });

    it("validates signal type enum", async () => {
      jest
        .mocked(require("@/lib/schemas/signals").SignalSchema.safeParse)
        .mockReturnValue({
          success: false,
          error: { errors: [{ message: "Invalid signal type" }] },
        });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          type: "invalid-type",
          title: "Test Signal",
          description: "Description",
          url: "https://example.com",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid signal data");
    });

    it("validates URL format", async () => {
      jest
        .mocked(require("@/lib/schemas/signals").SignalSchema.safeParse)
        .mockReturnValue({
          success: false,
          error: { errors: [{ message: "Invalid URL format" }] },
        });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          type: "article",
          title: "Test Signal",
          description: "Description",
          url: "not-a-valid-url",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid signal data");
    });

    it("validates tags array", async () => {
      jest
        .mocked(require("@/lib/schemas/signals").SignalSchema.safeParse)
        .mockReturnValue({
          success: false,
          error: { errors: [{ message: "Tags must be an array" }] },
        });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          type: "article",
          title: "Test Signal",
          description: "Description",
          url: "https://example.com",
          tags: "not-an-array", // Invalid format
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid signal data");
    });

    it("adds timestamp and default published status", async () => {
      const mockDocRef = { id: "new-signal-id" };
      mockCollection.add.mockResolvedValue(mockDocRef);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          type: "article",
          title: "Test Signal",
          description: "Description",
          url: "https://example.com",
          tags: ["test"],
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: expect.any(Object), // Firestore Timestamp
          published: true, // Default value
        }),
      );
    });
  });

  describe("PUT requests", () => {
    it("updates existing signal", async () => {
      const mockUpdatedDoc = {
        id: "signal-id",
        exists: true,
        data: () => ({
          title: "Updated Signal",
          description: "Updated description",
          updatedAt: new Date(),
        }),
      };

      mockDoc.update.mockResolvedValue(undefined);
      mockDoc.get.mockResolvedValue(mockUpdatedDoc);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "PUT",
        query: { id: "signal-id" },
        headers: { authorization: "Bearer valid-token" },
        body: {
          title: "Updated Signal",
          description: "Updated description",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.signal.title).toBe("Updated Signal");
      expect(mockDoc.update).toHaveBeenCalled();
    });

    it("validates signal ID for updates", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "PUT",
        headers: { authorization: "Bearer valid-token" },
        body: { title: "Updated Signal" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Signal ID is required");
    });

    it("handles non-existent signal updates", async () => {
      mockDoc.update.mockResolvedValue(undefined);
      mockDoc.get.mockResolvedValue({ exists: false });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "PUT",
        query: { id: "non-existent" },
        headers: { authorization: "Bearer valid-token" },
        body: { title: "Updated Signal" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Signal not found after update");
    });
  });

  describe("DELETE requests", () => {
    it("deletes existing signal", async () => {
      mockDoc.delete.mockResolvedValue(undefined);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "DELETE",
        query: { id: "signal-to-delete" },
        headers: { authorization: "Bearer valid-token" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.message).toBe("Signal deleted successfully");
      expect(mockDoc.delete).toHaveBeenCalled();
    });

    it("validates signal ID for deletion", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "DELETE",
        headers: { authorization: "Bearer valid-token" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Signal ID is required");
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
        method: "POST",
        headers: { authorization: "Bearer invalid-token" },
        body: { type: "article", title: "Test" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });
  });

  describe("Error handling", () => {
    it("handles database errors gracefully", async () => {
      mockCollection
        .orderBy()
        .get.mockRejectedValue(new Error("Database connection failed"));

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Database connection failed");
    });

    it("handles Firestore query errors", async () => {
      mockCollection.add.mockRejectedValue(new Error("Firestore write failed"));

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          type: "article",
          title: "Test Signal",
          description: "Description",
          url: "https://example.com",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Firestore write failed");
    });
  });

  describe("Data sanitization", () => {
    it("sanitizes signal title and description", async () => {
      mockCollection.add.mockResolvedValue({ id: "new-signal" });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          type: "article",
          title: "  Signal Title  ", // Extra whitespace
          description: "  Signal description  ",
          url: "https://example.com",
          tags: ["test"],
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Signal Title", // Should be trimmed
          description: "Signal description", // Should be trimmed
        }),
      );
    });

    it("normalizes tags to lowercase", async () => {
      mockCollection.add.mockResolvedValue({ id: "new-signal" });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          type: "article",
          title: "Test Signal",
          description: "Description",
          url: "https://example.com",
          tags: ["Tech", "PROGRAMMING", "Web-Dev"], // Mixed case
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ["tech", "programming", "web-dev"], // Should be normalized
        }),
      );
    });
  });

  describe("Unsupported methods", () => {
    it("returns 405 for unsupported HTTP methods", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "PATCH",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Method not allowed");
    });
  });
});
