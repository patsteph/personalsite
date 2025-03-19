#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

/**
 * Generate runtime configuration file with environment variables
 * This runs during the build process to create a runtime-config.js 
 * with the Firebase credentials and site configuration for standard hosting
 */

// Load environment variables from .env.production and .env.local
const productionEnv = dotenv.config({ path: '.env.production' }).parsed || {};
const localEnv = dotenv.config({ path: '.env.local', override: true }).parsed || {};

// Combine them, with local taking precedence
const envVars = { ...productionEnv, ...localEnv };

// Filter only the Firebase related environment variables (those starting with NEXT_PUBLIC_FIREBASE)
const firebaseEnvVars = Object.keys(envVars)
  .filter(key => key.startsWith('NEXT_PUBLIC_FIREBASE'))
  .reduce((obj, key) => {
    obj[key] = envVars[key];
    return obj;
  }, {});

// Determine the environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// Always use empty basePath for standard hosting
const basePath = '';

console.log(`Runtime config using NODE_ENV: ${NODE_ENV}`);
console.log(`Runtime config using basePath: "${basePath}" in ${isProduction ? 'production' : 'development'} mode`);

// Create the runtime config content - for standard hosting
const configContent = `
// This file is generated at build time by generate-standard-config.js
// Do not edit this file manually
window.runtimeConfig = {
  firebase: {
    // The actual Firebase config is set using environment variables during build and deploy
    // We only include the projectId in the public files for reference
    projectId: "${firebaseEnvVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}"
  },
  isProduction: ${isProduction},
  basePath: "${basePath}"
};

// Base path detection (always empty for standard hosting)
(function detectBasePath() {
  // Log for debugging purposes
  console.log('Using basePath:', window.runtimeConfig.basePath);
})();
`;

// Ensure the public directory exists
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write the config to the public directory
const configPath = path.join(publicDir, 'runtime-config.js');
fs.writeFileSync(configPath, configContent);
console.log(`Runtime config written to ${configPath}`);

// Check if 'out' directory exists (for static export), and copy the config there as well
const outDir = path.join(process.cwd(), 'out');
if (fs.existsSync(outDir)) {
  const outConfigPath = path.join(outDir, 'runtime-config.js');
  fs.copyFileSync(configPath, outConfigPath);
  console.log(`Runtime config copied to ${outConfigPath}`);
}