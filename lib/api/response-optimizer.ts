/**
 * API response optimization utilities
 * Handles compression, caching, and response formatting
 */

import { NextRequest, NextResponse } from "next/server";
import { cacheManager } from "../cache/cache-manager";

export interface ResponseOptions {
  compress?: boolean;
  etag?: boolean;
  cache?: {
    ttl: number;
    vary?: string[];
    private?: boolean;
  };
  headers?: Record<string, string>;
  transform?: (data: any) => any;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
    processingTime: number;
  };
  pagination?: any;
}

export interface CompressionConfig {
  threshold: number; // Minimum size to compress (bytes)
  algorithms: string[];
  quality: number;
}

export class ResponseOptimizer {
  private compressionConfig: CompressionConfig = {
    threshold: 1024, // 1KB
    algorithms: ["gzip", "deflate", "br"],
    quality: 6,
  };

  /**
   * Create optimized API response
   */
  async createResponse<T>(
    data: T,
    request: NextRequest,
    options: ResponseOptions = {},
  ): Promise<NextResponse> {
    const startTime = Date.now();

    // Generate request ID
    const requestId = this.generateRequestId();

    // Transform data if transformer provided
    const transformedData = options.transform ? options.transform(data) : data;

    // Create API response structure
    const apiResponse: APIResponse<T> = {
      success: true,
      data: transformedData,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: "1.0",
        processingTime: Date.now() - startTime,
      },
    };

    // Serialize response
    const serialized = JSON.stringify(apiResponse);

    // Create NextResponse
    const response = NextResponse.json(apiResponse);

    // Add standard headers
    this.addStandardHeaders(response, requestId);

    // Add custom headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    // Add ETag if enabled
    if (options.etag) {
      const etag = this.generateETag(serialized);
      response.headers.set("ETag", etag);

      // Check if client has cached version
      const clientETag = request.headers.get("if-none-match");
      if (clientETag === etag) {
        return new NextResponse(null, { status: 304 });
      }
    }

    // Add cache headers
    if (options.cache) {
      this.addCacheHeaders(response, options.cache);
    }

    // Apply compression if enabled and beneficial
    if (options.compress && this.shouldCompress(serialized, request)) {
      return this.compressResponse(response, serialized, request);
    }

    return response;
  }

  /**
   * Create error response
   */
  createErrorResponse(
    error: Error | string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: any,
  ): NextResponse {
    const requestId = this.generateRequestId();

    const apiResponse: APIResponse = {
      success: false,
      error: {
        code,
        message: typeof error === "string" ? error : error.message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: "1.0",
        processingTime: 0,
      },
    };

    const response = NextResponse.json(apiResponse, { status: statusCode });
    this.addStandardHeaders(response, requestId);

    return response;
  }

  /**
   * Cache response with automatic key generation
   */
  async cacheResponse<T>(
    key: string,
    data: T,
    ttl: number = 300000, // 5 minutes
  ): Promise<void> {
    await cacheManager.set(key, data, ttl);
  }

  /**
   * Get cached response
   */
  async getCachedResponse<T>(key: string): Promise<T | null> {
    return cacheManager.get<T>(key);
  }

  /**
   * Generate cache key from request
   */
  generateCacheKey(req: NextRequest, additionalParams?: string[]): string {
    const url = new URL(req.url);
    const path = url.pathname;
    const searchParams = url.searchParams.toString();
    const method = req.method;

    let key = `api:${method}:${path}`;

    if (searchParams) {
      key += `:${btoa(searchParams)}`;
    }

    if (additionalParams) {
      key += `:${additionalParams.join(":")}`;
    }

    return key;
  }

  /**
   * Middleware for automatic response optimization
   */
  middleware(options: ResponseOptions = {}) {
    return async (
      req: NextRequest,
      handler: (req: NextRequest) => Promise<any>,
    ): Promise<NextResponse> => {
      try {
        // Check cache first if caching is enabled
        if (options.cache && req.method === "GET") {
          const cacheKey = this.generateCacheKey(req);
          const cached = await this.getCachedResponse(cacheKey);

          if (cached) {
            const response = NextResponse.json(cached);
            response.headers.set("X-Cache", "HIT");
            return response;
          }
        }

        // Execute handler
        const data = await handler(req);

        // Create optimized response
        const response = await this.createResponse(data, req, options);

        // Cache response if caching is enabled
        if (options.cache && req.method === "GET") {
          const cacheKey = this.generateCacheKey(req);
          await this.cacheResponse(cacheKey, data, options.cache.ttl);
          response.headers.set("X-Cache", "MISS");
        }

        return response;
      } catch (error) {
        console.error("API Error:", error);
        return this.createErrorResponse(error as Error);
      }
    };
  }

  /**
   * Batch response handler for multiple requests
   */
  async createBatchResponse(
    requests: Array<{
      id: string;
      handler: () => Promise<any>;
    }>,
    req: NextRequest,
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const results: Array<{
      id: string;
      success: boolean;
      data?: any;
      error?: any;
    }> = [];

    // Execute all requests in parallel
    const promises = requests.map(async (request) => {
      try {
        const data = await request.handler();
        return {
          id: request.id,
          success: true,
          data,
        };
      } catch (error) {
        return {
          id: request.id,
          success: false,
          error: {
            message: error instanceof Error ? error.message : String(error),
          },
        };
      }
    });

    const batchResults = await Promise.allSettled(promises);

    batchResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({
          id: requests[index].id,
          success: false,
          error: {
            message: result.reason,
          },
        });
      }
    });

    const batchResponse = {
      success: true,
      data: results,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        version: "1.0",
        processingTime: Date.now() - startTime,
        batchSize: requests.length,
      },
    };

    return NextResponse.json(batchResponse);
  }

  /**
   * Stream large responses
   */
  createStreamResponse(
    dataStream: AsyncIterable<any>,
    req: NextRequest,
  ): Response {
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode('{"success":true,"data":['));

        let first = true;
        try {
          for await (const item of dataStream) {
            if (!first) {
              controller.enqueue(encoder.encode(","));
            }
            controller.enqueue(encoder.encode(JSON.stringify(item)));
            first = false;
          }

          controller.enqueue(
            encoder.encode(
              `],"meta":{"timestamp":"${new Date().toISOString()}"}}`,
            ),
          );
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "application/json",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  private addStandardHeaders(response: NextResponse, requestId: string): void {
    response.headers.set("X-Request-ID", requestId);
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }

  private addCacheHeaders(
    response: NextResponse,
    cacheOptions: NonNullable<ResponseOptions["cache"]>,
  ): void {
    const maxAge = Math.floor(cacheOptions.ttl / 1000);
    const cacheControl = cacheOptions.private
      ? `private, max-age=${maxAge}`
      : `public, max-age=${maxAge}`;

    response.headers.set("Cache-Control", cacheControl);

    if (cacheOptions.vary) {
      response.headers.set("Vary", cacheOptions.vary.join(", "));
    }
  }

  private generateETag(content: string): string {
    // Simple hash-based ETag
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `"${Math.abs(hash).toString(16)}"`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldCompress(content: string, req: NextRequest): boolean {
    if (content.length < this.compressionConfig.threshold) {
      return false;
    }

    const acceptEncoding = req.headers.get("accept-encoding") || "";
    return this.compressionConfig.algorithms.some((alg) =>
      acceptEncoding.includes(alg),
    );
  }

  private async compressResponse(
    response: NextResponse,
    content: string,
    req: NextRequest,
  ): Promise<NextResponse> {
    const acceptEncoding = req.headers.get("accept-encoding") || "";

    // For now, we'll just set the content-encoding header
    // In a real implementation, you'd use a compression library
    if (acceptEncoding.includes("gzip")) {
      response.headers.set("Content-Encoding", "gzip");
    } else if (acceptEncoding.includes("deflate")) {
      response.headers.set("Content-Encoding", "deflate");
    } else if (acceptEncoding.includes("br")) {
      response.headers.set("Content-Encoding", "br");
    }

    return response;
  }
}

// Singleton instance
export const responseOptimizer = new ResponseOptimizer();

// Helper functions for common use cases
export function createSuccessResponse<T>(
  data: T,
  req: NextRequest,
  options?: ResponseOptions,
): Promise<NextResponse> {
  return responseOptimizer.createResponse(data, req, options);
}

export function createErrorResponse(
  error: Error | string,
  statusCode?: number,
  code?: string,
): NextResponse {
  return responseOptimizer.createErrorResponse(error, statusCode, code);
}

export function withCaching(ttl: number = 300000) {
  return {
    cache: {
      ttl,
      vary: ["Accept", "Accept-Encoding"],
    },
  };
}

export function withCompression() {
  return {
    compress: true,
    etag: true,
  };
}

export function withFullOptimization(ttl: number = 300000) {
  return {
    compress: true,
    etag: true,
    cache: {
      ttl,
      vary: ["Accept", "Accept-Encoding"],
    },
  };
}
