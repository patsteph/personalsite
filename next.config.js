/** @type {import('next').NextConfig} */
const path = require('path');
const fs = require('fs');

const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  // Enable React strict mode for better development practices
  reactStrictMode: true,
  
  // Environment configuration
  env: {
    FIREBASE_CONFIG: process.env.FIREBASE_CONFIG,
  },
  
  // Enhanced runtime config with more debugging information
  publicRuntimeConfig: {
    buildTime: new Date().toISOString(),
  },
  
  // Disable ESLint during builds for performance
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Redirects for legacy admin HTML pages and API endpoints
  async redirects() {
    return [
      {
        source: '/admin-login.html',
        destination: '/admin/login',
        permanent: true,
      },
      {
        source: '/admin-dashboard.html',
        destination: '/admin',
        permanent: true,
      },
      // Handle direct Vercel domain API requests with a server-side redirect
      {
        source: '/api/signals',
        has: [
          {
            type: 'header',
            key: 'host',
            value: 'personalsite77.vercel.app'
          }
        ],
        destination: '/api/signals-simple',
        permanent: false
      },
      // Redirect API requests when using any Vercel domain
      {
        source: '/api/signals',
        has: [
          {
            type: 'header',
            key: 'referer',
            value: '(.*vercel.app.*)'
          }
        ],
        destination: '/api/signals-simple',
        permanent: false
      }
    ];
  },
  
  // Custom headers for CORS and security
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        // Apply special headers to API routes for CORS
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ];
  },
  
  // Image configuration
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'i.gr-assets.com',
      'images.unsplash.com',
      'source.unsplash.com',
      'books.google.com',
    ],
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Improve loading performance
  experimental: {
    scrollRestoration: true,
    isrFlushToDisk: false, // This ensures Next.js correctly handles the basePath for static assets
  },
  
  // Add rewrites to handle hardcoded API URLs
  async rewrites() {
    return {
      beforeFiles: [
        // Handle absolute URLs to the Vercel domain
        {
          source: '/api/signals',
          destination: '/api/signals-simple',
        },
      ]
    };
  },
  
  // Customize the build ID for more consistent builds
  generateBuildId: async () => {
    return 'build-' + new Date().toISOString().slice(0, 10).replace(/-/g, '');
  },
  
  // Compression
  compress: true,
  
  // Unified webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Add webpack logging in verbose mode
    config.infrastructureLogging = {
      level: 'verbose',
    };
    
    // Ensure Firebase modules are not bundled with conflicting settings
    config.resolve.alias = {
      ...config.resolve.alias,
      'firebase/app': 'firebase/app',
      'firebase/auth': 'firebase/auth',
    };
    
    // Production optimizations for client-side code
    if (!dev && !isServer) {
      // Enable tree shaking and dead code elimination
      config.optimization.usedExports = true;
      
      // Add code splitting optimization
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|next|scheduler)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module) {
              return (
                module.size() > 80000 &&
                /node_modules[/\\]/.test(module.identifier())
              );
            },
            name(module) {
              const crypto = require('crypto');
              const hash = crypto.createHash('sha1');
              hash.update(module.identifier());
              return `lib-${hash.digest('hex').substring(0, 8)}`;
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name(module, chunks) {
              return `shared-${chunks.map(c => c.name).join('~')}`;
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      };

      // Add terser optimization for production
      config.optimization.minimize = true;
    }
    
    return config;
  },
}

// Export the configuration
module.exports = nextConfig;
