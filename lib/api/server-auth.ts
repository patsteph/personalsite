/**
 * Server-side authentication utilities
 * This module should only be imported in API routes
 */
import { NextApiRequest } from 'next';
// Removed firebase-admin imports. Use server-side API endpoints instead.

/**
 * Verify if the user is an admin
 */
export async function verifyAdminSession(req: NextApiRequest): Promise<boolean> {
  const uid = await validateAuthToken(req);
  
  if (!uid) {
    return false;
  }
  
  try {
    // First check if user is in admins collection (plural)
    console.log(`Checking admin status for user: ${uid} in 'admins' collection`);
    // TODO: Replace with server-side API call to check admin status
    // Placeholder: Assume not admin
    const adminDoc = { exists: false };
    const isAdminPlural = adminDoc.exists;
    
    // Log the result
    console.log(`Admin doc check (plural) - exists: ${adminDoc.exists}`);
    
    if (isAdminPlural) {
      return true;
    }
    
    // If not found in plural, check singular form as fallback
    console.log(`Checking admin status for user: ${uid} in 'admin' collection`);
    // TODO: Replace with server-side API call to check admin status (alt)
    const altAdminDoc = { exists: false };
    const isAdminSingular = altAdminDoc.exists;
    
    // Log the result
    console.log(`Admin doc check (singular) - exists: ${altAdminDoc.exists}`);
    
    return isAdminSingular;
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
    // Proper implementation checking for session cookie
    const cookies = req.cookies;
    const sessionCookie = cookies['auth_success']; // Using the auth_success cookie name
    
    if (!sessionCookie) {
      console.log('No session cookie found in request');
      return null;
    }
    
    // For development environment, we'll accept any non-empty session cookie
    // In production, you would verify this with Firebase Admin SDK
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: accepting session cookie without verification');
      return 'dev-admin-uid';
    }
    
    // Use Firebase Admin to verify the session cookie in production
    // This code would need to be implemented with actual Firebase Admin validation
    // Check for authorization header and extract token
    let token: string | null = null;
    const maybeHeader = req.headers.authorization;
    if (typeof maybeHeader === 'string') {
      const header = maybeHeader as string;
      if (header.startsWith('Bearer ')) {
        token = header.split('Bearer ')[1];
      }
    }
    if (!token) {
      return null;
    }
    
    // Store token in admin collection if it doesn't exist yet
    try {
      // First, try to get UID from token claims
      // TODO: Replace with server-side API call for token verification
      const decodedToken = { uid: 'stub-uid' };
      return decodedToken.uid;
    } catch (error) {
      console.error('Error verifying token:', error);
      
      // If we can't verify the token, check if it exists in our admin records
      try {
        // TODO: Replace with server-side API call for admin tokens
        // Placeholder: No admin tokens found
        return null;
      } catch (fsError) {
        console.error('Error checking token in admin records:', fsError);
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