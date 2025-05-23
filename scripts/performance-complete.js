#!/usr/bin/env node

/**
 * Complete Performance Analysis and Optimization Script
 * Runs all performance optimizations and generates comprehensive report
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 Starting Complete Performance Optimization...\n");

// Results tracking
const results = {
  timestamp: new Date().toISOString(),
  optimizations: [],
  errors: [],
  recommendations: [],
  beforeAfter: null,
};

// Helper function to run command and capture output
function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    const output = execSync(command, { encoding: "utf8", stdio: "pipe" });
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    results.errors.push({ step: description, error: error.message });
    return null;
  }
}

// Step 1: Baseline measurement
console.log("📊 STEP 1: Baseline Performance Measurement");
console.log("============================================\n");

try {
  // Get current build size before optimizations
  if (fs.existsSync(".next")) {
    const auditOutput = runCommand(
      "npm run perf:audit",
      "Baseline performance audit",
    );
    if (auditOutput) {
      results.optimizations.push({
        step: "baseline",
        description: "Baseline performance metrics captured",
        status: "completed",
      });
    }
  } else {
    console.log("No existing build found. Creating baseline build...");
    runCommand("npm run build", "Creating baseline build");
    runCommand("npm run perf:audit", "Baseline performance audit");
  }
} catch (error) {
  results.errors.push({ step: "baseline", error: error.message });
}

// Step 2: Image optimization
console.log("\n📷 STEP 2: Image Optimization");
console.log("==============================\n");

const imageOutput = runCommand("npm run perf:images", "Image optimization");
if (imageOutput) {
  results.optimizations.push({
    step: "images",
    description: "Optimized images to WebP format",
    status: "completed",
    savings: "Potential 60-80% size reduction for images",
  });
}

// Step 3: Dependency analysis
console.log("\n📦 STEP 3: Dependency Analysis");
console.log("===============================\n");

const depsOutput = runCommand("npm run perf:deps", "Dependency analysis");
if (depsOutput) {
  results.optimizations.push({
    step: "dependencies",
    description: "Analyzed heavy dependencies for optimization opportunities",
    status: "completed",
    recommendations: [
      "Implement tree shaking for date-fns",
      "Use selective imports for react-icons",
      "Consider dynamic imports for framer-motion",
    ],
  });
}

// Step 4: Bundle analysis
console.log("\n📈 STEP 4: Bundle Analysis");
console.log("===========================\n");

const bundleOutput = runCommand("npm run analyze", "Bundle analysis");
if (bundleOutput) {
  results.optimizations.push({
    step: "bundle-analysis",
    description: "Generated bundle analysis reports",
    status: "completed",
  });
}

// Step 5: Final audit
console.log("\n🎯 STEP 5: Final Performance Audit");
console.log("===================================\n");

const finalAuditOutput = runCommand(
  "npm run perf:audit",
  "Final performance audit",
);
if (finalAuditOutput) {
  results.optimizations.push({
    step: "final-audit",
    description: "Final performance metrics captured",
    status: "completed",
  });
}

// Generate comprehensive recommendations
console.log("\n💡 PERFORMANCE OPTIMIZATION RECOMMENDATIONS");
console.log("===========================================\n");

const recommendations = [
  {
    category: "Images",
    priority: "High",
    action:
      "Replace <img> tags with Next.js <Image> components using optimized WebP images",
    impact: "High - 60-80% image size reduction",
    effort: "Medium",
  },
  {
    category: "JavaScript",
    priority: "High",
    action:
      "Implement tree shaking for date-fns and selective imports for react-icons",
    impact: "Medium - 10-30% bundle size reduction",
    effort: "Low",
  },
  {
    category: "Code Splitting",
    priority: "Medium",
    action: "Implement dynamic imports for admin pages and heavy components",
    impact: "Medium - Improved initial page load",
    effort: "Medium",
  },
  {
    category: "Caching",
    priority: "Medium",
    action: "Implement service worker for static asset caching",
    impact: "High - Faster repeat visits",
    effort: "High",
  },
  {
    category: "Monitoring",
    priority: "Low",
    action: "Set up automated performance monitoring and alerts",
    impact: "Low - Better visibility",
    effort: "Medium",
  },
];

recommendations.forEach((rec, index) => {
  console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.category}`);
  console.log(`   Action: ${rec.action}`);
  console.log(`   Impact: ${rec.impact}`);
  console.log(`   Effort: ${rec.effort}\n`);
});

results.recommendations = recommendations;

// Generate implementation checklist
console.log("✅ IMPLEMENTATION CHECKLIST");
console.log("===========================\n");

const checklist = [
  "□ Install and configure babel-plugin-date-fns",
  "□ Update date-fns imports to use individual functions",
  "□ Replace <img> tags with Next.js <Image> components",
  "□ Update image sources to use optimized WebP versions",
  "□ Implement dynamic imports for admin components",
  "□ Add performance monitoring to production",
  "□ Set up bundle size monitoring in CI/CD",
  "□ Configure service worker for caching",
  "□ Implement lazy loading for below-the-fold content",
  "□ Run Lighthouse audit for final validation",
];

checklist.forEach((item) => console.log(`   ${item}`));

// Save comprehensive report
const reportData = {
  ...results,
  summary: {
    totalOptimizations: results.optimizations.length,
    totalErrors: results.errors.length,
    totalRecommendations: recommendations.length,
    potentialSavings: {
      images: "60-80% size reduction",
      javascript: "10-30% bundle reduction",
      initialLoad: "20-40% faster",
    },
  },
  nextSteps: checklist,
  tools: {
    bundleAnalyzer: ".next/analyze/",
    performanceReports: ".next/performance-audit.json",
    imageOptimization: ".next/image-optimization-report.json",
    dependencyAnalysis: ".next/dependency-optimization-report.json",
  },
};

const reportPath = ".next/performance-complete-report.json";
fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

console.log("\n📋 PERFORMANCE OPTIMIZATION SUMMARY");
console.log("====================================");
console.log(`Optimizations completed: ${results.optimizations.length}`);
console.log(`Errors encountered: ${results.errors.length}`);
console.log(`Recommendations generated: ${recommendations.length}`);
console.log(`\nDetailed report saved to: ${reportPath}`);

console.log("\n🎯 IMMEDIATE NEXT STEPS:");
console.log("1. Review bundle analyzer reports in .next/analyze/");
console.log("2. Implement image optimizations (highest impact)");
console.log("3. Add babel plugins for dependency optimization");
console.log("4. Test performance improvements with npm run analyze");
console.log("5. Set up continuous performance monitoring");

console.log("\n✅ Complete performance optimization analysis finished!");

// Exit with error code if there were errors
if (results.errors.length > 0) {
  console.log(
    `\n⚠️  ${results.errors.length} errors occurred during optimization`,
  );
  process.exit(1);
}
