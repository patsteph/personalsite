/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No special configs, middleware, or redirects to ensure direct API access
  experimental: {
    // Enable useful experimental features
    scrollRestoration: true,
  },
  // Log more verbose details during build/runtime
  onDemandEntries: {
    // Keep the build page in memory longer for debugging
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  // Disable any asset prefixes or basePath that might affect routing
  basePath: '',
  assetPrefix: '',
};

module.exports = nextConfig;
