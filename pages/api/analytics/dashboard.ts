import type { NextApiRequest, NextApiResponse } from "next";
import { userBehaviorAnalytics } from "@/lib/analytics/user-behavior";
import { getAdminAuth } from "@/lib/firebase-admin";
import { z } from "zod";

const DashboardQuerySchema = z.object({
  days: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().min(1).max(365))
    .optional()
    .default("30"),
});

type DashboardResponse = {
  success: boolean;
  metrics?: any;
  error?: string;
  details?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardResponse>,
) {
  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
    });
  }

  try {
    // Verify authentication (admin only)
    const auth = getAdminAuth();
    const idToken = req.headers.authorization?.split("Bearer ")[1];

    if (!idToken) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - No token provided",
      });
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    if (!decodedToken.admin) {
      return res.status(403).json({
        success: false,
        error: "Forbidden - Admin access required",
      });
    }

    // Validate query parameters
    const parseResult = DashboardQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parseResult.error.errors,
      });
    }

    const { days } = parseResult.data;

    // Fetch comprehensive analytics data
    const metrics = await fetchDashboardMetrics(days);

    return res.status(200).json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    console.error("Error fetching dashboard analytics:", error);

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
      error: "Failed to fetch dashboard analytics",
      details: error.message,
    });
  }
}

/**
 * Fetch comprehensive dashboard metrics
 */
async function fetchDashboardMetrics(days: number) {
  // Get overview metrics
  const overview = await userBehaviorAnalytics.getUserBehaviorInsights(days);

  // Get real-time metrics (last 30 minutes)
  const realTime = await fetchRealTimeMetrics();

  // Get content performance
  const content = await fetchContentMetrics(days);

  // Get user demographics and behavior
  const user = await fetchUserMetrics(days);

  // Get performance metrics
  const performance = await fetchPerformanceMetrics(days);

  return {
    overview,
    realTime,
    content,
    user,
    performance,
    generatedAt: new Date().toISOString(),
    period: `${days} days`,
  };
}

/**
 * Fetch real-time metrics (last 30 minutes)
 */
async function fetchRealTimeMetrics() {
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

  const analytics = userBehaviorAnalytics as any;
  const db = analytics.db;

  try {
    // Active sessions (sessions with activity in last 30 minutes)
    const activeSessionsQuery = await db
      .collection("analytics_sessions")
      .where("updatedAt", ">=", thirtyMinutesAgo)
      .get();

    const activeSessions = activeSessionsQuery.docs.map((doc: any) =>
      doc.data(),
    );
    const activeUsers = new Set(
      activeSessions.filter((s: any) => s.userId).map((s: any) => s.userId),
    ).size;

    // Current page views (last 30 minutes)
    const pageViewsQuery = await db
      .collection("analytics_events")
      .where("type", "==", "page_view")
      .where("timestamp", ">=", thirtyMinutesAgo)
      .get();

    const currentPageViews = pageViewsQuery.size;

    // Top pages (last 30 minutes)
    const pageViews = pageViewsQuery.docs.map((doc: any) => doc.data());
    const pageViewCounts: Record<string, number> = {};

    pageViews.forEach((pv: any) => {
      pageViewCounts[pv.page] = (pageViewCounts[pv.page] || 0) + 1;
    });

    const topPages = Object.entries(pageViewCounts)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Recent events (last 10 minutes)
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const recentEventsQuery = await db
      .collection("analytics_events")
      .where("timestamp", ">=", tenMinutesAgo)
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();

    const recentEvents = recentEventsQuery.docs.map((doc: any) => {
      const data = doc.data();
      return {
        type: data.type,
        page: data.page,
        timestamp: data.timestamp.toDate().toISOString(),
      };
    });

    return {
      activeUsers,
      currentPageViews,
      topPages,
      recentEvents,
    };
  } catch (error) {
    console.error("Error fetching real-time metrics:", error);
    return {
      activeUsers: 0,
      currentPageViews: 0,
      topPages: [],
      recentEvents: [],
    };
  }
}

/**
 * Fetch content performance metrics
 */
async function fetchContentMetrics(days: number) {
  const analytics = userBehaviorAnalytics as any;
  const db = analytics.db;

  try {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get content analytics documents
    const contentQuery = await db
      .collection("analytics_content")
      .where("analyzedAt", ">=", startDate)
      .orderBy("popularityScore", "desc")
      .limit(10)
      .get();

    const contentAnalytics = contentQuery.docs.map((doc: any) => doc.data());

    // Transform to dashboard format
    const topContent = contentAnalytics.map((content: any) => ({
      contentId: content.contentId,
      title: content.contentId, // Would normally fetch actual title
      views: content.views,
      engagement: content.scrollDepth,
      conversionRate: content.conversionRate * 100,
    }));

    // Content performance over time (placeholder)
    const contentPerformance = {
      // Would contain time-series data for charts
      dailyViews: [],
      engagementTrends: [],
      conversionFunnels: [],
    };

    return {
      topContent,
      contentPerformance,
    };
  } catch (error) {
    console.error("Error fetching content metrics:", error);
    return {
      topContent: [],
      contentPerformance: {},
    };
  }
}

/**
 * Fetch user behavior and demographics metrics
 */
async function fetchUserMetrics(days: number) {
  const analytics = userBehaviorAnalytics as any;
  const db = analytics.db;

  try {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get sessions for analysis
    const sessionsQuery = await db
      .collection("analytics_sessions")
      .where("startTime", ">=", startDate)
      .get();

    const sessions = sessionsQuery.docs.map((doc: any) => doc.data());

    // Device breakdown
    const deviceBreakdown: Record<string, number> = {};
    sessions.forEach((session: any) => {
      if (session.device?.type) {
        deviceBreakdown[session.device.type] =
          (deviceBreakdown[session.device.type] || 0) + 1;
      }
    });

    // Location data (simplified)
    const locationData: Record<string, number> = {};
    sessions.forEach((session: any) => {
      if (session.location?.country) {
        locationData[session.location.country] =
          (locationData[session.location.country] || 0) + 1;
      }
    });

    // Add fallback data if no location data
    if (Object.keys(locationData).length === 0) {
      locationData["Unknown"] = sessions.length;
    }

    // Get engagement metrics
    const engagementQuery = await db
      .collection("analytics_engagement")
      .where("calculatedAt", ">=", startDate)
      .get();

    const engagementMetrics = engagementQuery.docs.map((doc: any) =>
      doc.data(),
    );

    // Engagement segments
    const engagementSegments: Record<string, number> = {
      high_engagement: 0,
      medium_engagement: 0,
      low_engagement: 0,
    };

    engagementMetrics.forEach((metric: any) => {
      if (metric.engagementScore >= 70) {
        engagementSegments.high_engagement++;
      } else if (metric.engagementScore >= 40) {
        engagementSegments.medium_engagement++;
      } else {
        engagementSegments.low_engagement++;
      }
    });

    // User journeys (simplified)
    const journeysQuery = await db
      .collection("analytics_journeys")
      .where("analyzedAt", ">=", startDate)
      .limit(10)
      .get();

    const userJourneys = journeysQuery.docs.map((doc: any) => {
      const data = doc.data();
      return {
        sessionId: data.sessionId,
        steps: data.steps?.length || 0,
        duration: data.totalDuration,
        conversionGoals: data.conversionGoals?.length || 0,
      };
    });

    return {
      deviceBreakdown,
      locationData,
      userJourneys,
      engagementSegments,
    };
  } catch (error) {
    console.error("Error fetching user metrics:", error);
    return {
      deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
      locationData: { Unknown: 0 },
      userJourneys: [],
      engagementSegments: {
        high_engagement: 0,
        medium_engagement: 0,
        low_engagement: 0,
      },
    };
  }
}

/**
 * Fetch performance metrics
 */
async function fetchPerformanceMetrics(days: number) {
  const analytics = userBehaviorAnalytics as any;
  const db = analytics.db;

  try {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get performance events
    const performanceQuery = await db
      .collection("analytics_events")
      .where("type", "==", "performance")
      .where("timestamp", ">=", startDate)
      .get();

    const performanceEvents = performanceQuery.docs.map((doc: any) =>
      doc.data(),
    );

    // Calculate Core Web Vitals averages
    let totalFCP = 0,
      totalLCP = 0,
      totalFID = 0,
      totalCLS = 0;
    let fcp_count = 0,
      lcp_count = 0,
      fid_count = 0,
      cls_count = 0;

    performanceEvents.forEach((event: any) => {
      const metadata = event.metadata || {};

      if (metadata.firstContentfulPaint) {
        totalFCP += metadata.firstContentfulPaint;
        fcp_count++;
      }
      if (metadata.largestContentfulPaint) {
        totalLCP += metadata.largestContentfulPaint;
        lcp_count++;
      }
      if (metadata.firstInputDelay) {
        totalFID += metadata.firstInputDelay;
        fid_count++;
      }
      if (metadata.cumulativeLayoutShift) {
        totalCLS += metadata.cumulativeLayoutShift;
        cls_count++;
      }
    });

    const coreWebVitals = {
      fcp: fcp_count > 0 ? totalFCP / fcp_count : 0,
      lcp: lcp_count > 0 ? totalLCP / lcp_count : 0,
      fid: fid_count > 0 ? totalFID / fid_count : 0,
      cls: cls_count > 0 ? totalCLS / cls_count : 0,
    };

    // Page load times by page
    const pageLoadTimes: Record<string, { total: number; count: number }> = {};

    performanceEvents.forEach((event: any) => {
      if (event.metadata?.loadTime) {
        const page = event.page;
        if (!pageLoadTimes[page]) {
          pageLoadTimes[page] = { total: 0, count: 0 };
        }
        pageLoadTimes[page].total += event.metadata.loadTime;
        pageLoadTimes[page].count++;
      }
    });

    const pageLoadTimesArray = Object.entries(pageLoadTimes)
      .map(([page, data]) => ({
        page,
        averageTime: data.total / data.count,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    // Error rates (simplified)
    const errorQuery = await db
      .collection("analytics_events")
      .where("type", "==", "error")
      .where("timestamp", ">=", startDate)
      .get();

    const totalEvents = await db
      .collection("analytics_events")
      .where("timestamp", ">=", startDate)
      .get();

    const errorRates = {
      javascript_errors: errorQuery.size / Math.max(totalEvents.size, 1),
      network_errors: 0, // Would calculate from specific error types
      performance_errors: 0, // Would calculate from performance thresholds
    };

    return {
      coreWebVitals,
      pageLoadTimes: pageLoadTimesArray,
      errorRates,
    };
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    return {
      coreWebVitals: { fcp: 0, lcp: 0, fid: 0, cls: 0 },
      pageLoadTimes: [],
      errorRates: {
        javascript_errors: 0,
        network_errors: 0,
        performance_errors: 0,
      },
    };
  }
}
