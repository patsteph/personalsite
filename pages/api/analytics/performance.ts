import type { NextApiRequest, NextApiResponse } from "next";

interface PerformanceData {
  metric: {
    name: string;
    value: number;
    rating: "good" | "needs-improvement" | "poor";
    timestamp: number;
  };
  url: string;
  userAgent: string;
  timestamp: number;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
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
    const data: PerformanceData = req.body;

    // Validate the data
    if (
      !data.metric ||
      !data.metric.name ||
      typeof data.metric.value !== "number"
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid performance data",
      });
    }

    // In development, just log the data
    if (process.env.NODE_ENV === "development") {
      console.log("[Performance API] Received metric:", {
        name: data.metric.name,
        value: data.metric.value,
        rating: data.metric.rating,
        url: data.url,
        timestamp: new Date(data.timestamp).toISOString(),
      });
    }

    // In production, you would typically:
    // 1. Store in database (Firebase, MongoDB, etc.)
    // 2. Send to analytics service (Google Analytics, etc.)
    // 3. Aggregate for dashboards

    // For now, we'll just acknowledge receipt
    res.status(200).json({
      success: true,
      message: "Performance metric recorded",
    });
  } catch (error) {
    console.error("[Performance API] Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
