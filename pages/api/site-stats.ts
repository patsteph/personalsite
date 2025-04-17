import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeAdminApp, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeAdminApp();
const db = getAdminFirestore();

const STATS_COLLECTION = 'site-stats'; // Corrected collection name
const STATS_DOC_ID = 'stats';

// Define a default structure for stats if the document doesn't exist
const defaultStats = {
  totalVisits: 0,
  pageVisits: { // Example specific page counters
    home: 0,
    blog: 0,
    books: 0,
    contact: 0,
    // Add more specific pages if needed
  },
  totalBlogPostVisits: 0, // Aggregate count for all blog posts
  feedbackCount: 0,
  reactions: { 
    // Add specific reaction types as needed
    thumbsUp: 0,
    celebrate: 0,
    insightful: 0,
    meh: 0,
    total: 0 // Sum of all reaction types
  },
  lastUpdated: null // Or Timestamp.now() on update
};

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
  const statsDocRef = db.collection(STATS_COLLECTION).doc(STATS_DOC_ID);
  
  // --- GET Request: Fetch Site Stats --- 
  if (req.method === 'GET') {
    try {
        console.log('Site Stats API: Processing GET request.');
        const docSnap = await statsDocRef.get();

        if (docSnap.exists) {
            console.log('Site Stats API: Found stats document.');
            const data = docSnap.data()!;
            // Convert timestamp if needed, though might not be necessary for frontend
            if (data.lastUpdated instanceof Timestamp) {
                data.lastUpdated = data.lastUpdated.toDate().toISOString();
            }
            return res.status(200).json({ success: true, data });
        } else {
            console.log('Site Stats API: Stats document not found, returning defaults.');
            // Return default stats if document doesn't exist
            return res.status(200).json({ success: true, data: defaultStats });
        }
    } catch (error: any) {
        console.error('Site Stats API GET error:', error);
        return res.status(500).json({ success: false, error: `Internal server error getting stats: ${error.message}` });
    }
  }
  
  // --- POST Request: Track Site Interactions --- 
  if (req.method === 'POST') {
    try {
        console.log('Site Stats API: Processing POST request with body:', req.body);
        const { action, ...payload } = req.body;

        if (!action || typeof action !== 'string') {
            return res.status(400).json({ success: false, error: 'Missing or invalid required field: action (string)' });
        }

        const increment = FieldValue.increment(1);
        let updateData: { [key: string]: any } = { 
            lastUpdated: FieldValue.serverTimestamp() // Update timestamp on any tracked action
        };

        switch (action) {
            case 'trackPageVisit':
                // Increment total visits
                updateData['totalVisits'] = increment;
                // Increment specific page counter if provided and valid
                if (payload.page && typeof payload.page === 'string') {
                    // Sanitize page key (e.g., replace '/' with '_' or use a map)
                    // Simple example: use predefined keys like 'home', 'blog', 'books'
                    const pageKey = payload.page.replace('/', '') || 'home'; // Treat '/' as 'home'
                    if (defaultStats.pageVisits.hasOwnProperty(pageKey)) {
                         updateData[`pageVisits.${pageKey}`] = increment;
                         console.log(`Site Stats API: Incrementing pageVisits.${pageKey}`);
                    } else {
                        console.warn(`Site Stats API: Unknown page key for tracking: ${pageKey}`);
                    }
                } else if (payload.isBlogPost) {
                    // Specific handling for blog posts if needed
                    updateData['totalBlogPostVisits'] = increment;
                    console.log(`Site Stats API: Incrementing totalBlogPostVisits`);
                } else {
                     console.warn(`Site Stats API: trackPageVisit called without valid 'page' or 'isBlogPost' flag.`);
                }
                break;

            case 'trackReaction':
                if (payload.type && typeof payload.type === 'string' && defaultStats.reactions.hasOwnProperty(payload.type)) {
                    updateData[`reactions.${payload.type}`] = increment;
                    updateData['reactions.total'] = increment; // Also increment total reactions
                    console.log(`Site Stats API: Incrementing reactions.${payload.type} and reactions.total`);
                } else {
                    console.warn(`Site Stats API: trackReaction called with invalid or missing 'type': ${payload.type}`);
                    // Don't fail the request, just log a warning
                    return res.status(200).json({ success: true, message: `Action '${action}' processed, but reaction type invalid or missing.` });
                }
                break;
            
            case 'trackFeedbackSubmission':
                updateData['feedbackCount'] = increment;
                console.log(`Site Stats API: Incrementing feedbackCount`);
                break;

            // Add more actions as needed

            default:
                console.warn(`Site Stats API: Unknown action received: ${action}`);
                return res.status(400).json({ success: false, error: `Unknown action: ${action}` });
        }

        // Atomically update the document, creating it if it doesn't exist
        console.log('Site Stats API: Updating stats document with:', updateData);
        await statsDocRef.set(updateData, { merge: true });
        console.log('Site Stats API: Stats document updated successfully.');

        return res.status(200).json({ success: true, message: `Action '${action}' processed successfully.` });

    } catch (error: any) {
        console.error('Site Stats API POST error:', error);
        // Check for specific Firestore errors if necessary
        return res.status(500).json({ success: false, error: `Internal server error processing action: ${error.message}` });
    }
  }
  
  // --- Method Not Allowed --- 
  console.log(`Site Stats API: Method ${req.method} not allowed.`);
  res.setHeader('Allow', ['GET', 'POST']); // Only allow GET and POST
  return res.status(405).json({
    success: false,
    error: `Method ${req.method} Not Allowed`
  });
}