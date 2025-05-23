/**
 * Security Configuration
 * Comprehensive security settings and policies
 */

export interface SecurityConfig {
  headers: SecurityHeaders;
  csp: ContentSecurityPolicy;
  auth: AuthenticationConfig;
  rateLimit: RateLimitConfig;
  validation: ValidationConfig;
}

export interface SecurityHeaders {
  hsts: string;
  frameOptions: string;
  contentTypeOptions: string;
  referrerPolicy: string;
  permissionsPolicy: string;
  crossOriginEmbedderPolicy: string;
  crossOriginOpenerPolicy: string;
  crossOriginResourcePolicy: string;
}

export interface ContentSecurityPolicy {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  fontSrc: string[];
  connectSrc: string[];
  frameSrc: string[];
  objectSrc: string[];
  mediaSrc: string[];
  formAction: string[];
  frameAncestors: string[];
  upgradeInsecureRequests: boolean;
  blockAllMixedContent: boolean;
}

export interface AuthenticationConfig {
  sessionTimeout: number; // in minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  requireMfa: boolean;
  passwordMinLength: number;
  passwordRequireSpecial: boolean;
  jwtExpiration: number; // in hours
}

export interface RateLimitConfig {
  windowMs: number; // in milliseconds
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

export interface ValidationConfig {
  maxBodySize: string;
  allowedFileTypes: string[];
  maxFileSize: number; // in bytes
  sanitizeHtml: boolean;
  validateEmails: boolean;
  blockSuspiciousPatterns: boolean;
}

// Environment-based security configuration
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const securityConfig: SecurityConfig = {
  headers: {
    // HSTS - Force HTTPS in production
    hsts: isProduction
      ? "max-age=63072000; includeSubDomains; preload"
      : "max-age=0",

    // Prevent clickjacking
    frameOptions: "DENY",

    // Prevent MIME type sniffing
    contentTypeOptions: "nosniff",

    // Control referrer information
    referrerPolicy: "strict-origin-when-cross-origin",

    // Permissions policy
    permissionsPolicy: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()",
      "payment=()",
      "usb=()",
    ].join(", "),

    // COOP/COEP for better isolation
    crossOriginEmbedderPolicy: "require-corp",
    crossOriginOpenerPolicy: "same-origin",
    crossOriginResourcePolicy: "cross-origin",
  },

  csp: {
    defaultSrc: ["'self'"],

    scriptSrc: [
      "'self'",
      // Only allow unsafe directives in development
      ...(isDevelopment ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
      // Specific trusted domains for production
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://cdn.vercel-insights.com",
      // Use nonce or hash instead of unsafe-inline in production
      ...(isProduction ? ["'sha256-YOUR_SCRIPT_HASH'"] : []),
    ],

    styleSrc: [
      "'self'",
      "https://fonts.googleapis.com",
      "https://cdn.jsdelivr.net",
      // Only unsafe-inline in development, remove in production
      ...(isDevelopment ? ["'unsafe-inline'"] : []),
    ],

    imgSrc: [
      "'self'",
      "data:", // Allow data URLs for inline images (needed for some optimizations)
      "blob:", // Allow blob URLs for dynamic content
      // Remove wildcard https: and use specific domains
      "https://firebasestorage.googleapis.com",
      "https://i.gr-assets.com",
      "https://images.unsplash.com",
      "https://source.unsplash.com",
      "https://books.google.com",
      "https://www.googletagmanager.com", // For GTM images
      "https://www.google-analytics.com", // For GA images
    ],

    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdn.jsdelivr.net",
    ],

    connectSrc: [
      "'self'",
      "https://vitals.vercel-insights.com",
      "https://firebaseapp.com",
      "https://*.firebaseapp.com",
      "https://identitytoolkit.googleapis.com",
      "https://securetoken.googleapis.com",
      "https://www.googleapis.com",
      "https://firestore.googleapis.com",
      ...(isDevelopment
        ? ["ws://localhost:3000", "http://localhost:3000"]
        : []),
    ],

    frameSrc: ["'none'"],

    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: isProduction,
    blockAllMixedContent: isProduction,
  },

  auth: {
    sessionTimeout: 30, // 30 minutes
    maxLoginAttempts: 5,
    lockoutDuration: 15, // 15 minutes
    requireMfa: false, // Can be enabled later
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    jwtExpiration: 24, // 24 hours
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per window
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    standardHeaders: true,
    legacyHeaders: false,
  },

  validation: {
    maxBodySize: "10mb",
    allowedFileTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "text/markdown",
    ],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    sanitizeHtml: true,
    validateEmails: true,
    blockSuspiciousPatterns: true,
  },
};

// Helper function to generate CSP string
export function generateCSPString(csp: ContentSecurityPolicy): string {
  const directives = [];

  if (csp.defaultSrc.length > 0) {
    directives.push(`default-src ${csp.defaultSrc.join(" ")}`);
  }

  if (csp.scriptSrc.length > 0) {
    directives.push(`script-src ${csp.scriptSrc.join(" ")}`);
  }

  if (csp.styleSrc.length > 0) {
    directives.push(`style-src ${csp.styleSrc.join(" ")}`);
  }

  if (csp.imgSrc.length > 0) {
    directives.push(`img-src ${csp.imgSrc.join(" ")}`);
  }

  if (csp.fontSrc.length > 0) {
    directives.push(`font-src ${csp.fontSrc.join(" ")}`);
  }

  if (csp.connectSrc.length > 0) {
    directives.push(`connect-src ${csp.connectSrc.join(" ")}`);
  }

  if (csp.frameSrc.length > 0) {
    directives.push(`frame-src ${csp.frameSrc.join(" ")}`);
  }

  if (csp.objectSrc.length > 0) {
    directives.push(`object-src ${csp.objectSrc.join(" ")}`);
  }

  if (csp.mediaSrc.length > 0) {
    directives.push(`media-src ${csp.mediaSrc.join(" ")}`);
  }

  if (csp.formAction.length > 0) {
    directives.push(`form-action ${csp.formAction.join(" ")}`);
  }

  if (csp.frameAncestors.length > 0) {
    directives.push(`frame-ancestors ${csp.frameAncestors.join(" ")}`);
  }

  if (csp.upgradeInsecureRequests) {
    directives.push("upgrade-insecure-requests");
  }

  if (csp.blockAllMixedContent) {
    directives.push("block-all-mixed-content");
  }

  return directives.join("; ");
}

// Helper function to get security headers
export function getSecurityHeaders(): Record<string, string> {
  const { headers, csp } = securityConfig;

  return {
    // HSTS
    "Strict-Transport-Security": headers.hsts,

    // Frame protection
    "X-Frame-Options": headers.frameOptions,

    // Content type sniffing protection
    "X-Content-Type-Options": headers.contentTypeOptions,

    // Referrer policy
    "Referrer-Policy": headers.referrerPolicy,

    // Permissions policy
    "Permissions-Policy": headers.permissionsPolicy,

    // Cross-origin policies
    "Cross-Origin-Embedder-Policy": headers.crossOriginEmbedderPolicy,
    "Cross-Origin-Opener-Policy": headers.crossOriginOpenerPolicy,
    "Cross-Origin-Resource-Policy": headers.crossOriginResourcePolicy,

    // Content Security Policy
    "Content-Security-Policy": generateCSPString(csp),

    // Additional security headers
    "X-DNS-Prefetch-Control": "on",
    "X-Permitted-Cross-Domain-Policies": "none",
  };
}

export default securityConfig;
