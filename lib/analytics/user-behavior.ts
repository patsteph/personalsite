/**
 * Advanced User Behavior Analytics
 *
 * Comprehensive user behavior tracking and analysis system
 * including session analysis, user journey mapping, and engagement metrics.
 */

import { getAdminFirestore } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  bounceRate: boolean;
  referrer?: string;
  userAgent?: string;
  device: DeviceInfo;
  location?: LocationInfo;
  events: UserEvent[];
}

export interface UserEvent {
  eventId: string;
  sessionId: string;
  timestamp: Date;
  type: EventType;
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  page: string;
  scrollDepth?: number;
  timeOnPage?: number;
}

export interface DeviceInfo {
  type: "desktop" | "tablet" | "mobile";
  os: string;
  browser: string;
  screenResolution: string;
  viewport: string;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
}

export type EventType =
  | "page_view"
  | "click"
  | "scroll"
  | "form_submit"
  | "download"
  | "video_play"
  | "video_pause"
  | "search"
  | "social_share"
  | "blog_reaction"
  | "book_interaction"
  | "cv_download"
  | "feedback_submit"
  | "session_start"
  | "session_end"
  | "error"
  | "performance";

export interface UserJourney {
  userId?: string;
  sessionId: string;
  steps: JourneyStep[];
  totalDuration: number;
  conversionGoals: string[];
  exitPage: string;
  entryPage: string;
}

export interface JourneyStep {
  page: string;
  timestamp: Date;
  duration: number;
  actions: UserEvent[];
  exitRate?: number;
}

export interface EngagementMetrics {
  sessionDuration: number;
  pageDepth: number;
  scrollDepth: number;
  interactionRate: number;
  bounceRate: number;
  returnVisitor: boolean;
  engagementScore: number;
}

export interface ContentAnalytics {
  contentId: string;
  contentType: "blog" | "page" | "book" | "cv" | "signal";
  views: number;
  uniqueViews: number;
  averageTimeOnContent: number;
  scrollDepth: number;
  shareCount: number;
  reactions: Record<string, number>;
  exitRate: number;
  conversionRate: number;
  popularityScore: number;
}

export class UserBehaviorAnalytics {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getAdminFirestore();
  }

  /**
   * Track user event with comprehensive metadata
   */
  async trackEvent(
    event: Omit<UserEvent, "eventId" | "timestamp">,
  ): Promise<string> {
    const eventId = this.generateEventId();
    const timestamp = new Date();

    const eventData: UserEvent = {
      ...event,
      eventId,
      timestamp,
    };

    // Store event in Firestore
    await this.db
      .collection("analytics_events")
      .doc(eventId)
      .set({
        ...eventData,
        timestamp: Timestamp.fromDate(timestamp),
      });

    // Update session data
    await this.updateSession(event.sessionId, eventData);

    // Trigger real-time analytics processing
    await this.processRealTimeAnalytics(eventData);

    return eventId;
  }

  /**
   * Start or update user session
   */
  async startSession(
    sessionData: Omit<UserSession, "events" | "pageViews" | "bounceRate">,
  ): Promise<void> {
    const sessionDoc = this.db
      .collection("analytics_sessions")
      .doc(sessionData.sessionId);

    await sessionDoc.set(
      {
        ...sessionData,
        startTime: Timestamp.fromDate(sessionData.startTime),
        endTime: sessionData.endTime
          ? Timestamp.fromDate(sessionData.endTime)
          : null,
        pageViews: 0,
        bounceRate: false,
        events: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
  }

  /**
   * End user session and calculate metrics
   */
  async endSession(sessionId: string): Promise<UserSession> {
    const sessionDoc = this.db.collection("analytics_sessions").doc(sessionId);
    const session = await sessionDoc.get();

    if (!session.exists) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const sessionData = session.data() as any;
    const endTime = new Date();
    const duration =
      endTime.getTime() - sessionData.startTime.toDate().getTime();

    // Calculate bounce rate (single page visit < 30 seconds)
    const bounceRate = sessionData.pageViews <= 1 && duration < 30000;

    const updatedSession = {
      ...sessionData,
      endTime,
      duration,
      bounceRate,
      updatedAt: Timestamp.now(),
    };

    await sessionDoc.update({
      endTime: Timestamp.fromDate(endTime),
      duration,
      bounceRate,
      updatedAt: Timestamp.now(),
    });

    // Generate engagement metrics
    await this.calculateEngagementMetrics(sessionId);

    return updatedSession;
  }

  /**
   * Update session with new event
   */
  private async updateSession(
    sessionId: string,
    event: UserEvent,
  ): Promise<void> {
    const sessionDoc = this.db.collection("analytics_sessions").doc(sessionId);

    await this.db.runTransaction(async (transaction) => {
      const session = await transaction.get(sessionDoc);

      if (session.exists) {
        const sessionData = session.data() as any;
        const pageViews =
          event.type === "page_view"
            ? sessionData.pageViews + 1
            : sessionData.pageViews;

        transaction.update(sessionDoc, {
          pageViews,
          updatedAt: Timestamp.now(),
        });
      }
    });
  }

  /**
   * Calculate comprehensive engagement metrics
   */
  async calculateEngagementMetrics(
    sessionId: string,
  ): Promise<EngagementMetrics> {
    const session = await this.db
      .collection("analytics_sessions")
      .doc(sessionId)
      .get();
    if (!session.exists) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const sessionData = session.data() as any;

    // Get all events for this session
    const eventsQuery = await this.db
      .collection("analytics_events")
      .where("sessionId", "==", sessionId)
      .orderBy("timestamp", "asc")
      .get();

    const events = eventsQuery.docs.map((doc) => doc.data());

    // Calculate metrics
    const sessionDuration = sessionData.duration || 0;
    const pageDepth = sessionData.pageViews || 0;
    const scrollEvents = events.filter((e) => e.type === "scroll");
    const scrollDepth =
      scrollEvents.length > 0
        ? Math.max(...scrollEvents.map((e) => e.scrollDepth || 0))
        : 0;

    const interactionEvents = events.filter((e) =>
      [
        "click",
        "form_submit",
        "download",
        "social_share",
        "blog_reaction",
      ].includes(e.type),
    );
    const interactionRate =
      events.length > 0 ? interactionEvents.length / events.length : 0;

    const bounceRate = sessionData.bounceRate || false;
    const returnVisitor = await this.isReturnVisitor(
      sessionData.userId,
      sessionId,
    );

    // Calculate engagement score (0-100)
    const engagementScore = this.calculateEngagementScore({
      sessionDuration,
      pageDepth,
      scrollDepth,
      interactionRate,
      bounceRate: bounceRate ? 1 : 0,
      returnVisitor: returnVisitor ? 1 : 0,
    });

    const metrics: EngagementMetrics = {
      sessionDuration,
      pageDepth,
      scrollDepth,
      interactionRate,
      bounceRate: bounceRate ? 1 : 0,
      returnVisitor,
      engagementScore,
    };

    // Store engagement metrics
    await this.db
      .collection("analytics_engagement")
      .doc(sessionId)
      .set({
        ...metrics,
        sessionId,
        calculatedAt: Timestamp.now(),
      });

    return metrics;
  }

  /**
   * Generate user journey analysis
   */
  async generateUserJourney(sessionId: string): Promise<UserJourney> {
    const session = await this.db
      .collection("analytics_sessions")
      .doc(sessionId)
      .get();
    if (!session.exists) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const sessionData = session.data() as any;

    // Get all page view events for this session
    const pageViewsQuery = await this.db
      .collection("analytics_events")
      .where("sessionId", "==", sessionId)
      .where("type", "==", "page_view")
      .orderBy("timestamp", "asc")
      .get();

    const pageViews = pageViewsQuery.docs.map((doc) => doc.data());

    // Get all events for calculating actions per step
    const allEventsQuery = await this.db
      .collection("analytics_events")
      .where("sessionId", "==", sessionId)
      .orderBy("timestamp", "asc")
      .get();

    const allEvents = allEventsQuery.docs.map((doc) => doc.data());

    // Generate journey steps
    const steps: JourneyStep[] = [];

    for (let i = 0; i < pageViews.length; i++) {
      const currentPage = pageViews[i];
      const nextPage = pageViews[i + 1];

      const stepStart = currentPage.timestamp.toDate();
      const stepEnd = nextPage
        ? nextPage.timestamp.toDate()
        : sessionData.endTime?.toDate() || new Date();
      const duration = stepEnd.getTime() - stepStart.getTime();

      // Get actions during this step
      const stepActions = allEvents
        .filter((event) => {
          const eventTime = event.timestamp.toDate();
          return (
            eventTime >= stepStart &&
            eventTime < stepEnd &&
            event.page === currentPage.page
          );
        })
        .map(
          (event) =>
            ({
              eventId: event.eventId || "unknown",
              sessionId: event.sessionId || sessionId,
              timestamp: event.timestamp.toDate(),
              type: event.type || "unknown",
              category: event.category || "general",
              action: event.action || "unknown",
              label: event.label,
              value: event.value,
              metadata: event.metadata || {},
            }) as UserEvent,
        );

      steps.push({
        page: currentPage.page,
        timestamp: stepStart,
        duration,
        actions: stepActions,
        exitRate: i === pageViews.length - 1 ? 1 : 0,
      });
    }

    const journey: UserJourney = {
      userId: sessionData.userId,
      sessionId,
      steps,
      totalDuration: sessionData.duration || 0,
      conversionGoals: await this.identifyConversionGoals(allEvents),
      exitPage: steps[steps.length - 1]?.page || "",
      entryPage: steps[0]?.page || "",
    };

    // Store journey analysis
    await this.db
      .collection("analytics_journeys")
      .doc(sessionId)
      .set({
        ...journey,
        steps: steps.map((step) => ({
          ...step,
          timestamp: Timestamp.fromDate(step.timestamp),
        })),
        analyzedAt: Timestamp.now(),
      });

    return journey;
  }

  /**
   * Analyze content performance
   */
  async analyzeContentPerformance(
    contentId: string,
    contentType: string,
  ): Promise<ContentAnalytics> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all page view events for this content
    const pageViewsQuery = await this.db
      .collection("analytics_events")
      .where("type", "==", "page_view")
      .where("metadata.contentId", "==", contentId)
      .where("timestamp", ">=", Timestamp.fromDate(thirtyDaysAgo))
      .get();

    const pageViews = pageViewsQuery.docs.map((doc) => doc.data());

    // Get unique visitors
    const uniqueVisitors = new Set(pageViews.map((pv) => pv.sessionId)).size;

    // Get engagement events for this content
    const engagementQuery = await this.db
      .collection("analytics_events")
      .where("metadata.contentId", "==", contentId)
      .where("timestamp", ">=", Timestamp.fromDate(thirtyDaysAgo))
      .get();

    const allEvents = engagementQuery.docs.map((doc) => doc.data());

    // Calculate metrics
    const views = pageViews.length;
    const uniqueViews = uniqueVisitors;

    // Calculate average time on content
    const timeOnContentEvents = allEvents.filter((e) => e.timeOnPage);
    const averageTimeOnContent =
      timeOnContentEvents.length > 0
        ? timeOnContentEvents.reduce((sum, e) => sum + (e.timeOnPage || 0), 0) /
          timeOnContentEvents.length
        : 0;

    // Calculate scroll depth
    const scrollEvents = allEvents.filter((e) => e.type === "scroll");
    const scrollDepth =
      scrollEvents.length > 0
        ? scrollEvents.reduce((sum, e) => sum + (e.scrollDepth || 0), 0) /
          scrollEvents.length
        : 0;

    // Calculate share count
    const shareCount = allEvents.filter(
      (e) => e.type === "social_share",
    ).length;

    // Calculate reactions
    const reactionEvents = allEvents.filter((e) => e.type === "blog_reaction");
    const reactions: Record<string, number> = {};
    reactionEvents.forEach((event) => {
      const reactionType = event.metadata?.reactionType || "like";
      reactions[reactionType] = (reactions[reactionType] || 0) + 1;
    });

    // Calculate exit rate (sessions ending on this page)
    const sessionsEndingHere = await this.db
      .collection("analytics_sessions")
      .where("lastPage", "==", contentId)
      .where("updatedAt", ">=", Timestamp.fromDate(thirtyDaysAgo))
      .get();

    const exitRate = views > 0 ? sessionsEndingHere.size / views : 0;

    // Calculate conversion rate (goal completions after viewing this content)
    const conversionRate = await this.calculateContentConversionRate(
      contentId,
      thirtyDaysAgo,
    );

    // Calculate popularity score (weighted metric)
    const popularityScore = this.calculatePopularityScore({
      views,
      uniqueViews,
      averageTimeOnContent,
      scrollDepth,
      shareCount,
      reactionCount: Object.values(reactions).reduce(
        (sum, count) => sum + count,
        0,
      ),
      exitRate,
    });

    const analytics: ContentAnalytics = {
      contentId,
      contentType: contentType as any,
      views,
      uniqueViews,
      averageTimeOnContent,
      scrollDepth,
      shareCount,
      reactions,
      exitRate,
      conversionRate,
      popularityScore,
    };

    // Store content analytics
    await this.db
      .collection("analytics_content")
      .doc(`${contentId}_${now.getTime()}`)
      .set({
        ...analytics,
        analyzedAt: Timestamp.now(),
        period: "30d",
      });

    return analytics;
  }

  /**
   * Get user behavior insights for dashboard
   */
  async getUserBehaviorInsights(days: number = 30): Promise<any> {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get session statistics
    const sessionsQuery = await this.db
      .collection("analytics_sessions")
      .where("startTime", ">=", Timestamp.fromDate(startDate))
      .get();

    const sessions = sessionsQuery.docs.map((doc) => doc.data());

    // Get engagement metrics
    const engagementQuery = await this.db
      .collection("analytics_engagement")
      .where("calculatedAt", ">=", Timestamp.fromDate(startDate))
      .get();

    const engagementMetrics = engagementQuery.docs.map((doc) => doc.data());

    // Calculate insights
    const totalSessions = sessions.length;
    const uniqueUsers = new Set(
      sessions.filter((s) => s.userId).map((s) => s.userId),
    ).size;
    const averageSessionDuration =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) /
          sessions.length
        : 0;

    const bounceRate =
      sessions.length > 0
        ? sessions.filter((s) => s.bounceRate).length / sessions.length
        : 0;

    const averagePageViews =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.pageViews || 0), 0) /
          sessions.length
        : 0;

    const averageEngagementScore =
      engagementMetrics.length > 0
        ? engagementMetrics.reduce(
            (sum, e) => sum + (e.engagementScore || 0),
            0,
          ) / engagementMetrics.length
        : 0;

    return {
      totalSessions,
      uniqueUsers,
      averageSessionDuration,
      bounceRate,
      averagePageViews,
      averageEngagementScore,
      period: `${days} days`,
      calculatedAt: new Date(),
    };
  }

  // Private helper methods
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async processRealTimeAnalytics(event: UserEvent): Promise<void> {
    // Real-time processing logic (could trigger webhooks, update dashboards, etc.)
    // Implementation depends on real-time analytics requirements
  }

  private async isReturnVisitor(
    userId?: string,
    currentSessionId?: string,
  ): Promise<boolean> {
    if (!userId) return false;

    const previousSessions = await this.db
      .collection("analytics_sessions")
      .where("userId", "==", userId)
      .limit(2)
      .get();

    return previousSessions.size > 1;
  }

  private calculateEngagementScore(factors: {
    sessionDuration: number;
    pageDepth: number;
    scrollDepth: number;
    interactionRate: number;
    bounceRate: number;
    returnVisitor: number;
  }): number {
    // Weighted engagement score calculation (0-100)
    const weights = {
      sessionDuration: 0.25,
      pageDepth: 0.2,
      scrollDepth: 0.15,
      interactionRate: 0.2,
      bounceRate: -0.1,
      returnVisitor: 0.1,
    };

    // Normalize values to 0-1 scale
    const normalized = {
      sessionDuration: Math.min(factors.sessionDuration / 300000, 1), // 5 minutes max
      pageDepth: Math.min(factors.pageDepth / 10, 1), // 10 pages max
      scrollDepth: factors.scrollDepth / 100,
      interactionRate: factors.interactionRate,
      bounceRate: factors.bounceRate,
      returnVisitor: factors.returnVisitor,
    };

    let score = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      score += normalized[key as keyof typeof normalized] * weight;
    });

    return Math.max(0, Math.min(100, score * 100));
  }

  private async identifyConversionGoals(events: any[]): Promise<string[]> {
    const conversionEvents = events.filter((e) =>
      [
        "form_submit",
        "download",
        "cv_download",
        "feedback_submit",
        "social_share",
      ].includes(e.type),
    );

    return [...new Set(conversionEvents.map((e) => e.type))];
  }

  private async calculateContentConversionRate(
    contentId: string,
    since: Date,
  ): Promise<number> {
    // Simplified conversion rate calculation
    // In practice, this would involve complex funnel analysis
    return 0.05; // Placeholder 5% conversion rate
  }

  private calculatePopularityScore(metrics: {
    views: number;
    uniqueViews: number;
    averageTimeOnContent: number;
    scrollDepth: number;
    shareCount: number;
    reactionCount: number;
    exitRate: number;
  }): number {
    // Weighted popularity score (0-100)
    const weights = {
      views: 0.2,
      uniqueViews: 0.25,
      averageTimeOnContent: 0.15,
      scrollDepth: 0.1,
      shareCount: 0.15,
      reactionCount: 0.1,
      exitRate: -0.05,
    };

    // Normalize metrics
    const normalized = {
      views: Math.min(metrics.views / 1000, 1),
      uniqueViews: Math.min(metrics.uniqueViews / 500, 1),
      averageTimeOnContent: Math.min(metrics.averageTimeOnContent / 300, 1),
      scrollDepth: metrics.scrollDepth / 100,
      shareCount: Math.min(metrics.shareCount / 50, 1),
      reactionCount: Math.min(metrics.reactionCount / 100, 1),
      exitRate: metrics.exitRate,
    };

    let score = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      score += normalized[key as keyof typeof normalized] * weight;
    });

    return Math.max(0, Math.min(100, score * 100));
  }
}

export const userBehaviorAnalytics = new UserBehaviorAnalytics();
