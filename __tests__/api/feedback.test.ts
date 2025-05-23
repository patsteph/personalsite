import handler from "@/pages/api/feedback";
import { createApiMocks } from "../utils/api-test-utils";

// Mock Firebase Admin
jest.mock("@/lib/firebase-admin", () => ({
  getAdminFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn(() => Promise.resolve({ id: "mock-doc-id" })),
    })),
  })),
}));

// Mock input validation
jest.mock("@/lib/security/input-validation", () => ({
  InputValidator: jest.fn().mockImplementation(() => ({
    validateField: jest.fn(() => ({ isValid: true, errors: [] })),
  })),
}));

describe("/api/feedback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("successfully submits feedback", async () => {
    const { req, res } = createApiMocks({
      method: "POST",
      body: {
        feedback: "This is great feedback!",
        url: "https://example.com/page",
        timestamp: "2023-01-01T00:00:00.000Z",
      },
    });

    const mockAdd = jest.fn().mockResolvedValue({ id: "feedback-id" });
    (db.collection as jest.Mock).mockReturnValue({ add: mockAdd });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      message: "Feedback submitted successfully",
    });

    expect(db.collection).toHaveBeenCalledWith("feedback");
    expect(mockAdd).toHaveBeenCalledWith({
      feedback: "This is great feedback!",
      url: "https://example.com/page",
      timestamp: "2023-01-01T00:00:00.000Z",
      submittedAt: expect.any(Date),
    });
  });

  it("rejects non-POST requests", async () => {
    const { req, res } = createApiMocks({
      method: "GET",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: "Method not allowed",
    });
  });

  it("validates required feedback field", async () => {
    const { req, res } = createApiMocks({
      method: "POST",
      body: {
        url: "https://example.com/page",
        timestamp: "2023-01-01T00:00:00.000Z",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: "Feedback is required",
    });
  });

  it("validates feedback length", async () => {
    const { req, res } = createApiMocks({
      method: "POST",
      body: {
        feedback: "", // Empty feedback
        url: "https://example.com/page",
        timestamp: "2023-01-01T00:00:00.000Z",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: "Feedback is required",
    });
  });

  it("validates maximum feedback length", async () => {
    const longFeedback = "a".repeat(5001); // Exceeds 5000 character limit

    const { req, res } = createApiMocks({
      method: "POST",
      body: {
        feedback: longFeedback,
        url: "https://example.com/page",
        timestamp: "2023-01-01T00:00:00.000Z",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: "Feedback is too long (maximum 5000 characters)",
    });
  });

  it("handles database errors", async () => {
    const { req, res } = createApiMocks({
      method: "POST",
      body: {
        feedback: "This is feedback",
        url: "https://example.com/page",
        timestamp: "2023-01-01T00:00:00.000Z",
      },
    });

    const mockAdd = jest.fn().mockRejectedValue(new Error("Database error"));
    (db.collection as jest.Mock).mockReturnValue({ add: mockAdd });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: "Failed to submit feedback",
    });
  });

  it("sanitizes feedback content", async () => {
    const { req, res } = createApiMocks({
      method: "POST",
      body: {
        feedback: '<script>alert("xss")</script>This is feedback',
        url: "https://example.com/page",
        timestamp: "2023-01-01T00:00:00.000Z",
      },
    });

    const mockAdd = jest.fn().mockResolvedValue({ id: "feedback-id" });
    (db.collection as jest.Mock).mockReturnValue({ add: mockAdd });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);

    // Should strip HTML tags
    expect(mockAdd).toHaveBeenCalledWith({
      feedback: "This is feedback",
      url: "https://example.com/page",
      timestamp: "2023-01-01T00:00:00.000Z",
      submittedAt: expect.any(Date),
    });
  });

  it("validates URL format", async () => {
    const { req, res } = createApiMocks({
      method: "POST",
      body: {
        feedback: "This is feedback",
        url: "not-a-valid-url",
        timestamp: "2023-01-01T00:00:00.000Z",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: "Invalid URL format",
    });
  });

  it("validates timestamp format", async () => {
    const { req, res } = createApiMocks({
      method: "POST",
      body: {
        feedback: "This is feedback",
        url: "https://example.com/page",
        timestamp: "invalid-date",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: "Invalid timestamp format",
    });
  });

  it("allows optional fields to be missing", async () => {
    const { req, res } = createApiMocks({
      method: "POST",
      body: {
        feedback: "This is feedback",
        // url and timestamp are optional
      },
    });

    const mockAdd = jest.fn().mockResolvedValue({ id: "feedback-id" });
    (db.collection as jest.Mock).mockReturnValue({ add: mockAdd });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(mockAdd).toHaveBeenCalledWith({
      feedback: "This is feedback",
      url: undefined,
      timestamp: undefined,
      submittedAt: expect.any(Date),
    });
  });

  it("handles malformed JSON body", async () => {
    const { req, res } = createApiMocks({
      method: "POST",
    });

    // Simulate malformed JSON by setting body to invalid JSON
    req.body = undefined;

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: "Invalid request body",
    });
  });
});
