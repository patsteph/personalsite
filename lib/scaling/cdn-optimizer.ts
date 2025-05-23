/**
 * CDN optimization and asset delivery strategies
 * Implements intelligent asset routing and optimization
 */

export interface CDNConfig {
  primaryCDN: string;
  fallbackCDNs: string[];
  regions: Record<string, string>;
  assetTypes: Record<string, CDNAssetConfig>;
  enableImageOptimization: boolean;
  enableBrotliCompression: boolean;
  cacheStrategies: Record<string, CacheStrategy>;
}

export interface CDNAssetConfig {
  path: string;
  cacheTTL: number;
  compression: boolean;
  optimization: boolean;
  variants?: string[];
}

export interface CacheStrategy {
  browserTTL: number;
  cdnTTL: number;
  staleWhileRevalidate: boolean;
  purgeOnUpdate: boolean;
}

export interface AssetMetadata {
  url: string;
  size: number;
  hash: string;
  lastModified: Date;
  contentType: string;
  variants: Record<string, string>;
}

export interface OptimizationResult {
  originalUrl: string;
  optimizedUrl: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
}

export class CDNOptimizer {
  private assetCache = new Map<string, AssetMetadata>();
  private performanceMetrics = new Map<
    string,
    {
      responseTime: number;
      successRate: number;
      lastCheck: number;
    }
  >();

  constructor(
    private config: CDNConfig = {
      primaryCDN: "https://cdn.example.com",
      fallbackCDNs: ["https://backup-cdn.example.com"],
      regions: {
        us: "https://us-cdn.example.com",
        eu: "https://eu-cdn.example.com",
        asia: "https://asia-cdn.example.com",
      },
      assetTypes: {
        images: {
          path: "/images/",
          cacheTTL: 31536000, // 1 year
          compression: true,
          optimization: true,
          variants: ["webp", "avif", "jpg"],
        },
        css: {
          path: "/css/",
          cacheTTL: 2592000, // 30 days
          compression: true,
          optimization: true,
        },
        js: {
          path: "/js/",
          cacheTTL: 2592000, // 30 days
          compression: true,
          optimization: true,
        },
        fonts: {
          path: "/fonts/",
          cacheTTL: 31536000, // 1 year
          compression: false,
          optimization: false,
        },
      },
      enableImageOptimization: true,
      enableBrotliCompression: true,
      cacheStrategies: {
        static: {
          browserTTL: 31536000,
          cdnTTL: 31536000,
          staleWhileRevalidate: false,
          purgeOnUpdate: true,
        },
        dynamic: {
          browserTTL: 3600,
          cdnTTL: 86400,
          staleWhileRevalidate: true,
          purgeOnUpdate: false,
        },
      },
    },
  ) {}

  /**
   * Get optimized URL for an asset
   */
  getOptimizedUrl(
    originalUrl: string,
    options: {
      format?: "auto" | "webp" | "avif" | "jpg" | "png";
      quality?: number;
      width?: number;
      height?: number;
      fit?: "cover" | "contain" | "fill";
      region?: string;
      fallback?: boolean;
    } = {},
  ): string {
    const assetType = this.detectAssetType(originalUrl);
    const assetConfig = this.config.assetTypes[assetType];

    if (!assetConfig) {
      return originalUrl;
    }

    // Determine best CDN for region
    const cdnUrl =
      options.region && this.config.regions[options.region]
        ? this.config.regions[options.region]
        : this.getBestCDN();

    // Build optimized URL
    let optimizedUrl = `${cdnUrl}${assetConfig.path}${this.extractFilename(originalUrl)}`;

    // Add optimization parameters for images
    if (assetType === "images" && this.config.enableImageOptimization) {
      optimizedUrl = this.addImageOptimizations(optimizedUrl, options);
    }

    return optimizedUrl;
  }

  /**
   * Preload critical assets
   */
  preloadAssets(
    assets: Array<{
      url: string;
      type: "image" | "script" | "style" | "font";
      priority: "high" | "medium" | "low";
    }>,
  ): void {
    const head = document.head;

    assets.forEach((asset) => {
      const link = document.createElement("link");
      link.rel = this.getPreloadRel(asset.type);
      link.href = this.getOptimizedUrl(asset.url);
      link.as = asset.type === "image" ? "image" : asset.type;

      if (asset.priority === "high") {
        link.setAttribute("fetchpriority", "high");
      }

      // Add image-specific attributes
      if (asset.type === "image") {
        link.setAttribute("imagesrcset", this.generateSrcSet(asset.url));
        link.setAttribute("imagesizes", "(max-width: 768px) 100vw, 50vw");
      }

      head.appendChild(link);
    });
  }

  /**
   * Generate responsive image srcset
   */
  generateSrcSet(
    imageUrl: string,
    widths: number[] = [320, 640, 1024, 1920],
  ): string {
    return widths
      .map((width) => {
        const optimizedUrl = this.getOptimizedUrl(imageUrl, {
          width,
          format: "auto",
        });
        return `${optimizedUrl} ${width}w`;
      })
      .join(", ");
  }

  /**
   * Generate picture element with format fallbacks
   */
  generatePictureElement(
    imageUrl: string,
    options: {
      alt: string;
      sizes?: string;
      loading?: "lazy" | "eager";
      className?: string;
      width?: number;
      height?: number;
    },
  ): string {
    const sizes = options.sizes || "(max-width: 768px) 100vw, 50vw";
    const loading = options.loading || "lazy";

    const avifSrcSet = this.generateSrcSet(imageUrl, [320, 640, 1024, 1920]);
    const webpSrcSet = this.generateSrcSet(imageUrl, [320, 640, 1024, 1920]);
    const jpgSrcSet = this.generateSrcSet(imageUrl, [320, 640, 1024, 1920]);

    return `
      <picture>
        <source srcset="${avifSrcSet.replace(/\?/g, "?format=avif&")}" type="image/avif" sizes="${sizes}">
        <source srcset="${webpSrcSet.replace(/\?/g, "?format=webp&")}" type="image/webp" sizes="${sizes}">
        <img 
          src="${this.getOptimizedUrl(imageUrl, { format: "jpg", width: 1024 })}"
          srcset="${jpgSrcSet}"
          alt="${options.alt}"
          loading="${loading}"
          ${options.className ? `class="${options.className}"` : ""}
          ${options.width ? `width="${options.width}"` : ""}
          ${options.height ? `height="${options.height}"` : ""}
          sizes="${sizes}"
        >
      </picture>
    `;
  }

  /**
   * Optimize and compress assets
   */
  async optimizeAsset(
    assetUrl: string,
    options: {
      quality?: number;
      format?: string;
      maxWidth?: number;
      maxHeight?: number;
    } = {},
  ): Promise<OptimizationResult> {
    const startTime = Date.now();

    try {
      // Get original asset metadata
      const originalMetadata = await this.getAssetMetadata(assetUrl);

      // Apply optimizations
      const optimizedUrl = this.getOptimizedUrl(assetUrl, {
        format: options.format as any,
        quality: options.quality,
        width: options.maxWidth,
        height: options.maxHeight,
      });

      // Get optimized asset metadata
      const optimizedMetadata = await this.getAssetMetadata(optimizedUrl);

      const compressionRatio =
        1 - optimizedMetadata.size / originalMetadata.size;

      return {
        originalUrl: assetUrl,
        optimizedUrl,
        originalSize: originalMetadata.size,
        optimizedSize: optimizedMetadata.size,
        compressionRatio,
        format: options.format || "auto",
      };
    } catch (error) {
      console.error("Asset optimization failed:", error);
      throw error;
    }
  }

  /**
   * Purge CDN cache for specific assets
   */
  async purgeCache(urls: string[] | string): Promise<void> {
    const urlArray = Array.isArray(urls) ? urls : [urls];

    // This would typically make API calls to CDN providers
    for (const url of urlArray) {
      try {
        await this.purgeCDNCache(url);
        console.log(`Cache purged for: ${url}`);
      } catch (error) {
        console.error(`Failed to purge cache for ${url}:`, error);
      }
    }
  }

  /**
   * Monitor CDN performance
   */
  async monitorPerformance(): Promise<Map<string, any>> {
    const results = new Map();
    const cdns = [this.config.primaryCDN, ...this.config.fallbackCDNs];

    for (const cdn of cdns) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${cdn}/health`, { method: "HEAD" });
        const responseTime = Date.now() - startTime;

        const metrics = {
          responseTime,
          status: response.status,
          available: response.ok,
          lastCheck: new Date().toISOString(),
        };

        results.set(cdn, metrics);
        this.performanceMetrics.set(cdn, {
          responseTime,
          successRate: response.ok ? 1 : 0,
          lastCheck: Date.now(),
        });
      } catch (error) {
        results.set(cdn, {
          responseTime: Infinity,
          status: 0,
          available: false,
          error: error instanceof Error ? error.message : String(error),
          lastCheck: new Date().toISOString(),
        });
      }
    }

    return results;
  }

  /**
   * Get cache headers for asset type
   */
  getCacheHeaders(assetType: string): Record<string, string> {
    const assetConfig = this.config.assetTypes[assetType];
    const strategy =
      this.config.cacheStrategies[
        assetType === "images" ? "static" : "dynamic"
      ];

    if (!assetConfig || !strategy) {
      return {};
    }

    const headers: Record<string, string> = {
      "Cache-Control": `public, max-age=${strategy.browserTTL}, s-maxage=${strategy.cdnTTL}`,
      Expires: new Date(Date.now() + strategy.browserTTL * 1000).toUTCString(),
    };

    if (strategy.staleWhileRevalidate) {
      headers["Cache-Control"] += `, stale-while-revalidate=${strategy.cdnTTL}`;
    }

    if (assetConfig.compression && this.config.enableBrotliCompression) {
      headers["Content-Encoding"] = "br";
    }

    return headers;
  }

  /**
   * Generate service worker cache strategy
   */
  generateServiceWorkerStrategy(): string {
    return `
// Auto-generated CDN cache strategy
const CDN_CACHE = 'cdn-assets-v1';
const RUNTIME_CACHE = 'runtime-v1';

const CDN_ORIGINS = [
  '${this.config.primaryCDN}',
  ${this.config.fallbackCDNs.map((cdn) => `'${cdn}'`).join(",\n  ")}
];

// Cache CDN assets with cache-first strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (CDN_ORIGINS.some(origin => url.href.startsWith(origin))) {
    event.respondWith(
      caches.open(CDN_CACHE).then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            return response;
          }
          
          return fetch(event.request).then(fetchResponse => {
            if (fetchResponse.ok) {
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        });
      })
    );
  }
});

// Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('cdn-assets-') && cacheName !== CDN_CACHE)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});
    `;
  }

  private detectAssetType(url: string): string {
    const extension = url.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
      case "avif":
      case "svg":
        return "images";
      case "css":
        return "css";
      case "js":
      case "mjs":
        return "js";
      case "woff":
      case "woff2":
      case "ttf":
      case "otf":
        return "fonts";
      default:
        return "other";
    }
  }

  private getBestCDN(): string {
    // Return CDN with best performance metrics
    let bestCDN = this.config.primaryCDN;
    let bestScore = Infinity;

    this.performanceMetrics.forEach((metrics, cdn) => {
      const score = metrics.responseTime * (1 - metrics.successRate);
      if (score < bestScore) {
        bestScore = score;
        bestCDN = cdn;
      }
    });

    return bestCDN;
  }

  private addImageOptimizations(url: string, options: any): string {
    const params = new URLSearchParams();

    if (options.format && options.format !== "auto") {
      params.set("format", options.format);
    } else {
      params.set("format", "auto");
    }

    if (options.quality) {
      params.set("q", options.quality.toString());
    }

    if (options.width) {
      params.set("w", options.width.toString());
    }

    if (options.height) {
      params.set("h", options.height.toString());
    }

    if (options.fit) {
      params.set("fit", options.fit);
    }

    return `${url}?${params.toString()}`;
  }

  private extractFilename(url: string): string {
    return url.split("/").pop() || "";
  }

  private getPreloadRel(type: string): string {
    switch (type) {
      case "style":
        return "preload";
      case "script":
        return "preload";
      case "font":
        return "preload";
      default:
        return "prefetch";
    }
  }

  private async getAssetMetadata(url: string): Promise<AssetMetadata> {
    if (this.assetCache.has(url)) {
      return this.assetCache.get(url)!;
    }

    try {
      const response = await fetch(url, { method: "HEAD" });
      const metadata: AssetMetadata = {
        url,
        size: parseInt(response.headers.get("content-length") || "0"),
        hash: response.headers.get("etag") || "",
        lastModified: new Date(
          response.headers.get("last-modified") || Date.now(),
        ),
        contentType: response.headers.get("content-type") || "",
        variants: {},
      };

      this.assetCache.set(url, metadata);
      return metadata;
    } catch (error) {
      throw new Error(`Failed to get asset metadata for ${url}: ${error}`);
    }
  }

  private async purgeCDNCache(url: string): Promise<void> {
    // This would make actual API calls to CDN providers
    // For example, Cloudflare, AWS CloudFront, etc.
    console.log(`Purging cache for: ${url}`);
  }
}

// Singleton instance
export const cdnOptimizer = new CDNOptimizer();

// Helper functions
export function optimizeImage(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "auto" | "webp" | "avif";
  } = {},
): string {
  return cdnOptimizer.getOptimizedUrl(src, options);
}

export function generateResponsiveImage(
  src: string,
  alt: string,
  options: {
    sizes?: string;
    loading?: "lazy" | "eager";
    className?: string;
  } = {},
): string {
  return cdnOptimizer.generatePictureElement(src, { alt, ...options });
}

// React hook for CDN optimization
export function useCDNOptimization() {
  return {
    optimizeUrl: cdnOptimizer.getOptimizedUrl.bind(cdnOptimizer),
    generateSrcSet: cdnOptimizer.generateSrcSet.bind(cdnOptimizer),
    preloadAssets: cdnOptimizer.preloadAssets.bind(cdnOptimizer),
    getCacheHeaders: cdnOptimizer.getCacheHeaders.bind(cdnOptimizer),
  };
}
