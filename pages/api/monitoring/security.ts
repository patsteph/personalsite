import type { NextApiRequest, NextApiResponse } from "next";
import SecurityMiddleware from "@/lib/security/security-middleware";

interface SecurityEvent {
  type:
    | "auth_failure"
    | "rate_limit"
    | "suspicious_request"
    | "unauthorized_access";
  ip: string;
  userAgent: string;
  path: string;
  timestamp: string;
  details?: Record<string, any>;
}

interface SecurityStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  topIPs: Array<{ ip: string; count: number }>;
  recentEvents: SecurityEvent[];
  blockedIPs: string[];
  threats: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
}

interface ApiResponse {
  success: boolean;
  data?: SecurityStats;
  message?: string;
  error?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method === "POST") {
    return handleSecurityEvent(req, res);
  } else if (req.method === "GET") {
    return getSecurityStats(req, res);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed",
    });
  }
}

/**
 * Handle incoming security event
 */
function handleSecurityEvent(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  try {
    const event: SecurityEvent = req.body;

    // Validate event data
    if (!event.type || !event.ip || !event.timestamp) {
      return res.status(400).json({
        success: false,
        error: "Invalid security event data",
      });
    }

    // Log the security event
    console.warn("[Security Event]", {
      type: event.type,
      ip: event.ip,
      path: event.path,
      timestamp: event.timestamp,
      userAgent: event.userAgent,
      details: event.details,
    });

    // Determine threat level
    const threatLevel = getThreatLevel(event);

    // In production, you would:
    // 1. Store in database for analysis
    // 2. Send alerts for high-risk events
    // 3. Update IP reputation systems
    // 4. Trigger automated responses

    if (threatLevel === "high") {
      handleHighRiskEvent(event);
    }

    res.status(200).json({
      success: true,
      message: "Security event logged",
    });
  } catch (error) {
    console.error("[Security API] Error processing security event:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * Get security statistics
 */
function getSecurityStats(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  try {
    const securityMiddleware = SecurityMiddleware.getInstance();
    const events = securityMiddleware.getSecurityEvents();
    const blockedIPs = securityMiddleware.getBlockedIPs();

    // Analyze events
    const eventsByType: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};
    let highRisk = 0;
    let mediumRisk = 0;
    let lowRisk = 0;

    events.forEach((event) => {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;

      // Count by IP
      ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;

      // Count by risk level
      const risk = getThreatLevel(event);
      if (risk === "high") highRisk++;
      else if (risk === "medium") mediumRisk++;
      else lowRisk++;
    });

    // Get top IPs
    const topIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    // Get recent events (last 50)
    const recentEvents = events.slice(-50).reverse();

    const stats: SecurityStats = {
      totalEvents: events.length,
      eventsByType,
      topIPs,
      recentEvents,
      blockedIPs,
      threats: {
        highRisk,
        mediumRisk,
        lowRisk,
      },
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("[Security API] Error getting security stats:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * Determine threat level of security event
 */
function getThreatLevel(event: SecurityEvent): "low" | "medium" | "high" {
  switch (event.type) {
    case "auth_failure":
      // Multiple auth failures from same IP = high risk
      return event.details?.attemptCount > 3 ? "high" : "medium";

    case "rate_limit":
      // Rate limiting is usually medium risk
      return "medium";

    case "suspicious_request":
      // Depends on the pattern detected
      if (
        event.details?.reason?.includes("injection") ||
        event.details?.reason?.includes("script")
      ) {
        return "high";
      }
      return "medium";

    case "unauthorized_access":
      // Unauthorized access to admin = high risk
      if (
        event.path?.includes("/admin") ||
        event.path?.includes("/api/admin")
      ) {
        return "high";
      }
      return "medium";

    default:
      return "low";
  }
}

/**
 * Handle high-risk security events
 */
function handleHighRiskEvent(event: SecurityEvent): void {
  console.error("🚨 HIGH RISK SECURITY EVENT:", event);

  // In production, you would:
  // 1. Send immediate alerts (email, Slack, PagerDuty)
  // 2. Auto-block the IP
  // 3. Create incident ticket
  // 4. Notify security team

  // Example: Auto-block IP for certain events
  if (
    event.type === "suspicious_request" &&
    event.details?.reason?.includes("injection")
  ) {
    const securityMiddleware = SecurityMiddleware.getInstance();
    securityMiddleware.blockIP(event.ip);
    console.warn(`Auto-blocked IP ${event.ip} due to injection attempt`);
  }
}
