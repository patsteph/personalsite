import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

type FeedbackResponse = {
  success: boolean;
  message?: string;
  error?: string;
  id?: string;
};

type FeedbackData = {
  category: string;
  feedback: string;
  page: string;
  timestamp?: string;
  sessionId?: string;
  referrer?: string | null;
  userAgent?: string | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FeedbackResponse>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: `Method ${req.method} not allowed` 
    });
  }

  try {
    const { category, feedback, page, timestamp, sessionId, referrer, userAgent } = req.body as FeedbackData;
    
    // Validate required fields
    if (!category || !feedback) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: category and feedback are required' 
      });
    }
    
    // Initialize Admin Firestore
    const db = getAdminFirestore();
    if (!db) {
      console.error('Admin Firestore instance not initialized');
      return res.status(500).json({
        success: false,
        error: 'Database connection error'
      });
    }
    
    // Prepare feedback document with Admin SDK formatting
    const feedbackDoc = {
      category,
      feedback,
      page: page || '/',
      timestamp: FieldValue.serverTimestamp(), // Use Admin SDK server timestamp
      clientTimestamp: timestamp || new Date().toISOString(),
      sessionId: sessionId || null,
      referrer: referrer || null,
      userAgent: userAgent || null,
      status: 'new',
      classification: null,
      createdAt: FieldValue.serverTimestamp(),
    };
    
    // Add document to Firestore using Admin SDK
    const docRef = await db.collection('feedback').add(feedbackDoc);
    
    console.log(`Feedback stored with ID: ${docRef.id}`);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      id: docRef.id
    });
  } catch (error: any) {
    console.error('Error processing feedback:', error);
    
    return res.status(500).json({
      success: false,
      error: `Error processing feedback: ${error.message}`
    });
  }
}
