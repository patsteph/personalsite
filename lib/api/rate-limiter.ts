/**
 * Advanced rate limiting implementation
 * Supports multiple algorithms and storage backends
 */

import { NextRequest, NextResponse } from "next/server";
import { createCacheAdapter } from "../cache/redis-adapter";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  algorithm:
    | "sliding-window"
    | "fixed-window"
    | "token-bucket"
    | "leaky-bucket";
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  blockDuration?: number;
  message?: string;
  headers?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface TokenBucketState {
  tokens: number;
  lastRefill: number;
}

export interface LeakyBucketState {
  queue: number[];
  lastLeak: number;
}

export class RateLimiter {
  private cache = createCacheAdapter();

  constructor(private config: RateLimitConfig) {}

  async checkLimit(req: NextRequest): Promise<RateLimitResult> {
    const key = this.generateKey(req);

    switch (this.config.algorithm) {
      case "sliding-window":
        return this.slidingWindowLimit(key);
      case "fixed-window":
        return this.fixedWindowLimit(key);
      case "token-bucket":
        return this.tokenBucketLimit(key);
      case "leaky-bucket":
        return this.leakyBucketLimit(key);
      default:
        return this.slidingWindowLimit(key);
    }
  }

  async middleware(req: NextRequest): Promise<NextResponse | null> {
    const result = await this.checkLimit(req);

    if (!result.allowed) {
      const response = NextResponse.json(
        {
          error: this.config.message || "Too Many Requests",
          retryAfter: result.retryAfter,
        },
        { status: 429 },
      );

      if (this.config.headers) {
        this.addHeaders(response, result);
      }

      return response;
    }

    return null; // Allow request to continue
  }

  private async slidingWindowLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get request timestamps from cache
    const requests: number[] = (await this.cache.get(`${key}:requests`)) || [];

    // Filter out requests outside the window
    const validRequests = requests.filter(
      (timestamp) => timestamp > windowStart,
    );

    const allowed = validRequests.length < this.config.maxRequests;

    if (allowed) {
      validRequests.push(now);
      await this.cache.set(
        `${key}:requests`,
        validRequests,
        this.config.windowMs,
      );
    }

    const resetTime = windowStart + this.config.windowMs;
    const retryAfter = allowed
      ? undefined
      : Math.ceil((resetTime - now) / 1000);

    return {
      allowed,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - validRequests.length),
      resetTime,
      retryAfter,
    };
  }

  private async fixedWindowLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart =
      Math.floor(now / this.config.windowMs) * this.config.windowMs;
    const windowKey = `${key}:${windowStart}`;

    const currentCount = (await this.cache.get<number>(windowKey)) || 0;
    const allowed = currentCount < this.config.maxRequests;

    if (allowed) {
      await this.cache.set(windowKey, currentCount + 1, this.config.windowMs);
    }

    const resetTime = windowStart + this.config.windowMs;
    const retryAfter = allowed
      ? undefined
      : Math.ceil((resetTime - now) / 1000);

    return {
      allowed,
      limit: this.config.maxRequests,
      remaining: Math.max(
        0,
        this.config.maxRequests - currentCount - (allowed ? 1 : 0),
      ),
      resetTime,
      retryAfter,
    };
  }

  private async tokenBucketLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const bucketKey = `${key}:bucket`;

    const state: TokenBucketState = (await this.cache.get(bucketKey)) || {
      tokens: this.config.maxRequests,
      lastRefill: now,
    };

    // Calculate tokens to add based on time elapsed
    const timeSinceRefill = now - state.lastRefill;
    const tokensToAdd =
      (timeSinceRefill / this.config.windowMs) * this.config.maxRequests;

    state.tokens = Math.min(
      this.config.maxRequests,
      state.tokens + tokensToAdd,
    );
    state.lastRefill = now;

    const allowed = state.tokens >= 1;

    if (allowed) {
      state.tokens -= 1;
    }

    await this.cache.set(bucketKey, state, this.config.windowMs * 2);

    const retryAfter = allowed
      ? undefined
      : Math.ceil(
          ((1 - state.tokens) *
            (this.config.windowMs / this.config.maxRequests)) /
            1000,
        );

    return {
      allowed,
      limit: this.config.maxRequests,
      remaining: Math.floor(state.tokens),
      resetTime: now + this.config.windowMs,
      retryAfter,
    };
  }

  private async leakyBucketLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const bucketKey = `${key}:leaky`;

    const state: LeakyBucketState = (await this.cache.get(bucketKey)) || {
      queue: [],
      lastLeak: now,
    };

    // Calculate how many requests should have leaked out
    const timeSinceLastLeak = now - state.lastLeak;
    const leakRate = this.config.maxRequests / this.config.windowMs; // requests per ms
    const requestsToLeak = Math.floor(timeSinceLastLeak * leakRate);

    // Remove leaked requests from queue
    state.queue = state.queue.slice(requestsToLeak);
    state.lastLeak = now;

    const allowed = state.queue.length < this.config.maxRequests;

    if (allowed) {
      state.queue.push(now);
    }

    await this.cache.set(bucketKey, state, this.config.windowMs * 2);

    const retryAfter = allowed
      ? undefined
      : Math.ceil(
          (state.queue.length - this.config.maxRequests + 1) / leakRate / 1000,
        );

    return {
      allowed,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - state.queue.length),
      resetTime: now + this.config.windowMs,
      retryAfter,
    };
  }

  private generateKey(req: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }

    // Default key generation based on IP
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = forwarded ? forwarded.split(",")[0] : realIp || "unknown";
    return `rate_limit:${ip}`;
  }

  private addHeaders(response: NextResponse, result: RateLimitResult): void {
    response.headers.set("X-RateLimit-Limit", result.limit.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", result.resetTime.toString());

    if (result.retryAfter) {
      response.headers.set("Retry-After", result.retryAfter.toString());
    }
  }
}

// Rate limiter factory for different use cases
export class RateLimiterFactory {
  static createAPILimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      algorithm: "sliding-window",
      headers: true,
      message: "Too many API requests, please try again later",
    });
  }

  static createAuthLimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      algorithm: "fixed-window",
      blockDuration: 30 * 60 * 1000, // 30 minutes
      headers: true,
      message: "Too many authentication attempts, please try again later",
    });
  }

  static createSearchLimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30,
      algorithm: "token-bucket",
      headers: true,
      message: "Search rate limit exceeded",
    });
  }

  static createUploadLimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      algorithm: "leaky-bucket",
      headers: true,
      message: "Upload rate limit exceeded",
    });
  }

  static createUserSpecificLimiter(userId: string): RateLimiter {
    return new RateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60,
      algorithm: "sliding-window",
      keyGenerator: () => `user:${userId}`,
      headers: true,
    });
  }

  static createEndpointLimiter(
    endpoint: string,
    limit: number = 50,
  ): RateLimiter {
    return new RateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: limit,
      algorithm: "sliding-window",
      keyGenerator: (req) => {
        const forwarded = req.headers.get("x-forwarded-for");
        const realIp = req.headers.get("x-real-ip");
        const ip = forwarded ? forwarded.split(",")[0] : realIp || "unknown";
        return `endpoint:${endpoint}:${ip}`;
      },
      headers: true,
      message: `Rate limit exceeded for ${endpoint}`,
    });
  }
}

// Rate limiting middleware wrapper
export function withRateLimit(limiter: RateLimiter) {
  return async (req: NextRequest) => {
    const limitResponse = await limiter.middleware(req);
    if (limitResponse) {
      return limitResponse;
    }
    return null; // Continue to next middleware/handler
  };
}

// Multiple rate limiters middleware
export function withMultipleRateLimits(...limiters: RateLimiter[]) {
  return async (req: NextRequest) => {
    for (const limiter of limiters) {
      const limitResponse = await limiter.middleware(req);
      if (limitResponse) {
        return limitResponse;
      }
    }
    return null;
  };
}

// Rate limit status endpoint
export async function getRateLimitStatus(
  req: NextRequest,
  limiter: RateLimiter,
) {
  const result = await limiter.checkLimit(req);

  return {
    limit: result.limit,
    remaining: result.remaining,
    resetTime: new Date(result.resetTime).toISOString(),
    retryAfter: result.retryAfter,
  };
}
