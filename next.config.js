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
      // Signals redirects removed - we now use the main signals API endpoint directly
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
  
  // Rewrites removed - we now use the direct API endpoints
  async rewrites() {
    return {
      beforeFiles: []
    };
  },
  
  // Use a static build ID to prevent 404s on dynamic routes
  generateBuildId: async () => {
    return 'stable-build';
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
      
      // Add webpack plugin to replace hardcoded URLs during build
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.DefinePlugin({
          'window.API_BASE_URL': JSON.stringify('/api'),
        }),
        // Add a string replacement plugin with improved error handling
        new webpack.NormalModuleReplacementPlugin(
          /(.*)/, 
          (resource) => {
            // Skip if resource or resource.request is undefined
            if (!resource || !resource.request) {
              return;
            }
            
            // Only process JS/TS files
            if (resource.request.match(/\.(js|jsx|ts|tsx)$/)) {
              // Skip node_modules files for better build performance
              if (resource.context && resource.context.includes('node_modules')) {
                return;
              }
              
              // Replace hardcoded URLs in the resource content
              if (resource.context) {
                try {
                  const fs = require('fs');
                  const path = require('path');
                  const fullPath = path.resolve(resource.context, resource.request);
                  
                  // Skip if file doesn't exist or if it's a directory
                  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
                    return;
                  }
                  
                  let content;
                  try {
                    content = fs.readFileSync(fullPath, 'utf8');
                  } catch (readError) {
                    // Skip if we can't read the file (e.g., binary files)
                    return;
                  }
                  
                  // No longer replacing hardcoded URLs - using direct API endpoints
                  const modified = false;
                  
                  // Only write if we made changes
                  if (modified) {
                    try {
                      fs.writeFileSync(fullPath, content, 'utf8');
                    } catch (writeError) {
                      console.error(`[webpack] Error writing to ${fullPath}:`, writeError);
                    }
                  }
                } catch (err) {
                  // Log but continue on error
                  console.error(`[webpack] Error processing ${resource.request}:`, err);
                }
              }
            }
          }
        )
      );
    }
    
    return config;
  },
}

// Export the configuration
module.exports = nextConfig;
