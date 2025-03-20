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
  
  // Improve loading performance and optimize CSS
  experimental: {
    optimizeCss: {
      cssModules: true,
      critters: {
        reduceInlineStyles: false,
        pruneSource: false,
      },
    },
    scrollRestoration: true,
    isrFlushToDisk: false, // This ensures Next.js correctly handles the basePath for static assets
  },
  
  // Headers configuration removed as it's not compatible with static export
  // For static exports, headers must be configured at the hosting level
  
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
