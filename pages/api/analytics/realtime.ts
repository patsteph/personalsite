import type { NextApiRequest, NextApiResponse } from "next";
import { userBehaviorAnalytics } from "@/lib/analytics/user-behavior";
import { getAdminAuth } from "@/lib/firebase-admin";

type RealTimeResponse = {
  success: boolean;
  realTime?: any;
  error?: string;
  details?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RealTimeResponse>,
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

    // Fetch real-time analytics data
    const realTime = await fetchRealTimeData();

    return res.status(200).json({
      success: true,
      realTime,
    });
  } catch (error: any) {
    console.error("Error fetching real-time analytics:", error);

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
      error: "Failed to fetch real-time analytics",
      details: error.message,
    });
  }
}

/**
 * Fetch real-time analytics data (last 30 minutes)
 */
async function fetchRealTimeData() {
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const analytics = userBehaviorAnalytics as any;
  const db = analytics.db;

  try {
    // Active users (sessions with activity in last 5 minutes)
    const activeSessionsQuery = await db
      .collection("analytics_sessions")
      .where("updatedAt", ">=", fiveMinutesAgo)
      .get();

    const activeSessions = activeSessionsQuery.docs.map((doc: any) =>
      doc.data(),
    );
    const activeUsers = activeSessions.length;

    // Current page views (last 30 minutes)
    const pageViewsQuery = await db
      .collection("analytics_events")
      .where("type", "==", "page_view")
      .where("timestamp", ">=", thirtyMinutesAgo)
      .get();

    const currentPageViews = pageViewsQuery.size;

    // Top pages in real-time (last 30 minutes)
    const pageViews = pageViewsQuery.docs.map((doc: any) => doc.data());
    const pageViewCounts: Record<string, number> = {};

    pageViews.forEach((pv: any) => {
      const page = pv.page || "unknown";
      pageViewCounts[page] = (pageViewCounts[page] || 0) + 1;
    });

    const topPages = Object.entries(pageViewCounts)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Recent events (last 10 minutes for real-time feel)
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const recentEventsQuery = await db
      .collection("analytics_events")
      .where("timestamp", ">=", tenMinutesAgo)
      .orderBy("timestamp", "desc")
      .limit(25)
      .get();

    const recentEvents = recentEventsQuery.docs.map((doc: any) => {
      const data = doc.data();
      return {
        type: data.type || "unknown",
        page: data.page || "unknown",
        timestamp: data.timestamp
          ? data.timestamp.toDate().toISOString()
          : new Date().toISOString(),
        action: data.action || "",
        category: data.category || "",
      };
    });

    // Active pages (pages with activity in last 5 minutes)
    const activePageEventsQuery = await db
      .collection("analytics_events")
      .where("timestamp", ">=", fiveMinutesAgo)
      .get();

    const activePageEvents = activePageEventsQuery.docs.map((doc: any) =>
      doc.data(),
    );
    const activePageCounts: Record<string, number> = {};

    activePageEvents.forEach((event: any) => {
      const page = event.page || "unknown";
      activePageCounts[page] = (activePageCounts[page] || 0) + 1;
    });

    const activePages = Object.entries(activePageCounts)
      .map(([page, activity]) => ({ page, activity }))
      .sort((a, b) => b.activity - a.activity)
      .slice(0, 3);

    // Real-time metrics summary
    const realTimeMetrics = {
      activeUsers,
      currentPageViews,
      topPages,
      recentEvents,
      activePages,
      timestamp: now.toISOString(),

      // Additional real-time insights
      insights: {
        mostActiveMinute: await getMostActiveMinute(),
        topEventTypes: await getTopEventTypes(tenMinutesAgo),
        deviceBreakdown: await getCurrentDeviceBreakdown(fiveMinutesAgo),
        trafficSources: await getCurrentTrafficSources(thirtyMinutesAgo),
      },
    };

    return realTimeMetrics;
  } catch (error) {
    console.error("Error fetching real-time data:", error);

    // Return fallback data
    return {
      activeUsers: 0,
      currentPageViews: 0,
      topPages: [],
      recentEvents: [],
      activePages: [],
      timestamp: now.toISOString(),
      insights: {
        mostActiveMinute: { minute: now.toISOString(), events: 0 },
        topEventTypes: [],
        deviceBreakdown: {},
        trafficSources: {},
      },
    };
  }
}

/**
 * Get the most active minute in the last hour
 */
async function getMostActiveMinute() {
  const analytics = userBehaviorAnalytics as any;
  const db = analytics.db;

  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const eventsQuery = await db
      .collection("analytics_events")
      .where("timestamp", ">=", oneHourAgo)
      .get();

    const events = eventsQuery.docs.map((doc: any) => doc.data());
    const minuteCounts: Record<string, number> = {};

    events.forEach((event: any) => {
      if (event.timestamp) {
        const minute = new Date(event.timestamp.toDate())
          .toISOString()
          .slice(0, 16); // YYYY-MM-DDTHH:mm
        minuteCounts[minute] = (minuteCounts[minute] || 0) + 1;
      }
    });

    const mostActiveMinute = Object.entries(minuteCounts).sort(
      ([, a], [, b]) => b - a,
    )[0];

    return mostActiveMinute
      ? {
          minute: mostActiveMinute[0],
          events: mostActiveMinute[1],
        }
      : {
          minute: now.toISOString().slice(0, 16),
          events: 0,
        };
  } catch (error) {
    console.error("Error getting most active minute:", error);
    return {
      minute: new Date().toISOString().slice(0, 16),
      events: 0,
    };
  }
}

/**
 * Get top event types in the specified time period
 */
async function getTopEventTypes(since: Date) {
  const analytics = userBehaviorAnalytics as any;
  const db = analytics.db;

  try {
    const eventsQuery = await db
      .collection("analytics_events")
      .where("timestamp", ">=", since)
      .get();

    const events = eventsQuery.docs.map((doc: any) => doc.data());
    const eventTypeCounts: Record<string, number> = {};

    events.forEach((event: any) => {
      const type = event.type || "unknown";
      eventTypeCounts[type] = (eventTypeCounts[type] || 0) + 1;
    });

    return Object.entries(eventTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  } catch (error) {
    console.error("Error getting top event types:", error);
    return [];
  }
}

/**
 * Get current device breakdown from active sessions
 */
async function getCurrentDeviceBreakdown(since: Date) {
  const analytics = userBehaviorAnalytics as any;
  const db = analytics.db;

  try {
    const sessionsQuery = await db
      .collection("analytics_sessions")
      .where("updatedAt", ">=", since)
      .get();

    const sessions = sessionsQuery.docs.map((doc: any) => doc.data());
    const deviceCounts: Record<string, number> = {};

    sessions.forEach((session: any) => {
      const deviceType = session.device?.type || "unknown";
      deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;
    });

    return deviceCounts;
  } catch (error) {
    console.error("Error getting device breakdown:", error);
    return {};
  }
}

/**
 * Get current traffic sources
 */
async function getCurrentTrafficSources(since: Date) {
  const analytics = userBehaviorAnalytics as any;
  const db = analytics.db;

  try {
    const sessionsQuery = await db
      .collection("analytics_sessions")
      .where("startTime", ">=", since)
      .get();

    const sessions = sessionsQuery.docs.map((doc: any) => doc.data());
    const sourceCounts: Record<string, number> = {};

    sessions.forEach((session: any) => {
      let source = "direct";

      if (session.referrer) {
        const referrer = session.referrer;
        if (referrer.includes("google")) source = "google";
        else if (referrer.includes("facebook")) source = "facebook";
        else if (referrer.includes("twitter")) source = "twitter";
        else if (referrer.includes("linkedin")) source = "linkedin";
        else source = "referral";
      }

      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    return sourceCounts;
  } catch (error) {
    console.error("Error getting traffic sources:", error);
    return {};
  }
}
