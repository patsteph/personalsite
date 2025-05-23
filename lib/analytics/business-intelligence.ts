/**
 * Business Intelligence and Reporting System
 *
 * Comprehensive business intelligence framework for generating
 * actionable insights from analytics data.
 */

import { getAdminFirestore } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export interface BusinessMetrics {
  timeframe: {
    start: Date;
    end: Date;
    period: string;
  };

  // Traffic Metrics
  traffic: {
    totalSessions: number;
    uniqueUsers: number;
    pageViews: number;
    bounceRate: number;
    averageSessionDuration: number;
    newVsReturning: {
      newUsers: number;
      returningUsers: number;
      newUserRate: number;
    };
  };

  // Engagement Metrics
  engagement: {
    averageTimeOnPage: number;
    pagesPerSession: number;
    scrollDepth: number;
    interactionRate: number;
    engagementScore: number;
    topEngagingContent: ContentEngagement[];
  };

  // Content Performance
  content: {
    totalPosts: number;
    totalViews: number;
    averageViewsPerPost: number;
    topPerformingPosts: ContentPerformance[];
    contentByCategory: Record<string, ContentCategoryMetrics>;
    contentTrends: ContentTrend[];
  };

  // User Behavior
  userBehavior: {
    deviceBreakdown: Record<string, number>;
    browserBreakdown: Record<string, number>;
    locationBreakdown: Record<string, number>;
    trafficSources: Record<string, number>;
    userJourneys: UserJourneyInsight[];
  };

  // Performance & Technical
  performance: {
    averageLoadTime: number;
    coreWebVitals: {
      fcp: number;
      lcp: number;
      fid: number;
      cls: number;
    };
    errorRate: number;
    uptimePercentage: number;
  };

  // Business Goals
  goals: {
    conversions: GoalMetrics[];
    funnelAnalysis: FunnelAnalysis[];
    cohortAnalysis: CohortData[];
  };
}

export interface ContentEngagement {
  contentId: string;
  title: string;
  engagementScore: number;
  averageTimeOnPage: number;
  scrollDepth: number;
  interactions: number;
  shareCount: number;
}

export interface ContentPerformance {
  contentId: string;
  title: string;
  views: number;
  uniqueViews: number;
  conversionRate: number;
  revenue?: number;
  publishDate: Date;
  category: string;
}

export interface ContentCategoryMetrics {
  category: string;
  totalPosts: number;
  totalViews: number;
  averageEngagement: number;
  topPost: string;
}

export interface ContentTrend {
  date: Date;
  views: number;
  engagement: number;
  newContent: number;
}

export interface UserJourneyInsight {
  path: string[];
  frequency: number;
  conversionRate: number;
  averageDuration: number;
  dropoffPoints: string[];
}

export interface GoalMetrics {
  goalId: string;
  goalName: string;
  conversions: number;
  conversionRate: number;
  value: number;
  trend: "up" | "down" | "stable";
}

export interface FunnelAnalysis {
  funnelName: string;
  steps: FunnelStep[];
  overallConversionRate: number;
  dropoffAnalysis: DropoffPoint[];
}

export interface FunnelStep {
  stepName: string;
  stepOrder: number;
  users: number;
  conversionRate: number;
  dropoffRate: number;
}

export interface DropoffPoint {
  step: string;
  dropoffRate: number;
  commonExitPages: string[];
  recommendations: string[];
}

export interface CohortData {
  cohortMonth: string;
  totalUsers: number;
  retentionRates: Record<string, number>; // Week/Month -> Retention %
}

export interface Report {
  id: string;
  name: string;
  description: string;
  type: "executive" | "content" | "technical" | "marketing" | "custom";
  schedule: "daily" | "weekly" | "monthly" | "quarterly";
  recipients: string[];
  metrics: BusinessMetrics;
  insights: Insight[];
  recommendations: Recommendation[];
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
}

export interface Insight {
  type: "positive" | "negative" | "neutral" | "opportunity";
  category: "traffic" | "engagement" | "content" | "performance" | "conversion";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  confidence: number; // 0-1
  data: Record<string, any>;
}

export interface Recommendation {
  id: string;
  category: "content" | "performance" | "user_experience" | "marketing";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  expectedImpact: string;
  effort: "low" | "medium" | "high";
  timeline: string;
  metrics: string[];
}

export class BusinessIntelligence {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getAdminFirestore();
  }

  /**
   * Generate comprehensive business metrics for a time period
   */
  async generateBusinessMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<BusinessMetrics> {
    const timeframe = {
      start: startDate,
      end: endDate,
      period: this.formatPeriod(startDate, endDate),
    };

    // Generate all metric categories in parallel
    const [traffic, engagement, content, userBehavior, performance, goals] =
      await Promise.all([
        this.generateTrafficMetrics(startDate, endDate),
        this.generateEngagementMetrics(startDate, endDate),
        this.generateContentMetrics(startDate, endDate),
        this.generateUserBehaviorMetrics(startDate, endDate),
        this.generatePerformanceMetrics(startDate, endDate),
        this.generateGoalMetrics(startDate, endDate),
      ]);

    return {
      timeframe,
      traffic,
      engagement,
      content,
      userBehavior,
      performance,
      goals,
    };
  }

  /**
   * Generate business intelligence report
   */
  async generateReport(
    type: Report["type"],
    startDate: Date,
    endDate: Date,
    customMetrics?: string[],
  ): Promise<Report> {
    const reportId = this.generateReportId();

    // Generate metrics
    const metrics = await this.generateBusinessMetrics(startDate, endDate);

    // Generate insights
    const insights = await this.generateInsights(metrics);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      metrics,
      insights,
    );

    const report: Report = {
      id: reportId,
      name: this.getReportName(type, startDate, endDate),
      description: this.getReportDescription(type),
      type,
      schedule: "monthly", // Default
      recipients: [],
      metrics,
      insights,
      recommendations,
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
    };

    // Store report
    await this.storeReport(report);

    return report;
  }

  /**
   * Generate actionable insights from metrics
   */
  async generateInsights(metrics: BusinessMetrics): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Traffic insights
    if (metrics.traffic.bounceRate > 0.7) {
      insights.push({
        type: "negative",
        category: "traffic",
        title: "High Bounce Rate Detected",
        description: `Bounce rate of ${(metrics.traffic.bounceRate * 100).toFixed(1)}% is above the 70% threshold, indicating users may not find content engaging.`,
        impact: "high",
        confidence: 0.9,
        data: { bounceRate: metrics.traffic.bounceRate },
      });
    }

    // Engagement insights
    if (metrics.engagement.engagementScore < 50) {
      insights.push({
        type: "opportunity",
        category: "engagement",
        title: "Low User Engagement",
        description: `Average engagement score of ${metrics.engagement.engagementScore.toFixed(1)} suggests room for improvement in content quality and user experience.`,
        impact: "medium",
        confidence: 0.8,
        data: { engagementScore: metrics.engagement.engagementScore },
      });
    }

    // Content insights
    const topContent = metrics.content.topPerformingPosts[0];
    if (
      topContent &&
      topContent.views > metrics.content.averageViewsPerPost * 3
    ) {
      insights.push({
        type: "positive",
        category: "content",
        title: "Viral Content Identified",
        description: `"${topContent.title}" received ${topContent.views} views, significantly above average. Consider analyzing what made this content successful.`,
        impact: "high",
        confidence: 0.95,
        data: { topContent },
      });
    }

    // Performance insights
    if (metrics.performance.coreWebVitals.lcp > 2500) {
      insights.push({
        type: "negative",
        category: "performance",
        title: "Slow Page Load Performance",
        description: `Largest Contentful Paint of ${metrics.performance.coreWebVitals.lcp.toFixed(0)}ms exceeds the 2.5s recommendation, potentially impacting user experience and SEO.`,
        impact: "high",
        confidence: 0.9,
        data: { lcp: metrics.performance.coreWebVitals.lcp },
      });
    }

    // Goal insights
    const primaryGoal = metrics.goals.conversions[0];
    if (primaryGoal && primaryGoal.trend === "up") {
      insights.push({
        type: "positive",
        category: "conversion",
        title: "Improving Conversion Trend",
        description: `${primaryGoal.goalName} conversions are trending upward with ${primaryGoal.conversions} conversions and ${(primaryGoal.conversionRate * 100).toFixed(2)}% conversion rate.`,
        impact: "medium",
        confidence: 0.8,
        data: { goal: primaryGoal },
      });
    }

    return insights;
  }

  /**
   * Generate actionable recommendations
   */
  async generateRecommendations(
    metrics: BusinessMetrics,
    insights: Insight[],
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Performance recommendations
    if (metrics.performance.coreWebVitals.lcp > 2500) {
      recommendations.push({
        id: this.generateRecommendationId(),
        category: "performance",
        priority: "high",
        title: "Optimize Page Load Performance",
        description:
          "Implement image optimization, lazy loading, and CDN to improve Largest Contentful Paint (LCP) times.",
        expectedImpact:
          "Reduce page load time by 30-50%, improve user experience and SEO rankings",
        effort: "medium",
        timeline: "2-4 weeks",
        metrics: ["lcp", "user_engagement", "bounce_rate"],
      });
    }

    // Content recommendations
    if (metrics.content.averageViewsPerPost < 100) {
      recommendations.push({
        id: this.generateRecommendationId(),
        category: "content",
        priority: "medium",
        title: "Improve Content Discovery",
        description:
          "Enhance SEO, social sharing, and internal linking to increase content visibility and views.",
        expectedImpact: "Increase average post views by 25-40%",
        effort: "low",
        timeline: "1-2 weeks",
        metrics: ["page_views", "content_engagement", "social_shares"],
      });
    }

    // User experience recommendations
    if (metrics.traffic.bounceRate > 0.6) {
      recommendations.push({
        id: this.generateRecommendationId(),
        category: "user_experience",
        priority: "high",
        title: "Reduce Bounce Rate",
        description:
          "Improve page load speed, enhance content relevance, and add compelling calls-to-action to keep users engaged.",
        expectedImpact: "Reduce bounce rate by 15-25%",
        effort: "medium",
        timeline: "3-6 weeks",
        metrics: ["bounce_rate", "session_duration", "pages_per_session"],
      });
    }

    // Mobile optimization
    const mobileUsers = metrics.userBehavior.deviceBreakdown["mobile"] || 0;
    const totalUsers = Object.values(
      metrics.userBehavior.deviceBreakdown,
    ).reduce((sum, count) => sum + count, 0);
    const mobilePercentage = totalUsers > 0 ? mobileUsers / totalUsers : 0;

    if (mobilePercentage > 0.6) {
      recommendations.push({
        id: this.generateRecommendationId(),
        category: "user_experience",
        priority: "medium",
        title: "Optimize Mobile Experience",
        description: `With ${(mobilePercentage * 100).toFixed(1)}% mobile users, focus on mobile-first design and performance optimization.`,
        expectedImpact: "Improve mobile user engagement by 20-30%",
        effort: "medium",
        timeline: "4-6 weeks",
        metrics: [
          "mobile_bounce_rate",
          "mobile_session_duration",
          "mobile_conversions",
        ],
      });
    }

    return recommendations;
  }

  /**
   * Generate executive summary report
   */
  async generateExecutiveSummary(startDate: Date, endDate: Date): Promise<any> {
    const metrics = await this.generateBusinessMetrics(startDate, endDate);
    const insights = await this.generateInsights(metrics);
    const keyInsights = insights.filter((i) => i.impact === "high").slice(0, 3);

    // Calculate trends (simplified - would compare with previous period)
    const trends = {
      traffic: "up", // Placeholder
      engagement: "stable",
      conversions: "up",
    };

    return {
      period: this.formatPeriod(startDate, endDate),
      keyMetrics: {
        totalUsers: metrics.traffic.uniqueUsers,
        pageViews: metrics.traffic.pageViews,
        engagementScore: Math.round(metrics.engagement.engagementScore),
        conversionRate: metrics.goals.conversions[0]?.conversionRate || 0,
      },
      trends,
      keyInsights,
      topContent: metrics.content.topPerformingPosts.slice(0, 3),
      recommendations: await this.generateRecommendations(
        metrics,
        insights,
      ).then((recs) => recs.filter((r) => r.priority === "high").slice(0, 2)),
    };
  }

  // Private helper methods for generating specific metric categories

  private async generateTrafficMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<BusinessMetrics["traffic"]> {
    try {
      const sessionsQuery = await this.db
        .collection("analytics_sessions")
        .where("startTime", ">=", Timestamp.fromDate(startDate))
        .where("startTime", "<=", Timestamp.fromDate(endDate))
        .get();

      const sessions = sessionsQuery.docs.map((doc) => doc.data());

      const totalSessions = sessions.length;
      const uniqueUsers =
        new Set(sessions.filter((s) => s.userId).map((s) => s.userId)).size ||
        totalSessions;

      const pageViewsQuery = await this.db
        .collection("analytics_events")
        .where("type", "==", "page_view")
        .where("timestamp", ">=", Timestamp.fromDate(startDate))
        .where("timestamp", "<=", Timestamp.fromDate(endDate))
        .get();

      const pageViews = pageViewsQuery.size;

      const bounceRate =
        sessions.length > 0
          ? sessions.filter((s) => s.bounceRate).length / sessions.length
          : 0;

      const averageSessionDuration =
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) /
            sessions.length
          : 0;

      // Calculate new vs returning users (simplified)
      const returningUsers = sessions.filter((s) => s.userId).length;
      const newUsers = totalSessions - returningUsers;
      const newUserRate = totalSessions > 0 ? newUsers / totalSessions : 0;

      return {
        totalSessions,
        uniqueUsers,
        pageViews,
        bounceRate,
        averageSessionDuration,
        newVsReturning: {
          newUsers,
          returningUsers,
          newUserRate,
        },
      };
    } catch (error) {
      console.error("Error generating traffic metrics:", error);
      return this.getDefaultTrafficMetrics();
    }
  }

  private async generateEngagementMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<BusinessMetrics["engagement"]> {
    try {
      const engagementQuery = await this.db
        .collection("analytics_engagement")
        .where("calculatedAt", ">=", Timestamp.fromDate(startDate))
        .where("calculatedAt", "<=", Timestamp.fromDate(endDate))
        .get();

      const engagementData = engagementQuery.docs.map((doc) => doc.data());

      const averageTimeOnPage =
        engagementData.length > 0
          ? engagementData.reduce(
              (sum, e) => sum + (e.sessionDuration || 0),
              0,
            ) / engagementData.length
          : 0;

      const pagesPerSession =
        engagementData.length > 0
          ? engagementData.reduce((sum, e) => sum + (e.pageDepth || 0), 0) /
            engagementData.length
          : 0;

      const scrollDepth =
        engagementData.length > 0
          ? engagementData.reduce((sum, e) => sum + (e.scrollDepth || 0), 0) /
            engagementData.length
          : 0;

      const interactionRate =
        engagementData.length > 0
          ? engagementData.reduce(
              (sum, e) => sum + (e.interactionRate || 0),
              0,
            ) / engagementData.length
          : 0;

      const engagementScore =
        engagementData.length > 0
          ? engagementData.reduce(
              (sum, e) => sum + (e.engagementScore || 0),
              0,
            ) / engagementData.length
          : 0;

      // Top engaging content (placeholder)
      const topEngagingContent: ContentEngagement[] = [];

      return {
        averageTimeOnPage,
        pagesPerSession,
        scrollDepth,
        interactionRate,
        engagementScore,
        topEngagingContent,
      };
    } catch (error) {
      console.error("Error generating engagement metrics:", error);
      return this.getDefaultEngagementMetrics();
    }
  }

  private async generateContentMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<BusinessMetrics["content"]> {
    try {
      const contentQuery = await this.db
        .collection("analytics_content")
        .where("analyzedAt", ">=", Timestamp.fromDate(startDate))
        .where("analyzedAt", "<=", Timestamp.fromDate(endDate))
        .get();

      const contentData = contentQuery.docs.map((doc) => doc.data());

      const totalPosts = contentData.length;
      const totalViews = contentData.reduce(
        (sum, c) => sum + (c.views || 0),
        0,
      );
      const averageViewsPerPost = totalPosts > 0 ? totalViews / totalPosts : 0;

      const topPerformingPosts: ContentPerformance[] = contentData
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 10)
        .map((content) => ({
          contentId: content.contentId,
          title: content.contentId, // Would fetch actual title
          views: content.views || 0,
          uniqueViews: content.uniqueViews || 0,
          conversionRate: content.conversionRate || 0,
          publishDate: new Date(),
          category: content.contentType || "general",
        }));

      // Content by category (simplified)
      const contentByCategory: Record<string, ContentCategoryMetrics> = {};

      // Content trends (placeholder)
      const contentTrends: ContentTrend[] = [];

      return {
        totalPosts,
        totalViews,
        averageViewsPerPost,
        topPerformingPosts,
        contentByCategory,
        contentTrends,
      };
    } catch (error) {
      console.error("Error generating content metrics:", error);
      return this.getDefaultContentMetrics();
    }
  }

  private async generateUserBehaviorMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<BusinessMetrics["userBehavior"]> {
    try {
      const sessionsQuery = await this.db
        .collection("analytics_sessions")
        .where("startTime", ">=", Timestamp.fromDate(startDate))
        .where("startTime", "<=", Timestamp.fromDate(endDate))
        .get();

      const sessions = sessionsQuery.docs.map((doc) => doc.data());

      // Device breakdown
      const deviceBreakdown: Record<string, number> = {};
      const browserBreakdown: Record<string, number> = {};
      const locationBreakdown: Record<string, number> = {};
      const trafficSources: Record<string, number> = {};

      sessions.forEach((session) => {
        const device = session.device?.type || "unknown";
        const browser = session.device?.browser || "unknown";
        const location = session.location?.country || "unknown";

        deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
        browserBreakdown[browser] = (browserBreakdown[browser] || 0) + 1;
        locationBreakdown[location] = (locationBreakdown[location] || 0) + 1;

        // Determine traffic source
        let source = "direct";
        if (session.referrer) {
          const referrer = session.referrer;
          if (referrer.includes("google")) source = "google";
          else if (referrer.includes("facebook")) source = "facebook";
          else if (referrer.includes("twitter")) source = "twitter";
          else source = "referral";
        }
        trafficSources[source] = (trafficSources[source] || 0) + 1;
      });

      // User journeys (simplified)
      const userJourneys: UserJourneyInsight[] = [];

      return {
        deviceBreakdown,
        browserBreakdown,
        locationBreakdown,
        trafficSources,
        userJourneys,
      };
    } catch (error) {
      console.error("Error generating user behavior metrics:", error);
      return this.getDefaultUserBehaviorMetrics();
    }
  }

  private async generatePerformanceMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<BusinessMetrics["performance"]> {
    try {
      const performanceQuery = await this.db
        .collection("analytics_events")
        .where("type", "==", "performance")
        .where("timestamp", ">=", Timestamp.fromDate(startDate))
        .where("timestamp", "<=", Timestamp.fromDate(endDate))
        .get();

      const performanceEvents = performanceQuery.docs.map((doc) => doc.data());

      // Calculate averages
      let totalFCP = 0,
        totalLCP = 0,
        totalFID = 0,
        totalCLS = 0;
      let fcpCount = 0,
        lcpCount = 0,
        fidCount = 0,
        clsCount = 0;
      let totalLoadTime = 0,
        loadTimeCount = 0;

      performanceEvents.forEach((event) => {
        const metadata = event.metadata || {};

        if (metadata.firstContentfulPaint) {
          totalFCP += metadata.firstContentfulPaint;
          fcpCount++;
        }
        if (metadata.largestContentfulPaint) {
          totalLCP += metadata.largestContentfulPaint;
          lcpCount++;
        }
        if (metadata.firstInputDelay) {
          totalFID += metadata.firstInputDelay;
          fidCount++;
        }
        if (metadata.cumulativeLayoutShift) {
          totalCLS += metadata.cumulativeLayoutShift;
          clsCount++;
        }
        if (metadata.loadTime) {
          totalLoadTime += metadata.loadTime;
          loadTimeCount++;
        }
      });

      const coreWebVitals = {
        fcp: fcpCount > 0 ? totalFCP / fcpCount : 0,
        lcp: lcpCount > 0 ? totalLCP / lcpCount : 0,
        fid: fidCount > 0 ? totalFID / fidCount : 0,
        cls: clsCount > 0 ? totalCLS / clsCount : 0,
      };

      const averageLoadTime =
        loadTimeCount > 0 ? totalLoadTime / loadTimeCount : 0;

      // Error rate (simplified)
      const errorQuery = await this.db
        .collection("analytics_events")
        .where("type", "==", "error")
        .where("timestamp", ">=", Timestamp.fromDate(startDate))
        .where("timestamp", "<=", Timestamp.fromDate(endDate))
        .get();

      const totalEventsQuery = await this.db
        .collection("analytics_events")
        .where("timestamp", ">=", Timestamp.fromDate(startDate))
        .where("timestamp", "<=", Timestamp.fromDate(endDate))
        .get();

      const errorRate =
        totalEventsQuery.size > 0 ? errorQuery.size / totalEventsQuery.size : 0;

      // Uptime (placeholder - would integrate with monitoring service)
      const uptimePercentage = 99.9;

      return {
        averageLoadTime,
        coreWebVitals,
        errorRate,
        uptimePercentage,
      };
    } catch (error) {
      console.error("Error generating performance metrics:", error);
      return this.getDefaultPerformanceMetrics();
    }
  }

  private async generateGoalMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<BusinessMetrics["goals"]> {
    try {
      // This would integrate with the A/B testing framework and goal tracking
      const conversions: GoalMetrics[] = [
        {
          goalId: "contact_form",
          goalName: "Contact Form Submissions",
          conversions: 0,
          conversionRate: 0,
          value: 0,
          trend: "stable",
        },
      ];

      const funnelAnalysis: FunnelAnalysis[] = [];
      const cohortAnalysis: CohortData[] = [];

      return {
        conversions,
        funnelAnalysis,
        cohortAnalysis,
      };
    } catch (error) {
      console.error("Error generating goal metrics:", error);
      return {
        conversions: [],
        funnelAnalysis: [],
        cohortAnalysis: [],
      };
    }
  }

  // Default metrics for error cases
  private getDefaultTrafficMetrics(): BusinessMetrics["traffic"] {
    return {
      totalSessions: 0,
      uniqueUsers: 0,
      pageViews: 0,
      bounceRate: 0,
      averageSessionDuration: 0,
      newVsReturning: { newUsers: 0, returningUsers: 0, newUserRate: 0 },
    };
  }

  private getDefaultEngagementMetrics(): BusinessMetrics["engagement"] {
    return {
      averageTimeOnPage: 0,
      pagesPerSession: 0,
      scrollDepth: 0,
      interactionRate: 0,
      engagementScore: 0,
      topEngagingContent: [],
    };
  }

  private getDefaultContentMetrics(): BusinessMetrics["content"] {
    return {
      totalPosts: 0,
      totalViews: 0,
      averageViewsPerPost: 0,
      topPerformingPosts: [],
      contentByCategory: {},
      contentTrends: [],
    };
  }

  private getDefaultUserBehaviorMetrics(): BusinessMetrics["userBehavior"] {
    return {
      deviceBreakdown: {},
      browserBreakdown: {},
      locationBreakdown: {},
      trafficSources: {},
      userJourneys: [],
    };
  }

  private getDefaultPerformanceMetrics(): BusinessMetrics["performance"] {
    return {
      averageLoadTime: 0,
      coreWebVitals: { fcp: 0, lcp: 0, fid: 0, cls: 0 },
      errorRate: 0,
      uptimePercentage: 100,
    };
  }

  // Utility methods
  private formatPeriod(startDate: Date, endDate: Date): string {
    const start = startDate.toLocaleDateString();
    const end = endDate.toLocaleDateString();
    return `${start} - ${end}`;
  }

  private getReportName(
    type: Report["type"],
    startDate: Date,
    endDate: Date,
  ): string {
    const period = this.formatPeriod(startDate, endDate);
    return `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${period}`;
  }

  private getReportDescription(type: Report["type"]): string {
    const descriptions = {
      executive: "High-level business metrics and key insights for leadership",
      content: "Content performance analysis and content strategy insights",
      technical:
        "Technical performance metrics and optimization recommendations",
      marketing: "Marketing channel performance and audience insights",
      custom: "Custom metrics report based on specific requirements",
    };
    return descriptions[type];
  }

  private async storeReport(report: Report): Promise<void> {
    await this.db
      .collection("bi_reports")
      .doc(report.id)
      .set({
        ...report,
        generatedAt: Timestamp.fromDate(report.generatedAt),
        period: {
          start: Timestamp.fromDate(report.period.start),
          end: Timestamp.fromDate(report.period.end),
        },
      });
  }

  private generateReportId(): string {
    return `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecommendationId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const businessIntelligence = new BusinessIntelligence();
