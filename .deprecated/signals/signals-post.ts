/**
 * Special signal posting endpoint that directly posts to Firestore
 * without any middleware interception
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';
import { validateFirebaseIdToken } from '@/lib/api/server-auth';

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
  console.log('SIGNALS-POST API CALLED:', req.method, req.url);
  console.log('Referer:', req.headers.referer);
  console.log('Origin:', req.headers.origin);
  console.log('Host:', req.headers.host);
  
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // For all non-OPTIONS responses, set content type
  res.setHeader('Content-Type', 'application/json');
  
  // Log request details for debugging
  console.log('Request method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Auth header present:', !!req.headers.authorization);
  
  // Log request body for debugging
  if (req.body) {
    try {
      console.log('Request body:', 
        typeof req.body === 'string' ? req.body.substring(0, 200) : JSON.stringify(req.body).substring(0, 200)
      );
    } catch (e) {
      console.error('Error logging request body:', e);
    }
  }
  
  try {
    // This endpoint only handles POST requests to create signals
    if (req.method === 'POST') {
      // Authenticate user
      const userId = await validateFirebaseIdToken(req);
      console.log('User auth result:', userId ? 'Authenticated' : 'Not authenticated');
      
      // Extract signal data
      let signalData;
      if (typeof req.body === 'string') {
        try {
          signalData = JSON.parse(req.body);
          console.log('Successfully parsed string body to JSON');
        } catch (e) {
          console.error('Error parsing JSON body:', e);
          return res.status(400).json({ success: false, error: 'Invalid JSON in request body' });
        }
      } else if (req.body && typeof req.body === 'object') {
        console.log('Request body is already an object, using directly');
        signalData = req.body;
      } else {
        console.error('Invalid or missing request body');
        return res.status(400).json({ success: false, error: 'Missing or invalid request body' });
      }
      
      // Validate required fields
      if (!signalData.title || !signalData.description || !signalData.url) {
        console.error('Missing required fields');
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields (title, description, and url are required)',
          receivedData: signalData
        });
      }
      
      // Add required fields
      const enhancedSignalData = {
        ...signalData,
        dateAdded: new Date().toISOString()
      };
      
      // Save to Firebase directly - even if user is not authenticated, create the signal
      // for development purposes
      console.log('Adding signal to Firestore...');
      const docRef = await firestore.collection('signals').add(enhancedSignalData);
      console.log('Signal added with ID:', docRef.id);
      
      return res.status(201).json({
        success: true,
        message: 'Signal created successfully (DIRECT POST)',
        id: docRef.id,
        signal: {
          id: docRef.id,
          ...enhancedSignalData
        }
      });
    }
    
    // If we reach here, it's a method we don't support
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} not allowed`,
      message: 'This endpoint only supports POST requests for adding signals',
      allowedMethods: ['POST', 'OPTIONS']
    });
  } catch (error) {
    console.error('Error in signals-post API:', error);
    
    // For debugging purposes, log additional details
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    
    // Return an error status code but with helpful information
    return res.status(500).json({
      success: false,
      message: 'Error processing signals request',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      requestMethod: req.method
    });
  }
}