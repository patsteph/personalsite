import { NextApiRequest, NextApiResponse } from "next";
import { getAdminAuth } from "@/lib/firebase-admin";

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    uid: string;
    email?: string;
  };
}

/**
 * Enhanced API middleware for authentication and CORS
 * Consolidates duplicated logic from multiple API routes
 */

/**
 * CORS middleware - adds proper headers and handles OPTIONS requests
 */
export const withCORS = <T = any>(
  handler: (req: NextApiRequest, res: NextApiResponse<T>) => Promise<void>,
) => {
  return async (req: NextApiRequest, res: NextApiResponse<T>) => {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With",
    );

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    return handler(req, res);
  };
};

/**
 * Authentication middleware - verifies Bearer token or session cookie
 * Supports both API calls (Bearer) and admin pages (cookie)
 */
export const withAuth = <T = any>(
  handler: (
    req: AuthenticatedRequest,
    res: NextApiResponse<T>,
  ) => Promise<void>,
) => {
  return async (req: AuthenticatedRequest, res: NextApiResponse<T>) => {
    const auth = getAdminAuth();
    let token: string | null = null;
    let user: { uid: string; email?: string } | null = null;

    try {
      // Check for Bearer token first (for API calls)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split("Bearer ")[1];
        try {
          const decodedToken = await auth.verifyIdToken(token);
          user = { uid: decodedToken.uid, email: decodedToken.email };
        } catch (bearerError: any) {
          console.error(
            "Bearer token verification failed:",
            bearerError.message,
          );
          token = null;
        }
      }

      // If no valid Bearer token, check Firebase token cookie (for admin pages)
      if (!user) {
        const fbTokenCookie = req.cookies["fb_token"];
        if (!fbTokenCookie) {
          return res.status(401).json({
            success: false,
            error: "No authentication provided",
          } as any);
        }

        try {
          const decodedToken = await auth.verifyIdToken(fbTokenCookie);
          user = { uid: decodedToken.uid, email: decodedToken.email };
        } catch (tokenError: any) {
          console.error(
            "Firebase token cookie verification failed:",
            tokenError.message,
          );
          return res.status(401).json({
            success: false,
            error: "Unauthorized - Invalid token",
          } as any);
        }
      }

      // Attach user to request
      req.user = user;
      return handler(req, res);
    } catch (error: any) {
      console.error("API auth error:", error);
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      } as any);
    }
  };
};

/**
 * Combined middleware for routes that need both CORS and auth
 */
export const withCORSAuth = <T = any>(
  handler: (
    req: AuthenticatedRequest,
    res: NextApiResponse<T>,
  ) => Promise<void>,
) => {
  return withCORS(withAuth(handler));
};

/**
 * Optional auth middleware - for routes that work with or without auth
 */
export const withOptionalAuth = <T = any>(
  handler: (
    req: AuthenticatedRequest,
    res: NextApiResponse<T>,
  ) => Promise<void>,
) => {
  return async (req: AuthenticatedRequest, res: NextApiResponse<T>) => {
    const auth = getAdminAuth();

    try {
      // Try to authenticate, but don't fail if no auth provided
      const authHeader = req.headers.authorization;
      const fbTokenCookie = req.cookies["fb_token"];

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split("Bearer ")[1];
        try {
          const decodedToken = await auth.verifyIdToken(token);
          req.user = { uid: decodedToken.uid, email: decodedToken.email };
        } catch (error) {
          // Ignore auth errors for optional auth
        }
      } else if (fbTokenCookie) {
        try {
          const decodedToken = await auth.verifyIdToken(fbTokenCookie);
          req.user = { uid: decodedToken.uid, email: decodedToken.email };
        } catch (error) {
          // Ignore auth errors for optional auth
        }
      }
    } catch (error) {
      // Ignore auth errors for optional auth
    }

    return handler(req, res);
  };
};
