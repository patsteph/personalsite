/**
 * Server-side authentication utilities
 * This module should only be imported in API routes
 */
import { NextApiRequest } from 'next';
import { auth as adminAuth } from '../firebase-admin';
import { firestore } from '../firebase-admin';

/**
 * Verify if the user is an admin
 */
export async function verifyAdminSession(req: NextApiRequest): Promise<boolean> {
  const uid = await validateAuthToken(req);
  
  if (!uid) {
    return false;
  }
  
  try {
    // Check if user is in admins collection
    const adminDoc = await firestore.collection('admins').doc(uid).get();
    return adminDoc.exists;
  } catch (error) {
    console.error('Error verifying admin status:', error);
    return false;
  }
}

/**
 * Validate auth token from API request
 * Works with Firebase ID tokens
 */
export async function validateAuthToken(req: NextApiRequest): Promise<string | null> {
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
    
    // Store token in admin collection if it doesn't exist yet
    try {
      // First, try to get UID from token claims
      const decodedToken = await adminAuth.verifyIdToken(token);
      return decodedToken.uid;
    } catch (error) {
      console.error('Error verifying token:', error);
      
      // If we can't verify the token, check if it exists in our admin records
      try {
        // Look for this token in admin collection
        const adminTokensSnapshot = await firestore.collection('admin_tokens').where('token', '==', token).get();
        if (!adminTokensSnapshot.empty) {
          const tokenDoc = adminTokensSnapshot.docs[0];
          const userId = tokenDoc.data().userId;
          // Check if token is expired
          const expires = tokenDoc.data().expires;
          if (expires && expires.toDate() < new Date()) {
            // Token is expired, remove it
            await tokenDoc.ref.delete();
            return null;
          }
          // Valid token found
          return userId;
        }
      } catch (fsError) {
        console.error('Error checking token in Firestore:', fsError);
      }
      
      return null;
    }
  } catch (error) {
    console.error('Error validating auth token:', error);
    return null;
  }
}

// For backward compatibility
export const validateFirebaseIdToken = validateAuthToken;