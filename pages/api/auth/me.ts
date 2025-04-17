import type { NextApiRequest, NextApiResponse } from 'next';
// Removed adminAuth and Firestore import. Use server-side API or remove logic.
import { validateAuthToken } from '@/lib/api/server-auth';

type MeResponse = {
  success: boolean;
  user?: {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    isAdmin?: boolean;
  };
  error?: string;
  debug?: any;
}

/**
 * Get current authenticated user
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MeResponse>
) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided',
        debug: { authHeader }
      });
    }
    
    try {
      // Try to decode the token without verification first for debugging
      let debugInfo: Record<string, any> = { tokenExists: !!token, tokenLength: token.length };
      
      // Validate the token and get user ID
      const uid = await validateAuthToken(req);
      
      if (!uid) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid token',
          debug: { ...debugInfo, uid, token: token.substring(0, 10) + '...' }
        });
      }
      
      // TODO: Replace with server-side API call to fetch user info
      // Stubbed user info for now
      const userRecord = {
        uid,
        email: '',
        displayName: undefined,
        photoURL: undefined,
      };
      debugInfo = { ...debugInfo, uid, email: userRecord.email };
      
      // TODO: Replace with server-side API call to check admin status
      // Stubbed admin status for now
      const isAdmin = false;
      debugInfo = { ...debugInfo, isAdmin };
      
      // Return user info with admin status
      return res.status(200).json({
        success: true,
        user: {
          uid: userRecord.uid,
          email: userRecord.email || '',
          displayName: userRecord.displayName || undefined,
          photoURL: userRecord.photoURL || undefined,
          isAdmin
        },
        debug: debugInfo
      });
    } catch (error: any) {
      console.error('Get current user error:', error);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token or user not found',
        debug: { error: error.message, stack: error.stack }
      });
    }
  } catch (error: any) {
    console.error('Get current user error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error getting user info',
      debug: { error: error.message }
    });
  }
}