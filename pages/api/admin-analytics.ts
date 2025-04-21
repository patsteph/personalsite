import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeAdminApp, getAdminFirestore } from '@/lib/firebase-admin';
import { Timestamp, CollectionReference, DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { validateFirebaseIdToken } from '@/lib/api/server-auth';

type FeedbackItem = {
  id: string;
  category: string;
  feedback: string;
  page: string;
  timestamp: string; 
  classification?: string;
  status: string;
}

type CategoryStat = {
  name: string;
  count: number;
}

type SentimentStat = {
  name: string;
  value: number;
}

type ReactionCounts = {
  thumbsUp: number;
  celebrate: number;
  insightful: number;
  meh: number;
  total: number;
}

type FeedbackAnalyticsData = {
  feedbackItems: FeedbackItem[];
  categoryStats: CategoryStat[];
  sentimentStats: SentimentStat[]; 
  reactionStats: ReactionCounts; 
  visitorCount: number; 
}

type AdminAnalyticsResponse = {
  success: boolean;
  data?: FeedbackAnalyticsData | Record<string, any>; 
  error?: string;
}

let db: FirebaseFirestore.Firestore | null;
try {
  console.log('Admin Analytics API: Initializing Firebase Admin...');
  initializeAdminApp();
  db = getAdminFirestore();
  console.log('Admin Analytics API: Firebase Admin initialized.');
} catch (initError: any) {
  console.error('Admin Analytics API: CRITICAL FIREBASE INIT ERROR:', initError);
  db = null; 
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminAnalyticsResponse>
) {
  if (!db) {
    console.error('Admin Analytics API: Handler entered but Firebase Admin SDK failed to initialize.');
    return res.status(500).json({ success: false, error: 'Internal Server Error: Firebase initialization failed.' });
  }

  const uid = await validateFirebaseIdToken(req);
  
  if (!uid) {
    console.error('Admin analytics: Authentication failed - invalid or missing token');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: You must be logged in as an admin to access analytics'
    });
  }
  
  console.log(`Admin analytics: Authenticated user with UID ${uid}`);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} not allowed` 
    });
  }
  
  try {
    const analyticsType = req.query.type as string;
    
    if (analyticsType === 'feedback') {
      const feedbackAnalytics = await getFeedbackAnalytics();
      return res.status(200).json({
        success: true,
        data: feedbackAnalytics
      });
    }
    
    let statsData = {};
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

    const topPages = await getTopPages();
    const bookEngagement = await getBookEngagement();
    const blogEngagement = await getBlogEngagement();
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

async function getTopPages() {
  try {
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

async function getBookEngagement() {
  try {
    return {
      totalViews: 0,
      totalDetailViews: 0,
      searchCount: 0,
      filterCount: 0,
      popularBooks: []
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

async function getBlogEngagement() {
  try {
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

async function getFeedbackAnalytics(): Promise<FeedbackAnalyticsData> {
  try {
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const feedbackCollection = db.collection('feedback');
    const snapshot = await feedbackCollection.orderBy('timestamp', 'desc').get();

    const feedbackItems: FeedbackItem[] = [];
    const categoryCounts: { [key: string]: number } = {};

    snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      const category = data.category || 'uncategorized';

      feedbackItems.push({
        id: doc.id,
        category: category,
        feedback: data.feedback || '',
        page: data.page || '',
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
        classification: data.classification, 
        status: data.status || 'new', 
      });

      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const categoryStats: CategoryStat[] = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
    }));

    const sentimentStats: SentimentStat[] = []; 
    const reactionStats: ReactionCounts = { 
      thumbsUp: 0,
      celebrate: 0,
      insightful: 0,
      meh: 0,
      total: 0
    };
    const visitorCount = 0; 

    return {
      feedbackItems,
      categoryStats,
      sentimentStats,
      reactionStats,
      visitorCount,
    };
  } catch (error) {
    console.error('Error getting feedback analytics:', error);
    return {
      feedbackItems: [],
      categoryStats: [],
      sentimentStats: [],
      reactionStats: { thumbsUp: 0, celebrate: 0, insightful: 0, meh: 0, total: 0 },
      visitorCount: 0,
    };
  }
}