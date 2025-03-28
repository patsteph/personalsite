/**
 * Ultra Simple Signal API - Direct GET Only
 * This endpoint specifically handles GET requests only, with minimal complexity
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  // Set essential CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  
  // Log basic information about the request
  console.log('SIGNALS-DIRECT-GET API CALLED:', req.method);
  
  // Handle OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  // Only handle GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'This endpoint only accepts GET requests'
    });
  }
  
  try {
    // Initialize Firestore
    const signalsCollection = firestore.collection('signals');
    
    // Retrieve signals from Firestore
    console.log('Attempting to retrieve signals from Firestore');
    const snapshot = await signalsCollection.orderBy('dateAdded', 'desc').limit(20).get();
    
    // Process results
    const signals: any[] = [];
    snapshot.forEach(doc => {
      signals.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Retrieved ${signals.length} signals from Firestore`);
    
    // Return success
    return res.status(200).json({
      success: true,
      message: `Retrieved ${signals.length} signals from Firestore`,
      data: signals,
      count: signals.length
    });
  } catch (error) {
    console.error('Error in signals-direct-get API:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An error occurred retrieving signals',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}