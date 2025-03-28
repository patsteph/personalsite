/**
 * Simple signals API endpoint based on the working basic-test pattern
 * This implementation avoids middleware and complex dependencies
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';
import { validateFirebaseIdToken } from '@/lib/api/server-auth';
import { Signal } from '@/types/signals';

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
  console.log(`[${timestamp}] SIGNALS-BASIC: ${message}`);
  if (data) {
    console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  }
}

// Collection name
const SIGNALS_COLLECTION = 'signals';

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  // Log everything to help debug
  logDebug('API called', {
    method: req.method,
    url: req.url,
    query: req.query,
    bodyPresent: !!req.body
  });
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    logDebug('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  // Check Firestore
  if (!firestore) {
    logDebug('Firestore not initialized');
    return res.status(500).json({ 
      success: false, 
      error: 'Firestore not initialized' 
    });
  }
  
  // Handle GET request (read signals)
  if (req.method === 'GET') {
    logDebug('Handling GET request');
    
    try {
      // Get all signals from Firestore
      logDebug(`Querying ${SIGNALS_COLLECTION} collection`);
      const signalsSnapshot = await firestore.collection(SIGNALS_COLLECTION)
        .orderBy('dateAdded', 'desc')
        .get();
      
      const signals = signalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Signal[];
      
      logDebug(`Found ${signals.length} signals`);
      
      return res.status(200).json({
        success: true,
        data: signals
      });
    } catch (error) {
      logDebug('Error in GET handler', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Handle POST request (create signal)
  if (req.method === 'POST') {
    logDebug('Handling POST request', req.body);
    
    // First validate authentication
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
      logDebug('Error in POST handler', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Fallback for other methods
  logDebug(`Method ${req.method} not implemented`);
  return res.status(405).json({
    success: false,
    error: `Method ${req.method} not implemented`
  });
}