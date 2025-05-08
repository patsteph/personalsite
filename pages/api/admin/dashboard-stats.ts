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
    
    // Get count of blog posts
    const postsSnapshot = await db.collection('posts').where('published', '==', true).get();
    const postsCount = postsSnapshot.size;
    
    // Get count of books
    const booksSnapshot = await db.collection('books').get();
    const booksCount = booksSnapshot.size;
    
    // Get count of signals
    const signalsSnapshot = await db.collection('signals').get();
    const signalsCount = signalsSnapshot.size;

    // For analytics data, we'll get this from a dedicated analytics collection
    // For now, using realistic mock data until analytics collection is set up
    const visitors = 1289;
    const pageViews = 3547;
    const recentVisitors = [45, 29, 35, 23, 30, 51, 42];
    const popularContent = [
      { name: 'Homepage', views: 850 },
      { name: 'Blog', views: 643 },
      { name: 'Books', views: 492 },
      { name: 'CV', views: 412 },
      { name: 'Signals', views: 328 }
    ];
    
    return res.status(200).json({
      success: true,
      data: {
        posts: postsCount,
        books: booksCount,
        signals: signalsCount,
        visitors,
        pageViews,
        recentVisitors,
        popularContent
      }
    });
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
    // Validate the authentication token
    const uid = await validateFirebaseIdToken(req);
    
    if (!uid) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized access'
      });
    }
    
    // Proceed to handler if authenticated
    return handler(req, res);
  } catch (error) {
    console.error('Dashboard stats API authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access'
    });
  }
};
