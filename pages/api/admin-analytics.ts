import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';
import { verifyAdminSession } from '@/lib/api/server-auth';

type AdminAnalyticsResponse = {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminAnalyticsResponse>
) {
  // Verify the user is authenticated and has admin access
  const isAdmin = await verifyAdminSession(req);
  
  if (!isAdmin) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: You must be logged in as an admin to access analytics'
    });
  }
  
  // Only GET requests are supported
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} not allowed` 
    });
  }
  
  try {
    // Check if we're requesting a specific type of analytics
    const analyticsType = req.query.type as string;
    
    if (analyticsType === 'feedback') {
      // Return feedback-specific analytics
      const feedbackAnalytics = await getFeedbackAnalytics();
      return res.status(200).json({
        success: true,
        data: feedbackAnalytics
      });
    }
    
    // Fetch site statistics from Firestore
    const statsRef = firestore.collection('site-stats').doc('global');
    const statsSnapshot = await statsRef.get();
    
    let statsData = {};
    
    if (statsSnapshot.exists) {
      statsData = statsSnapshot.data() || {};
    } else {
      // Return default data if no stats exist yet
      statsData = {
        visits: 0,
        blogVisits: 0,
        bookVisits: 0,
        contactVisits: 0,
        feedbackCount: 0,
        lastVisit: null,
        lastUpdated: null,
        reactions: {
          thumbsUp: 0,
          celebrate: 0,
          insightful: 0,
          meh: 0,
          total: 0
        }
      };
    }
    
    // Get additional analytics data
    
    // 1. Get top pages data
    const topPages = await getTopPages();
    
    // 2. Get book engagement data
    const bookEngagement = await getBookEngagement();
    
    // 3. Get blog engagement data
    const blogEngagement = await getBlogEngagement();
    
    // Combine all data for the admin dashboard
    const dashboardData = {
      siteStats: statsData,
      topPages,
      bookEngagement,
      blogEngagement
    };
    
    return res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return res.status(500).json({
      success: false,
      error: `Error fetching admin analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

// Helper function to get top pages data
async function getTopPages() {
  try {
    // This could be enhanced to query real page view data if you have that collection
    // For now, we'll return sample data structured the same way
    return [
      { path: '/books', views: 428, avgTime: '5:12', bounceRate: 31.2 },
      { path: '/', views: 389, avgTime: '2:45', bounceRate: 42.8 },
      { path: '/blog', views: 298, avgTime: '6:18', bounceRate: 28.5 },
      { path: '/cv', views: 143, avgTime: '4:05', bounceRate: 35.7 }
    ];
  } catch (error) {
    console.error('Error getting top pages:', error);
    return [];
  }
}

// Helper function to get book engagement data
async function getBookEngagement() {
  try {
    const booksRef = firestore.collection('books');
    const booksSnapshot = await booksRef.orderBy('views', 'desc').limit(10).get();
    
    const books: Array<{
      id: string;
      title: string;
      views: number;
      detailViews: number;
      engagement: string;
    }> = [];
    let totalViews = 0;
    let totalDetailViews = 0;
    
    booksSnapshot.forEach(doc => {
      const data = doc.data();
      books.push({
        id: doc.id,
        title: data.title,
        views: data.views || 0,
        detailViews: data.detailViews || 0,
        engagement: data.views > 0 ? ((data.detailViews || 0) / data.views * 100).toFixed(1) + '%' : '0%'
      });
      
      totalViews += (data.views || 0);
      totalDetailViews += (data.detailViews || 0);
    });
    
    // If no books found, return default data
    if (books.length === 0) {
      return {
        totalViews: 0,
        totalDetailViews: 0,
        searchCount: 0,
        filterCount: 0,
        popularBooks: []
      };
    }
    
    // Get book search and filter counts from site stats if available
    const statsRef = firestore.collection('book-stats').doc('global');
    const statsSnapshot = await statsRef.get();
    
    let searchCount = 0;
    let filterCount = 0;
    
    if (statsSnapshot.exists) {
      const statsData = statsSnapshot.data();
      searchCount = statsData?.searchCount || 0;
      filterCount = statsData?.filterCount || 0;
    }
    
    return {
      totalViews,
      totalDetailViews,
      searchCount,
      filterCount,
      popularBooks: books
    };
  } catch (error) {
    console.error('Error getting book engagement:', error);
    return {
      totalViews: 0,
      totalDetailViews: 0,
      searchCount: 0,
      filterCount: 0,
      popularBooks: []
    };
  }
}

// Helper function to get blog engagement data
async function getBlogEngagement() {
  try {
    const postsRef = firestore.collection('blog-posts');
    const postsSnapshot = await postsRef.orderBy('views', 'desc').limit(10).get();
    
    const posts: Array<{
      id: string;
      title: string;
      views: number;
      readTime: string;
      reactions: number;
    }> = [];
    let totalViews = 0;
    let totalReactions = 0;
    
    // Reaction counters
    const reactions = {
      thumbsUp: 0,
      celebrate: 0,
      insightful: 0,
      meh: 0
    };
    
    postsSnapshot.forEach(doc => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        title: data.title,
        views: data.views || 0,
        readTime: data.readTime || '3:00',
        reactions: (data.reactions?.total || 0)
      });
      
      totalViews += (data.views || 0);
      
      // Accumulate reactions
      if (data.reactions) {
        totalReactions += (data.reactions.total || 0);
        reactions.thumbsUp += (data.reactions.thumbsUp || 0);
        reactions.celebrate += (data.reactions.celebrate || 0);
        reactions.insightful += (data.reactions.insightful || 0);
        reactions.meh += (data.reactions.meh || 0);
      }
    });
    
    // Calculate average read time (placeholder)
    const avgReadTime = '4:26';
    
    return {
      totalViews,
      avgReadTime,
      totalReactions,
      reactions,
      popularPosts: posts
    };
  } catch (error) {
    console.error('Error getting blog engagement:', error);
    return {
      totalViews: 0,
      avgReadTime: '0:00',
      totalReactions: 0,
      reactions: {
        thumbsUp: 0,
        celebrate: 0,
        insightful: 0,
        meh: 0
      },
      popularPosts: []
    };
  }
}

// Helper function to get feedback analytics data
async function getFeedbackAnalytics() {
  try {
    // First, get site statistics for visitor count and reactions
    const statsRef = firestore.collection('site-stats').doc('global');
    const statsSnapshot = await statsRef.get();
    
    let visitorCount = 0;
    let reactionStats = {
      thumbsUp: 0,
      celebrate: 0,
      insightful: 0,
      meh: 0,
      total: 0
    };
    
    if (statsSnapshot.exists) {
      const statsData = statsSnapshot.data() || {};
      visitorCount = statsData.visits || 0;
      
      if (statsData.reactions) {
        reactionStats = {
          thumbsUp: statsData.reactions.thumbsUp || 0,
          celebrate: statsData.reactions.celebrate || 0,
          insightful: statsData.reactions.insightful || 0,
          meh: statsData.reactions.meh || 0,
          total: statsData.reactions.total || 0
        };
      }
    }
    
    // Fetch feedback data
    const feedbackRef = firestore.collection('feedback');
    const feedbackSnapshot = await feedbackRef.orderBy('timestamp', 'desc').get();
    
    const feedbackItems: Array<{
      id: string;
      category: string;
      feedback: string;
      page: string;
      timestamp: string;
      classification: string;
      status: string;
    }> = [];
    const categories: Record<string, number> = {};
    const sentiments: Record<string, number> = {
      positive: 0,
      neutral: 0,
      negative: 0,
      unclassified: 0
    };
    
    feedbackSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Process timestamps correctly for serialization
      let timestamp = data.timestamp;
      if (timestamp && typeof timestamp.toDate === 'function') {
        timestamp = timestamp.toDate().toISOString();
      } else if (timestamp) {
        // If it's a different format, convert to string
        timestamp = new Date(timestamp).toISOString();
      }
      
      const item = {
        id: doc.id,
        category: data.category || 'general',
        feedback: data.feedback || '',
        page: data.page || '',
        timestamp: timestamp,
        classification: data.classification || 'unclassified',
        status: data.status || 'new'
      };
      
      feedbackItems.push(item);
      
      // Accumulate category stats
      const category = item.category;
      categories[category] = (categories[category] || 0) + 1;
      
      // Accumulate sentiment stats
      const sentiment = item.classification || 'unclassified';
      sentiments[sentiment] = (sentiments[sentiment] || 0) + 1;
    });
    
    // Format for response
    const categoryStats = Object.keys(categories).map(key => ({
      name: key,
      count: categories[key]
    }));
    
    const sentimentStats = Object.keys(sentiments).map(key => ({
      name: key,
      value: sentiments[key]
    }));
    
    return {
      feedbackItems,
      categoryStats,
      sentimentStats,
      reactionStats,
      visitorCount
    };
  } catch (error) {
    console.error('Error getting feedback analytics:', error);
    return {
      feedbackItems: [],
      categoryStats: [],
      sentimentStats: [],
      reactionStats: {
        thumbsUp: 0,
        celebrate: 0,
        insightful: 0,
        meh: 0,
        total: 0
      },
      visitorCount: 0
    };
  }
}