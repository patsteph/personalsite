import { NextApiRequest, NextApiResponse } from "next";
import { createMocks } from "node-mocks-http";

export interface MockRequest extends NextApiRequest {
  cookies: Record<string, string>;
  headers: Record<string, string | string[]>;
}

export interface MockResponse extends NextApiResponse {
  _getStatusCode(): number;
  _getData(): any;
  _getHeaders(): Record<string, string>;
}

export function createApiMocks(
  reqOptions: Partial<NextApiRequest> = {},
  resOptions: Partial<NextApiResponse> = {},
): { req: MockRequest; res: MockResponse } {
  const { req, res } = createMocks<MockRequest, MockResponse>(
    {
      method: "GET",
      ...reqOptions,
    },
    resOptions,
  );

  return { req, res };
}

export function createAuthenticatedApiMocks(
  reqOptions: Partial<NextApiRequest> = {},
  resOptions: Partial<NextApiResponse> = {},
) {
  return createApiMocks(
    {
      ...reqOptions,
      headers: {
        "x-auth-token": "mock-auth-token",
        ...reqOptions.headers,
      },
      cookies: {
        "auth-token": "mock-auth-token",
        ...reqOptions.cookies,
      },
    },
    resOptions,
  );
}

export const mockUser = {
  uid: "test-user-id",
  email: "test@example.com",
  displayName: "Test User",
};

export const mockBook = {
  id: "test-book-id",
  title: "Test Book",
  authors: ["Test Author"],
  status: "read" as const,
  userRating: 5,
  imageLinks: {
    thumbnail: "https://example.com/thumbnail.jpg",
  },
  categories: ["Fiction"],
  description: "A test book",
  publishedDate: "2023-01-01",
  pageCount: 300,
};

export const mockSignal = {
  id: "test-signal-id",
  type: "newsletter" as const,
  title: "Test Newsletter",
  content: "Test content",
  date: new Date("2023-01-01"),
  url: "https://example.com",
  tags: ["test"],
};

export const mockBlogPost = {
  id: "test-post-id",
  title: "Test Blog Post",
  content: "Test content",
  excerpt: "Test excerpt",
  slug: "test-blog-post",
  publishedAt: new Date("2023-01-01"),
  status: "published" as const,
  tags: ["test"],
  author: "Test Author",
};
