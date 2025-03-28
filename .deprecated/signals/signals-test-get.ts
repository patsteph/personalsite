/**
 * Ultra-simplified signal listing endpoint - GET only
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('SIGNALS-TEST-GET API called');
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  // Only handle GET and OPTIONS
  if (req.method !== 'GET' && req.method !== 'OPTIONS') {
    return res.status(405).json({ 
      error: 'Method not allowed', 
      message: 'This endpoint only supports GET requests'
    });
  }
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Access Firestore
    console.log('Accessing Firestore...');
    const signalsCollection = firestore.collection('signals');
    
    // Get most recent signals
    console.log('Querying signals collection...');
    const snapshot = await signalsCollection
      .orderBy('dateAdded', 'desc')
      .limit(10)
      .get();
    
    // Convert to array
    console.log('Processing query results...');
    const signals: Array<Record<string, any>> = [];
    snapshot.forEach(doc => {
      signals.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Found ${signals.length} signals`);
    
    // Return success
    return res.status(200).json({
      success: true,
      message: 'Signals retrieved successfully',
      count: signals.length,
      signals
    });
  } catch (error) {
    console.error('Error in signals-test-get:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}