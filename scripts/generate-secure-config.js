#!/usr/bin/env node
/**
 * This script generates a secure runtime configuration file by using environment variables.
 * It's intended to be run during the GitHub Actions build process where secrets are available.
 */
const fs = require('fs');
const path = require('path');

// Get environment variables with fallbacks
// For development only - these fallbacks are just for testing and will work for this specific project
// In production, these should be set as GitHub secrets
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyD4a8iaxHP9xPGV5tR5LwvzDVa5Y9o5wGQ';
const FIREBASE_AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN || 'personalsite-19189.firebaseapp.com';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'personalsite-19189';
const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'personalsite-19189.appspot.com';
const FIREBASE_MESSAGING_SENDER_ID = process.env.FIREBASE_MESSAGING_SENDER_ID || '892517360036';
const FIREBASE_APP_ID = process.env.FIREBASE_APP_ID || '1:892517360036:web:36dda234d9f3f79562e131';
// Google Books API key for ISBN lookup
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY || '';

// Generate the base path based on environment - empty for standard hosting
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const BASE_PATH = '';

// Create the secure config content
const configContent = `
// This file is generated at build time by the CI/CD process
// It contains configuration that comes from secure environment variables
window.SECURE_CONFIG = {
  firebase: {
    apiKey: "${FIREBASE_API_KEY}",
    authDomain: "${FIREBASE_AUTH_DOMAIN}",
    projectId: "${FIREBASE_PROJECT_ID}",
    storageBucket: "${FIREBASE_STORAGE_BUCKET}",
    messagingSenderId: "${FIREBASE_MESSAGING_SENDER_ID}",
    appId: "${FIREBASE_APP_ID}"
  },
  googleBooks: {
    apiKey: "${GOOGLE_BOOKS_API_KEY}"
  },
  basePath: "${BASE_PATH}",
  isProduction: ${isProduction}
};

// Standard hosting - no base path detection needed
console.log('Using empty base path for standard hosting');
`;

// Path for the config file
const outputDir = path.join(process.cwd(), 'public');
const outputFile = path.join(outputDir, 'secure-config.js');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write the file
fs.writeFileSync(outputFile, configContent);
console.log(`Secure configuration written to ${outputFile}`);

// Also copy to 'out' directory if it exists (for static exports)
const outDir = path.join(process.cwd(), 'out');
if (fs.existsSync(outDir)) {
  const outFile = path.join(outDir, 'secure-config.js');
  fs.copyFileSync(outputFile, outFile);
  console.log(`Secure configuration copied to ${outFile}`);
}