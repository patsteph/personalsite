import handler from "@/pages/api/site-stats";
import { createApiMocks } from "../utils/api-test-utils";

// Mock Firebase
jest.mock("@/lib/firebase-client", () => ({
  db: {
    collection: jest.fn().mockReturnThis(),
    get: jest.fn(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  },
}));

import { db } from "@/lib/firebase-client";

describe("/api/site-stats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns site statistics successfully", async () => {
    const { req, res } = createApiMocks({
      method: "GET",
    });

    // Mock database responses
    const mockStats = {
      books: { size: 25 },
      posts: { size: 10 },
      signals: { size: 50 },
      feedback: { size: 15 },
    };

    (db.collection as jest.Mock)
      .mockReturnValueOnce({
        get: jest.fn().mockResolvedValue(mockStats.books),
      })
      .mockReturnValueOnce({
        get: jest.fn().mockResolvedValue(mockStats.posts),
      })
      .mockReturnValueOnce({
        get: jest.fn().mockResolvedValue(mockStats.signals),
      })
      .mockReturnValueOnce({
        get: jest.fn().mockResolvedValue(mockStats.feedback),
      });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      totalBooks: 25,
      totalPosts: 10,
      totalSignals: 50,
      totalFeedback: 15,
      lastUpdated: expect.any(String),
    });
  });

  it("rejects non-GET requests", async () => {
    const { req, res } = createApiMocks({
      method: "POST",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: "Method not allowed",
    });
  });

  it("handles database errors gracefully", async () => {
    const { req, res } = createApiMocks({
      method: "GET",
    });

    (db.collection as jest.Mock).mockReturnValue({
      get: jest.fn().mockRejectedValue(new Error("Database error")),
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: "Failed to fetch site statistics",
    });
  });

  it("handles empty collections", async () => {
    const { req, res } = createApiMocks({
      method: "GET",
    });

    // Mock empty collections
    const emptyCollection = { size: 0 };
    (db.collection as jest.Mock).mockReturnValue({
      get: jest.fn().mockResolvedValue(emptyCollection),
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      totalBooks: 0,
      totalPosts: 0,
      totalSignals: 0,
      totalFeedback: 0,
      lastUpdated: expect.any(String),
    });
  });

  it("includes proper lastUpdated timestamp", async () => {
    const { req, res } = createApiMocks({
      method: "GET",
    });

    const mockCollection = { size: 1 };
    (db.collection as jest.Mock).mockReturnValue({
      get: jest.fn().mockResolvedValue(mockCollection),
    });

    const beforeTime = new Date();
    await handler(req, res);
    const afterTime = new Date();

    const response = JSON.parse(res._getData());
    const lastUpdated = new Date(response.lastUpdated);

    expect(lastUpdated.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(lastUpdated.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });

  it("queries correct collections", async () => {
    const { req, res } = createApiMocks({
      method: "GET",
    });

    const mockCollection = { size: 1 };
    (db.collection as jest.Mock).mockReturnValue({
      get: jest.fn().mockResolvedValue(mockCollection),
    });

    await handler(req, res);

    expect(db.collection).toHaveBeenCalledWith("books");
    expect(db.collection).toHaveBeenCalledWith("posts");
    expect(db.collection).toHaveBeenCalledWith("signals");
    expect(db.collection).toHaveBeenCalledWith("feedback");
  });

  it("handles partial database failures", async () => {
    const { req, res } = createApiMocks({
      method: "GET",
    });

    let callCount = 0;
    (db.collection as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error("Posts collection error"));
        }
        return Promise.resolve({ size: 10 });
      }),
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: "Failed to fetch site statistics",
    });
  });

  it("returns consistent data structure", async () => {
    const { req, res } = createApiMocks({
      method: "GET",
    });

    const mockCollection = { size: 5 };
    (db.collection as jest.Mock).mockReturnValue({
      get: jest.fn().mockResolvedValue(mockCollection),
    });

    await handler(req, res);

    const response = JSON.parse(res._getData());

    expect(response).toHaveProperty("totalBooks");
    expect(response).toHaveProperty("totalPosts");
    expect(response).toHaveProperty("totalSignals");
    expect(response).toHaveProperty("totalFeedback");
    expect(response).toHaveProperty("lastUpdated");

    expect(typeof response.totalBooks).toBe("number");
    expect(typeof response.totalPosts).toBe("number");
    expect(typeof response.totalSignals).toBe("number");
    expect(typeof response.totalFeedback).toBe("number");
    expect(typeof response.lastUpdated).toBe("string");
  });
});
