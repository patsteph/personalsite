/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Disable ESLint during builds for performance
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Redirects for legacy pages
  async redirects() {
    return [
      {
        source: "/admin-login.html",
        destination: "/admin/login",
        permanent: true,
      },
      {
        source: "/admin-dashboard.html",
        destination: "/admin",
        permanent: true,
      },
    ];
  },

  // Security headers for production
  async headers() {
    if (!isProd) return [];

    // Content-Security-Policy: no 'unsafe-inline'/'unsafe-eval' for scripts.
    // style-src keeps 'unsafe-inline' because Framer Motion and several UI
    // libraries used here set inline style attributes directly via JS,
    // which CSP's style-src governs same as <style> tags; tightening that
    // further would need per-element nonces these libraries don't support.
    //
    // script-src allow-lists cdn.gtranslate.net specifically for the
    // GTranslate footer translation widget (components/GTranslateWidget.tsx)
    // -- its own settings script is served same-origin from
    // public/gtranslate-settings.js instead of inline, so no 'unsafe-inline'
    // exception was needed for that. connect-src additionally allows
    // translate-pa.googleapis.com, which is what the widget actually calls
    // (as translateHtml XHR requests, confirmed live) once a language is
    // selected -- translate.googleapis.com is kept too in case an older
    // widget version or fallback path uses it instead.
    const csp = [
      "default-src 'self'",
      "script-src 'self' https://cdn.gtranslate.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://i.gr-assets.com https://images.unsplash.com https://source.unsplash.com https://books.google.com https://cdn.gtranslate.net",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.firebaseio.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://www.googleapis.com wss://*.firebaseio.com https://cdn.gtranslate.net https://translate.googleapis.com https://translate-pa.googleapis.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
    // Note: no blanket CORS headers on /api/:path* — the app only calls its
    // own API routes from the same origin, so no cross-origin CORS grant is
    // needed. The previous config sent Access-Control-Allow-Origin: "*"
    // together with Access-Control-Allow-Credentials: "true", a combination
    // browsers reject for credentialed requests and that otherwise opened
    // every API response to any origin for no reason.
  },

  // Image optimization
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "i.gr-assets.com",
      "images.unsplash.com",
      "source.unsplash.com",
      "books.google.com",
    ],
    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Performance optimizations
  experimental: {
    scrollRestoration: true,
  },

  // Static build ID for consistency
  generateBuildId: async () => {
    return "stable-build";
  },

  // Enable compression
  compress: true,

  // Simplified webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.usedExports = true;
      config.optimization.minimize = true;
    }

    return config;
  },
};

module.exports = nextConfig;
