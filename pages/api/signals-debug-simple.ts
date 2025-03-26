/**
 * Super simplified signals API endpoint to debug server issues
 * No authentication, direct Firestore access
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log everything for debugging
  console.log('SIGNALS-DEBUG-SIMPLE API CALLED:', req.method, req.url);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  // Log request details
  console.log('Request method:', req.method);
  if (req.body) {
    try {
      console.log('Request body:', typeof req.body === 'string' 
        ? req.body.substring(0, 200) 
        : JSON.stringify(req.body).substring(0, 200));
    } catch (e) {
      console.error('Error logging body:', e);
    }
  }
  
  try {
    // Initialize Firestore
    const signalsCollection = firestore.collection('signals');
    
    // HANDLE GET - List all signals
    if (req.method === 'GET') {
      console.log('Processing GET request - retrieving signals');
      
      try {
        // Get signals with minimal filtering
        const snapshot = await signalsCollection.orderBy('dateAdded', 'desc').limit(20).get();
        const signals: Array<Record<string, any>> = [];
        
        snapshot.forEach(doc => {
          signals.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log(`Retrieved ${signals.length} signals from Firestore`);
        
        return res.status(200).json({
          success: true,
          message: 'Signals retrieved successfully',
          data: signals,
          count: signals.length
        });
      } catch (error) {
        console.error('Error in GET operation:', error);
        return res.status(500).json({
          success: false,
          message: 'Error retrieving signals',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    
    // HANDLE POST - Create a signal
    if (req.method === 'POST') {
      console.log('Processing POST request - creating signal');
      
      try {
        // Extract data with basic validation
        let signalData;
        if (typeof req.body === 'string') {
          try {
            signalData = JSON.parse(req.body);
          } catch (e) {
            return res.status(400).json({
              success: false,
              message: 'Invalid JSON in request body'
            });
          }
        } else {
          signalData = req.body;
        }
        
        // Validate minimal required fields
        if (!signalData || !signalData.title) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields (title is required)'
          });
        }
        
        // Add timestamp field
        const enhancedData = {
          ...signalData,
          dateAdded: new Date().toISOString()
        };
        
        // Save to Firestore without any complex processing
        console.log('Adding signal to Firestore:', enhancedData);
        const docRef = await signalsCollection.add(enhancedData);
        
        return res.status(201).json({
          success: true,
          message: 'Signal created successfully (debug mode)',
          data: {
            id: docRef.id,
            ...enhancedData
          }
        });
      } catch (error) {
        console.error('Error in POST operation:', error);
        return res.status(500).json({
          success: false, 
          message: 'Error creating signal',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // If we get here, the method is not supported
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} is not supported`,
      supportedMethods: ['GET', 'POST', 'OPTIONS']
    });
    
  } catch (initError) {
    // Handle any initialization errors
    console.error('API initialization error:', initError);
    return res.status(500).json({
      success: false,
      message: 'Server configuration error',
      error: initError instanceof Error ? initError.message : String(initError)
    });
  }
}