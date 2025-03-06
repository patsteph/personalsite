/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['books.google.com'],
  },
  // Remove i18n configuration
  basePath: process.env.NODE_ENV === 'production' ? '/personal-website' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/personal-website/' : '',
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export'
}

module.exports = nextConfig