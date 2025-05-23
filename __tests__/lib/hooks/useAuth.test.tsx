import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import useAuth from "@/lib/hooks/useAuth";

// Mock Firebase auth
jest.mock("@/lib/firebase-client", () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  },
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
}));

// Mock API auth functions
jest.mock("@/lib/api/auth", () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: "/test",
  }),
}));

// Mock cookies utilities
jest.mock("@/lib/utils/cookies", () => ({
  setAuthCookie: jest.fn(),
  removeAuthCookie: jest.fn(),
  AUTH_COOKIE_NAME: "auth_success",
}));

describe("useAuth", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    const { auth } = require("@/lib/firebase-client");
    auth.currentUser = null;
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );

  it("returns initial state when no user is authenticated", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("updates state when user is authenticated", async () => {
    const mockUser = {
      uid: "test-user-id",
      email: "test@example.com",
      displayName: "Test User",
    };

    let authStateCallback: (user: any) => void;
    mockAuth.onAuthStateChanged = jest.fn((callback) => {
      authStateCallback = callback;
      return jest.fn(); // unsubscribe function
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Simulate user authentication
    authStateCallback!(mockUser);

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it("updates state when user signs out", async () => {
    const mockUser = {
      uid: "test-user-id",
      email: "test@example.com",
      displayName: "Test User",
    };

    let authStateCallback: (user: any) => void;
    mockAuth.onAuthStateChanged = jest.fn((callback) => {
      authStateCallback = callback;
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Simulate user authentication
    authStateCallback!(mockUser);

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    // Simulate user sign out
    authStateCallback!(null);

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it("redirects to login when accessing protected route without auth", async () => {
    let authStateCallback: (user: any) => void;
    mockAuth.onAuthStateChanged = jest.fn((callback) => {
      authStateCallback = callback;
      return jest.fn();
    });

    renderHook(() => useAuth(true), { wrapper }); // requireAuth = true

    // Simulate no user (signed out)
    authStateCallback!(null);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin/login");
    });
  });

  it("does not redirect when user is authenticated on protected route", async () => {
    const mockUser = {
      uid: "test-user-id",
      email: "test@example.com",
      displayName: "Test User",
    };

    let authStateCallback: (user: any) => void;
    mockAuth.onAuthStateChanged = jest.fn((callback) => {
      authStateCallback = callback;
      return jest.fn();
    });

    renderHook(() => useAuth(true), { wrapper });

    // Simulate authenticated user
    authStateCallback!(mockUser);

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it("does not redirect on public routes when not authenticated", async () => {
    let authStateCallback: (user: any) => void;
    mockAuth.onAuthStateChanged = jest.fn((callback) => {
      authStateCallback = callback;
      return jest.fn();
    });

    renderHook(() => useAuth(false), { wrapper }); // requireAuth = false

    // Simulate no user
    authStateCallback!(null);

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it("cleans up auth state listener on unmount", () => {
    const mockUnsubscribe = jest.fn();
    mockAuth.onAuthStateChanged = jest.fn(() => mockUnsubscribe);

    const { unmount } = renderHook(() => useAuth(), { wrapper });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("handles auth state changes multiple times", async () => {
    const mockUser1 = {
      uid: "user-1",
      email: "user1@example.com",
      displayName: "User One",
    };

    const mockUser2 = {
      uid: "user-2",
      email: "user2@example.com",
      displayName: "User Two",
    };

    let authStateCallback: (user: any) => void;
    mockAuth.onAuthStateChanged = jest.fn((callback) => {
      authStateCallback = callback;
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // First user
    authStateCallback!(mockUser1);
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser1);
    });

    // Sign out
    authStateCallback!(null);
    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });

    // Second user
    authStateCallback!(mockUser2);
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser2);
    });
  });

  it("maintains loading state during auth state changes", () => {
    let authStateCallback: (user: any) => void;
    mockAuth.onAuthStateChanged = jest.fn((callback) => {
      authStateCallback = callback;
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);

    // After auth state resolves
    authStateCallback!(null);

    // Should no longer be loading
    expect(result.current.loading).toBe(false);
  });
});
