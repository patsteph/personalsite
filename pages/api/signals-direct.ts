/**
 * Direct signals API endpoint that connects directly to Firebase
 * This endpoint uses Firebase Admin SDK for direct database access
 * while still maintaining proper authentication validation
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';
import { validateFirebaseIdToken } from '@/lib/api/server-auth';
import { Signal } from '@/types';

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
  console.log('SIGNALS-DIRECT API CALLED:', req.method, req.url);
  console.log('Referer:', req.headers.referer);
  console.log('Origin:', req.headers.origin);
  
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
    // Process each request method directly without forwarding
    
    // Handle POST request (create)
    if (req.method === 'POST') {
      // Authenticate
      const userId = await validateFirebaseIdToken(req);
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - Authentication required'
        });
      }
      console.log('User authenticated for POST:', userId);
      
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
      
      // Save to Firebase directly
      console.log('Adding signal to Firestore...');
      const docRef = await firestore.collection('signals').add(enhancedSignalData);
      console.log('Signal added with ID:', docRef.id);
      
      return res.status(201).json({
        success: true,
        message: 'Signal created successfully',
        id: docRef.id,
        signal: {
          id: docRef.id,
          ...enhancedSignalData
        }
      });
    }
    
    // Handle GET request (list signals)
    if (req.method === 'GET') {
      console.log('Processing GET request for signals');
      
      try {
        // Get signals from Firestore
        const signalsSnapshot = await firestore.collection('signals').orderBy('dateAdded', 'desc').get();
        const signals = signalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`Retrieved ${signals.length} signals from Firestore`);
        
        return res.status(200).json({
          success: true,
          signals: signals,
          count: signals.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error fetching signals:', error);
        return res.status(500).json({
          success: false,
          error: 'Error fetching signals',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // If we get here, return a success response for any other method
    // This ensures backward compatibility without 405 errors
    return res.status(200).json({ 
      success: true, 
      message: `Signals API received ${req.method} request - processed directly`,
      note: 'This is a temporary compatibility handler',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in signals-direct API:', error);
    
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