import type { NextApiRequest, NextApiResponse } from 'next';
// Removed Firestore import. Use server-side API or stubbed logic.

type FeedbackResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

type FeedbackData = {
  category: string;
  feedback: string;
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
    const { category, feedback } = req.body as FeedbackData;
    
    // Validate required fields
    if (!category || !feedback) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: category and feedback are required' 
      });
    }
    
    // TODO: Replace with server-side API call to store feedback
    // Placeholder: Simulate successful feedback submission
    return res.status(200).json({ 
      success: true, 
      message: 'Feedback submitted successfully (stub)' 
    });
  } catch (error: any) {
    console.error('Error processing feedback:', error);
    
    return res.status(500).json({
      success: false,
      error: `Error processing feedback: ${error.message}`
    });
  }
}
