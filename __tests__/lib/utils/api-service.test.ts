// Mock Firebase auth
jest.mock("@/lib/firebase-client", () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn(),
    },
  },
}));

import {
  handleApiError,
  getAuthToken,
  buildHeaders,
  getApiBaseUrl,
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  ApiResponse,
} from "@/lib/utils/api-service";

// Mock fetch
global.fetch = jest.fn();

describe("API Service Utils", () => {
  let mockGetIdToken: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();

    // Get the mocked function from the mocked module
    const { auth } = require("@/lib/firebase-client");
    mockGetIdToken = auth.currentUser.getIdToken;
    mockGetIdToken.mockClear();
  });

  describe("handleApiError", () => {
    it("handles Firebase errors", () => {
      const firebaseError = {
        code: "auth/user-not-found",
        message: "User not found",
      };

      const result = handleApiError(firebaseError);

      expect(result).toEqual({
        success: false,
        error: {
          code: "auth/user-not-found",
          message: "User not found",
          details: firebaseError,
        },
      });
    });

    it("handles generic Error objects", () => {
      const error = new Error("Network error");
      const result = handleApiError(error);

      expect(result).toEqual({
        success: false,
        error: {
          code: "api/unknown-error",
          message: "Network error",
          details: error,
        },
      });
    });

    it("handles unknown error types", () => {
      const error = { unknown: "object" };
      const result = handleApiError(error);

      expect(result).toEqual({
        success: false,
        error: {
          code: "api/unknown-error",
          message: "An unknown error occurred",
          details: error,
        },
      });
    });
  });

  describe("getAuthToken", () => {
    it("returns token when user is authenticated", async () => {
      const mockToken = "mock-auth-token";
      mockGetIdToken.mockResolvedValue(mockToken);

      const result = await getAuthToken();

      expect(mockGetIdToken).toHaveBeenCalledWith(false);
      expect(result).toBe(mockToken);
    });

    it("forces token refresh when requested", async () => {
      const mockToken = "fresh-token";
      mockGetIdToken.mockResolvedValue(mockToken);

      const result = await getAuthToken(true);

      expect(mockGetIdToken).toHaveBeenCalledWith(true);
      expect(result).toBe(mockToken);
    });

    it("returns null when no user is authenticated", async () => {
      // Mock no current user
      const { auth } = require("@/lib/firebase-client");
      auth.currentUser = null;

      const result = await getAuthToken();

      expect(result).toBeNull();

      // Restore for other tests
      auth.currentUser = { getIdToken: mockGetIdToken };
    });

    it("returns null when getIdToken fails", async () => {
      mockGetIdToken.mockRejectedValue(new Error("Token error"));

      const result = await getAuthToken();

      expect(result).toBeNull();
    });
  });

  describe("buildHeaders", () => {
    it("builds headers without auth when not requested", async () => {
      const result = await buildHeaders(false);

      expect(result).toEqual({
        "Content-Type": "application/json",
      });
    });

    it("builds headers with auth token when available", async () => {
      const mockToken = "mock-token";
      mockGetIdToken.mockResolvedValue(mockToken);

      const result = await buildHeaders(true);

      expect(result).toEqual({
        "Content-Type": "application/json",
        Authorization: "Bearer mock-token",
      });
    });

    it("builds headers without auth when token unavailable", async () => {
      mockGetIdToken.mockResolvedValue(null);

      const result = await buildHeaders(true);

      expect(result).toEqual({
        "Content-Type": "application/json",
      });
    });
  });

  describe("getApiBaseUrl", () => {
    const originalWindow = global.window;

    afterEach(() => {
      global.window = originalWindow;
    });

    it("returns empty string on client-side", () => {
      // Mock window object to simulate client-side
      global.window = {} as any;

      const result = getApiBaseUrl();

      expect(result).toBe("");
    });

    it("returns configured URL on server-side", () => {
      // Remove window to simulate server-side
      delete (global as any).window;
      process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";

      const result = getApiBaseUrl();

      expect(result).toBe("https://example.com");

      delete process.env.NEXT_PUBLIC_SITE_URL;
    });

    it("returns localhost default on server-side without config", () => {
      delete (global as any).window;
      delete process.env.NEXT_PUBLIC_SITE_URL;

      const result = getApiBaseUrl();

      expect(result).toBe("http://localhost:3000");
    });
  });

  describe("apiRequest", () => {
    const mockResponse = { data: "test" };

    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockResponse),
      });
    });

    it("makes successful request", async () => {
      const result = await apiRequest("/api/test");

      expect(fetch).toHaveBeenCalledWith("/api/test", {});
      expect(result).toEqual({
        success: true,
        data: "test",
      });
    });

    it("handles non-ok responses", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: jest.fn().mockResolvedValue({ message: "Validation failed" }),
      });

      const result = await apiRequest("/api/test");

      expect(result).toEqual({
        success: false,
        error: {
          code: "api/400",
          message: "Validation failed",
          details: { message: "Validation failed" },
        },
      });
    });

    it("handles network errors", async () => {
      const networkError = new Error("Network error");
      (fetch as jest.Mock).mockRejectedValue(networkError);

      const result = await apiRequest("/api/test");

      expect(result).toEqual({
        success: false,
        error: {
          code: "api/unknown-error",
          message: "Network error",
          details: networkError,
        },
      });
    });

    it("uses server-side URL when appropriate", async () => {
      delete (global as any).window;
      process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";

      await apiRequest("/api/test");

      expect(fetch).toHaveBeenCalledWith("https://example.com/api/test", {});

      delete process.env.NEXT_PUBLIC_SITE_URL;
      global.window = {} as any;
    });
  });

  describe("apiGet", () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: "test" }),
      });
    });

    it("makes GET request without auth", async () => {
      const result = await apiGet("/api/test", false);

      expect(fetch).toHaveBeenCalledWith("/api/test", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      expect(result.success).toBe(true);
    });

    it("makes GET request with auth", async () => {
      const mockToken = "mock-token";
      mockGetIdToken.mockResolvedValue(mockToken);

      await apiGet("/api/test", true);

      expect(fetch).toHaveBeenCalledWith("/api/test", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token",
        },
      });
    });
  });

  describe("apiPost", () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: "created" }),
      });
    });

    it("makes POST request with data", async () => {
      const postData = { name: "test" };

      const result = await apiPost("/api/test", postData, false);

      expect(fetch).toHaveBeenCalledWith("/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("apiPut", () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: "updated" }),
      });
    });

    it("makes PUT request with data", async () => {
      const putData = { id: 1, name: "updated" };

      const result = await apiPut("/api/test/1", putData, false);

      expect(fetch).toHaveBeenCalledWith("/api/test/1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(putData),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("apiDelete", () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: "deleted" }),
      });
    });

    it("makes DELETE request", async () => {
      const result = await apiDelete("/api/test/1", false);

      expect(fetch).toHaveBeenCalledWith("/api/test/1", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      expect(result.success).toBe(true);
    });
  });
});
