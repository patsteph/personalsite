#!/usr/bin/env node

/**
 * Security Audit Script
 * Comprehensive security assessment and vulnerability scanning
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔒 Starting Security Audit...\n");

const results = {
  timestamp: new Date().toISOString(),
  checks: [],
  vulnerabilities: [],
  recommendations: [],
  score: 0,
  maxScore: 100,
};

// Helper function to run security checks
function runSecurityCheck(name, checkFn) {
  console.log(`🔍 Checking: ${name}...`);

  try {
    const result = checkFn();
    const status = result.status || "pass";
    const score = result.score || 0;
    const maxScore = result.maxScore || 10;

    results.checks.push({
      name,
      status,
      score,
      maxScore,
      message: result.message || "Check completed",
      details: result.details,
      recommendations: result.recommendations || [],
    });

    results.score += score;
    results.maxScore += maxScore;

    if (status === "pass") {
      console.log(`✅ ${name}: ${result.message} (${score}/${maxScore})`);
    } else if (status === "warn") {
      console.log(`⚠️  ${name}: ${result.message} (${score}/${maxScore})`);
    } else {
      console.log(`❌ ${name}: ${result.message} (${score}/${maxScore})`);
      if (result.vulnerability) {
        results.vulnerabilities.push(result.vulnerability);
      }
    }

    if (result.recommendations) {
      results.recommendations.push(...result.recommendations);
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message} (0/10)`);
    results.checks.push({
      name,
      status: "fail",
      score: 0,
      maxScore: 10,
      message: error.message,
    });
    results.maxScore += 10;
  }
}

// Check 1: Security Headers Configuration
runSecurityCheck("Security Headers", () => {
  const nextConfig = fs.readFileSync("next.config.js", "utf8");

  const requiredHeaders = [
    "Strict-Transport-Security",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Content-Security-Policy",
    "Referrer-Policy",
    "Permissions-Policy",
  ];

  let score = 0;
  const missing = [];

  requiredHeaders.forEach((header) => {
    if (nextConfig.includes(header)) {
      score += 2;
    } else {
      missing.push(header);
    }
  });

  if (missing.length === 0) {
    return {
      status: "pass",
      score: 12,
      maxScore: 12,
      message: "All essential security headers configured",
    };
  } else {
    return {
      status: missing.length <= 2 ? "warn" : "fail",
      score,
      maxScore: 12,
      message: `Missing headers: ${missing.join(", ")}`,
      recommendations: [
        `Configure missing security headers: ${missing.join(", ")}`,
      ],
    };
  }
});

// Check 2: Content Security Policy
runSecurityCheck("Content Security Policy", () => {
  const nextConfig = fs.readFileSync("next.config.js", "utf8");

  if (!nextConfig.includes("Content-Security-Policy")) {
    return {
      status: "fail",
      score: 0,
      maxScore: 15,
      message: "No Content Security Policy found",
      vulnerability: {
        type: "Missing CSP",
        severity: "high",
        description: "No Content Security Policy configured",
      },
      recommendations: ["Implement comprehensive Content Security Policy"],
    };
  }

  // Check for unsafe directives
  const unsafeDirectives = ["'unsafe-eval'", "'unsafe-inline'", "data:", "*"];

  let score = 15;
  const issues = [];

  unsafeDirectives.forEach((directive) => {
    if (nextConfig.includes(directive)) {
      score -= 2;
      issues.push(directive);
    }
  });

  if (issues.length === 0) {
    return {
      status: "pass",
      score: 15,
      maxScore: 15,
      message: "CSP configured with secure directives",
    };
  } else {
    return {
      status: score > 8 ? "warn" : "fail",
      score: Math.max(score, 0),
      maxScore: 15,
      message: `CSP contains unsafe directives: ${issues.join(", ")}`,
      recommendations: ["Remove or restrict unsafe CSP directives"],
    };
  }
});

// Check 3: Authentication Security
runSecurityCheck("Authentication Security", () => {
  let score = 0;
  const issues = [];
  const recommendations = [];

  // Check for auth middleware
  if (fs.existsSync("middleware.ts")) {
    score += 5;
  } else {
    issues.push("No authentication middleware found");
    recommendations.push("Implement authentication middleware");
  }

  // Check for session security
  const authFiles = ["lib/auth.tsx", "lib/utils/cookies.ts", "lib/security"];

  authFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      score += 2;
    }
  });

  // Check for secure cookie settings
  if (fs.existsSync("lib/utils/cookies.ts")) {
    const cookieFile = fs.readFileSync("lib/utils/cookies.ts", "utf8");
    if (cookieFile.includes("secure:") && cookieFile.includes("httpOnly:")) {
      score += 3;
    } else {
      issues.push("Cookies not configured securely");
      recommendations.push("Configure secure and httpOnly cookie flags");
    }
  }

  return {
    status: score >= 8 ? "pass" : score >= 5 ? "warn" : "fail",
    score,
    maxScore: 12,
    message:
      issues.length > 0
        ? issues.join(", ")
        : "Authentication security properly configured",
    recommendations,
  };
});

// Check 4: Input Validation
runSecurityCheck("Input Validation", () => {
  let score = 0;
  const files = ["lib/security/input-validation.ts", "lib/utils/validation.ts"];

  const hasValidation = files.some((file) => fs.existsSync(file));

  if (!hasValidation) {
    return {
      status: "fail",
      score: 0,
      maxScore: 10,
      message: "No input validation system found",
      vulnerability: {
        type: "Missing Input Validation",
        severity: "high",
        description: "No centralized input validation system",
      },
      recommendations: ["Implement comprehensive input validation system"],
    };
  }

  score = 10;

  // Check API routes for validation usage
  const apiDir = "pages/api";
  if (fs.existsSync(apiDir)) {
    const apiFiles = fs
      .readdirSync(apiDir, { recursive: true })
      .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

    let validatedRoutes = 0;
    apiFiles.forEach((file) => {
      const content = fs.readFileSync(path.join(apiDir, file), "utf8");
      if (content.includes("validate") || content.includes("sanitize")) {
        validatedRoutes++;
      }
    });

    const validationCoverage = validatedRoutes / apiFiles.length;
    score = Math.round(10 * validationCoverage);
  }

  return {
    status: score >= 7 ? "pass" : "warn",
    score,
    maxScore: 10,
    message: `Input validation coverage: ${score}/10`,
    recommendations:
      score < 7 ? ["Implement validation in all API endpoints"] : [],
  };
});

// Check 5: Dependency Vulnerabilities
runSecurityCheck("Dependency Security", () => {
  try {
    execSync("npm audit --audit-level moderate --json", { stdio: "pipe" });

    return {
      status: "pass",
      score: 10,
      maxScore: 10,
      message: "No dependency vulnerabilities found",
    };
  } catch (error) {
    try {
      const auditOutput = error.stdout?.toString();
      if (auditOutput) {
        const audit = JSON.parse(auditOutput);
        const vulnerabilities = audit.metadata?.vulnerabilities || {};

        const critical = vulnerabilities.critical || 0;
        const high = vulnerabilities.high || 0;
        const moderate = vulnerabilities.moderate || 0;
        const low = vulnerabilities.low || 0;

        let score = 10;
        score -= critical * 3;
        score -= high * 2;
        score -= moderate * 1;
        score = Math.max(0, score);

        const totalVulns = critical + high + moderate + low;

        return {
          status: critical > 0 ? "fail" : high > 0 ? "warn" : "pass",
          score,
          maxScore: 10,
          message: `Found ${totalVulns} vulnerabilities (${critical} critical, ${high} high, ${moderate} moderate, ${low} low)`,
          vulnerability:
            critical > 0
              ? {
                  type: "Critical Dependencies",
                  severity: "critical",
                  description: `${critical} critical dependency vulnerabilities`,
                }
              : undefined,
          recommendations:
            totalVulns > 0
              ? ["Update vulnerable dependencies with npm audit fix"]
              : [],
        };
      }
    } catch (parseError) {
      // Fallback to simple check
    }

    return {
      status: "warn",
      score: 5,
      maxScore: 10,
      message: "Could not parse audit results",
    };
  }
});

// Check 6: Error Handling
runSecurityCheck("Error Handling", () => {
  let score = 0;

  // Check for error tracking
  if (
    fs.existsSync("lib/monitoring/error-tracking.ts") ||
    fs.existsSync("lib/utils/error-handler.ts")
  ) {
    score += 5;
  }

  // Check for monitoring APIs
  if (fs.existsSync("pages/api/monitoring")) {
    score += 3;
  }

  // Check for proper error boundaries
  const componentDirs = ["components", "pages"];
  let hasErrorBoundary = false;

  componentDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir, { recursive: true });
      files.forEach((file) => {
        if (file.includes("error") || file.includes("Error")) {
          hasErrorBoundary = true;
        }
      });
    }
  });

  if (hasErrorBoundary) {
    score += 2;
  }

  return {
    status: score >= 7 ? "pass" : "warn",
    score,
    maxScore: 10,
    message: `Error handling score: ${score}/10`,
    recommendations:
      score < 7
        ? ["Implement comprehensive error handling and monitoring"]
        : [],
  };
});

// Check 7: File Upload Security
runSecurityCheck("File Upload Security", () => {
  // Check if file upload functionality exists
  const hasFileUpload =
    fs.existsSync("pages/api/upload") ||
    fs.existsSync("components/FileUpload") ||
    fs.existsSync("lib/upload");

  if (!hasFileUpload) {
    return {
      status: "pass",
      score: 10,
      maxScore: 10,
      message: "No file upload functionality detected",
    };
  }

  let score = 0;
  const issues = [];

  // Check for file validation
  if (fs.existsSync("lib/security/input-validation.ts")) {
    const validation = fs.readFileSync(
      "lib/security/input-validation.ts",
      "utf8",
    );
    if (validation.includes("validateFile")) {
      score += 5;
    } else {
      issues.push("No file validation found");
    }
  } else {
    issues.push("No file validation system");
  }

  // Check for file type restrictions
  const securityConfig = fs.existsSync("lib/security/security-config.ts");
  if (securityConfig) {
    const config = fs.readFileSync("lib/security/security-config.ts", "utf8");
    if (config.includes("allowedFileTypes")) {
      score += 3;
    }
    if (config.includes("maxFileSize")) {
      score += 2;
    }
  }

  return {
    status: score >= 7 ? "pass" : "fail",
    score,
    maxScore: 10,
    message:
      issues.length > 0 ? issues.join(", ") : "File upload security configured",
    recommendations:
      score < 7 ? ["Implement file upload validation and restrictions"] : [],
  };
});

// Check 8: Rate Limiting
runSecurityCheck("Rate Limiting", () => {
  let score = 0;

  // Check for rate limiting middleware
  const middlewareFiles = [
    "middleware.ts",
    "lib/security/security-middleware.ts",
  ];

  let hasRateLimit = false;
  middlewareFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("rateLimit") || content.includes("rate-limit")) {
        hasRateLimit = true;
        score += 8;
      }
    }
  });

  if (!hasRateLimit) {
    return {
      status: "warn",
      score: 0,
      maxScore: 10,
      message: "No rate limiting detected",
      recommendations: ["Implement rate limiting to prevent abuse"],
    };
  }

  // Check for IP blocking
  if (fs.existsSync("lib/security/security-middleware.ts")) {
    const middleware = fs.readFileSync(
      "lib/security/security-middleware.ts",
      "utf8",
    );
    if (middleware.includes("blockIP") || middleware.includes("blockedIPs")) {
      score += 2;
    }
  }

  return {
    status: "pass",
    score,
    maxScore: 10,
    message: "Rate limiting implemented",
  };
});

// Calculate final score and grade
const finalScore = Math.round((results.score / results.maxScore) * 100);
let grade = "F";
if (finalScore >= 90) grade = "A";
else if (finalScore >= 80) grade = "B";
else if (finalScore >= 70) grade = "C";
else if (finalScore >= 60) grade = "D";

// Generate report
console.log("\n🔒 SECURITY AUDIT REPORT");
console.log("========================\n");

console.log(`📊 Overall Security Score: ${finalScore}/100 (Grade: ${grade})`);
console.log(`🔍 Checks Performed: ${results.checks.length}`);
console.log(`🚨 Vulnerabilities Found: ${results.vulnerabilities.length}`);
console.log(`💡 Recommendations: ${results.recommendations.length}`);

if (results.vulnerabilities.length > 0) {
  console.log("\n🚨 CRITICAL VULNERABILITIES:");
  results.vulnerabilities.forEach((vuln, index) => {
    console.log(`${index + 1}. [${vuln.severity.toUpperCase()}] ${vuln.type}`);
    console.log(`   Description: ${vuln.description}`);
  });
}

if (results.recommendations.length > 0) {
  console.log("\n💡 SECURITY RECOMMENDATIONS:");
  results.recommendations.slice(0, 10).forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });
}

console.log("\n📋 DETAILED RESULTS:");
results.checks.forEach((check) => {
  const status =
    check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
  console.log(
    `${status} ${check.name}: ${check.score}/${check.maxScore} - ${check.message}`,
  );
});

// Security improvement priorities
console.log("\n🎯 SECURITY IMPROVEMENT PRIORITIES:");
const failedChecks = results.checks.filter((check) => check.status === "fail");
const warnChecks = results.checks.filter((check) => check.status === "warn");

if (failedChecks.length > 0) {
  console.log("\n🚨 IMMEDIATE ACTION REQUIRED:");
  failedChecks.forEach((check) => {
    console.log(`- ${check.name}: ${check.message}`);
  });
}

if (warnChecks.length > 0) {
  console.log("\n⚠️  IMPROVEMENTS RECOMMENDED:");
  warnChecks.forEach((check) => {
    console.log(`- ${check.name}: ${check.message}`);
  });
}

// Save detailed report
const reportPath = ".next/security-audit.json";
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\n📋 Detailed report saved to: ${reportPath}`);

console.log("\n✅ Security audit completed!");

// Exit with error code if critical vulnerabilities found
if (results.vulnerabilities.some((v) => v.severity === "critical")) {
  console.log(
    "\n🚨 CRITICAL VULNERABILITIES DETECTED - IMMEDIATE ACTION REQUIRED",
  );
  process.exit(1);
}
