/**
 * Content Manager GET API endpoint for retrieving signals/newsletters/articles
 * Using a completely different naming pattern to avoid middleware issues
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';
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
  console.log(`[${timestamp}] Content-Manager-GET: ${message}`);
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    logDebug('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    logDebug(`Method not allowed: ${req.method}`);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed - Only GET is supported on this endpoint`
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
  
  logDebug('Firestore instance available, proceeding with query');
  
  // Collection name
  const SIGNALS_COLLECTION = 'signals';
  
  try {
    // Get all signals
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
    logDebug('Error in API handler', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}