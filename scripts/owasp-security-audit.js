#!/usr/bin/env node

/**
 * OWASP Security Compliance Audit Script
 *
 * This script performs a comprehensive security audit based on OWASP Top 10
 * and other security best practices for Next.js applications.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class OWASPSecurityAudit {
  constructor() {
    this.projectRoot = process.cwd();
    this.results = {
      score: 0,
      maxScore: 100,
      findings: [],
      recommendations: [],
      compliance: {},
    };
  }

  async runAudit() {
    console.log("🔍 Starting OWASP Security Compliance Audit...\n");

    // OWASP Top 10 2021 Categories
    await this.auditA01_BrokenAccessControl();
    await this.auditA02_CryptographicFailures();
    await this.auditA03_Injection();
    await this.auditA04_InsecureDesign();
    await this.auditA05_SecurityMisconfiguration();
    await this.auditA06_VulnerableComponents();
    await this.auditA07_IdentificationAuthFailures();
    await this.auditA08_SoftwareDataIntegrityFailures();
    await this.auditA09_SecurityLoggingFailures();
    await this.auditA10_ServerSideRequestForgery();

    // Additional security checks
    await this.auditCSPImplementation();
    await this.auditInputValidation();

    this.calculateFinalScore();
    this.generateReport();
  }

  // A01:2021 – Broken Access Control
  async auditA01_BrokenAccessControl() {
    console.log("📊 Auditing A01: Broken Access Control");
    let score = 0;
    const maxScore = 15;

    // Check for authentication middleware usage
    const authFiles = this.findFiles("pages/api", /auth|middleware/i);
    if (authFiles.length > 0) {
      score += 5;
      this.addFinding("PASS", "Authentication infrastructure detected");
    } else {
      this.addFinding("FAIL", "No authentication infrastructure found");
    }

    // Check for protected routes
    const protectedRoutes = this.findFilesContaining("pages/api", [
      "verifyIdToken",
      "auth.verifyIdToken",
    ]);
    if (protectedRoutes.length >= 3) {
      score += 5;
      this.addFinding(
        "PASS",
        `${protectedRoutes.length} API endpoints with authentication found`,
      );
    } else {
      this.addFinding(
        "WARN",
        `Only ${protectedRoutes.length} authenticated endpoints found`,
      );
      score += 2;
    }

    // Check for role-based access control patterns
    const rbacPatterns = this.findFilesContaining("pages/api", [
      "admin",
      "role",
      "permission",
    ]);
    if (rbacPatterns.length > 0) {
      score += 5;
      this.addFinding("PASS", "Role-based access control patterns detected");
    } else {
      this.addFinding("WARN", "No explicit RBAC patterns found");
      score += 2;
    }

    this.results.compliance.A01_BrokenAccessControl = { score, maxScore };
    this.results.score += score;
  }

  // A02:2021 – Cryptographic Failures
  async auditA02_CryptographicFailures() {
    console.log("📊 Auditing A02: Cryptographic Failures");
    let score = 0;
    const maxScore = 10;

    // Check for HTTPS enforcement
    const nextConfig = this.readFileContent("next.config.js");
    if (nextConfig && nextConfig.includes("Strict-Transport-Security")) {
      score += 3;
      this.addFinding("PASS", "HSTS headers configured");
    } else {
      this.addFinding("WARN", "HSTS headers not found");
    }

    // Check for secure cookie settings
    const cookieFiles = this.findFilesContaining("lib", [
      "secure:",
      "httpOnly:",
      "sameSite:",
    ]);
    if (cookieFiles.length > 0) {
      score += 4;
      this.addFinding("PASS", "Secure cookie configurations found");
    } else {
      this.addFinding("WARN", "No secure cookie configurations found");
    }

    // Check for environment variable usage (no hardcoded secrets)
    const hardcodedSecrets = this.findFilesContaining(
      "",
      ["password", "secret", "key"],
      ["node_modules", ".git"],
    );
    if (hardcodedSecrets.length === 0) {
      score += 3;
      this.addFinding("PASS", "No obvious hardcoded secrets found");
    } else {
      this.addFinding(
        "FAIL",
        `Potential hardcoded secrets in ${hardcodedSecrets.length} files`,
      );
    }

    this.results.compliance.A02_CryptographicFailures = { score, maxScore };
    this.results.score += score;
  }

  // A03:2021 – Injection
  async auditA03_Injection() {
    console.log("📊 Auditing A03: Injection");
    let score = 0;
    const maxScore = 15;

    // Check for input validation schemas
    const validationSchemas = this.findFiles("lib/schemas", /\.ts$/);
    if (validationSchemas.length >= 4) {
      score += 8;
      this.addFinding(
        "PASS",
        `${validationSchemas.length} validation schemas found`,
      );
    } else {
      this.addFinding(
        "WARN",
        `Only ${validationSchemas.length} validation schemas found`,
      );
      score += 3;
    }

    // Check for sanitization usage
    const sanitizationUsage = this.findFilesContaining("", [
      "sanitize",
      "InputValidator",
    ]);
    if (sanitizationUsage.length >= 3) {
      score += 4;
      this.addFinding("PASS", "Input sanitization detected in multiple files");
    } else {
      this.addFinding("WARN", "Limited input sanitization usage");
      score += 1;
    }

    // Check for SQL injection prevention (parameterized queries)
    const sqlFiles = this.findFilesContaining(
      "",
      ["query", "sql"],
      ["node_modules"],
    );
    const parameterizedQueries = this.findFilesContaining("", [
      "$1",
      "?",
      "prepare",
    ]);
    if (sqlFiles.length === 0 || parameterizedQueries.length > 0) {
      score += 3;
      this.addFinding("PASS", "No SQL injection vulnerabilities detected");
    } else {
      this.addFinding("WARN", "SQL usage found - verify parameterized queries");
    }

    this.results.compliance.A03_Injection = { score, maxScore };
    this.results.score += score;
  }

  // A04:2021 – Insecure Design
  async auditA04_InsecureDesign() {
    console.log("📊 Auditing A04: Insecure Design");
    let score = 0;
    const maxScore = 10;

    // Check for security middleware
    const middlewareFile = this.readFileContent("middleware.ts");
    if (middlewareFile) {
      score += 3;
      this.addFinding("PASS", "Security middleware detected");
    } else {
      this.addFinding("WARN", "No security middleware found");
    }

    // Check for rate limiting
    const rateLimitFiles = this.findFilesContaining("", [
      "rate",
      "limit",
      "throttle",
    ]);
    if (rateLimitFiles.length > 0) {
      score += 4;
      this.addFinding("PASS", "Rate limiting implementation found");
    } else {
      this.addFinding("WARN", "No rate limiting detected");
    }

    // Check for error handling patterns
    const errorHandling = this.findFilesContaining("", [
      "try",
      "catch",
      "error",
    ]);
    if (errorHandling.length >= 10) {
      score += 3;
      this.addFinding("PASS", "Comprehensive error handling detected");
    } else {
      this.addFinding("WARN", "Limited error handling patterns");
      score += 1;
    }

    this.results.compliance.A04_InsecureDesign = { score, maxScore };
    this.results.score += score;
  }

  // A05:2021 – Security Misconfiguration
  async auditA05_SecurityMisconfiguration() {
    console.log("📊 Auditing A05: Security Misconfiguration");
    let score = 0;
    const maxScore = 15;

    // Check for CSP implementation
    const cspImplementation = this.findFilesContaining("", [
      "Content-Security-Policy",
    ]);
    if (cspImplementation.length > 0) {
      score += 5;
      this.addFinding("PASS", "Content Security Policy implemented");
    } else {
      this.addFinding("FAIL", "No CSP implementation found");
    }

    // Check for security headers
    const securityHeaders = this.findFilesContaining("", [
      "X-Frame-Options",
      "X-Content-Type-Options",
      "Referrer-Policy",
    ]);
    if (securityHeaders.length > 0) {
      score += 5;
      this.addFinding("PASS", "Security headers configured");
    } else {
      this.addFinding("WARN", "Missing security headers");
    }

    // Check for proper environment configuration
    const envExample = this.fileExists(".env.example");
    const envLocal = this.fileExists(".env.local");
    if (envExample && !envLocal) {
      score += 3;
      this.addFinding("PASS", "Environment configuration properly structured");
    } else if (!envExample) {
      this.addFinding("WARN", "No .env.example file found");
      score += 1;
    }

    // Check for debug/development code in production files
    const debugCode = this.findFilesContaining("pages", [
      "console.log",
      "debugger",
      "TODO",
    ]);
    if (debugCode.length === 0) {
      score += 2;
      this.addFinding("PASS", "No debug code in production files");
    } else {
      this.addFinding(
        "WARN",
        `Debug code found in ${debugCode.length} production files`,
      );
    }

    this.results.compliance.A05_SecurityMisconfiguration = { score, maxScore };
    this.results.score += score;
  }

  // A06:2021 – Vulnerable and Outdated Components
  async auditA06_VulnerableComponents() {
    console.log("📊 Auditing A06: Vulnerable and Outdated Components");
    let score = 0;
    const maxScore = 10;

    try {
      // Run npm audit
      const auditResult = execSync("npm audit --json", { encoding: "utf8" });
      const audit = JSON.parse(auditResult);

      if (audit.metadata && audit.metadata.vulnerabilities) {
        const vulns = audit.metadata.vulnerabilities;
        const criticalHigh = (vulns.critical || 0) + (vulns.high || 0);

        if (criticalHigh === 0) {
          score += 6;
          this.addFinding(
            "PASS",
            "No critical or high severity vulnerabilities",
          );
        } else {
          this.addFinding(
            "FAIL",
            `${criticalHigh} critical/high severity vulnerabilities found`,
          );
        }

        const moderate = vulns.moderate || 0;
        if (moderate <= 5) {
          score += 2;
        }

        const low = vulns.low || 0;
        if (low <= 10) {
          score += 2;
        }
      }
    } catch (error) {
      this.addFinding(
        "WARN",
        "Could not run npm audit - verify dependencies manually",
      );
      score += 3; // Partial score for missing audit
    }

    this.results.compliance.A06_VulnerableComponents = { score, maxScore };
    this.results.score += score;
  }

  // A07:2021 – Identification and Authentication Failures
  async auditA07_IdentificationAuthFailures() {
    console.log("📊 Auditing A07: Identification and Authentication Failures");
    let score = 0;
    const maxScore = 10;

    // Check for proper token validation
    const tokenValidation = this.findFilesContaining("", [
      "verifyIdToken",
      "jwt.verify",
    ]);
    if (tokenValidation.length >= 3) {
      score += 5;
      this.addFinding(
        "PASS",
        "Token validation implemented in multiple endpoints",
      );
    } else {
      this.addFinding("WARN", "Limited token validation coverage");
      score += 2;
    }

    // Check for session management
    const sessionManagement = this.findFilesContaining("", [
      "session",
      "cookie",
      "logout",
    ]);
    if (sessionManagement.length > 0) {
      score += 3;
      this.addFinding("PASS", "Session management detected");
    } else {
      this.addFinding("WARN", "No explicit session management found");
    }

    // Check for password policies (if applicable)
    const passwordPolicies = this.findFilesContaining("", [
      "password",
      "regex",
      "minLength",
    ]);
    if (passwordPolicies.length > 0) {
      score += 2;
      this.addFinding("PASS", "Password policy patterns detected");
    } else {
      this.addFinding(
        "INFO",
        "No password policies found (may not be applicable)",
      );
      score += 1;
    }

    this.results.compliance.A07_IdentificationAuthFailures = {
      score,
      maxScore,
    };
    this.results.score += score;
  }

  // A08:2021 – Software and Data Integrity Failures
  async auditA08_SoftwareDataIntegrityFailures() {
    console.log("📊 Auditing A08: Software and Data Integrity Failures");
    let score = 0;
    const maxScore = 5;

    // Check for package-lock.json
    if (this.fileExists("package-lock.json")) {
      score += 2;
      this.addFinding("PASS", "Package lock file exists");
    } else {
      this.addFinding("WARN", "No package lock file found");
    }

    // Check for CI/CD pipeline
    const ciFiles = this.findFiles(".github/workflows", /\.yml$|\.yaml$/);
    if (ciFiles.length > 0) {
      score += 3;
      this.addFinding("PASS", "CI/CD pipeline detected");
    } else {
      this.addFinding("WARN", "No CI/CD pipeline found");
      score += 1;
    }

    this.results.compliance.A08_SoftwareDataIntegrityFailures = {
      score,
      maxScore,
    };
    this.results.score += score;
  }

  // A09:2021 – Security Logging and Monitoring Failures
  async auditA09_SecurityLoggingFailures() {
    console.log("📊 Auditing A09: Security Logging and Monitoring Failures");
    let score = 0;
    const maxScore = 10;

    // Check for logging implementation
    const loggingFiles = this.findFilesContaining("", [
      "console.log",
      "logger",
      "winston",
    ]);
    if (loggingFiles.length >= 5) {
      score += 4;
      this.addFinding("PASS", "Logging implementation detected");
    } else {
      this.addFinding("WARN", "Limited logging implementation");
      score += 2;
    }

    // Check for error monitoring
    const errorMonitoring = this.findFilesContaining("", [
      "sentry",
      "monitoring",
      "analytics",
    ]);
    if (errorMonitoring.length > 0) {
      score += 3;
      this.addFinding("PASS", "Error monitoring detected");
    } else {
      this.addFinding("WARN", "No error monitoring found");
    }

    // Check for security event logging
    const securityLogging = this.findFilesContaining("", [
      "auth error",
      "unauthorized",
      "failed",
    ]);
    if (securityLogging.length > 0) {
      score += 3;
      this.addFinding("PASS", "Security event logging detected");
    } else {
      this.addFinding("WARN", "No security event logging found");
      score += 1;
    }

    this.results.compliance.A09_SecurityLoggingFailures = { score, maxScore };
    this.results.score += score;
  }

  // A10:2021 – Server-Side Request Forgery (SSRF)
  async auditA10_ServerSideRequestForgery() {
    console.log("📊 Auditing A10: Server-Side Request Forgery");
    let score = 0;
    const maxScore = 5;

    // Check for URL validation
    const urlValidation = this.findFilesContaining("", ["URL", "url", "fetch"]);
    const urlSanitization = this.findFilesContaining("", [
      "encodeURIComponent",
      "url.parse",
    ]);

    if (urlSanitization.length > 0) {
      score += 3;
      this.addFinding("PASS", "URL sanitization detected");
    } else if (urlValidation.length > 0) {
      this.addFinding("WARN", "URL usage found - verify SSRF protection");
      score += 1;
    } else {
      score += 2;
      this.addFinding("INFO", "No obvious SSRF vectors found");
    }

    // Check for allowlist validation
    const allowlistPatterns = this.findFilesContaining("", [
      "whitelist",
      "allowlist",
      "allowed",
    ]);
    if (allowlistPatterns.length > 0) {
      score += 2;
      this.addFinding("PASS", "Allowlist patterns detected");
    }

    this.results.compliance.A10_ServerSideRequestForgery = { score, maxScore };
    this.results.score += score;
  }

  // Additional: CSP Implementation Audit
  async auditCSPImplementation() {
    console.log("📊 Auditing CSP Implementation");
    let score = 0;
    const maxScore = 10;

    const nextConfig = this.readFileContent("next.config.js");
    if (nextConfig && nextConfig.includes("Content-Security-Policy")) {
      if (!nextConfig.includes("unsafe-inline")) {
        score += 8;
        this.addFinding("PASS", "Strict CSP without unsafe-inline directives");
      } else {
        score += 4;
        this.addFinding("WARN", "CSP implemented but contains unsafe-inline");
      }

      if (nextConfig.includes("nonce") || nextConfig.includes("hash")) {
        score += 2;
        this.addFinding("PASS", "CSP uses nonce or hash-based whitelisting");
      }
    } else {
      this.addFinding("FAIL", "No CSP implementation found");
    }

    this.results.compliance.CSP_Implementation = { score, maxScore };
    this.results.score += score;
  }

  // Additional: Input Validation Audit
  async auditInputValidation() {
    console.log("📊 Auditing Input Validation Coverage");
    let score = 0;
    const maxScore = 10;

    const apiEndpoints = this.findFiles("pages/api", /\.ts$/);
    const validatedEndpoints = this.findFilesContaining("pages/api", [
      "Schema.safeParse",
      "InputValidator",
    ]);

    const coverage = validatedEndpoints.length / apiEndpoints.length;
    if (coverage >= 0.8) {
      score += 8;
      this.addFinding(
        "PASS",
        `${Math.round(coverage * 100)}% API endpoint validation coverage`,
      );
    } else if (coverage >= 0.5) {
      score += 5;
      this.addFinding(
        "WARN",
        `${Math.round(coverage * 100)}% API endpoint validation coverage`,
      );
    } else {
      score += 2;
      this.addFinding(
        "FAIL",
        `Only ${Math.round(coverage * 100)}% API endpoint validation coverage`,
      );
    }

    if (validatedEndpoints.length >= 6) {
      score += 2;
      this.addFinding(
        "PASS",
        `${validatedEndpoints.length} endpoints with comprehensive validation`,
      );
    }

    this.results.compliance.Input_Validation = { score, maxScore };
    this.results.score += score;
  }

  // Helper methods
  findFiles(dir, pattern) {
    const results = [];
    const basePath = path.join(this.projectRoot, dir);

    if (!fs.existsSync(basePath)) return results;

    const files = fs.readdirSync(basePath, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(basePath, file.name);
      if (file.isDirectory()) {
        results.push(...this.findFiles(path.join(dir, file.name), pattern));
      } else if (pattern.test(file.name)) {
        results.push(fullPath);
      }
    }
    return results;
  }

  findFilesContaining(
    dir,
    patterns,
    exclude = ["node_modules", ".git", ".next"],
  ) {
    const results = [];
    const searchDir = dir ? path.join(this.projectRoot, dir) : this.projectRoot;

    const searchInDirectory = (dirPath) => {
      if (!fs.existsSync(dirPath)) return;

      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        const relativePath = path.relative(this.projectRoot, fullPath);

        if (exclude.some((ex) => relativePath.includes(ex))) continue;

        if (file.isDirectory()) {
          searchInDirectory(fullPath);
        } else if (
          file.name.endsWith(".ts") ||
          file.name.endsWith(".js") ||
          file.name.endsWith(".tsx") ||
          file.name.endsWith(".jsx")
        ) {
          try {
            const content = fs.readFileSync(fullPath, "utf8");
            if (patterns.some((pattern) => content.includes(pattern))) {
              results.push(relativePath);
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    };

    searchInDirectory(searchDir);
    return results;
  }

  readFileContent(filePath) {
    const fullPath = path.join(this.projectRoot, filePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, "utf8");
    }
    return null;
  }

  fileExists(filePath) {
    return fs.existsSync(path.join(this.projectRoot, filePath));
  }

  addFinding(status, message) {
    this.results.findings.push({ status, message });
  }

  calculateFinalScore() {
    // Calculate percentage score
    const percentage = Math.round(
      (this.results.score / this.results.maxScore) * 100,
    );
    this.results.percentage = percentage;

    // Determine security grade
    if (percentage >= 90) this.results.grade = "A";
    else if (percentage >= 80) this.results.grade = "B";
    else if (percentage >= 70) this.results.grade = "C";
    else if (percentage >= 60) this.results.grade = "D";
    else this.results.grade = "F";
  }

  generateReport() {
    console.log("\n" + "=".repeat(60));
    console.log("🛡️  OWASP SECURITY AUDIT REPORT");
    console.log("=".repeat(60));
    console.log(
      `📊 Overall Score: ${this.results.score}/${this.results.maxScore} (${this.results.percentage}%)`,
    );
    console.log(`🎯 Security Grade: ${this.results.grade}`);
    console.log("");

    // Category breakdown
    console.log("📋 COMPLIANCE BREAKDOWN:");
    for (const [category, result] of Object.entries(this.results.compliance)) {
      const percentage = Math.round((result.score / result.maxScore) * 100);
      const status = percentage >= 80 ? "✅" : percentage >= 60 ? "⚠️" : "❌";
      console.log(
        `${status} ${category.replace(/_/g, " ")}: ${result.score}/${result.maxScore} (${percentage}%)`,
      );
    }

    console.log("\n📝 DETAILED FINDINGS:");
    this.results.findings.forEach((finding) => {
      const icon =
        finding.status === "PASS"
          ? "✅"
          : finding.status === "WARN"
            ? "⚠️"
            : finding.status === "FAIL"
              ? "❌"
              : "ℹ️";
      console.log(`${icon} ${finding.message}`);
    });

    console.log("\n🎯 RECOMMENDATIONS:");
    if (this.results.percentage < 90) {
      console.log("• Implement remaining security controls to achieve Grade A");
      console.log("• Focus on areas with lowest compliance scores");
      console.log("• Regular security audits and dependency updates");
      console.log("• Consider implementing automated security testing");
    } else {
      console.log("• Excellent security posture! Maintain current standards");
      console.log("• Continue regular security audits");
      console.log("• Monitor for new vulnerabilities in dependencies");
    }

    // Generate JSON report
    const reportPath = path.join(
      this.projectRoot,
      "security-audit-report.json",
    );
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run the audit
if (require.main === module) {
  const audit = new OWASPSecurityAudit();
  audit.runAudit().catch(console.error);
}

module.exports = { OWASPSecurityAudit };
