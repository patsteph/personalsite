/**
 * Comprehensive pagination utilities for APIs
 * Supports cursor-based and offset-based pagination
 */

import { NextRequest } from "next/server";
import { DocumentSnapshot } from "firebase/firestore";

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
  sort?: string;
  order?: "asc" | "desc";
  offset?: number;
}

export interface CursorPaginationParams {
  limit: number;
  cursor?: string;
  direction: "next" | "previous";
  sort: string;
  order: "asc" | "desc";
}

export interface OffsetPaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page?: number;
    limit: number;
    total?: number;
    totalPages?: number;
    hasNext: boolean;
    hasPrevious: boolean;
    nextCursor?: string;
    previousCursor?: string;
    nextPage?: number;
    previousPage?: number;
  };
  meta: {
    count: number;
    estimatedTotal?: number;
    processingTime: number;
  };
}

export interface PaginationConfig {
  defaultLimit: number;
  maxLimit: number;
  defaultSort: string;
  defaultOrder: "asc" | "desc";
  allowedSortFields: string[];
  enableTotalCount: boolean;
  enableEstimatedCount: boolean;
}

export class PaginationManager {
  constructor(
    private config: PaginationConfig = {
      defaultLimit: 20,
      maxLimit: 100,
      defaultSort: "createdAt",
      defaultOrder: "desc",
      allowedSortFields: ["createdAt", "updatedAt", "name", "title"],
      enableTotalCount: false, // Expensive for large datasets
      enableEstimatedCount: true,
    },
  ) {}

  /**
   * Parse pagination parameters from request
   */
  parseParams(req: NextRequest): PaginationParams {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      this.config.maxLimit,
      Math.max(
        1,
        parseInt(
          searchParams.get("limit") || this.config.defaultLimit.toString(),
        ),
      ),
    );

    const cursor = searchParams.get("cursor") || undefined;
    const sort = this.validateSortField(
      searchParams.get("sort") || this.config.defaultSort,
    );
    const order = this.validateOrder(
      searchParams.get("order") || this.config.defaultOrder,
    );
    const offset = (page - 1) * limit;

    return {
      page,
      limit,
      cursor,
      sort,
      order,
      offset,
    };
  }

  /**
   * Create cursor-based pagination parameters
   */
  createCursorParams(params: PaginationParams): CursorPaginationParams {
    return {
      limit: params.limit || this.config.defaultLimit,
      cursor: params.cursor,
      direction: "next", // Can be enhanced to support both directions
      sort: params.sort || this.config.defaultSort,
      order: params.order || this.config.defaultOrder,
    };
  }

  /**
   * Create offset-based pagination parameters
   */
  createOffsetParams(params: PaginationParams): OffsetPaginationParams {
    return {
      page: params.page || 1,
      limit: params.limit || this.config.defaultLimit,
      sort: params.sort || this.config.defaultSort,
      order: params.order || this.config.defaultOrder,
    };
  }

  /**
   * Build pagination result for cursor-based pagination
   */
  buildCursorResult<T>(
    data: T[],
    params: CursorPaginationParams,
    processingTime: number,
    options: {
      totalCount?: number;
      estimatedTotal?: number;
      getItemCursor: (item: T) => string;
      hasMore?: boolean;
    },
  ): PaginationResult<T> {
    const hasNext = options.hasMore ?? data.length === params.limit;
    const hasPrevious = !!params.cursor;

    let nextCursor: string | undefined;
    let previousCursor: string | undefined;

    if (hasNext && data.length > 0) {
      nextCursor = options.getItemCursor(data[data.length - 1]);
    }

    if (hasPrevious && data.length > 0) {
      previousCursor = options.getItemCursor(data[0]);
    }

    return {
      data,
      pagination: {
        limit: params.limit,
        hasNext,
        hasPrevious,
        nextCursor,
        previousCursor,
      },
      meta: {
        count: data.length,
        estimatedTotal: options.estimatedTotal,
        processingTime,
      },
    };
  }

  /**
   * Build pagination result for offset-based pagination
   */
  buildOffsetResult<T>(
    data: T[],
    params: OffsetPaginationParams,
    processingTime: number,
    options: {
      totalCount?: number;
      estimatedTotal?: number;
    } = {},
  ): PaginationResult<T> {
    const totalPages = options.totalCount
      ? Math.ceil(options.totalCount / params.limit)
      : undefined;

    const hasNext = options.totalCount
      ? params.page < totalPages!
      : data.length === params.limit;

    const hasPrevious = params.page > 1;

    const nextPage = hasNext ? params.page + 1 : undefined;
    const previousPage = hasPrevious ? params.page - 1 : undefined;

    return {
      data,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: options.totalCount,
        totalPages,
        hasNext,
        hasPrevious,
        nextPage,
        previousPage,
      },
      meta: {
        count: data.length,
        estimatedTotal: options.estimatedTotal,
        processingTime,
      },
    };
  }

  /**
   * Build pagination links for response headers
   */
  buildLinks(
    baseUrl: string,
    params: PaginationParams,
    result: PaginationResult<any>,
  ): Record<string, string> {
    const links: Record<string, string> = {};
    const url = new URL(baseUrl);

    // Copy existing query parameters
    url.searchParams.set("limit", result.pagination.limit.toString());
    if (params.sort) url.searchParams.set("sort", params.sort);
    if (params.order) url.searchParams.set("order", params.order);

    // Self link
    if (params.page) {
      url.searchParams.set("page", params.page.toString());
    }
    if (params.cursor) {
      url.searchParams.set("cursor", params.cursor);
    }
    links.self = url.toString();

    // Next link
    if (result.pagination.hasNext) {
      if (result.pagination.nextPage) {
        url.searchParams.set("page", result.pagination.nextPage.toString());
        url.searchParams.delete("cursor");
        links.next = url.toString();
      } else if (result.pagination.nextCursor) {
        url.searchParams.delete("page");
        url.searchParams.set("cursor", result.pagination.nextCursor);
        links.next = url.toString();
      }
    }

    // Previous link
    if (result.pagination.hasPrevious) {
      if (result.pagination.previousPage) {
        url.searchParams.set("page", result.pagination.previousPage.toString());
        url.searchParams.delete("cursor");
        links.prev = url.toString();
      } else if (result.pagination.previousCursor) {
        url.searchParams.delete("page");
        url.searchParams.set("cursor", result.pagination.previousCursor);
        links.prev = url.toString();
      }
    }

    // First and last links for offset pagination
    if (result.pagination.totalPages) {
      url.searchParams.set("page", "1");
      url.searchParams.delete("cursor");
      links.first = url.toString();

      url.searchParams.set("page", result.pagination.totalPages.toString());
      links.last = url.toString();
    }

    return links;
  }

  /**
   * Apply pagination parameters to a query array (for in-memory pagination)
   */
  applyArrayPagination<T>(
    items: T[],
    params: OffsetPaginationParams,
  ): { data: T[]; total: number } {
    const startIndex = (params.page - 1) * params.limit;
    const endIndex = startIndex + params.limit;

    return {
      data: items.slice(startIndex, endIndex),
      total: items.length,
    };
  }

  /**
   * Sort array based on pagination parameters
   */
  applySorting<T>(items: T[], sort: string, order: "asc" | "desc"): T[] {
    return [...items].sort((a, b) => {
      const aValue = this.getNestedProperty(a, sort);
      const bValue = this.getNestedProperty(b, sort);

      if (aValue < bValue) return order === "asc" ? -1 : 1;
      if (aValue > bValue) return order === "asc" ? 1 : -1;
      return 0;
    });
  }

  /**
   * Generate cursor from document snapshot (for Firestore)
   */
  static generateFirestoreCursor(doc: DocumentSnapshot): string {
    return Buffer.from(
      JSON.stringify({
        id: doc.id,
        path: doc.ref.path,
      }),
    ).toString("base64");
  }

  /**
   * Parse cursor to document reference (for Firestore)
   */
  static parseFirestoreCursor(
    cursor: string,
  ): { id: string; path: string } | null {
    try {
      const decoded = Buffer.from(cursor, "base64").toString();
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Validate and return search parameters for API responses
   */
  getValidatedParams(req: NextRequest): {
    params: PaginationParams;
    errors: string[];
  } {
    const errors: string[] = [];
    const params = this.parseParams(req);

    if (params.limit! > this.config.maxLimit) {
      errors.push(`Limit cannot exceed ${this.config.maxLimit}`);
    }

    if (params.sort && !this.config.allowedSortFields.includes(params.sort)) {
      errors.push(
        `Invalid sort field. Allowed fields: ${this.config.allowedSortFields.join(", ")}`,
      );
    }

    return { params, errors };
  }

  private validateSortField(sort: string): string {
    return this.config.allowedSortFields.includes(sort)
      ? sort
      : this.config.defaultSort;
  }

  private validateOrder(order: string): "asc" | "desc" {
    return order === "asc" || order === "desc"
      ? order
      : this.config.defaultOrder;
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }
}

// Factory functions for common pagination scenarios
export class PaginationFactory {
  static createBooksPagination(): PaginationManager {
    return new PaginationManager({
      defaultLimit: 24,
      maxLimit: 100,
      defaultSort: "createdAt",
      defaultOrder: "desc",
      allowedSortFields: ["createdAt", "title", "author", "rating", "dateRead"],
      enableTotalCount: false,
      enableEstimatedCount: true,
    });
  }

  static createBlogPagination(): PaginationManager {
    return new PaginationManager({
      defaultLimit: 10,
      maxLimit: 50,
      defaultSort: "publishedAt",
      defaultOrder: "desc",
      allowedSortFields: ["publishedAt", "updatedAt", "title", "views"],
      enableTotalCount: true,
      enableEstimatedCount: false,
    });
  }

  static createSignalsPagination(): PaginationManager {
    return new PaginationManager({
      defaultLimit: 20,
      maxLimit: 100,
      defaultSort: "createdAt",
      defaultOrder: "desc",
      allowedSortFields: ["createdAt", "updatedAt", "title", "source"],
      enableTotalCount: false,
      enableEstimatedCount: true,
    });
  }

  static createAnalyticsPagination(): PaginationManager {
    return new PaginationManager({
      defaultLimit: 50,
      maxLimit: 1000,
      defaultSort: "timestamp",
      defaultOrder: "desc",
      allowedSortFields: ["timestamp", "eventType", "userId"],
      enableTotalCount: false,
      enableEstimatedCount: true,
    });
  }

  static createAdminPagination(): PaginationManager {
    return new PaginationManager({
      defaultLimit: 25,
      maxLimit: 200,
      defaultSort: "createdAt",
      defaultOrder: "desc",
      allowedSortFields: ["createdAt", "updatedAt", "name", "status", "type"],
      enableTotalCount: true,
      enableEstimatedCount: false,
    });
  }
}

// Middleware for automatic pagination response headers
export function withPaginationHeaders(baseUrl: string) {
  return (
    result: PaginationResult<any>,
    params: PaginationParams,
    paginationManager: PaginationManager,
  ) => {
    const links = paginationManager.buildLinks(baseUrl, params, result);

    return {
      headers: {
        "X-Pagination-Page": result.pagination.page?.toString(),
        "X-Pagination-Limit": result.pagination.limit.toString(),
        "X-Pagination-Total": result.pagination.total?.toString(),
        "X-Pagination-Total-Pages": result.pagination.totalPages?.toString(),
        "X-Pagination-Has-Next": result.pagination.hasNext.toString(),
        "X-Pagination-Has-Previous": result.pagination.hasPrevious.toString(),
        Link: Object.entries(links)
          .map(([rel, url]) => `<${url}>; rel="${rel}"`)
          .join(", "),
      },
    };
  };
}
