/**
 * Simplified signals proxy that doesn't rely on local imports
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });
    console.log("Firebase Admin initialized successfully in signals-simple");
  } catch (error) {
    console.error("Firebase admin initialization error in signals-simple", error);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log request details
  console.log('SIGNALS SIMPLE API:', req.method, req.url);
  console.log('Request headers:', JSON.stringify(req.headers));
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Set content type header for all non-OPTIONS responses
  if (req.method !== 'OPTIONS') {
    res.setHeader('Content-Type', 'application/json');
  }
  
  // Handle OPTIONS request (CORS preflight)
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  // Handle POST request
  if (req.method === 'POST') {
    try {
      console.log('Handling POST request');
      
      // Get request body
      let requestBody = req.body;
      console.log('Request body:', typeof requestBody === 'string' ? 'String body' : requestBody);
      
      // Parse body if it's a string
      if (typeof requestBody === 'string') {
        try {
          requestBody = JSON.parse(requestBody);
        } catch (parseError) {
          console.error('Error parsing request body as JSON:', parseError);
        }
      }
      
      // Verify Firebase token
      let userId = null;
      try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split('Bearer ')[1];
          const decodedToken = await admin.auth().verifyIdToken(token);
          userId = decodedToken.uid;
          console.log('User authenticated:', userId);
        } else {
          console.warn('Missing or invalid authorization header');
        }
      } catch (authError) {
        console.error('Authentication error:', authError);
      }
      
      // Generate a fake ID for created signals
      const fakeId = `signal_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Return a success response regardless of auth status (for testing)
      return res.status(200).json({
        success: true,
        message: 'POST request received successfully',
        authenticated: !!userId,
        userId: userId || 'anonymous', 
        timestamp: new Date().toISOString(),
        // Echo back the request body
        requestBody,
        // For signal creation, return an ID
        signal: {
          id: fakeId,
          ...requestBody
        }
      });
    } catch (error) {
      console.error('Error handling POST request:', error);
      return res.status(500).json({
        error: 'Error processing request',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Handle GET request
  if (req.method === 'GET') {
    try {
      console.log('Handling GET request');
      
      // Return a simple success response
      return res.status(200).json({
        success: true,
        message: 'GET request received successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error handling GET request:', error);
      return res.status(500).json({
        error: 'Error processing request',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Handle other methods
  console.error(`Unsupported HTTP method: ${req.method}`);
  return res.status(405).json({
    error: `Method ${req.method} not allowed`,
    message: 'This API supports GET, POST, and OPTIONS methods',
    requestPath: req.url
  });
}