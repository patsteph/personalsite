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

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  console.log('CONTENT-MANAGER-GET API:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed - Only GET is supported on this endpoint`
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
  
  try {
    // Get all signals
    const signalsSnapshot = await firestore.collection(SIGNALS_COLLECTION)
      .orderBy('dateAdded', 'desc')
      .get();
    
    const signals = signalsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Signal[];
    
    return res.status(200).json({
      success: true,
      data: signals
    });
  } catch (error) {
    console.error('Error in content-manager-get API:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}