import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

type SiteStatsResponse = {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SiteStatsResponse>
) {
  console.log('Site Stats API received', req.method, 'request');
  
  // GET request to fetch site stats
  if (req.method === 'GET') {
    try {
      const statsRef = firestore.collection('site-stats').doc('global');
      const statsSnapshot = await statsRef.get();
      
      if (statsSnapshot.exists) {
        return res.status(200).json({
          success: true,
          data: statsSnapshot.data()
        });
      } else {
        // Return empty stats if document doesn't exist
        return res.status(200).json({
          success: true,
          data: {
            visits: 0,
            blogVisits: 0,
            bookVisits: 0,
            contactVisits: 0,
            feedbackCount: 0,
            reactions: {
              thumbsUp: 0,
              celebrate: 0,
              insightful: 0,
              meh: 0,
              total: 0
            }
          }
        });
      }
    } catch (error) {
      console.error('Error fetching site stats:', error);
      return res.status(500).json({
        success: false,
        error: `Error fetching site stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
  
  // POST request to track various site interactions
  if (req.method === 'POST') {
    try {
      const { action, type, details } = req.body;
      
      if (!action) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: action'
        });
      }
      
      // Reference to the stats document
      const statsRef = firestore.collection('site-stats').doc('global');
      const statsSnapshot = await statsRef.get();
      
      // Different actions to track
      if (action === 'visit') {
        // Track general site visit
        if (statsSnapshot.exists) {
          await statsRef.update({
            'visits': admin.firestore.FieldValue.increment(1),
            'lastVisit': admin.firestore.FieldValue.serverTimestamp(),
            'lastUpdated': admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Create new stats document
          await statsRef.set({
            'visits': 1,
            'blogVisits': 0,
            'bookVisits': 0,
            'contactVisits': 0,
            'feedbackCount': 0,
            'lastVisit': admin.firestore.FieldValue.serverTimestamp(),
            'lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
            'reactions': {
              'thumbsUp': 0,
              'celebrate': 0,
              'insightful': 0,
              'meh': 0,
              'total': 0
            }
          });
        }
      } else if (action === 'pageView' && type) {
        // Track specific page type views (blog, books, etc.)
        if (statsSnapshot.exists) {
          const updateField = `${type}Visits`;
          const updateObj: Record<string, any> = {
            'lastUpdated': admin.firestore.FieldValue.serverTimestamp()
          };
          updateObj[updateField] = admin.firestore.FieldValue.increment(1);
          
          await statsRef.update(updateObj);
        } else {
          // Create new stats document with the specific page type
          const initialData: Record<string, any> = {
            'visits': 0,
            'blogVisits': 0,
            'bookVisits': 0,
            'contactVisits': 0,
            'feedbackCount': 0,
            'lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
            'reactions': {
              'thumbsUp': 0,
              'celebrate': 0,
              'insightful': 0,
              'meh': 0,
              'total': 0
            }
          };
          initialData[`${type}Visits`] = 1;
          
          await statsRef.set(initialData);
        }
      } else if (action === 'userAction') {
        // Track user interactions (generic)
        console.log('Tracking user action:', type, details);
        
        // Log the action to a user-actions collection for detailed tracking
        await firestore.collection('user-actions').add({
          type,
          details,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
      } else if (action === 'bookInteraction') {
        // Track book-specific interactions
        console.log('Tracking book interaction:', details);
        
        // Increment book-specific counters
        if (details?.interactionType === 'search') {
          // Track searches in book-stats
          const bookStatsRef = firestore.collection('book-stats').doc('global');
          const bookStatsSnapshot = await bookStatsRef.get();
          
          if (bookStatsSnapshot.exists) {
            await bookStatsRef.update({
              'searchCount': admin.firestore.FieldValue.increment(1),
              'lastUpdated': admin.firestore.FieldValue.serverTimestamp()
            });
          } else {
            await bookStatsRef.set({
              'searchCount': 1,
              'filterCount': 0,
              'lastUpdated': admin.firestore.FieldValue.serverTimestamp()
            });
          }
        } else if (details?.interactionType === 'filter') {
          // Track filters in book-stats
          const bookStatsRef = firestore.collection('book-stats').doc('global');
          const bookStatsSnapshot = await bookStatsRef.get();
          
          if (bookStatsSnapshot.exists) {
            await bookStatsRef.update({
              'filterCount': admin.firestore.FieldValue.increment(1),
              'lastUpdated': admin.firestore.FieldValue.serverTimestamp()
            });
          } else {
            await bookStatsRef.set({
              'searchCount': 0,
              'filterCount': 1,
              'lastUpdated': admin.firestore.FieldValue.serverTimestamp()
            });
          }
        } else if (details?.interactionType === 'detail' && details?.book_id) {
          // Track book detail views
          const bookRef = firestore.collection('books').doc(details.book_id);
          await bookRef.update({
            'detailViews': admin.firestore.FieldValue.increment(1),
            'lastViewed': admin.firestore.FieldValue.serverTimestamp()
          });
        }
        
        // Log all book interactions for detailed analysis
        await firestore.collection('book-interactions').add({
          ...details,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
      } else if (action === 'blogInteraction') {
        // Track blog-specific interactions
        console.log('Tracking blog interaction:', details);
        
        // Log all blog interactions for detailed analysis
        await firestore.collection('blog-interactions').add({
          ...details,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
      } else if (action === 'contactInteraction') {
        // Track contact-specific interactions
        console.log('Tracking contact interaction:', details);
        
        // Increment the contactVisits counter in global stats
        if (statsSnapshot.exists) {
          await statsRef.update({
            'contactVisits': admin.firestore.FieldValue.increment(1),
            'lastUpdated': admin.firestore.FieldValue.serverTimestamp()
          });
        }
        
        // Log all contact interactions for detailed analysis
        await firestore.collection('contact-interactions').add({
          ...details,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      return res.status(200).json({
        success: true,
        message: `${action} tracked successfully`
      });
    } catch (error) {
      console.error('Error tracking site stats:', error);
      return res.status(500).json({
        success: false,
        error: `Error tracking site stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
  
  // Handle other HTTP methods
  return res.status(405).json({
    success: false,
    error: `Method ${req.method} not allowed`
  });
}