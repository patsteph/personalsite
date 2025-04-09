#!/usr/bin/env node
/**
 * This script generates a simplified secure configuration file that doesn't contain any secrets.
 * All sensitive operations are now handled server-side.
 */
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local for Firebase config
require('dotenv').config({ path: '.env.local' });

// Create a secure config with Firebase authentication details
const configContent = `
// Secure configuration with Firebase credentials
window.SECURE_CONFIG = {
  firebase: {
    apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}",
    authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}",
    projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}",
    storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}",
    messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}",
    appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}",
    measurementId: "${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''}"
  }
};
console.log('Secure configuration loaded with Firebase credentials');
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

// Add config to the personalsite directory (needed for Vercel deployment)
const personalSiteDir = path.join(outputDir, 'personalsite');
if (!fs.existsSync(personalSiteDir)) {
  fs.mkdirSync(personalSiteDir, { recursive: true });
}
const personalSiteConfigFile = path.join(personalSiteDir, 'secure-config.js');
fs.writeFileSync(personalSiteConfigFile, configContent);
console.log(`Secure configuration copied to ${personalSiteConfigFile}`);

// Also copy to 'out' directory if it exists (for static exports)
const outDir = path.join(process.cwd(), 'out');
if (fs.existsSync(outDir)) {
  const outFile = path.join(outDir, 'secure-config.js');
  fs.copyFileSync(outputFile, outFile);
  console.log(`Secure configuration copied to ${outFile}`);
  
  // Also add to out/personalsite directory
  const outPersonalSiteDir = path.join(outDir, 'personalsite');
  if (!fs.existsSync(outPersonalSiteDir)) {
    fs.mkdirSync(outPersonalSiteDir, { recursive: true });
  }
  const outPersonalSiteConfigFile = path.join(outPersonalSiteDir, 'secure-config.js');
  fs.writeFileSync(outPersonalSiteConfigFile, configContent);
  console.log(`Secure configuration copied to ${outPersonalSiteConfigFile}`);
}