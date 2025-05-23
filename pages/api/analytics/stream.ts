import type { NextApiRequest, NextApiResponse } from "next";
import { realTimeAnalyticsStream } from "@/lib/analytics/real-time-stream";
import { getAdminAuth } from "@/lib/firebase-admin";
import { z } from "zod";

// Validation schema for stream filters
const StreamFilterSchema = z.object({
  type: z.enum(["event_type", "category", "user_id", "session_id", "metric"]),
  operator: z.enum(["equals", "contains", "in", "greater_than", "less_than"]),
  value: z.union([z.string(), z.array(z.string()), z.number()]),
});

const StreamRequestSchema = z.object({
  filters: z.array(StreamFilterSchema).optional().default([]),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow GET method for SSE
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
    });
  }

  try {
    // Verify authentication (admin only)
    const auth = getAdminAuth();
    const authHeader = req.headers.authorization?.split("Bearer ")[1];
    const token = authHeader || (req.query.token as string);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - No token provided",
      });
    }

    const decodedToken = await auth.verifyIdToken(token);
    if (!decodedToken.admin) {
      return res.status(403).json({
        success: false,
        error: "Forbidden - Admin access required",
      });
    }

    // Parse and validate filters from query params
    let filters: any[] = [];
    if (req.query.filters) {
      try {
        const parsedFilters = JSON.parse(req.query.filters as string);
        const validationResult = z
          .array(StreamFilterSchema)
          .safeParse(parsedFilters);

        if (validationResult.success) {
          filters = validationResult.data;
        } else {
          console.warn(
            "Invalid stream filters provided:",
            validationResult.error,
          );
        }
      } catch (error) {
        console.warn("Failed to parse stream filters:", error);
      }
    }

    // Generate client ID
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create SSE subscription
    const subscriptionId = realTimeAnalyticsStream.createSubscription(
      clientId,
      res,
      filters,
    );

    console.log(
      `Real-time analytics stream started for client: ${clientId}, subscription: ${subscriptionId}`,
    );

    // Handle client disconnect
    req.on("close", () => {
      realTimeAnalyticsStream.closeSubscription(subscriptionId);
      console.log(`Client disconnected: ${clientId}`);
    });

    req.on("error", (error) => {
      console.error(`Stream error for client ${clientId}:`, error);
      realTimeAnalyticsStream.closeSubscription(subscriptionId);
    });
  } catch (error: any) {
    console.error("Error setting up analytics stream:", error);

    // Handle specific auth errors
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - Token expired",
      });
    }

    if (error.code?.startsWith("auth/")) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - Invalid token",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to set up analytics stream",
      details: error.message,
    });
  }
}

// Configure API route to disable default timeout for SSE
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: "1mb",
    },
    // Disable default timeout for SSE connections
    externalResolver: true,
  },
};
