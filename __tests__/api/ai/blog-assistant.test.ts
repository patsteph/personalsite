import { createMocks } from "node-mocks-http";
import handler from "@/pages/api/ai/blog-assistant";
import type { NextApiRequest, NextApiResponse } from "next";

// Mock Firebase Admin Auth
jest.mock("@/lib/api/server-auth", () => ({
  validateFirebaseIdToken: jest.fn(),
}));

// Mock blog assistant
jest.mock("@/lib/ai/blog-assistant", () => ({
  createWritingAssistant: jest.fn(() => ({
    execute: jest.fn(),
  })),
  AssistanceTask: {
    IMPROVE: "improve",
    SUMMARIZE: "summarize",
    EXPAND: "expand",
    SEO_OPTIMIZE: "seo-optimize",
  },
}));

// Mock AI service config
jest.mock("@/lib/ai/ai-service", () => ({
  AIServiceConfig: {},
}));

// Mock input validation
jest.mock("@/lib/security/input-validation", () => ({
  InputValidator: jest.fn().mockImplementation(() => ({
    validateField: jest.fn(() => ({ isValid: true, errors: [] })),
  })),
}));

// Mock schemas
jest.mock("@/lib/schemas/ai", () => ({
  BlogAssistantRequestSchema: {
    safeParse: jest.fn(() => ({
      success: true,
      data: {
        task: "improve",
        content: "Test content to improve",
        options: { tone: "professional" },
        provider: "openai",
        temperature: 0.7,
      },
    })),
  },
}));

describe("/api/ai/blog-assistant", () => {
  const mockValidateToken = jest.mocked(
    require("@/lib/api/server-auth").validateFirebaseIdToken,
  );
  const mockCreateAssistant = jest.mocked(
    require("@/lib/ai/blog-assistant").createWritingAssistant,
  );
  const mockExecute = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateToken.mockResolvedValue("test-user-id");
    mockCreateAssistant.mockReturnValue({ execute: mockExecute });
  });

  it("processes improvement task successfully", async () => {
    mockExecute.mockResolvedValue({
      success: true,
      content: "Improved content with better structure and clarity.",
    });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: { authorization: "Bearer valid-token" },
      body: {
        task: "improve",
        content: "This is content that needs improvement.",
        options: { tone: "professional" },
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.content).toBe(
      "Improved content with better structure and clarity.",
    );
    expect(mockExecute).toHaveBeenCalledWith(
      "This is content that needs improvement.",
      { tone: "professional" },
    );
  });

  it("processes summarization task successfully", async () => {
    mockExecute.mockResolvedValue({
      success: true,
      content: "Brief summary of the main points.",
    });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: { authorization: "Bearer valid-token" },
      body: {
        task: "summarize",
        content:
          "Long article content that needs to be summarized into key points.",
        options: { length: "shorter" },
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.content).toBe("Brief summary of the main points.");
  });

  it("processes SEO optimization task", async () => {
    mockExecute.mockResolvedValue({
      success: true,
      content: "SEO-optimized content with better keywords and structure.",
    });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: { authorization: "Bearer valid-token" },
      body: {
        task: "seo-optimize",
        content: "Content that needs SEO optimization.",
        options: { keywords: ["web development", "javascript"] },
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.content).toBe(
      "SEO-optimized content with better keywords and structure.",
    );
  });

  it("validates authentication", async () => {
    mockValidateToken.mockResolvedValue(null);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: { authorization: "Bearer invalid-token" },
      body: {
        task: "improve",
        content: "Test content",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.error).toBe("Unauthorized");
  });

  it("validates request data with schema", async () => {
    jest
      .mocked(require("@/lib/schemas/ai").BlogAssistantRequestSchema.safeParse)
      .mockReturnValue({
        success: false,
        error: { errors: [{ message: "Task is required" }] },
      });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: { authorization: "Bearer valid-token" },
      body: {
        content: "Test content",
        // Missing task field
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid request data");
  });

  it("validates content with input validator", async () => {
    const mockValidator = jest.mocked(
      require("@/lib/security/input-validation").InputValidator,
    );
    mockValidator.mockImplementation(() => ({
      validateField: jest.fn(() => ({
        isValid: false,
        errors: ["Content is too short"],
      })),
    }));

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: { authorization: "Bearer valid-token" },
      body: {
        task: "improve",
        content: "Too short",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.error).toBe("Content validation failed");
  });

  it("handles AI service errors", async () => {
    mockExecute.mockResolvedValue({
      success: false,
      error: "AI service temporarily unavailable",
    });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: { authorization: "Bearer valid-token" },
      body: {
        task: "improve",
        content: "Test content",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.error).toBe("AI service temporarily unavailable");
  });

  it("handles AI service exceptions", async () => {
    mockExecute.mockRejectedValue(new Error("Network timeout"));

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: { authorization: "Bearer valid-token" },
      body: {
        task: "improve",
        content: "Test content",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.error).toBe("Network timeout");
  });

  it("validates task type", async () => {
    jest
      .mocked(require("@/lib/schemas/ai").BlogAssistantRequestSchema.safeParse)
      .mockReturnValue({
        success: false,
        error: { errors: [{ message: "Invalid task type" }] },
      });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: { authorization: "Bearer valid-token" },
      body: {
        task: "invalid-task",
        content: "Test content",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid request data");
  });

  it("configures AI service with provided options", async () => {
    mockExecute.mockResolvedValue({
      success: true,
      content: "Processed content",
    });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: { authorization: "Bearer valid-token" },
      body: {
        task: "improve",
        content: "Test content",
        provider: "anthropic",
        temperature: 0.5,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(mockCreateAssistant).toHaveBeenCalledWith(
      "improve",
      expect.objectContaining({
        isAdminRequest: true,
        provider: "anthropic",
        temperature: 0.5,
      }),
    );
  });

  it("handles different task types correctly", async () => {
    const tasks = [
      "improve",
      "summarize",
      "expand",
      "seo-optimize",
      "proofread",
    ];

    for (const task of tasks) {
      mockExecute.mockResolvedValue({
        success: true,
        content: `Processed content for ${task}`,
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {
          task,
          content: "Test content",
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockCreateAssistant).toHaveBeenCalledWith(
        task,
        expect.any(Object),
      );
    }
  });

  it("rejects non-POST methods", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "GET",
      headers: { authorization: "Bearer valid-token" },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.error).toBe("Method GET not allowed");
  });

  it("handles content length validation", async () => {
    jest
      .mocked(require("@/lib/schemas/ai").BlogAssistantRequestSchema.safeParse)
      .mockReturnValue({
        success: false,
        error: {
          errors: [{ message: "Content must be less than 10,000 characters" }],
        },
      });

    const longContent = "a".repeat(10001);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: { authorization: "Bearer valid-token" },
      body: {
        task: "improve",
        content: longContent,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid request data");
  });

  it("handles options validation", async () => {
    mockExecute.mockResolvedValue({
      success: true,
      content: "Processed content",
    });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: { authorization: "Bearer valid-token" },
      body: {
        task: "improve",
        content: "Test content",
        options: {
          tone: "professional",
          length: "longer",
          keywords: ["javascript", "react"],
        },
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(mockExecute).toHaveBeenCalledWith(
      "Test content",
      expect.objectContaining({
        tone: "professional",
        length: "longer",
        keywords: ["javascript", "react"],
      }),
    );
  });

  it("handles authentication token extraction errors", async () => {
    mockValidateToken.mockRejectedValue(new Error("Token parsing failed"));

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: { authorization: "Bearer malformed-token" },
      body: {
        task: "improve",
        content: "Test content",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.error).toBe("Token parsing failed");
  });
});
