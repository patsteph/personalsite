/**
 * Enhanced Security Middleware
 * Comprehensive security controls and monitoring
 */

import { NextRequest, NextResponse } from "next/server";
import { getSecurityHeaders, securityConfig } from "./security-config";
import { AUTH_COOKIE_NAME } from "../utils/cookies";

// Security monitoring
interface SecurityEvent {
  type:
    | "auth_failure"
    | "rate_limit"
    | "suspicious_request"
    | "unauthorized_access";
  ip: string;
  userAgent: string;
  path: string;
  timestamp: string;
  details?: Record<string, any>;
}

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const suspiciousIPs = new Set<string>();
const blockedIPs = new Set<string>();

// Authentication attempt tracking
const authAttempts = new Map<
  string,
  { count: number; lastAttempt: number; lockedUntil?: number }
>();

export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private events: SecurityEvent[] = [];

  private constructor() {}

  static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  /**
   * Main security middleware function
   */
  async process(request: NextRequest): Promise<NextResponse> {
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "";
    const pathname = request.nextUrl.pathname;

    // 1. Check IP blacklist
    if (this.isBlocked(ip)) {
      return this.blockRequest("IP blocked due to suspicious activity");
    }

    // 2. Rate limiting
    const rateLimitResult = this.checkRateLimit(ip, pathname);
    if (!rateLimitResult.allowed) {
      this.logSecurityEvent({
        type: "rate_limit",
        ip,
        userAgent,
        path: pathname,
        timestamp: new Date().toISOString(),
        details: {
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
        },
      });

      return this.rateLimitResponse(rateLimitResult);
    }

    // 3. Request validation
    const validationResult = this.validateRequest(request);
    if (!validationResult.valid) {
      this.logSecurityEvent({
        type: "suspicious_request",
        ip,
        userAgent,
        path: pathname,
        timestamp: new Date().toISOString(),
        details: { reason: validationResult.reason },
      });

      return this.blockRequest(validationResult.reason || "Validation failed");
    }

    // 4. Authentication for protected routes
    if (this.isProtectedRoute(pathname)) {
      const authResult = this.checkAuthentication(request);
      if (!authResult.authenticated) {
        // Track failed auth attempts
        this.trackAuthAttempt(ip, false);

        this.logSecurityEvent({
          type: "unauthorized_access",
          ip,
          userAgent,
          path: pathname,
          timestamp: new Date().toISOString(),
        });

        return NextResponse.redirect(new URL("/admin/login", request.url));
      }

      // Track successful auth
      this.trackAuthAttempt(ip, true);
    }

    // 5. Create response with security headers
    const response = NextResponse.next();
    this.applySecurityHeaders(response);

    // 6. Add rate limit headers
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimitResult.remaining.toString(),
    );
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(rateLimitResult.resetTime).toISOString(),
    );

    return response;
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    // Check for forwarded headers (for proxies/CDNs)
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const cfConnectingIP = request.headers.get("cf-connecting-ip");

    if (cfConnectingIP) return cfConnectingIP;
    if (realIP) return realIP;
    if (forwardedFor) return forwardedFor.split(",")[0].trim();

    return "unknown";
  }

  /**
   * Check if IP is blocked
   */
  private isBlocked(ip: string): boolean {
    return blockedIPs.has(ip) || suspiciousIPs.has(ip);
  }

  /**
   * Rate limiting implementation
   */
  private checkRateLimit(
    ip: string,
    path: string,
  ): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const windowMs = securityConfig.rateLimit.windowMs;
    const maxRequests = this.getRateLimitForPath(path);

    const key = `${ip}:${path}`;
    const current = rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
      // New window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });

      return {
        allowed: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        resetTime: now + windowMs,
      };
    }

    if (current.count >= maxRequests) {
      return {
        allowed: false,
        limit: maxRequests,
        remaining: 0,
        resetTime: current.resetTime,
      };
    }

    current.count++;
    rateLimitStore.set(key, current);

    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - current.count,
      resetTime: current.resetTime,
    };
  }

  /**
   * Get rate limit based on path
   */
  private getRateLimitForPath(path: string): number {
    // API routes have stricter limits
    if (path.startsWith("/api/auth")) return 10; // Auth endpoints
    if (path.startsWith("/api/")) return 50; // Other API endpoints
    if (path.startsWith("/admin")) return 30; // Admin pages

    return securityConfig.rateLimit.maxRequests; // Default limit
  }

  /**
   * Validate request for suspicious patterns
   */
  private validateRequest(request: NextRequest): {
    valid: boolean;
    reason?: string;
  } {
    const { pathname, search } = request.nextUrl;
    const userAgent = request.headers.get("user-agent") || "";

    // Check for common attack patterns
    const suspiciousPatterns = [
      /\.\./, // Directory traversal
      /<script/i, // XSS attempts
      /union.*select/i, // SQL injection
      /exec\s*\(/i, // Code execution
      /eval\s*\(/i, // Code evaluation
      /javascript:/i, // JavaScript URLs
      /data:.*script/i, // Data URLs with scripts
      /vbscript:/i, // VBScript URLs
      /on\w+\s*=/i, // Event handlers
      /__proto__/, // Prototype pollution
      /constructor/i, // Constructor access
    ];

    const fullPath = pathname + search;

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fullPath)) {
        return {
          valid: false,
          reason: `Suspicious pattern detected: ${pattern.source}`,
        };
      }
    }

    // Check user agent for bots/scrapers
    const suspiciousUserAgents = [
      /curl/i,
      /wget/i,
      /python/i,
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
    ];

    // Allow legitimate bots but block suspicious ones
    if (
      userAgent.length < 10 ||
      suspiciousUserAgents.some((pattern) => pattern.test(userAgent))
    ) {
      // Check if it's a legitimate bot
      const legitimateBots = [
        /googlebot/i,
        /bingbot/i,
        /facebookexternalhit/i,
        /twitterbot/i,
        /linkedinbot/i,
      ];

      if (!legitimateBots.some((pattern) => pattern.test(userAgent))) {
        return { valid: false, reason: "Suspicious user agent" };
      }
    }

    return { valid: true };
  }

  /**
   * Check if route is protected
   */
  private isProtectedRoute(pathname: string): boolean {
    const protectedPaths = [
      "/admin",
      "/api/admin",
      "/api/auth/me",
      "/api/auth/user",
    ];

    return (
      protectedPaths.some((path) => pathname.startsWith(path)) &&
      !pathname.includes("/admin/login")
    );
  }

  /**
   * Check authentication
   */
  private checkAuthentication(request: NextRequest): {
    authenticated: boolean;
    user?: any;
  } {
    // Check for auth cookie
    const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

    if (!authCookie) {
      return { authenticated: false };
    }

    // In a real implementation, you'd validate the JWT token here
    // For now, we just check for presence of the cookie
    return { authenticated: true };
  }

  /**
   * Track authentication attempts
   */
  private trackAuthAttempt(ip: string, success: boolean): void {
    const now = Date.now();
    const current = authAttempts.get(ip) || { count: 0, lastAttempt: now };

    if (success) {
      // Reset on successful auth
      authAttempts.delete(ip);
      return;
    }

    // Check if lockout period has expired
    if (current.lockedUntil && now > current.lockedUntil) {
      current.count = 0;
      current.lockedUntil = undefined;
    }

    current.count++;
    current.lastAttempt = now;

    // Lock account if too many attempts
    if (current.count >= securityConfig.auth.maxLoginAttempts) {
      current.lockedUntil =
        now + securityConfig.auth.lockoutDuration * 60 * 1000;

      // Add to suspicious IPs
      suspiciousIPs.add(ip);

      // Auto-block after multiple lockouts
      const lockouts = Array.from(authAttempts.values()).filter(
        (attempt) => attempt.lockedUntil && attempt.lockedUntil > now,
      ).length;

      if (lockouts >= 3) {
        blockedIPs.add(ip);
      }
    }

    authAttempts.set(ip, current);
  }

  /**
   * Apply security headers to response
   */
  private applySecurityHeaders(response: NextResponse): void {
    const headers = getSecurityHeaders();

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  /**
   * Block request with error response
   */
  private blockRequest(reason: string): NextResponse {
    return new NextResponse(
      JSON.stringify({
        error: "Request blocked",
        reason: "Security violation detected",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          ...getSecurityHeaders(),
        },
      },
    );
  }

  /**
   * Rate limit response
   */
  private rateLimitResponse(rateLimitResult: any): NextResponse {
    return new NextResponse(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
        resetTime: new Date(rateLimitResult.resetTime).toISOString(),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000,
          ).toString(),
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": new Date(
            rateLimitResult.resetTime,
          ).toISOString(),
          ...getSecurityHeaders(),
        },
      },
    );
  }

  /**
   * Log security event
   */
  private logSecurityEvent(event: SecurityEvent): void {
    this.events.push(event);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.warn("[Security Event]", event);
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === "production") {
      this.sendToMonitoring(event);
    }
  }

  /**
   * Send security event to monitoring service
   */
  private async sendToMonitoring(event: SecurityEvent): Promise<void> {
    try {
      // Send to your monitoring/alerting service
      await fetch("/api/monitoring/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error("Failed to send security event to monitoring:", error);
    }
  }

  /**
   * Get security events for analysis
   */
  getSecurityEvents(): SecurityEvent[] {
    return [...this.events];
  }

  /**
   * Get blocked IPs
   */
  getBlockedIPs(): string[] {
    return Array.from(blockedIPs);
  }

  /**
   * Manually block IP
   */
  blockIP(ip: string): void {
    blockedIPs.add(ip);
  }

  /**
   * Unblock IP
   */
  unblockIP(ip: string): void {
    blockedIPs.delete(ip);
    suspiciousIPs.delete(ip);
    authAttempts.delete(ip);
  }
}

export default SecurityMiddleware;
