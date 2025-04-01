/**
 * Authentication debugging endpoint
 * This endpoint is for debugging authentication issues
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { firebaseAdmin } from '@/lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('AUTH DEBUG API:', req.method, req.url);
  console.log('Request headers:', JSON.stringify(req.headers));
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return res.status(200).end();
  }
  
  try {
    // Check if Firebase Admin is initialized
    const adminInitialized = !!firebaseAdmin.apps.length;
    console.log('Firebase Admin initialized:', adminInitialized);
    
    // Check environment variables (don't log values, just presence)
    const envVars = {
      PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
    };
    console.log('Environment variables present:', envVars);
    
    // Get auth token from header if present
    let token = null;
    let decodedToken = null;
    let tokenError = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1];
      console.log('Token found in Authorization header');
      
      try {
        // Try to verify the token
        decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
        console.log('Token verified successfully');
      } catch (error) {
        console.error('Token verification failed:', error);
        tokenError = error instanceof Error ? error.message : String(error);
      }
    } else {
      console.log('No Authorization header or Bearer token found');
    }
    
    // Return diagnostic information
    return res.status(200).json({
      success: true,
      adminInitialized,
      envVars,
      tokenFound: !!token,
      tokenVerified: !!decodedToken,
      tokenError,
      uid: decodedToken?.uid || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in auth-debug endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}