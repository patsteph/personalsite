/**
 * Special direct posting endpoint with no authentication and maximum debugging
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { firebaseAdmin } from '@/lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('TEST-SIGNAL-DIRECT-POST called with method:', req.method);
  
  try {
    // First, check if Firebase is initialized
    if (!firebaseAdmin.apps.length) {
      console.error('Firebase admin not initialized');
      return res.status(500).json({
        success: false,
        error: 'Firebase admin not initialized',
        environment: {
          projectId: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Not set',
          privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Not set',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Not set'
        }
      });
    }
    
    // Check Firestore
    const firestore = firebaseAdmin.firestore();
    console.log('Firestore accessed successfully');
    
    // For POST request, add a test document
    if (req.method === 'POST') {
      try {
        console.log('Handling POST request');
        
        // Create a test signal
        const testSignal = {
          title: 'Test Signal',
          description: 'This is a test signal created directly',
          type: 'newsletter',
          dateAdded: new Date().toISOString()
        };
        
        // Add to collection
        const docRef = await firestore.collection('signals').add(testSignal);
        console.log('Test document added with ID:', docRef.id);
        
        return res.status(201).json({
          success: true,
          message: 'Test signal created successfully',
          id: docRef.id,
          signal: {
            id: docRef.id,
            ...testSignal
          }
        });
      } catch (postError) {
        console.error('Error in POST operation:', postError);
        return res.status(500).json({
          success: false,
          error: 'Error in POST operation',
          details: postError instanceof Error ? postError.message : String(postError)
        });
      }
    }
    
    // For GET request, just return a success with environment details
    return res.status(200).json({
      success: true,
      message: 'Test endpoint accessible',
      firebaseInitialized: true,
      method: req.method,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        projectId: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Not set'
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}