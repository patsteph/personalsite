import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { validateFirebaseIdToken } from '@/lib/api/server-auth';

type DashboardStats = {
  posts: number;
  books: number;
  signals: number;
  visitors: number;
  pageViews: number;
  recentVisitors: number[];
  popularContent: Array<{name: string, views: number}>;
  locationData: Array<{country: string, count: number}>;
  sessionDuration: { average: number, distribution: Array<{range: string, count: number}> };
  dataSource: 'real' | 'partial' | 'mock';
}

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: DashboardStats;
  error?: string;
}

/**
 * Handler for dashboard statistics
 * Fetches counts from various collections
 */
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    const db = getAdminFirestore();
    
    // Handle GET request only
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
    
    // Get count of blog posts (both published and drafts)  
    const publishedPostsSnapshot = await db.collection('posts').where('published', '==', true).get();
    const allPostsSnapshot = await db.collection('posts').get();
    const publishedPostsCount = publishedPostsSnapshot.size;
    const allPostsCount = allPostsSnapshot.size;
    const draftPostsCount = allPostsCount - publishedPostsCount;
    
    // Get count of books
    const booksSnapshot = await db.collection('books').get();
    const booksCount = booksSnapshot.size;
    
    // Get count of signals
    const signalsSnapshot = await db.collection('signals').get();
    const signalsCount = signalsSnapshot.size;

    // Check for existing analytics collections
    // First check the new tracking events collection
    const trackingEventsRef = db.collection('trackingEvents');
    
    // Then check the old site-stats collection
    const siteStatsRef = db.collection('site-stats');
    const siteStatsDoc = await siteStatsRef.doc('stats').get();
    
    let dataSource: 'real' | 'partial' | 'mock' = 'mock';
    
    // Analytics data
    let visitors = 0;
    let pageViews = 0;
    let recentVisitors: number[] = [];
    let popularContent: Array<{name: string, views: number}> = [];
    let locationData: Array<{country: string, count: number}> = [];
    let sessionDuration = { 
      average: 0, 
      distribution: [] as Array<{range: string, count: number}>
    };
    
    // Process tracking events to calculate recent visitors (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      last7Days.push(date.getTime());
    }
    
    // Try to get page view data from tracking events
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentEventsQuery = await trackingEventsRef
        .where('type', '==', 'pageView')
        .where('timestamp', '>=', sevenDaysAgo)
        .get();
      
      // If we have tracking data, use it
      if (!recentEventsQuery.empty) {
        dataSource = 'real';
        
        // Count total visitors and page views
        const events = recentEventsQuery.docs.map(doc => doc.data());
        const uniqueVisitors = new Set<string>();
        const pageViewsByPage: Record<string, number> = {};
        
        // Group events by day for the last 7 days
        const eventsByDay = last7Days.map(day => {
          const dayEvents = events.filter(event => {
            const eventDate = new Date(event.timestamp._seconds * 1000);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === day;
          });
          
          // Track unique visitors for this day
          const uniqueVisitorsForDay = new Set();
          dayEvents.forEach(event => {
            if (event.visitorId) uniqueVisitorsForDay.add(event.visitorId);
          });
          
          return uniqueVisitorsForDay.size;
        });
        
        // Extract visitors and page views
        events.forEach(event => {
          if (event.visitorId) uniqueVisitors.add(event.visitorId);
          if (event.details?.path) {
            const path = event.details.path;
            const pageName = path === '/' ? 'Homepage' : path.substring(1).charAt(0).toUpperCase() + path.substring(2);
            pageViewsByPage[pageName] = (pageViewsByPage[pageName] || 0) + 1;
          }
        });
        
        // Prepare the data
        visitors = uniqueVisitors.size;
        pageViews = events.length;
        recentVisitors = eventsByDay;
        
        // Create popular content stats
        const pageEntries = Object.entries(pageViewsByPage);
        popularContent = pageEntries
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, views]) => ({ name, views: views as number }));
      }
    } catch (err) {
      console.error('Error processing tracking events:', err);
    }
    
    // If we have site stats from the old collection, use them
    if (siteStatsDoc.exists) {
      dataSource = dataSource === 'real' ? 'real' : 'partial';
      const siteStatsData = siteStatsDoc.data() || {};
      
      // Use site stats if we don't have tracking data yet
      if (dataSource !== 'real') {
        visitors = siteStatsData.totalVisits || 1289;
        
        // Safely extract page visits from site stats
        const pageVisits = siteStatsData.pageVisits as Record<string, number> || {};
        pageViews = Object.values(pageVisits).reduce((a, b) => a + b, 0) || 3547;
      }
      
      // Try to extrapolate location data from feedback
      if (siteStatsData.feedback) {
        const countryData: Record<string, number> = {};
        const feedback = siteStatsData.feedback as Record<string, { country?: string }>;
        
        Object.values(feedback).forEach((entry) => {
          if (entry && entry.country) {
            countryData[entry.country] = (countryData[entry.country] || 0) + 1;
          }
        });
        
        if (Object.keys(countryData).length > 0) {
          locationData = Object.entries(countryData)
            .sort((a, b) => b[1] - a[1])
            .map(([country, count]) => ({ country, count }));
        } else {
          locationData = generateLocationData();
        }
      } else {
        locationData = generateLocationData();
      }
      
      // Calculate session duration based on available data or use mock
      sessionDuration = siteStatsData.sessionDuration || generateSessionDuration();
    } else {
      // Generate realistic mock data that includes the current session
      dataSource = 'mock';
      visitors = 1289;
      pageViews = 3547;
      recentVisitors = generateRecentVisitors();
      popularContent = generatePopularContent();
      locationData = generateLocationData();
      sessionDuration = generateSessionDuration();
    }
    
    // Add current user as a visitor to the recent visitors data
    if (recentVisitors.length > 0) {
      // If there's data for today (last entry), increment it by 1 for your current visit
      recentVisitors[recentVisitors.length - 1] += 1;
    }
    
    return res.status(200).json({
      success: true,
      data: {
        posts: publishedPostsCount,
        books: booksCount,
        signals: signalsCount,
        visitors,
        pageViews,
        recentVisitors,
        popularContent,
        locationData,
        sessionDuration,
        dataSource
      }
    });
    
    // Helper functions to generate mock data
    function generateRecentVisitors(): number[] {
      // Generate last 7 days of visitor data with today having at least 1 visitor (you)
      return [45, 29, 35, 23, 30, 51, 1];
    }
    
    function generatePopularContent(): Array<{name: string, views: number}> {
      return [
        { name: 'Homepage', views: 850 },
        { name: 'Blog', views: 643 },
        { name: 'Books', views: 492 },
        { name: 'CV', views: 412 },
        { name: 'Signals', views: 328 }
      ];
    }
    
    function generateLocationData(): Array<{country: string, count: number}> {
      return [
        { country: 'United States', count: 682 },
        { country: 'United Kingdom', count: 128 },
        { country: 'Canada', count: 103 },
        { country: 'Germany', count: 92 },
        { country: 'Australia', count: 76 },
        { country: 'Other', count: 208 }
      ];
    }
    
    function generateSessionDuration() {
      return {
        average: 2.7, // 2.7 minutes average
        distribution: [
          { range: '0-30s', count: 342 },
          { range: '30s-2m', count: 403 },
          { range: '2m-5m', count: 287 },
          { range: '5m-10m', count: 178 },
          { range: '10m+', count: 79 }
        ]
      };
    }
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Wrapper to handle authentication
 */
export default async function(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check for development environment
    const nodeEnv = process.env.NODE_ENV as string;
    if (nodeEnv === 'development') {
      // In development, we'll allow access without authentication
      console.log('Development mode: bypassing authentication for dashboard stats');
      return handler(req, res);
    }
    
    // Validate the authentication token
    const uid = await validateFirebaseIdToken(req);
    
    // Check for development token (from fetch-json.ts)
    const authHeader = req.headers.authorization;
    const isDevToken = authHeader === 'Bearer dev-token' && nodeEnv === 'development';
    
    if (!uid && !isDevToken) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized access'
      });
    }
    
    // If authenticated, proceed to handler
    return handler(req, res);
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during authentication'
    });
  }
};
