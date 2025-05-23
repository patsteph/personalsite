import type { NextApiRequest, NextApiResponse } from "next";

interface ErrorData {
  message: string;
  stack?: string;
  code?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  context?: Record<string, any>;
  fingerprint?: string[];
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  errorId?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed",
    });
  }

  try {
    const errorData: ErrorData = req.body;

    // Validate the error data
    if (!errorData.message || !errorData.timestamp) {
      return res.status(400).json({
        success: false,
        error: "Invalid error data: message and timestamp are required",
      });
    }

    // Generate unique error ID
    const errorId = generateErrorId(errorData);

    // In development, log the error
    if (process.env.NODE_ENV === "development") {
      console.error("[Error Monitoring] Received error:", {
        id: errorId,
        message: errorData.message,
        severity: errorData.severity,
        url: errorData.url,
        timestamp: errorData.timestamp,
        context: errorData.context,
      });
    }

    // In production, you would typically:
    // 1. Store in database for analysis
    // 2. Send to external error tracking service (Sentry, Rollbar, etc.)
    // 3. Send alerts for critical errors
    // 4. Aggregate for error analytics

    // For critical errors, you might want to send immediate notifications
    if (errorData.severity === "critical") {
      handleCriticalError(errorData, errorId);
    }

    // Log structured error data for analysis
    logStructuredError(errorData, errorId);

    res.status(200).json({
      success: true,
      message: "Error tracked successfully",
      errorId,
    });
  } catch (error) {
    console.error(
      "[Error Monitoring API] Error processing error report:",
      error,
    );
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

function generateErrorId(errorData: ErrorData): string {
  // Create a unique ID based on fingerprint and timestamp
  const fingerprint = errorData.fingerprint?.join("-") || "unknown";
  const timestamp = Date.now();
  return `err_${fingerprint.slice(0, 8)}_${timestamp}`;
}

function handleCriticalError(errorData: ErrorData, errorId: string): void {
  // For critical errors, you might want to:
  // 1. Send immediate notifications (email, Slack, etc.)
  // 2. Create incident tickets
  // 3. Alert on-call engineers

  console.error(`🚨 CRITICAL ERROR [${errorId}]:`, {
    message: errorData.message,
    url: errorData.url,
    timestamp: errorData.timestamp,
    context: errorData.context,
  });

  // Example: Send to external alerting service
  // await sendCriticalAlert(errorData, errorId);
}

function logStructuredError(errorData: ErrorData, errorId: string): void {
  // Create structured log entry for analysis
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: "error",
    errorId,
    service: "personal-website",
    environment: process.env.NODE_ENV,
    error: {
      message: errorData.message,
      severity: errorData.severity,
      code: errorData.code,
      fingerprint: errorData.fingerprint,
    },
    user: {
      id: errorData.userId,
      sessionId: errorData.sessionId,
      userAgent: errorData.userAgent,
    },
    request: {
      url: errorData.url,
    },
    context: errorData.context,
  };

  // In production, send to your logging service (Winston, Pino, etc.)
  console.log("[Structured Error Log]:", JSON.stringify(logEntry));

  // Example integrations:
  // - Send to Elasticsearch/ELK stack
  // - Send to Datadog, New Relic, etc.
  // - Store in database for analytics
  // - Send to centralized logging service
}
