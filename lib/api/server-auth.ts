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
    
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return null;
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      return null;
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return null;
    }
    
    try {
      // Verify the token
      const decodedToken = await adminAuth.verifyIdToken(token);
      return decodedToken.uid;
    } catch (verifyError) {
      return null;
    }
  } catch (error) {
    console.error('Error validating Firebase ID token:', error);
    return null;
  }
}