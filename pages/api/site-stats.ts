import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeAdminApp, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeAdminApp();
const db = getAdminFirestore();

const STATS_COLLECTION = 'site-stats'; // Old collection for aggregated stats
const STATS_DOC_ID = 'stats'; // Old document ID
const TRACKING_EVENTS_COLLECTION = 'trackingEvents'; // New collection for individual events

// Define a default structure for stats if the document doesn't exist
// NOTE: This is for the OLD / GET endpoint. New data goes to TRACKING_EVENTS_COLLECTION.
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
  eventId?: string; // Add optional eventId for POST response
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
        
        // --- New Logic for Individual Event Tracking --- 
        const eventPayload = req.body; // Assume body matches TrackingEventData structure

        // Basic validation of the new payload structure
        if (!eventPayload || typeof eventPayload !== 'object') {
          return res.status(400).json({ success: false, error: 'Invalid request body: expected an object.' });
        }
        
        const { eventType, sessionId, pathname, timestamp, referrer, userAgent, eventData } = eventPayload;
        
        if (!eventType || !sessionId || !pathname || !timestamp) {
          return res.status(400).json({ success: false, error: 'Missing required tracking fields: eventType, sessionId, pathname, timestamp' });
        }
        
        // Prepare data for Firestore
        const dataToSave = {
            eventType,
            sessionId,
            pathname,
            timestamp: Timestamp.fromDate(new Date(timestamp)), // Convert ISO string to Firestore Timestamp
            referrer: referrer || null, // Ensure null if missing/empty
            userAgent: userAgent || null, // Ensure null if missing/empty
            ...(eventData && { eventData: eventData }), // Include eventData if present
            receivedAt: FieldValue.serverTimestamp() // Add server timestamp for processing time
        };
        
        // Add the event as a new document in the trackingEvents collection
        const docRef = await db.collection(TRACKING_EVENTS_COLLECTION).add(dataToSave);
        console.log('Site Stats API: Saved tracking event with ID:', docRef.id);
        
        return res.status(201).json({ success: true, message: 'Event tracked successfully.', eventId: docRef.id });

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