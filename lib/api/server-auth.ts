/**
 * Server-side authentication utilities
 * This module should only be imported in API routes
 */
import { NextApiRequest } from 'next';
import { auth as adminAuth } from '../firebase-admin';

/**
 * Validate Firebase ID token from API request
 */
export async function validateFirebaseIdToken(req: NextApiRequest): Promise<string | null> {
  try {
    // Check if Firebase admin is initialized
    if (!adminAuth) {
      console.error('Firebase Admin Auth is not initialized');
      return null;
    }

    // Log headers for debugging
    console.log('Request headers:', JSON.stringify(req.headers));
    
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.warn('No Authorization header found');
      return null;
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.warn('Authorization header does not start with Bearer');
      return null;
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      console.warn('No token found in Authorization header');
      return null;
    }

    console.log('Token found, verifying...');
    
    try {
      // Verify the token
      const decodedToken = await adminAuth.verifyIdToken(token);
      console.log('Token verified successfully for user:', decodedToken.uid);
      return decodedToken.uid;
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return null;
    }
  } catch (error) {
    console.error('Error validating Firebase ID token:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    return null;
  }
}