/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['books.google.com'], // Allow loading book covers from Google Books
      unoptimized: process.env.NODE_ENV === 'production', // Required for static export
    },
    i18n: {
      locales: ['en', 'es', 'de', 'ja', 'uk'],
      defaultLocale: 'en',
    },
    // For GitHub Pages static export
    basePath: process.env.NODE_ENV === 'production' ? '/your-repo-name' : '',
    assetPrefix: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '',
    trailingSlash: true, // Required for GitHub Pages
  }
  
  module.exports = nextConfig