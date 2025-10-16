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
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,DELETE,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
          },
        ],
      },
    ];
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
