import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { withAuth } from '@/lib/api/with-auth';
import { CVData } from '@/types/cv';

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: CVData;
  error?: string;
}

/**
 * Handle CV data API requests
 * - GET: Retrieve CV data from Firestore
 * - POST: Save CV data to Firestore
 */
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    const db = getAdminFirestore();
    const cvRef = db.collection('content').doc('cv');
    
    // Handle GET request - retrieve CV data
    if (req.method === 'GET') {
      const doc = await cvRef.get();
      
      if (doc.exists) {
        const data = doc.data() as CVData;
        return res.status(200).json({
          success: true,
          data
        });
      } else {
        // Return empty data if no document exists yet
        return res.status(200).json({
          success: true,
          data: {
            about: '',
            experience: [],
            skills: [],
            education: [],
            Training: [],
            publications: [],
            languages: [],
            projects: [],
            testimonials: []
          } as CVData
        });
      }
    }
    
    // Handle POST request - save CV data
    if (req.method === 'POST') {
      const cvData = req.body as CVData;
      
      // Validate data
      if (!cvData) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request: CV data is required'
        });
      }
      
      // Save data to Firestore
      await cvRef.set(cvData, { merge: true });
      
      return res.status(200).json({
        success: true,
        message: 'CV data saved successfully'
      });
    }
    
    // Handle unsupported methods
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`
    });
    
  } catch (error) {
    console.error('CV API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

export default withAuth(handler);
