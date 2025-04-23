import type { NextApiRequest, NextApiResponse } from 'next';
import { collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, setDoc } from 'firebase/firestore';
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminAnalyticsResponse>
) {
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
    // Support both 'type' and 'dataType' parameters for backward compatibility
    const analyticsType = (req.query.type || req.query.dataType) as string;
    
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
    
    // If dataType is specified, return only that specific data
    if (analyticsType === 'blog') {
      return res.status(200).json({
        success: true,
        data: blogEngagement
      });
    } else if (analyticsType === 'books') {
      return res.status(200).json({
        success: true,
        data: bookEngagement
      });
    }
    
    // Otherwise return the full dashboard data
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
    const firestore = getFirestore();
    
    // Initialize default values for reactions
    let totalReactions = 0;
    let reactions = {
      thumbsUp: 0,
      celebrate: 0,
      insightful: 0, // This will be mapped from 'brain' in our DB
      meh: 0
    };
    
    // Try getting the stats document first
    const statsDocRef = doc(firestore, 'stats', 'blogStats');
    const statsDoc = await getDoc(statsDocRef);
    
    let usedStatsDoc = false;
    if (statsDoc.exists()) {
      const data = statsDoc.data();
      if (data.reactions && Object.values(data.reactions).some((val: any) => val > 0)) {
        totalReactions = data.totalReactions || 0;
        
        // Map the reactions from the database to our expected format
        const dbReactions = data.reactions || {};
        reactions = {
          thumbsUp: dbReactions.thumbsUp || 0,
          celebrate: dbReactions.celebrate || 0,
          insightful: dbReactions.insightful || dbReactions.brain || 0, // Support both naming conventions
          meh: dbReactions.meh || 0
        };
        
        usedStatsDoc = true;
        console.log('Fetched blog reactions from Firestore stats doc:', reactions);
      }
    }
    
    // If the stats document doesn't exist or has no reactions, calculate from blog posts directly
    if (!usedStatsDoc) {
      console.log('Blog stats document does not exist or is empty, calculating from blog posts...');
      
      // Query blog posts to calculate total reactions
      const postsColRef = collection(firestore, 'blog-posts');
      const postsQuery = query(postsColRef, limit(100)); // Get up to 100 posts
      const postsSnapshot = await getDocs(postsQuery);
      
      // Sum up all reactions from blog posts
      postsSnapshot.forEach(doc => {
        if (doc.exists()) {
          const data = doc.data();
          const postReactions = data.reactions || {};
          
          // Add to our counters
          reactions.thumbsUp += postReactions.thumbsUp || 0;
          reactions.celebrate += postReactions.celebrate || 0;
          reactions.insightful += postReactions.brain || 0; // Map brain to insightful
          reactions.meh += postReactions.meh || 0;
        }
      });
      
      // Calculate total
      totalReactions = Object.values(reactions).reduce((sum, val) => sum + val, 0);
      console.log('Calculated blog reactions from posts:', reactions);
      
      // Attempt to create the stats document with these values (ignore errors)
      try {
        await setDoc(statsDocRef, {
          reactions: {
            thumbsUp: reactions.thumbsUp,
            celebrate: reactions.celebrate,
            brain: reactions.insightful,
            meh: reactions.meh
          },
          totalReactions: totalReactions,
          lastUpdated: new Date()
        });
        console.log('Created stats/blogStats document with calculated values');
      } catch (error) {
        console.error('Could not create stats document:', error);
        // We can still return the calculated values even if we couldn't save them
      }
    }
    
    // Get popular blog posts (top 5 by reaction count)
    const popularPosts = [];
    try {
      const postsColRef = collection(firestore, 'blog-posts');
      const postsQuery = query(postsColRef, limit(10)); // We'll sort them client-side by reactions
      const postsSnapshot = await getDocs(postsQuery);
      
      // Define an interface for blog post data
      interface BlogPost {
        id: string;
        title: string;
        slug: string;
        totalReactions: number;
        reactions: Record<string, number>;
      }
      
      // Convert to array and calculate total reactions per post
      const posts: BlogPost[] = [];
      postsSnapshot.forEach(doc => {
        const data = doc.data();
        const postReactions = data.reactions || {};
        const totalPostReactions = Object.values(postReactions).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
        
        posts.push({
          id: doc.id,
          title: data.title || 'Untitled Post',
          slug: data.slug || '',
          totalReactions: totalPostReactions,
          reactions: postReactions
        });
      });
      
      // Sort by totalReactions and take top 5
      const topPosts = posts
        .sort((a, b) => b.totalReactions - a.totalReactions)
        .slice(0, 5);
      
      popularPosts.push(...topPosts);
    } catch (postsError) {
      console.error('Error fetching popular blog posts:', postsError);
    }
    
    return {
      totalViews: 0, // This would come from a different tracking system
      avgReadTime: '0:00', // This would come from a different tracking system
      totalReactions,
      reactions,
      popularPosts
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
    const firestore = getFirestore();
    
    const feedbackColRef = collection(firestore, 'feedback');
    const q = query(feedbackColRef, orderBy('timestamp', 'desc'), limit(20));
    const snapshot = await getDocs(q);
    
    const feedbackItems: FeedbackItem[] = [];
    const categoryCounts: { [key: string]: number } = {};
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const category = data.category || 'uncategorized';
      
      const timestamp = data.timestamp?.toDate ? 
        data.timestamp.toDate().toISOString() : 
        (data.clientTimestamp || new Date().toISOString());
      
      feedbackItems.push({
        id: doc.id,
        category,
        feedback: data.feedback || '',
        page: data.page || 'unknown',
        timestamp,
        status: data.status || 'new',
        classification: data.classification || null
      });
      
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    const categoryStats: CategoryStat[] = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    let visitorCount = 0;
    try {
      const statsDocRef = doc(firestore, 'stats', 'siteStats');
      const statsDoc = await getDoc(statsDocRef);
      if (statsDoc.exists()) {
        visitorCount = statsDoc.data().visitorCount || 0;
      }
    } catch (statsError) {
      console.error('Error fetching visitor stats:', statsError);
    }

    const sentimentStats: SentimentStat[] = [
      { name: 'Positive', value: 0 },
      { name: 'Neutral', value: 0 },
      { name: 'Negative', value: 0 },
    ];
    
    feedbackItems.forEach(item => {
      const text = item.feedback.toLowerCase();
      if (text.match(/good|great|awesome|excellent|love|like|helpful|thanks|thank/)) {
        sentimentStats[0].value++; // Positive
      } else if (text.match(/bad|poor|terrible|hate|dislike|broken|issue|problem|fix/)) {
        sentimentStats[2].value++; // Negative
      } else {
        sentimentStats[1].value++; // Neutral
      }
    });
    
    let reactionStats = { thumbsUp: 0, celebrate: 0, insightful: 0, meh: 0, total: 0 };
    try {
      const statsDocRef = doc(firestore, 'stats', 'blogStats');
      const statsDoc = await getDoc(statsDocRef);
      if (statsDoc.exists()) {
        const data = statsDoc.data();
        const reactions = data.reactions || {};
        reactionStats = {
          thumbsUp: reactions.thumbsUp || 0,
          celebrate: reactions.celebrate || 0,
          insightful: reactions.insightful || reactions.brain || 0, // Support both naming conventions
          meh: reactions.meh || 0,
          total: data.totalReactions || 0
        };
      }
    } catch (reactionsError) {
      console.error('Error fetching reaction stats:', reactionsError);
    }
    
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
      reactionStats: { thumbsUp: 0, celebrate: 0, insightful: 0, meh: 0, total: 0 },
      visitorCount: 0
    };
  }
}