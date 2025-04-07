import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';

type FeedbackResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

type FeedbackData = {
  category: string;
  feedback: string;
  page: string;
  timestamp: string;
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
    const { category, feedback, page, timestamp } = req.body as FeedbackData;
    
    // Validate required fields
    if (!category || !feedback) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: category and feedback are required' 
      });
    }
    
    // Store in Firestore
    await firestore.collection('feedback').add({
      category,
      feedback,
      page: page || 'unknown',
      timestamp: timestamp || new Date().toISOString(),
      status: 'new',
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Feedback submitted successfully' 
    });
  } catch (error: any) {
    console.error('Error processing feedback:', error);
    
    return res.status(500).json({
      success: false,
      error: `Error processing feedback: ${error.message}`
    });
  }
}
