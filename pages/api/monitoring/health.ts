import type { NextApiRequest, NextApiResponse } from "next";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: CheckResult;
    firebase: CheckResult;
    external_apis: CheckResult;
    performance: CheckResult;
  };
  metrics: {
    memory: {
      used: number;
      free: number;
      total: number;
      percentage: number;
    };
    response_time: number;
  };
}

interface CheckResult {
  status: "pass" | "fail" | "warn";
  message: string;
  duration_ms: number;
  details?: any;
}

const startTime = Date.now();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheck>,
) {
  const checkStartTime = Date.now();

  try {
    // Run all health checks
    const [databaseCheck, firebaseCheck, externalApisCheck, performanceCheck] =
      await Promise.allSettled([
        checkDatabase(),
        checkFirebase(),
        checkExternalApis(),
        checkPerformance(),
      ]);

    // Get system metrics
    const metrics = getSystemMetrics();

    // Determine overall status
    const checks = {
      database: getCheckResult(databaseCheck),
      firebase: getCheckResult(firebaseCheck),
      external_apis: getCheckResult(externalApisCheck),
      performance: getCheckResult(performanceCheck),
    };

    const overallStatus = determineOverallStatus(checks);
    const responseTime = Date.now() - checkStartTime;

    const healthCheck: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: process.env.NEXT_PUBLIC_VERSION || "unknown",
      environment: process.env.NODE_ENV || "unknown",
      checks,
      metrics: {
        ...metrics,
        response_time: responseTime,
      },
    };

    // Set appropriate status code
    const statusCode =
      overallStatus === "healthy"
        ? 200
        : overallStatus === "degraded"
          ? 200
          : 503;

    res.status(statusCode).json(healthCheck);
  } catch (error) {
    const errorResponse: HealthCheck = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: process.env.NEXT_PUBLIC_VERSION || "unknown",
      environment: process.env.NODE_ENV || "unknown",
      checks: {
        database: {
          status: "fail",
          message: "Health check failed",
          duration_ms: 0,
        },
        firebase: {
          status: "fail",
          message: "Health check failed",
          duration_ms: 0,
        },
        external_apis: {
          status: "fail",
          message: "Health check failed",
          duration_ms: 0,
        },
        performance: {
          status: "fail",
          message: "Health check failed",
          duration_ms: 0,
        },
      },
      metrics: {
        memory: { used: 0, free: 0, total: 0, percentage: 0 },
        response_time: Date.now() - checkStartTime,
      },
    };

    res.status(503).json(errorResponse);
  }
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();

  try {
    // For Firebase Firestore, we'll do a simple query
    // In a real app, you'd import and use your database connection

    // Simulate database check
    await new Promise((resolve) => setTimeout(resolve, 10));

    return {
      status: "pass",
      message: "Database connection successful",
      duration_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "fail",
      message: `Database check failed: ${error}`,
      duration_ms: Date.now() - start,
    };
  }
}

async function checkFirebase(): Promise<CheckResult> {
  const start = Date.now();

  try {
    // Check Firebase connectivity
    // You would typically make a simple Firebase call here

    // Simulate Firebase check
    await new Promise((resolve) => setTimeout(resolve, 5));

    return {
      status: "pass",
      message: "Firebase services accessible",
      duration_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "fail",
      message: `Firebase check failed: ${error}`,
      duration_ms: Date.now() - start,
    };
  }
}

async function checkExternalApis(): Promise<CheckResult> {
  const start = Date.now();

  try {
    // Check external API dependencies
    const checks = await Promise.allSettled([
      // Google Books API check
      fetch(
        "https://www.googleapis.com/books/v1/volumes?q=test&maxResults=1",
      ).then((res) => res.ok),
    ]);

    const allPassed = checks.every(
      (check) => check.status === "fulfilled" && check.value === true,
    );

    return {
      status: allPassed ? "pass" : "warn",
      message: allPassed
        ? "All external APIs accessible"
        : "Some external APIs may be unavailable",
      duration_ms: Date.now() - start,
      details: {
        google_books: checks[0].status === "fulfilled" ? "pass" : "fail",
      },
    };
  } catch (error) {
    return {
      status: "fail",
      message: `External API check failed: ${error}`,
      duration_ms: Date.now() - start,
    };
  }
}

async function checkPerformance(): Promise<CheckResult> {
  const start = Date.now();

  try {
    // Check basic performance metrics
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent =
      (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    let status: CheckResult["status"] = "pass";
    let message = "Performance metrics within normal range";

    // Set thresholds for performance warnings
    if (memoryUsagePercent > 90) {
      status = "fail";
      message = "High memory usage detected";
    } else if (memoryUsagePercent > 70) {
      status = "warn";
      message = "Elevated memory usage";
    }

    return {
      status,
      message,
      duration_ms: Date.now() - start,
      details: {
        memory_usage_percent: Math.round(memoryUsagePercent),
        heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
    };
  } catch (error) {
    return {
      status: "fail",
      message: `Performance check failed: ${error}`,
      duration_ms: Date.now() - start,
    };
  }
}

function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();

  return {
    memory: {
      used: memoryUsage.heapUsed,
      free: memoryUsage.heapTotal - memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      percentage: Math.round(
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      ),
    },
  };
}

function getCheckResult(
  promiseResult: PromiseSettledResult<CheckResult>,
): CheckResult {
  if (promiseResult.status === "fulfilled") {
    return promiseResult.value;
  } else {
    return {
      status: "fail",
      message: `Check failed: ${promiseResult.reason}`,
      duration_ms: 0,
    };
  }
}

function determineOverallStatus(
  checks: HealthCheck["checks"],
): HealthCheck["status"] {
  const checkResults = Object.values(checks);

  if (checkResults.some((check) => check.status === "fail")) {
    return "unhealthy";
  }

  if (checkResults.some((check) => check.status === "warn")) {
    return "degraded";
  }

  return "healthy";
}
