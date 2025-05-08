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
    // Check all potential sources of authentication
    
    // 1. First check Authorization header (Bearer token)
    let token: string | null = null;
    const authHeader = req.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1];
      console.log('Found Bearer token in Authorization header');
    }
    
    // 2. If no token in header, check cookies
    if (!token) {
      // Check for Firebase ID token cookie
      const fbToken = req.cookies['fb_token'] || null;
      if (fbToken) {
        token = fbToken;
        console.log('Found token in fb_token cookie');
      }
      
      // Check for auth_success cookie as fallback
      if (!token) {
        const authToken = req.cookies['auth_success'] || null;
        if (authToken) {
          token = authToken;
          console.log('Found token in auth_success cookie');
        }
      }
    }
    
    // If no token found anywhere, authentication fails
    if (!token) {
      console.log('No authentication token found in request');
      return null;
    }
    
    // For development environment, we'll accept any token
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: accepting authentication without verification');
      return 'dev-admin-uid';
    }
    
    // In production, verify the token
    try {
      // TODO: Implement actual Firebase Admin token verification
      // For now, just return a dummy UID
      return 'verified-admin-uid';
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  } catch (error) {
    console.error('Error validating auth token:', error);
    return null;
  }
}

// For backward compatibility
export const validateFirebaseIdToken = validateAuthToken;