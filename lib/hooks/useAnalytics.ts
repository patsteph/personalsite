import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { notifyError } from '@/lib/utils/error-handler';

export interface PageStats {
  path: string;
  views: number;
  uniqueVisitors: number;
  avgTimeOnPage: number; // in seconds
  bounceRate: number; // percentage
}

export interface VisitorLocation {
  country: string;
  count: number;
  percentage: number;
}

export interface DeviceStats {
  browser: Record<string, number>;
  os: Record<string, number>;
  device: Record<string, number>; // mobile, tablet, desktop
}

export interface AnalyticsData {
  dailyPageViews: number[];
  dailyVisitors: number[];
  dateLabels: string[];
  totalPageViews: number;
  totalVisitors: number;
  avgSessionDuration: number; // in seconds
  topPages: PageStats[];
  visitorLocations: VisitorLocation[];
  deviceStats: DeviceStats;
  referrers: Record<string, number>;
  bounceRate: number; // percentage
  loading: boolean;
  error: Error | null;
  timeRange: '7d' | '30d' | '90d';
  setTimeRange: (range: '7d' | '30d' | '90d') => void;
}

/**
 * Custom hook for fetching and processing analytics data from Firestore
 */
export function useAnalytics(): AnalyticsData {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  
  // Analytics state
  const [dailyPageViews, setDailyPageViews] = useState<number[]>([]);
  const [dailyVisitors, setDailyVisitors] = useState<number[]>([]);
  const [dateLabels, setDateLabels] = useState<string[]>([]);
  const [totalPageViews, setTotalPageViews] = useState<number>(0);
  const [totalVisitors, setTotalVisitors] = useState<number>(0);
  const [avgSessionDuration, setAvgSessionDuration] = useState<number>(0);
  const [topPages, setTopPages] = useState<PageStats[]>([]);
  const [visitorLocations, setVisitorLocations] = useState<VisitorLocation[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceStats>({
    browser: {},
    os: {},
    device: {}
  });
  const [referrers, setReferrers] = useState<Record<string, number>>({});
  const [bounceRate, setBounceRate] = useState<number>(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!db) {
        setError(new Error('Firebase not initialized'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Determine date range based on selected timeRange
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        console.log(`Fetching analytics for the last ${days} days`);
        
        // Generate date labels
        const labels = [];
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          // Format as MM/DD for shorter ranges, MM/DD/YY for longer
          if (days <= 30) {
            labels.push(date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }));
          } else {
            labels.push(date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }));
          }
        }
        setDateLabels(labels);
        
        // First test if we can access the trackingEvents collection
        const testQuery = query(collection(db, 'trackingEvents'), limit(1));
        try {
          const testSnapshot = await getDocs(testQuery);
          if (testSnapshot.empty) {
            console.log('No tracking events found or access denied');
            throw new Error('No tracking data available');
          }
        } catch (err) {
          console.error('Error accessing tracking events:', err);
          throw new Error('Cannot access tracking data');
        }
        
        // Query tracking events for the specified time range
        const eventsQuery = query(
          collection(db, 'trackingEvents'),
          where('timestamp', '>=', startDate),
          orderBy('timestamp', 'asc')
        );
        
        const snapshot = await getDocs(eventsQuery);
        console.log(`Found ${snapshot.size} tracking events`);
        
        if (snapshot.empty) {
          // No data for the selected period
          setDailyPageViews(new Array(days).fill(0));
          setDailyVisitors(new Array(days).fill(0));
          setLoading(false);
          return;
        }
        
        // Process events
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Calculate daily stats
        const dailyStats = calculateDailyStats(events, days);
        setDailyPageViews(dailyStats.pageViews);
        setDailyVisitors(dailyStats.visitors);
        
        // Calculate total stats
        const totals = calculateTotalStats(events);
        setTotalPageViews(totals.pageViews);
        setTotalVisitors(totals.visitors);
        setAvgSessionDuration(totals.avgDuration);
        setBounceRate(totals.bounceRate);
        
        // Get top pages
        setTopPages(calculateTopPages(events));
        
        // Get visitor locations
        setVisitorLocations(calculateVisitorLocations(events));
        
        // Get device stats
        setDeviceStats(calculateDeviceStats(events));
        
        // Get referrers
        setReferrers(calculateReferrers(events));
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch analytics data'));
        notifyError(err, 'useAnalytics.fetchAnalytics');
        
        // Generate demo data as a fallback
        generateDemoData(timeRange);
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  // Helper function to calculate daily page views and visitors
  const calculateDailyStats = (events: any[], days: number) => {
    const pageViews = new Array(days).fill(0);
    const visitors = new Array(days).fill(0);
    const visitorsByDay: Record<number, Set<string>> = {};
    
    // Initialize visitor sets for each day
    for (let i = 0; i < days; i++) {
      visitorsByDay[i] = new Set();
    }
    
    events.forEach(event => {
      if (event.type === 'pageView') {
        const date = new Date(event.timestamp.seconds * 1000);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < days) {
          const index = days - diffDays - 1;
          pageViews[index]++;
          
          if (event.visitorId) {
            visitorsByDay[index].add(event.visitorId);
          }
        }
      }
    });
    
    // Convert visitor sets to counts
    for (let i = 0; i < days; i++) {
      visitors[i] = visitorsByDay[i].size;
    }
    
    return { pageViews, visitors };
  };

  // Helper function to calculate total stats
  const calculateTotalStats = (events: any[]) => {
    const pageViewEvents = events.filter(e => e.type === 'pageView');
    const pageViews = pageViewEvents.length;
    
    // Count unique visitors
    const uniqueVisitors = new Set();
    pageViewEvents.forEach(event => {
      if (event.visitorId) {
        uniqueVisitors.add(event.visitorId);
      }
    });
    const visitors = uniqueVisitors.size;
    
    // Calculate average session duration
    const sessionDurations: Record<string, number[]> = {};
    pageViewEvents.forEach(event => {
      if (event.visitorId && event.sessionId) {
        const key = `${event.visitorId}-${event.sessionId}`;
        if (!sessionDurations[key]) {
          sessionDurations[key] = [];
        }
        sessionDurations[key].push(event.timestamp.seconds);
      }
    });
    
    let totalDuration = 0;
    let sessionCount = 0;
    
    Object.values(sessionDurations).forEach(timestamps => {
      if (timestamps.length > 1) {
        // Sort timestamps to get correct order
        timestamps.sort((a, b) => a - b);
        
        // Calculate session duration (last timestamp - first timestamp)
        const duration = timestamps[timestamps.length - 1] - timestamps[0];
        if (duration > 0 && duration < 3600 * 3) { // Cap at 3 hours to filter outliers
          totalDuration += duration;
          sessionCount++;
        }
      }
    });
    
    const avgDuration = sessionCount > 0 ? Math.round(totalDuration / sessionCount) : 0;
    
    // Calculate bounce rate (percentage of sessions with only one page view)
    const bounceCount = Object.values(sessionDurations).filter(ts => ts.length === 1).length;
    const bounceRate = sessionCount > 0 ? Math.round((bounceCount / sessionCount) * 100) : 0;
    
    return { pageViews, visitors, avgDuration, bounceRate };
  };

  // Helper function to calculate top pages
  const calculateTopPages = (events: any[]): PageStats[] => {
    const pageViewEvents = events.filter(e => e.type === 'pageView');
    const pageStats: Record<string, { 
      views: number, 
      visitors: Set<string>,
      durations: number[],
      bounces: number,
      sessions: Set<string>
    }> = {};
    
    pageViewEvents.forEach(event => {
      const path = event.path || '/';
      if (!pageStats[path]) {
        pageStats[path] = { 
          views: 0, 
          visitors: new Set(),
          durations: [],
          bounces: 0,
          sessions: new Set()
        };
      }
      
      pageStats[path].views++;
      
      if (event.visitorId) {
        pageStats[path].visitors.add(event.visitorId);
      }
      
      if (event.duration) {
        pageStats[path].durations.push(event.duration);
      }
      
      if (event.sessionId) {
        pageStats[path].sessions.add(event.sessionId);
      }
    });
    
    // Calculate additional metrics and convert to array
    return Object.entries(pageStats)
      .map(([path, stats]) => {
        // Calculate average time on page
        const avgTimeOnPage = stats.durations.length > 0 
          ? stats.durations.reduce((sum, duration) => sum + duration, 0) / stats.durations.length 
          : 0;
        
        // Get page bounce count from session collection
        const sessionEvents: Record<string, number> = {};
        pageViewEvents.forEach(event => {
          if (event.sessionId) {
            if (!sessionEvents[event.sessionId]) {
              sessionEvents[event.sessionId] = 0;
            }
            sessionEvents[event.sessionId]++;
          }
        });
        
        // Count bounces (sessions with only one page view)
        let bounceCount = 0;
        stats.sessions.forEach(sessionId => {
          if (sessionEvents[sessionId as string] === 1) {
            bounceCount++;
          }
        });
        
        const bounceRate = stats.sessions.size > 0 
          ? (bounceCount / stats.sessions.size) * 100
          : 0;
        
        return {
          path,
          views: stats.views,
          uniqueVisitors: stats.visitors.size,
          avgTimeOnPage: Math.round(avgTimeOnPage),
          bounceRate: Math.round(bounceRate)
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  };

  // Helper function to calculate visitor locations
  const calculateVisitorLocations = (events: any[]): VisitorLocation[] => {
    const locationCounts: Record<string, number> = {};
    let totalWithLocation = 0;
    
    events.forEach(event => {
      if (event.type === 'pageView' && event.location && event.location.country) {
        const country = event.location.country;
        if (!locationCounts[country]) {
          locationCounts[country] = 0;
        }
        locationCounts[country]++;
        totalWithLocation++;
      }
    });
    
    // Convert to array and calculate percentages
    return Object.entries(locationCounts)
      .map(([country, count]) => ({
        country,
        count,
        percentage: totalWithLocation > 0 ? Math.round((count / totalWithLocation) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  // Helper function to calculate device stats
  const calculateDeviceStats = (events: any[]): DeviceStats => {
    const browsers: Record<string, number> = {};
    const os: Record<string, number> = {};
    const device: Record<string, number> = {};
    
    events.forEach(event => {
      if (event.type === 'pageView' && event.userAgent) {
        // Process browser
        if (event.userAgent.browser) {
          const browser = event.userAgent.browser;
          if (!browsers[browser]) {
            browsers[browser] = 0;
          }
          browsers[browser]++;
        }
        
        // Process OS
        if (event.userAgent.os) {
          const osName = event.userAgent.os;
          if (!os[osName]) {
            os[osName] = 0;
          }
          os[osName]++;
        }
        
        // Process device type
        if (event.userAgent.device) {
          const deviceType = event.userAgent.device;
          if (!device[deviceType]) {
            device[deviceType] = 0;
          }
          device[deviceType]++;
        }
      }
    });
    
    return { browser: browsers, os, device };
  };

  // Helper function to calculate referrers
  const calculateReferrers = (events: any[]): Record<string, number> => {
    const referrerCounts: Record<string, number> = {};
    
    events.forEach(event => {
      if (event.type === 'pageView' && event.referrer) {
        let referrer = event.referrer;
        
        // Extract domain from URL
        try {
          const url = new URL(referrer);
          referrer = url.hostname;
        } catch (e) {
          // Use the referrer as is if it's not a valid URL
        }
        
        if (!referrerCounts[referrer]) {
          referrerCounts[referrer] = 0;
        }
        referrerCounts[referrer]++;
      }
    });
    
    // Sort and limit to top referrers
    return Object.fromEntries(
      Object.entries(referrerCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
    );
  };

  // Generate demo data when real data is not available
  const generateDemoData = (range: '7d' | '30d' | '90d') => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    
    // Generate date labels
    const labels = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      if (days <= 30) {
        labels.push(date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }));
      } else {
        labels.push(date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }));
      }
    }
    setDateLabels(labels);
    
    // Generate page views (100-600 per day)
    const views = Array.from({ length: days }, () => Math.floor(Math.random() * 500) + 100);
    setDailyPageViews(views);
    
    // Generate visitors (50-250 per day)
    const visitors = Array.from({ length: days }, () => Math.floor(Math.random() * 200) + 50);
    setDailyVisitors(visitors);
    
    // Set totals
    setTotalPageViews(views.reduce((sum, v) => sum + v, 0));
    setTotalVisitors(visitors.reduce((sum, v) => sum + v, 0));
    
    // Set session duration (30-300 seconds)
    setAvgSessionDuration(Math.floor(Math.random() * 270) + 30);
    
    // Set bounce rate (20-70%)
    setBounceRate(Math.floor(Math.random() * 50) + 20);
    
    // Set top pages
    setTopPages([
      { path: '/', views: 845, uniqueVisitors: 623, avgTimeOnPage: 132, bounceRate: 23 },
      { path: '/blog', views: 684, uniqueVisitors: 521, avgTimeOnPage: 222, bounceRate: 34 },
      { path: '/books', views: 456, uniqueVisitors: 387, avgTimeOnPage: 118, bounceRate: 28 },
      { path: '/signals', views: 312, uniqueVisitors: 289, avgTimeOnPage: 157, bounceRate: 41 },
      { path: '/cv', views: 289, uniqueVisitors: 254, avgTimeOnPage: 104, bounceRate: 19 }
    ]);
    
    // Set visitor locations
    setVisitorLocations([
      { country: 'United States', count: 450, percentage: 45 },
      { country: 'United Kingdom', count: 120, percentage: 12 },
      { country: 'Canada', count: 80, percentage: 8 },
      { country: 'Germany', count: 70, percentage: 7 },
      { country: 'Australia', count: 65, percentage: 6.5 }
    ]);
    
    // Set device stats
    setDeviceStats({
      browser: {
        'Chrome': 450,
        'Firefox': 150,
        'Safari': 200,
        'Edge': 100
      },
      os: {
        'Windows': 350,
        'macOS': 290,
        'iOS': 180,
        'Android': 140,
        'Linux': 40
      },
      device: {
        'Desktop': 680,
        'Mobile': 280,
        'Tablet': 40
      }
    });
    
    // Set referrers
    setReferrers({
      'google.com': 320,
      'twitter.com': 95,
      'linkedin.com': 80,
      'github.com': 65,
      'bing.com': 40
    });
  };

  return {
    dailyPageViews,
    dailyVisitors,
    dateLabels,
    totalPageViews,
    totalVisitors,
    avgSessionDuration,
    topPages,
    visitorLocations,
    deviceStats,
    referrers,
    bounceRate,
    loading,
    error,
    timeRange,
    setTimeRange
  };
}

export default useAnalytics;
