#!/usr/bin/env node

/**
 * CSP Requirements Analysis Script
 * Analyzes the codebase to identify specific CSP requirements
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function analyzeCSPRequirements() {
  console.log("🔍 Analyzing CSP Requirements...\n");

  const results = {
    inlineStyles: [],
    inlineScripts: [],
    externalDomains: new Set(),
    recommendations: [],
  };

  // Analyze HTML/JSX files for inline styles and scripts
  function analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, "utf8");

      // Find inline styles
      const styleMatches = content.match(/style\s*=\s*["']([^"']*)["']/gi);
      if (styleMatches) {
        styleMatches.forEach((match) => {
          const hash = crypto
            .createHash("sha256")
            .update(match)
            .digest("base64");
          results.inlineStyles.push({
            file: filePath,
            content: match.substring(0, 100) + "...",
            hash: `'sha256-${hash}'`,
          });
        });
      }

      // Find external domains in src/href attributes
      const externalMatches = content.match(
        /(src|href)\s*=\s*["'](https?:\/\/[^"']*)/gi,
      );
      if (externalMatches) {
        externalMatches.forEach((match) => {
          const urlMatch = match.match(/https?:\/\/([^\/'"]*)/);
          if (urlMatch) {
            results.externalDomains.add(urlMatch[1]);
          }
        });
      }

      // Find inline event handlers
      const eventHandlers = content.match(/on\w+\s*=\s*["'][^"']*["']/gi);
      if (eventHandlers) {
        eventHandlers.forEach((handler) => {
          results.inlineScripts.push({
            file: filePath,
            content: handler,
            type: "event-handler",
          });
        });
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  // Recursively analyze files
  function analyzeDirectory(
    dir,
    extensions = [".tsx", ".jsx", ".ts", ".js", ".html"],
  ) {
    try {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (
          stat.isDirectory() &&
          !file.startsWith(".") &&
          file !== "node_modules"
        ) {
          analyzeDirectory(filePath, extensions);
        } else if (
          stat.isFile() &&
          extensions.some((ext) => file.endsWith(ext))
        ) {
          analyzeFile(filePath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  // Analyze key directories
  ["components", "pages", "lib", "public"].forEach((dir) => {
    if (fs.existsSync(dir)) {
      analyzeDirectory(dir);
    }
  });

  // Generate recommendations
  generateRecommendations(results);

  return results;
}

function generateRecommendations(results) {
  console.log("📋 CSP REQUIREMENTS ANALYSIS");
  console.log("=============================\n");

  // Inline Styles Analysis
  console.log("🎨 INLINE STYLES FOUND:");
  if (results.inlineStyles.length === 0) {
    console.log("✅ No inline styles detected");
  } else {
    console.log(`⚠️  Found ${results.inlineStyles.length} inline styles`);
    results.inlineStyles.slice(0, 5).forEach((style, index) => {
      console.log(`   ${index + 1}. ${style.file}`);
      console.log(`      Content: ${style.content}`);
      console.log(`      Hash: ${style.hash}`);
    });
    if (results.inlineStyles.length > 5) {
      console.log(`   ... and ${results.inlineStyles.length - 5} more`);
    }
  }
  console.log();

  // Inline Scripts Analysis
  console.log("📜 INLINE SCRIPTS FOUND:");
  if (results.inlineScripts.length === 0) {
    console.log("✅ No inline scripts detected");
  } else {
    console.log(`⚠️  Found ${results.inlineScripts.length} inline scripts`);
    results.inlineScripts.slice(0, 5).forEach((script, index) => {
      console.log(`   ${index + 1}. ${script.file} (${script.type})`);
      console.log(`      Content: ${script.content}`);
    });
  }
  console.log();

  // External Domains Analysis
  console.log("🌐 EXTERNAL DOMAINS FOUND:");
  const domains = Array.from(results.externalDomains).sort();
  if (domains.length === 0) {
    console.log("✅ No external domains detected");
  } else {
    console.log(`📊 Found ${domains.length} external domains:`);
    domains.forEach((domain) => {
      console.log(`   • ${domain}`);
    });
  }
  console.log();

  // CSP Recommendations
  console.log("🔒 CSP RECOMMENDATIONS:");
  console.log("========================\n");

  if (results.inlineStyles.length === 0) {
    console.log("✅ style-src: Can remove 'unsafe-inline'");
    results.recommendations.push("Remove 'unsafe-inline' from style-src");
  } else {
    console.log(
      "⚠️  style-src: Consider using CSS classes instead of inline styles",
    );
    console.log("   Alternative: Use style hashes for specific inline styles");
    results.recommendations.push(
      "Replace inline styles with CSS classes or use specific hashes",
    );
  }

  if (results.inlineScripts.length === 0) {
    console.log("✅ script-src: Can remove 'unsafe-inline'");
    results.recommendations.push("Remove 'unsafe-inline' from script-src");
  } else {
    console.log(
      "⚠️  script-src: Replace inline event handlers with addEventListener",
    );
    results.recommendations.push(
      "Replace inline scripts with external scripts or event listeners",
    );
  }

  // Image sources
  console.log(
    "🖼️  img-src: Consider restricting instead of using data: and https:",
  );
  results.recommendations.push(
    "Restrict img-src to specific domains instead of using wildcards",
  );

  // Domain-specific recommendations
  if (domains.length > 0) {
    console.log("\n🎯 DOMAIN-SPECIFIC CSP:");
    console.log("   script-src: Add specific domains instead of wildcards");
    console.log("   connect-src: Add API domains");
    console.log("   img-src: Add image CDN domains");
  }

  console.log("\n🔧 NEXT STEPS:");
  console.log("===============");
  results.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });

  console.log("\n📝 SUGGESTED CSP UPDATES:");
  console.log("==========================");

  // Generate improved CSP
  const improvedCSP = generateImprovedCSP(domains, results);
  console.log(improvedCSP);
}

function generateImprovedCSP(domains, results) {
  const csp = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      // Add specific domains instead of wildcards
      ...domains.filter(
        (d) =>
          d.includes("google") || d.includes("vercel") || d.includes("cdn"),
      ),
    ],
    "style-src": [
      "'self'",
      // Only add unsafe-inline if absolutely necessary
      ...(results.inlineStyles.length > 0 ? ["'unsafe-inline'"] : []),
      "https://fonts.googleapis.com",
    ],
    "img-src": [
      "'self'",
      "data:", // Only if needed for optimized images
      ...domains.filter(
        (d) =>
          d.includes("images") ||
          d.includes("unsplash") ||
          d.includes("storage"),
      ),
    ],
    "connect-src": [
      "'self'",
      ...domains.filter(
        (d) =>
          d.includes("api") ||
          d.includes("firebase") ||
          d.includes("googleapis"),
      ),
    ],
  };

  return Object.entries(csp)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ");
}

// Run analysis
if (require.main === module) {
  try {
    const results = analyzeCSPRequirements();

    // Save results to file for reference
    fs.writeFileSync(
      ".next/csp-analysis.json",
      JSON.stringify(results, null, 2),
    );
    console.log("\n💾 Analysis saved to .next/csp-analysis.json");
  } catch (error) {
    console.error("❌ Error during CSP analysis:", error.message);
    process.exit(1);
  }
}

module.exports = { analyzeCSPRequirements };
