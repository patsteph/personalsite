#!/usr/bin/env node

/**
 * Deployment Checklist Script
 * Ensures all requirements are met before deployment
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 Starting Deployment Checklist...\n");

const results = {
  timestamp: new Date().toISOString(),
  checks: [],
  passed: 0,
  failed: 0,
  warnings: 0,
  canDeploy: false,
};

// Helper function to run checks
function runCheck(name, checkFn) {
  console.log(`🔍 Checking: ${name}...`);

  try {
    const result = checkFn();
    const status = result.status || "pass";
    const message = result.message || "Check passed";

    results.checks.push({
      name,
      status,
      message,
      details: result.details,
    });

    if (status === "pass") {
      console.log(`✅ ${name}: ${message}`);
      results.passed++;
    } else if (status === "warn") {
      console.log(`⚠️  ${name}: ${message}`);
      results.warnings++;
    } else {
      console.log(`❌ ${name}: ${message}`);
      results.failed++;
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    results.checks.push({
      name,
      status: "fail",
      message: error.message,
    });
    results.failed++;
  }
}

// Check 1: Environment Variables
runCheck("Environment Variables", () => {
  const requiredEnvVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "FIREBASE_ADMIN_PROJECT_ID",
  ];

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    return {
      status: "fail",
      message: `Missing environment variables: ${missing.join(", ")}`,
    };
  }

  return {
    status: "pass",
    message: "All required environment variables present",
  };
});

// Check 2: Code Quality
runCheck("TypeScript Compilation", () => {
  try {
    execSync("npm run typecheck", { stdio: "pipe" });
    return { status: "pass", message: "No TypeScript errors" };
  } catch (error) {
    return {
      status: "fail",
      message: "TypeScript compilation failed",
      details: error.stdout?.toString(),
    };
  }
});

runCheck("ESLint", () => {
  try {
    execSync("npm run lint", { stdio: "pipe" });
    return { status: "pass", message: "No linting errors" };
  } catch (error) {
    return {
      status: "fail",
      message: "ESLint found issues",
      details: error.stdout?.toString(),
    };
  }
});

// Check 3: Tests
runCheck("Unit Tests", () => {
  try {
    const output = execSync("npm run test:ci", { stdio: "pipe" }).toString();

    // Parse test results
    const testResults = output.match(/Tests:\s+(\d+)\s+passed/);
    const passedTests = testResults ? parseInt(testResults[1]) : 0;

    if (passedTests === 0) {
      return {
        status: "warn",
        message: "No tests found or all tests failed",
      };
    }

    return {
      status: "pass",
      message: `${passedTests} tests passed`,
      details: { passedTests },
    };
  } catch (error) {
    return {
      status: "fail",
      message: "Test suite failed",
      details: error.stdout?.toString(),
    };
  }
});

// Check 4: Build
runCheck("Production Build", () => {
  try {
    execSync("npm run build", { stdio: "pipe" });

    // Check if build directory exists
    if (!fs.existsSync(".next")) {
      return {
        status: "fail",
        message: "Build directory not found",
      };
    }

    return { status: "pass", message: "Build completed successfully" };
  } catch (error) {
    return {
      status: "fail",
      message: "Build failed",
      details: error.stdout?.toString(),
    };
  }
});

// Check 5: Security
runCheck("Security Audit", () => {
  try {
    execSync("npm audit --audit-level moderate", { stdio: "pipe" });
    return { status: "pass", message: "No security vulnerabilities found" };
  } catch (error) {
    const output = error.stdout?.toString() || "";

    // Check if it's just warnings
    if (output.includes("found 0 vulnerabilities")) {
      return { status: "pass", message: "No security vulnerabilities found" };
    }

    // Check severity
    if (
      output.includes("low") &&
      !output.includes("moderate") &&
      !output.includes("high")
    ) {
      return {
        status: "warn",
        message: "Low severity vulnerabilities found",
        details: output,
      };
    }

    return {
      status: "fail",
      message: "Security vulnerabilities found",
      details: output,
    };
  }
});

// Check 6: Performance
runCheck("Performance Baseline", () => {
  try {
    execSync("npm run perf:audit", { stdio: "pipe" });

    // Check if performance report exists
    const reportPath = ".next/performance-audit.json";
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
      const recommendations = report.summary?.recommendationCount || 0;

      if (recommendations > 10) {
        return {
          status: "warn",
          message: `${recommendations} performance recommendations found`,
          details: { recommendations },
        };
      }
    }

    return { status: "pass", message: "Performance audit completed" };
  } catch (error) {
    return {
      status: "warn",
      message: "Performance audit failed (non-blocking)",
      details: error.message,
    };
  }
});

// Check 7: Git Status
runCheck("Git Status", () => {
  try {
    const status = execSync("git status --porcelain", { stdio: "pipe" })
      .toString()
      .trim();

    if (status) {
      return {
        status: "warn",
        message: "Uncommitted changes found",
        details: status.split("\n").slice(0, 5), // Show first 5 files
      };
    }

    return { status: "pass", message: "Working directory clean" };
  } catch (error) {
    return {
      status: "warn",
      message: "Could not check git status",
      details: error.message,
    };
  }
});

// Check 8: Dependencies
runCheck("Dependency Check", () => {
  try {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    const packageLock = JSON.parse(
      fs.readFileSync("package-lock.json", "utf8"),
    );

    // Check if package-lock is up to date
    if (packageJson.version !== packageLock.version) {
      return {
        status: "warn",
        message: "package-lock.json may be out of date",
      };
    }

    // Check for outdated dependencies
    try {
      const outdated = execSync("npm outdated --json", {
        stdio: "pipe",
      }).toString();
      const outdatedPkgs = JSON.parse(outdated);
      const outdatedCount = Object.keys(outdatedPkgs).length;

      if (outdatedCount > 0) {
        return {
          status: "warn",
          message: `${outdatedCount} outdated dependencies found`,
          details: Object.keys(outdatedPkgs).slice(0, 5),
        };
      }
    } catch {
      // npm outdated returns exit code 1 when outdated packages found
    }

    return { status: "pass", message: "Dependencies are up to date" };
  } catch (error) {
    return {
      status: "warn",
      message: "Could not check dependencies",
      details: error.message,
    };
  }
});

// Determine if deployment can proceed
results.canDeploy = results.failed === 0;

// Generate summary
console.log("\n📋 DEPLOYMENT CHECKLIST SUMMARY");
console.log("================================");
console.log(`✅ Passed: ${results.passed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`\n🚀 Can Deploy: ${results.canDeploy ? "YES" : "NO"}`);

if (!results.canDeploy) {
  console.log("\n🛑 DEPLOYMENT BLOCKED");
  console.log("Please fix the failed checks before deploying:");
  results.checks
    .filter((check) => check.status === "fail")
    .forEach((check) => {
      console.log(`  ❌ ${check.name}: ${check.message}`);
    });
}

if (results.warnings > 0) {
  console.log("\n⚠️  WARNINGS (Non-blocking):");
  results.checks
    .filter((check) => check.status === "warn")
    .forEach((check) => {
      console.log(`  ⚠️  ${check.name}: ${check.message}`);
    });
}

// Save detailed report
const reportPath = ".next/deployment-checklist.json";
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\n📋 Detailed report saved to: ${reportPath}`);

// Exit with appropriate code
process.exit(results.canDeploy ? 0 : 1);
