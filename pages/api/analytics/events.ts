import type { NextApiRequest, NextApiResponse } from "next";
import { userBehaviorAnalytics } from "@/lib/analytics/user-behavior";
import { InputValidator } from "@/lib/security/input-validation";
import { z } from "zod";

// Validation schema for analytics events
const AnalyticsEventSchema = z.object({
  sessionId: z.string().min(1).max(128),
  type: z.enum([
    "page_view",
    "click",
    "scroll",
    "form_submit",
    "download",
    "video_play",
    "video_pause",
    "search",
    "social_share",
    "blog_reaction",
    "book_interaction",
    "cv_download",
    "feedback_submit",
    "session_start",
    "session_end",
    "error",
    "performance",
  ]),
  category: z.string().min(1).max(50),
  action: z.string().min(1).max(100),
  label: z.string().max(200).optional(),
  value: z.number().min(0).max(999999).optional(),
  metadata: z.record(z.any()).optional(),
  page: z.string().min(1).max(500),
  scrollDepth: z.number().min(0).max(100).optional(),
  timeOnPage: z.number().min(0).optional(),
});

const AnalyticsRequestSchema = z.object({
  events: z.array(AnalyticsEventSchema).min(1).max(50),
});

type AnalyticsResponse = {
  success: boolean;
  processed?: number;
  error?: string;
  details?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyticsResponse>,
) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
    });
  }

  try {
    // Validate request data
    const parseResult = AnalyticsRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid analytics data",
        details: parseResult.error.errors,
      });
    }

    const { events } = parseResult.data;

    // Additional input validation and sanitization
    const validator = InputValidator.getInstance();

    // Validate each event
    for (const event of events) {
      // Validate session ID
      const sessionValidation = validator.validateField(
        event.sessionId,
        {
          required: true,
          type: "string",
          pattern: /^[a-zA-Z0-9_-]+$/,
          maxLength: 128,
        },
        "sessionId",
      );

      if (!sessionValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: "Session ID validation failed",
          details: sessionValidation.errors,
        });
      }

      // Validate page URL
      const pageValidation = validator.validateField(
        event.page,
        {
          required: true,
          type: "string",
          maxLength: 500,
          sanitize: true,
        },
        "page",
      );

      if (!pageValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: "Page validation failed",
          details: pageValidation.errors,
        });
      }

      // Sanitize metadata
      if (event.metadata) {
        const metadataValidation = validator.validateObject(event.metadata, {});
        if (metadataValidation.isValid) {
          event.metadata = metadataValidation.sanitized;
        }
      }
    }

    // Process events
    const processedEvents: string[] = [];

    for (const event of events) {
      try {
        // Add request metadata
        const enrichedEvent = {
          ...event,
          metadata: {
            ...event.metadata,
            ip: getClientIP(req),
            userAgent: req.headers["user-agent"],
            timestamp: new Date().toISOString(),
            origin: req.headers.origin || req.headers.referer,
          },
        };

        // Track the event
        const eventId = await userBehaviorAnalytics.trackEvent(enrichedEvent);
        processedEvents.push(eventId);

        // Handle special event types
        await handleSpecialEvents(enrichedEvent);
      } catch (eventError: any) {
        console.error("Error processing individual event:", eventError);
        // Continue processing other events
      }
    }

    // Return success response
    return res.status(200).json({
      success: true,
      processed: processedEvents.length,
    });
  } catch (error: any) {
    console.error("Error processing analytics events:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to process analytics events",
      details: error.message,
    });
  }
}

/**
 * Handle special event types that require additional processing
 */
async function handleSpecialEvents(event: any): Promise<void> {
  switch (event.type) {
    case "session_start":
      await handleSessionStart(event);
      break;
    case "session_end":
      await handleSessionEnd(event);
      break;
    case "error":
      await handleErrorEvent(event);
      break;
    case "performance":
      await handlePerformanceEvent(event);
      break;
    case "blog_reaction":
      await handleBlogReaction(event);
      break;
    case "book_interaction":
      await handleBookInteraction(event);
      break;
    default:
      // No special handling needed
      break;
  }
}

/**
 * Handle session start events
 */
async function handleSessionStart(event: any): Promise<void> {
  try {
    const sessionData = {
      sessionId: event.sessionId,
      userId: event.metadata?.userId,
      startTime: new Date(),
      device: event.metadata?.device || {},
      location: event.metadata?.location || {},
      referrer: event.metadata?.referrer,
      userAgent: event.metadata?.userAgent,
    };

    await userBehaviorAnalytics.startSession(sessionData);
  } catch (error) {
    console.error("Error handling session start:", error);
  }
}

/**
 * Handle session end events
 */
async function handleSessionEnd(event: any): Promise<void> {
  try {
    await userBehaviorAnalytics.endSession(event.sessionId);

    // Generate user journey analysis
    await userBehaviorAnalytics.generateUserJourney(event.sessionId);
  } catch (error) {
    console.error("Error handling session end:", error);
  }
}

/**
 * Handle error events
 */
async function handleErrorEvent(event: any): Promise<void> {
  try {
    // Log error to monitoring system
    console.error("Client-side error tracked:", {
      sessionId: event.sessionId,
      error: event.metadata?.error,
      context: event.metadata?.context,
      url: event.metadata?.url,
      userAgent: event.metadata?.userAgent,
    });

    // Could integrate with error monitoring service (Sentry, etc.)
    // await errorMonitoringService.captureException(event.metadata?.error);
  } catch (error) {
    console.error("Error handling error event:", error);
  }
}

/**
 * Handle performance events
 */
async function handlePerformanceEvent(event: any): Promise<void> {
  try {
    // Store performance metrics for analysis
    const performanceData = {
      sessionId: event.sessionId,
      page: event.page,
      metrics: event.metadata,
      timestamp: new Date(),
    };

    // Could store in dedicated performance collection
    // await performanceAnalytics.recordMetrics(performanceData);
  } catch (error) {
    console.error("Error handling performance event:", error);
  }
}

/**
 * Handle blog reaction events
 */
async function handleBlogReaction(event: any): Promise<void> {
  try {
    // Update blog post reaction counts in real-time
    const { postId, reactionType } = event.metadata || {};

    if (postId && reactionType) {
      // Could update blog post metrics directly
      // await blogAnalytics.updateReactionCount(postId, reactionType);
    }
  } catch (error) {
    console.error("Error handling blog reaction:", error);
  }
}

/**
 * Handle book interaction events
 */
async function handleBookInteraction(event: any): Promise<void> {
  try {
    // Track book engagement for recommendation algorithm
    const { bookId, action } = event.metadata || {};

    if (bookId && action) {
      // Could feed into recommendation engine
      // await bookRecommendationEngine.trackInteraction(bookId, action, event.sessionId);
    }
  } catch (error) {
    console.error("Error handling book interaction:", error);
  }
}

/**
 * Get client IP address from request
 */
function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"] as string;
  const realIP = req.headers["x-real-ip"] as string;

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return req.socket.remoteAddress || "unknown";
}
