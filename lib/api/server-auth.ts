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
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('No valid Authorization header found');
      return null;
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      console.warn('No token found in Authorization header');
      return null;
    }

    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error validating Firebase ID token:', error);
    return null;
  }
}