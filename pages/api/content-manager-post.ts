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

// Debug logging helper
function logDebug(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Content-Manager-POST: ${message}`);
  if (data) {
    console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  }
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  logDebug(`API Request: ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Log headers for debugging
  logDebug('Request headers:', req.headers);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    logDebug('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    logDebug(`Method not allowed: ${req.method}`);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed - Only POST is supported on this endpoint`
    });
  }

  // Authenticate the request
  try {
    logDebug('Validating authentication token');
    const userId = await validateFirebaseIdToken(req);
    
    if (!userId) {
      logDebug('Authentication failed - no user ID returned');
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized - Authentication required'
      });
    }
    
    logDebug(`User authenticated: ${userId}`);
  } catch (authError) {
    logDebug('Authentication error', authError);
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication failed',
      details: authError instanceof Error ? authError.message : String(authError)
    });
  }
  
  // Use Firestore Admin instance
  if (!firestore) {
    logDebug('Firestore not initialized');
    return res.status(500).json({ 
      success: false, 
      error: 'Firestore not initialized' 
    });
  }
  
  logDebug('Firestore instance available, proceeding with request');
  
  // Collection name
  const SIGNALS_COLLECTION = 'signals';
  
  // Log request body for debugging
  if (req.body) {
    logDebug('Request body:', req.body);
  } else {
    logDebug('Warning: Empty request body');
  }
  
  try {
    const signalData = req.body;
    
    // Validate required fields
    if (!signalData.title || !signalData.description || !signalData.url) {
      logDebug('Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, and url are required'
      });
    }

    // Type-specific validation
    if (signalData.type === 'newsletter' && !signalData.publisher) {
      logDebug('Validation failed: Missing newsletter-specific fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields for newsletter: publisher is required'
      });
    }

    if (signalData.type === 'article' && (!signalData.author || !signalData.source)) {
      logDebug('Validation failed: Missing article-specific fields');
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
    
    logDebug('Adding document to Firestore', enhancedSignalData);
    
    const docRef = await firestore.collection(SIGNALS_COLLECTION).add(enhancedSignalData);
    logDebug(`Document added with ID: ${docRef.id}`);
    
    return res.status(201).json({
      success: true,
      message: 'Signal created successfully',
      data: {
        id: docRef.id,
        ...enhancedSignalData
      }
    });
  } catch (error) {
    logDebug('Error in API handler', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}