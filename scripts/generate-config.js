#!/usr/bin/env node
/**
 * Unified Configuration Generator
 * Replaces 3 separate config generation scripts with one efficient solution
 * Optimized for Vercel deployment
 */

const fs = require("fs");
const path = require("path");

const isProd = process.env.NODE_ENV === "production";
const publicDir = path.join(process.cwd(), "public");

console.log(
  `Generating configs for ${isProd ? "production" : "development"} environment`,
);

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Runtime configuration (simplified)
const runtimeConfig = `// Generated at build time - do not edit manually
window.runtimeConfig = {
  isProduction: ${isProd},
  buildTime: "${new Date().toISOString()}"
};`;

// Write runtime config
fs.writeFileSync(path.join(publicDir, "runtime-config.js"), runtimeConfig);
console.log("✓ Runtime config generated");

// Minimal secure config (empty but prevents 404s)
const secureConfig = `// Secure configuration - authentication handled server-side
window.SECURE_CONFIG = {};`;

fs.writeFileSync(path.join(publicDir, "secure-config.js"), secureConfig);
console.log("✓ Secure config generated");

console.log("🎉 All configurations generated successfully");
