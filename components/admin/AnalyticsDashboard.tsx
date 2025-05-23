/**
 * Advanced Analytics Dashboard
 *
 * Comprehensive analytics dashboard with real-time metrics,
 * user behavior insights, and performance monitoring.
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";

interface DashboardMetrics {
  overview: {
    totalSessions: number;
    uniqueUsers: number;
    averageSessionDuration: number;
    bounceRate: number;
    averagePageViews: number;
    averageEngagementScore: number;
  };
  realTime: {
    activeUsers: number;
    currentPageViews: number;
    topPages: Array<{ page: string; views: number }>;
    recentEvents: Array<{ type: string; page: string; timestamp: string }>;
  };
  content: {
    topContent: Array<{
      contentId: string;
      title: string;
      views: number;
      engagement: number;
      conversionRate: number;
    }>;
    contentPerformance: Record<string, any>;
  };
  user: {
    deviceBreakdown: Record<string, number>;
    locationData: Record<string, number>;
    userJourneys: Array<any>;
    engagementSegments: Record<string, number>;
  };
  performance: {
    pageLoadTimes: Array<{ page: string; averageTime: number }>;
    coreWebVitals: {
      fcp: number;
      lcp: number;
      fid: number;
      cls: number;
    };
    errorRates: Record<string, number>;
  };
}

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

const timeRanges: TimeRange[] = [
  { label: "24 Hours", value: "24h", days: 1 },
  { label: "7 Days", value: "7d", days: 7 },
  { label: "30 Days", value: "30d", days: 30 },
  { label: "90 Days", value: "90d", days: 90 },
];

export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(
    timeRanges[2],
  ); // 30 days default
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  const [realTimeUpdate, setRealTimeUpdate] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, selectedTimeRange]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (realTimeUpdate && selectedTab === "realtime") {
      interval = setInterval(() => {
        fetchRealTimeData();
      }, 30000); // Update every 30 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [realTimeUpdate, selectedTab]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/dashboard?days=${selectedTimeRange.days}`,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealTimeData = async () => {
    try {
      const response = await fetch("/api/analytics/realtime", {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics((prev) =>
          prev ? { ...prev, realTime: data.realTime } : null,
        );
      }
    } catch (error) {
      console.error("Error fetching real-time data:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load analytics data</p>
        <button
          onClick={fetchAnalyticsData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Comprehensive insights into user behavior and content performance
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mt-4 sm:mt-0">
          <select
            value={selectedTimeRange.value}
            onChange={(e) => {
              const range = timeRanges.find((r) => r.value === e.target.value);
              if (range) setSelectedTimeRange(range);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Overview", icon: "📊" },
            { id: "realtime", label: "Real-time", icon: "🔴" },
            { id: "content", label: "Content", icon: "📄" },
            { id: "users", label: "Users", icon: "👥" },
            { id: "performance", label: "Performance", icon: "⚡" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {selectedTab === "overview" && (
          <OverviewTab
            metrics={metrics.overview}
            timeRange={selectedTimeRange}
          />
        )}
        {selectedTab === "realtime" && (
          <RealTimeTab
            metrics={metrics.realTime}
            onToggleUpdate={setRealTimeUpdate}
            isUpdating={realTimeUpdate}
          />
        )}
        {selectedTab === "content" && (
          <ContentTab metrics={metrics.content} timeRange={selectedTimeRange} />
        )}
        {selectedTab === "users" && (
          <UsersTab metrics={metrics.user} timeRange={selectedTimeRange} />
        )}
        {selectedTab === "performance" && (
          <PerformanceTab
            metrics={metrics.performance}
            timeRange={selectedTimeRange}
          />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  metrics: DashboardMetrics["overview"];
  timeRange: TimeRange;
}> = ({ metrics, timeRange }) => {
  const cards = [
    {
      title: "Total Sessions",
      value: metrics.totalSessions.toLocaleString(),
      icon: "👥",
      description: `Sessions in the last ${timeRange.label.toLowerCase()}`,
    },
    {
      title: "Unique Users",
      value: metrics.uniqueUsers.toLocaleString(),
      icon: "🎯",
      description: "Individual visitors",
    },
    {
      title: "Avg. Session Duration",
      value: formatDuration(metrics.averageSessionDuration),
      icon: "⏱️",
      description: "Time spent per session",
    },
    {
      title: "Bounce Rate",
      value: `${(metrics.bounceRate * 100).toFixed(1)}%`,
      icon: "📉",
      description: "Single-page sessions",
    },
    {
      title: "Avg. Page Views",
      value: metrics.averagePageViews.toFixed(1),
      icon: "📄",
      description: "Pages per session",
    },
    {
      title: "Engagement Score",
      value: `${metrics.averageEngagementScore.toFixed(0)}/100`,
      icon: "🎯",
      description: "Overall user engagement",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="text-2xl mr-3">{card.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500">{card.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📈 Key Insights
        </h3>
        <div className="space-y-3">
          <InsightItem
            text={`Your engagement score of ${metrics.averageEngagementScore.toFixed(0)} is ${
              metrics.averageEngagementScore > 70
                ? "excellent"
                : metrics.averageEngagementScore > 50
                  ? "good"
                  : "needs improvement"
            }`}
            type={
              metrics.averageEngagementScore > 70
                ? "positive"
                : metrics.averageEngagementScore > 50
                  ? "neutral"
                  : "negative"
            }
          />
          <InsightItem
            text={`Bounce rate of ${(metrics.bounceRate * 100).toFixed(1)}% is ${
              metrics.bounceRate < 0.4
                ? "excellent"
                : metrics.bounceRate < 0.6
                  ? "acceptable"
                  : "high"
            }`}
            type={
              metrics.bounceRate < 0.4
                ? "positive"
                : metrics.bounceRate < 0.6
                  ? "neutral"
                  : "negative"
            }
          />
          <InsightItem
            text={`Average session duration of ${formatDuration(metrics.averageSessionDuration)} indicates ${
              metrics.averageSessionDuration > 120000
                ? "high user engagement"
                : metrics.averageSessionDuration > 60000
                  ? "moderate engagement"
                  : "low engagement"
            }`}
            type={
              metrics.averageSessionDuration > 120000
                ? "positive"
                : metrics.averageSessionDuration > 60000
                  ? "neutral"
                  : "negative"
            }
          />
        </div>
      </div>
    </div>
  );
};

// Real-time Tab Component
const RealTimeTab: React.FC<{
  metrics: DashboardMetrics["realTime"];
  onToggleUpdate: (enabled: boolean) => void;
  isUpdating: boolean;
}> = ({ metrics, onToggleUpdate, isUpdating }) => {
  return (
    <div className="space-y-6">
      {/* Real-time Controls */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center">
          <div
            className={`w-3 h-3 rounded-full mr-3 ${isUpdating ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
          ></div>
          <span className="font-medium">Real-time Updates</span>
        </div>
        <button
          onClick={() => onToggleUpdate(!isUpdating)}
          className={`px-4 py-2 rounded ${
            isUpdating
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          {isUpdating ? "Stop" : "Start"}
        </button>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔴 Active Users
          </h3>
          <div className="text-4xl font-bold text-green-600">
            {metrics.activeUsers}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Currently browsing your site
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            👁️ Page Views (Last 30 min)
          </h3>
          <div className="text-4xl font-bold text-blue-600">
            {metrics.currentPageViews}
          </div>
          <p className="text-sm text-gray-500 mt-2">Recent page views</p>
        </div>
      </div>

      {/* Top Pages and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Top Pages (Now)
          </h3>
          <div className="space-y-3">
            {metrics.topPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 truncate flex-1">
                  {page.page}
                </span>
                <span className="text-sm font-medium text-gray-900 ml-4">
                  {page.views}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ⚡ Recent Events
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {metrics.recentEvents.map((event, index) => (
              <div key={index} className="flex items-center text-sm">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                <span className="text-gray-600 flex-1">
                  {event.type} on {event.page}
                </span>
                <span className="text-gray-400 text-xs">
                  {formatTimeAgo(event.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Content Tab Component
const ContentTab: React.FC<{
  metrics: DashboardMetrics["content"];
  timeRange: TimeRange;
}> = ({ metrics, timeRange }) => {
  return (
    <div className="space-y-6">
      {/* Top Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏆 Top Performing Content
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-gray-600">
                  Content
                </th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">
                  Views
                </th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">
                  Engagement
                </th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">
                  Conversion
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.topContent.map((content, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 text-sm text-gray-900">
                    {content.title}
                  </td>
                  <td className="py-3 text-sm text-gray-600">
                    {content.views.toLocaleString()}
                  </td>
                  <td className="py-3 text-sm text-gray-600">
                    {content.engagement.toFixed(1)}%
                  </td>
                  <td className="py-3 text-sm text-gray-600">
                    {content.conversionRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Content Performance Charts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📈 Content Performance Over Time
        </h3>
        <div className="text-gray-500 text-center py-8">
          <p>Content performance visualization would go here</p>
          <p className="text-sm mt-2">
            Implement with charting library (Chart.js, D3, etc.)
          </p>
        </div>
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab: React.FC<{
  metrics: DashboardMetrics["user"];
  timeRange: TimeRange;
}> = ({ metrics, timeRange }) => {
  return (
    <div className="space-y-6">
      {/* Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📱 Device Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(metrics.deviceBreakdown).map(([device, count]) => (
              <div key={device} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">
                  {device}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🌍 Top Locations
          </h3>
          <div className="space-y-3">
            {Object.entries(metrics.locationData)
              .slice(0, 5)
              .map(([location, count]) => (
                <div
                  key={location}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-600">{location}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Engagement Segments */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 User Engagement Segments
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(metrics.engagementSegments).map(
            ([segment, count]) => (
              <div
                key={segment}
                className="text-center p-4 bg-gray-50 rounded-lg"
              >
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">
                  {segment.replace("_", " ")}
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
};

// Performance Tab Component
const PerformanceTab: React.FC<{
  metrics: DashboardMetrics["performance"];
  timeRange: TimeRange;
}> = ({ metrics, timeRange }) => {
  return (
    <div className="space-y-6">
      {/* Core Web Vitals */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⚡ Core Web Vitals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="First Contentful Paint"
            value={`${metrics.coreWebVitals.fcp.toFixed(0)}ms`}
            target={1800}
            current={metrics.coreWebVitals.fcp}
            unit="ms"
          />
          <MetricCard
            title="Largest Contentful Paint"
            value={`${metrics.coreWebVitals.lcp.toFixed(0)}ms`}
            target={2500}
            current={metrics.coreWebVitals.lcp}
            unit="ms"
          />
          <MetricCard
            title="First Input Delay"
            value={`${metrics.coreWebVitals.fid.toFixed(0)}ms`}
            target={100}
            current={metrics.coreWebVitals.fid}
            unit="ms"
          />
          <MetricCard
            title="Cumulative Layout Shift"
            value={metrics.coreWebVitals.cls.toFixed(3)}
            target={0.1}
            current={metrics.coreWebVitals.cls}
            unit=""
          />
        </div>
      </div>

      {/* Page Load Times */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Page Load Times
        </h3>
        <div className="space-y-3">
          {metrics.pageLoadTimes.map((page, index) => (
            <div key={index} className="flex items-center">
              <span className="text-sm text-gray-600 w-1/3 truncate">
                {page.page}
              </span>
              <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    page.averageTime < 2000
                      ? "bg-green-500"
                      : page.averageTime < 4000
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min((page.averageTime / 5000) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 w-20 text-right">
                {page.averageTime.toFixed(0)}ms
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Rates */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⚠️ Error Rates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(metrics.errorRates).map(([errorType, rate]) => (
            <div key={errorType} className="p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">
                {(rate * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-gray-600 capitalize">
                {errorType.replace("_", " ")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const InsightItem: React.FC<{
  text: string;
  type: "positive" | "neutral" | "negative";
}> = ({ text, type }) => {
  const colors = {
    positive: "text-green-600 bg-green-50 border-green-200",
    neutral: "text-yellow-600 bg-yellow-50 border-yellow-200",
    negative: "text-red-600 bg-red-50 border-red-200",
  };

  const icons = {
    positive: "✅",
    neutral: "⚠️",
    negative: "❌",
  };

  return (
    <div className={`p-3 rounded border ${colors[type]}`}>
      <span className="mr-2">{icons[type]}</span>
      {text}
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string;
  target: number;
  current: number;
  unit: string;
}> = ({ title, value, target, current, unit }) => {
  const isGood = current <= target;

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div
        className={`text-lg font-bold ${isGood ? "text-green-600" : "text-red-600"}`}
      >
        {value}
      </div>
      <div className="text-xs text-gray-500">
        Target: {target}
        {unit}
      </div>
    </div>
  );
};

// Helper Functions
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default AnalyticsDashboard;
