import type { NextApiRequest, NextApiResponse } from 'next';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

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
    
    // Ensure we have a Firestore instance
    if (!db) {
      console.error('Firestore instance not initialized');
      return res.status(500).json({
        success: false,
        error: 'Database connection error'
      });
    }
    
    // Store feedback in Firestore
    const feedbackCollectionRef = collection(db, 'feedback');
    
    // Prepare feedback document
    const feedbackDoc = {
      category,
      feedback,
      page: page || '/',
      timestamp: serverTimestamp(), // Use server timestamp for consistent timing
      clientTimestamp: timestamp || new Date().toISOString(), // Also store the client timestamp
      sessionId: sessionId || null,
      referrer: referrer || null,
      userAgent: userAgent || null,
      status: 'new', // Initial status
      classification: null, // No sentiment classification initially
      createdAt: serverTimestamp(),
    };
    
    // Add document to Firestore
    const docRef = await addDoc(feedbackCollectionRef, feedbackDoc);
    
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
