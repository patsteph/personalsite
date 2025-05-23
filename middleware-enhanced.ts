import { NextRequest, NextResponse } from "next/server";
import SecurityMiddleware from "./lib/security/security-middleware";

/**
 * Enhanced Middleware with Security Features
 * Replaces the basic middleware with comprehensive security controls
 */

export async function middleware(request: NextRequest) {
  try {
    // Get security middleware instance
    const securityMiddleware = SecurityMiddleware.getInstance();

    // Process request through security middleware
    const response = await securityMiddleware.process(request);

    // If security middleware returned a response (blocked/rate limited), return it
    if (response.status !== 200) {
      return response;
    }

    // Continue with application-specific middleware logic
    return handleApplicationRoutes(request, response);
  } catch (error) {
    console.error("Middleware error:", error);

    // Return a safe fallback response
    return NextResponse.next();
  }
}

/**
 * Handle application-specific routing logic
 */
function handleApplicationRoutes(
  request: NextRequest,
  securityResponse: NextResponse,
): NextResponse {
  const { pathname } = request.nextUrl;

  // Handle legacy redirects
  if (pathname === "/admin-login.html") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (pathname === "/admin-dashboard.html") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Special handling for blog posts
  if (pathname.startsWith("/blog/") && pathname !== "/blog") {
    const slug = pathname.replace("/blog/", "");

    // Handle data URL rewrites for blog posts
    if (pathname.includes("_next/data") && pathname.includes(".json")) {
      return NextResponse.rewrite(new URL(`/blog/${slug}`, request.url));
    }
  }

  // Return the security response with any additional headers
  return securityResponse;
}

/**
 * Configure which routes use this middleware
 * Expanded to cover more security-sensitive areas
 */
export const config = {
  matcher: [
    // Admin routes
    "/admin/:path*",

    // API routes
    "/api/:path*",

    // Auth routes
    "/auth/:path*",

    // Legacy redirects
    "/admin-login.html",
    "/admin-dashboard.html",

    // Blog routes
    "/blog/:slug*",
    "/_next/data/:build/blog/:slug.json",

    // Static assets (for security headers)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
