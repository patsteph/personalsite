import { createMocks } from "node-mocks-http";
import handler from "@/pages/api/blog";
import type { NextApiRequest, NextApiResponse } from "next";

// Mock Firebase Admin
const mockDoc = {
  get: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockCollection = {
  add: jest.fn(),
  doc: jest.fn(() => mockDoc),
  where: jest.fn(() => ({
    where: jest.fn(() => ({
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(),
        })),
      })),
    })),
  })),
  orderBy: jest.fn(() => ({
    get: jest.fn(),
  })),
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

// Mock input validation
jest.mock("@/lib/security/input-validation", () => ({
  InputValidator: jest.fn().mockImplementation(() => ({
    validateField: jest.fn(() => ({ isValid: true, errors: [] })),
    validateObject: jest.fn(() => ({ isValid: true, errors: [] })),
  })),
}));

// Mock blog schema
jest.mock("@/lib/schemas/blog", () => ({
  BlogPostCreateSchema: {
    safeParse: jest.fn(() => ({
      success: true,
      data: {
        title: "Test Post",
        slug: "test-post",
        content: "This is test content for the blog post",
        published: false,
      },
    })),
  },
  BlogPostUpdateSchema: {
    safeParse: jest.fn(() => ({
      success: true,
      data: {
        title: "Updated Test Post",
        content: "Updated content",
      },
    })),
  },
}));

describe("/api/blog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET requests", () => {
    it("handles public GET for published posts", async () => {
      const mockPosts = [
        {
          id: "post1",
          data: () => ({
            title: "Post 1",
            published: true,
            publishedAt: new Date(),
          }),
        },
        {
          id: "post2",
          data: () => ({
            title: "Post 2",
            published: true,
            publishedAt: new Date(),
          }),
        },
      ];

      mockCollection.where().where().orderBy().limit().get.mockResolvedValue({
        docs: mockPosts,
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        query: { published: "true", limit: "5" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it("handles admin GET for all posts", async () => {
      const mockPosts = [
        {
          id: "post1",
          data: () => ({ title: "Post 1", published: true }),
        },
        {
          id: "post2",
          data: () => ({ title: "Post 2", published: false }),
        },
      ];

      mockCollection.orderBy().get.mockResolvedValue({
        docs: mockPosts,
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        query: { admin: "true" },
        headers: { authorization: "Bearer valid-token" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it("handles GET single post by slug", async () => {
      const mockPost = {
        id: "post1",
        data: () => ({
          title: "Test Post",
          slug: "test-post",
          published: true,
        }),
      };

      mockCollection
        .where()
        .where()
        .limit()
        .get.mockResolvedValue({
          empty: false,
          docs: [mockPost],
        });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        query: { slug: "test-post" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.title).toBe("Test Post");
    });

    it("returns 404 for non-existent slug", async () => {
      mockCollection.where().where().limit().get.mockResolvedValue({
        empty: true,
        docs: [],
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        query: { slug: "non-existent" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Blog post not found");
    });
  });

  describe("POST requests", () => {
    it("creates new blog post with valid data", async () => {
      const mockDocRef = { id: "new-post-id" };
      mockCollection.add.mockResolvedValue(mockDocRef);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          title: "New Blog Post",
          slug: "new-blog-post",
          content: "This is the content of the new blog post",
          published: false,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.id).toBe("new-post-id");
      expect(mockCollection.add).toHaveBeenCalled();
    });

    it("validates required authentication for POST", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          title: "New Blog Post",
          content: "Content",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("No token provided");
    });

    it("validates blog post data", async () => {
      // Mock validation failure
      jest
        .mocked(require("@/lib/schemas/blog").BlogPostCreateSchema.safeParse)
        .mockReturnValue({
          success: false,
          error: { errors: [{ message: "Title is required" }] },
        });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          content: "Content without title",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid blog post data");
    });
  });

  describe("PUT requests", () => {
    it("updates existing blog post", async () => {
      const mockUpdatedDoc = {
        id: "post-id",
        exists: true,
        data: () => ({ title: "Updated Post", content: "Updated content" }),
      };

      mockDoc.update.mockResolvedValue(undefined);
      mockDoc.get.mockResolvedValue(mockUpdatedDoc);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "PUT",
        query: { id: "post-id" },
        headers: { authorization: "Bearer valid-token" },
        body: {
          title: "Updated Post",
          content: "Updated content",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.title).toBe("Updated Post");
      expect(mockDoc.update).toHaveBeenCalled();
    });

    it("validates blog post ID for PUT", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "PUT",
        headers: { authorization: "Bearer valid-token" },
        body: { title: "Updated Post" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Blog post ID is required");
    });

    it("handles non-existent post for PUT", async () => {
      mockDoc.update.mockResolvedValue(undefined);
      mockDoc.get.mockResolvedValue({ exists: false });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "PUT",
        query: { id: "non-existent" },
        headers: { authorization: "Bearer valid-token" },
        body: { title: "Updated Post" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Blog post not found after update");
    });
  });

  describe("DELETE requests", () => {
    it("deletes existing blog post", async () => {
      mockDoc.delete.mockResolvedValue(undefined);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "DELETE",
        query: { id: "post-to-delete" },
        headers: { authorization: "Bearer valid-token" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.id).toBe("post-to-delete");
      expect(mockDoc.delete).toHaveBeenCalled();
    });

    it("validates blog post ID for DELETE", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "DELETE",
        headers: { authorization: "Bearer valid-token" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Blog post ID is required");
    });
  });

  describe("Authentication", () => {
    it("handles invalid authentication tokens", async () => {
      // Mock auth failure
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
        body: { title: "Test Post" },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized - Invalid token");
    });
  });

  describe("Error handling", () => {
    it("handles database errors gracefully", async () => {
      mockCollection.add.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          title: "Test Post",
          slug: "test-post",
          content: "Test content",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe("Database connection failed");
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
