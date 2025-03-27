/**
 * Content Manager POST API endpoint for creating signals/newsletters/articles
 * Using a completely different naming pattern to avoid middleware issues
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';
import { validateFirebaseIdToken } from '@/lib/api/server-auth';
import { Signal, Newsletter, Article } from '@/types/signals';

// Configure API to handle both JSON and form data
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  console.log('CONTENT-MANAGER-POST API:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed - Only POST is supported on this endpoint`
    });
  }

  // Authenticate the request
  try {
    const userId = await validateFirebaseIdToken(req);
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized - Authentication required'
      });
    }
    console.log('User authenticated:', userId);
  } catch (authError) {
    console.error('Authentication error:', authError);
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication failed',
      details: authError instanceof Error ? authError.message : String(authError)
    });
  }
  
  // Use Firestore Admin instance
  if (!firestore) {
    return res.status(500).json({ 
      success: false, 
      error: 'Firestore not initialized' 
    });
  }
  
  // Collection name
  const SIGNALS_COLLECTION = 'signals';
  
  // Log request body for debugging
  if (req.body) {
    console.log('Request body:', 
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    );
  }
  
  try {
    const signalData = req.body;
    
    // Validate required fields
    if (!signalData.title || !signalData.description || !signalData.url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, and url are required'
      });
    }

    // Type-specific validation
    if (signalData.type === 'newsletter' && !signalData.publisher) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields for newsletter: publisher is required'
      });
    }

    if (signalData.type === 'article' && (!signalData.author || !signalData.source)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields for article: author and source are required'
      });
    }
    
    // Add some required fields if missing
    const enhancedSignalData = {
      ...signalData,
      dateAdded: signalData.dateAdded || new Date().toISOString(),
      featured: signalData.featured || false,
      tags: signalData.tags || []
    };
    
    const docRef = await firestore.collection(SIGNALS_COLLECTION).add(enhancedSignalData);
    
    return res.status(201).json({
      success: true,
      message: 'Signal created successfully',
      data: {
        id: docRef.id,
        ...enhancedSignalData
      }
    });
  } catch (error) {
    console.error('Error in content-manager-post API:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}